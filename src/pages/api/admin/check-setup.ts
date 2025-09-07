import type { NextApiRequest, NextApiResponse } from 'next';
import { ref, get } from 'firebase/database';
import { database } from '@/lib/firebase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Kiểm tra xem đã có admin nào trong hệ thống chưa
    const usersRef = ref(database, 'users');
    const usersSnapshot = await get(usersRef);
    const users = usersSnapshot.val() || {};
    
    const hasAdmin = Object.values(users).some((user: any) => user.role === 'admin');
    
    res.status(200).json({ 
      hasAdmin,
      needsSetup: !hasAdmin,
      totalUsers: Object.keys(users).length
    });
  } catch (error) {
    console.error('Error checking admin status:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
