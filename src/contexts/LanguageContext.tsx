import React, { createContext, useContext, useState, useEffect } from 'react';

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<string, Record<string, string>> = {
  vi: {
    // Dashboard
    'dashboard.title': 'Bảng điều khiển',
    'dashboard.profile': 'Hồ sơ',
    'dashboard.settings': 'Cài đặt',
    'dashboard.statistics': 'Thống kê',
    'dashboard.overview': 'Tổng quan',
    
    // Settings
    'settings.title': 'Cài đặt tài khoản',
    'settings.notifications': 'Thông báo',
    'settings.security': 'Bảo mật',
    'settings.display': 'Hiển thị',
    'settings.save': 'Lưu cài đặt',
    'settings.saved': 'Đã lưu thành công!',
    'settings.language': 'Ngôn ngữ',
    'settings.timezone': 'Múi giờ',
    'settings.dateFormat': 'Định dạng ngày',
    'settings.darkMode': 'Chế độ tối',
    'settings.itemsPerPage': 'Số mục mỗi trang',
    
    // Notifications
    'notifications.email': 'Email',
    'notifications.push': 'Thông báo đẩy',
    'notifications.sms': 'SMS',
    'notifications.newContent': 'Nội dung mới',
    'notifications.userReports': 'Báo cáo người dùng',
    'notifications.systemAlerts': 'Cảnh báo hệ thống',
    'notifications.weeklyDigest': 'Tổng hợp hàng tuần',
    'notifications.settings': 'Cài đặt thông báo',
    'notifications.description': 'Quản lý cách bạn nhận thông báo từ hệ thống',
    'notifications.channels': 'Kênh nhận thông báo',
    'notifications.channelsDesc': 'Chọn cách bạn muốn nhận thông báo',
    'notifications.types': 'Loại thông báo',
    'notifications.typesDesc': 'Chọn loại thông báo bạn muốn nhận',
    
    // Security
    'security.title': 'Bảo mật tài khoản',
    'security.description': 'Tăng cường bảo mật cho tài khoản của bạn',
    'security.loginSecurity': 'Bảo mật đăng nhập',
    'security.loginHistory': 'Lịch sử đăng nhập',
    'security.loginHistoryDesc': 'Lưu và hiển thị lịch sử đăng nhập',
    'security.loginAlerts': 'Cảnh báo đăng nhập',
    'security.loginAlertsDesc': 'Nhận thông báo khi có đăng nhập mới từ thiết bị lạ',
    'security.sessionManagement': 'Quản lý phiên',
    'security.sessionTimeout': 'Thời gian hết phiên',
    'security.sessionTimeoutDesc': 'Tự động đăng xuất sau thời gian không hoạt động',
    'security.password': 'Mật khẩu',
    'security.changePassword': 'Đổi mật khẩu',
    'security.currentPassword': 'Mật khẩu hiện tại',
    'security.newPassword': 'Mật khẩu mới',
    'security.confirmPassword': 'Xác nhận mật khẩu mới',
    
    // Display
    'display.title': 'Tùy chọn hiển thị',
    'display.description': 'Tùy chỉnh giao diện và hiển thị theo sở thích',
    'display.languageRegion': 'Ngôn ngữ và khu vực',
    'display.interface': 'Giao diện',
    'display.dataDisplay': 'Hiển thị dữ liệu',
    
    // Common
    'common.save': 'Lưu',
    'common.cancel': 'Hủy',
    'common.delete': 'Xóa',
    'common.edit': 'Sửa',
    'common.add': 'Thêm',
    'common.search': 'Tìm kiếm',
    'common.filter': 'Lọc',
    'common.export': 'Xuất',
    'common.import': 'Nhập',
    'common.loading': 'Đang tải...',
    'common.error': 'Có lỗi xảy ra',
    'common.success': 'Thành công',
    'common.vietnamese': 'Tiếng Việt',
    'common.english': 'English',
    'common.minutes': 'phút',
  },
  en: {
    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.profile': 'Profile',
    'dashboard.settings': 'Settings',
    'dashboard.statistics': 'Statistics',
    'dashboard.overview': 'Overview',
    
    // Settings
    'settings.title': 'Account Settings',
    'settings.notifications': 'Notifications',
    'settings.security': 'Security',
    'settings.display': 'Display',
    'settings.save': 'Save Settings',
    'settings.saved': 'Saved successfully!',
    'settings.language': 'Language',
    'settings.timezone': 'Timezone',
    'settings.dateFormat': 'Date Format',
    'settings.darkMode': 'Dark Mode',
    'settings.itemsPerPage': 'Items per page',
    
    // Notifications
    'notifications.email': 'Email',
    'notifications.push': 'Push notifications',
    'notifications.sms': 'SMS',
    'notifications.newContent': 'New content',
    'notifications.userReports': 'User reports',
    'notifications.systemAlerts': 'System alerts',
    'notifications.weeklyDigest': 'Weekly digest',
    'notifications.settings': 'Notification Settings',
    'notifications.description': 'Manage how you receive notifications from the system',
    'notifications.channels': 'Notification Channels',
    'notifications.channelsDesc': 'Choose how you want to receive notifications',
    'notifications.types': 'Notification Types',
    'notifications.typesDesc': 'Choose what types of notifications you want to receive',
    
    // Security
    'security.title': 'Account Security',
    'security.description': 'Enhance security for your account',
    'security.loginSecurity': 'Login Security',
    'security.loginHistory': 'Login History',
    'security.loginHistoryDesc': 'Save and display login history',
    'security.loginAlerts': 'Login Alerts',
    'security.loginAlertsDesc': 'Receive notifications when there is a new login from an unknown device',
    'security.sessionManagement': 'Session Management',
    'security.sessionTimeout': 'Session Timeout',
    'security.sessionTimeoutDesc': 'Auto logout after inactivity period',
    'security.password': 'Password',
    'security.changePassword': 'Change Password',
    'security.currentPassword': 'Current Password',
    'security.newPassword': 'New Password',
    'security.confirmPassword': 'Confirm New Password',
    
    // Display
    'display.title': 'Display Preferences',
    'display.description': 'Customize interface and display according to your preferences',
    'display.languageRegion': 'Language & Region',
    'display.interface': 'Interface',
    'display.dataDisplay': 'Data Display',
    
    // Common
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.add': 'Add',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.export': 'Export',
    'common.import': 'Import',
    'common.loading': 'Loading...',
    'common.error': 'An error occurred',
    'common.success': 'Success',
    'common.vietnamese': 'Tiếng Việt',
    'common.english': 'English',
    'common.minutes': 'minutes',
  },
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<string>('vi');

  useEffect(() => {
    // Load language from localStorage
    const savedLang = localStorage.getItem('app_language') || 'vi';
    setLanguageState(savedLang);
  }, []);

  const setLanguage = (lang: string) => {
    setLanguageState(lang);
    localStorage.setItem('app_language', lang);
  };

  const t = (key: string): string => {
    return translations[language]?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
