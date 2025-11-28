require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = {
  projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
  clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

console.log('Initializing Firebase Admin SDK...');
console.log('Project ID:', serviceAccount.projectId);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_ADMIN_DATABASE_URL,
});

const db = admin.database();

async function createSampleData() {
  console.log('🚀 Bắt đầu tạo sample data...');

  try {
    // 1. Tạo Categories
    console.log('📁 Tạo categories...');
    const categoriesRef = db.ref('categories');

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
      const newCatRef = categoriesRef.push();
      await newCatRef.set(category);
      categoryIds.push(newCatRef.key);
      console.log(`  ✓ Created: ${category.name} (${newCatRef.key})`);
    }

    // 2. Tạo Health Tips
    console.log('\n📝 Tạo health tips...');
    const healthTipsRef = db.ref('health_tips');

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
        imageUrl: 'https://images.unsplash.com/photo-1550572017-edd951aa8f72?w=800',
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
        imageUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800',
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
        imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800',
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
        imageUrl: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=800',
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
        imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800',
        createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
        updatedAt: Date.now()
      },
      {
        title: 'Giữ tư thế ngồi đúng cách',
        content: [
          {
            id: '1',
            type: 'text',
            value: 'Tư thế ngồi đúng giúp tránh đau lưng, cổ và vai. Hãy ngồi thẳng lưng, hai chân chạm sàn.'
          }
        ],
        categoryId: categoryIds[1],
        author: 'Admin',
        status: 'published',
        viewCount: 145,
        likeCount: 38,
        imageUrl: 'https://images.unsplash.com/photo-1573495612937-f794df80d4c1?w=800',
        createdAt: Date.now() - 4 * 24 * 60 * 60 * 1000,
        updatedAt: Date.now()
      }
    ];

    const tipIds = [];
    for (const tip of healthTips) {
      const newTipRef = healthTipsRef.push();
      await newTipRef.set(tip);
      tipIds.push(newTipRef.key);
      console.log(`  ✓ Created: ${tip.title} (${newTipRef.key})`);
    }

    // 3. Tạo Sample Videos
    console.log('\n🎥 Tạo sample videos...');
    const videosRef = db.ref('videos');

    const videos = [
      {
        title: 'Bài tập Yoga buổi sáng',
        caption: 'Bài tập yoga nhẹ nhàng để bắt đầu ngày mới',
        categoryId: categoryIds[1],
        videoUrl: 'https://res.cloudinary.com/demo/video/upload/v1/sample.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400',
        thumb: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400',
        cldPublicId: 'sample-yoga-video',
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
        videoUrl: 'https://res.cloudinary.com/demo/video/upload/v1/sample2.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400',
        thumb: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400',
        cldPublicId: 'sample-salad-video',
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
      },
      {
        title: 'Thiền giảm stress 5 phút',
        caption: 'Bài hướng dẫn thiền ngắn giúp giảm căng thẳng',
        categoryId: categoryIds[2],
        videoUrl: 'https://res.cloudinary.com/demo/video/upload/v1/sample3.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400',
        thumb: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400',
        cldPublicId: 'sample-meditation-video',
        viewCount: 210,
        likeCount: 65,
        status: 'published',
        uploadDate: Date.now() - 3 * 24 * 60 * 60 * 1000,
        updatedAt: Date.now(),
        duration: 300,
        width: 1920,
        height: 1080,
        userId: 'admin',
        tags: { thien: true, 'giam-stress': true }
      }
    ];

    for (const video of videos) {
      const newVideoRef = videosRef.push();
      await newVideoRef.set(video);
      console.log(`  ✓ Created: ${video.title} (${newVideoRef.key})`);
    }

    // 4. Tạo Sample Analytics Events
    console.log('\n📊 Tạo analytics events...');
    const analyticsRef = db.ref('analytics');

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

      // Video views
      for (let j = 0; j < Math.floor(Math.random() * 15) + 5; j++) {
        events.push({
          type: 'video_view',
          userId: `user_${Math.floor(Math.random() * 100)}`,
          timestamp: date + Math.random() * 24 * 60 * 60 * 1000,
          data: { videoId: 'sample_video_' + Math.floor(Math.random() * 3) },
          userAgent: 'Mozilla/5.0 (Android 11)'
        });
      }
    }

    console.log(`  Creating ${events.length} events...`);

    // Batch write events for better performance
    const batchSize = 100;
    for (let i = 0; i < events.length; i += batchSize) {
      const batch = events.slice(i, i + batchSize);
      const updates = {};

      for (const event of batch) {
        const newEventRef = analyticsRef.push();
        updates[newEventRef.key] = event;
      }

      await analyticsRef.update(updates);
      console.log(`  ✓ Batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(events.length / batchSize)} (${batch.length} events)`);
    }

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
