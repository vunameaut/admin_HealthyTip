import { ref, push, set, get, update, remove, query, orderByChild, orderByKey, limitToLast, limitToFirst, startAt, endAt, onValue, off } from 'firebase/database';
import { database } from '../lib/firebase';
import { HealthTip, Category, FirebaseAnalytics, User, ShortVideo, Reminder, FilterOptions, ApiResponse } from '../types';

// Health Tips Service
export class HealthTipsService {
  private basePath = 'health_tips';

  async getAll(filters?: FilterOptions): Promise<HealthTip[]> {
    try {
      const tipsRef = ref(database, this.basePath);
      const snapshot = await get(tipsRef);
      
      if (!snapshot.exists()) return [];
      
      const tips: HealthTip[] = [];
      snapshot.forEach((child) => {
        const tip = child.val();
        tips.push({
          id: child.key!,
          ...tip
        });
      });

      return this.applyFilters(tips, filters);
    } catch (error) {
      console.error('Error fetching health tips:', error);
      throw error;
    }
  }

  async getById(id: string): Promise<HealthTip | null> {
    try {
      const tipRef = ref(database, `${this.basePath}/${id}`);
      const snapshot = await get(tipRef);
      
      if (!snapshot.exists()) return null;
      
      return {
        id,
        ...snapshot.val()
      };
    } catch (error) {
      console.error('Error fetching health tip:', error);
      throw error;
    }
  }

  async create(tip: Omit<HealthTip, 'id'>): Promise<string> {
    try {
      const tipsRef = ref(database, this.basePath);
      const newTipRef = push(tipsRef);
      await set(newTipRef, tip);
      return newTipRef.key!;
    } catch (error) {
      console.error('Error creating health tip:', error);
      throw error;
    }
  }

  async update(id: string, updates: Partial<HealthTip>): Promise<void> {
    try {
      const tipRef = ref(database, `${this.basePath}/${id}`);
      await update(tipRef, updates);
    } catch (error) {
      console.error('Error updating health tip:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const tipRef = ref(database, `${this.basePath}/${id}`);
      await remove(tipRef);
    } catch (error) {
      console.error('Error deleting health tip:', error);
      throw error;
    }
  }

  async incrementViewCount(id: string): Promise<void> {
    try {
      const tipRef = ref(database, `${this.basePath}/${id}/viewCount`);
      const snapshot = await get(tipRef);
      const currentCount = snapshot.val() || 0;
      await set(tipRef, currentCount + 1);
    } catch (error) {
      console.error('Error incrementing view count:', error);
      throw error;
    }
  }

  async getMostViewed(limit: number = 10): Promise<HealthTip[]> {
    try {
      const tips = await this.getAll();
      return tips
        .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
        .slice(0, limit);
    } catch (error) {
      console.error('Error fetching most viewed tips:', error);
      throw error;
    }
  }

  private applyFilters(tips: HealthTip[], filters?: FilterOptions): HealthTip[] {
    if (!filters) return tips;

    return tips.filter(tip => {
      if (filters.category && tip.categoryId !== filters.category) return false;
      if (filters.status && tip.status !== filters.status) return false;
      if (filters.author && tip.author !== filters.author) return false;
      if (filters.tags && filters.tags.length > 0) {
        const tipTags = tip.tags || [];
        if (!filters.tags.some(tag => tipTags.includes(tag))) return false;
      }
      if (filters.dateFrom && tip.createdAt < new Date(filters.dateFrom).getTime()) return false;
      if (filters.dateTo && tip.createdAt > new Date(filters.dateTo).getTime()) return false;
      
      return true;
    });
  }
}

// Categories Service
export class CategoriesService {
  private basePath = 'categories';

