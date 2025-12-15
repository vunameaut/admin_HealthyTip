import type { NextApiRequest, NextApiResponse } from 'next';
import { getDatabase } from '@/lib/firebaseAdmin';

/**
 * API endpoint để gửi thông báo cho admin khi user reply trong report chat
 * POST /api/notifications/notify-admin-user-reply
 * 
 * Request body:
 * - reportId: ID của report
 * - userId: ID của user gửi tin nhắn
 * - userName: Tên user
 * - messageText: Nội dung tin nhắn
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('[notify-admin-user-reply] Request received:', req.body);

  try {
    const { reportId, userId, userName, messageText } = req.body;

    // Validate required fields
    if (!reportId || !userId || !userName || !messageText) {
      console.error('[notify-admin-user-reply] Missing required fields');
      return res.status(400).json({ 
        error: 'Missing required fields: reportId, userId, userName, messageText',
        received: { reportId, userId, userName, hasMessageText: !!messageText }
      });
    }

    // Get Firebase Admin Database
    console.log('[notify-admin-user-reply] Getting Firebase database...');
    const db = getDatabase();

    // Tạo admin notification trong Firebase
    const adminNotificationsRef = db.ref('admin_notifications');
    const notification = {
      type: 'USER_REPLY',
      reportId,
      userId,
      userName,
      messagePreview: messageText.substring(0, 100),
      messageText: messageText.substring(0, 200), // Lưu preview dài hơn
      read: false,
      createdAt: Date.now(),
      timestamp: Date.now(),
    };

    const newNotificationRef = await adminNotificationsRef.push(notification);
    console.log(`[API] Admin notification created: ${newNotificationRef.key}`);

    // Cập nhật report để đánh dấu có tin nhắn chưa đọc từ user
    const reportRef = db.ref(`reports/${reportId}`);
    await reportRef.update({
      hasUnreadUserMessage: true,
      lastUserMessageAt: Date.now(),
      updatedAt: Date.now(),
    });

    console.log(`[API] Report ${reportId} marked as having unread user message`);

    return res.status(200).json({
      success: true,
      message: 'Admin notification created successfully',
      notificationId: newNotificationRef.key,
    });

  } catch (error: any) {
    console.error('[notify-admin-user-reply] Error creating admin notification:', error);
    console.error('[notify-admin-user-reply] Error stack:', error.stack);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
}
