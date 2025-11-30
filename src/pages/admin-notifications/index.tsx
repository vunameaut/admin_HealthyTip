import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Button,
  Tabs,
  Tab,
  Badge,
  Divider,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import {
  Notifications,
  Warning,
  Report,
  CheckCircle,
  Error,
  Info,
  PersonAdd,
  TrendingUp,
  Security,
  Delete,
  MarkEmailRead,
  MarkEmailUnread,
  FilterList,
  Refresh,
  BugReport,
  Feedback,
  ContentCopy,
  VideoLibrary,
  Article,
} from '@mui/icons-material';
import LayoutWrapper from '../../components/LayoutWrapper';
import AuthGuard from '../../components/AuthGuard';
import { database } from '../../lib/firebase';
import { ref, onValue, query, orderByChild, limitToLast, update, remove, get } from 'firebase/database';
import toast from 'react-hot-toast';
import { useRouter } from 'next/router';

interface AdminNotification {
  id: string;
  type: 'USER_REPORT' | 'CONTENT_PENDING' | 'CONTENT_FLAGGED' | 'NEW_USER' |
        'SYSTEM_ERROR' | 'HIGH_ENGAGEMENT' | 'SECURITY_ALERT' | 'DATA_INTEGRITY' | 'USER_FEEDBACK';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  resolved: boolean;
  createdAt: number;
  createdBy?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  actionUrl?: string;
}

interface AdminNotificationsPageProps {
  darkMode?: boolean;
  toggleDarkMode?: () => void;
}

