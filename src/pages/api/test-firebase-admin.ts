import type { NextApiRequest, NextApiResponse } from 'next';
import { getDatabase, getMessaging } from '@/lib/firebaseAdmin';

/**
 * Test endpoint để kiểm tra Firebase Admin setup
 * GET /api/test-firebase-admin
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    console.log('[test-firebase-admin] Testing Firebase Admin initialization...');
    
    // Test 1: Check environment variables
    const envCheck = {
      hasProjectId: !!process.env.FIREBASE_ADMIN_PROJECT_ID,
      hasClientEmail: !!process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      hasPrivateKey: !!process.env.FIREBASE_ADMIN_PRIVATE_KEY,
      hasDatabaseUrl: !!process.env.FIREBASE_ADMIN_DATABASE_URL,
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      databaseUrl: process.env.FIREBASE_ADMIN_DATABASE_URL,
    };
    
    console.log('[test-firebase-admin] Environment check:', envCheck);
    
    // Test 2: Initialize database
    let dbStatus = 'not-tested';
    try {
      const db = getDatabase();
      dbStatus = db ? 'initialized' : 'failed';
      console.log('[test-firebase-admin] Database status:', dbStatus);
    } catch (error: any) {
      dbStatus = `error: ${error.message}`;
      console.error('[test-firebase-admin] Database error:', error);
    }
    
    // Test 3: Initialize messaging
    let messagingStatus = 'not-tested';
    try {
      const messaging = getMessaging();
      messagingStatus = messaging ? 'initialized' : 'failed';
      console.log('[test-firebase-admin] Messaging status:', messagingStatus);
    } catch (error: any) {
      messagingStatus = `error: ${error.message}`;
      console.error('[test-firebase-admin] Messaging error:', error);
    }
    
    // Test 4: Try to read from database
    let dbReadStatus = 'not-tested';
    try {
      const db = getDatabase();
      const testRef = db.ref('.info/connected');
      const snapshot = await testRef.once('value');
      dbReadStatus = snapshot.exists() ? 'can-read' : 'connected-but-no-data';
      console.log('[test-firebase-admin] Database read status:', dbReadStatus);
    } catch (error: any) {
      dbReadStatus = `error: ${error.message}`;
      console.error('[test-firebase-admin] Database read error:', error);
    }
    
    return res.status(200).json({
      success: true,
      message: 'Firebase Admin test completed',
      checks: {
        environment: envCheck,
        database: dbStatus,
        messaging: messagingStatus,
        databaseRead: dbReadStatus,
      },
      timestamp: new Date().toISOString(),
    });
    
  } catch (error: any) {
    console.error('[test-firebase-admin] Fatal error:', error);
    console.error('[test-firebase-admin] Error stack:', error.stack);
    
    return res.status(500).json({
      success: false,
      error: 'Firebase Admin test failed',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
}
