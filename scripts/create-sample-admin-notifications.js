require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = {
  projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
  clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

console.log('Initializing Firebase Admin SDK...');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_ADMIN_DATABASE_URL,
  });
}

const db = admin.database();

async function createSampleNotifications() {
  console.log('🔔 Bắt đầu tạo sample admin notifications...');

  try {
    const notificationsRef = db.ref('admin_notifications');

    const notifications = [
      {
        type: 'USER_REPORT',
        title: 'Báo cáo nội dung không phù hợp từ Nguyễn Văn A',
        message: 'User báo cáo video chứa nội dung không phù hợp với trẻ em',
        data: {
          userId: 'user_123',
          userName: 'Nguyễn Văn A',
          reportType: 'inappropriate',
          contentId: '-sample-video-1',
          contentType: 'video',
          reason: 'Nội dung không phù hợp',
          description: 'Video chứa hình ảnh bạo lực'
        },
        read: false,
        resolved: false,
        createdAt: Date.now() - 1 * 60 * 60 * 1000, // 1 hour ago
        createdBy: 'user_123',
        priority: 'high',
        actionUrl: '/videos'
      },
      {
        type: 'CONTENT_PENDING',
        title: 'Bài viết mới cần duyệt: "10 tips giảm cân hiệu quả"',
        message: 'Bài viết từ user mới cần được kiểm duyệt trước khi xuất bản',
        data: {
          contentId: '-sample-post-1',
          contentType: 'post',
          author: 'Trần Thị B',
          authorId: 'user_456'
        },
        read: false,
        resolved: false,
        createdAt: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
        createdBy: 'user_456',
        priority: 'medium',
        actionUrl: '/content'
      },
      {
        type: 'CONTENT_FLAGGED',
        title: 'Nội dung bị đánh dấu: Chất lượng thấp',
        message: 'Bài viết "Cách uống nước" có điểm chất lượng thấp (score: 2.3/10)',
        data: {
          contentId: '-sample-post-2',
          contentType: 'post',
          qualityScore: 2.3,
          issues: ['Thiếu hình ảnh', 'Nội dung quá ngắn', 'Ngữ pháp sai']
        },
        read: false,
        resolved: false,
        createdAt: Date.now() - 3 * 60 * 60 * 1000, // 3 hours ago
        createdBy: 'system',
        priority: 'medium',
        actionUrl: '/moderation'
      },
      {
        type: 'NEW_USER',
        title: 'User mới đăng ký: Phạm Văn C',
        message: 'Có 1 user mới đăng ký tài khoản',
        data: {
          userId: 'user_789',
          userName: 'Phạm Văn C',
          email: 'phamvanc@example.com',
          registrationTime: Date.now() - 4 * 60 * 60 * 1000
        },
        read: true,
        resolved: false,
        createdAt: Date.now() - 4 * 60 * 60 * 1000, // 4 hours ago
        createdBy: 'system',
        priority: 'low',
        actionUrl: '/users'
      },
      {
        type: 'SYSTEM_ERROR',
        title: 'Lỗi: Upload video thất bại',
        message: 'Có 3 videos upload thất bại trong 1 giờ qua (Cloudinary error)',
        data: {
          errorType: 'upload_failed',
          count: 3,
          service: 'Cloudinary',
          errorMessage: 'Connection timeout'
        },
        read: false,
        resolved: false,
        createdAt: Date.now() - 30 * 60 * 1000, // 30 minutes ago
        createdBy: 'system',
        priority: 'critical',
        actionUrl: '/settings'
      },
      {
        type: 'HIGH_ENGAGEMENT',
        title: 'Nội dung viral: "Bài tập yoga buổi sáng"',
        message: 'Video đạt 10,000 views trong 24 giờ, tăng 500% so với trung bình',
        data: {
          contentId: '-sample-video-2',
          contentType: 'video',
          views: 10000,
          growthRate: 5.0,
          engagementRate: 0.85
        },
        read: true,
        resolved: true,
        createdAt: Date.now() - 5 * 60 * 60 * 1000, // 5 hours ago
        createdBy: 'system',
        priority: 'low',
        actionUrl: '/analytics'
      },
      {
        type: 'SECURITY_ALERT',
        title: 'Cảnh báo: Nhiều lần đăng nhập thất bại',
        message: 'IP 192.168.1.100 đã thử đăng nhập sai 10 lần trong 5 phút',
        data: {
          ip: '192.168.1.100',
          attemptCount: 10,
          timeWindow: '5 minutes',
          lastAttempt: Date.now() - 10 * 60 * 1000
        },
        read: false,
        resolved: false,
        createdAt: Date.now() - 10 * 60 * 1000, // 10 minutes ago
        createdBy: 'system',
        priority: 'critical',
        actionUrl: null
      },
      {
        type: 'DATA_INTEGRITY',
        title: 'Phát hiện dữ liệu không hợp lệ',
        message: 'Có 5 videos thiếu thumbnail và publicId',
        data: {
          issueType: 'missing_thumbnails',
          affectedCount: 5,
          videoIds: ['-vid1', '-vid2', '-vid3', '-vid4', '-vid5']
        },
        read: false,
        resolved: false,
        createdAt: Date.now() - 6 * 60 * 60 * 1000, // 6 hours ago
        createdBy: 'system',
        priority: 'medium',
        actionUrl: '/moderation'
      },
      {
        type: 'USER_FEEDBACK',
        title: 'Góp ý tính năng mới từ Lê Thị D',
        message: 'Đề xuất thêm tính năng "Lịch nhắc uống nước" vào app',
        data: {
          userId: 'user_101',
          userName: 'Lê Thị D',
          feedbackType: 'feature_request',
          description: 'Mong muốn có tính năng nhắc uống nước theo giờ, tùy chỉnh được số lượng nước cần uống mỗi ngày',
          rating: 5
        },
        read: false,
        resolved: false,
        createdAt: Date.now() - 7 * 60 * 60 * 1000, // 7 hours ago
        createdBy: 'user_101',
        priority: 'low',
        actionUrl: null
      },
      {
        type: 'USER_REPORT',
        title: 'Báo cáo lỗi từ Hoàng Văn E',
        message: 'App bị crash khi xem video trên iOS 15',
        data: {
          userId: 'user_202',
          userName: 'Hoàng Văn E',
          reportType: 'bug',
          device: 'iPhone 12',
          osVersion: 'iOS 15.6',
          appVersion: '1.2.3',
          description: 'Mỗi khi mở video thì app tự động thoát',
          steps: 'Mở app -> Vào tab Videos -> Chọn video bất kỳ -> App crash'
        },
        read: true,
        resolved: true,
        createdAt: Date.now() - 1 * 24 * 60 * 60 * 1000, // 1 day ago
        createdBy: 'user_202',
        priority: 'high',
        actionUrl: null
      }
    ];

    console.log(`\n📝 Tạo ${notifications.length} notifications...\n`);

    for (const notification of notifications) {
      const newNotificationRef = notificationsRef.push();
      await newNotificationRef.set(notification);
      console.log(`  ✓ Created: ${notification.title} (${notification.type}, priority: ${notification.priority})`);
    }

    console.log('\n✅ Hoàn thành! Sample admin notifications đã được tạo.');
    console.log(`\n📊 Tóm tắt:`);
    console.log(`  - Tổng notifications: ${notifications.length}`);
    console.log(`  - Chưa đọc: ${notifications.filter(n => !n.read).length}`);
    console.log(`  - Ưu tiên cao: ${notifications.filter(n => n.priority === 'high' || n.priority === 'critical').length}`);
    console.log(`  - Đã xử lý: ${notifications.filter(n => n.resolved).length}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  }
}

createSampleNotifications();