export default function AdminNotificationsPage({ darkMode, toggleDarkMode }: AdminNotificationsPageProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0); // 0: All, 1: Unread, 2: High Priority
  const [selectedNotification, setSelectedNotification] = useState<AdminNotification | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [filterAnchor, setFilterAnchor] = useState<null | HTMLElement>(null);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [responseDialogOpen, setResponseDialogOpen] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = () => {
    setLoading(true);
    const notificationsRef = ref(database, 'admin_notifications');
    const notificationsQuery = query(notificationsRef, orderByChild('createdAt'), limitToLast(100));

    const unsubscribe = onValue(notificationsQuery, (snapshot) => {
      if (snapshot.exists()) {
        const notificationsData: AdminNotification[] = [];
        snapshot.forEach((child) => {
          notificationsData.push({
            id: child.key!,
            ...child.val()
          });
        });
        // Sort by createdAt descending (newest first)
        notificationsData.sort((a, b) => b.createdAt - a.createdAt);
        setNotifications(notificationsData);
      } else {
        setNotifications([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  };

  const handleMarkAsRead = async (notificationId: string, read: boolean) => {
    try {
      const notificationRef = ref(database, `admin_notifications/${notificationId}`);
      await update(notificationRef, { read });
      toast.success(read ? 'Đã đánh dấu đã đọc' : 'Đã đánh dấu chưa đọc');
    } catch (error) {
      console.error('Error updating notification:', error);
      toast.error('Có lỗi xảy ra');
    }
  };

  const handleMarkAsResolved = async (notificationId: string) => {
    try {
      const notificationRef = ref(database, `admin_notifications/${notificationId}`);
      await update(notificationRef, { resolved: true, read: true });
      toast.success('Đã đánh dấu đã xử lý');
      setDetailsOpen(false);
    } catch (error) {
      console.error('Error resolving notification:', error);
      toast.error('Có lỗi xảy ra');
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa thông báo này?')) return;

    try {
      const notificationRef = ref(database, `admin_notifications/${notificationId}`);
      await remove(notificationRef);
      toast.success('Đã xóa thông báo');
      setDetailsOpen(false);
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Có lỗi xảy ra');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const updates: any = {};
      notifications.filter(n => !n.read).forEach(notification => {
        updates[`admin_notifications/${notification.id}/read`] = true;
      });
      await update(ref(database), updates);
      toast.success('Đã đánh dấu tất cả đã đọc');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Có lỗi xảy ra');
    }
  };

  const handleViewDetails = (notification: AdminNotification) => {
    setSelectedNotification(notification);
    setDetailsOpen(true);
    if (!notification.read) {
      handleMarkAsRead(notification.id, true);
    }
  };

  const handleActionClick = (notification: AdminNotification) => {
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
  };

  const handleSendResponse = async () => {
    if (!selectedNotification || !responseMessage.trim()) {
      toast.error('Vui lòng nhập nội dung phản hồi');
      return;
    }

    try {
      // Extract userId from various possible locations in the notification data
      const userId = selectedNotification.data?.userId ||
                     selectedNotification.data?.createdBy ||
                     selectedNotification.createdBy;

      if (!userId) {
        console.error('Cannot find userId in notification:', selectedNotification);
        toast.error('Không tìm thấy thông tin người dùng trong thông báo');
        return;
      }

      const response = await fetch('/api/admin-notifications/send-response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          notificationId: selectedNotification.id,
          responseMessage,
          adminName: 'Admin', // You can get this from auth context
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error('API Error:', responseData);
        const errorMsg = String(responseData.error || responseData.message || `HTTP ${response.status}`);
        throw { message: errorMsg };
      }

      toast.success('Đã gửi phản hồi đến người dùng');
      setResponseDialogOpen(false);
      setResponseMessage('');
      setDetailsOpen(false);

      // Mark notification as resolved
      await handleMarkAsResolved(selectedNotification.id);
    } catch (error: any) {
      console.error('Error sending response:', error);
      toast.error(`Không thể gửi phản hồi: ${error.message || 'Lỗi không xác định'}`);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'USER_REPORT': return <Report color="error" />;
      case 'CONTENT_PENDING': return <Article color="warning" />;
      case 'CONTENT_FLAGGED': return <Warning color="warning" />;
      case 'NEW_USER': return <PersonAdd color="info" />;
      case 'SYSTEM_ERROR': return <Error color="error" />;
      case 'HIGH_ENGAGEMENT': return <TrendingUp color="success" />;
      case 'SECURITY_ALERT': return <Security color="error" />;
      case 'DATA_INTEGRITY': return <BugReport color="warning" />;
      case 'USER_FEEDBACK': return <Feedback color="info" />;
      default: return <Notifications />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'USER_REPORT': return '#f44336';
      case 'CONTENT_PENDING': return '#ff9800';
      case 'CONTENT_FLAGGED': return '#ff9800';
      case 'NEW_USER': return '#2196f3';
      case 'SYSTEM_ERROR': return '#f44336';
      case 'HIGH_ENGAGEMENT': return '#4caf50';
      case 'SECURITY_ALERT': return '#f44336';
      case 'DATA_INTEGRITY': return '#ff9800';
      case 'USER_FEEDBACK': return '#2196f3';
      default: return '#9e9e9e';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'default';
      default: return 'default';
    }
  };

  const getFilteredNotifications = () => {
    let filtered = notifications;

    // Filter by tab
    if (tabValue === 1) {
      filtered = filtered.filter(n => !n.read);
    } else if (tabValue === 2) {
      filtered = filtered.filter(n => n.priority === 'high' || n.priority === 'critical');
    } else if (tabValue === 3) {
      filtered = filtered.filter(n => n.resolved);
    }

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(n => n.type === selectedType);
    }

    return filtered;
  };

  const filteredNotifications = getFilteredNotifications();
  const unreadCount = notifications.filter(n => !n.read).length;
  const highPriorityCount = notifications.filter(n => (n.priority === 'high' || n.priority === 'critical') && !n.resolved).length;
  const resolvedCount = notifications.filter(n => n.resolved).length;

  return (
    <AuthGuard>
      <LayoutWrapper darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
        <Box p={3}>
          {/* Header */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h4" component="h1" fontWeight="bold">
              Thông báo Admin
            </Typography>
            <Box display="flex" gap={1}>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={() => loadNotifications()}
              >
                Làm mới
              </Button>
              <Button
                variant="outlined"
                startIcon={<MarkEmailRead />}
                onClick={handleMarkAllAsRead}
                disabled={unreadCount === 0}
              >
                Đánh dấu tất cả đã đọc
              </Button>
              <IconButton onClick={(e) => setFilterAnchor(e.currentTarget)}>
                <FilterList />
              </IconButton>
            </Box>
          </Box>

          {/* Filter Menu */}
          <Menu
            anchorEl={filterAnchor}
            open={Boolean(filterAnchor)}
            onClose={() => setFilterAnchor(null)}
          >
            <MenuItem onClick={() => { setSelectedType('all'); setFilterAnchor(null); }}>
              Tất cả loại
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => { setSelectedType('USER_REPORT'); setFilterAnchor(null); }}>
              Báo cáo từ User
            </MenuItem>
            <MenuItem onClick={() => { setSelectedType('CONTENT_PENDING'); setFilterAnchor(null); }}>
              Nội dung cần duyệt
            </MenuItem>
            <MenuItem onClick={() => { setSelectedType('CONTENT_FLAGGED'); setFilterAnchor(null); }}>
              Nội dung bị đánh dấu
            </MenuItem>
            <MenuItem onClick={() => { setSelectedType('NEW_USER'); setFilterAnchor(null); }}>
              User mới
            </MenuItem>
            <MenuItem onClick={() => { setSelectedType('SYSTEM_ERROR'); setFilterAnchor(null); }}>
              Lỗi hệ thống
            </MenuItem>
            <MenuItem onClick={() => { setSelectedType('HIGH_ENGAGEMENT'); setFilterAnchor(null); }}>
              Nội dung viral
            </MenuItem>
            <MenuItem onClick={() => { setSelectedType('SECURITY_ALERT'); setFilterAnchor(null); }}>
              Cảnh báo bảo mật
            </MenuItem>
            <MenuItem onClick={() => { setSelectedType('USER_FEEDBACK'); setFilterAnchor(null); }}>
              Phản hồi User
            </MenuItem>
          </Menu>

          {loading && <LinearProgress sx={{ mb: 2 }} />}

          {/* Stats */}
          <Grid container spacing={3} mb={3}>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                      <Notifications />
                    </Avatar>
                    <Box>
                      <Typography color="text.secondary" variant="body2">
                        Tổng thông báo
                      </Typography>
                      <Typography variant="h4" fontWeight="bold">
                        {notifications.length}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar sx={{ bgcolor: 'warning.main', width: 56, height: 56 }}>
                      <MarkEmailUnread />
                    </Avatar>
                    <Box>
                      <Typography color="text.secondary" variant="body2">
                        Chưa đọc
                      </Typography>
                      <Typography variant="h4" fontWeight="bold">
                        {unreadCount}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar sx={{ bgcolor: 'error.main', width: 56, height: 56 }}>
                      <Warning />
                    </Avatar>
                    <Box>
                      <Typography color="text.secondary" variant="body2">
                        Ưu tiên cao
                      </Typography>
                      <Typography variant="h4" fontWeight="bold">
                        {highPriorityCount}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar sx={{ bgcolor: 'success.main', width: 56, height: 56 }}>
                      <CheckCircle />
                    </Avatar>
                    <Box>
                      <Typography color="text.secondary" variant="body2">
                        Đã xử lý
                      </Typography>
                      <Typography variant="h4" fontWeight="bold">
                        {resolvedCount}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Tabs */}
          <Card sx={{ mb: 2 }}>
            <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
              <Tab label={`Tất cả (${notifications.length})`} />
              <Tab
                label={
                  <Badge badgeContent={unreadCount} color="error">
                    Chưa đọc
                  </Badge>
                }
              />
              <Tab
                label={
                  <Badge badgeContent={highPriorityCount} color="warning">
                    Ưu tiên cao
                  </Badge>
                }
              />
              <Tab label={`Đã xử lý (${resolvedCount})`} />
            </Tabs>
          </Card>

          {/* Notifications List */}
          <Card>
            <CardContent>
              {filteredNotifications.length === 0 ? (
                <Box textAlign="center" py={4}>
                  <Notifications sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Không có thông báo
                  </Typography>
                  <Typography color="text.secondary">
                    {tabValue === 1 ? 'Bạn đã đọc tất cả thông báo' : 'Chưa có thông báo nào'}
                  </Typography>
                </Box>
              ) : (
                <List>
                  {filteredNotifications.map((notification, index) => (
                    <React.Fragment key={notification.id}>
                      <ListItem
                        alignItems="flex-start"
                        sx={{
                          cursor: 'pointer',
                          backgroundColor: notification.read ? 'transparent' : 'action.hover',
                          borderLeft: notification.read ? 'none' : `4px solid ${getNotificationColor(notification.type)}`,
                          '&:hover': {
                            backgroundColor: 'action.selected',
                          },
                          opacity: notification.resolved ? 0.6 : 1,
                        }}
                        secondaryAction={
                          <Box display="flex" gap={1}>
                            <Tooltip title={notification.read ? 'Đánh dấu chưa đọc' : 'Đánh dấu đã đọc'}>
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkAsRead(notification.id, !notification.read);
                                }}
                              >
                                {notification.read ? <MarkEmailUnread /> : <MarkEmailRead />}
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Xóa">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteNotification(notification.id);
                                }}
                              >
                                <Delete />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        }
                        onClick={() => handleViewDetails(notification)}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: getNotificationColor(notification.type) }}>
                            {getNotificationIcon(notification.type)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                              <Typography variant="subtitle1" fontWeight={notification.read ? 'normal' : 'bold'}>
                                {notification.title}
                              </Typography>
                              <Chip
                                label={notification.priority}
                                size="small"
                                color={getPriorityColor(notification.priority) as any}
                              />
                              {notification.resolved && (
                                <Chip
                                  label="Đã xử lý"
                                  size="small"
                                  color="success"
                                  icon={<CheckCircle />}
                                />
                              )}
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                {notification.message}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {new Date(notification.createdAt).toLocaleString('vi-VN')}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < filteredNotifications.length - 1 && <Divider variant="inset" component="li" />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>

          {/* Details Dialog */}
          <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="md" fullWidth>
            <DialogTitle>
              <Box display="flex" alignItems="center" gap={1}>
                {selectedNotification && getNotificationIcon(selectedNotification.type)}
                <Typography variant="h6">
                  Chi tiết thông báo
                </Typography>
              </Box>
            </DialogTitle>
            <DialogContent>
              {selectedNotification && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    {selectedNotification.title}
                  </Typography>

                  <Box display="flex" gap={1} mb={2}>
                    <Chip label={selectedNotification.type} size="small" />
                    <Chip
                      label={selectedNotification.priority}
                      size="small"
                      color={getPriorityColor(selectedNotification.priority) as any}
                    />
                    {selectedNotification.resolved && (
                      <Chip label="Đã xử lý" size="small" color="success" icon={<CheckCircle />} />
                    )}
                  </Box>

                  <Typography variant="body1" paragraph>
                    {selectedNotification.message}
                  </Typography>

                  <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                    Thời gian: {new Date(selectedNotification.createdAt).toLocaleString('vi-VN')}
                  </Typography>

                  {selectedNotification.data && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Dữ liệu chi tiết:
                      </Typography>
                      <Card variant="outlined" sx={{ bgcolor: 'background.default', p: 2 }}>
                        <pre style={{ margin: 0, fontSize: '0.85rem', overflow: 'auto' }}>
                          {JSON.stringify(selectedNotification.data, null, 2)}
                        </pre>
                      </Card>
                    </Box>
                  )}
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailsOpen(false)}>
                Đóng
              </Button>
              {selectedNotification && selectedNotification.type === 'USER_REPORT' && (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => {
                    const userId = selectedNotification.data?.userId || selectedNotification.createdBy;
                    const ticketId = selectedNotification.data?.ticketId;

                    // Navigate with query params to auto-open the ticket
                    if (userId) {
                      router.push(`/support?userId=${userId}${ticketId ? `&ticketId=${ticketId}` : ''}`);
                    } else {
                      router.push('/support');
                    }
                    setDetailsOpen(false);
                  }}
                >
                  Xem chi tiết ticket
                </Button>
              )}
              {selectedNotification && selectedNotification.type === 'USER_FEEDBACK' && (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => {
                    const userId = selectedNotification.data?.userId || selectedNotification.createdBy;
                    const ticketId = selectedNotification.data?.ticketId;

                    // Navigate with query params to auto-open the ticket chat
                    if (userId) {
                      router.push(`/support?userId=${userId}${ticketId ? `&ticketId=${ticketId}` : ''}`);
                    } else {
                      router.push('/support');
                    }
                    setDetailsOpen(false);
                  }}
                >
                  Mở chat hỗ trợ
                </Button>
              )}
              {selectedNotification && selectedNotification.actionUrl &&
               selectedNotification.type !== 'USER_REPORT' &&
               selectedNotification.type !== 'USER_FEEDBACK' && (
                <Button
                  variant="outlined"
                  onClick={() => handleActionClick(selectedNotification)}
                >
                  Xem chi tiết
                </Button>
              )}
              {selectedNotification && !selectedNotification.resolved && (
                <Button
                  variant="outlined"
                  color="success"
                  onClick={() => handleMarkAsResolved(selectedNotification.id)}
                >
                  Đánh dấu đã xử lý
                </Button>
              )}
            </DialogActions>
          </Dialog>

          {/* Response Dialog */}
          <Dialog open={responseDialogOpen} onClose={() => setResponseDialogOpen(false)} maxWidth="sm" fullWidth>
            <DialogTitle>
              Gửi phản hồi đến người dùng
            </DialogTitle>
            <DialogContent>
              <TextField
                autoFocus
                margin="dense"
                label="Nội dung phản hồi"
                type="text"
                fullWidth
                multiline
                rows={4}
                variant="outlined"
                value={responseMessage}
                onChange={(e) => setResponseMessage(e.target.value)}
                placeholder="Nhập nội dung phản hồi cho người dùng..."
              />
              <Alert severity="info" sx={{ mt: 2 }}>
                Người dùng sẽ nhận được thông báo này trong ứng dụng
              </Alert>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => {
                setResponseDialogOpen(false);
                setResponseMessage('');
              }}>
                Hủy
              </Button>
              <Button
                variant="contained"
                onClick={handleSendResponse}
                disabled={!responseMessage.trim()}
              >
                Gửi phản hồi
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </LayoutWrapper>
    </AuthGuard>
  );
}
