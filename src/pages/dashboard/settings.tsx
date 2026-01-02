import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Settings,
  Notifications,
  Security,
  Language,
  Palette,
  VolumeUp,
  Save,
  Edit,
  Delete,
  Add,
  LockReset,
  Email,
  Sms,
  CheckCircle,
} from '@mui/icons-material';
import LayoutWrapper from '../../components/LayoutWrapper';
import AuthGuard, { useCurrentUser } from '../../components/AuthGuard';
import { database } from '@/lib/firebase';
import { ref, update, get } from 'firebase/database';
import toast from 'react-hot-toast';
import { useLanguage } from '@/contexts/LanguageContext';

interface UserSettingsProps {
  darkMode?: boolean;
  toggleDarkMode?: () => void;
}

interface NotificationSettings {
  email: boolean;
  push: boolean;
  sms: boolean;
  newContent: boolean;
  userReports: boolean;
  systemAlerts: boolean;
  weeklyDigest: boolean;
}

interface SecuritySettings {
  loginAlerts: boolean;
  sessionTimeout: number; // minutes
  loginHistory: boolean; // Hiển thị lịch sử đăng nhập
}

interface PreferenceSettings {
  language: string;
  timezone: string;
  dateFormat: string;
  itemsPerPage: number;
}

export default function UserSettingsPage({ darkMode, toggleDarkMode }: UserSettingsProps) {
  const { currentUser } = useCurrentUser();
  const { t, language, setLanguage: setAppLanguage } = useLanguage();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [changePasswordDialog, setChangePasswordDialog] = useState(false);

  const [notifications, setNotifications] = useState<NotificationSettings>({
    email: true,
    push: true,
    sms: false,
    newContent: true,
    userReports: true,
    systemAlerts: true,
    weeklyDigest: false,
  });

  const [security, setSecurity] = useState<SecuritySettings>({
    loginAlerts: true,
    sessionTimeout: 30,
    loginHistory: true,
  });

  const [preferences, setPreferences] = useState<PreferenceSettings>({
    language: 'vi',
    timezone: 'Asia/Ho_Chi_Minh',
    dateFormat: 'DD/MM/YYYY',
    itemsPerPage: 10,
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    loadUserSettings();
  }, [currentUser]);

  const loadUserSettings = async () => {
    if (!currentUser) return;

    try {
      // Load settings from Firebase
      const settingsRef = ref(database, `users/${currentUser.uid}/settings`);
      const snapshot = await get(settingsRef);

      if (snapshot.exists()) {
        const settings = snapshot.val();
        if (settings.notifications) setNotifications(settings.notifications);
        if (settings.security) setSecurity(settings.security);
        if (settings.preferences) setPreferences(settings.preferences);
      } else {
        // Load from localStorage as fallback
        const savedNotifications = localStorage.getItem(`notifications_${currentUser.uid}`);
        const savedSecurity = localStorage.getItem(`security_${currentUser.uid}`);
        const savedPreferences = localStorage.getItem(`preferences_${currentUser.uid}`);

        if (savedNotifications) setNotifications(JSON.parse(savedNotifications));
        if (savedSecurity) setSecurity(JSON.parse(savedSecurity));
        if (savedPreferences) setPreferences(JSON.parse(savedPreferences));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleSaveNotifications = async () => {
    if (!currentUser) {
      toast.error('Vui lòng đăng nhập để lưu cài đặt');
      return;
    }

    try {
      setLoading(true);
      console.log('Saving notifications:', notifications);
      
      // Save to localStorage
      localStorage.setItem(`notifications_${currentUser.uid}`, JSON.stringify(notifications));
      
      // Save to Firebase
      const userRef = ref(database, `users/${currentUser.uid}/settings`);
      await update(userRef, { 
        notifications,
        updatedAt: Date.now()
      });

      // Lưu vào admin profile để tracking
      const adminRef = ref(database, `admins/${currentUser.uid}/notificationSettings`);
      await update(adminRef, {
        ...notifications,
        lastUpdated: new Date().toISOString()
      });

      console.log('Notifications saved successfully');
      toast.success('Cài đặt thông báo đã được lưu thành công!');
    } catch (error) {
      console.error('Error saving notifications:', error);
      toast.error('Có lỗi xảy ra khi lưu cài đặt');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSecurity = async () => {
    if (!currentUser) {
      toast.error('Vui lòng đăng nhập để lưu cài đặt');
      return;
    }

    try {
      setLoading(true);
      console.log('Saving security settings:', security);
      
      // Save to localStorage
      localStorage.setItem(`security_${currentUser.uid}`, JSON.stringify(security));

      // Save to Firebase
      const userRef = ref(database, `users/${currentUser.uid}/settings`);
      await update(userRef, { 
        security,
        updatedAt: Date.now()
      });

      console.log('Security settings saved successfully');
      toast.success('Cài đặt bảo mật đã được lưu thành công');
    } catch (error) {
      console.error('Error saving security:', error);
      toast.error('Có lỗi xảy ra khi lưu cài đặt bảo mật');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    if (!currentUser) {
      toast.error(t('common.error'));
      return;
    }

    try {
      setLoading(true);
      console.log('Saving preferences:', preferences);
      
      // Update app language immediately
      setAppLanguage(preferences.language);
      
      // Save to localStorage
      localStorage.setItem(`preferences_${currentUser.uid}`, JSON.stringify(preferences));
      localStorage.setItem('app_language', preferences.language);
      localStorage.setItem('app_timezone', preferences.timezone);
      localStorage.setItem('app_dateFormat', preferences.dateFormat);

      // Save to Firebase
      const userRef = ref(database, `users/${currentUser.uid}/settings`);
      await update(userRef, { 
        preferences,
        updatedAt: Date.now()
      });

      console.log('Preferences saved successfully');
      const langName = preferences.language === 'vi' ? t('common.vietnamese') : t('common.english');
      toast.success(`${t('settings.saved')} ${t('settings.language')}: ${langName}`);
      
      // Reload page để áp dụng ngôn ngữ mới cho tất cả components
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp!');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error('Mật khẩu phải có ít nhất 6 ký tự!');
      return;
    }

    if (!passwordForm.currentPassword) {
      toast.error('Vui lòng nhập mật khẩu hiện tại!');
      return;
    }

    try {
      setLoading(true);
      
      // Import Firebase Auth functions
      const { auth } = await import('@/lib/firebase');
      const { updatePassword, EmailAuthProvider, reauthenticateWithCredential } = await import('firebase/auth');
      
      const user = auth.currentUser;
      if (user && user.email) {
        // Xác thực lại người dùng với mật khẩu hiện tại
        const credential = EmailAuthProvider.credential(user.email, passwordForm.currentPassword);
        await reauthenticateWithCredential(user, credential);
        
        // Đổi mật khẩu
        await updatePassword(user, passwordForm.newPassword);
        
        toast.success('Đổi mật khẩu thành công!');
        setChangePasswordDialog(false);
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        toast.error('Không tìm thấy thông tin người dùng!');
      }
    } catch (error: any) {
      console.error('Error changing password:', error);
      if (error.code === 'auth/wrong-password') {
        toast.error('Mật khẩu hiện tại không đúng!');
      } else if (error.code === 'auth/requires-recent-login') {
        toast.error('Vui lòng đăng xuất và đăng nhập lại để đổi mật khẩu!');
      } else {
        toast.error('Có lỗi xảy ra khi đổi mật khẩu: ' + (error.message || 'Unknown error'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuard>
      <LayoutWrapper darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
        <Box p={3}>
          {/* Debug Info - Remove in production */}
          {!currentUser && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Đang tải thông tin người dùng...
            </Alert>
          )}
          
          {/* Header */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h4" component="h1" fontWeight="bold">
              {t('settings.title')}
            </Typography>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Paper>
                <Tabs
                  value={tabValue}
                  onChange={(e, newValue) => setTabValue(newValue)}
                  sx={{ borderBottom: 1, borderColor: 'divider' }}
                >
                  <Tab icon={<Notifications />} label={t('settings.notifications')} iconPosition="start" />
                  <Tab icon={<Security />} label={t('settings.security')} iconPosition="start" />
                  <Tab icon={<Palette />} label={t('settings.display')} iconPosition="start" />
                </Tabs>

                {/* Notifications Tab */}
                {tabValue === 0 && (
                  <Box p={3}>
                    <Typography variant="h6" gutterBottom>
                      {t('notifications.settings')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mb={3}>
                      {t('notifications.description')}
                    </Typography>

                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <Card variant="outlined">
                          <CardContent>
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                              Phương thức nhận thông báo
                            </Typography>
                            <List>
                              <ListItem>
                                <ListItemText
                                  primary="Email"
                                  secondary="Nhận thông báo qua email"
                                />
                                <ListItemSecondaryAction>
                                  <Switch
                                    edge="end"
                                    checked={notifications.email}
                                    onChange={(e) =>
                                      setNotifications({ ...notifications, email: e.target.checked })
                                    }
                                  />
                                </ListItemSecondaryAction>
                              </ListItem>
                              <ListItem>
                                <ListItemText
                                  primary="Push Notification"
                                  secondary="Thông báo đẩy trên trình duyệt"
                                />
                                <ListItemSecondaryAction>
                                  <Switch
                                    edge="end"
                                    checked={notifications.push}
                                    onChange={(e) =>
                                      setNotifications({ ...notifications, push: e.target.checked })
                                    }
                                  />
                                </ListItemSecondaryAction>
                              </ListItem>
                              <ListItem>
                                <ListItemText
                                  primary="SMS"
                                  secondary="Nhận thông báo qua tin nhắn SMS"
                                />
                                <ListItemSecondaryAction>
                                  <Switch
                                    edge="end"
                                    checked={notifications.sms}
                                    onChange={(e) =>
                                      setNotifications({ ...notifications, sms: e.target.checked })
                                    }
                                  />
                                </ListItemSecondaryAction>
                              </ListItem>
                            </List>
                          </CardContent>
                        </Card>
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <Card variant="outlined">
                          <CardContent>
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                              Loại thông báo
                            </Typography>
                            <List>
                              <ListItem>
                                <ListItemText
                                  primary="Nội dung mới"
                                  secondary="Khi có bài viết/video mới được tạo"
                                />
                                <ListItemSecondaryAction>
                                  <Switch
                                    edge="end"
                                    checked={notifications.newContent}
                                    onChange={(e) =>
                                      setNotifications({ ...notifications, newContent: e.target.checked })
                                    }
                                  />
                                </ListItemSecondaryAction>
                              </ListItem>
                              <ListItem>
                                <ListItemText
                                  primary="Báo cáo người dùng"
                                  secondary="Khi có báo cáo từ người dùng"
                                />
                                <ListItemSecondaryAction>
                                  <Switch
                                    edge="end"
                                    checked={notifications.userReports}
                                    onChange={(e) =>
                                      setNotifications({ ...notifications, userReports: e.target.checked })
                                    }
                                  />
                                </ListItemSecondaryAction>
                              </ListItem>
                              <ListItem>
                                <ListItemText
                                  primary="Cảnh báo hệ thống"
                                  secondary="Thông báo quan trọng về hệ thống"
                                />
                                <ListItemSecondaryAction>
                                  <Switch
                                    edge="end"
                                    checked={notifications.systemAlerts}
                                    onChange={(e) =>
                                      setNotifications({ ...notifications, systemAlerts: e.target.checked })
                                    }
                                  />
                                </ListItemSecondaryAction>
                              </ListItem>
                              <ListItem>
                                <ListItemText
                                  primary="Tổng hợp hàng tuần"
                                  secondary="Báo cáo tổng hợp mỗi tuần"
                                />
                                <ListItemSecondaryAction>
                                  <Switch
                                    edge="end"
                                    checked={notifications.weeklyDigest}
                                    onChange={(e) =>
                                      setNotifications({ ...notifications, weeklyDigest: e.target.checked })
                                    }
                                  />
                                </ListItemSecondaryAction>
                              </ListItem>
                            </List>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>

                    <Box mt={3} display="flex" justifyContent="flex-end">
                      <Button
                        variant="contained"
                        startIcon={<Save />}
                        onClick={handleSaveNotifications}
                        disabled={loading}
                      >
                        {t('settings.save')}
                      </Button>
                    </Box>
                  </Box>
                )}

                {/* Security Tab */}
                {tabValue === 1 && (
                  <Box p={3}>
                    <Typography variant="h6" gutterBottom>
                      {t('security.title')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mb={3}>
                      {t('security.description')}
                    </Typography>

                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <Card variant="outlined">
                          <CardContent>
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                              {t('security.loginSecurity')}
                            </Typography>
                            <List>
                              <ListItem>
                                <ListItemText
                                  primary={t('security.loginHistory')}
                                  secondary={t('security.loginHistoryDesc')}
                                />
                                <ListItemSecondaryAction>
                                  <Switch
                                    edge="end"
                                    checked={security.loginHistory}
                                    onChange={(e) =>
                                      setSecurity({ ...security, loginHistory: e.target.checked })
                                    }
                                  />
                                </ListItemSecondaryAction>
                              </ListItem>
                              <ListItem>
                                <ListItemText
                                  primary={t('security.loginAlerts')}
                                  secondary={t('security.loginAlertsDesc')}
                                />
                                <ListItemSecondaryAction>
                                  <Switch
                                    edge="end"
                                    checked={security.loginAlerts}
                                    onChange={(e) =>
                                      setSecurity({ ...security, loginAlerts: e.target.checked })
                                    }
                                  />
                                </ListItemSecondaryAction>
                              </ListItem>
                            </List>

                            <Divider sx={{ my: 2 }} />

                            <FormControl fullWidth>
                              <InputLabel>Thời gian tự động đăng xuất</InputLabel>
                              <Select
                                value={security.sessionTimeout}
                                onChange={(e) =>
                                  setSecurity({ ...security, sessionTimeout: Number(e.target.value) })
                                }
                                label="Thời gian tự động đăng xuất"
                              >
                                <MenuItem value={15}>15 phút</MenuItem>
                                <MenuItem value={30}>30 phút</MenuItem>
                                <MenuItem value={60}>1 giờ</MenuItem>
                                <MenuItem value={120}>2 giờ</MenuItem>
                                <MenuItem value={0}>Không giới hạn</MenuItem>
                              </Select>
                            </FormControl>
                          </CardContent>
                        </Card>
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <Card variant="outlined">
                          <CardContent>
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                              Mật khẩu
                            </Typography>
                            <Alert severity="info" sx={{ mb: 2 }}>
                              Nên thay đổi mật khẩu định kỳ để bảo mật tài khoản
                            </Alert>
                            <Button
                              variant="outlined"
                              fullWidth
                              startIcon={<LockReset />}
                              onClick={() => setChangePasswordDialog(true)}
                            >
                              Đổi mật khẩu
                            </Button>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>

                    <Box mt={3} display="flex" justifyContent="flex-end">
                      <Button
                        variant="contained"
                        startIcon={<Save />}
                        onClick={handleSaveSecurity}
                        disabled={loading}
                      >
                        Lưu cài đặt
                      </Button>
                    </Box>
                  </Box>
                )}

                {/* Preferences Tab */}
                {tabValue === 2 && (
                  <Box p={3}>
                    <Typography variant="h6" gutterBottom>
                      {t('display.title')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mb={3}>
                      {t('display.description')}
                    </Typography>

                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <Card variant="outlined">
                          <CardContent>
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                              {t('display.languageRegion')}
                            </Typography>
                            <FormControl fullWidth sx={{ mb: 2 }}>
                              <InputLabel>{t('settings.language')}</InputLabel>
                              <Select
                                value={preferences.language}
                                onChange={(e) =>
                                  setPreferences({ ...preferences, language: e.target.value })
                                }
                                label={t('settings.language')}
                              >
                                <MenuItem value="vi">{t('common.vietnamese')}</MenuItem>
                                <MenuItem value="en">{t('common.english')}</MenuItem>
                              </Select>
                            </FormControl>

                            <FormControl fullWidth sx={{ mb: 2 }}>
                              <InputLabel>{t('settings.timezone')}</InputLabel>
                              <Select
                                value={preferences.timezone}
                                onChange={(e) =>
                                  setPreferences({ ...preferences, timezone: e.target.value })
                                }
                                label={t('settings.timezone')}
                              >
                                <MenuItem value="Asia/Ho_Chi_Minh">Việt Nam (GMT+7)</MenuItem>
                                <MenuItem value="Asia/Tokyo">Tokyo (GMT+9)</MenuItem>
                                <MenuItem value="America/New_York">New York (GMT-5)</MenuItem>
                              </Select>
                            </FormControl>

                            <FormControl fullWidth>
                              <InputLabel>{t('settings.dateFormat')}</InputLabel>
                              <Select
                                value={preferences.dateFormat}
                                onChange={(e) =>
                                  setPreferences({ ...preferences, dateFormat: e.target.value })
                                }
                                label={t('settings.dateFormat')}
                              >
                                <MenuItem value="DD/MM/YYYY">DD/MM/YYYY</MenuItem>
                                <MenuItem value="MM/DD/YYYY">MM/DD/YYYY</MenuItem>
                                <MenuItem value="YYYY-MM-DD">YYYY-MM-DD</MenuItem>
                              </Select>
                            </FormControl>
                          </CardContent>
                        </Card>
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <Card variant="outlined">
                          <CardContent>
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                              {t('display.interface')}
                            </Typography>
                            
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={darkMode}
                                  onChange={toggleDarkMode}
                                />
                              }
                              label={t('settings.darkMode')}
                            />

                            <Divider sx={{ my: 2 }} />

                            <FormControl fullWidth>
                              <InputLabel>Số mục trên mỗi trang</InputLabel>
                              <Select
                                value={preferences.itemsPerPage}
                                onChange={(e) =>
                                  setPreferences({ ...preferences, itemsPerPage: Number(e.target.value) })
                                }
                                label="Số mục trên mỗi trang"
                              >
                                <MenuItem value={10}>10</MenuItem>
                                <MenuItem value={25}>25</MenuItem>
                                <MenuItem value={50}>50</MenuItem>
                                <MenuItem value={100}>100</MenuItem>
                              </Select>
                            </FormControl>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>

                    <Box mt={3} display="flex" justifyContent="flex-end">
                      <Button
                        variant="contained"
                        startIcon={<Save />}
                        onClick={handleSavePreferences}
                        disabled={loading}
                      >
                        {t('settings.save')}
                      </Button>
                    </Box>
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>

          {/* Change Password Dialog */}
          <Dialog open={changePasswordDialog} onClose={() => setChangePasswordDialog(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Đổi mật khẩu</DialogTitle>
            <DialogContent>
              <TextField
                fullWidth
                type="password"
                label="Mật khẩu hiện tại"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                sx={{ mb: 2, mt: 1 }}
              />
              <TextField
                fullWidth
                type="password"
                label="Mật khẩu mới"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                type="password"
                label="Xác nhận mật khẩu mới"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setChangePasswordDialog(false)}>Hủy</Button>
              <Button variant="contained" onClick={handleChangePassword} disabled={loading}>
                Đổi mật khẩu
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </LayoutWrapper>
    </AuthGuard>
  );
}
