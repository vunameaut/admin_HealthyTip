import type { NextApiRequest, NextApiResponse } from 'next';
import { getDatabase } from '@/lib/firebaseAdmin';

/**
 * API endpoint để nhận thông báo khi có report mới từ user
 * POST /api/admin-notifications/new-report
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type, reportId, userId, userName, reportType, content } = req.body;

    // Validate required fields
    if (!reportId || !userId) {
      return res.status(400).json({ error: 'Missing required fields: reportId, userId' });
    }

    // Get Firebase Admin Database
    const db = getDatabase();
    const adminNotificationsRef = db.ref('admin_notifications');

    // Create notification object
    const notification = {
      type: type || 'NEW_REPORT',
      reportId,
      userId,
      userName: userName || 'Unknown',
      title: `Báo cáo mới: ${reportType || 'Khác'}`,
      message: content ? content.substring(0, 150) : 'Không có nội dung',
      read: false,
      resolved: false,
      createdAt: Date.now(),
      priority: 'high',
    };

    // Push to Firebase
    const newRef = await adminNotificationsRef.push(notification);

    console.log(`[API] New report notification created: ${newRef.key}`);

    return res.status(201).json({
      success: true,
      notificationId: newRef.key,
      message: 'Admin notification created successfully',
    });

  } catch (error: any) {
    console.error('[API] Error creating new report notification:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message,
    });
  }
}

