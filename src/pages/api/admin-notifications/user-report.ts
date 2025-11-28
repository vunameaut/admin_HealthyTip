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
      userName,
      reportType, // 'content', 'bug', 'spam', 'abuse', 'inappropriate', 'other'
      contentId,
      contentType, // 'post', 'video', 'comment'
      reason,
      description,
      additionalData
    } = req.body;

    // Validate required fields
    if (!userId || !reportType || !reason) {
      return res.status(400).json({
        error: 'Missing required fields: userId, reportType, reason'
      });
    }

    // Determine priority based on report type
    let priority: 'low' | 'medium' | 'high' | 'critical' = 'medium';
    if (reportType === 'abuse' || reportType === 'inappropriate') {
      priority = 'high';
    } else if (reportType === 'spam') {
      priority = 'medium';
    } else if (reportType === 'bug') {
      priority = 'low';
    }

    // Build notification title and message
    const reportTypeNames: { [key: string]: string } = {
      content: 'Báo cáo nội dung',
      bug: 'Báo cáo lỗi',
      spam: 'Báo cáo spam',
      abuse: 'Báo cáo lạm dụng',
      inappropriate: 'Báo cáo nội dung không phù hợp',
      other: 'Báo cáo khác'
    };

    const title = `${reportTypeNames[reportType] || 'Báo cáo'} từ ${userName || 'User'}`;
    const message = `${reason}${description ? ': ' + description : ''}`;

    // Build action URL
    let actionUrl = null;
    if (contentId && contentType) {
      if (contentType === 'post') {
        actionUrl = `/content/edit/${contentId}`;
      } else if (contentType === 'video') {
        actionUrl = `/videos/edit/${contentId}`;
      }
    }

    // Create notification
    const notificationsRef = db.ref('admin_notifications');
    const newNotificationRef = notificationsRef.push();

    const notification = {
      type: 'USER_REPORT',
      title,
      message,
      data: {
        userId,
        userName,
        reportType,
        contentId: contentId || null,
        contentType: contentType || null,
        reason,
        description: description || null,
        ...additionalData
      },
      read: false,
      resolved: false,
      createdAt: Date.now(),
      createdBy: userId,
      priority,
      actionUrl
    };

    await newNotificationRef.set(notification);

    return res.status(201).json({
      success: true,
      notificationId: newNotificationRef.key,
      message: 'Báo cáo đã được gửi đến admin'
    });

  } catch (error: any) {
    console.error('Error creating user report notification:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
