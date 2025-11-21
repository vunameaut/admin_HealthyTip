import type { NextApiRequest, NextApiResponse } from 'next';
import { getDatabase } from '@/lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    console.log('📊 Getting statistics...');
    
    // Check if Firebase Admin is properly configured
    if (!process.env.FIREBASE_ADMIN_PROJECT_ID || !process.env.FIREBASE_ADMIN_CLIENT_EMAIL) {
      console.error('❌ Firebase Admin credentials not configured');
      return res.status(500).json({
        success: false,
        error: 'Firebase Admin not configured. Please check environment variables.'
      });
    }
    
    const db = getDatabase();
    
    // Đếm users
    const usersSnapshot = await db.ref('users').once('value');
    const usersData = usersSnapshot.val() || {};
    const totalUsers = Object.keys(usersData).length;
    const usersWithToken = Object.values(usersData).filter((u: any) => u.fcmToken).length;

    // Đếm health tips
    const tipsSnapshot = await db.ref('healthTips').once('value');
    const totalHealthTips = tipsSnapshot.numChildren();

    // Đếm categories
    const categoriesSnapshot = await db.ref('categories').once('value');
    const totalCategories = categoriesSnapshot.numChildren();

    res.json({
      success: true,
      stats: {
        totalUsers,
        usersWithFcmToken: usersWithToken,
        usersWithoutToken: totalUsers - usersWithToken,
        totalHealthTips,
        totalCategories,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('❌ Error getting stats:', error);
    
    // Provide more detailed error information
    const errorMessage = error.code === 'app/invalid-credential' 
      ? 'Invalid Firebase credentials. Please check your service account configuration.'
      : error.message || 'Internal server error';
    
    res.status(500).json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