  async getAll(): Promise<Category[]> {
    try {
      const categoriesRef = ref(database, this.basePath);
      const snapshot = await get(categoriesRef);
      
      if (!snapshot.exists()) return [];
      
      const categories: Category[] = [];
      snapshot.forEach((child) => {
        categories.push({
          id: child.key!,
          ...child.val()
        });
      });

      return categories.sort((a, b) => (a.order || 0) - (b.order || 0));
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }

  async create(category: Omit<Category, 'id'>): Promise<string> {
    try {
      const categoriesRef = ref(database, this.basePath);
      const newCategoryRef = push(categoriesRef);
      await set(newCategoryRef, {
        ...category,
        createdAt: Date.now(),
        isActive: true
      });
      return newCategoryRef.key!;
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  }

  async update(id: string, updates: Partial<Category>): Promise<void> {
    try {
      const categoryRef = ref(database, `${this.basePath}/${id}`);
      await update(categoryRef, updates);
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const categoryRef = ref(database, `${this.basePath}/${id}`);
      await remove(categoryRef);
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  }
}

// Videos Service
export class VideosService {
  private basePath = 'videos';

  async getAll(filters?: FilterOptions): Promise<ShortVideo[]> {
    try {
      const videosRef = ref(database, this.basePath);
      const snapshot = await get(videosRef);
      
      if (!snapshot.exists()) return [];
      
      const videos: ShortVideo[] = [];
      snapshot.forEach((child) => {
        videos.push({
          id: child.key!,
          ...child.val()
        });
      });

      return videos;
    } catch (error) {
      console.error('Error fetching videos:', error);
      throw error;
    }
  }

  async incrementViewCount(id: string): Promise<void> {
    try {
      const videoRef = ref(database, `${this.basePath}/${id}/viewCount`);
      const snapshot = await get(videoRef);
      const currentCount = snapshot.val() || 0;
      await set(videoRef, currentCount + 1);
    } catch (error) {
      console.error('Error incrementing video view count:', error);
      throw error;
    }
  }
}

// Users Service
export class UsersService {
  private basePath = 'users';

  async getAll(): Promise<User[]> {
    try {
      const usersRef = ref(database, this.basePath);
      const snapshot = await get(usersRef);
      
      if (!snapshot.exists()) return [];
      
      const users: User[] = [];
      snapshot.forEach((child) => {
        users.push({
          uid: child.key!,
          ...child.val()
        });
      });

      return users;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  async getById(uid: string): Promise<User | null> {
    try {
      const userRef = ref(database, `${this.basePath}/${uid}`);
      const snapshot = await get(userRef);
      
      if (!snapshot.exists()) return null;
      
      return {
        uid,
        ...snapshot.val()
      };
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  }

  async updateRole(uid: string, role: User['role']): Promise<void> {
    try {
      const userRef = ref(database, `${this.basePath}/${uid}/role`);
      await set(userRef, role);
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  }

  async updateLastSeen(uid: string): Promise<void> {
    try {
      const userRef = ref(database, `${this.basePath}/${uid}/lastSeen`);
      await set(userRef, Date.now());
    } catch (error) {
      console.error('Error updating last seen:', error);
      throw error;
    }
  }
}

// Analytics Service
export class AnalyticsService {
  private basePath = 'analytics';

  async track(event: Omit<FirebaseAnalytics, 'id'>): Promise<void> {
    try {
      const analyticsRef = ref(database, this.basePath);
      const newEventRef = push(analyticsRef);
      await set(newEventRef, {
        ...event,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Error tracking analytics:', error);
      throw error;
    }
  }

  async getEvents(
    startDate?: Date,
    endDate?: Date,
    eventType?: string
  ): Promise<FirebaseAnalytics[]> {
    try {
      const analyticsRef = ref(database, this.basePath);
      const snapshot = await get(analyticsRef);
      
      if (!snapshot.exists()) return [];
      
      const events: FirebaseAnalytics[] = [];
      snapshot.forEach((child) => {
        const event = child.val();
        events.push({
          id: child.key!,
          ...event
        });
      });

      // Filter by date range and event type
      return events.filter(event => {
        if (startDate && event.timestamp < startDate.getTime()) return false;
        if (endDate && event.timestamp > endDate.getTime()) return false;
        if (eventType && event.type !== eventType) return false;
        return true;
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      throw error;
    }
  }

  async getDashboardStats(): Promise<any> {
    try {
      const [users, tips, videos, analytics] = await Promise.all([
        new UsersService().getAll(),
        new HealthTipsService().getAll(),
        new VideosService().getAll(),
        this.getEvents()
      ]);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayAnalytics = analytics.filter(event => 
        event.timestamp >= today.getTime()
      );

      const activeUsers = users.filter(user => {
        const lastSeen = user.lastSeen || 0;
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        return lastSeen > thirtyDaysAgo;
      });

      return {
        totalUsers: users.length,
        activeUsers: activeUsers.length,
        totalTips: tips.length,
        totalVideos: videos.length,
        totalViews: tips.reduce((sum, tip) => sum + (tip.viewCount || 0), 0),
        todayViews: todayAnalytics.filter(e => e.type === 'content_view').length,
        recentActivity: analytics.slice(-10),
        systemHealth: {
          firebase: true,
          cloudinary: true,
          notifications: true
        }
      };
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      throw error;
    }
  }
}

// Reminders Service
export class RemindersService {
  private basePath = 'reminders';
  private userRemindersPath = 'user_reminders';

  async getUserReminders(userId: string): Promise<Reminder[]> {
    try {
      const userRemindersRef = ref(database, `${this.userRemindersPath}/${userId}`);
      const snapshot = await get(userRemindersRef);
      
      if (!snapshot.exists()) return [];
      
      const reminders: Reminder[] = [];
      snapshot.forEach((child) => {
        reminders.push({
          id: child.key!,
          ...child.val()
        });
      });

      return reminders;
    } catch (error) {
      console.error('Error fetching user reminders:', error);
      throw error;
    }
  }

  async getAllReminders(): Promise<Reminder[]> {
    try {
      const remindersRef = ref(database, this.basePath);
      const snapshot = await get(remindersRef);
      
      if (!snapshot.exists()) return [];
      
      const reminders: Reminder[] = [];
      snapshot.forEach((child) => {
        reminders.push({
          id: child.key!,
          ...child.val()
        });
      });

      return reminders;
    } catch (error) {
      console.error('Error fetching all reminders:', error);
      throw error;
    }
  }
}

// Export service instances
export const healthTipsService = new HealthTipsService();
export const categoriesService = new CategoriesService();
export const videosService = new VideosService();
export const usersService = new UsersService();
export const analyticsService = new AnalyticsService();
export const remindersService = new RemindersService();
