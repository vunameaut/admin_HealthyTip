import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Avatar,
  Chip,
  Divider,
  Paper,
  IconButton,
  InputAdornment,
  Alert,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Edit,
  Save,
  Cancel,
  PhotoCamera,
  Email,
  Phone,
  LocationOn,
  CalendarToday,
  AdminPanelSettings,
  Verified,
  History,
  TrendingUp,
  Article,
  VideoLibrary,
} from '@mui/icons-material';
import LayoutWrapper from '../../components/LayoutWrapper';
import AuthGuard, { useCurrentUser } from '../../components/AuthGuard';
import { database } from '@/lib/firebase';
import { ref, update, get } from 'firebase/database';
import { getUserActivityLogs, logActivity } from '@/services/activityLogger';
import toast from 'react-hot-toast';

interface ProfilePageProps {
  darkMode?: boolean;
  toggleDarkMode?: () => void;
}

interface ActivityLog {
  id: string;
  action: string;
  timestamp: number;
  details: string;
}

export default function ProfilePage({ darkMode, toggleDarkMode }: ProfilePageProps) {
  const { currentUser } = useCurrentUser();
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [stats, setStats] = useState({
    postsCreated: 0,
    videosCreated: 0,
    totalViews: 0,
    totalLikes: 0,
  });

  const [formData, setFormData] = useState({
    displayName: currentUser?.displayName || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    bio: currentUser?.bio || '',
    location: currentUser?.location || '',
  });

  useEffect(() => {
    if (currentUser) {
      setFormData({
        displayName: currentUser.displayName || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        bio: currentUser.bio || '',
        location: currentUser.location || '',
      });
      loadActivityLogs();
      loadStats();
    }
  }, [currentUser]);

  const loadActivityLogs = async () => {
    if (!currentUser) return;
    
    try {
      // Load activity logs from Firebase using service
      const logs = await getUserActivityLogs(currentUser.uid, 10);
      
      if (logs.length > 0) {
        setActivityLogs(logs);
      } else {
        // No logs yet - create a first log entry
        await logActivity(
          currentUser.uid,
          'Đăng nhập hệ thống',
          'Truy cập trang hồ sơ cá nhân',
          currentUser.email
        );
        
        setActivityLogs([{
          id: '1',
          action: 'Đăng nhập hệ thống',
          timestamp: Date.now(),
          details: 'Truy cập trang hồ sơ cá nhân',
        }]);
      }
    } catch (error) {
      console.error('Error loading activity logs:', error);
      setActivityLogs([]);
    }
  };

  const loadStats = async () => {
    if (!currentUser) return;
    
    try {
      // Load real stats from Firebase
      const [postsSnapshot, videosSnapshot] = await Promise.all([
        get(ref(database, 'health_tips')),
        get(ref(database, 'short_videos'))
      ]);

      let postsCreated = 0;
      let totalViews = 0;
      let totalLikes = 0;

      // Count posts created by current user
      if (postsSnapshot.exists()) {
        const posts = postsSnapshot.val();
        Object.values(posts).forEach((post: any) => {
          if (post.author === currentUser.uid || post.author === currentUser.email) {
            postsCreated++;
            totalViews += post.viewCount || 0;
            totalLikes += post.likeCount || 0;
          }
        });
      }

      let videosCreated = 0;
      // Count videos created by current user
      if (videosSnapshot.exists()) {
        const videos = videosSnapshot.val();
        Object.values(videos).forEach((video: any) => {
          if (video.userId === currentUser.uid) {
            videosCreated++;
            totalViews += video.viewCount || 0;
            totalLikes += video.likeCount || 0;
          }
        });
      }

      setStats({
        postsCreated,
        videosCreated,
        totalViews,
        totalLikes,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
      // Set default stats on error
      setStats({
        postsCreated: 0,
        videosCreated: 0,
        totalViews: 0,
        totalLikes: 0,
      });
    }
  };

  const handleSave = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      const userRef = ref(database, `users/${currentUser.uid}`);
      
      await update(userRef, {
        displayName: formData.displayName,
        phone: formData.phone,
        bio: formData.bio,
        location: formData.location,
        updatedAt: Date.now(),
      });

      // Log activity
      await logActivity(
        currentUser.uid,
        'Cập nhật hồ sơ',
        'Cập nhật thông tin cá nhân',
        currentUser.email
      );

      toast.success('Cập nhật hồ sơ thành công!');
      setEditMode(false);
      
      // Reload activity logs to show the update
      loadActivityLogs();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Có lỗi xảy ra khi cập nhật hồ sơ');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      displayName: currentUser?.displayName || '',
      email: currentUser?.email || '',
      phone: currentUser?.phone || '',
      bio: currentUser?.bio || '',
      location: currentUser?.location || '',
    });
    setEditMode(false);
  };

  const statCards = [
    {
      title: 'Bài viết đã tạo',
      value: stats.postsCreated,
      icon: <Article />,
      color: '#1976d2',
    },
    {
      title: 'Video đã tạo',
      value: stats.videosCreated,
      icon: <VideoLibrary />,
      color: '#f57c00',
    },
    {
      title: 'Tổng lượt xem',
      value: stats.totalViews,
      icon: <TrendingUp />,
      color: '#388e3c',
    },
    {
      title: 'Tổng lượt thích',
      value: stats.totalLikes,
      icon: <TrendingUp />,
      color: '#7b1fa2',
    },
  ];

  return (
    <AuthGuard>
      <LayoutWrapper darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
        <Box p={3}>
          {/* Header */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h4" component="h1" fontWeight="bold">
              Hồ sơ cá nhân
            </Typography>
            {!editMode ? (
              <Button
                variant="contained"
                startIcon={<Edit />}
                onClick={() => setEditMode(true)}
              >
                Chỉnh sửa
              </Button>
            ) : (
              <Box display="flex" gap={1}>
                <Button
                  variant="outlined"
                  startIcon={<Cancel />}
                  onClick={handleCancel}
                  disabled={loading}
                >
                  Hủy
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Save />}
                  onClick={handleSave}
                  disabled={loading}
                >
                  Lưu
                </Button>
              </Box>
            )}
          </Box>

          {loading && <LinearProgress sx={{ mb: 2 }} />}

          <Grid container spacing={3}>
            {/* Left Column - Profile Info */}
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
                    <Box position="relative">
                      <Avatar
                        src={currentUser?.photoUrl}
                        alt={currentUser?.displayName}
                        sx={{
                          width: 120,
                          height: 120,
                          mb: 2,
                          border: '4px solid',
                          borderColor: 'primary.main',
                        }}
                      >
                        {currentUser?.displayName?.charAt(0) || 'A'}
                      </Avatar>
                      {editMode && (
                        <IconButton
                          sx={{
                            position: 'absolute',
                            bottom: 16,
                            right: 0,
                            bgcolor: 'primary.main',
                            color: 'white',
                            '&:hover': { bgcolor: 'primary.dark' },
                          }}
                          size="small"
                        >
                          <PhotoCamera />
                        </IconButton>
                      )}
                    </Box>

                    <Typography variant="h5" fontWeight="bold" textAlign="center" gutterBottom>
                      {currentUser?.displayName}
                    </Typography>

                    <Box display="flex" gap={1} mb={2}>
                      <Chip
                        icon={<AdminPanelSettings />}
                        label={currentUser?.role === 'admin' ? 'Admin' : 'Editor'}
                        color="primary"
                        size="small"
                      />
                      {currentUser?.verified && (
                        <Chip
                          icon={<Verified />}
                          label="Đã xác thực"
                          color="success"
                          size="small"
                        />
                      )}
                    </Box>

                    {currentUser?.bio && !editMode && (
                      <Typography variant="body2" color="text.secondary" textAlign="center">
                        {currentUser.bio}
                      </Typography>
                    )}
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Box>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <Email color="action" />
                      <Typography variant="body2">{currentUser?.email}</Typography>
                    </Box>
                    {currentUser?.phone && (
                      <Box display="flex" alignItems="center" gap={1} mb={2}>
                        <Phone color="action" />
                        <Typography variant="body2">{currentUser.phone}</Typography>
                      </Box>
                    )}
                    {currentUser?.location && (
                      <Box display="flex" alignItems="center" gap={1} mb={2}>
                        <LocationOn color="action" />
                        <Typography variant="body2">{currentUser.location}</Typography>
                      </Box>
                    )}
                    <Box display="flex" alignItems="center" gap={1}>
                      <CalendarToday color="action" />
                      <Typography variant="body2">
                        Tham gia: {currentUser?.createdAt ? new Date(currentUser.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Right Column - Editable Info & Stats */}
            <Grid item xs={12} md={8}>
              {/* Edit Form */}
              {editMode && (
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Thông tin cá nhân
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Tên hiển thị"
                          value={formData.displayName}
                          onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <AdminPanelSettings />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Email"
                          value={formData.email}
                          disabled
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Email />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Số điện thoại"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Phone />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Địa chỉ"
                          value={formData.location}
                          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <LocationOn />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Giới thiệu"
                          value={formData.bio}
                          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                          multiline
                          rows={3}
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              )}

              {/* Stats Cards */}
              <Grid container spacing={2} mb={3}>
                {statCards.map((stat, index) => (
                  <Grid item xs={12} sm={6} key={index}>
                    <Card>
                      <CardContent>
                        <Box display="flex" alignItems="center" justifyContent="space-between">
                          <Box>
                            <Typography color="text.secondary" gutterBottom variant="body2">
                              {stat.title}
                            </Typography>
                            <Typography variant="h4" component="div" fontWeight="bold">
                              {stat.value.toLocaleString()}
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              bgcolor: stat.color,
                              color: 'white',
                              width: 56,
                              height: 56,
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {stat.icon}
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              {/* Activity Logs */}
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <History />
                    <Typography variant="h6">Hoạt động gần đây</Typography>
                  </Box>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Hành động</TableCell>
                          <TableCell>Chi tiết</TableCell>
                          <TableCell align="right">Thời gian</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {activityLogs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell>
                              <Typography variant="body2" fontWeight="medium">
                                {log.action}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="text.secondary">
                                {log.details}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="caption" color="text.secondary">
                                {new Date(log.timestamp).toLocaleString('vi-VN')}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </LayoutWrapper>
    </AuthGuard>
  );
}
