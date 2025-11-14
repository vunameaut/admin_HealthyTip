import * as admin from 'firebase-admin';

export function getFirebaseAdmin() {
  // Kiểm tra xem đã có app chưa
  if (admin.apps.length > 0) {
    return admin.apps[0] as admin.app.App;
  }

  try {
    let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY || '';
    
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.slice(1, -1);
    }
    
    privateKey = privateKey.replace(/\\n/g, '\n');

    const serviceAccount = {
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: privateKey,
    };

    if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
      throw new Error('Missing Firebase Admin credentials in environment variables');
    }

    const app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      databaseURL: process.env.FIREBASE_ADMIN_DATABASE_URL,
    });

    console.log(' Firebase Admin initialized successfully');
    return app;
  } catch (error) {
    console.error(' Firebase Admin initialization failed:', error);
    throw error;
  }
}

export function getDatabase() {
  const app = getFirebaseAdmin();
  return app.database();
}

export function getMessaging() {
  const app = getFirebaseAdmin();
  return app.messaging();
}

export function getFirestore() {
  const app = getFirebaseAdmin();
  return app.firestore();
}

// Helper function to save notification history
export async function saveNotificationHistory(data: {
  type: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  sentTo: string[] | 'all';
  sentCount: number;
  failureCount: number;
  status: 'success' | 'partial' | 'failed';
  sentBy?: string;
}) {
  try {
    const firestore = getFirestore();
    const historyRef = firestore.collection('notificationHistory');
    const docRef = await historyRef.add({
      ...data,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: new Date().toISOString()
    });
    console.log('💾 Notification history saved:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error saving notification history:', error);
    return null;
  }
}

export const adminAuth = getFirebaseAdmin().auth();

export default getFirebaseAdmin;
