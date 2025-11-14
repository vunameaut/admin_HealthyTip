import type { NextApiRequest, NextApiResponse } from 'next';
import { getDatabase, getMessaging, saveNotificationHistory } from '@/lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { title, body, data, excludeUserIds } = req.body;

    if (!title || !body) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: title, body'
      });
    }

    console.log(' Broadcasting notification:', title);

    const db = getDatabase();
    const messaging = getMessaging();

    const usersSnapshot = await db.ref('users').once('value');
    const users = usersSnapshot.val();
    
    if (!users) {
      return res.json({
        success: true,
        message: 'No users found',
        sentCount: 0
      });
    }

    const excludeSet = new Set(excludeUserIds || []);
    const tokens: string[] = [];
    const userIds: string[] = [];
    
    Object.keys(users).forEach(userId => {
      if (!excludeSet.has(userId) && users[userId].fcmToken) {
        tokens.push(users[userId].fcmToken);
        userIds.push(userId);
      }
    });

    if (tokens.length === 0) {
      return res.json({
        success: true,
        message: 'No valid FCM tokens found',
        sentCount: 0
      });
    }

    const message = {
      notification: {
        title: title,
        body: body
      },
      data: {
        type: 'broadcast',
        ...data,
        timestamp: Date.now().toString()
      }
    };

    const response = await messaging.sendEachForMulticast({
      tokens: tokens,
      ...message
    });

    console.log(' Broadcast sent:', response.successCount, '/', tokens.length);

    const failedTokens: any[] = [];
    if (response.failureCount > 0) {
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push({
            userId: userIds[idx],
            error: resp.error?.code || 'unknown'
          });
        }
      });
    }

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
      message: 'Broadcast sent successfully',
      sentCount: response.successCount,
      failureCount: response.failureCount,
      totalTokens: tokens.length,
      failedTokens: failedTokens.length > 0 ? failedTokens : undefined
    });

  } catch (error: any) {
    console.error(' Error broadcasting notification:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
