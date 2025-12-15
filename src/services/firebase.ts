import { ref, push, set, get, update, remove, query, orderByChild, orderByKey, limitToLast, limitToFirst, startAt, endAt, onValue, off, startAfter, DataSnapshot } from 'firebase/database';
import { database } from '../lib/firebase';
import { HealthTip, Category, FirebaseAnalytics, User, ShortVideo, Reminder, FilterOptions, ApiResponse, Media, SupportTicket, SupportMessage } from '../types';

// Pagination result interface
export interface PaginatedResult<T> {
  data: T[];
  nextCursor?: string;
  hasMore: boolean;
  total?: number;
}

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

  /**
   * Get paginated health tips
   * @param pageSize Number of items per page
   * @param cursor Last item key from previous page (for next page)
   * @param orderBy Field to order by (default: 'createdAt')
   */
  async getPaginated(
    pageSize: number = 25,
    cursor?: string,
    orderBy: string = 'createdAt'
  ): Promise<PaginatedResult<HealthTip>> {
    try {
      const tipsRef = ref(database, this.basePath);

      // Build query with pagination
      let tipsQuery;
      if (cursor) {
        // Get next page starting after cursor
        tipsQuery = query(
          tipsRef,
          orderByChild(orderBy),
          startAfter(cursor),
          limitToFirst(pageSize + 1) // Get one extra to check if there's more
        );
      } else {
        // Get first page
        tipsQuery = query(
          tipsRef,
          orderByChild(orderBy),
          limitToFirst(pageSize + 1)
        );
      }

      const snapshot = await get(tipsQuery);

      if (!snapshot.exists()) {
        return { data: [], hasMore: false };
      }

      const tips: HealthTip[] = [];
      snapshot.forEach((child) => {
        tips.push({
          id: child.key!,
          ...child.val()
        });
      });

      // Check if there are more items
      const hasMore = tips.length > pageSize;
      if (hasMore) {
        tips.pop(); // Remove the extra item
      }

      // Get the cursor for next page (last item's key)
      const nextCursor = tips.length > 0 ? tips[tips.length - 1].id : undefined;

      return {
        data: tips,
        nextCursor: hasMore ? nextCursor : undefined,
        hasMore
      };
    } catch (error) {
      console.error('Error fetching paginated health tips:', error);
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

  async getById(id: string): Promise<ShortVideo | null> {
    try {
      const videoRef = ref(database, `${this.basePath}/${id}`);
      const snapshot = await get(videoRef);
      
      if (!snapshot.exists()) return null;
      
      return {
        id,
        ...snapshot.val()
      };
    } catch (error) {
      console.error('Error fetching video:', error);
      throw error;
    }
  }

  async create(video: Omit<ShortVideo, 'id'>): Promise<string> {
    try {
      const videosRef = ref(database, this.basePath);
      const newVideoRef = push(videosRef);
      await set(newVideoRef, video);
      return newVideoRef.key!;
    } catch (error) {
      console.error('Error creating video:', error);
      throw error;
    }
  }

  async update(id: string, video: Partial<ShortVideo>): Promise<void> {
    try {
      const videoRef = ref(database, `${this.basePath}/${id}`);
      await update(videoRef, video);
    } catch (error) {
      console.error('Error updating video:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const videoRef = ref(database, `${this.basePath}/${id}`);
      await remove(videoRef);
    } catch (error) {
      console.error('Error deleting video:', error);
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

  async deleteComment(videoId: string, commentId: string): Promise<void> {
    try {
      const commentRef = ref(database, `${this.basePath}/${videoId}/comments/${commentId}`);
      await remove(commentRef);
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  }

  async updateComment(videoId: string, commentId: string, updates: any): Promise<void> {
    try {
      const commentRef = ref(database, `${this.basePath}/${videoId}/comments/${commentId}`);
      await update(commentRef, updates);
    } catch (error) {
      console.error('Error updating comment:', error);
      throw error;
    }
  }

  /**
   * Get paginated videos
   * @param pageSize Number of items per page
   * @param cursor Last item key from previous page (for next page)
   * @param orderBy Field to order by (default: 'uploadDate')
   */
  async getPaginated(
    pageSize: number = 25,
    cursor?: string,
    orderBy: string = 'uploadDate'
  ): Promise<PaginatedResult<ShortVideo>> {
    try {
      const videosRef = ref(database, this.basePath);

      // Build query with pagination
      let videosQuery;
      if (cursor) {
        // Get next page starting after cursor
        videosQuery = query(
          videosRef,
          orderByChild(orderBy),
          startAfter(cursor),
          limitToFirst(pageSize + 1) // Get one extra to check if there's more
        );
      } else {
        // Get first page
        videosQuery = query(
          videosRef,
          orderByChild(orderBy),
          limitToFirst(pageSize + 1)
        );
      }

      const snapshot = await get(videosQuery);

      if (!snapshot.exists()) {
        return { data: [], hasMore: false };
      }

      const videos: ShortVideo[] = [];
      snapshot.forEach((child) => {
        videos.push({
          id: child.key!,
          ...child.val()
        });
      });

      // Check if there are more items
      const hasMore = videos.length > pageSize;
      if (hasMore) {
        videos.pop(); // Remove the extra item
      }

      // Get the cursor for next page (last item's key)
      const nextCursor = videos.length > 0 ? videos[videos.length - 1].id : undefined;

      return {
        data: videos,
        nextCursor: hasMore ? nextCursor : undefined,
        hasMore
      };
    } catch (error) {
      console.error('Error fetching paginated videos:', error);
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

// Support Tickets Service
export class SupportService {
  private basePath = 'support_tickets';

  async getAll(filters?: { status?: string; issueType?: string }): Promise<SupportTicket[]> {
    try {
      const issuesRef = ref(database, this.basePath);
      const snapshot = await get(issuesRef);

      if (!snapshot.exists()) return [];

      const tickets: SupportTicket[] = [];
      snapshot.forEach((child) => {
        const ticket = child.val();
        tickets.push({
          id: child.key!,
          ...ticket
        });
      });

      // Apply filters
      let filteredTickets = tickets;
      if (filters?.status) {
        filteredTickets = filteredTickets.filter(t => t.status === filters.status);
      }
      if (filters?.issueType) {
        filteredTickets = filteredTickets.filter(t => t.issueType === filters.issueType);
      }

      // Sort by timestamp (newest first)
      return filteredTickets.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Error fetching support tickets:', error);
      throw error;
    }
  }

  async getById(id: string): Promise<SupportTicket | null> {
    try {
      const ticketRef = ref(database, `${this.basePath}/${id}`);
      const snapshot = await get(ticketRef);

      if (!snapshot.exists()) return null;

      return {
        id,
        ...snapshot.val()
      };
    } catch (error) {
      console.error('Error fetching support ticket:', error);
      throw error;
    }
  }

  async updateStatus(id: string, status: 'pending' | 'in_progress' | 'resolved', adminId?: string): Promise<void> {
    try {
      const ticketRef = ref(database, `${this.basePath}/${id}`);
      const updates: any = { status };

      if (adminId) {
        updates.adminId = adminId;
      }

      if (status === 'resolved') {
        updates.respondedAt = Date.now();
      }

      await update(ticketRef, updates);
    } catch (error) {
      console.error('Error updating ticket status:', error);
      throw error;
    }
  }

  async getMessages(ticketId: string): Promise<SupportMessage[]> {
    try {
      const messagesRef = ref(database, `${this.basePath}/${ticketId}/messages`);
      const snapshot = await get(messagesRef);

      if (!snapshot.exists()) return [];

      const messages: SupportMessage[] = [];
      snapshot.forEach((child) => {
        messages.push({
          id: child.key!,
          ...child.val()
        });
      });

      // Sort by timestamp
      return messages.sort((a, b) => a.timestamp - b.timestamp);
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  }

  async sendMessage(ticketId: string, message: Omit<SupportMessage, 'id'>): Promise<string> {
    try {
      const messagesRef = ref(database, `${this.basePath}/${ticketId}/messages`);
      const newMessageRef = push(messagesRef);
      await set(newMessageRef, message);

      // Update ticket status if admin is responding for the first time
      if (message.senderType === 'admin') {
        const ticketRef = ref(database, `${this.basePath}/${ticketId}`);
        const ticketSnapshot = await get(ticketRef);
        const ticket = ticketSnapshot.val();

        if (ticket && ticket.status === 'pending') {
          await this.updateStatus(ticketId, 'in_progress', message.senderId);
        }
      }

      return newMessageRef.key!;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  async getStats(): Promise<{
    total: number;
    pending: number;
    inProgress: number;
    resolved: number;
  }> {
    try {
      const tickets = await this.getAll();

      return {
        total: tickets.length,
        pending: tickets.filter(t => t.status === 'pending').length,
        inProgress: tickets.filter(t => t.status === 'in_progress').length,
        resolved: tickets.filter(t => t.status === 'resolved').length
      };
    } catch (error) {
      console.error('Error getting support stats:', error);
      throw error;
    }
  }

  async clearUnreadUserMessage(ticketId: string): Promise<void> {
    try {
      const ticketRef = ref(database, `${this.basePath}/${ticketId}`);
      await update(ticketRef, { 
        hasUnreadUserMessage: false,
        lastUserMessageAt: null
      });
    } catch (error) {
      console.error('Error clearing unread user message flag:', error);
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
export const supportService = new SupportService();

// Media Service
export class MediaService {
  private basePath = 'media';

  async getAll(filters?: { categoryId?: string; type?: 'image' | 'video'; uploader?: string }): Promise<Media[]> {
    try {
      const mediaRef = ref(database, this.basePath);
      const snapshot = await get(mediaRef);
      
      if (!snapshot.exists()) return [];
      
      const media: Media[] = [];
      snapshot.forEach((child) => {
        const mediaItem = child.val();
        media.push({
          id: child.key!,
          ...mediaItem
        });
      });

      // Apply filters
      let filteredMedia = media;
      if (filters?.categoryId) {
        filteredMedia = filteredMedia.filter(m => m.categoryId === filters.categoryId);
      }
      if (filters?.type) {
        filteredMedia = filteredMedia.filter(m => m.type === filters.type);
      }
      if (filters?.uploader) {
        filteredMedia = filteredMedia.filter(m => m.uploader === filters.uploader);
      }

      return filteredMedia.sort((a, b) => b.uploadDate - a.uploadDate);
    } catch (error) {
      console.error('Error fetching media:', error);
      throw error;
    }
  }

  async getById(id: string): Promise<Media | null> {
    try {
      const mediaRef = ref(database, `${this.basePath}/${id}`);
      const snapshot = await get(mediaRef);
      
      if (!snapshot.exists()) return null;
      
      return {
        id,
        ...snapshot.val()
      };
    } catch (error) {
      console.error('Error fetching media item:', error);
      throw error;
    }
  }

  async create(media: Omit<Media, 'id'>): Promise<string> {
    try {
      const mediaRef = ref(database, this.basePath);
      const newMediaRef = push(mediaRef);
      await set(newMediaRef, {
        ...media,
        uploadDate: media.uploadDate || Date.now(),
        status: media.status || 'ready'
      });
      return newMediaRef.key!;
    } catch (error) {
      console.error('Error creating media:', error);
      throw error;
    }
  }

  async update(id: string, updates: Partial<Media>): Promise<void> {
    try {
      const mediaRef = ref(database, `${this.basePath}/${id}`);
      await update(mediaRef, updates);
    } catch (error) {
      console.error('Error updating media:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const mediaRef = ref(database, `${this.basePath}/${id}`);
      await remove(mediaRef);
    } catch (error) {
      console.error('Error deleting media:', error);
      throw error;
    }
  }

  async getByCategory(categoryId: string): Promise<Media[]> {
    try {
      return this.getAll({ categoryId });
    } catch (error) {
      console.error('Error fetching media by category:', error);
      throw error;
    }
  }
}

export const mediaService = new MediaService();
