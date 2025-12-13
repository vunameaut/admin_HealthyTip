import type { NextApiRequest, NextApiResponse } from 'next';
import { getDatabase } from '../../../lib/firebaseAdmin';

/**
 * API endpoint to create admin notification when user sends a message in support ticket
 * POST /api/admin-notifications/user-message
 *
 * Body:
 * - ticketId: string
 * - userId: string
 * - message: string
 * - senderName: string
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { ticketId, userId, message, senderName } = req.body;

    // Validate required fields
    if (!ticketId || !userId || !message) {
      return res.status(400).json({
        error: 'Missing required fields: ticketId, userId, message'
      });
    }

    // Create admin notification
    const db = getDatabase();
    const notificationRef = db.ref('admin_notifications').push();

    const notification = {
      type: 'USER_TICKET_REPLY',
      title: 'Phản hồi mới từ người dùng',
      message: `${senderName || 'User'} đã gửi tin nhắn: "${message.substring(0, 100)}${message.length > 100 ? '...' : ''}"`,
      data: {
        ticketId,
        userId,
        message,
        senderName
      },
      createdAt: Date.now(),
      read: false,
      priority: 'medium'
    };

    await notificationRef.set(notification);

    console.log('[Admin Notification] User message notification created:', {
      notificationId: notificationRef.key,
      ticketId,
      userId,
      senderName
    });

    res.status(200).json({
      success: true,
      notificationId: notificationRef.key,
      message: 'Admin notification created successfully'
    });
  } catch (error: any) {
    console.error('[Admin Notification] Error creating notification:', error);
    res.status(500).json({
      error: 'Failed to create notification',
      details: error.message
    });
  }
}
