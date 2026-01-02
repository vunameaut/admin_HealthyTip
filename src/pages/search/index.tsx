import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Paper,
  Divider,
  LinearProgress,
  Alert
} from '@mui/material';
import {
  Search as SearchIcon,
  Article,
  VideoLibrary,
  Clear,
  FilterList,
  TrendingUp,
  Edit,
  Visibility,
  CheckCircle,
  Warning
} from '@mui/icons-material';
import { useRouter } from 'next/router';
import LayoutWrapper from '../../components/LayoutWrapper';
import AuthGuard from '../../components/AuthGuard';
import { healthTipsService, videosService, categoriesService } from '../../services/firebase';
import { HealthTip, ShortVideo, Category } from '../../types';
import toast from 'react-hot-toast';

interface SearchResult {
  id: string;
  type: 'post' | 'video';
  title: string;
  description: string;
  categoryId?: string;
  status?: string;
  views?: number;
  createdAt?: number;
  imageUrl?: string;
  thumbnailUrl?: string;
}

interface SearchPageProps {
  darkMode?: boolean;
  toggleDarkMode?: () => void;
}

export default function SearchPage({ darkMode, toggleDarkMode }: SearchPageProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [allPosts, setAllPosts] = useState<HealthTip[]>([]);
  const [allVideos, setAllVideos] = useState<ShortVideo[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0); // 0: All, 1: Posts, 2: Videos
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('relevance'); // relevance, date, views

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      performSearch();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, categoryFilter, statusFilter, sortBy, tabValue]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [posts, videos, cats] = await Promise.all([
        healthTipsService.getAll(),
        videosService.getAll(),
        categoriesService.getAll()
      ]);

      setAllPosts(posts);
      setAllVideos(videos);
      setCategories(cats);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Có lỗi xảy ra khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const performSearch = () => {
    const query = searchQuery.toLowerCase().trim();
    const results: SearchResult[] = [];

    // Search in posts
    if (tabValue === 0 || tabValue === 1) {
      const postResults = allPosts
        .filter(post => {
          // Check title
          const titleMatch = post.title?.toLowerCase().includes(query);

          // Check content - handle both string and array
          let contentMatch = false;
          if (Array.isArray(post.content)) {
            contentMatch = post.content.some(block => {
              if (typeof block === 'object' && block.value && typeof block.value === 'string') {
                return block.value.toLowerCase().includes(query);
              }
              return false;
            });
          } else if (typeof post.content === 'string') {
            contentMatch = post.content.toLowerCase().includes(query);
          }

          const matchesQuery = titleMatch || contentMatch;
          const matchesCategory = !categoryFilter || post.categoryId === categoryFilter;
          const matchesStatus = !statusFilter || post.status === statusFilter;

          return matchesQuery && matchesCategory && matchesStatus;
        })
        .map(post => {
          let description = '';
          if (Array.isArray(post.content) && post.content.length > 0) {
            const firstBlock = post.content[0];
            if (typeof firstBlock === 'object' && firstBlock.value) {
              description = firstBlock.value.substring(0, 150);
            }
          } else if (typeof post.content === 'string') {
            description = post.content.substring(0, 150);
          }

          return {
            id: post.id,
            type: 'post' as const,
            title: post.title || 'Untitled',
            description,
            categoryId: post.categoryId,
            status: post.status,
            views: post.viewCount,
            createdAt: post.createdAt,
            imageUrl: post.imageUrl
          };
        });

      results.push(...postResults);
    }

    // Search in videos
    if (tabValue === 0 || tabValue === 2) {
      const videoResults = allVideos
        .filter(video => {
          const matchesQuery =
            video.title?.toLowerCase().includes(query) ||
            video.caption?.toLowerCase().includes(query);

          const matchesCategory = !categoryFilter || video.categoryId === categoryFilter;
          const matchesStatus = !statusFilter || video.status === statusFilter;

          return matchesQuery && matchesCategory && matchesStatus;
        })
        .map(video => ({
          id: video.id,
          type: 'video' as const,
          title: video.title || 'Untitled',
          description: video.caption || '',
          categoryId: video.categoryId,
          status: video.status,
          views: video.viewCount,
          createdAt: video.uploadDate,
          thumbnailUrl: video.thumbnailUrl || video.thumb
        }));

      results.push(...videoResults);
    }

    // Sort results
    const sortedResults = sortResults(results);
    setSearchResults(sortedResults);
  };

  const sortResults = (results: SearchResult[]) => {
    switch (sortBy) {
      case 'date':
        return [...results].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      case 'views':
        return [...results].sort((a, b) => (b.views || 0) - (a.views || 0));
      case 'relevance':
      default:
        // Simple relevance: prioritize title matches over content matches
        return [...results].sort((a, b) => {
          const aInTitle = a.title.toLowerCase().includes(searchQuery.toLowerCase());
          const bInTitle = b.title.toLowerCase().includes(searchQuery.toLowerCase());
          if (aInTitle && !bInTitle) return -1;
          if (!aInTitle && bInTitle) return 1;
          return (b.createdAt || 0) - (a.createdAt || 0);
        });
    }
  };

  const handleResultClick = (result: SearchResult) => {
    if (result.type === 'post') {
      router.push(`/content/edit/${result.id}`);
    } else {
      router.push(`/videos/edit/${result.id}`);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setCategoryFilter('');
    setStatusFilter('');
    setSortBy('relevance');
    setSearchResults([]);
  };

  const getCategoryName = (categoryId?: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'No category';
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'published': return 'success';
      case 'draft': return 'warning';
      default: return 'default';
    }
  };

  const getFilteredResults = () => {
    return searchResults;
  };

  const statCards = [
    {
      title: 'Kết quả tìm kiếm',
      value: searchResults.length,
      icon: <SearchIcon />,
      color: '#1976d2'
    },
    {
      title: 'Bài viết',
      value: searchResults.filter(r => r.type === 'post').length,
      icon: <Article />,
      color: '#388e3c'
    },
    {
      title: 'Videos',
      value: searchResults.filter(r => r.type === 'video').length,
      icon: <VideoLibrary />,
      color: '#f57c00'
    },
    {
      title: 'Lượt xem trung bình',
      value: searchResults.length > 0
        ? Math.round(searchResults.reduce((sum, r) => sum + (r.views || 0), 0) / searchResults.length)
        : 0,
      icon: <TrendingUp />,
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
              Tìm kiếm nội dung
            </Typography>
          </Box>

          {/* Search Bar */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <TextField
                fullWidth
                placeholder="Tìm kiếm bài viết, video..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setSearchQuery('')}>
                        <Clear />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                sx={{ mb: 2 }}
              />

              {/* Filters */}
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Danh mục</InputLabel>
                    <Select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      label="Danh mục"
                    >
                      <MenuItem value="">Tất cả</MenuItem>
                      {categories.map(cat => (
                        <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Trạng thái</InputLabel>
                    <Select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      label="Trạng thái"
                    >
                      <MenuItem value="">Tất cả</MenuItem>
                      <MenuItem value="published">Đã xuất bản</MenuItem>
                      <MenuItem value="draft">Bản nháp</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Sắp xếp</InputLabel>
                    <Select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      label="Sắp xếp"
                    >
                      <MenuItem value="relevance">Liên quan nhất</MenuItem>
                      <MenuItem value="date">Mới nhất</MenuItem>
                      <MenuItem value="views">Nhiều views nhất</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Clear />}
                    onClick={clearFilters}
                  >
                    Xóa bộ lọc
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {loading && <LinearProgress sx={{ mb: 2 }} />}

          {/* Stats Cards */}
          {searchQuery.length >= 2 && (
            <Grid container spacing={3} mb={3}>
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
                        <Box
                          sx={{
                            bgcolor: stat.color,
                            color: 'white',
                            width: 56,
                            height: 56,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
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
          )}

          {/* Tabs */}
          <Card>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
                <Tab label={`Tất cả (${searchResults.length})`} />
                <Tab label={`Bài viết (${searchResults.filter(r => r.type === 'post').length})`} />
                <Tab label={`Videos (${searchResults.filter(r => r.type === 'video').length})`} />
              </Tabs>
            </Box>

            <CardContent>
              {searchQuery.length < 2 ? (
                <Box textAlign="center" py={4}>
                  <SearchIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Nhập từ khóa để tìm kiếm
                  </Typography>
                  <Typography color="text.secondary">
                    Tìm kiếm bài viết và video theo tiêu đề, nội dung
                  </Typography>
                </Box>
              ) : searchResults.length === 0 ? (
                <Box textAlign="center" py={4}>
                  <SearchIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Không tìm thấy kết quả
                  </Typography>
                  <Typography color="text.secondary">
                    Thử thay đổi từ khóa hoặc bộ lọc
                  </Typography>
                </Box>
              ) : (
                <List>
                  {getFilteredResults().map((result, index) => (
                    <React.Fragment key={result.id}>
                      <ListItem
                        alignItems="flex-start"
                        sx={{
                          cursor: 'pointer',
                          '&:hover': { bgcolor: 'action.hover' },
                          borderRadius: 1
                        }}
                        onClick={() => handleResultClick(result)}
                      >
                        <ListItemAvatar>
                          <Avatar
                            src={result.imageUrl || result.thumbnailUrl}
                            variant="rounded"
                            sx={{ width: 80, height: 60 }}
                          >
                            {result.type === 'post' ? <Article /> : <VideoLibrary />}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          sx={{ ml: 2 }}
                          primary={
                            <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                              <Typography variant="subtitle1" fontWeight="medium">
                                {result.title}
                              </Typography>
                              <Chip
                                icon={result.type === 'post' ? <Article /> : <VideoLibrary />}
                                label={result.type === 'post' ? 'Bài viết' : 'Video'}
                                size="small"
                                color={result.type === 'post' ? 'primary' : 'secondary'}
                              />
                              <Chip
                                label={result.status || 'draft'}
                                size="small"
                                color={getStatusColor(result.status)}
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography
                                component="span"
                                variant="body2"
                                color="text.secondary"
                                sx={{ display: 'block', mb: 1 }}
                              >
                                {result.description}
                              </Typography>
                              <Box display="flex" gap={2} alignItems="center">
                                <Chip
                                  label={getCategoryName(result.categoryId)}
                                  size="small"
                                  variant="outlined"
                                />
                                <Typography variant="caption" color="text.secondary">
                                  <Visibility sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                                  {result.views || 0} lượt xem
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {result.createdAt && new Date(result.createdAt).toLocaleDateString('vi-VN')}
                                </Typography>
                              </Box>
                            </Box>
                          }
                        />
                        <IconButton>
                          <Edit />
                        </IconButton>
                      </ListItem>
                      {index < searchResults.length - 1 && <Divider variant="inset" component="li" />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Box>
      </LayoutWrapper>
    </AuthGuard>
  );
}
