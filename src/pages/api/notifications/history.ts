import type { NextApiRequest, NextApiResponse } from 'next';
import { getFirestore, adminAuth } from '@/lib/firebaseAdmin';

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

    // Get query parameters for filtering
    const { limit = '50', type, startDate, endDate } = req.query;

    const firestore = getFirestore();
    let query = firestore.collection('notificationHistory')
      .orderBy('timestamp', 'desc');

    // Apply filters
    if (type && type !== 'all') {
      query = query.where('type', '==', type);
    }

    if (startDate) {
      query = query.where('timestamp', '>=', new Date(startDate as string));
    }

    if (endDate) {
      query = query.where('timestamp', '<=', new Date(endDate as string));
    }

    // Apply limit
    query = query.limit(parseInt(limit as string));

    const snapshot = await query.get();

    const notifications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return res.status(200).json({
      success: true,
      notifications,
      total: notifications.length
    });
  } catch (error: any) {
    console.error('Error fetching notification history:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
