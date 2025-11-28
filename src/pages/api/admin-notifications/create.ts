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
      type,
      title,
      message,
      data,
      priority = 'medium',
      actionUrl,
      createdBy
    } = req.body;

    // Validate required fields
    if (!type || !title || !message) {
      return res.status(400).json({
        error: 'Missing required fields: type, title, message'
      });
    }

    // Validate notification type
    const validTypes = [
      'USER_REPORT',
      'CONTENT_PENDING',
      'CONTENT_FLAGGED',
      'NEW_USER',
      'SYSTEM_ERROR',
      'HIGH_ENGAGEMENT',
      'SECURITY_ALERT',
      'DATA_INTEGRITY',
      'USER_FEEDBACK'
    ];

    if (!validTypes.includes(type)) {
      return res.status(400).json({
        error: `Invalid notification type. Must be one of: ${validTypes.join(', ')}`
      });
    }

    // Validate priority
    const validPriorities = ['low', 'medium', 'high', 'critical'];
    if (!validPriorities.includes(priority)) {
      return res.status(400).json({
        error: `Invalid priority. Must be one of: ${validPriorities.join(', ')}`
      });
    }

    // Create notification
    const notificationsRef = db.ref('admin_notifications');
    const newNotificationRef = notificationsRef.push();

    const notification = {
      type,
      title,
      message,
      data: data || null,
      read: false,
      resolved: false,
      createdAt: Date.now(),
      createdBy: createdBy || 'system',
      priority,
      actionUrl: actionUrl || null
    };

    await newNotificationRef.set(notification);

    return res.status(201).json({
      success: true,
      notificationId: newNotificationRef.key,
      notification
    });

  } catch (error: any) {
    console.error('Error creating admin notification:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
