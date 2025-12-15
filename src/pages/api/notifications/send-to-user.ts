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

  console.log('[send-to-user] Request received:', JSON.stringify(req.body, null, 2));

  try {
    const { userId, title, body, data } = req.body;

    // Validate required fields
    if (!userId || !title || !body) {
      console.error('[send-to-user] Missing required fields');
      return res.status(400).json({ 
        error: 'Missing required fields: userId, title, body',
        received: { hasUserId: !!userId, hasTitle: !!title, hasBody: !!body }
      });
    }

    console.log('[send-to-user] Getting Firebase Admin...');
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
        console.log(`[send-to-user] FCM token found for user ${userId}: ${fcmToken.substring(0, 20)}...`);
        
        try {
          const messaging = getMessaging();
          console.log('[send-to-user] Messaging instance obtained');
          
          // ✅ SIMPLE: Chỉ gửi notification giống như Firebase Console test
          // Đảm bảo hiển thị notification trên tất cả trạng thái app
          const message = {
            notification: {
              title: title,
              body: body,
            },
            data: {
              type: data?.type || 'ADMIN_REPLY',
              reportId: (data?.reportId || '').toString(),
              report_id: (data?.reportId || '').toString(),
              title: title.toString(),
              body: body.toString(),
            },
            token: fcmToken,
            android: {
              priority: 'high' as const,
            },
          };

          console.log(`[send-to-user] Attempting to send FCM message`);
          console.log(`[send-to-user] Token: ${fcmToken.substring(0, 30)}...`);
          console.log(`[send-to-user] Message structure:`, {
            hasNotification: !!message.notification,
            hasData: !!message.data,
            dataKeys: Object.keys(message.data),
          });
          
          const response = await messaging.send(message);
          console.log(`[send-to-user] ✅ FCM sent successfully! Message ID: ${response}`);

          return res.status(200).json({
            success: true,
            message: 'Notification sent successfully',
            pushSent: true,
            messageId: response,
            fcmTokenPreview: fcmToken.substring(0, 20) + '...',
          });
        } catch (fcmSendError: any) {
          console.error('[send-to-user] ❌ FCM send failed:', fcmSendError);
          console.error('[send-to-user] Error code:', fcmSendError.code);
          console.error('[send-to-user] Error message:', fcmSendError.message);
          
          return res.status(200).json({
            success: true,
            message: 'Notification saved but FCM send failed',
            pushSent: false,
            error: fcmSendError.message,
            errorCode: fcmSendError.code,
          });
        }
      } else {
        console.log(`[API] No FCM token found for user: ${userId}`);
        return res.status(200).json({
          success: true,
          message: 'Notification saved, but no FCM token found',
          pushSent: false,
        });
      }
  } catch (error: any) {
    console.error('[send-to-user] Error sending user notification:', error);
    console.error('[send-to-user] Error stack:', error.stack);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
}
