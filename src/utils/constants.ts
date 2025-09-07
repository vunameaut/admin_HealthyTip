// App configuration
export const APP_CONFIG = {
  name: 'HealthTips Admin',
  version: '1.0.0',
  description: 'Hệ thống quản lý nội dung HealthTips',
  supportEmail: 'support@healthtips.com',
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  allowedVideoTypes: ['video/mp4', 'video/webm', 'video/ogg'],
} as const;

// User roles and permissions
export const USER_ROLES = {
  ADMIN: 'admin',
  EDITOR: 'editor',
  MODERATOR: 'moderator',
  ANALYST: 'analyst',
  VIEWER: 'viewer',
} as const;

export const ROLE_PERMISSIONS = {
  [USER_ROLES.ADMIN]: [
    'users.read',
    'users.write',
    'users.delete',
    'content.read',
    'content.write',
    'content.delete',
    'content.publish',
    'analytics.read',
    'settings.read',
    'settings.write',
    'notifications.read',
    'notifications.write',
  ],
  [USER_ROLES.EDITOR]: [
    'content.read',
    'content.write',
    'content.publish',
    'analytics.read',
    'notifications.read',
  ],
  [USER_ROLES.MODERATOR]: [
    'content.read',
    'content.write',
    'users.read',
    'analytics.read',
  ],
  [USER_ROLES.ANALYST]: [
    'analytics.read',
    'content.read',
    'users.read',
  ],
  [USER_ROLES.VIEWER]: [
    'content.read',
    'analytics.read',
  ],
} as const;

// Content status
export const CONTENT_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
  SCHEDULED: 'scheduled',
} as const;

// Content types
export const CONTENT_TYPES = {
  HEALTH_TIP: 'health_tip',
  SHORT_VIDEO: 'short_video',
  COLLECTION: 'collection',
} as const;

// Cloudinary configuration
export const CLOUDINARY_CONFIG = {
  uploadPresets: {
    images: 'ml_default',
    videos: 'ml_default',
  },
  transformations: {
    thumbnail: 'c_thumb,w_300,h_200,q_auto',
    medium: 'c_scale,w_800,h_600,q_auto',
    large: 'c_scale,w_1200,h_900,q_auto',
    avatar: 'c_thumb,w_100,h_100,q_auto,f_auto',
  },
  videoOptions: {
    quality: 'auto:good',
    format: 'auto',
  },
} as const;

// Firebase collections/refs
export const FIREBASE_REFS = {
  USERS: 'users',
  HEALTH_TIPS: 'healthTips',
  SHORT_VIDEOS: 'shortVideos',
  CATEGORIES: 'categories',
  COLLECTIONS: 'collections',
  REMINDERS: 'reminders',
  FAVORITES: 'favorites',
  ANALYTICS: 'analytics',
  NOTIFICATIONS: 'notifications',
  SETTINGS: 'settings',
} as const;

// Notification types
export const NOTIFICATION_TYPES = {
  PUSH: 'push',
  EMAIL: 'email',
  IN_APP: 'in_app',
} as const;

// Analytics time ranges
export const TIME_RANGES = {
  TODAY: 'today',
  YESTERDAY: 'yesterday',
  LAST_7_DAYS: 'last_7_days',
  LAST_30_DAYS: 'last_30_days',
  LAST_90_DAYS: 'last_90_days',
  THIS_MONTH: 'this_month',
  LAST_MONTH: 'last_month',
  THIS_YEAR: 'this_year',
  CUSTOM: 'custom',
} as const;

// Chart colors
export const CHART_COLORS = {
  primary: '#2196f3',
  secondary: '#f50057',
  success: '#4caf50',
  warning: '#ff9800',
  error: '#f44336',
  info: '#00bcd4',
  light: '#f5f5f5',
  dark: '#212121',
  gradient: [
    '#667eea',
    '#764ba2',
    '#f093fb',
    '#f5576c',
    '#4facfe',
    '#00f2fe',
  ],
} as const;

// Table pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [5, 10, 25, 50, 100],
  MAX_PAGE_SIZE: 100,
} as const;

// Form validation
export const VALIDATION = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN_LENGTH: 6,
  TITLE_MAX_LENGTH: 200,
  CONTENT_MAX_LENGTH: 10000,
  DESCRIPTION_MAX_LENGTH: 500,
  TAG_MAX_LENGTH: 50,
  MAX_TAGS: 10,
} as const;

// Date formats
export const DATE_FORMATS = {
  SHORT: 'dd/MM/yyyy',
  LONG: 'dd/MM/yyyy HH:mm',
  TIME: 'HH:mm',
  ISO: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
} as const;

// Error messages
export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Bạn không có quyền thực hiện hành động này',
  NOT_FOUND: 'Không tìm thấy dữ liệu',
  VALIDATION_FAILED: 'Dữ liệu không hợp lệ',
  UPLOAD_FAILED: 'Upload file thất bại',
  NETWORK_ERROR: 'Lỗi kết nối mạng',
  UNKNOWN_ERROR: 'Có lỗi không xác định xảy ra',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  SAVED: 'Lưu thành công',
  DELETED: 'Xóa thành công',
  UPDATED: 'Cập nhật thành công',
  UPLOADED: 'Upload thành công',
  SENT: 'Gửi thành công',
  COPIED: 'Đã sao chép',
} as const;

// Local storage keys
export const STORAGE_KEYS = {
  THEME: 'healthtips-admin-theme',
  USER_PREFERENCES: 'healthtips-admin-preferences',
  SIDEBAR_STATE: 'healthtips-admin-sidebar',
  TABLE_SETTINGS: 'healthtips-admin-table-settings',
} as const;

// Default values
export const DEFAULT_VALUES = {
  AVATAR_URL: '/images/default-avatar.png',
  THUMBNAIL_URL: '/images/default-thumbnail.png',
  PAGE_SIZE: 10,
  DEBOUNCE_DELAY: 300,
  TOAST_DURATION: 4000,
} as const;
