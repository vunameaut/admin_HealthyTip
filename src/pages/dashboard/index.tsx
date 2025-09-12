import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Avatar,
  IconButton,
  useTheme,
} from '@mui/material';
import {
  TrendingUp,
  People,
  Article,
  VideoLibrary,
  Visibility,
  ThumbUp,
  Favorite,
  Refresh,
} from '@mui/icons-material';
import LayoutWrapper from '@/components/LayoutWrapper';
import AuthGuard, { useCurrentUser } from '@/components/AuthGuard';
import { database } from '@/lib/firebase';
import { ref, get } from 'firebase/database';
import { HealthTip, ShortVideo, Analytics } from '@/types';
import toast from 'react-hot-toast';

interface DashboardPageProps {
  darkMode?: boolean;
  toggleDarkMode?: () => void;
}

export default function DashboardPage({ darkMode, toggleDarkMode }: DashboardPageProps) {
  const { currentUser, loading: userLoading } = useCurrentUser();
  const theme = useTheme();
  const [analytics, setAnalytics] = useState<Partial<Analytics>>({});
  const [recentHealthTips, setRecentHealthTips] = useState<HealthTip[]>([]);
  const [recentVideos, setRecentVideos] = useState<ShortVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (currentUser && !userLoading) {
      loadDashboardData();
    }
  }, [currentUser, userLoading]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load analytics data - sử dụng đúng tên collection trong Firebase
      const [usersSnapshot, healthTipsSnapshot, videosSnapshot] = await Promise.all([
        get(ref(database, 'users')),
        get(ref(database, 'health_tips')), // Đổi từ 'healthTips' thành 'health_tips'
        get(ref(database, 'videos')), // Đổi từ 'shortVideos' thành 'videos'
      ]);

      const users = usersSnapshot.val() || {};
      const healthTips = healthTipsSnapshot.val() || {};
      const videos = videosSnapshot.val() || {};

      // Calculate analytics
      const totalUsers = Object.keys(users).length;
      const totalHealthTips = Object.keys(healthTips).length;
      const totalVideos = Object.keys(videos).length;

      // Get current timestamp and 7 days ago timestamp
      const now = Date.now();
      const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000); // 7 days in milliseconds

      // Get recent content from last 7 days, max 50 items each
      const recentTips = Object.entries(healthTips)
        .map(([id, tip]: [string, any]) => ({ ...tip, id }))
        .filter((tip: any) => tip.createdAt && tip.createdAt >= sevenDaysAgo)
        .sort((a: any, b: any) => b.createdAt - a.createdAt)
        .slice(0, 50);

      const recentVids = Object.entries(videos)
        .map(([id, video]: [string, any]) => ({ ...video, id }))
        .filter((video: any) => {
          // Kiểm tra cả uploadDate và createdAt để tương thích
          const videoDate = video.uploadDate || video.createdAt;
          return videoDate && videoDate >= sevenDaysAgo;
        })
        .sort((a: any, b: any) => {
          const dateA = a.uploadDate || a.createdAt;
          const dateB = b.uploadDate || b.createdAt;
          return dateB - dateA;
        })
        .slice(0, 50);

      setAnalytics({
        totalUsers,
        totalHealthTips,
        totalVideos,
      });
      
      setRecentHealthTips(recentTips);
      setRecentVideos(recentVids);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Có lỗi xảy ra khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const StatCard = ({ title, value, icon, color, loading }: any) => (
    <Card sx={{ 
      height: '100%',
      background: theme.palette.mode === 'dark' 
        ? 'linear-gradient(135deg, #1e1e1e 0%, #2a2a2a 100%)'
        : 'linear-gradient(135deg, #FFFFFF 0%, #F8F9FA 100%)',
      border: theme.palette.mode === 'dark'
        ? '1px solid #333'
        : '1px solid #E1E8ED',
      borderRadius: 3,
      transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: theme.palette.mode === 'dark'
          ? '0 8px 25px rgba(76, 175, 80, 0.3)'
          : '0 8px 25px rgba(76, 175, 80, 0.15)',
      }
    }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography 
              color="textSecondary" 
              gutterBottom 
              variant="overline"
              sx={{ fontWeight: 600, fontSize: '0.75rem' }}
            >
              {title}
            </Typography>
            <Typography 
              variant="h3" 
              component="div"
              sx={{ 
                fontWeight: 700,
                color: color,
                fontSize: '2rem'
              }}
            >
              {loading ? <LinearProgress sx={{ mt: 1 }} /> : value?.toLocaleString() || 0}
            </Typography>
          </Box>
          <Avatar
            sx={{
              background: `linear-gradient(135deg, ${color} 0%, ${color}CC 100%)`,
              height: 64,
              width: 64,
              boxShadow: `0 4px 12px ${color}40`,
            }}
          >
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );

  if (userLoading || !currentUser) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <LinearProgress sx={{ width: 200 }} />
      </Box>
    );
  }

  return (
    <AuthGuard>
      <LayoutWrapper darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
        <Box sx={{ 
          flexGrow: 1, 
          p: 3,
          background: theme.palette.mode === 'dark' 
            ? 'linear-gradient(135deg, #121212 0%, #1a1a1a 100%)'
            : 'linear-gradient(135deg, #F5F7FA 0%, #E8F5E8 100%)',
          minHeight: '100vh',
        }}>
          {/* Header */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mb: 4,
            p: 3,
            borderRadius: 3,
            background: theme.palette.mode === 'dark'
              ? 'rgba(30, 30, 30, 0.8)'
              : 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(10px)',
            border: theme.palette.mode === 'dark'
              ? '1px solid #333'
              : '1px solid #E1E8ED',
          }}>
            <Box>
              <Typography variant="h4" sx={{ 
                fontWeight: 700,
                mb: 1,
                background: 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                Chào mừng, {currentUser.displayName || 'Admin'}! 👋
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Tổng quan hệ thống HealthTips hôm nay
              </Typography>
            </Box>
            <IconButton 
              onClick={loadDashboardData} 
              disabled={loading}
              sx={{
                backgroundColor: '#4CAF50',
                color: 'white',
                '&:hover': {
                  backgroundColor: '#388E3C',
                },
                '&:disabled': {
                  backgroundColor: '#C8E6C9',
                }
              }}
            >
              <Refresh />
            </IconButton>
          </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Tổng người dùng"
              value={analytics.totalUsers}
              icon={<People />}
              color="#3f51b5"
              loading={loading}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Bài viết sức khỏe"
              value={analytics.totalHealthTips}
              icon={<Article />}
              color="#2196F3"
              loading={loading}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Video sức khỏe"
              value={analytics.totalVideos}
              icon={<VideoLibrary />}
              color="#FF7043"
              loading={loading}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Hoạt động hôm nay"
              value={152}
              icon={<Favorite />}
              color="#AB47BC"
              loading={loading}
            />
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          {/* Recent Health Tips */}
          <Grid item xs={12} lg={6}>
            <Card sx={{
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, #1e1e1e 0%, #2a2a2a 100%)'
                : 'linear-gradient(135deg, #FFFFFF 0%, #F8F9FA 100%)',
              border: theme.palette.mode === 'dark'
                ? '1px solid #333'
                : '1px solid #E1E8ED',
              borderRadius: 3,
            }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  fontWeight: 600,
                  color: '#4CAF50'
                }}>
                  <Article />
                  Bài viết sức khỏe mới nhất (7 ngày gần đây)
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                  Hiển thị tối đa 50 bài viết từ 7 ngày gần đây ({recentHealthTips.length} bài)
                </Typography>
                <TableContainer sx={{ maxHeight: 400 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Tiêu đề</TableCell>
                        <TableCell align="center">Lượt xem</TableCell>
                        <TableCell align="center">Thích</TableCell>
                        <TableCell>Ngày tạo</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recentHealthTips.length > 0 ? (
                        recentHealthTips.map((tip) => (
                          <TableRow key={tip.id}>
                            <TableCell>
                              <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                                {tip.title}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                icon={<Visibility />}
                                label={tip.viewCount || 0}
                                size="small"
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                icon={<ThumbUp />}
                                label={tip.likeCount || 0}
                                size="small"
                                variant="outlined"
                                color="primary"
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="caption">
                                {formatDate(tip.createdAt)}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} align="center">
                            <Typography variant="body2" color="text.secondary">
                              Không có bài viết mới trong 7 ngày gần đây
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Recent Videos */}
          <Grid item xs={12} lg={6}>
            <Card sx={{
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, #1e1e1e 0%, #2a2a2a 100%)'
                : 'linear-gradient(135deg, #FFFFFF 0%, #F8F9FA 100%)',
              border: theme.palette.mode === 'dark'
                ? '1px solid #333'
                : '1px solid #E1E8ED',
              borderRadius: 3,
            }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  fontWeight: 600,
                  color: '#FF7043'
                }}>
                  <VideoLibrary />
                  Video sức khỏe mới nhất (7 ngày gần đây)
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                  Hiển thị tối đa 50 video từ 7 ngày gần đây ({recentVideos.length} video)
                </Typography>
                <TableContainer sx={{ maxHeight: 400 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Tiêu đề</TableCell>
                        <TableCell align="center">Lượt xem</TableCell>
                        <TableCell align="center">Thích</TableCell>
                        <TableCell>Ngày upload</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recentVideos.length > 0 ? (
                        recentVideos.map((video) => (
                          <TableRow key={video.id}>
                            <TableCell>
                              <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                                {video.title}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                icon={<Visibility />}
                                label={video.viewCount || 0}
                                size="small"
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                icon={<ThumbUp />}
                                label={video.likeCount || 0}
                                size="small"
                                variant="outlined"
                                color="primary"
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="caption">
                                {formatDate(video.uploadDate || video.createdAt)}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} align="center">
                            <Typography variant="body2" color="text.secondary">
                              Không có video mới trong 7 ngày gần đây
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
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
