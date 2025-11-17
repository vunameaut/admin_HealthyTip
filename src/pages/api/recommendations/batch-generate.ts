import type { NextApiRequest, NextApiResponse } from 'next';
import { getDatabase } from '@/lib/firebaseAdmin';
import axios from 'axios';

/**
 * API endpoint để tạo recommendations cho TẤT CẢ users
 * Dùng cho scheduled tasks hoặc batch processing
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const {
      sendNotifications = false,
      maxUsers = 100, // Giới hạn số users để tránh timeout
      algorithm = 'hybrid'
    } = req.body;

    console.log(`🚀 Starting batch recommendation generation for up to ${maxUsers} users`);

    const db = getDatabase();

    // 1. Lấy tất cả users có FCM token
    const usersSnapshot = await db.ref('users').once('value');
    const users: any[] = [];

    usersSnapshot.forEach((child) => {
      const user = child.val();
      if (user.fcmToken) {
        users.push({
          uid: child.key,
          ...user
        });
      }
    });

    console.log(`📊 Found ${users.length} users with FCM tokens`);

    // 2. Giới hạn số lượng users
    const usersToProcess = users.slice(0, maxUsers);

    // 3. Generate recommendations cho từng user
    const results = {
      total: usersToProcess.length,
      success: 0,
      failed: 0,
      errors: [] as any[]
    };

    for (const user of usersToProcess) {
      try {
        // Import handler function directly instead of making HTTP call
        const generateAutoHandler = require('./generate-auto').default;

        // Create mock request/response objects
        const mockReq = {
          method: 'POST',
          body: {
            userId: user.uid,
            limit: 5,
            sendNotification: sendNotifications,
            algorithm
          }
        } as any;

        let result: any = null;
        const mockRes = {
          status: (code: number) => mockRes,
          json: (data: any) => {
            result = data;
            return mockRes;
          }
        } as any;

        // Call the handler
        await generateAutoHandler(mockReq, mockRes);
        const response = { data: result };

        if (response.data.success) {
          results.success++;
          console.log(`✅ Generated recommendations for user: ${user.uid}`);
        } else {
          results.failed++;
          results.errors.push({
            userId: user.uid,
            error: response.data.error
          });
        }
      } catch (error: any) {
        results.failed++;
        results.errors.push({
          userId: user.uid,
          error: error.message
        });
        console.error(`❌ Error generating recommendations for user ${user.uid}:`, error.message);
      }

      // Delay nhỏ để tránh overload
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // 4. Lưu batch processing log
    await db.ref('recommendation_batch_logs').push({
      timestamp: Date.now(),
      totalUsers: results.total,
      successCount: results.success,
      failureCount: results.failed,
      algorithm,
      sendNotifications,
      errors: results.errors.slice(0, 10) // Chỉ lưu 10 errors đầu tiên
    });

    res.json({
      success: true,
      message: `Batch recommendation generation completed`,
      results: {
        totalUsers: results.total,
        successCount: results.success,
        failureCount: results.failed,
        errorCount: results.errors.length
      },
      errors: results.errors.slice(0, 5) // Trả về 5 errors đầu tiên
    });

  } catch (error: any) {
    console.error('❌ Error in batch recommendation generation:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: error.code
    });
  }
}
