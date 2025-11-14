import type { NextApiRequest, NextApiResponse } from 'next';
import { getDatabase, getMessaging, saveNotificationHistory } from '@/lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { userId, title, body, data } = req.body;

    if (!title || !body) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: title, body'
      });
    }

    const db = getDatabase();
    const messaging = getMessaging();

    // If userId is provided, send to one user. Otherwise, send to all
    if (userId) {
      console.log(`📤 Sending custom notification to user: ${userId}`);

      // Lấy FCM token
      const userSnapshot = await db.ref(`users/${userId}`).once('value');
      const user = userSnapshot.val();

      if (!user || !user.fcmToken) {
        return res.json({
          success: false,
          message: 'User or FCM token not found'
        });
      }

      // Gửi notification
      const message = {
        token: user.fcmToken,
        notification: {
          title: title,
          body: body
        },
        data: data || { timestamp: Date.now().toString(), type: 'custom' }
      };

      const response = await messaging.send(message);

      // Save notification history
      await saveNotificationHistory({
        type: 'custom',
        title,
        body,
        data: data || {},
        sentTo: [userId],
        sentCount: 1,
        failureCount: 0,
        status: 'success'
      });

      res.json({
        success: true,
        message: 'Custom notification sent successfully',
        messageId: response,
        recipient: userId
      });
    } else {
      // Send to all users
      console.log('📤 Sending custom notification to all users');

      // Lấy danh sách FCM tokens
      const usersSnapshot = await db.ref('users').once('value');
      const users = usersSnapshot.val();

      if (!users) {
        return res.json({
          success: true,
          message: 'No users found in database',
          sentCount: 0
        });
      }

      // Lọc ra các FCM tokens hợp lệ
      const tokens: string[] = [];
      Object.keys(users).forEach(uid => {
        if (users[uid].fcmToken) {
          tokens.push(users[uid].fcmToken);
        }
      });

      if (tokens.length === 0) {
        return res.json({
          success: true,
          message: 'No valid FCM tokens found',
          sentCount: 0
        });
      }

      // Tạo notification message
      const message = {
        notification: {
          title: title,
          body: body
        },
        data: data || { timestamp: Date.now().toString(), type: 'custom' }
      };

      // Gửi notification đến nhiều thiết bị
      const response = await messaging.sendEachForMulticast({
        tokens: tokens,
        ...message
      });

      console.log(`✅ Sent ${response.successCount}/${tokens.length} custom notifications`);

      // Save notification history
      await saveNotificationHistory({
        type: 'broadcast',
        title,
        body,
        data: data || {},
        sentTo: 'all',
        sentCount: response.successCount,
        failureCount: response.failureCount,
        status: response.failureCount === 0 ? 'success' : (response.successCount > 0 ? 'partial' : 'failed')
      });

      res.json({
        success: true,
        message: 'Custom notification sent successfully',
        sentCount: response.successCount,
        failureCount: response.failureCount,
        totalTokens: tokens.length
      });
    }

  } catch (error: any) {
    console.error('❌ Error sending custom notification:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: error.code
    });
  }
}
