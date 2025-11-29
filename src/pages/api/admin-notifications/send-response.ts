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
      console.error('Required: FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY, FIREBASE_ADMIN_DATABASE_URL');
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      databaseURL,
    });
    console.log('Firebase Admin initialized successfully');
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

  // Check if Firebase Admin is initialized
  if (!admin.apps.length) {
    console.error('Firebase Admin not initialized');
    return res.status(500).json({
      error: 'Firebase Admin SDK not initialized',
      message: 'Server configuration error. Please check Firebase Admin credentials.'
    });
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

      // Also update the corresponding issue in /issues node
      // Query issues by userId
      const issuesRef = db.ref('issues');
      const issuesQuery = issuesRef.orderByChild('userId').equalTo(userId);
      const issuesSnapshot = await issuesQuery.get();

      if (issuesSnapshot.exists()) {
        const updates: any = {};
        let issueId: string | null = null;

        issuesSnapshot.forEach((child) => {
          const issueData = child.val();
          issueId = child.key;

          // Update if status is not already resolved
          if (issueData.status !== 'resolved') {
            updates[`issues/${child.key}/status`] = 'in_progress';
            updates[`issues/${child.key}/adminResponse`] = responseMessage;
            updates[`issues/${child.key}/respondedAt`] = Date.now();
            updates[`issues/${child.key}/adminId`] = adminName || 'Admin';
          }
        });

        if (Object.keys(updates).length > 0) {
          await db.ref().update(updates);
        }

        // ADD MESSAGE TO CHAT
        // Create a chat message in /issues/{issueId}/messages
        if (issueId) {
          const messagesRef = db.ref(`issues/${issueId}/messages`);
          const newMessageRef = messagesRef.push();

          const chatMessage = {
            text: responseMessage,
            senderId: 'admin',
            senderType: 'admin',
            senderName: adminName || 'Admin',
            timestamp: Date.now(),
          };

          await newMessageRef.set(chatMessage);
        }
      }
    }

    return res.status(201).json({
      success: true,
      userNotificationId: newNotificationRef.key,
      message: 'Đã gửi phản hồi đến người dùng'
    });

  } catch (error: any) {
    console.error('Error sending response to user:', error);
    console.error('Error stack:', error.stack);
    console.error('Request body:', req.body);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
