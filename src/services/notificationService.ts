import axios from 'axios';
import { auth } from '@/lib/firebase';

const API_BASE_URL = '/api';

// Axios instance with auth token interceptor
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add auth token to all requests
apiClient.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface User {
  uid: string;
  email: string;
  username: string;
  photoURL?: string;
  hasFcmToken: boolean;
  fcmToken?: string;
  createdAt?: string;
  lastLogin?: string;
}

export interface Stats {
  totalUsers: number;
  usersWithFcmToken: number;
  usersWithoutToken: number;
  totalHealthTips: number;
  totalCategories: number;
  timestamp: string;
}

export interface BroadcastRequest {
  title: string;
  body: string;
  data?: Record<string, any>;
  excludeUserIds?: string[];
}

export interface SendToUserRequest {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

export interface NotificationResponse {
  success: boolean;
  message?: string;
  sentCount?: number;
  failureCount?: number;
  totalTokens?: number;
  failedTokens?: any[];
  messageId?: string;
  recipient?: string;
  error?: string;
}

export interface NewHealthTipRequest {
  healthTipId: string;
  title?: string;
  body?: string;
  authorId?: string;
  category?: string;
  excludeUserIds?: string[];
}


export interface RecommendationRequest {
  userId: string;
  healthTipId: string;
  title?: string;
  body?: string;
  reason?: string;
}

export interface CustomNotificationRequest {
  title: string;
  body: string;
  userId?: string; // If empty, send to all
  data?: Record<string, any>;
}

export interface HealthTip {
  id: string;
  title: string;
  description?: string;
  content?: string;
  categoryId?: string;
  authorId?: string;
  createdAt?: any;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
}

export interface NotificationHistory {
  id: string;
  type: 'new_health_tip' | 'comment_reply' | 'recommendation' | 'custom' | 'broadcast';
  title: string;
  body: string;
  data?: Record<string, any>;
  sentTo: string[] | 'all';
  sentCount: number;
  failureCount: number;
  timestamp: any;
  sentBy?: string;
  status: 'success' | 'partial' | 'failed';
}

class NotificationService {
  // Lấy danh sách users
  async getUsers(): Promise<{ success: boolean; users: User[]; total: number; withFcmToken: number }> {
    const response = await apiClient.get('/notifications/users');
    return response.data;
  }

  // Lấy thống kê
  async getStats(): Promise<{ success: boolean; stats: Stats }> {
    const response = await apiClient.get('/notifications/stats');
    return response.data;
  }

  // Gửi broadcast
  async sendBroadcast(data: BroadcastRequest): Promise<NotificationResponse> {
    const response = await apiClient.post('/notifications/broadcast', data);
    return response.data;
  }

  // Gửi đến 1 user
  async sendToUser(data: SendToUserRequest): Promise<NotificationResponse> {
    const response = await apiClient.post('/notifications/send-to-user', data);
    return response.data;
  }

  // Gửi thông báo bài viết mới
  async sendNewHealthTip(data: NewHealthTipRequest): Promise<NotificationResponse> {
    const response = await apiClient.post('/notifications/send-new-health-tip', data);
    return response.data;
  }

  // Gửi đề xuất
  async sendRecommendation(data: RecommendationRequest): Promise<NotificationResponse> {
    const response = await apiClient.post('/notifications/send-recommendation', data);
    return response.data;
  }

  // Gửi thông báo tùy chỉnh
  async sendCustomNotification(data: CustomNotificationRequest): Promise<NotificationResponse> {
    const response = await apiClient.post('/notifications/send-custom', data);
    return response.data;
  }

  // Lấy lịch sử thông báo
  async getHistory(filters?: {
    limit?: number;
    type?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ success: boolean; notifications: NotificationHistory[]; total: number }> {
    const params = new URLSearchParams();
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.type) params.append('type', filters.type);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const response = await apiClient.get(`/notifications/history?${params.toString()}`);
    return response.data;
  }

  // Lấy danh sách health tips
  async getHealthTips(): Promise<{ success: boolean; healthTips: HealthTip[] }> {
    const response = await apiClient.get('/notifications/health-tips');
    return response.data;
  }

  // Lấy danh sách categories
  async getCategories(): Promise<{ success: boolean; categories: Category[] }> {
    const response = await apiClient.get('/notifications/categories');
    return response.data;
  }

  // Test connection
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.get('/notifications/stats');
      return { success: true, message: 'Connected to backend server' };
    } catch (error) {
      return { success: false, message: 'Cannot connect to backend server' };
    }
  }
}

export default new NotificationService();
