import type { NextApiRequest, NextApiResponse } from 'next';
import { getDatabase } from '@/lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    console.log(' Getting all users...');
    
    const db = getDatabase();
    const usersSnapshot = await db.ref('users').once('value');
    const usersData = usersSnapshot.val();
    
    if (!usersData) {
      return res.json({
        success: true,
        users: [],
        total: 0
      });
    }

    const users = Object.keys(usersData).map(userId => ({
      uid: userId,
      email: usersData[userId].email || '',
      username: usersData[userId].username || usersData[userId].displayName || 'Unknown',
      photoURL: usersData[userId].photoURL || '',
      hasFcmToken: !!usersData[userId].fcmToken,
      fcmToken: usersData[userId].fcmToken || null,
      createdAt: usersData[userId].createdAt || null,
      lastLogin: usersData[userId].lastLogin || null
    }));

    res.json({
      success: true,
      users: users,
      total: users.length,
      withFcmToken: users.filter(u => u.hasFcmToken).length
    });

  } catch (error: any) {
    console.error(' Error getting users:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
