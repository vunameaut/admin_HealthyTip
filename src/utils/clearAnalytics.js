// Utility để xóa analytics data
import { ref, remove } from 'firebase/database';
import { database } from '../lib/firebase';

export const clearAllAnalytics = async () => {
  try {
    const analyticsRef = ref(database, 'analytics');
    await remove(analyticsRef);
    console.log('✅ Đã xóa toàn bộ analytics data');
    return { success: true, message: 'Analytics data đã được xóa' };
  } catch (error) {
    console.error('❌ Lỗi khi xóa analytics:', error);
    return { success: false, error: error.message };
  }
};

export const clearAnalyticsByDateRange = async (startDate, endDate) => {
  try {
    const analyticsRef = ref(database, 'analytics');
    const snapshot = await get(analyticsRef);
    
    if (!snapshot.exists()) {
      return { success: true, message: 'Không có data để xóa' };
    }

    const updates = {};
    let deletedCount = 0;

    snapshot.forEach((child) => {
      const data = child.val();
      const timestamp = data.timestamp || data.data?.timestamp;
      
      if (timestamp >= startDate && timestamp <= endDate) {
        updates[child.key] = null; // null để xóa
        deletedCount++;
      }
    });

    if (deletedCount > 0) {
      await update(analyticsRef, updates);
      console.log(`✅ Đã xóa ${deletedCount} analytics records`);
      return { success: true, message: `Đã xóa ${deletedCount} records` };
    }

    return { success: true, message: 'Không có data trong khoảng thời gian này' };
  } catch (error) {
    console.error('❌ Lỗi khi xóa analytics theo date:', error);
    return { success: false, error: error.message };
  }
};
