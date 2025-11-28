require('dotenv').config({ path: '.env.local' });
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, set, push } = require('firebase/database');

// Firebase config from .env.local
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DB_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
};

console.log('Firebase Config loaded:', {
  projectId: firebaseConfig.projectId,
  databaseURL: firebaseConfig.databaseURL
});

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

async function createSampleData() {
  console.log('🚀 Bắt đầu tạo sample data...');

  try {
    // 1. Tạo Categories
    console.log('📁 Tạo categories...');
    const categoriesRef = ref(database, 'categories');

    const categories = [
      {
        name: 'Dinh dưỡng',
        slug: 'dinh-duong',
        description: 'Kiến thức về dinh dưỡng và ăn uống lành mạnh',
        order: 1,
        createdAt: Date.now()
      },
      {
        name: 'Tập luyện',
        slug: 'tap-luyen',
        description: 'Hướng dẫn tập luyện và thể dục',
        order: 2,
        createdAt: Date.now()
      },
      {
        name: 'Sức khỏe tinh thần',
        slug: 'suc-khoe-tinh-than',
        description: 'Chăm sóc sức khỏe tinh thần',
        order: 3,
        createdAt: Date.now()
      },
      {
        name: 'Giấc ngủ',
        slug: 'giac-ngu',
        description: 'Tips về giấc ngủ chất lượng',
        order: 4,
        createdAt: Date.now()
      }
    ];

    const categoryIds = [];
    for (const category of categories) {
      const newCatRef = push(categoriesRef);
      await set(newCatRef, category);
      categoryIds.push(newCatRef.key);
      console.log(`  ✓ Created: ${category.name}`);
    }

    // 2. Tạo Health Tips
    console.log('\n📝 Tạo health tips...');
    const healthTipsRef = ref(database, 'health_tips');

    const healthTips = [
      {
        title: 'Uống đủ nước mỗi ngày',
        content: [
          {
            id: '1',
            type: 'text',
            value: 'Uống đủ 2-3 lít nước mỗi ngày giúp cơ thể hoạt động tốt hơn, da dẻ khỏe đẹp và tăng cường sức đề kháng.'
          }
        ],
        categoryId: categoryIds[0],
        author: 'Admin',
        status: 'published',
        viewCount: 150,
        likeCount: 45,
        createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
        updatedAt: Date.now()
      },
      {
        title: 'Tập thể dục 30 phút mỗi ngày',
        content: [
          {
            id: '1',
            type: 'text',
            value: 'Tập thể dục đều đặn 30 phút mỗi ngày giúp cải thiện sức khỏe tim mạch, tăng cường sức bền và giảm stress.'
          }
        ],
        categoryId: categoryIds[1],
        author: 'Admin',
        status: 'published',
        viewCount: 230,
        likeCount: 67,
        createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
        updatedAt: Date.now()
      },
      {
        title: 'Thiền 10 phút mỗi sáng',
        content: [
          {
            id: '1',
            type: 'text',
            value: 'Thiền định mỗi sáng giúp tâm trí tĩnh lặng, giảm lo âu và tăng khả năng tập trung trong ngày.'
          }
        ],
        categoryId: categoryIds[2],
        author: 'Admin',
        status: 'published',
        viewCount: 180,
        likeCount: 52,
        createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
        updatedAt: Date.now()
      },
      {
        title: 'Ngủ đủ 7-8 tiếng mỗi đêm',
        content: [
          {
            id: '1',
            type: 'text',
            value: 'Giấc ngủ chất lượng giúp cơ thể phục hồi, tăng cường trí nhớ và cải thiện tâm trạng.'
          }
        ],
        categoryId: categoryIds[3],
        author: 'Admin',
        status: 'published',
        viewCount: 200,
        likeCount: 58,
        createdAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
        updatedAt: Date.now()
      },
      {
        title: 'Ăn nhiều rau xanh và trái cây',
        content: [
          {
            id: '1',
            type: 'text',
            value: 'Rau xanh và trái cây cung cấp vitamin, khoáng chất và chất xơ cần thiết cho cơ thể.'
          }
        ],
        categoryId: categoryIds[0],
        author: 'Admin',
        status: 'published',
        viewCount: 175,
        likeCount: 48,
        createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
        updatedAt: Date.now()
      }
    ];

    for (const tip of healthTips) {
      const newTipRef = push(healthTipsRef);
      await set(newTipRef, tip);
      console.log(`  ✓ Created: ${tip.title}`);
    }

    // 3. Tạo Sample Videos
    console.log('\n🎥 Tạo sample videos...');
    const videosRef = ref(database, 'videos');

    const videos = [
      {
        title: 'Bài tập Yoga buổi sáng',
        caption: 'Bài tập yoga nhẹ nhàng để bắt đầu ngày mới',
        categoryId: categoryIds[1],
        videoUrl: 'https://sample-videos.com/yoga.mp4',
        thumbnailUrl: 'https://via.placeholder.com/400x300?text=Yoga',
        thumb: 'https://via.placeholder.com/400x300?text=Yoga',
        viewCount: 320,
        likeCount: 89,
        status: 'published',
        uploadDate: Date.now() - 4 * 24 * 60 * 60 * 1000,
        updatedAt: Date.now(),
        duration: 600,
        width: 1920,
        height: 1080,
        userId: 'admin',
        tags: { yoga: true, 'bai-tap': true }
      },
      {
        title: 'Cách làm salad healthy',
        caption: 'Hướng dẫn làm salad dinh dưỡng và ngon miệng',
        categoryId: categoryIds[0],
        videoUrl: 'https://sample-videos.com/salad.mp4',
        thumbnailUrl: 'https://via.placeholder.com/400x300?text=Salad',
        thumb: 'https://via.placeholder.com/400x300?text=Salad',
        viewCount: 280,
        likeCount: 72,
        status: 'published',
        uploadDate: Date.now() - 2 * 24 * 60 * 60 * 1000,
        updatedAt: Date.now(),
        duration: 420,
        width: 1920,
        height: 1080,
        userId: 'admin',
        tags: { 'dinh-duong': true, 'mon-an': true }
      }
    ];

    for (const video of videos) {
      const newVideoRef = push(videosRef);
      await set(newVideoRef, video);
      console.log(`  ✓ Created: ${video.title}`);
    }

    // 4. Tạo Sample Analytics Events
    console.log('\n📊 Tạo analytics events...');
    const analyticsRef = ref(database, 'analytics');

    const now = Date.now();
    const events = [];

    // Generate events for last 30 days
    for (let i = 0; i < 30; i++) {
      const date = now - (i * 24 * 60 * 60 * 1000);

      // User logins
      for (let j = 0; j < Math.floor(Math.random() * 10) + 5; j++) {
        events.push({
          type: 'user_login',
          userId: `user_${Math.floor(Math.random() * 100)}`,
          timestamp: date + Math.random() * 24 * 60 * 60 * 1000,
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)'
        });
      }

      // Page views
      for (let j = 0; j < Math.floor(Math.random() * 20) + 10; j++) {
        events.push({
          type: 'page_view',
          userId: `user_${Math.floor(Math.random() * 100)}`,
          timestamp: date + Math.random() * 24 * 60 * 60 * 1000,
          data: { page: '/health-tips' },
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        });
      }
    }

    for (const event of events) {
      const newEventRef = push(analyticsRef);
      await set(newEventRef, event);
    }
    console.log(`  ✓ Created ${events.length} analytics events`);

    console.log('\n✅ Hoàn thành! Sample data đã được tạo.');
    console.log(`\n📊 Tóm tắt:`);
    console.log(`  - Categories: ${categories.length}`);
    console.log(`  - Health Tips: ${healthTips.length}`);
    console.log(`  - Videos: ${videos.length}`);
    console.log(`  - Analytics Events: ${events.length}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  }
}

createSampleData();
