import type { NextApiRequest, NextApiResponse } from 'next';
import { getDatabase } from '@/lib/firebaseAdmin';

/**
 * API để test xem database có dữ liệu không
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const db = getDatabase();

    // 1. Kiểm tra health tips
    const tipsSnapshot = await db.ref('health_tips').limitToFirst(5).once('value');
    const tips: any[] = [];
    tipsSnapshot.forEach((child) => {
      tips.push({
        id: child.key,
        title: child.val().title,
        categoryName: child.val().categoryName
      });
    });

    // 2. Kiểm tra users
    const usersSnapshot = await db.ref('users').limitToFirst(5).once('value');
    const users: any[] = [];
    usersSnapshot.forEach((child) => {
      users.push({
        uid: child.key,
        email: child.val().email,
        hasFcmToken: !!child.val().fcmToken
      });
    });

    // 3. Kiểm tra analytics
    const analyticsSnapshot = await db.ref('analytics').limitToFirst(10).once('value');
    const analytics: any[] = [];
    analyticsSnapshot.forEach((child) => {
      analytics.push({
        id: child.key,
        ...child.val()
      });
    });

    // 4. Kiểm tra favorites
    const favoritesSnapshot = await db.ref('favorites').limitToFirst(5).once('value');
    const favorites: any[] = [];
    favoritesSnapshot.forEach((child) => {
      const userId = child.key;
      const count = child.numChildren();
      favorites.push({
        userId,
        favoritesCount: count
      });
    });

    res.json({
      success: true,
      data: {
        healthTips: {
          count: tips.length,
          sample: tips
        },
        users: {
          count: users.length,
          sample: users
        },
        analytics: {
          count: analytics.length,
          sample: analytics
        },
        favorites: {
          count: favorites.length,
          sample: favorites
        }
      }
    });

  } catch (error: any) {
    console.error('❌ Error testing data:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: error.code
    });
  }
}
