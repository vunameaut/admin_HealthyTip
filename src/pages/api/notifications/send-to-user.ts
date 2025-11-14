import type { NextApiRequest, NextApiResponse } from 'next';
import { getDatabase, getMessaging, saveNotificationHistory } from '@/lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { userId, title, body, data } = req.body;

    if (!userId || !title || !body) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userId, title, body'
      });
    }

    console.log(' Sending notification to user:', userId);

    const db = getDatabase();
    const messaging = getMessaging();

    const userSnapshot = await db.ref('users/' + userId).once('value');
    const user = userSnapshot.val();

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    if (!user.fcmToken) {
      return res.status(400).json({
        success: false,
        error: 'User has no FCM token'
      });
    }

    const message = {
      token: user.fcmToken,
      notification: {
        title: title,
        body: body
      },
      data: {
        type: 'admin_message',
        ...data,
        timestamp: Date.now().toString()
      }
    };

    const response = await messaging.send(message);

    // Save notification history
    await saveNotificationHistory({
      type: 'admin_message',
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
      message: 'Notification sent successfully',
      messageId: response,
      recipient: userId
    });

  } catch (error: any) {
    console.error(' Error sending notification to user:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
