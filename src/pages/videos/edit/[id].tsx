import React, { useState, useEffect, Fragment } from 'react';
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
  ListItemText,
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
  ExpandLess,
  ExpandMore,
  PersonOff,
  Clear
} from '@mui/icons-material';
import LayoutWrapper from '../../../components/LayoutWrapper';
import AuthGuard from '../../../components/AuthGuard';
import VideoPlayer from '../../../components/VideoPlayer';
import { videosService, categoriesService } from '../../../services/firebase';
import { ShortVideo, Category } from '../../../types';
import toast from 'react-hot-toast';

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
  
  // Comment management states
  const [showComments, setShowComments] = useState(false);
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
    
    // Cập nhật thông tin video trong database nếu cần
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

  // Comment management functions
  const getComments = () => {
    if (!video?.comments) return [];
    
    try {
      return Object.keys(video.comments).map(commentId => {
        const comment = video.comments![commentId];
        if (!comment || typeof comment !== 'object') return null;
        
        // Debug log to see the actual comment data
        console.log('Processing comment:', commentId, comment);
        
        // Cast to any to handle dynamic field names from Firebase
        const commentData = comment as any;
        
        return {
          id: String(commentId),
          userId: String(commentData.userId || commentData.uid || ''),
          username: String(commentData.username || commentData.displayName || commentData.userName || ''),
          content: String(commentData.content || commentData.text || commentData.message || ''),
          timestamp: Number(commentData.timestamp || commentData.createdAt || commentData.date || Date.now()),
          likes: Number(commentData.likes || commentData.likeCount || 0),
          replies: commentData.replies || {},
          replyCount: commentData.replies ? Object.keys(commentData.replies).length : 0
        };
      }).filter(Boolean).sort((a, b) => (b?.timestamp || 0) - (a?.timestamp || 0));
    } catch (error) {
      console.error('Error processing comments:', error);
      return [];
    }
  };

  const handleDeleteComment = async () => {
    if (!commentToDelete || !video?.id) return;
    
    try {
      await videosService.deleteComment(video.id, commentToDelete);
      toast.success('Đã xóa comment');
      setCommentToDelete(null);
      
      // Refresh video data
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
      // TODO: Implement user banning logic
      toast.success(`Đã ban user ${userToBan}`);
      setUserToBan(null);
    } catch (error) {
      console.error('Error banning user:', error);
      toast.error('Có lỗi xảy ra khi ban user');
    }
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

  // Render replies recursively
  const renderReplies = (replies: Record<string, any>, level: number = 0, parentComment?: any) => {
    if (!replies || typeof replies !== 'object') return null;
    
    return Object.keys(replies).map((replyId, index) => {
      const reply = replies[replyId];
      if (!reply || typeof reply !== 'object') return null;
      
      // Cast to any to handle dynamic field names
      const replyData = reply as any;
      
      return (
        <Box key={`reply-${replyId}-${level}`} sx={{ ml: level * 3 + 2, mt: 1 }}>
          <Box display="flex" alignItems="flex-start" gap={1}>
            <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem', bgcolor: 'secondary.main' }}>
              {String(replyData.userId || replyData.uid || '').charAt(0)?.toUpperCase() || 'R'}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" component="div" fontWeight="bold">
                    {String(replyData.username || replyData.displayName || replyData.userName || `User: ${String(replyData.userId || replyData.uid || '').substring(0, 8)}...`)}
                  </Typography>
                  
                  {/* Reply context - show what this is replying to */}
                  {parentComment && (
                    <Typography variant="caption" color="text.secondary" sx={{ 
                      fontStyle: 'italic', 
                      display: 'block',
                      bgcolor: 'grey.100',
                      p: 0.5,
                      borderRadius: 0.5,
                      mb: 0.5,
                      border: '1px solid',
                      borderColor: 'grey.300'
                    }}>
                      💬 Trả lời <strong>@{String(parentComment.username || parentComment.displayName || parentComment.userName || `User_${String(parentComment.userId || parentComment.uid || '').substring(0, 8)}`)}</strong>: 
                      "{String(parentComment.content || parentComment.text || parentComment.message || 'Không có nội dung').substring(0, 50)}{String(parentComment.content || parentComment.text || parentComment.message || '').length > 50 ? '...' : ''}"
                    </Typography>
                  )}
                  
                  <Typography variant="caption" color="text.secondary">
                    {replyData.timestamp ? formatDate(replyData.timestamp || replyData.createdAt || replyData.date || 0) : 'Không có thời gian'}
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.875rem', mt: 0.5 }}>
                    {String(replyData.content || replyData.text || replyData.message || '') || 
                     <em style={{ color: '#999' }}>Không có nội dung reply</em>}
                  </Typography>
                  <Box display="flex" alignItems="center" gap={0.5} sx={{ mt: 0.5 }}>
                    <Badge badgeContent={replyData.likes || replyData.likeCount || 0} color="primary">
                      <Chip size="small" label="Likes" sx={{ fontSize: '0.7rem', height: '20px' }} />
                    </Badge>
                  </Box>
                </Box>
                <Box display="flex" gap={0.5}>
                  <IconButton 
                    size="small" 
                    sx={{ padding: '2px' }}
                    onClick={() => setCommentToDelete(replyId)}
                    color="error"
                    title="Xóa reply"
                  >
                    <Delete sx={{ fontSize: '14px' }} />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    sx={{ padding: '2px' }}
                    onClick={() => setUserToBan(String(replyData.userId || replyData.uid || ''))}
                    color="error"
                    title="Ban user"
                  >
                    <PersonOff sx={{ fontSize: '14px' }} />
                  </IconButton>
                </Box>
              </Box>
              {/* Recursive replies */}
              {replyData.replies && Object.keys(replyData.replies).length > 0 && (
                <Box sx={{ mt: 1 }}>
                  {renderReplies(replyData.replies, level + 1, replyData)}
                </Box>
              )}
            </Box>
          </Box>
          {index < Object.keys(replies).length - 1 && (
            <Divider sx={{ ml: 3, mt: 1, opacity: 0.3 }} />
          )}
        </Box>
      );
    });
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
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">
                    <Comment sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Quản lý Comments ({getComments().length})
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setShowComments(!showComments)}
                    endIcon={showComments ? <ExpandLess /> : <ExpandMore />}
                  >
                    {showComments ? 'Thu gọn' : 'Xem tất cả'}
                  </Button>
                </Box>
                
                <Collapse in={showComments}>
                  <Paper variant="outlined" sx={{ maxHeight: 400, overflow: 'auto' }}>
                    {getComments().length === 0 ? (
                      <Box p={3} textAlign="center">
                        <Typography variant="body2" color="text.secondary">
                          Chưa có comment nào cho video này
                        </Typography>
                      </Box>
                    ) : (
                      <List>
                        {getComments().map((comment, index) => {
                          if (!comment) return null;
                          const commentId = comment.id;
                          return (
                            <React.Fragment key={`comment-${index}-${commentId}`}>
                              <ListItem alignItems="flex-start">
                                <ListItemAvatar>
                                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                                    {comment.userId?.charAt(0)?.toUpperCase() || 'U'}
                                  </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                  primary={
                                    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                                      <Box sx={{ flex: 1 }}>
                                        <Typography variant="subtitle2" component="div">
                                          {String(comment.username || `User: ${comment.userId?.substring(0, 8)}...`)}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                          {formatDate(comment.timestamp)}
                                        </Typography>
                                      </Box>
                                      <Box display="flex" gap={0.5}>
                                        <IconButton 
                                          size="small" 
                                          onClick={() => setCommentToDelete(commentId)}
                                          color="error"
                                          title="Xóa comment"
                                        >
                                          <Delete />
                                        </IconButton>
                                        <IconButton 
                                          size="small" 
                                          onClick={() => setUserToBan(comment.userId)}
                                          color="error"
                                          title="Ban user"
                                        >
                                          <PersonOff />
                                        </IconButton>
                                      </Box>
                                    </Box>
                                  }
                                  secondary={
                                    <Box mt={1}>
                                      <Typography variant="body2" sx={{ mb: 1 }}>
                                        {String(comment.content || '') || 
                                         <em style={{ color: '#999' }}>Không có nội dung comment</em>}
                                      </Typography>
                                      <Box display="flex" alignItems="center" gap={1}>
                                        <Badge badgeContent={comment.likes || 0} color="primary">
                                          <Chip size="small" label="Likes" />
                                        </Badge>
                                        {comment.replyCount > 0 && (
                                          <Chip 
                                            size="small" 
                                            label={`${comment.replyCount} replies`} 
                                            variant="outlined" 
                                          />
                                        )}
                                      </Box>
                                      
                                      {/* Replies Section */}
                                      {comment.replies && Object.keys(comment.replies).length > 0 && (
                                        <Box sx={{ mt: 2, p: 1, bgcolor: 'grey.50', borderRadius: 1, border: '1px solid', borderColor: 'grey.200' }}>
                                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', mb: 1, display: 'block' }}>
                                            💬 Replies ({Object.keys(comment.replies).length}):
                                          </Typography>
                                          {renderReplies(comment.replies, 0, comment)}
                                        </Box>
                                      )}
                                    </Box>
                                  }
                                />
                              </ListItem>
                              {index < getComments().length - 1 && <Divider variant="inset" component="li" />}
                            </React.Fragment>
                          );
                        })}
                      </List>
                    )}
                  </Paper>
                </Collapse>
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
