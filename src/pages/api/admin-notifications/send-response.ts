import type { NextApiRequest, NextApiResponse } from 'next';
import admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
      databaseURL: process.env.FIREBASE_ADMIN_DATABASE_URL,
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

  try {
    const {
      userId,
      notificationId,
      responseMessage,
      adminName,
    } = req.body;

    // Validate required fields
    if (!userId || !responseMessage) {
      return res.status(400).json({
        error: 'Missing required fields: userId, responseMessage'
      });
    }

    // Create user notification
    const userNotificationsRef = db.ref(`user_notifications/${userId}`);
    const newNotificationRef = userNotificationsRef.push();

    const userNotification = {
      type: 'ADMIN_RESPONSE',
      title: 'Phản hồi từ Admin',
      message: responseMessage,
      data: {
        adminName: adminName || 'Admin',
        originalNotificationId: notificationId || null,
      },
      read: false,
      createdAt: Date.now(),
      priority: 'high',
    };

    await newNotificationRef.set(userNotification);

    // If there's a notification ID, mark the admin notification as resolved
    if (notificationId) {
      const adminNotificationRef = db.ref(`admin_notifications/${notificationId}`);
      await adminNotificationRef.update({
        resolved: true,
        read: true,
        responseMessage,
        respondedAt: Date.now(),
        respondedBy: adminName || 'Admin',
      });
    }

    return res.status(201).json({
      success: true,
      userNotificationId: newNotificationRef.key,
      message: 'Đã gửi phản hồi đến người dùng'
    });

  } catch (error: any) {
    console.error('Error sending response to user:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
