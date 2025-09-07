import type { NextApiRequest, NextApiResponse } from 'next';
import { ref, update } from 'firebase/database';
import { database } from '@/lib/firebase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { uid } = req.body;

    if (!uid) {
      return res.status(400).json({ message: 'UID is required' });
    }

    const userRef = ref(database, `users/${uid}`);
    await update(userRef, {
      lastLoginAt: Date.now(),
    });

    res.status(200).json({ message: 'Last login updated successfully' });
  } catch (error) {
    console.error('Error updating last login:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
