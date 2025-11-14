import type { NextApiRequest, NextApiResponse } from 'next';
import { getDatabase, getMessaging, saveNotificationHistory } from '@/lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { userId, healthTipId, title, reason } = req.body;

    if (!userId || !healthTipId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userId, healthTipId'
      });
    }

    console.log(`📤 Sending recommendation to user: ${userId}`);

    const db = getDatabase();
    const messaging = getMessaging();

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
        title: '💡 Khuyến nghị cho bạn',
        body: title || 'Có một mẹo sức khỏe phù hợp với bạn'
      },
      data: {
        type: 'recommendation',
        healthTipId: healthTipId,
        reason: reason || '',
        timestamp: Date.now().toString()
      }
    };

    const response = await messaging.send(message);
    console.log('✅ Recommendation sent:', response);

    // Save notification history
    await saveNotificationHistory({
      type: 'recommendation',
      title: '💡 Khuyến nghị cho bạn',
      body: title || 'Có một mẹo sức khỏe phù hợp với bạn',
      data: {
        healthTipId,
        reason: reason || '',
      },
      sentTo: [userId],
      sentCount: 1,
      failureCount: 0,
      status: 'success'
    });

    res.json({
      success: true,
      message: 'Recommendation sent successfully',
      messageId: response,
      recipient: userId
    });

  } catch (error: any) {
    console.error('❌ Error sending recommendation:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: error.code
    });
  }
}
