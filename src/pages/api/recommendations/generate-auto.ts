import type { NextApiRequest, NextApiResponse } from 'next';
import { getDatabase, getMessaging, saveNotificationHistory } from '@/lib/firebaseAdmin';

interface RecommendationScore {
  healthTipId: string;
  score: number;
  reasons: string[];
}

interface UserPreferences {
  favoriteCategories: string[];
  viewedTips: string[];
  searchKeywords: string[];
}

/**
 * API endpoint để tự động tạo và gửi recommendations cho người dùng
 * Dựa trên:
 * - Analytics data (lịch sử xem, tìm kiếm)
 * - User preferences (categories yêu thích)
 * - Trending content (most viewed)
 * - Similar users' behavior (collaborative filtering)
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const {
      userId,
      limit = 5,
      sendNotification = false,
      algorithm = 'hybrid' // 'content', 'collaborative', 'trending', 'hybrid'
    } = req.body;

    console.log(`🤖 Generating recommendations for user: ${userId}, algorithm: ${algorithm}`);

    const db = getDatabase();

    // 1. Lấy thông tin user
    const userSnapshot = await db.ref(`users/${userId}`).once('value');
    const user = userSnapshot.val();

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // 2. Lấy user preferences từ analytics
    const userPreferences = await getUserPreferences(db, userId);

    // 3. Lấy tất cả health tips
    const tipsSnapshot = await db.ref('health_tips').once('value');
    const allTips: any[] = [];
    tipsSnapshot.forEach((child) => {
      allTips.push({
        id: child.key,
        ...child.val()
      });
    });

    // 4. Lấy analytics events
    const analyticsSnapshot = await db.ref('analytics')
      .orderByChild('timestamp')
      .limitToLast(1000)
      .once('value');

    const analyticsEvents: any[] = [];
    analyticsSnapshot.forEach((child) => {
      analyticsEvents.push(child.val());
    });

    // 5. Generate recommendations dựa trên algorithm
    console.log(`📊 Stats: ${allTips.length} tips, ${analyticsEvents.length} analytics events`);
    console.log(`👤 User preferences:`, {
      favoriteCategories: userPreferences.favoriteCategories,
      viewedTipsCount: userPreferences.viewedTips.length,
      searchKeywordsCount: userPreferences.searchKeywords.length
    });

    let recommendations: RecommendationScore[] = [];

    switch (algorithm) {
      case 'content':
        recommendations = await contentBasedRecommendations(allTips, userPreferences);
        console.log(`📝 Content-based: ${recommendations.length} recommendations`);
        break;
      case 'collaborative':
        recommendations = await collaborativeRecommendations(allTips, userId, analyticsEvents);
        console.log(`👥 Collaborative: ${recommendations.length} recommendations`);
        break;
      case 'trending':
        recommendations = await trendingRecommendations(allTips, analyticsEvents);
        console.log(`🔥 Trending: ${recommendations.length} recommendations`);
        break;
      case 'hybrid':
      default:
        recommendations = await hybridRecommendations(allTips, userId, userPreferences, analyticsEvents);
        console.log(`🌟 Hybrid: ${recommendations.length} recommendations`);
        break;
    }

    // 6. Nếu không có recommendations, dùng fallback (random tips)
    if (recommendations.length === 0) {
      console.log('⚠️ No recommendations found, using fallback strategy');
      recommendations = allTips
        .filter(tip => !userPreferences.viewedTips.includes(tip.id))
        .sort(() => Math.random() - 0.5) // Random shuffle
        .slice(0, limit)
        .map(tip => ({
          healthTipId: tip.id,
          score: Math.random() * 50, // Random score
          reasons: ['Đề xuất ngẫu nhiên - Có thể bạn sẽ thích']
        }));
    } else {
      // 7. Lọc bỏ những tips user đã xem
      recommendations = recommendations.filter(rec =>
        !userPreferences.viewedTips.includes(rec.healthTipId)
      );

      // 8. Giới hạn số lượng
      recommendations = recommendations.slice(0, limit);
    }

    console.log(`✅ Generated ${recommendations.length} recommendations for user ${userId}`);

    // 9. Gửi notification nếu được yêu cầu
    console.log(`📤 Notification settings: sendNotification=${sendNotification}, recommendations=${recommendations.length}, hasFcmToken=${!!user.fcmToken}`);
    if (sendNotification && recommendations.length > 0 && user.fcmToken) {
      console.log(`🔔 Sending notification to user ${userId}...`);
      await sendRecommendationNotifications(db, getMessaging(), user, recommendations, allTips);
    } else {
      console.log(`⏭️ Skipping notification: sendNotification=${sendNotification}, recommendations=${recommendations.length}, fcmToken=${user.fcmToken ? 'exists' : 'missing'}`);
    }

    // 10. Lưu recommendations vào database
    await saveRecommendations(db, userId, recommendations);

    res.json({
      success: true,
      userId,
      recommendations: recommendations.map(rec => {
        const tip = allTips.find(t => t.id === rec.healthTipId);
        return {
          healthTipId: rec.healthTipId,
          title: tip?.title || 'Unknown',
          score: rec.score,
          reasons: rec.reasons
        };
      }),
      algorithm,
      totalRecommendations: recommendations.length
    });

  } catch (error: any) {
    console.error('❌ Error generating recommendations:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: error.code
    });
  }
}

/**
 * Lấy user preferences từ analytics và favorites
 */
