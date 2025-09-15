import { NextApiRequest, NextApiResponse } from 'next';
import { ref, get } from 'firebase/database';
import { database } from '../../../lib/firebase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Checking categories in Firebase...');
    
    const categoriesRef = ref(database, 'categories');
    const snapshot = await get(categoriesRef);
    
    if (snapshot.exists()) {
      const categories: any[] = [];
      snapshot.forEach((childSnapshot) => {
        categories.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });
      
      console.log('Categories found:', categories);
      res.status(200).json({ 
        success: true, 
        categories,
        count: categories.length 
      });
    } else {
      console.log('No categories found');
      res.status(200).json({ 
        success: true, 
        categories: [],
        count: 0,
        message: 'No categories found' 
      });
    }
  } catch (error) {
    console.error('Error checking categories:', error);
    res.status(500).json({ 
      error: 'Failed to check categories',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
