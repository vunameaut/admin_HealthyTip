const { ref, set, push } = require('firebase/database');
const { database } = require('../lib/firebase');

// Sample data for testing
export const createSampleData = async () => {
  try {
    console.log('Creating sample data...');
    
    // Create sample health tips
    const healthTipsRef = ref(database, 'health_tips');
    
    const sampleTips = [
      {
        title: 'Lợi ích của việc uống nước',
        content: 'Uống đủ nước mỗi ngày giúp cơ thể hoạt động tốt hơn...',
        summary: 'Tầm quan trọng của việc uống nước đối với sức khỏe',
        category: 'Dinh dưỡng',
        tags: ['nước', 'sức khỏe', 'dinh dưỡng'],
        author: 'Admin',
        status: 'published',
        isFeature: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        viewCount: 0,
        likeCount: 0
      },
      {
        title: 'Tập thể dục hàng ngày',
        content: 'Tập thể dục 30 phút mỗi ngày giúp tăng cường sức khỏe...',
        summary: 'Hướng dẫn tập thể dục hiệu quả',
        category: 'Thể dục',
        tags: ['thể dục', 'sức khỏe', 'vận động'],
        author: 'Admin',
        status: 'published',
        isFeature: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        viewCount: 0,
        likeCount: 0
      }
    ];
    
    // Add each tip
    for (const tip of sampleTips) {
      const newTipRef = push(healthTipsRef);
      await set(newTipRef, tip);
      console.log('Created tip:', tip.title);
    }
    
    // Create sample categories
    const categoriesRef = ref(database, 'categories');
    const sampleCategories = [
      {
        name: 'Dinh dưỡng',
        description: 'Các bài viết về dinh dưỡng và ăn uống',
        color: '#4caf50',
        order: 1,
        isActive: true
      },
      {
        name: 'Thể dục',
        description: 'Các bài viết về tập luyện và vận động',
        color: '#2196f3',
        order: 2,
        isActive: true
      },
      {
        name: 'Tinh thần',
        description: 'Các bài viết về sức khỏe tinh thần',
        color: '#ff9800',
        order: 3,
        isActive: true
      }
    ];
    
    for (const category of sampleCategories) {
      const newCategoryRef = push(categoriesRef);
      await set(newCategoryRef, category);
      console.log('Created category:', category.name);
    }
    
    console.log('Sample data created successfully!');
    return true;
    
  } catch (error) {
    console.error('Error creating sample data:', error);
    return false;
  }
};

module.exports = { createSampleData };