async function getUserPreferences(db: any, userId: string): Promise<UserPreferences> {
  const preferences: UserPreferences = {
    favoriteCategories: [],
    viewedTips: [],
    searchKeywords: []
  };

  // Lấy favorite tips
  const favoritesSnapshot = await db.ref(`favorites/${userId}`).once('value');
  const favorites: any[] = [];
  favoritesSnapshot.forEach((child: any) => {
    favorites.push(child.key);
  });

  // Lấy viewed tips từ analytics
  const analyticsSnapshot = await db.ref('analytics')
    .orderByChild('userId')
    .equalTo(userId)
    .once('value');

  const viewedTips = new Set<string>();
  const searchKeywords = new Set<string>();
  const categoryCount = new Map<string, number>();

  analyticsSnapshot.forEach((child: any) => {
    const event = child.val();

    if (event.type === 'view_health_tip' && event.data?.tipId) {
      viewedTips.add(event.data.tipId);

      // Count categories
      if (event.data.category) {
        categoryCount.set(event.data.category, (categoryCount.get(event.data.category) || 0) + 1);
      }
    }

    if (event.type === 'search' && event.data?.searchTerm) {
      searchKeywords.add(event.data.searchTerm.toLowerCase());
    }
  });

  preferences.viewedTips = Array.from(viewedTips);
  preferences.searchKeywords = Array.from(searchKeywords);

  // Top 3 favorite categories
  preferences.favoriteCategories = Array.from(categoryCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([category]) => category);

  return preferences;
}

/**
 * Content-based filtering: Đề xuất dựa trên categories user thích
 */
async function contentBasedRecommendations(
  allTips: any[],
  userPreferences: UserPreferences
): Promise<RecommendationScore[]> {
  const recommendations: RecommendationScore[] = [];

  for (const tip of allTips) {
    let score = 0;
    const reasons: string[] = [];

    // Kiểm tra category match
    if (tip.categoryName && userPreferences.favoriteCategories.includes(tip.categoryName)) {
      score += 50;
      reasons.push(`Thuộc danh mục yêu thích: ${tip.categoryName}`);
    }

    // Kiểm tra keyword match trong title/content
    for (const keyword of userPreferences.searchKeywords) {
      const titleMatch = tip.title?.toLowerCase().includes(keyword);
      const contentMatch = tip.content?.toLowerCase().includes(keyword);

      if (titleMatch || contentMatch) {
        score += 20;
        reasons.push(`Liên quan đến từ khóa: "${keyword}"`);
        break;
      }
    }

    if (score > 0) {
      recommendations.push({
        healthTipId: tip.id,
        score,
        reasons
      });
    }
  }

  return recommendations.sort((a, b) => b.score - a.score);
}

