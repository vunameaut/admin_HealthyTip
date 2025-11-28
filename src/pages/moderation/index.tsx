import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  LinearProgress,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper
} from '@mui/material';
import {
  Warning,
  CheckCircle,
  Error,
  AutoFixHigh,
  Refresh,
  Image,
  VideoLibrary,
  BrokenImage,
  MoreVert,
  Build
} from '@mui/icons-material';
import LayoutWrapper from '../../components/LayoutWrapper';
import AuthGuard from '../../components/AuthGuard';
import { healthTipsService, videosService } from '../../services/firebase';
import { HealthTip, ShortVideo } from '../../types';
import toast from 'react-hot-toast';
import { generateVideoThumbnail } from '../../utils/cloudinary';

interface ModerationIssue {
  id: string;
  type: 'video' | 'post';
  title: string;
  issues: string[];
  severity: 'error' | 'warning';
  autoFixable: boolean;
  data: any;
}

interface ModerationStats {
  totalVideos: number;
  videosWithIssues: number;
  totalPosts: number;
  postsWithIssues: number;
  totalIssues: number;
}

interface ModerationProps {
  darkMode?: boolean;
  toggleDarkMode?: () => void;
}

export default function Moderation({ darkMode, toggleDarkMode }: ModerationProps) {
  const [loading, setLoading] = useState(true);
  const [issues, setIssues] = useState<ModerationIssue[]>([]);
  const [stats, setStats] = useState<ModerationStats>({
    totalVideos: 0,
    videosWithIssues: 0,
    totalPosts: 0,
    postsWithIssues: 0,
    totalIssues: 0
  });
  const [tabValue, setTabValue] = useState(0);
  const [fixingIssues, setFixingIssues] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<ModerationIssue | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    checkDataQuality();
  }, []);

  const checkDataQuality = async () => {
    try {
      setLoading(true);
      const [videos, posts] = await Promise.all([
        videosService.getAll(),
        healthTipsService.getAll()
      ]);

      const foundIssues: ModerationIssue[] = [];

      // Check videos
      videos.forEach(video => {
        const videoIssues: string[] = [];
        let autoFixable = true;

        if (!video.thumbnailUrl && !video.thumb) {
          videoIssues.push('Thiếu thumbnail URL');
          // Can auto-fix if has publicId
          if (!video.cldPublicId && !video.cloudinaryPublicId) {
            autoFixable = false;
          }
        }

        if (!video.cldPublicId && !video.cloudinaryPublicId) {
          videoIssues.push('Thiếu Cloudinary Public ID');
          autoFixable = false;
        }

        if (!video.videoUrl) {
          videoIssues.push('Thiếu video URL');
          autoFixable = false;
        }

        if (!video.title || video.title.trim() === '') {
          videoIssues.push('Thiếu tiêu đề');
          autoFixable = false;
        }

        if (!video.categoryId) {
          videoIssues.push('Thiếu danh mục');
          autoFixable = false;
        }

        if (!video.duration || video.duration === 0) {
          videoIssues.push('Thiếu thông tin thời lượng');
        }

        if (videoIssues.length > 0) {
          foundIssues.push({
            id: video.id,
            type: 'video',
            title: video.title || 'Video không có tên',
            issues: videoIssues,
            severity: autoFixable ? 'warning' : 'error',
            autoFixable,
            data: video
          });
        }
      });

      // Check posts
      posts.forEach(post => {
        const postIssues: string[] = [];

        if (!post.imageUrl) {
          postIssues.push('Thiếu ảnh bìa');
        }

        if (!post.title || post.title.trim() === '') {
          postIssues.push('Thiếu tiêu đề');
        }

        if (!post.content || post.content.length === 0) {
          postIssues.push('Thiếu nội dung');
        }

        if (!post.categoryId) {
          postIssues.push('Thiếu danh mục');
        }

        if (!post.author || post.author.trim() === '') {
          postIssues.push('Thiếu tác giả');
        }

        if (postIssues.length > 0) {
          foundIssues.push({
            id: post.id,
            type: 'post',
            title: post.title || 'Bài viết không có tên',
            issues: postIssues,
            severity: 'warning',
            autoFixable: false,
            data: post
          });
        }
      });

      setIssues(foundIssues);

      // Calculate stats
      const videosWithIssues = foundIssues.filter(i => i.type === 'video').length;
      const postsWithIssues = foundIssues.filter(i => i.type === 'post').length;

      setStats({
        totalVideos: videos.length,
        videosWithIssues,
        totalPosts: posts.length,
        postsWithIssues,
        totalIssues: foundIssues.length
      });

      toast.success(`Tìm thấy ${foundIssues.length} vấn đề cần kiểm tra`);
    } catch (error) {
      console.error('Error checking data quality:', error);
      toast.error('Có lỗi xảy ra khi kiểm tra dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const autoFixIssue = async (issue: ModerationIssue) => {
    if (!issue.autoFixable || issue.type !== 'video') {
      toast.error('Không thể tự động sửa vấn đề này');
      return;
    }

    try {
      setFixingIssues(true);
      const video = issue.data as ShortVideo;

      // Try to fix thumbnail
      if ((!video.thumbnailUrl || !video.thumb) && (video.cldPublicId || video.cloudinaryPublicId)) {
        const publicId = video.cldPublicId || video.cloudinaryPublicId;
        const thumbnailUrl = generateVideoThumbnail(publicId!, {
          width: 400,
          height: 300,
          quality: 'auto'
        });

        await videosService.update(issue.id, {
          thumbnailUrl,
          thumb: thumbnailUrl
        });

        toast.success(`Đã sửa thumbnail cho video: ${issue.title}`);
      }

      // Reload data
      await checkDataQuality();
    } catch (error) {
      console.error('Error auto-fixing issue:', error);
      toast.error('Có lỗi xảy ra khi tự động sửa');
    } finally {
      setFixingIssues(false);
    }
  };

  const autoFixAllVideos = async () => {
    const fixableIssues = issues.filter(i => i.autoFixable && i.type === 'video');

    if (fixableIssues.length === 0) {
      toast('Không có vấn đề nào có thể tự động sửa');
      return;
    }

    if (!window.confirm(`Bạn có chắc muốn tự động sửa ${fixableIssues.length} vấn đề?`)) {
      return;
    }

    try {
      setFixingIssues(true);
      let fixed = 0;

      for (const issue of fixableIssues) {
        try {
          await autoFixIssue(issue);
          fixed++;
        } catch (error) {
          console.error(`Failed to fix issue ${issue.id}:`, error);
        }
      }

      toast.success(`Đã sửa ${fixed}/${fixableIssues.length} vấn đề`);
      await checkDataQuality();
    } catch (error) {
      console.error('Error auto-fixing all:', error);
      toast.error('Có lỗi xảy ra khi tự động sửa');
    } finally {
      setFixingIssues(false);
    }
  };

  const getFilteredIssues = () => {
    if (tabValue === 0) return issues;
    if (tabValue === 1) return issues.filter(i => i.type === 'video');
    if (tabValue === 2) return issues.filter(i => i.type === 'post');
    return issues;
  };

  const getSeverityColor = (severity: string) => {
    return severity === 'error' ? 'error' : 'warning';
  };

  const statCards = [
    {
      title: 'Tổng videos',
      value: stats.totalVideos,
      issues: stats.videosWithIssues,
      icon: <VideoLibrary />,
      color: '#1976d2'
    },
    {
      title: 'Tổng bài viết',
      value: stats.totalPosts,
      issues: stats.postsWithIssues,
      icon: <Image />,
      color: '#388e3c'
    },
    {
      title: 'Tổng vấn đề',
      value: stats.totalIssues,
      issues: stats.totalIssues,
      icon: <Warning />,
      color: '#f57c00'
    },
    {
      title: 'Có thể tự động sửa',
      value: issues.filter(i => i.autoFixable).length,
      issues: 0,
      icon: <AutoFixHigh />,
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
              Kiểm duyệt nội dung
            </Typography>
            <Box display="flex" gap={1}>
              <Button
                variant="outlined"
                startIcon={<AutoFixHigh />}
                onClick={autoFixAllVideos}
                disabled={loading || fixingIssues || issues.filter(i => i.autoFixable).length === 0}
              >
                Tự động sửa tất cả
              </Button>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={checkDataQuality}
                disabled={loading || fixingIssues}
              >
                Làm mới
              </Button>
            </Box>
          </Box>

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
                          {stat.value}
                        </Typography>
                        {stat.issues > 0 && (
                          <Chip
                            label={`${stat.issues} vấn đề`}
                            size="small"
                            color="warning"
                            sx={{ mt: 1 }}
                          />
                        )}
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

          {/* Tabs */}
          <Card>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
                <Tab label={`Tất cả (${issues.length})`} />
                <Tab label={`Videos (${issues.filter(i => i.type === 'video').length})`} />
                <Tab label={`Bài viết (${issues.filter(i => i.type === 'post').length})`} />
              </Tabs>
            </Box>

            <CardContent>
              {getFilteredIssues().length === 0 ? (
                <Box textAlign="center" py={4}>
                  <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Không có vấn đề nào
                  </Typography>
                  <Typography color="text.secondary">
                    Tất cả nội dung đều đạt chuẩn chất lượng
                  </Typography>
                </Box>
              ) : (
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Loại</TableCell>
                        <TableCell>Tiêu đề</TableCell>
                        <TableCell>Vấn đề</TableCell>
                        <TableCell>Mức độ</TableCell>
                        <TableCell align="right">Thao tác</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {getFilteredIssues().map((issue) => (
                        <TableRow key={issue.id}>
                          <TableCell>
                            <Chip
                              icon={issue.type === 'video' ? <VideoLibrary /> : <Image />}
                              label={issue.type === 'video' ? 'Video' : 'Bài viết'}
                              size="small"
                              color={issue.type === 'video' ? 'primary' : 'secondary'}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{issue.title}</Typography>
                          </TableCell>
                          <TableCell>
                            <Box>
                              {issue.issues.map((iss, idx) => (
                                <Chip
                                  key={idx}
                                  label={iss}
                                  size="small"
                                  sx={{ mr: 0.5, mb: 0.5 }}
                                  color="default"
                                />
                              ))}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              icon={issue.severity === 'error' ? <Error /> : <Warning />}
                              label={issue.severity === 'error' ? 'Nghiêm trọng' : 'Cảnh báo'}
                              size="small"
                              color={getSeverityColor(issue.severity)}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Box display="flex" gap={1} justifyContent="flex-end">
                              {issue.autoFixable && (
                                <Tooltip title="Tự động sửa">
                                  <IconButton
                                    size="small"
                                    onClick={() => autoFixIssue(issue)}
                                    disabled={fixingIssues}
                                    color="primary"
                                  >
                                    <AutoFixHigh />
                                  </IconButton>
                                </Tooltip>
                              )}
                              <Tooltip title="Chi tiết">
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    setSelectedIssue(issue);
                                    setDetailsOpen(true);
                                  }}
                                >
                                  <MoreVert />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>

          {/* Details Dialog */}
          <Dialog
            open={detailsOpen}
            onClose={() => setDetailsOpen(false)}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>Chi tiết vấn đề</DialogTitle>
            <DialogContent>
              {selectedIssue && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    {selectedIssue.title}
                  </Typography>
                  <Chip
                    label={selectedIssue.type === 'video' ? 'Video' : 'Bài viết'}
                    size="small"
                    sx={{ mb: 2 }}
                  />

                  <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                    Danh sách vấn đề:
                  </Typography>
                  <List>
                    {selectedIssue.issues.map((issue, idx) => (
                      <ListItem key={idx}>
                        <ListItemIcon>
                          <Warning color="warning" />
                        </ListItemIcon>
                        <ListItemText primary={issue} />
                      </ListItem>
                    ))}
                  </List>

                  <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                    Dữ liệu:
                  </Typography>
                  <Box
                    component="pre"
                    sx={{
                      fontSize: '0.75rem',
                      overflow: 'auto',
                      bgcolor: 'grey.100',
                      p: 2,
                      borderRadius: 1,
                      maxHeight: 300
                    }}
                  >
                    {JSON.stringify(selectedIssue.data, null, 2)}
                  </Box>
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailsOpen(false)}>Đóng</Button>
              {selectedIssue?.autoFixable && (
                <Button
                  variant="contained"
                  startIcon={<AutoFixHigh />}
                  onClick={() => {
                    autoFixIssue(selectedIssue);
                    setDetailsOpen(false);
                  }}
                  disabled={fixingIssues}
                >
                  Tự động sửa
                </Button>
              )}
            </DialogActions>
          </Dialog>
        </Box>
      </LayoutWrapper>
    </AuthGuard>
  );
}
