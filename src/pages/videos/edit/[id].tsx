import React, { useState, useEffect, Fragment, useMemo } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  LinearProgress,
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  Badge,
  Divider,
  Paper,
  Collapse
} from '@mui/material';
import {
  ArrowBack,
  Save,
  Delete,
  VideoLibrary,
  Edit,
  Visibility,
  Comment,
  PersonOff,
  Clear,
  ThumbUpAlt
} from '@mui/icons-material';
import LayoutWrapper from '../../../components/LayoutWrapper';
import AuthGuard from '../../../components/AuthGuard';
import VideoPlayer from '../../../components/VideoPlayer';
import { videosService, categoriesService } from '../../../services/firebase';
import { ShortVideo, Category } from '../../../types';
import toast from 'react-hot-toast';

// =================================================================
// Comment Section Component
// =================================================================
const CommentSection = ({ video, onDeleteComment, onBanUser, formatDate }) => {
  const [showComments, setShowComments] = useState(true);

  const processedComments = useMemo(() => {
    if (!video?.comments) return [];

    const allComments = Object.keys(video.comments).map(id => ({
      id,
      ...video.comments[id]
    }));

    const commentsMap = new Map(allComments.map(comment => [comment.id, { ...comment, replies: [] }]));
    const rootComments = [];

    for (const comment of allComments) {
      if (comment.parentId) {
        const parent = commentsMap.get(comment.parentId);
        if (parent) {
          if (!parent.replies) {
            parent.replies = [];
          }
          parent.replies.push(commentsMap.get(comment.id));
        }
      } else {
        rootComments.push(commentsMap.get(comment.id));
      }
    }
    
    const sortByDate = (a, b) => (a.createdAt || 0) - (b.createdAt || 0);
    rootComments.sort(sortByDate);
    for (const root of rootComments) {
      if (root.replies) {
        root.replies.sort(sortByDate);
      }
    }

    return rootComments;
  }, [video?.comments]);

  const renderComment = (comment, isReply = false) => {
    if (!comment) return null;
    return (
      <ListItem 
        key={comment.id} 
        alignItems="flex-start"
        sx={{ pl: isReply ? 2 : 0 }}
      >
        <ListItemAvatar>
          <Avatar sx={{ bgcolor: isReply ? 'secondary.light' : 'primary.main', width: isReply ? 32 : 40, height: isReply ? 32 : 40 }}>
            {String(comment.userId).charAt(0).toUpperCase() || 'U'}
          </Avatar>
        </ListItemAvatar>
        <Box sx={{ flex: 1 }}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" component="div">
                {comment.username || `User: ${String(comment.userId).substring(0, 8)}...`}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatDate(comment.createdAt)}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
                {comment.text || <em style={{ color: '#999' }}>No content</em>}
              </Typography>
              <Box display="flex" alignItems="center" gap={1} sx={{ mt: 1 }}>
                <Badge badgeContent={comment.likeCount || 0} color="primary">
                  <Chip size="small" label="Likes" icon={<ThumbUpAlt sx={{fontSize: 14}} />} />
                </Badge>
              </Box>
            </Box>
            <Box>
              <IconButton size="small" onClick={() => onDeleteComment(comment.id)} color="default" title="Delete comment">
                <Delete fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={() => onBanUser(comment.userId)} color="default" title="Ban user">
                <PersonOff fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        </Box>
      </ListItem>
    );
  };

  return (
    <>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" display="flex" alignItems="center">
          <Comment sx={{ mr: 1 }} />
          Comments ({processedComments.length})
        </Typography>
        <Button
          size="small"
          onClick={() => setShowComments(!showComments)}
          endIcon={showComments ? <Clear /> : <Visibility />}
        >
          {showComments ? 'Hide' : 'Show'} Comments
        </Button>
      </Box>

      <Collapse in={showComments}>
        <Paper variant="outlined" sx={{ maxHeight: 500, overflow: 'auto', p: 1 }}>
          {processedComments.length === 0 ? (
            <Box p={3} textAlign="center">
              <Typography variant="body2" color="text.secondary">
                No comments yet.
              </Typography>
            </Box>
          ) : (
            <List sx={{py: 0}}>
              {processedComments.map((rootComment, index) => (
                <Fragment key={rootComment.id}>
                  {renderComment(rootComment, false)}
                  
                  {rootComment.replies && rootComment.replies.length > 0 && (
                    <Box sx={{ 
                      pl: 2, 
                      ml: '20px',
                      mr: '10px',
                      borderLeft: '2px solid', 
                      borderColor: 'divider',
                    }}>
                      <List sx={{py: 0}}>
                        {rootComment.replies.map(reply => renderComment(reply, true))}
                      </List>
                    </Box>
                  )}

                  {index < processedComments.length - 1 && <Divider variant="inset" component="li" sx={{mt: 1}} />}
                </Fragment>
              ))}
            </List>
          )}
        </Paper>
      </Collapse>
    </>
  );
};

