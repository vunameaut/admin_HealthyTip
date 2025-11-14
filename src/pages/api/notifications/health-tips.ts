import type { NextApiRequest, NextApiResponse } from 'next';
import { getDatabase, adminAuth } from '@/lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split('Bearer ')[1];
    await adminAuth.verifyIdToken(token);

    // Get health tips from Realtime Database
    const db = getDatabase();
    const snapshot = await db.ref('health_tips').once('value');

    if (!snapshot.exists()) {
      return res.status(200).json({
        success: true,
        healthTips: []
      });
    }

    const healthTips: any[] = [];
    snapshot.forEach((child) => {
      const tip = child.val();
      healthTips.push({
        id: child.key,
        title: tip.title,
        description: tip.description,
        content: tip.content,
        categoryId: tip.categoryId,
        authorId: tip.authorId,
        createdAt: tip.createdAt,
        status: tip.status
      });
    });

    // Sort by createdAt descending
    healthTips.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    // Limit to 100 most recent
    const limitedTips = healthTips.slice(0, 100);

    return res.status(200).json({
      success: true,
      healthTips: limitedTips
    });
  } catch (error: any) {
    console.error('Error fetching health tips:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}
