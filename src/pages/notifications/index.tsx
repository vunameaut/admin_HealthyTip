import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Stack,
  alpha,
  useTheme,
  TablePagination,
  Paper,
} from '@mui/material';
import {
  Send,
  Notifications,
  People,
  Refresh,
  CheckCircle,
  Error as ErrorIcon,
  History,
  Article,
  Settings,
  Close,
  Search,
} from '@mui/icons-material';
import LayoutWrapper from '@/components/LayoutWrapper';
import AuthGuard from '@/components/AuthGuard';
import notificationService, {
  User,
  Stats,
  HealthTip,
  NotificationHistory,
} from '@/services/notificationService';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function NotificationsPage() {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [healthTips, setHealthTips] = useState<HealthTip[]>([]);
  const [history, setHistory] = useState<NotificationHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Pagination for history
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Connection status
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');

  // Dialog states
  const [newTipDialog, setNewTipDialog] = useState(false);
  const [customDialog, setCustomDialog] = useState(false);

  // Form states for New Health Tip
  const [selectedHealthTip, setSelectedHealthTip] = useState('');
  const [newTipSending, setNewTipSending] = useState(false);
  const [excludeUsers, setExcludeUsers] = useState<string[]>([]);

  // Form states for Custom
  const [customTitle, setCustomTitle] = useState('');
  const [customBody, setCustomBody] = useState('');
  const [customUserId, setCustomUserId] = useState('');
  const [customSending, setCustomSending] = useState(false);

  // History filters
  const [historyTypeFilter, setHistoryTypeFilter] = useState<string>('all');
  const [historySearch, setHistorySearch] = useState('');

  useEffect(() => {
    loadData();
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const result = await notificationService.testConnection();
      setConnectionStatus(result.success ? 'connected' : 'disconnected');
      if (!result.success) {
        toast.error('Không thể kết nối tới backend server!');
      }
    } catch (error) {
      setConnectionStatus('disconnected');
      toast.error('Không thể kết nối tới backend server!');
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersData, statsData, healthTipsData] = await Promise.all([
        notificationService.getUsers(),
        notificationService.getStats(),
        notificationService.getHealthTips(),
      ]);

      if (usersData.success) {
        setUsers(usersData.users);
      }

      if (statsData.success) {
        setStats(statsData.stats);
      }

      if (healthTipsData.success) {
        setHealthTips(healthTipsData.healthTips);
      }
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast.error(error.response?.data?.error || 'Lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const filters = {
        limit: 100,
        type: historyTypeFilter !== 'all' ? historyTypeFilter : undefined,
      };
      const result = await notificationService.getHistory(filters);
      if (result.success) {
        setHistory(result.notifications);
      }
    } catch (error: any) {
      console.error('Error loading history:', error);
      toast.error('Lỗi khi tải lịch sử');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSendNewHealthTip = async () => {
    if (!selectedHealthTip) {
      toast.error('Vui lòng chọn bài viết');
      return;
    }

    setNewTipSending(true);
    try {
      const result = await notificationService.sendNewHealthTip({
        healthTipId: selectedHealthTip,
        excludeUserIds: excludeUsers,
      });

      if (result.success) {
        toast.success(`Đã gửi thành công ${result.sentCount || 0} thông báo!`);
        setNewTipDialog(false);
        setSelectedHealthTip('');
        setExcludeUsers([]);
        loadHistory();
      } else {
        toast.error(result.error || 'Gửi thất bại');
      }
    } catch (error: any) {
      console.error('Error sending new health tip:', error);
      toast.error(error.response?.data?.error || 'Lỗi khi gửi thông báo');
    } finally {
      setNewTipSending(false);
    }
  };

  const handleSendCustom = async () => {
    if (!customTitle || !customBody) {
      toast.error('Vui lòng nhập tiêu đề và nội dung');
      return;
    }

    setCustomSending(true);
    try {
      const result = await notificationService.sendCustomNotification({
        title: customTitle,
        body: customBody,
        userId: customUserId || undefined,
      });

      if (result.success) {
        toast.success(customUserId ? 'Đã gửi thông báo thành công!' : `Đã gửi ${result.sentCount || 0} thông báo!`);
        setCustomDialog(false);
        setCustomTitle('');
        setCustomBody('');
        setCustomUserId('');
        loadHistory();
      } else {
        toast.error(result.error || 'Gửi thất bại');
      }
    } catch (error: any) {
      console.error('Error sending custom notification:', error);
      toast.error(error.response?.data?.error || 'Lỗi khi gửi thông báo');
    } finally {
      setCustomSending(false);
    }
  };

  const getNotificationTypeColor = (type: string) => {
    switch (type) {
      case 'new_health_tip':
        return 'primary';
      case 'recommendation':
        return 'warning';
      case 'custom':
        return 'secondary';
      case 'broadcast':
        return 'info';
      default:
        return 'default';
    }
  };

  const getNotificationTypeLabel = (type: string) => {
    switch (type) {
      case 'new_health_tip':
        return 'Bài viết mới';
      case 'recommendation':
        return 'Đề xuất';
      case 'custom':
        return 'Tùy chỉnh';
      case 'broadcast':
        return 'Broadcast';
      default:
        return type;
    }
  };

  const filteredHistory = history.filter((item) => {
    const matchesSearch = historySearch
      ? item.title.toLowerCase().includes(historySearch.toLowerCase()) ||
        item.body.toLowerCase().includes(historySearch.toLowerCase())
      : true;
    const matchesType = historyTypeFilter === 'all' || item.type === historyTypeFilter;
    return matchesSearch && matchesType;
  });

  const paginatedHistory = filteredHistory.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  if (loading) {
    return (
      <AuthGuard>
        <LayoutWrapper>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
            <CircularProgress />
          </Box>
        </LayoutWrapper>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <LayoutWrapper>
        <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1400, mx: 'auto' }}>
          {/* Header */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between',
              alignItems: { xs: 'flex-start', sm: 'center' },
              mb: 4,
              gap: 2,
            }}
          >
            <Box>
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                Quản Lý Thông Báo
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Gửi thông báo đến người dùng ứng dụng
              </Typography>
            </Box>
            <Stack direction="row" spacing={2}>
              <Chip
                icon={connectionStatus === 'connected' ? <CheckCircle /> : <ErrorIcon />}
                label={
                  connectionStatus === 'checking'
                    ? 'Đang kiểm tra...'
                    : connectionStatus === 'connected'
                    ? 'Đã kết nối'
                    : 'Mất kết nối'
                }
                color={connectionStatus === 'connected' ? 'success' : connectionStatus === 'checking' ? 'default' : 'error'}
              />
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={() => { loadData(); checkConnection(); }}
                size="small"
              >
                Làm mới
              </Button>
            </Stack>
          </Box>

          {/* Stats Cards */}
          {stats && (
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card
                  elevation={0}
                  sx={{
                    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(
                      theme.palette.primary.main,
                      0.05
                    )} 100%)`,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    height: '100%',
                  }}
                >
                  <CardContent>
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Tổng người dùng
                        </Typography>
                        <Typography variant="h3" fontWeight="bold" color="primary.main">
                          {stats.totalUsers}
                        </Typography>
                      </Box>
                      <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.15), width: 64, height: 64 }}>
                        <People sx={{ fontSize: 36, color: 'primary.main' }} />
                      </Avatar>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card
                  elevation={0}
                  sx={{
                    background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)} 0%, ${alpha(
                      theme.palette.success.main,
                      0.05
                    )} 100%)`,
                    border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                    height: '100%',
                  }}
                >
                  <CardContent>
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Nhận được thông báo
                        </Typography>
                        <Typography variant="h3" fontWeight="bold" color="success.main">
                          {stats.usersWithFcmToken}
                        </Typography>
                      </Box>
                      <Avatar sx={{ bgcolor: alpha(theme.palette.success.main, 0.15), width: 64, height: 64 }}>
                        <CheckCircle sx={{ fontSize: 36, color: 'success.main' }} />
                      </Avatar>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card
                  elevation={0}
                  sx={{
                    background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.1)} 0%, ${alpha(
                      theme.palette.warning.main,
                      0.05
                    )} 100%)`,
                    border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                    height: '100%',
                  }}
                >
                  <CardContent>
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Chưa đăng ký
                        </Typography>
                        <Typography variant="h3" fontWeight="bold" color="warning.main">
                          {stats.usersWithoutToken}
                        </Typography>
                      </Box>
                      <Avatar sx={{ bgcolor: alpha(theme.palette.warning.main, 0.15), width: 64, height: 64 }}>
                        <ErrorIcon sx={{ fontSize: 36, color: 'warning.main' }} />
                      </Avatar>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card
                  elevation={0}
                  sx={{
                    background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.1)} 0%, ${alpha(
                      theme.palette.info.main,
                      0.05
                    )} 100%)`,
                    border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                    height: '100%',
                  }}
                >
                  <CardContent>
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Bài viết sức khỏe
                        </Typography>
                        <Typography variant="h3" fontWeight="bold" color="info.main">
                          {stats.totalHealthTips}
                        </Typography>
                      </Box>
                      <Avatar sx={{ bgcolor: alpha(theme.palette.info.main, 0.15), width: 64, height: 64 }}>
                        <Article sx={{ fontSize: 36, color: 'info.main' }} />
                      </Avatar>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Main Actions */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={6}>
              <Card
                elevation={0}
                sx={{
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                  height: '100%',
                  transition: 'all 0.3s',
                  '&:hover': {
                    boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.15)}`,
                    transform: 'translateY(-4px)',
                  },
                }}
              >
                <CardContent sx={{ textAlign: 'center', py: 5 }}>
                  <Avatar
                    sx={{
                      width: 80,
                      height: 80,
                      mx: 'auto',
                      mb: 3,
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                    }}
                  >
                    <Article sx={{ fontSize: 48, color: 'primary.main' }} />
                  </Avatar>
                  <Typography variant="h5" fontWeight="bold" gutterBottom>
                    Thông Báo Bài Viết Mới
                  </Typography>
                  <Typography color="text.secondary" sx={{ mb: 4 }}>
                    Gửi thông báo về bài viết sức khỏe mới đến tất cả người dùng
                  </Typography>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<Send />}
                    onClick={() => setNewTipDialog(true)}
                    disabled={!stats || stats.usersWithFcmToken === 0}
                    sx={{ px: 4, py: 1.5, borderRadius: 2 }}
                  >
                    Gửi Thông Báo
                  </Button>
                  {stats && stats.usersWithFcmToken === 0 && (
                    <Typography variant="caption" color="error" sx={{ display: 'block', mt: 2 }}>
                      Không có người dùng nào có FCM token
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card
                elevation={0}
                sx={{
                  border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
                  height: '100%',
                  transition: 'all 0.3s',
                  '&:hover': {
                    boxShadow: `0 8px 24px ${alpha(theme.palette.secondary.main, 0.15)}`,
                    transform: 'translateY(-4px)',
                  },
                }}
              >
                <CardContent sx={{ textAlign: 'center', py: 5 }}>
                  <Avatar
                    sx={{
                      width: 80,
                      height: 80,
                      mx: 'auto',
                      mb: 3,
                      bgcolor: alpha(theme.palette.secondary.main, 0.1),
                    }}
                  >
                    <Settings sx={{ fontSize: 48, color: 'secondary.main' }} />
                  </Avatar>
                  <Typography variant="h5" fontWeight="bold" gutterBottom>
                    Thông Báo Tùy Chỉnh
                  </Typography>
                  <Typography color="text.secondary" sx={{ mb: 4 }}>
                    Tạo và gửi thông báo tùy chỉnh đến một người hoặc tất cả
                  </Typography>
                  <Button
                    variant="contained"
                    size="large"
                    color="secondary"
                    startIcon={<Send />}
                    onClick={() => setCustomDialog(true)}
                    sx={{ px: 4, py: 1.5, borderRadius: 2 }}
                  >
                    Soạn Thông Báo
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* History Section */}
          <Card elevation={0} sx={{ border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
            <CardContent>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Avatar sx={{ bgcolor: alpha(theme.palette.info.main, 0.1) }}>
                    <History sx={{ color: 'info.main' }} />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      Lịch Sử Thông Báo
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {filteredHistory.length} thông báo
                    </Typography>
                  </Box>
                </Stack>
                <Button
                  variant={showHistory ? 'contained' : 'outlined'}
                  onClick={() => {
                    setShowHistory(!showHistory);
                    if (!showHistory && history.length === 0) {
                      loadHistory();
                    }
                  }}
                  startIcon={showHistory ? <Close /> : <History />}
                  size="small"
                >
                  {showHistory ? 'Ẩn' : 'Xem lịch sử'}
                </Button>
              </Stack>

              {showHistory && (
                <>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
                    <TextField
                      size="small"
                      placeholder="Tìm kiếm..."
                      value={historySearch}
                      onChange={(e) => setHistorySearch(e.target.value)}
                      InputProps={{
                        startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
                      }}
                      sx={{ flex: 1 }}
                    />
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                      <InputLabel>Loại thông báo</InputLabel>
                      <Select
                        value={historyTypeFilter}
                        label="Loại thông báo"
                        onChange={(e) => {
                          setHistoryTypeFilter(e.target.value);
                          setPage(0);
                        }}
                      >
                        <MenuItem value="all">Tất cả</MenuItem>
                        <MenuItem value="new_health_tip">Bài viết mới</MenuItem>
                        <MenuItem value="recommendation">Đề xuất</MenuItem>
                        <MenuItem value="custom">Tùy chỉnh</MenuItem>
                        <MenuItem value="broadcast">Broadcast</MenuItem>
                      </Select>
                    </FormControl>
                    <Button variant="outlined" startIcon={<Refresh />} onClick={loadHistory} size="small">
                      Làm mới
                    </Button>
                  </Stack>

                  {historyLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                      <CircularProgress />
                    </Box>
                  ) : filteredHistory.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 8 }}>
                      <History sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary">
                        Chưa có lịch sử thông báo
                      </Typography>
                    </Box>
                  ) : (
                    <>
                      <TableContainer component={Paper} variant="outlined">
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell>Loại</TableCell>
                              <TableCell>Tiêu đề</TableCell>
                              <TableCell>Nội dung</TableCell>
                              <TableCell align="center">Đã gửi</TableCell>
                              <TableCell align="center">Thất bại</TableCell>
                              <TableCell align="center">Trạng thái</TableCell>
                              <TableCell>Thời gian</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {paginatedHistory.map((item) => (
                              <TableRow key={item.id} hover>
                                <TableCell>
                                  <Chip
                                    label={getNotificationTypeLabel(item.type)}
                                    color={getNotificationTypeColor(item.type) as any}
                                    size="small"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2" fontWeight="medium">
                                    {item.title}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{
                                      maxWidth: 300,
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                    }}
                                  >
                                    {item.body}
                                  </Typography>
                                </TableCell>
                                <TableCell align="center">
                                  <Chip label={item.sentCount} color="success" size="small" variant="outlined" />
                                </TableCell>
                                <TableCell align="center">
                                  <Chip
                                    label={item.failureCount}
                                    color={item.failureCount > 0 ? 'error' : 'default'}
                                    size="small"
                                    variant="outlined"
                                  />
                                </TableCell>
                                <TableCell align="center">
                                  <Chip
                                    label={
                                      item.status === 'success' ? 'Thành công' : item.status === 'partial' ? 'Một phần' : 'Thất bại'
                                    }
                                    color={item.status === 'success' ? 'success' : item.status === 'partial' ? 'warning' : 'error'}
                                    size="small"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2" color="text.secondary">
                                    {item.timestamp?.seconds
                                      ? formatDistanceToNow(new Date(item.timestamp.seconds * 1000), {
                                          addSuffix: true,
                                          locale: vi,
                                        })
                                      : item.timestamp
                                      ? formatDistanceToNow(new Date(item.timestamp), {
                                          addSuffix: true,
                                          locale: vi,
                                        })
                                      : 'Vừa xong'}
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                      <TablePagination
                        component="div"
                        count={filteredHistory.length}
                        page={page}
                        onPageChange={(e, newPage) => setPage(newPage)}
                        rowsPerPage={rowsPerPage}
                        onRowsPerPageChange={(e) => {
                          setRowsPerPage(parseInt(e.target.value, 10));
                          setPage(0);
                        }}
                        labelRowsPerPage="Số dòng:"
                        labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}`}
                      />
                    </>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Dialogs */}
          {/* New Health Tip Dialog */}
          <Dialog
            open={newTipDialog}
            onClose={() => {
              if (!newTipSending) {
                setNewTipDialog(false);
                setExcludeUsers([]);
                setSelectedHealthTip('');
              }
            }}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
                    <Article sx={{ color: 'primary.main' }} />
                  </Avatar>
                  <Typography variant="h6" fontWeight="bold">
                    Gửi Thông Báo Bài Viết Mới
                  </Typography>
                </Stack>
                <IconButton
                  onClick={() => {
                    setNewTipDialog(false);
                    setExcludeUsers([]);
                    setSelectedHealthTip('');
                  }}
                  disabled={newTipSending}
                >
                  <Close />
                </IconButton>
              </Stack>
            </DialogTitle>
            <DialogContent>
              <Alert severity="info" sx={{ mb: 3 }}>
                Thông báo sẽ được gửi đến <strong>{Math.max(0, (stats?.usersWithFcmToken || 0) - excludeUsers.length)}</strong> người dùng
                {excludeUsers.length > 0 && ` (loại trừ ${excludeUsers.length} người)`}
              </Alert>
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Chọn bài viết *</InputLabel>
                <Select
                  value={selectedHealthTip}
                  label="Chọn bài viết *"
                  onChange={(e) => setSelectedHealthTip(e.target.value)}
                  disabled={newTipSending}
                >
                  {healthTips.length === 0 ? (
                    <MenuItem value="" disabled>
                      Không có bài viết nào
                    </MenuItem>
                  ) : (
                    healthTips.map((tip) => (
                      <MenuItem key={tip.id} value={tip.id}>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 400 }}>
                          {tip.title}
                        </Typography>
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
              {healthTips.length === 0 && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  Chưa có bài viết nào. Vui lòng tạo bài viết trước.
                </Alert>
              )}
              <FormControl fullWidth>
                <InputLabel>Loại trừ người dùng (tùy chọn)</InputLabel>
                <Select
                  multiple
                  value={excludeUsers}
                  label="Loại trừ người dùng (tùy chọn)"
                  onChange={(e) => setExcludeUsers(typeof e.target.value === 'string' ? [] : e.target.value)}
                  disabled={newTipSending}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => {
                        const user = users.find(u => u.uid === value);
                        return (
                          <Chip
                            key={value}
                            label={user?.username || value}
                            size="small"
                            onDelete={() => {
                              setExcludeUsers(excludeUsers.filter(id => id !== value));
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
                          />
                        );
                      })}
                    </Box>
                  )}
                >
                  {users.filter(u => u.hasFcmToken).map((user) => (
                    <MenuItem key={user.uid} value={user.uid}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Avatar sx={{ width: 24, height: 24 }}>
                          {user.username?.[0]?.toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="body2">{user.username}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {user.email}
                          </Typography>
                        </Box>
                      </Stack>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3 }}>
              <Button
                onClick={() => {
                  setNewTipDialog(false);
                  setExcludeUsers([]);
                  setSelectedHealthTip('');
                }}
                disabled={newTipSending}
              >
                Hủy
              </Button>
              <Button
                variant="contained"
                onClick={handleSendNewHealthTip}
                disabled={newTipSending || !selectedHealthTip}
                startIcon={newTipSending ? <CircularProgress size={16} /> : <Send />}
              >
                {newTipSending ? 'Đang gửi...' : 'Gửi ngay'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Custom Notification Dialog */}
          <Dialog open={customDialog} onClose={() => !customSending && setCustomDialog(false)} maxWidth="sm" fullWidth>
            <DialogTitle>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Avatar sx={{ bgcolor: alpha(theme.palette.secondary.main, 0.1) }}>
                    <Settings sx={{ color: 'secondary.main' }} />
                  </Avatar>
                  <Typography variant="h6" fontWeight="bold">
                    Soạn Thông Báo Tùy Chỉnh
                  </Typography>
                </Stack>
                <IconButton onClick={() => setCustomDialog(false)} disabled={customSending}>
                  <Close />
                </IconButton>
              </Stack>
            </DialogTitle>
            <DialogContent>
              <Alert severity="info" sx={{ mb: 3 }}>
                {customUserId ? 'Gửi đến 1 người dùng' : `Gửi đến tất cả ${stats?.usersWithFcmToken || 0} người dùng`}
              </Alert>
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Người nhận (để trống = tất cả)</InputLabel>
                <Select
                  value={customUserId}
                  label="Người nhận (để trống = tất cả)"
                  onChange={(e) => setCustomUserId(e.target.value)}
                  disabled={customSending}
                >
                  <MenuItem value="">Tất cả người dùng</MenuItem>
                  {users.filter(u => u.hasFcmToken).map((user) => (
                    <MenuItem key={user.uid} value={user.uid}>
                      {user.username} ({user.email})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Tiêu đề"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                sx={{ mb: 3 }}
                disabled={customSending}
                placeholder="Nhập tiêu đề thông báo..."
              />
              <TextField
                fullWidth
                label="Nội dung"
                value={customBody}
                onChange={(e) => setCustomBody(e.target.value)}
                multiline
                rows={4}
                disabled={customSending}
                placeholder="Nhập nội dung thông báo..."
              />
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3 }}>
              <Button onClick={() => setCustomDialog(false)} disabled={customSending}>
                Hủy
              </Button>
              <Button
                variant="contained"
                color="secondary"
                onClick={handleSendCustom}
                disabled={customSending || !customTitle || !customBody}
                startIcon={customSending ? <CircularProgress size={16} /> : <Send />}
              >
                {customSending ? 'Đang gửi...' : 'Gửi ngay'}
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </LayoutWrapper>
    </AuthGuard>
  );
}
