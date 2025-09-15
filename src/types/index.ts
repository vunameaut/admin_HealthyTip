export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoUrl?: string;
  phoneNumber?: string;
  createdAt: number;
  lastLoginAt: number;
  lastSeen?: number;
  isActive: boolean;
  preferences?: Record<string, any>;
  favoriteHealthTips?: Record<string, boolean>;
  likedHealthTips?: Record<string, boolean>;
  role?: 'admin' | 'editor' | 'moderator' | 'analyst' | 'viewer';
}

export interface ContentBlock {
  id: string;
  type: 'text' | 'image' | 'heading' | 'quote';
  value: string;
  metadata?: {
    level?: 1 | 2 | 3 | 4 | 5 | 6; // For headings
    alt?: string; // For images
    caption?: string; // For images
  };
}

export interface HealthTip {
  id: string;
  title: string;
  content: ContentBlock[] | Array<{ type: 'text' | 'image'; value: string; }>; // Support both formats for backward compatibility
  categoryId: string;
  categoryName?: string;
  viewCount: number;
  likeCount: number;
  imageUrl?: string;
  createdAt: number;
  isFavorite?: boolean;
  isLiked?: boolean;
  isFeature?: boolean;
  isPinned?: boolean;
  status?: 'draft' | 'published' | 'archived' | 'review';
  tags?: string[];
  author?: string;
  publishedAt?: number;
  excerpt?: string;
  seoTitle?: string;
  seoDescription?: string;
  scheduledAt?: number;
  slug?: string;
  updatedAt?: number;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  createdAt: number;
  isActive: boolean;
  order?: number;
  color?: string;
}

export interface ShortVideo {
  id: string;
  title: string;
  caption: string;
  uploadDate: number;
  createdAt?: number; // Add createdAt as optional for backward compatibility
  videoUrl: string;
  thumbnailUrl: string;
  cloudinaryPublicId?: string; // For Cloudinary integration
  cldPublicId?: string; // Alternative naming for Cloudinary public ID
  cldVersion?: number; // Cloudinary version for URL generation
  thumb?: string; // Thumbnail URL from data
  categoryId: string;
  tags?: Record<string, boolean>;
  viewCount: number;
  likeCount: number;
  userId: string;
  status?: 'draft' | 'published' | 'archived' | 'processing' | 'failed';
  duration?: number;
  width?: number; // Video dimensions
  height?: number;
  updatedAt?: number; // Add this field
  comments?: Record<string, VideoComment>; // Comments collection
}

export interface VideoComment {
  userId: string;
  username: string;
  userAvatar?: string;
  content: string;
  timestamp: number;
  likes?: number;
  replies?: Record<string, VideoComment>;
  isReported?: boolean;
  reportReason?: string;
}

export interface Reminder {
  id: string;
  userId: string;
  title: string;
  description: string;
  reminderTime: number;
  repeatType: 'none' | 'daily' | 'weekly' | 'monthly';
  isActive: boolean;
  healthTipId?: string;
  createdAt: number;
  updatedAt: number;
  lastNotified?: number;
  completed?: boolean;
}

export interface Favorite {
  id: string;
  userId: string;
  healthTipId: string;
  createdAt: number;
  updatedAt: number;
}

export interface Analytics {
  dailyActiveUsers: number;
  monthlyActiveUsers: number;
  totalUsers: number;
  totalHealthTips: number;
  totalVideos: number;
  topCategories: Array<{
    categoryId: string;
    categoryName: string;
    viewCount: number;
  }>;
  recentActivities: Array<{
    type: 'view' | 'like' | 'favorite';
    contentId: string;
    contentTitle: string;
    userId: string;
    timestamp: number;
  }>;
}

export interface Collection {
  id: string;
  name: string;
  description: string;
  healthTipIds: string[];
  createdAt: number;
  updatedAt: number;
  isPublic: boolean;
  authorId: string;
  imageUrl?: string;
}

export interface AdminRole {
  admin: {
    permissions: string[];
    description: string;
  };
  editor: {
    permissions: string[];
    description: string;
  };
  moderator: {
    permissions: string[];
    description: string;
  };
  analyst: {
    permissions: string[];
    description: string;
  };
  viewer: {
    permissions: string[];
    description: string;
  };
}

// Additional types based on Firebase data structure
export interface FirebaseAnalytics {
  id: string;
  type: 'user_login' | 'page_view' | 'content_view' | 'search' | 'interaction';
  data: {
    userId?: string;
    section?: string;
    contentId?: string;
    query?: string;
  };
  timestamp: number;
  userId?: string;
  userAgent?: string;
  ip?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId?: string;
  message: string;
  timestamp: number;
  type: 'text' | 'image' | 'file';
  isRead?: boolean;
  attachments?: string[];
}

export interface Conversation {
  id: string;
  participants: string[];
  lastMessage?: string;
  lastMessageTime?: number;
  unreadCount?: number;
  type: 'support' | 'feedback' | 'general';
}

export interface SearchHistory {
  userId: string;
  queries: Array<{
    query: string;
    timestamp: number;
    results?: number;
    clicked?: string;
  }>;
}

export interface UserTopics {
  userId: string;
  topics: Record<string, {
    interest: number;
    lastViewed: number;
    viewCount: number;
  }>;
}

export interface TrendingVideo {
  country: string;
  videos: Record<string, {
    id: string;
    title: string;
    viewCount: number;
    likeCount: number;
    trendingScore: number;
    category: string;
  }>;
}

export interface CloudinaryAsset {
  publicId: string;
  url: string;
  secureUrl: string;
  format: string;
  version: number;
  width?: number;
  height?: number;
  bytes?: number;
  createdAt: string;
  folder?: string;
  tags?: string[];
}

export interface Media {
  id: string;
  secure_url: string;
  public_id: string;
  version: string;
  thumbnail_url: string;
  categoryId: string;
  uploadDate: number;
  uploader: string;
  type: 'image' | 'video';
  duration?: number;
  width?: number;
  height?: number;
  original_filename?: string;
  bytes?: number;
  format?: string;
  resource_type?: string;
  tags?: string[];
  folder?: string;
  status?: 'processing' | 'ready' | 'error';
}

export interface MediaUpload {
  file: File;
  type: 'image' | 'video';
  folder?: string;
  tags?: string[];
  transformation?: any;
}

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalTips: number;
  totalVideos: number;
  totalViews: number;
  todayViews: number;
  topCategories: Array<{ id: string; name: string; count: number }>;
  recentActivity: FirebaseAnalytics[];
  systemHealth: {
    firebase: boolean;
    cloudinary: boolean;
    notifications: boolean;
  };
}

export interface FilterOptions {
  category?: string;
  status?: string;
  author?: string;
  dateFrom?: string;
  dateTo?: string;
  tags?: string[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