interface EditVideoPageProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export default function EditVideoPage({ darkMode, toggleDarkMode }: EditVideoPageProps) {
  const router = useRouter();
  const { id } = router.query;
  
  const [video, setVideo] = useState<ShortVideo | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [videoInfo, setVideoInfo] = useState<{
    duration: number;
    fileSize: string;
    dimensions: string;
  } | null>(null);
  
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
  const [userToBan, setUserToBan] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    caption: '',
    categoryId: '',
    status: 'published' as ShortVideo['status']
  });

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [videoData, categoriesData] = await Promise.all([
        videosService.getById(id as string),
        categoriesService.getAll()
      ]);
      
      if (videoData) {
        console.log('Video data loaded:', videoData);
        setVideo(videoData);
        setFormData({
          title: videoData.title,
          caption: videoData.caption || '',
          categoryId: videoData.categoryId,
          status: videoData.status
        });
      } else {
        toast.error('Video không tồn tại');
        router.push('/videos');
      }
      
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Có lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleVideoInfoLoaded = (info: { duration: number, fileSize: string, dimensions: string }) => {
    console.log('Video info loaded from player:', info);
    setVideoInfo(info);
    
    if (video && video.id) {
      const [width, height] = info.dimensions.split('x').map(Number);
      videosService.update(video.id, {
        duration: Math.round(info.duration),
        width,
        height
      }).catch(error => {
        console.error('Error updating video info:', error);
      });
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      if (!formData.title.trim()) {
        toast.error('Vui lòng nhập tiêu đề video');
        return;
      }
      
      if (!formData.categoryId) {
        toast.error('Vui lòng chọn danh mục');
        return;
      }

      const updateData: Partial<ShortVideo> = {
        title: formData.title.trim(),
        caption: formData.caption.trim(),
        categoryId: formData.categoryId,
        status: formData.status,
        updatedAt: Date.now()
      };

      await videosService.update(id as string, updateData);
      toast.success('Cập nhật video thành công!');
      router.push('/videos');
    } catch (error) {
      console.error('Error saving video:', error);
      toast.error('Có lỗi khi lưu video');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await videosService.delete(id as string);
      toast.success('Xóa video thành công!');
      router.push('/videos');
    } catch (error) {
      console.error('Error deleting video:', error);
      toast.error('Có lỗi khi xóa video');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'success';
      case 'draft': return 'warning';
      case 'processing': return 'info';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'published': return 'Đã xuất bản';
      case 'draft': return 'Bản nháp';
      case 'processing': return 'Đang xử lý';
      case 'failed': return 'Lỗi';
      default: return 'Không xác định';
    }
  };

  const handleDeleteComment = async () => {
    if (!commentToDelete || !video?.id) return;
    
    try {
      await videosService.deleteComment(video.id, commentToDelete);
      toast.success('Đã xóa comment');
      setCommentToDelete(null);
      
      const updatedVideo = await videosService.getById(video.id);
      if (updatedVideo) {
        setVideo(updatedVideo);
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Có lỗi xảy ra khi xóa comment');
    }
  };

  const handleBanUser = async () => {
    if (!userToBan) return;
    
    try {
      console.log('Banning user:', userToBan);
      toast.success('Đã ban user');
    } catch (error) {
      console.error('Error banning user:', error);
      toast.error('Có lỗi xảy ra khi ban user');
    }
    setUserToBan(null);
  };

  const formatDate = (timestamp: number) => {
    try {
      if (!timestamp || isNaN(timestamp)) return 'N/A';
      return new Date(timestamp).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'N/A';
    }
  };

  if (loading) {
    return (
      <AuthGuard>
        <LayoutWrapper darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
          <Box p={3}>
            <LinearProgress />
            <Typography variant="h6" textAlign="center" mt={2}>
              Đang tải...
            </Typography>
          </Box>
        </LayoutWrapper>
      </AuthGuard>
    );
  }

  if (!video) {
    return (
      <AuthGuard>
        <LayoutWrapper darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
          <Box p={3}>
            <Alert severity="error">Video không tồn tại</Alert>
          </Box>
        </LayoutWrapper>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <LayoutWrapper darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
        <Box p={3}>
          {/* Header */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Box display="flex" alignItems="center" gap={2}>
              <IconButton onClick={() => router.push('/videos')}>
                <ArrowBack />
              </IconButton>
              <Box>
                <Typography variant="h4" component="h1" fontWeight="bold">
                  Chỉnh sửa Video
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  ID: {video.id}
                </Typography>
              </Box>
            </Box>
            <Box display="flex" gap={1}>
              <Button
                variant="outlined"
                color="error"
                startIcon={<Delete />}
                onClick={() => setDeleteDialogOpen(true)}
              >
                Xóa
              </Button>
              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </Button>
            </Box>
          </Box>

          <Grid container spacing={3}>
            {/* Video Preview */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <VideoLibrary sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Video Preview
                  </Typography>
                  
                  {(video.videoUrl || video.cldPublicId || video.cloudinaryPublicId) && (
                    <Box mb={2}>
                      <VideoPlayer
                        cloudinaryPublicId={video.cldPublicId || video.cloudinaryPublicId}
                        videoUrl={video.videoUrl}
                        thumbnailUrl={video.thumbnailUrl || video.thumb}
                        title={video.title}
                        controls={true}
                        muted={false}
                        width="100%"
                        height={250}
                        onVideoInfoLoaded={handleVideoInfoLoaded}
                      />
                    </Box>
                  )}
                  
                  {!(video.videoUrl || video.cldPublicId || video.cloudinaryPublicId) && (
                    <Box mb={2} p={2} bgcolor="grey.100" borderRadius={1}>
                      <Typography color="text.secondary">
                        Video không có sẵn hoặc đang tải...
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Video URL: {video.videoUrl || 'không có'}
                      </Typography>
                      <br />
                      <Typography variant="caption" color="text.secondary">
                        Cloudinary ID: {video.cldPublicId || video.cloudinaryPublicId || 'không có'}
                      </Typography>
                    </Box>
                  )}
                  
                  <Box display="flex" gap={1} mb={2}>
                    <Chip 
                      label={getStatusLabel(video.status || 'processing')} 
                      color={getStatusColor(video.status || 'processing') as any}
                      size="small"
                    />
                    <Chip 
                      label={`${video.viewCount || 0} lượt xem`}
                      size="small"
                    />
                    <Chip 
                      label={`${video.likeCount || 0} lượt thích`}
                      size="small"
                    />
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary">
                    <strong>Tải lên:</strong> {new Date(video.uploadDate).toLocaleString('vi-VN')}
                  </Typography>
                  {video.updatedAt && (
                    <Typography variant="body2" color="text.secondary">
                      <strong>Cập nhật:</strong> {new Date(video.updatedAt).toLocaleString('vi-VN')}
                    </Typography>
                  )}
                  <Typography variant="body2" color="text.secondary">
                    <strong>Thời lượng:</strong> {
                      videoInfo 
                        ? `${Math.floor(videoInfo.duration / 60)}:${Math.floor(videoInfo.duration % 60).toString().padStart(2, '0')}`
                        : `${Math.floor((video.duration || 0) / 60)}:${((video.duration || 0) % 60).toString().padStart(2, '0')}`
                    }
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Kích thước:</strong> {
                      videoInfo 
                        ? videoInfo.dimensions
                        : `${video.width || 'x'}x${video.height || 'x'}`
                    }
                  </Typography>
                  {videoInfo && (
                    <Typography variant="body2" color="text.secondary">
                      <strong>Dung lượng:</strong> {videoInfo.fileSize}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Edit Form */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <Edit sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Thông tin video
                  </Typography>
                  
                  <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                      label="Tiêu đề video *"
                      fullWidth
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      error={!formData.title.trim()}
                      helperText={!formData.title.trim() ? 'Vui lòng nhập tiêu đề' : ''}
                    />
                    
                    <TextField
                      label="Mô tả video"
                      fullWidth
                      multiline
                      rows={3}
                      value={formData.caption}
                      onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                      placeholder="Nhập mô tả cho video..."
                    />
                    
                    <FormControl fullWidth>
                      <InputLabel>Danh mục *</InputLabel>
                      <Select
                        value={formData.categoryId}
                        onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                        label="Danh mục *"
                        error={!formData.categoryId}
                      >
                        {categories.map(category => (
                          <MenuItem key={category.id} value={category.id}>
                            <Box display="flex" alignItems="center" gap={1}>
                              <Box
                                width={12}
                                height={12}
                                borderRadius="50%"
                                bgcolor={category.color}
                              />
                              {category.name}
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    
                    <FormControl fullWidth>
                      <InputLabel>Trạng thái</InputLabel>
                      <Select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as ShortVideo['status'] })}
                        label="Trạng thái"
                      >
                        <MenuItem value="draft">Bản nháp</MenuItem>
                        <MenuItem value="published">Đã xuất bản</MenuItem>
                        <MenuItem value="processing">Đang xử lý</MenuItem>
                        <MenuItem value="failed">Lỗi</MenuItem>
                      </Select>
                    </FormControl>
                    
                    {saving && <LinearProgress />}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Comment Management Section */}
          <Box mt={3}>
            <Card>
              <CardContent>
                <CommentSection
                  video={video}
                  onDeleteComment={setCommentToDelete}
                  onBanUser={setUserToBan}
                  formatDate={formatDate}
                />
              </CardContent>
            </Card>
          </Box>

          {/* Delete Comment Confirmation Dialog */}
          <Dialog open={!!commentToDelete} onClose={() => setCommentToDelete(null)}>
            <DialogTitle>Xác nhận xóa comment</DialogTitle>
            <DialogContent>
              <Typography>
                Bạn có chắc chắn muốn xóa comment này? 
                Hành động này không thể hoàn tác.
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setCommentToDelete(null)}>Hủy</Button>
              <Button onClick={handleDeleteComment} color="error" variant="contained">
                Xóa
              </Button>
            </DialogActions>
          </Dialog>

          {/* Ban User Confirmation Dialog */}
          <Dialog open={!!userToBan} onClose={() => setUserToBan(null)}>
            <DialogTitle>Xác nhận ban user</DialogTitle>
            <DialogContent>
              <Typography>
                Bạn có chắc chắn muốn ban user này? 
                User sẽ không thể comment trên hệ thống.
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setUserToBan(null)}>Hủy</Button>
              <Button onClick={handleBanUser} color="error" variant="contained">
                Ban User
              </Button>
            </DialogActions>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
            <DialogTitle>Xác nhận xóa video</DialogTitle>
            <DialogContent>
              <Typography>
                Bạn có chắc chắn muốn xóa video "{video.title}"? 
                Hành động này không thể hoàn tác.
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDeleteDialogOpen(false)}>Hủy</Button>
              <Button onClick={handleDelete} color="error" variant="contained">
                Xóa
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </LayoutWrapper>
    </AuthGuard>
  );
}