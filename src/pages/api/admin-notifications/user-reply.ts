import type { NextApiRequest, NextApiResponse } from 'next';
import { getDatabase } from '@/lib/firebaseAdmin';

/**
 * API endpoint để nhận thông báo khi user reply trong report chat
 * POST /api/admin-notifications/user-reply
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type, reportId, userId, userName, message } = req.body;

    // Validate required fields
    if (!reportId || !userId || !message) {
      return res.status(400).json({ 
        error: 'Missing required fields: reportId, userId, message' 
      });
    }

    // Get Firebase Admin Database
    const db = getDatabase();
    const adminNotificationsRef = db.ref('admin_notifications');

    // Check for duplicate notifications in the last 30 seconds
    const thirtySecondsAgo = Date.now() - 30000;
    const recentSnapshot = await adminNotificationsRef
      .orderByChild('createdAt')
      .startAt(thirtySecondsAgo)
      .once('value');

    let isDuplicate = false;
    recentSnapshot.forEach((child) => {
      const notif = child.val();
      if (
        notif.reportId === reportId &&
        notif.type === 'USER_REPLY' &&
        notif.message?.includes(message.substring(0, 50))
      ) {
        isDuplicate = true;
      }
    });

    if (isDuplicate) {
      console.log(`[API] Duplicate user reply notification ignored for report: ${reportId}`);
      return res.status(200).json({
        success: true,
        duplicate: true,
        message: 'Duplicate notification ignored',
      });
    }

    // Create notification object
    const notification = {
      type: type || 'USER_REPLY',
      reportId,
      userId,
      userName: userName || 'Unknown',
      title: `Phản hồi từ ${userName || 'người dùng'}`,
      message: message.length > 150 ? message.substring(0, 150) + '...' : message,
      read: false,
      resolved: false,
      createdAt: Date.now(),
      priority: 'normal',
    };

    // Push to Firebase
    const newRef = await adminNotificationsRef.push(notification);

    console.log(`[API] User reply notification created: ${newRef.key}`);

    return res.status(201).json({
      success: true,
      notificationId: newRef.key,
      message: 'Admin notification created successfully',
    });

  } catch (error: any) {
    console.error('[API] Error creating user reply notification:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message,
    });
  }
}

