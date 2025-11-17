import type { NextApiRequest, NextApiResponse } from 'next';
import { getDatabase } from '@/lib/firebaseAdmin';

/**
 * API để lấy lịch sử recommendations đã tạo
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { userId, limit = 100 } = req.query;

    const db = getDatabase();

    let recommendationsData: any[] = [];

    if (userId) {
      // Lấy recommendations cho 1 user cụ thể
      const snapshot = await db.ref(`recommendations/${userId}`).once('value');
      if (snapshot.exists()) {
        recommendationsData.push({
          userId,
          ...snapshot.val()
        });
      }
    } else {
      // Lấy tất cả recommendations
      const snapshot = await db.ref('recommendations').once('value');
      snapshot.forEach((child) => {
        recommendationsData.push({
          userId: child.key,
          ...child.val()
        });
      });
    }

    // Sort by generatedAt (mới nhất trước)
    recommendationsData.sort((a, b) => (b.generatedAt || 0) - (a.generatedAt || 0));

    // Giới hạn số lượng
    recommendationsData = recommendationsData.slice(0, parseInt(limit as string));

    // Lấy thông tin users
    const usersMap = new Map();
    for (const rec of recommendationsData) {
      if (!usersMap.has(rec.userId)) {
        const userSnapshot = await db.ref(`users/${rec.userId}`).once('value');
        if (userSnapshot.exists()) {
          usersMap.set(rec.userId, userSnapshot.val());
        }
      }
    }

    // Lấy thông tin health tips
    const tipsMap = new Map();
    for (const rec of recommendationsData) {
      if (rec.recommendations && Array.isArray(rec.recommendations)) {
        for (const item of rec.recommendations) {
          if (!tipsMap.has(item.healthTipId)) {
            const tipSnapshot = await db.ref(`health_tips/${item.healthTipId}`).once('value');
            if (tipSnapshot.exists()) {
              tipsMap.set(item.healthTipId, tipSnapshot.val());
            }
          }
        }
      }
    }

    // Format response
    const formattedData = recommendationsData.map(rec => {
      const user = usersMap.get(rec.userId);
      const recommendationsWithTitles = (rec.recommendations || []).map((item: any) => {
        const tip = tipsMap.get(item.healthTipId);
        return {
          ...item,
          title: tip?.title || 'Unknown',
          categoryName: tip?.categoryName
        };
      });

      return {
        userId: rec.userId,
        userEmail: user?.email,
        username: user?.username,
        recommendations: recommendationsWithTitles,
        recommendationsCount: recommendationsWithTitles.length,
        generatedAt: rec.generatedAt,
        expiresAt: rec.expiresAt,
        isExpired: rec.expiresAt ? rec.expiresAt < Date.now() : false
      };
    });

    // Lấy batch logs
    const batchLogsSnapshot = await db.ref('recommendation_batch_logs')
      .orderByChild('timestamp')
      .limitToLast(50)
      .once('value');

    const batchLogs: any[] = [];
    batchLogsSnapshot.forEach((child) => {
      batchLogs.push({
        id: child.key,
        ...child.val()
      });
    });

    batchLogs.reverse(); // Mới nhất trước

    res.json({
      success: true,
      recommendations: formattedData,
      total: formattedData.length,
      batchLogs: batchLogs
    });

  } catch (error: any) {
    console.error('❌ Error fetching recommendations history:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: error.code
    });
  }
}
