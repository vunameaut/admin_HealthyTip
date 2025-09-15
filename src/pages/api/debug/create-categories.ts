import { NextApiRequest, NextApiResponse } from 'next';
import { ref, set } from 'firebase/database';
import { database } from '../../../lib/firebase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Creating sample categories...');
    
    const categories = [
      {
        id: 'suc-khoe-tong-quat',
        name: 'Sức khỏe tổng quát',
        description: 'Những thông tin về sức khỏe tổng quát',
        createdAt: Date.now(),
        isActive: true,
        order: 0
      },
      {
        id: 'dinh-duong',
        name: 'Dinh dưỡng',
        description: 'Thông tin về dinh dưỡng và chế độ ăn',
        createdAt: Date.now(),
        isActive: true,
        order: 1
      },
      {
        id: 'the-duc',
        name: 'Thể dục',
        description: 'Bài tập thể dục và luyện tập',
        createdAt: Date.now(),
        isActive: true,
        order: 2
      }
    ];

    // Create categories in Firebase
    for (const category of categories) {
      const categoryRef = ref(database, `categories/${category.id}`);
      const { id, ...categoryData } = category;
      await set(categoryRef, categoryData);
      console.log(`Created category: ${category.name}`);
    }

    res.status(200).json({ 
      success: true, 
      message: 'Sample categories created successfully',
      categories
    });

  } catch (error) {
    console.error('Error creating categories:', error);
    res.status(500).json({ 
      error: 'Failed to create categories',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
