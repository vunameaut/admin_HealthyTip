import { ref, push, set, get } from 'firebase/database';
import { database } from '@/lib/firebase';

export interface ActivityLog {
  action: string;
  details: string;
  timestamp: number;
  userId: string;
  userEmail?: string;
}

/**
 * Log user activity to Firebase
 */
export const logActivity = async (userId: string, action: string, details: string, userEmail?: string) => {
  try {
    const activityRef = ref(database, `activity_logs/${userId}`);
    const newLogRef = push(activityRef);
    
    await set(newLogRef, {
      action,
      details,
      timestamp: Date.now(),
      userId,
      userEmail,
    });
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};

/**
 * Get user activity logs
 */
export const getUserActivityLogs = async (userId: string, limit: number = 10) => {
  try {
    const logsRef = ref(database, `activity_logs/${userId}`);
    const snapshot = await get(logsRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const logsData = snapshot.val();
    const logs = Object.entries(logsData).map(([id, data]: [string, any]) => ({
      id,
      ...data,
    }));
    
    // Sort by timestamp descending and limit
    return logs
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  } catch (error) {
    console.error('Error getting activity logs:', error);
    return [];
  }
};

/**
 * Clear old activity logs (older than specified days)
 */
export const clearOldActivityLogs = async (userId: string, daysToKeep: number = 30) => {
  try {
    const logsRef = ref(database, `activity_logs/${userId}`);
    const snapshot = await get(logsRef);
    
    if (!snapshot.exists()) {
      return;
    }
    
    const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
    const logsData = snapshot.val();
    
    for (const [id, data] of Object.entries(logsData) as [string, any][]) {
      if (data.timestamp < cutoffTime) {
        const logRef = ref(database, `activity_logs/${userId}/${id}`);
        await set(logRef, null); // Delete old log
      }
    }
  } catch (error) {
    console.error('Error clearing old activity logs:', error);
  }
};
