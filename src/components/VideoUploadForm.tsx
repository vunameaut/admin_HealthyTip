import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Chip,
  Stack,
  Alert,
  Divider
} from '@mui/material';
import {
  CloudUpload,
  VideoLibrary,
  Delete,
  Add,
  Save,
  Cancel,
  Image
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { Category } from '../types';
import UploadProgress, { UploadItem } from './UploadProgress';

interface VideoFormData {
  title: string;
  caption: string;
  categoryId: string;
  status: 'draft' | 'published';
  tags: string;
  thumbnailUrl: string;
  thumbnailType: 'auto' | 'url';
}

interface VideoUploadFormProps {
  open: boolean;
  onClose: () => void;
  onUpload: (files: File[], formData: VideoFormData) => Promise<void>;
  categories: Category[];
  uploading: boolean;
  uploads?: UploadItem[];
  onCancelUpload?: (id: string) => void;
  onRetryUpload?: (id: string) => void;
}

export default function VideoUploadForm({
  open,
  onClose,
  onUpload,
  categories,
  uploading,
  uploads = [],
  onCancelUpload,
  onRetryUpload
}: VideoUploadFormProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [formData, setFormData] = useState<VideoFormData>({
    title: '',
    caption: '',
    categoryId: categories.length > 0 ? categories[0].id : '',
    status: 'draft',
    tags: '',
    thumbnailUrl: '',
    thumbnailType: 'auto'
  });
  const [thumbnailError, setThumbnailError] = useState('');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const videoFiles = acceptedFiles.filter(file => {
      const isVideo = file.type.startsWith('video/');
      const maxSize = 100 * 1024 * 1024; // 100MB
      return isVideo && file.size <= maxSize;
    });

    if (videoFiles.length !== acceptedFiles.length) {
      // Some files were filtered out
      const rejectedCount = acceptedFiles.length - videoFiles.length;
      alert(`${rejectedCount} file(s) bị từ chối. Chỉ chấp nhận video dưới 100MB.`);
    }

    setSelectedFiles(prev => [...prev, ...videoFiles]);
    
    // Auto-fill title if only one file
    if (videoFiles.length === 1 && !formData.title) {
      setFormData(prev => ({
        ...prev,
        title: videoFiles[0].name.replace(/\.[^/.]+$/, "")
      }));
    }
  }, [formData.title]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v']
    },
    multiple: true,
    maxSize: 100 * 1024 * 1024 // 100MB
  });

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    
    // Clear title if it matches the removed file
    if (selectedFiles.length === 1) {
      setFormData(prev => ({ ...prev, title: '' }));
    }
  };

  const handleSubmit = async () => {
    if (selectedFiles.length === 0) {
      alert('Vui lòng chọn ít nhất một file video');
      return;
    }

    if (!formData.title.trim()) {
      alert('Vui lòng nhập tiêu đề');
      return;
    }

    if (!formData.categoryId) {
      alert('Vui lòng chọn danh mục');
      return;
    }

    try {
      await onUpload(selectedFiles, formData);
      handleClose();
    } catch (error) {
      console.error('Upload error:', error);
    }
  };

  const handleClose = () => {
    if (!uploading) {
      setSelectedFiles([]);
      setFormData({
        title: '',
        caption: '',
        categoryId: categories.length > 0 ? categories[0].id : '',
        status: 'draft',
        tags: '',
        thumbnailUrl: '',
        thumbnailType: 'auto'
      });
      setThumbnailError('');
      onClose();
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getTotalSize = () => {
    return selectedFiles.reduce((total, file) => total + file.size, 0);
  };

  const hasActiveUploads = uploads.some(u => u.status === 'uploading' || u.status === 'processing');

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { height: '80vh' }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <VideoLibrary />
          Tải lên Video
          {hasActiveUploads && (
            <Chip 
              label="Đang tải lên..." 
              color="primary" 
              size="small"
            />
          )}
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* File Drop Zone */}
          <Grid item xs={12}>
            <Paper
              {...getRootProps()}
              sx={{
                border: '2px dashed',
                borderColor: isDragActive ? 'primary.main' : 'grey.300',
                borderRadius: 2,
                p: 4,
                textAlign: 'center',
                cursor: 'pointer',
                bgcolor: isDragActive ? 'action.hover' : 'background.paper',
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: 'action.hover'
                }
              }}
            >
              <input {...getInputProps()} />
              <CloudUpload sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                {isDragActive 
                  ? 'Thả video vào đây...' 
                  : 'Kéo thả video hoặc click để chọn'
                }
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Hỗ trợ: MP4, MOV, AVI, MKV, WebM, M4V (tối đa 100MB mỗi file)
              </Typography>
            </Paper>
          </Grid>

          {/* Selected Files */}
          {selectedFiles.length > 0 && (
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Video đã chọn ({selectedFiles.length})
              </Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                Tổng dung lượng: {formatFileSize(getTotalSize())}
              </Alert>
              <Paper variant="outlined" sx={{ maxHeight: 200, overflow: 'auto' }}>
                <List dense>
                  {selectedFiles.map((file, index) => (
                    <ListItem key={`${file.name}-${index}`}>
                      <ListItemIcon>
                        <VideoLibrary color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={file.name}
                        secondary={`${formatFileSize(file.size)} • ${file.type}`}
                      />
                      <IconButton
                        edge="end"
                        onClick={() => removeFile(index)}
                        color="error"
                        size="small"
                      >
                        <Delete />
                      </IconButton>
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>
          )}

          <Grid item xs={12}>
            <Divider />
          </Grid>

          {/* Form Fields */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Tiêu đề video"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
              helperText={selectedFiles.length > 1 ? "Tiêu đề này sẽ được áp dụng cho tất cả video" : ""}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Mô tả"
              multiline
              rows={3}
              value={formData.caption}
              onChange={(e) => setFormData(prev => ({ ...prev, caption: e.target.value }))}
              placeholder="Nhập mô tả chi tiết về video..."
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel>Danh mục</InputLabel>
              <Select
                value={formData.categoryId}
                onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
                label="Danh mục"
              >
                {categories.map(category => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Trạng thái</InputLabel>
              <Select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                label="Trạng thái"
              >
                <MenuItem value="draft">Bản nháp</MenuItem>
                <MenuItem value="published">Xuất bản ngay</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Tags"
              value={formData.tags}
              onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
              placeholder="suckhoe, dinhduong, thethanh"
              helperText="Phân cách bằng dấu phẩy. Ví dụ: suckhoe, dinhduong, thethanh"
            />
          </Grid>

          {/* Thumbnail Section */}
          <Grid item xs={12}>
            <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Image color="primary" />
                <Typography variant="h6">Thumbnail</Typography>
                <Typography variant="body2" color="text.secondary">
                  (Không bắt buộc)
                </Typography>
              </Box>

              <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                <Button
                  variant={formData.thumbnailType === 'auto' ? 'contained' : 'outlined'}
                  onClick={() => setFormData(prev => ({ ...prev, thumbnailType: 'auto', thumbnailUrl: '' }))}
                  size="small"
                >
                  Tự động từ video
                </Button>
                <Button
                  variant={formData.thumbnailType === 'url' ? 'contained' : 'outlined'}
                  onClick={() => setFormData(prev => ({ ...prev, thumbnailType: 'url' }))}
                  size="small"
                >
                  Nhập link ảnh
                </Button>
              </Stack>

              {formData.thumbnailType === 'auto' && (
                <Alert severity="info">
                  Thumbnail sẽ tự động được tạo từ video khi upload lên
                </Alert>
              )}

              {formData.thumbnailType === 'url' && (
                <Box>
                  <TextField
                    fullWidth
                    label="Link ảnh thumbnail"
                    value={formData.thumbnailUrl}
                    onChange={(e) => {
                      const url = e.target.value;
                      setFormData(prev => ({ ...prev, thumbnailUrl: url }));
                      setThumbnailError('');
                    }}
                    placeholder="https://example.com/thumbnail.jpg"
                    error={!!thumbnailError}
                    helperText={thumbnailError || 'Nhập link ảnh thumbnail cho video'}
                  />
                  
                  {formData.thumbnailUrl && !thumbnailError && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" gutterBottom>
                        Preview:
                      </Typography>
                      <Box
                        component="img"
                        src={formData.thumbnailUrl}
                        alt="Thumbnail preview"
                        sx={{
                          maxWidth: 200,
                          maxHeight: 150,
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: 'divider'
                        }}
                        onError={() => setThumbnailError('Không thể tải ảnh từ link này')}
                      />
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          </Grid>

          {/* Upload Progress */}
          {uploads.length > 0 && (
            <Grid item xs={12}>
              <UploadProgress 
                uploads={uploads}
                onCancel={onCancelUpload}
                onRetry={onRetryUpload}
              />
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button 
          onClick={handleClose} 
          disabled={uploading}
          startIcon={<Cancel />}
        >
          {uploading ? 'Đang tải lên...' : 'Hủy'}
        </Button>
        <Button 
          onClick={handleSubmit}
          variant="contained"
          disabled={uploading || selectedFiles.length === 0}
          startIcon={<Save />}
        >
          {uploading ? 'Đang tải lên...' : `Tải lên ${selectedFiles.length} video`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
