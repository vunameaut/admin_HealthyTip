import type { NextApiRequest, NextApiResponse } from 'next';
import { getDatabase, getMessaging } from '@/lib/firebaseAdmin';

/**
 * API endpoint để gửi thông báo tới user khi admin reply
 * POST /api/notifications/send-to-user
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, title, body, data } = req.body;

    // Validate required fields
    if (!userId || !title || !body) {
      return res.status(400).json({ 
        error: 'Missing required fields: userId, title, body' 
      });
    }

    // Get Firebase Admin Database and Messaging
    const db = getDatabase();

    // 1. Save notification to user_notifications in Firebase
    const userNotificationsRef = db.ref(`user_notifications/${userId}`);
    const notification = {
      type: data?.type || 'ADMIN_REPLY',
      reportId: data?.reportId || '',
      title,
      body,
      read: false,
      createdAt: Date.now(),
    };

    await userNotificationsRef.push(notification);
    console.log(`[API] User notification saved for user: ${userId}`);

    // 2. Try to send FCM push notification
    try {
      // Get user's FCM token from database
      const userRef = db.ref(`users/${userId}/fcmToken`);
      const tokenSnapshot = await userRef.once('value');
      const fcmToken = tokenSnapshot.val();

      if (fcmToken) {
        const messaging = getMessaging();
        
        // Data-only message để app xử lý notification hoàn toàn
        // Điều này đảm bảo click notification sẽ mở đúng activity
        const message = {
          data: {
            type: data?.type || 'ADMIN_REPLY',
            reportId: data?.reportId || '',
            title: title,
            body: body,
            click_action: 'OPEN_REPORT_CHAT',
          },
          token: fcmToken,
          android: {
            priority: 'high' as const,
          },
        };

        await messaging.send(message);
        console.log(`[API] FCM push sent to user: ${userId}`);

        return res.status(200).json({
          success: true,
          message: 'Notification sent successfully',
          pushSent: true,
        });
      } else {
        console.log(`[API] No FCM token found for user: ${userId}`);
        return res.status(200).json({
          success: true,
          message: 'Notification saved, but no FCM token found',
          pushSent: false,
        });
      }
    } catch (fcmError: any) {
      console.error('[API] FCM send error:', fcmError);
      // Still return success because notification was saved
      return res.status(200).json({
        success: true,
        message: 'Notification saved, FCM send failed',
        pushSent: false,
        fcmError: fcmError.message,
      });
    }

  } catch (error: any) {
    console.error('[API] Error sending user notification:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message,
    });
  }
}
