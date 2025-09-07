import type { NextApiRequest, NextApiResponse } from 'next';
import { ref, set, get } from 'firebase/database';
import { database } from '@/lib/firebase';

// API này chỉ nên sử dụng để tạo admin đầu tiên
// Sau đó nên disable hoặc xóa để bảo mật
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { uid, email, displayName } = req.body;

    if (!uid || !email || !displayName) {
      return res.status(400).json({ 
        message: 'UID, email and displayName are required' 
      });
    }

    // Kiểm tra xem đã có admin nào chưa
    const usersRef = ref(database, 'users');
    const usersSnapshot = await get(usersRef);
    const users = usersSnapshot.val() || {};
    
    const hasAdmin = Object.values(users).some((user: any) => user.role === 'admin');
    
    if (hasAdmin) {
      return res.status(403).json({ 
        message: 'Admin already exists. This endpoint is disabled for security.' 
      });
    }

    // Tạo user admin mới
    const adminData = {
      uid,
      email,
      displayName,
      role: 'admin',
      createdAt: Date.now(),
      lastLoginAt: Date.now(),
      isActive: true,
      preferences: {},
      favoriteHealthTips: {},
      likedHealthTips: {}
    };

    const userRef = ref(database, `users/${uid}`);
    await set(userRef, adminData);

    res.status(200).json({ 
      message: 'Admin user created successfully',
      admin: {
        uid,
        email,
        displayName,
        role: 'admin'
      }
    });
  } catch (error) {
    console.error('Error creating admin user:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
