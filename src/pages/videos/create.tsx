import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Stack,
  Paper,
  Divider,
  FormControlLabel,
  Switch,
  Alert
} from '@mui/material';
import {
  Save,
  Cancel,
  VideoLibrary,
  Add,
  PlayArrow
} from '@mui/icons-material';
import LayoutWrapper from '../../components/LayoutWrapper';
import AuthGuard, { useCurrentUser } from '../../components/AuthGuard';
import MediaUploadForm from '../../components/MediaUploadForm';
import VideoPlayer from '../../components/VideoPlayer';
import { categoriesService } from '../../services/firebase';
import { Media } from '../../types';
import toast from 'react-hot-toast';

interface CreateVideoPageProps {
  darkMode?: boolean;
  toggleDarkMode?: () => void;
}

export default function CreateVideoPage({ darkMode, toggleDarkMode }: CreateVideoPageProps) {
  const router = useRouter();
  const { currentUser } = useCurrentUser();
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>('draft');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [isFeature, setIsFeature] = useState(false);
  const [uploadedVideo, setUploadedVideo] = useState<Media | null>(null);
  const [showVideoUpload, setShowVideoUpload] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const categoriesList = await categoriesService.getAll();
      setCategories(categoriesList);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Vui lòng nhập tiêu đề video');
      return;
    }

    if (!category) {
      toast.error('Vui lòng chọn danh mục');
      return;
    }

    if (!uploadedVideo) {
      toast.error('Vui lòng upload video');
      return;
    }

    try {
      setSaving(true);
      const now = Date.now();
      
      // Tạo short video record trong database
      const newVideo = {
        title: title.trim(),
        description: description.trim(),
        categoryId: category,
        tags,
        status,
        author: currentUser?.displayName || 'Admin',
        createdAt: now,
        updatedAt: now,
        publishedAt: status === 'published' ? now : undefined,
        viewCount: 0,
        likeCount: 0,
        isFeature,
        videoUrl: uploadedVideo.secure_url,
        thumbnailUrl: uploadedVideo.thumbnail_url,
        duration: uploadedVideo.duration || 0,
        mediaId: uploadedVideo.id,
        uploader: currentUser?.uid || 'unknown'
      };

      // TODO: Create videoService similar to healthTipsService
      // await videoService.create(newVideo);
      
      console.log('Video data to save:', newVideo);
      toast.success('Video đã được tạo thành công! (Chưa lưu database - cần tạo videoService)');
      
      // router.push('/videos');
    } catch (error) {
      console.error('Error creating video:', error);
      toast.error('Có lỗi khi tạo video');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (uploadedVideo || title || description) {
      if (window.confirm('Bạn có chắc muốn hủy? Dữ liệu chưa lưu sẽ bị mất.')) {
        router.push('/videos');
      }
    } else {
      router.push('/videos');
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleVideoUploadComplete = (media: Media[]) => {
    const videoFile = media.find(m => m.type === 'video');
    if (videoFile) {
      setUploadedVideo(videoFile);
      setShowVideoUpload(false);
      toast.success('Video upload thành công!');
    }
  };

  return (
    <AuthGuard>
      <LayoutWrapper darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
        <Box p={3}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4">Tạo Video Mới</Typography>
            <Stack direction="row" spacing={2}>
              <Button 
                variant="outlined" 
                startIcon={<Cancel />}
                onClick={handleCancel}
              >
                Hủy
              </Button>
              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Đang lưu...' : 'Lưu Video'}
              </Button>
            </Stack>
          </Box>

          <Grid container spacing={3}>
            {/* Main content */}
            <Grid item xs={12} md={8}>
              <Stack spacing={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Thông tin cơ bản</Typography>
                    <Stack spacing={2}>
                      <TextField
                        label="Tiêu đề video"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        fullWidth
                        required
                        placeholder="Nhập tiêu đề cho video..."
                      />
                      <TextField
                        label="Mô tả"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        fullWidth
                        multiline
                        rows={4}
                        placeholder="Mô tả ngắn về nội dung video..."
                      />
                    </Stack>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">Video Upload</Typography>
                      {uploadedVideo && (
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => setShowVideoUpload(!showVideoUpload)}
                          startIcon={<VideoLibrary />}
                        >
                          {showVideoUpload ? 'Ẩn Upload' : 'Thay đổi Video'}
                        </Button>
                      )}
                    </Box>
                    
                    {showVideoUpload && (
                      <Box sx={{ mb: 2 }}>
                        <Alert severity="info" sx={{ mb: 2 }}>
                          Chỉ upload 1 video duy nhất. Định dạng hỗ trợ: MP4, MOV, AVI, MKV, WebM. Kích thước tối đa: 100MB
                        </Alert>
                        <MediaUploadForm
                          onUploadComplete={handleVideoUploadComplete}
                          allowMultiple={false}
                          acceptedTypes={{ 'video/*': ['.mp4', '.mov', '.avi', '.mkv', '.webm'] }}
                        />
                      </Box>
                    )}
                    
                    {uploadedVideo && (
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          Video đã upload
                        </Typography>
                        <Paper sx={{ p: 2 }}>
                          <VideoPlayer
                            media={uploadedVideo}
                            controls={true}
                          />
                          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                              <Typography variant="body2">
                                <strong>File:</strong> {uploadedVideo.original_filename}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                <strong>Kích thước:</strong> {(uploadedVideo.bytes! / (1024 * 1024)).toFixed(2)} MB
                                {uploadedVideo.duration && (
                                  <> • <strong>Thời lượng:</strong> {Math.round(uploadedVideo.duration)}s</>
                                )}
                              </Typography>
                            </Box>
                            <Button
                              color="error"
                              size="small"
                              onClick={() => {
                                setUploadedVideo(null);
                                setShowVideoUpload(true);
                              }}
                            >
                              Xóa
                            </Button>
                          </Box>
                        </Paper>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Stack>
            </Grid>

            {/* Sidebar */}
            <Grid item xs={12} md={4}>
              <Stack spacing={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Trạng thái</Typography>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>Trạng thái xuất bản</InputLabel>
                      <Select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as any)}
                        label="Trạng thái xuất bản"
                      >
                        <MenuItem value="draft">Bản nháp</MenuItem>
                        <MenuItem value="published">Đã xuất bản</MenuItem>
                        <MenuItem value="archived">Lưu trữ</MenuItem>
                      </Select>
                    </FormControl>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={isFeature}
                          onChange={(e) => setIsFeature(e.target.checked)}
                        />
                      }
                      label="Video nổi bật"
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Phân loại</Typography>
                    <FormControl fullWidth>
                      <InputLabel>Danh mục</InputLabel>
                      <Select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        label="Danh mục"
                        required
                      >
                        <MenuItem value="">Chọn danh mục</MenuItem>
                        {categories.map((cat) => (
                          <MenuItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Tags</Typography>
                    <Stack spacing={2}>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <TextField
                          label="Thêm tag"
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          size="small"
                          onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                        />
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={handleAddTag}
                          startIcon={<Add />}
                        >
                          Thêm
                        </Button>
                      </Box>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {tags.map((tag, index) => (
                          <Chip
                            key={index}
                            label={tag}
                            onDelete={() => handleRemoveTag(tag)}
                            variant="outlined"
                            size="small"
                          />
                        ))}
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Stack>
            </Grid>
          </Grid>
        </Box>
      </LayoutWrapper>
    </AuthGuard>
  );
}
