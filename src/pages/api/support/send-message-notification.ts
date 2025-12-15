import type { NextApiRequest, NextApiResponse } from 'next';
import admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  try {
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const databaseURL = process.env.FIREBASE_ADMIN_DATABASE_URL;

    if (!projectId || !clientEmail || !privateKey || !databaseURL) {
      console.error('Missing Firebase Admin environment variables');
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      databaseURL,
    });
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

const db = admin.database();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!admin.apps.length) {
    return res.status(500).json({
      error: 'Firebase Admin SDK not initialized'
    });
  }

  try {
    const {
      ticketId,
      userId,
      senderType, // 'admin' or 'user'
      message,
      senderName
    } = req.body;

    if (!ticketId || !userId || !senderType || !message) {
      return res.status(400).json({
        error: 'Missing required fields'
      });
    }

    if (senderType === 'admin') {
      // Admin sent message → notify user
      const userNotificationsRef = db.ref(`user_notifications/${userId}`);
      const newNotificationRef = userNotificationsRef.push();

      const userNotification = {
        type: 'support_reply',
        title: 'Admin đã trả lời yêu cầu hỗ trợ',
        message: message.length > 100 ? message.substring(0, 100) + '...' : message,
        data: {
          ticketId,
          senderName: senderName || 'Admin',
        },
        read: false,
        createdAt: Date.now(),
        priority: 'high',
      };

      await newNotificationRef.set(userNotification);

      // Try to send FCM notification if user has token
      const userRef = db.ref(`users/${userId}`);
      const userSnapshot = await userRef.get();

      if (userSnapshot.exists()) {
        const userData = userSnapshot.val();
        if (userData.fcmToken) {
          try {
            await admin.messaging().send({
              token: userData.fcmToken,
              notification: {
                title: 'Admin đã trả lời yêu cầu hỗ trợ',
                body: message.length > 100 ? message.substring(0, 100) + '...' : message,
              },
              data: {
                type: 'support_reply',
                ticket_id: ticketId,
                title: 'Admin đã trả lời yêu cầu hỗ trợ',
                body: message.length > 100 ? message.substring(0, 100) + '...' : message,
              },
            });
          } catch (fcmError) {
            console.error('Error sending FCM:', fcmError);
            // Don't fail the request if FCM fails
          }
        }
      }

      return res.status(200).json({
        success: true,
        message: 'User notification sent'
      });

    } else {
      // User sent message → notify admin
      const adminNotificationsRef = db.ref('admin_notifications');
      const newNotificationRef = adminNotificationsRef.push();

      const adminNotification = {
        type: 'USER_FEEDBACK',
        title: `${senderName || 'User'} đã trả lời ticket hỗ trợ`,
        message: message.length > 100 ? message.substring(0, 100) + '...' : message,
        data: {
          ticketId,
          userId,
          userName: senderName,
        },
        read: false,
        resolved: false,
        createdAt: Date.now(),
        createdBy: userId,
        priority: 'medium',
        actionUrl: `/support?userId=${userId}&ticketId=${ticketId}`
      };

      await newNotificationRef.set(adminNotification);

      // ✅ SET FLAG: Mark ticket as having unread user message
      const ticketRef = db.ref(`support_tickets/${ticketId}`);
      await ticketRef.update({
        hasUnreadUserMessage: true,
        lastUserMessageAt: Date.now()
      });

      return res.status(200).json({
        success: true,
        message: 'Admin notification sent'
      });
    }

  } catch (error: any) {
    console.error('Error sending notification:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
