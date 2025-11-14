import type { NextApiRequest, NextApiResponse } from 'next';
import { getDatabase, getMessaging, saveNotificationHistory } from '@/lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { healthTipId, excludeUserIds } = req.body;

    // Validate input
    if (!healthTipId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: healthTipId'
      });
    }

    const excludeList = excludeUserIds || [];

    const db = getDatabase();
    const messaging = getMessaging();

    // Lấy thông tin bài viết từ database
    const healthTipSnapshot = await db.ref(`health_tips/${healthTipId}`).once('value');
    const healthTip = healthTipSnapshot.val();

    if (!healthTip) {
      return res.status(404).json({
        success: false,
        error: 'Health tip not found'
      });
    }

    const title = healthTip.title || 'Bài viết mới';
    const authorId = healthTip.authorId;
    const category = healthTip.categoryId || '';

    console.log(`📤 Sending notification for new health tip: ${title}`);

    // Lấy danh sách FCM tokens từ Firebase
    const usersSnapshot = await db.ref('users').once('value');
    const users = usersSnapshot.val();

    if (!users) {
      return res.json({
        success: true,
        message: 'No users found in database',
        sentCount: 0
      });
    }

    // Lọc ra các FCM tokens hợp lệ (trừ author và excluded users)
    const tokens: string[] = [];
    const userIds: string[] = [];

    Object.keys(users).forEach(userId => {
      if (userId !== authorId && !excludeList.includes(userId) && users[userId].fcmToken) {
        tokens.push(users[userId].fcmToken);
        userIds.push(userId);
      }
    });

    if (tokens.length === 0) {
      return res.json({
        success: true,
        message: 'No valid FCM tokens found',
        sentCount: 0,
        totalUsers: Object.keys(users).length
      });
    }

    // Tạo notification message
    const message = {
      notification: {
        title: '🌟 Mẹo Sức Khỏe Mới',
        body: title
      },
      data: {
        type: 'new_health_tip',
        healthTipId: healthTipId,
        category: category || '',
        timestamp: Date.now().toString()
      }
    };

    // Gửi notification đến nhiều thiết bị
    const response = await messaging.sendEachForMulticast({
      tokens: tokens,
      ...message
    });

    console.log(`✅ Sent ${response.successCount}/${tokens.length} notifications`);

    // Log failed tokens
    const failedTokens: any[] = [];
    if (response.failureCount > 0) {
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push({
            token: tokens[idx],
            userId: userIds[idx],
            error: resp.error?.code || 'unknown'
          });
          console.error(`❌ Failed to send to user ${userIds[idx]}: ${resp.error?.code}`);
        }
      });
    }

    // Save notification history
    await saveNotificationHistory({
      type: 'new_health_tip',
      title: '🌟 Mẹo Sức Khỏe Mới',
      body: title,
      data: {
        healthTipId,
        category: category || '',
      },
      sentTo: 'all',
      sentCount: response.successCount,
      failureCount: response.failureCount,
      status: response.failureCount === 0 ? 'success' : (response.successCount > 0 ? 'partial' : 'failed')
    });

    res.json({
      success: true,
      message: 'Notifications sent successfully',
      sentCount: response.successCount,
      failureCount: response.failureCount,
      totalTokens: tokens.length,
      failedTokens: failedTokens.length > 0 ? failedTokens : undefined
    });

  } catch (error: any) {
    console.error('❌ Error sending notification:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: error.code
    });
  }
}
