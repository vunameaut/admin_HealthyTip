import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  Alert,
  Tabs,
  Tab,
  Divider
} from '@mui/material';
import {
  TrendingUp,
  People,
  Visibility,
  TouchApp,
  Timeline,
  DataUsage,
  Analytics as AnalyticsIcon,
  Download,
  Refresh
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Line, Bar, Doughnut, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import LayoutWrapper from '../../components/LayoutWrapper';
import AuthGuard from '../../components/AuthGuard';
import { analyticsService, healthTipsService, categoriesService, usersService } from '../../services/firebase';
import { FirebaseAnalytics, HealthTip, Category, User } from '../../types';
import toast from 'react-hot-toast';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface AnalyticsData {
  totalEvents: number;
  uniqueUsers: number;
  pageViews: number;
  userLogins: number;
  topContent: Array<{ id: string; title: string; views: number }>;
  userActivity: Array<{ date: string; logins: number; pageViews: number }>;
  categoryStats: Array<{ name: string; count: number }>;
  deviceStats: Array<{ device: string; count: number }>;
}

interface AnalyticsProps {
  darkMode?: boolean;
  toggleDarkMode?: () => void;
}

export default function Analytics({ darkMode, toggleDarkMode }: AnalyticsProps) {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalEvents: 0,
    uniqueUsers: 0,
    pageViews: 0,
    userLogins: 0,
    topContent: [],
    userActivity: [],
    categoryStats: [],
    deviceStats: []
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    end: new Date()
  });
  const [tabValue, setTabValue] = useState(0);
  const [events, setEvents] = useState<FirebaseAnalytics[]>([]);
  const [healthTips, setHealthTips] = useState<HealthTip[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    loadAnalyticsData();
  }, [dateRange]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      
      const [analyticsEvents, tips, cats, users] = await Promise.all([
        analyticsService.getEvents(dateRange.start, dateRange.end),
        healthTipsService.getAll(),
        categoriesService.getAll(),
        usersService.getAll()
      ]);

      setEvents(analyticsEvents);
      setHealthTips(tips);
      setCategories(cats);
      
      processAnalyticsData(analyticsEvents, tips, cats, users);
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Có lỗi xảy ra khi tải dữ liệu phân tích');
    } finally {
      setLoading(false);
    }
  };

  const processAnalyticsData = (
    events: FirebaseAnalytics[], 
    tips: HealthTip[], 
    cats: Category[],
    users: User[]
  ) => {
    // Basic stats
    const totalEvents = events.length;
    const uniqueUsers = new Set(events.map(e => e.userId).filter(Boolean)).size;
    const pageViews = events.filter(e => e.type === 'page_view').length;
    const userLogins = events.filter(e => e.type === 'user_login').length;

    // Top content by views
    const contentViews = new Map<string, number>();
    events.filter(e => e.type === 'content_view').forEach(event => {
      const contentId = event.data?.contentId;
      if (contentId) {
        contentViews.set(contentId, (contentViews.get(contentId) || 0) + 1);
      }
    });

    const topContent = Array.from(contentViews.entries())
      .map(([id, views]) => {
        const tip = tips.find(t => t.id === id);
        return {
          id,
          title: tip?.title || 'Unknown',
          views
        };
      })
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    // User activity by day
    const activityByDay = new Map<string, { logins: number; pageViews: number }>();
    events.forEach(event => {
      const date = new Date(event.timestamp).toISOString().split('T')[0];
      const current = activityByDay.get(date) || { logins: 0, pageViews: 0 };
      
      if (event.type === 'user_login') current.logins++;
      if (event.type === 'page_view') current.pageViews++;
      
      activityByDay.set(date, current);
    });

    const userActivity = Array.from(activityByDay.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Category stats
    const categoryStats = cats.map(cat => ({
      name: cat.name,
      count: tips.filter(tip => tip.categoryId === cat.id).length
    }));

    // Device stats (mock data based on user agents)
    const deviceTypes = new Map<string, number>();
    events.forEach(event => {
      if (event.userAgent) {
        const isMobile = /Mobile|Android|iPhone|iPad/.test(event.userAgent);
        const isTablet = /iPad|Tablet/.test(event.userAgent);
        const device = isMobile ? (isTablet ? 'Tablet' : 'Mobile') : 'Desktop';
        deviceTypes.set(device, (deviceTypes.get(device) || 0) + 1);
      }
    });

    const deviceStats = Array.from(deviceTypes.entries())
      .map(([device, count]) => ({ device, count }));

    setAnalyticsData({
      totalEvents,
      uniqueUsers,
      pageViews,
      userLogins,
      topContent,
      userActivity,
      categoryStats,
      deviceStats
    });
  };

  const getActivityChartData = () => {
    return {
      labels: analyticsData.userActivity.map(item => 
        new Date(item.date).toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' })
      ),
      datasets: [
        {
          label: 'Đăng nhập',
          data: analyticsData.userActivity.map(item => item.logins),
          borderColor: '#1976d2',
          backgroundColor: 'rgba(25, 118, 210, 0.1)',
          tension: 0.4,
          fill: true
        },
        {
          label: 'Lượt xem trang',
          data: analyticsData.userActivity.map(item => item.pageViews),
          borderColor: '#388e3c',
          backgroundColor: 'rgba(56, 142, 60, 0.1)',
          tension: 0.4,
          fill: true
        }
      ]
    };
  };

  const getCategoryChartData = () => {
    return {
      labels: analyticsData.categoryStats.map(stat => stat.name),
      datasets: [
        {
          data: analyticsData.categoryStats.map(stat => stat.count),
          backgroundColor: [
            '#1976d2', '#388e3c', '#f57c00', '#7b1fa2', '#d32f2f',
            '#0288d1', '#689f38', '#f44336', '#9c27b0', '#ff9800'
          ]
        }
      ]
    };
  };

  const getDeviceChartData = () => {
    return {
      labels: analyticsData.deviceStats.map(stat => stat.device),
      datasets: [
        {
          data: analyticsData.deviceStats.map(stat => stat.count),
          backgroundColor: ['#1976d2', '#388e3c', '#f57c00']
        }
      ]
    };
  };

  const exportAnalytics = () => {
    const dataToExport = {
      period: {
        start: dateRange.start.toISOString(),
        end: dateRange.end.toISOString()
      },
      summary: analyticsData,
      events: events.map(event => ({
        ...event,
        timestamp: new Date(event.timestamp).toISOString()
      }))
    };

    const dataStr = JSON.stringify(dataToExport, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `analytics-${dateRange.start.toISOString().split('T')[0]}-to-${dateRange.end.toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const statCards = [
    {
      title: 'Tổng sự kiện',
      value: analyticsData.totalEvents,
      icon: <AnalyticsIcon />,
      color: '#1976d2'
    },
    {
      title: 'Người dùng duy nhất',
      value: analyticsData.uniqueUsers,
      icon: <People />,
      color: '#388e3c'
    },
    {
      title: 'Lượt xem trang',
      value: analyticsData.pageViews,
      icon: <Visibility />,
      color: '#f57c00'
    },
    {
      title: 'Lần đăng nhập',
      value: analyticsData.userLogins,
      icon: <TouchApp />,
      color: '#7b1fa2'
    }
  ];

  return (
    <AuthGuard>
      <LayoutWrapper darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
        <Box p={3}>
          {/* Header */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h4" component="h1" fontWeight="bold">
              Phân tích dữ liệu
            </Typography>
            <Box display="flex" gap={1}>
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={exportAnalytics}
              >
                Xuất báo cáo
              </Button>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={loadAnalyticsData}
              >
                Làm mới
              </Button>
            </Box>
          </Box>

          {/* Date Range Selector */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item>
                  <Typography variant="body1">Khoảng thời gian:</Typography>
                </Grid>
                <Grid item>
                  <DatePicker
                    label="Từ ngày"
                    value={dateRange.start}
                    onChange={(date) => date && setDateRange({...dateRange, start: date})}
                    slotProps={{ textField: { size: 'small' } }}
                  />
                </Grid>
                <Grid item>
                  <DatePicker
                    label="Đến ngày"
                    value={dateRange.end}
                    onChange={(date) => date && setDateRange({...dateRange, end: date})}
                    slotProps={{ textField: { size: 'small' } }}
                  />
                </Grid>
                <Grid item>
                  <Button
                    variant="outlined"
                    onClick={() => setDateRange({
                      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                      end: new Date()
                    })}
                  >
                    7 ngày
                  </Button>
                </Grid>
                <Grid item>
                  <Button
                    variant="outlined"
                    onClick={() => setDateRange({
                      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                      end: new Date()
                    })}
                  >
                    30 ngày
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {loading && <LinearProgress sx={{ mb: 2 }} />}

          {/* Stats Cards */}
          <Grid container spacing={3} mb={4}>
            {statCards.map((stat, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
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
                      <Avatar sx={{ bgcolor: stat.color, width: 56, height: 56 }}>
                        {stat.icon}
                      </Avatar>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Tabs */}
          <Card>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
                <Tab label="Hoạt động người dùng" />
                <Tab label="Nội dung phổ biến" />
                <Tab label="Phân tích danh mục" />
                <Tab label="Thiết bị" />
              </Tabs>
            </Box>

            <CardContent>
              {/* User Activity Tab */}
              {tabValue === 0 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Hoạt động người dùng theo thời gian
                  </Typography>
                  <Box height={400}>
                    <Line 
                      data={getActivityChartData()} 
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'top'
                          }
                        },
                        scales: {
                          y: {
                            beginAtZero: true
                          }
                        }
                      }}
                    />
                  </Box>
                </Box>
              )}

              {/* Top Content Tab */}
              {tabValue === 1 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Nội dung được xem nhiều nhất
                  </Typography>
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Thứ hạng</TableCell>
                          <TableCell>Tiêu đề</TableCell>
                          <TableCell align="right">Lượt xem</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {analyticsData.topContent.map((content, index) => (
                          <TableRow key={content.id}>
                            <TableCell>
                              <Chip 
                                label={index + 1} 
                                color={index < 3 ? 'primary' : 'default'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>{content.title}</TableCell>
                            <TableCell align="right">{content.views}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}

              {/* Category Analytics Tab */}
              {tabValue === 2 && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>
                      Phân bố nội dung theo danh mục
                    </Typography>
                    <Box height={300}>
                      <Doughnut 
                        data={getCategoryChartData()} 
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'right'
                            }
                          }
                        }}
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>
                      Chi tiết danh mục
                    </Typography>
                    <List>
                      {analyticsData.categoryStats.map((stat, index) => (
                        <ListItem key={index}>
                          <ListItemText
                            primary={stat.name}
                            secondary={`${stat.count} bài viết`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Grid>
                </Grid>
              )}

              {/* Device Analytics Tab */}
              {tabValue === 3 && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>
                      Phân bố thiết bị truy cập
                    </Typography>
                    <Box height={300}>
                      <Pie 
                        data={getDeviceChartData()} 
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'bottom'
                            }
                          }
                        }}
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>
                      Chi tiết thiết bị
                    </Typography>
                    <List>
                      {analyticsData.deviceStats.map((stat, index) => (
                        <ListItem key={index}>
                          <ListItemText
                            primary={stat.device}
                            secondary={`${stat.count} lượt truy cập (${((stat.count / analyticsData.totalEvents) * 100).toFixed(1)}%)`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Grid>
                </Grid>
              )}
            </CardContent>
          </Card>
        </Box>
      </LayoutWrapper>
    </AuthGuard>
  );
}
