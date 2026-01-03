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
  PlayArrow,
  Image,
  Link
} from '@mui/icons-material';
import LayoutWrapper from '../../components/LayoutWrapper';
import AuthGuard, { useCurrentUser } from '../../components/AuthGuard';
import MediaUploadForm from '../../components/MediaUploadForm';
import VideoPlayer from '../../components/VideoPlayer';
import { categoriesService, videosService } from '../../services/firebase';
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
  
  // Thumbnail states
  const [thumbnailType, setThumbnailType] = useState<'upload' | 'url'>('upload');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [uploadedThumbnail, setUploadedThumbnail] = useState<Media | null>(null);
  const [showThumbnailUpload, setShowThumbnailUpload] = useState(false);
  const [thumbnailUrlError, setThumbnailUrlError] = useState('');

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

    // Validate thumbnail
    const finalThumbnailUrl = getThumbnailUrl();
    // Thumbnail is optional now - will auto-generate from video if not provided
    if (!finalThumbnailUrl && !uploadedVideo) {
      toast.error('Vui lòng upload video');
      return;
    }

    // Validate thumbnail URL if using URL method
    if (thumbnailType === 'url' && thumbnailUrl.trim()) {
      const isValidUrl = await validateThumbnailUrl(thumbnailUrl);
      if (!isValidUrl) {
        toast.error('Link thumbnail không hợp lệ');
        return;
      }
    }

    try {
      setSaving(true);
      const now = Date.now();
      
      // Tạo short video record theo đúng interface ShortVideo
      const newVideo: any = {
        title: title.trim(),
        caption: description.trim() || title.trim(),
        categoryId: category,
        status,
        userId: currentUser?.uid || 'demo_user',
        uploadDate: now,
        createdAt: now,
        updatedAt: now,
        viewCount: 0,
        likeCount: 0,
        videoUrl: uploadedVideo.secure_url,
        thumbnailUrl: finalThumbnailUrl, // Required field
        thumb: finalThumbnailUrl, // For compatibility with data sample
        duration: uploadedVideo.duration || 0,
        width: uploadedVideo.width || 576,
        height: uploadedVideo.height || 1024,
        // Cloudinary info
        cloudinaryPublicId: uploadedVideo.public_id,
        cldPublicId: uploadedVideo.public_id,
        cldVersion: uploadedVideo.version || Math.floor(Date.now() / 1000),
        // Convert tags array to object
        tags: tags.reduce((acc: any, tag: string) => {
          acc[tag] = true;
          return acc;
        }, {}),
        comments: {} // Initialize empty comments object
      };

      // Only add publishedAt if status is published  
      if (status === 'published') {
        newVideo.publishedAt = now;
      }

      // TODO: Create videoService similar to healthTipsService
      const videoId = await videosService.create(newVideo);
      
      console.log('Video saved with ID:', videoId);
      toast.success('Video đã được tạo thành công!');
      
      router.push('/videos');
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

  const handleThumbnailUploadComplete = (media: Media[]) => {
    const imageFile = media.find(m => m.type === 'image');
    if (imageFile) {
      setUploadedThumbnail(imageFile);
      setShowThumbnailUpload(false);
      toast.success('Thumbnail upload thành công!');
    }
  };

  const validateThumbnailUrl = async (url: string): Promise<boolean> => {
    if (!url.trim()) {
      setThumbnailUrlError('');
      return true;
    }

    try {
      // Check if URL is valid format
      new URL(url);
      
      // Try to load image to check if it exists
      const img = document.createElement('img');
      img.crossOrigin = 'anonymous';
      
      const loadPromise = new Promise<boolean>((resolve) => {
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
      });
      
      img.src = url;
      const isValid = await loadPromise;
      
      if (!isValid) {
        setThumbnailUrlError('Link ảnh không hợp lệ hoặc không thể truy cập');
        return false;
      }
      
      setThumbnailUrlError('');
      return true;
    } catch (error) {
      setThumbnailUrlError('Link không hợp lệ');
      return false;
    }
  };

  const handleThumbnailUrlChange = async (url: string) => {
    setThumbnailUrl(url);
    if (url.trim()) {
      await validateThumbnailUrl(url);
    }
  };

  const getThumbnailUrl = (): string => {
    if (thumbnailType === 'upload' && uploadedThumbnail) {
      return uploadedThumbnail.secure_url;
    } else if (thumbnailType === 'url' && thumbnailUrl.trim()) {
      return thumbnailUrl;
    } else if (uploadedVideo?.public_id) {
      // Auto-generate thumbnail from video using Cloudinary
      const publicId = uploadedVideo.public_id;
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dazo6ypwt';
      // Generate thumbnail from video at 0 seconds with random offset
      const randomOffset = Math.floor(Math.random() * 5); // Random 0-5 seconds
      return `https://res.cloudinary.com/${cloudName}/video/upload/so_${randomOffset},w_400,h_300,c_fill,q_auto,f_jpg/${publicId}.jpg`;
    } else if (uploadedVideo?.thumbnail_url) {
      // Fallback to video thumbnail if available
      return uploadedVideo.thumbnail_url;
    }
    return '';
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

                {/* Thumbnail Card - Always show */}
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Thumbnail Video
                      <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                        (Không bắt buộc - sẽ tự động lấy từ video)
                      </Typography>
                    </Typography>
                    
                    {/* Thumbnail Type Selection */}
                    <FormControl component="fieldset" sx={{ mb: 2 }}>
                      <Stack direction="row" spacing={2}>
                        <Button
                          variant={thumbnailType === 'upload' ? 'contained' : 'outlined'}
                          onClick={() => setThumbnailType('upload')}
                          size="small"
                        >
                          Upload Ảnh
                        </Button>
                        <Button
                          variant={thumbnailType === 'url' ? 'contained' : 'outlined'}
                          onClick={() => setThumbnailType('url')}
                          size="small"
                        >
                          Nhập Link
                        </Button>
                      </Stack>
                    </FormControl>

                    {/* Upload Image Option */}
                    {thumbnailType === 'upload' && (
                      <Box>
                        {!uploadedThumbnail ? (
                          <Box>
                            <Button
                              variant="outlined"
                              onClick={() => setShowThumbnailUpload(true)}
                              sx={{ mb: 2 }}
                            >
                              Chọn Ảnh Thumbnail
                            </Button>
                            
                            {showThumbnailUpload && (
                              <Box sx={{ mb: 2 }}>
                                <Alert severity="info" sx={{ mb: 2 }}>
                                  Upload ảnh làm thumbnail cho video. Định dạng: JPG, PNG, WebP
                                </Alert>
                                <MediaUploadForm
                                  onUploadComplete={handleThumbnailUploadComplete}
                                  allowMultiple={false}
                                />
                              </Box>
                            )}
                          </Box>
                        ) : (
                          <Box>
                            <Typography variant="subtitle2" gutterBottom>
                              Thumbnail đã upload
                            </Typography>
                            <Paper sx={{ p: 2, maxWidth: 300 }}>
                              <Box
                                component="img"
                                src={uploadedThumbnail.secure_url}
                                alt="Thumbnail"
                                sx={{
                                  width: '100%',
                                  height: 'auto',
                                  borderRadius: 1
                                }}
                              />
                              <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="caption">
                                  {uploadedThumbnail.original_filename}
                                </Typography>
                                <Button
                                  color="error"
                                  size="small"
                                  onClick={() => {
                                    setUploadedThumbnail(null);
                                    setShowThumbnailUpload(false);
                                  }}
                                >
                                  Xóa
                                </Button>
                              </Box>
                            </Paper>
                          </Box>
                        )}
                      </Box>
                    )}

                    {/* URL Input Option */}
                    {thumbnailType === 'url' && (
                      <Box>
                        <TextField
                          label="Link ảnh thumbnail"
                          value={thumbnailUrl}
                          onChange={(e) => handleThumbnailUrlChange(e.target.value)}
                          fullWidth
                          placeholder="https://example.com/thumbnail.jpg"
                          error={!!thumbnailUrlError}
                          helperText={thumbnailUrlError || 'Nhập link ảnh thumbnail cho video'}
                          sx={{ mb: 2 }}
                        />
                        
                        {thumbnailUrl && !thumbnailUrlError && (
                          <Box>
                            <Typography variant="subtitle2" gutterBottom>
                              Preview thumbnail
                            </Typography>
                            <Paper sx={{ p: 2, maxWidth: 300 }}>
                              <Box
                                component="img"
                                src={thumbnailUrl}
                                alt="Thumbnail preview"
                                sx={{
                                  width: '100%',
                                  height: 'auto',
                                  borderRadius: 1
                                }}
                                onError={() => setThumbnailUrlError('Không thể tải ảnh từ link này')}
                              />
                            </Paper>
                          </Box>
                        )}
                      </Box>
                    )}
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

                {/* Thumbnail Card */}
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Thumbnail Video</Typography>
                    
                    {/* Thumbnail Type Selection */}
                    <FormControl component="fieldset" sx={{ mb: 2 }}>
                      <Stack direction="row" spacing={2}>
                        <Button
                          variant={thumbnailType === 'upload' ? 'contained' : 'outlined'}
                          onClick={() => setThumbnailType('upload')}
                          size="small"
                        >
                          Upload Ảnh
                        </Button>
                        <Button
                          variant={thumbnailType === 'url' ? 'contained' : 'outlined'}
                          onClick={() => setThumbnailType('url')}
                          size="small"
                        >
                          Nhập Link
                        </Button>
                      </Stack>
                    </FormControl>

                    {/* Upload Image Option */}
                    {thumbnailType === 'upload' && (
                      <Box>
                        {!uploadedThumbnail ? (
                          <Box>
                            <Button
                              variant="outlined"
                              onClick={() => setShowThumbnailUpload(true)}
                              sx={{ mb: 2 }}
                            >
                              Chọn Ảnh Thumbnail
                            </Button>
                            
                            {showThumbnailUpload && (
                              <Box sx={{ mb: 2 }}>
                                <Alert severity="info" sx={{ mb: 2 }}>
                                  Upload ảnh làm thumbnail cho video. Định dạng: JPG, PNG, WebP
                                </Alert>
                                <MediaUploadForm
                                  onUploadComplete={handleThumbnailUploadComplete}
                                  allowMultiple={false}
                                  acceptedTypes={{ 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] }}
                                />
                              </Box>
                            )}
                          </Box>
                        ) : (
                          <Box>
                            <Typography variant="subtitle2" gutterBottom>
                              Thumbnail đã upload
                            </Typography>
                            <Paper sx={{ p: 2, maxWidth: 300 }}>
                              <Box
                                component="img"
                                src={uploadedThumbnail.secure_url}
                                alt="Thumbnail"
                                sx={{
                                  width: '100%',
                                  height: 'auto',
                                  borderRadius: 1
                                }}
                              />
                              <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="caption">
                                  {uploadedThumbnail.original_filename}
                                </Typography>
                                <Button
                                  color="error"
                                  size="small"
                                  onClick={() => {
                                    setUploadedThumbnail(null);
                                    setShowThumbnailUpload(false);
                                  }}
                                >
                                  Xóa
                                </Button>
                              </Box>
                            </Paper>
                          </Box>
                        )}
                      </Box>
                    )}

                    {/* URL Input Option */}
                    {thumbnailType === 'url' && (
                      <Box>
                        <TextField
                          label="Link ảnh thumbnail"
                          value={thumbnailUrl}
                          onChange={(e) => handleThumbnailUrlChange(e.target.value)}
                          fullWidth
                          placeholder="https://example.com/thumbnail.jpg"
                          error={!!thumbnailUrlError}
                          helperText={thumbnailUrlError || 'Nhập link ảnh thumbnail cho video'}
                          sx={{ mb: 2 }}
                        />
                        
                        {thumbnailUrl && !thumbnailUrlError && (
                          <Box>
                            <Typography variant="subtitle2" gutterBottom>
                              Preview thumbnail
                            </Typography>
                            <Paper sx={{ p: 2, maxWidth: 300 }}>
                              <Box
                                component="img"
                                src={thumbnailUrl}
                                alt="Thumbnail preview"
                                sx={{
                                  width: '100%',
                                  height: 'auto',
                                  borderRadius: 1
                                }}
                                onError={() => setThumbnailUrlError('Không thể tải ảnh từ link này')}
                              />
                            </Paper>
                          </Box>
                        )}
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