/**
 * Collaborative filtering: Đề xuất dựa trên hành vi của users tương tự
 */
async function collaborativeRecommendations(
  allTips: any[],
  userId: string,
  analyticsEvents: any[]
): Promise<RecommendationScore[]> {
  // Tìm users có hành vi tương tự
  const userViewedTips = new Set<string>();
  analyticsEvents
    .filter(e => e.userId === userId && e.type === 'view_health_tip')
    .forEach(e => userViewedTips.add(e.data?.tipId));

  // Tính similarity với các users khác
  const similarUsers: Map<string, number> = new Map();

  analyticsEvents
    .filter(e => e.userId !== userId && e.type === 'view_health_tip')
    .forEach(event => {
      const otherUserId = event.userId;
      const tipId = event.data?.tipId;

      if (userViewedTips.has(tipId)) {
        similarUsers.set(otherUserId, (similarUsers.get(otherUserId) || 0) + 1);
      }
    });

  // Lấy tips mà similar users đã xem nhưng current user chưa xem
  const recommendedTips = new Map<string, number>();

  for (const [similarUserId, similarity] of similarUsers.entries()) {
    analyticsEvents
      .filter(e => e.userId === similarUserId && e.type === 'view_health_tip')
      .forEach(event => {
        const tipId = event.data?.tipId;
        if (!userViewedTips.has(tipId)) {
          recommendedTips.set(tipId, (recommendedTips.get(tipId) || 0) + similarity);
        }
      });
  }

  return Array.from(recommendedTips.entries())
    .map(([healthTipId, score]) => ({
      healthTipId,
      score,
      reasons: ['Người dùng tương tự cũng quan tâm']
    }))
    .sort((a, b) => b.score - a.score);
}

/**
 * Trending recommendations: Đề xuất content hot nhất
 */
async function trendingRecommendations(
  allTips: any[],
  analyticsEvents: any[]
): Promise<RecommendationScore[]> {
  const viewCounts = new Map<string, number>();

  // Chỉ lấy events trong 7 ngày gần đây
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  analyticsEvents
    .filter(e => e.type === 'view_health_tip' && e.timestamp > sevenDaysAgo)
    .forEach(event => {
      const tipId = event.data?.tipId;
      if (tipId) {
        viewCounts.set(tipId, (viewCounts.get(tipId) || 0) + 1);
      }
    });

  return Array.from(viewCounts.entries())
    .map(([healthTipId, count]) => ({
      healthTipId,
      score: count,
      reasons: [`Trending - ${count} lượt xem trong 7 ngày qua`]
    }))
    .sort((a, b) => b.score - a.score);
}

/**
 * Hybrid: Kết hợp nhiều algorithms
 */
async function hybridRecommendations(
  allTips: any[],
  userId: string,
  userPreferences: UserPreferences,
  analyticsEvents: any[]
): Promise<RecommendationScore[]> {
  const [contentRecs, collaborativeRecs, trendingRecs] = await Promise.all([
    contentBasedRecommendations(allTips, userPreferences),
    collaborativeRecommendations(allTips, userId, analyticsEvents),
    trendingRecommendations(allTips, analyticsEvents)
  ]);

  // Merge và tính điểm trung bình có trọng số
  const mergedScores = new Map<string, { score: number; reasons: Set<string> }>();

  // Content-based: 40%
  for (const rec of contentRecs) {
    const current = mergedScores.get(rec.healthTipId) || { score: 0, reasons: new Set() };
    current.score += rec.score * 0.4;
    rec.reasons.forEach(r => current.reasons.add(r));
    mergedScores.set(rec.healthTipId, current);
  }

  // Collaborative: 35%
  for (const rec of collaborativeRecs) {
    const current = mergedScores.get(rec.healthTipId) || { score: 0, reasons: new Set() };
    current.score += rec.score * 0.35;
    rec.reasons.forEach(r => current.reasons.add(r));
    mergedScores.set(rec.healthTipId, current);
  }

  // Trending: 25%
  for (const rec of trendingRecs) {
    const current = mergedScores.get(rec.healthTipId) || { score: 0, reasons: new Set() };
    current.score += rec.score * 0.25;
    rec.reasons.forEach(r => current.reasons.add(r));
    mergedScores.set(rec.healthTipId, current);
  }

  return Array.from(mergedScores.entries())
    .map(([healthTipId, data]) => ({
      healthTipId,
      score: data.score,
      reasons: Array.from(data.reasons)
    }))
    .sort((a, b) => b.score - a.score);
}

