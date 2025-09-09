import React, { useState, useEffect } from 'react';
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
  DialogActions
} from '@mui/material';
import {
  ArrowBack,
  Save,
  Delete,
  VideoLibrary,
  Edit,
  Visibility
} from '@mui/icons-material';
import LayoutWrapper from '../../../components/LayoutWrapper';
import AuthGuard from '../../../components/AuthGuard';
import VideoPlayer from '../../../components/VideoPlayer';
import { videosService, categoriesService } from '../../../services/firebase';
import { ShortVideo, Category } from '../../../types';
import { getCloudinaryVideoUrl, getCloudinaryVideoThumbnail } from '../../../utils/cloudinary';
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
                startIcon={<Visibility />}
                onClick={() => window.open(`/videos/${video.id}`, '_blank')}
              >
                Xem trước
              </Button>
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
                  
                  {video.videoUrl && (
                    <Box mb={2}>
                      <VideoPlayer
                        videoUrl={getCloudinaryVideoUrl(video.cloudinaryPublicId || video.videoUrl)}
                        thumbnailUrl={getCloudinaryVideoThumbnail(video.cloudinaryPublicId || video.videoUrl)}
                        title={video.title}
                      />
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
                    <strong>Thời lượng:</strong> {Math.floor((video.duration || 0) / 60)}:{((video.duration || 0) % 60).toString().padStart(2, '0')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Kích thước:</strong> {video.width}x{video.height}
                  </Typography>
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
