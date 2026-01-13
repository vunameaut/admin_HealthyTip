/**
 * Script tạo dữ liệu analytics mẫu cho dashboard
 * Chạy: node scripts/create-sample-analytics.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('../reminderwater-84694-firebase-adminsdk-ystgf-b2ed2248c5.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://reminderwater-84694-default-rtdb.firebaseio.com"
  });
}

const db = admin.database();

// Event types
const EVENT_TYPES = [
  'page_view',
  'user_login',
  'content_view',
  'video_view',
  'search',
  'favorite_add',
  'favorite_remove',
  'reminder_set',
  'notification_open'
];

// Device types and user agents
const DEVICES = [
  { type: 'Mobile', userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15' },
  { type: 'Mobile', userAgent: 'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36' },
  { type: 'Tablet', userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_6 like Mac OS X) AppleWebKit/605.1.15' },
  { type: 'Desktop', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
  { type: 'Desktop', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' }
];

// Helper function to get random item
function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// Helper function to generate random date in the last N days
function getRandomDate(daysAgo) {
  const now = Date.now();
  const randomDays = Math.floor(Math.random() * daysAgo);
  return now - (randomDays * 24 * 60 * 60 * 1000);
}

async function createSampleAnalytics() {
  try {
    console.log('🚀 Bắt đầu tạo dữ liệu analytics mẫu...\n');

    // Get existing health tips and users for realistic data
    const tipsSnapshot = await db.ref('health_tips').once('value');
    const usersSnapshot = await db.ref('users').once('value');
    
    const tips = [];
    const users = [];
    
    if (tipsSnapshot.exists()) {
      tipsSnapshot.forEach(child => {
        tips.push({ id: child.key, ...child.val() });
      });
    }
    
    if (usersSnapshot.exists()) {
      usersSnapshot.forEach(child => {
        users.push({ id: child.key, ...child.val() });
      });
    }

    console.log(`📊 Tìm thấy ${tips.length} bài viết và ${users.length} người dùng\n`);

    // Create sample analytics events for the last 30 days
    const analyticsRef = db.ref('analytics');
    const eventsToCreate = 500; // Number of events to create
    const events = [];

    for (let i = 0; i < eventsToCreate; i++) {
      const eventType = getRandomItem(EVENT_TYPES);
      const device = getRandomItem(DEVICES);
      const userId = users.length > 0 ? getRandomItem(users).id : `sample_user_${Math.floor(Math.random() * 10)}`;
      
      const event = {
        type: eventType,
        userId: userId,
        timestamp: getRandomDate(30),
        userAgent: device.userAgent,
        data: {}
      };

      // Add specific data based on event type
      if (eventType === 'content_view' && tips.length > 0) {
        const tip = getRandomItem(tips);
        event.data = {
          contentId: tip.id,
          contentTitle: tip.title,
          categoryId: tip.categoryId
        };
      } else if (eventType === 'video_view' && tips.length > 0) {
        const tip = getRandomItem(tips);
        event.data = {
          videoId: tip.id,
          videoTitle: tip.title
        };
      } else if (eventType === 'page_view') {
        event.data = {
          page: getRandomItem(['home', 'tips', 'videos', 'favorites', 'profile', 'settings'])
        };
      } else if (eventType === 'search') {
        event.data = {
          query: getRandomItem(['sức khỏe', 'tim mạch', 'vitamin', 'tập thể dục', 'dinh dưỡng'])
        };
      }

      events.push(event);

      // Batch push every 50 events
      if (events.length >= 50 || i === eventsToCreate - 1) {
        const updates = {};
        events.forEach(evt => {
          const newRef = analyticsRef.push();
          updates[newRef.key] = evt;
        });
        
        await analyticsRef.update(updates);
        console.log(`✅ Đã tạo ${events.length} sự kiện analytics`);
        events.length = 0; // Clear array
      }
    }

    console.log('\n🎉 Hoàn thành tạo dữ liệu analytics mẫu!');
    console.log(`📈 Tổng cộng: ${eventsToCreate} sự kiện analytics`);
    console.log('\n💡 Bây giờ bạn có thể xem dữ liệu trong trang Analytics & Reports\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi khi tạo dữ liệu analytics:', error);
    process.exit(1);
  }
}

// Run the script
createSampleAnalytics();