/**
 * Gửi notification recommendations
 */
async function sendRecommendationNotifications(
  db: any,
  messaging: any,
  user: any,
  recommendations: RecommendationScore[],
  allTips: any[]
) {
  console.log(`📨 sendRecommendationNotifications called for user ${user.uid}`);

  if (!user.fcmToken || recommendations.length === 0) {
    console.log(`⚠️ Cannot send: fcmToken=${user.fcmToken ? 'exists' : 'missing'}, recommendations=${recommendations.length}`);
    return;
  }

  // Tạo danh sách tips với đầy đủ thông tin
  const tipsData = recommendations.map(rec => {
    const tip = allTips.find(t => t.id === rec.healthTipId);
    return {
      healthTipId: rec.healthTipId,
      title: tip?.title || 'Unknown',
      score: rec.score,
      reasons: rec.reasons
    };
  });

  console.log(`📋 Prepared ${tipsData.length} tips for notification`);

  // Tạo notification body
  const notificationBody = recommendations.length === 1
    ? tipsData[0].title
    : `Có ${recommendations.length} bài viết mới được đề xuất cho bạn`;

  const notificationTitle = '💡 Đề xuất dành cho bạn';

  // Chỉ gửi data-only message để onMessageReceived luôn được gọi
  // (Notification payload sẽ làm Firebase tự xử lý khi app background)
  const message = {
    token: user.fcmToken,
    data: {
      type: 'health_tip_recommendation',
      title: notificationTitle,
      body: notificationBody,
      tips: JSON.stringify(tipsData),
      tipsCount: recommendations.length.toString(),
      timestamp: Date.now().toString()
    }
  };

  console.log(`📤 Sending FCM message:`, {
    title: notificationTitle,
    body: notificationBody,
    type: 'health_tip_recommendation',
    tipsCount: recommendations.length
  });

  try {
    const response = await messaging.send(message);
    console.log(`✅ Recommendation notification sent to ${user.uid} (${recommendations.length} tips). MessageId: ${response}`);

    // Save to history
    await saveNotificationHistory({
      type: 'recommendation',
      title: '💡 Đề xuất dành cho bạn',
      body: notificationBody,
      data: {
        tips: tipsData,
        tipsCount: recommendations.length,
        algorithm: 'hybrid'
      },
      sentTo: [user.uid],
      sentCount: 1,
      failureCount: 0,
      status: 'success'
    });
  } catch (error: any) {
    console.error('❌ Error sending recommendation notification:', error);
    console.error('❌ Error details:', {
      message: error.message,
      code: error.code,
      details: error.details
    });
  }
}

/**
 * Lưu recommendations vào database
 */
async function saveRecommendations(
  db: any,
  userId: string,
  recommendations: RecommendationScore[]
) {
  const timestamp = Date.now();
  const recommendationsData = {
    userId,
    recommendations: recommendations.map(rec => ({
      healthTipId: rec.healthTipId,
      score: rec.score,
      reasons: rec.reasons
    })),
    generatedAt: timestamp,
    expiresAt: timestamp + 7 * 24 * 60 * 60 * 1000 // 7 days
  };

  await db.ref(`recommendations/${userId}`).set(recommendationsData);
}
