import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Card,
  CardContent,
  Divider,
  FormHelperText
} from '@mui/material';
import {
  CloudUpload,
  Image,
  VideoLibrary,
  Delete,
  Add,
  Check,
  Error as ErrorIcon,
  Info
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { categoriesService, mediaService } from '../services/firebase';
import { Category, Media } from '../types';
import { useCurrentUser } from './AuthGuard';
import toast from 'react-hot-toast';
import slugify from 'slugify';

interface MediaUploadFormProps {
  onUploadComplete?: (media: Media[]) => void;
  allowMultiple?: boolean;
  acceptedTypes?: Record<string, string[]>;
}

interface UploadStatus {
  status: 'idle' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

export default function MediaUploadForm({ onUploadComplete, allowMultiple = true, acceptedTypes }: MediaUploadFormProps) {
  const { currentUser } = useCurrentUser();
  const [files, setFiles] = useState<File[]>([]);
  const [category, setCategory] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [uploading, setUploading] = useState(false);
  const [fileStatuses, setFileStatuses] = useState<Record<string, UploadStatus>>({});
  const [showNewCategoryDialog, setShowNewCategoryDialog] = useState(false);
  const [uploadedMedia, setUploadedMedia] = useState<Media[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoadingCategories(true);
    try {
      const cats = await categoriesService.getAll();
      console.log('Loaded categories:', cats);
      setCategories(cats.filter(cat => cat.isActive));
      
      if (cats.length === 0) {
        // Tạo category mặc định nếu chưa có
        console.log('No categories found, creating default category...');
        const defaultCategory: Omit<Category, 'id'> = {
          name: 'Sức khỏe tổng quát',
          description: 'Những thông tin về sức khỏe tổng quát',
          createdAt: Date.now(),
          isActive: true,
          order: 0
        };

        try {
          const categoryId = await categoriesService.create(defaultCategory);
          console.log('Created default category:', categoryId);
          
          // Reload categories sau khi tạo
          const newCats = await categoriesService.getAll();
          setCategories(newCats.filter(cat => cat.isActive));
          setCategory(categoryId); // Auto select category mới
          
          toast.success('Đã tạo chủ đề mặc định "Sức khỏe tổng quát"');
        } catch (createError) {
          console.error('Error creating default category:', createError);
          toast('Chưa có chủ đề nào. Hãy tạo chủ đề mới trước khi upload.', {
            icon: '💡',
            duration: 5000
          });
        }
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error('Không thể tải danh sách chủ đề. Kiểm tra kết nối Firebase.');
    } finally {
      setLoadingCategories(false);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    // Thông báo về files bị reject
    if (rejectedFiles.length > 0) {
      rejectedFiles.forEach(rejection => {
        const errors = rejection.errors.map((e: any) => e.message).join(', ');
        toast.error(`File ${rejection.file.name}: ${errors}`);
      });
    }

    // Validate file types và size
    const validFiles = acceptedFiles.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      const maxSize = isVideo ? 100 * 1024 * 1024 : 10 * 1024 * 1024; // 100MB cho video, 10MB cho ảnh
      
      if (!isImage && !isVideo) {
        toast.error(`${file.name}: Chỉ hỗ trợ file ảnh và video`);
        return false;
      }
      
      if (file.size > maxSize) {
        toast.error(`${file.name}: File quá lớn (tối đa ${isVideo ? '100MB' : '10MB'})`);
        return false;
      }
      
      return true;
    });

    setFiles(prev => [...prev, ...validFiles]);

    // Initialize status for new files
    const newStatuses: Record<string, UploadStatus> = {};
    validFiles.forEach(file => {
      newStatuses[file.name] = { status: 'idle', progress: 0 };
    });
    setFileStatuses(prev => ({ ...prev, ...newStatuses }));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedTypes || {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp'],
      'video/*': ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.wmv', '.flv']
    },
    multiple: allowMultiple,
    maxSize: 100 * 1024 * 1024 // 100MB max
  });

  const handleRemoveFile = (index: number) => {
    const file = files[index];
    setFiles(prev => prev.filter((_, i) => i !== index));
    setFileStatuses(prev => {
      const newStatuses = { ...prev };
      delete newStatuses[file.name];
      return newStatuses;
    });
  };

  const handleCreateNewCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error('Vui lòng nhập tên chủ đề');
      return;
    }

    try {
      const newCategory: Omit<Category, 'id'> = {
        name: newCategoryName.trim(),
        description: newCategoryDescription.trim(),
        createdAt: Date.now(),
        isActive: true,
        order: categories.length
      };

      const categoryId = await categoriesService.create(newCategory);
      
      toast.success(`Đã tạo chủ đề "${newCategoryName}"`);
      setCategory(categoryId);
      setNewCategoryName('');
      setNewCategoryDescription('');
      setShowNewCategoryDialog(false);
      await loadCategories();
    } catch (error) {
      console.error('Error creating category:', error);
      toast.error('Không thể tạo chủ đề mới');
    }
  };

  const getSelectedCategoryName = () => {
    const selectedCategory = categories.find(cat => cat.id === category);
    return selectedCategory?.name || '';
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error('Vui lòng chọn ít nhất một file');
      return;
    }

    if (!category) {
      toast.error('Vui lòng chọn chủ đề');
      return;
    }

    if (!currentUser) {
      toast.error('Vui lòng đăng nhập để upload');
      return;
    }

    setUploading(true);
    setUploadedMedia([]);
    
    const categoryName = getSelectedCategoryName();
    const successful: Media[] = [];
    let failed = 0;

    try {
      // Upload từng file
      for (const file of files) {
        try {
          const media = await uploadSingleFile(file, categoryName, category);
          successful.push(media);
        } catch (error) {
          failed++;
          console.error(`Failed to upload ${file.name}:`, error);
        }
      }

      // Thông báo kết quả
      if (successful.length > 0) {
        toast.success(`Đã upload thành công ${successful.length} file${failed > 0 ? ` (${failed} file lỗi)` : ''}`);
        setUploadedMedia(successful);
        onUploadComplete?.(successful);
      }

      if (failed > 0 && successful.length === 0) {
        toast.error(`Upload thất bại ${failed} file`);
      }

      // Reset form if all successful
      if (failed === 0) {
        setFiles([]);
        setFileStatuses({});
      }

    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Có lỗi xảy ra trong quá trình upload');
    } finally {
      setUploading(false);
    }
  };

  const uploadSingleFile = async (file: File, categoryName: string, categoryId: string): Promise<Media> => {
    const fileName = file.name;
    
    // Update status to uploading
    setFileStatuses(prev => ({
      ...prev,
      [fileName]: { status: 'uploading', progress: 0 }
    }));

    try {
      const resourceType = file.type.startsWith('video') ? 'video' : 'image';

      console.log(`Starting upload for ${fileName}, category: ${categoryName}, type: ${resourceType}`);

      // 1. Get upload config from API (unsigned approach)
      const configResponse = await fetch('/api/cloudinary/signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          category: categoryName,
          resourceType 
        }),
      });

      if (!configResponse.ok) {
        const errorText = await configResponse.text();
        console.error('Config API error:', errorText);
        throw new Error(`Không thể lấy cấu hình upload: ${configResponse.status} ${configResponse.statusText}`);
      }

      const configData = await configResponse.json();
      console.log('Upload config received:', configData);
      
      const { upload_preset, cloud_name, folder, upload_url } = configData;

      if (!upload_preset || !cloud_name || !folder) {
        throw new Error('Thiếu thông tin cần thiết từ API config');
      }

      // 2. Prepare form data for Cloudinary unsigned upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', upload_preset);
      formData.append('folder', folder);

      // Debug: Log form data
      console.log('FormData entries for unsigned upload:');
      for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value instanceof File ? `File(${value.name})` : value);
      }

      // 3. Upload to Cloudinary with progress tracking
      const result = await new Promise<any>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setFileStatuses(prev => ({
              ...prev,
              [fileName]: { status: 'uploading', progress }
            }));
          }
        };

        xhr.onload = () => {
          console.log('XHR Response:', {
            status: xhr.status,
            statusText: xhr.statusText,
            responseText: xhr.responseText
          });
          
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              console.log('Upload successful:', response);
              resolve(response);
            } catch (parseError) {
              console.error('Parse error:', parseError);
              reject(new Error(`Invalid response format: ${parseError}`));
            }
          } else {
            // Log detailed error from Cloudinary
            try {
              const errorResponse = JSON.parse(xhr.responseText);
              console.error('Cloudinary error response:', errorResponse);
              reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText} - ${errorResponse.error?.message || 'Unknown error'}`));
            } catch {
              reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText} - ${xhr.responseText}`));
            }
          }
        };

        xhr.onerror = () => {
          reject(new Error('Network error during upload'));
        };

        xhr.ontimeout = () => {
          reject(new Error('Upload timeout'));
        };

        xhr.timeout = 5 * 60 * 1000; // 5 minutes timeout

        // Use upload_url from config (already includes resource_type)
        xhr.open('POST', upload_url);
        xhr.send(formData);
      });

      // 4. Generate thumbnail URL for videos
      let thumbnailUrl = result.secure_url;
      if (resourceType === 'video') {
        // For videos, create thumbnail URL
        const publicId = result.public_id;
        thumbnailUrl = `https://res.cloudinary.com/${cloud_name}/video/upload/so_0,w_400,h_300,c_fill,q_auto,f_jpg/${publicId}.jpg`;
      }

      // 5. Create media metadata (only include defined values)
      const mediaData: Omit<Media, 'id'> = {
        secure_url: result.secure_url,
        public_id: result.public_id,
        version: result.version?.toString() || '1',
        thumbnail_url: thumbnailUrl,
        categoryId,
        uploadDate: Date.now(),
        uploader: currentUser?.uid || 'unknown',
        type: resourceType,
        original_filename: result.original_filename || file.name,
        folder,
        status: 'ready' as const
      };

      // Add optional properties only if they exist
      if (result.duration !== undefined) mediaData.duration = result.duration;
      if (result.width !== undefined) mediaData.width = result.width;
      if (result.height !== undefined) mediaData.height = result.height;
      if (result.bytes !== undefined) mediaData.bytes = result.bytes;
      if (result.format !== undefined) mediaData.format = result.format;
      if (result.resource_type !== undefined) mediaData.resource_type = result.resource_type;

      // 6. Save to Firebase
      const mediaId = await mediaService.create(mediaData);

      // Update status to success
      setFileStatuses(prev => ({
        ...prev,
        [fileName]: { status: 'success', progress: 100 }
      }));

      return { id: mediaId, ...mediaData };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Update status to error
      setFileStatuses(prev => ({
        ...prev,
        [fileName]: { status: 'error', progress: 0, error: errorMessage }
      }));

      throw error;
    }
  };

  const getFileTypeIcon = (file: File) => {
    return file.type.startsWith('image') ? <Image /> : <VideoLibrary />;
  };

  const getStatusIcon = (status: UploadStatus) => {
    switch (status.status) {
      case 'success': return <Check color="success" />;
      case 'error': return <ErrorIcon color="error" />;
      case 'uploading': return null;
      default: return null;
    }
  };

  const getProgressColor = (status: UploadStatus): "primary" | "success" | "error" => {
    switch (status.status) {
      case 'success': return 'success';
      case 'error': return 'error';
      default: return 'primary';
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Upload Ảnh và Video
          </Typography>

          <Grid container spacing={3}>
            {/* File Drop Zone */}
            <Grid item xs={12}>
              <Paper
                {...getRootProps()}
                sx={{
                  border: '2px dashed',
                  borderColor: isDragActive ? 'primary.main' : 'grey.400',
                  p: 4,
                  textAlign: 'center',
                  cursor: 'pointer',
                  bgcolor: isDragActive ? 'primary.light' : 'transparent',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: 'primary.light'
                  }
                }}
              >
                <input {...getInputProps()} />
                <CloudUpload sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  {isDragActive ? 'Thả file vào đây...' : 'Kéo thả file hoặc click để chọn'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Hỗ trợ: Ảnh (PNG, JPG, JPEG, GIF, WebP, BMP) và Video (MP4, MOV, AVI, MKV, WebM, WMV, FLV)
                </Typography>
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  Tối đa: 10MB cho ảnh, 100MB cho video
                </Typography>
              </Paper>
            </Grid>

            {/* Category Selection */}
            <Grid item xs={12} sm={8}>
              <FormControl fullWidth required>
                <InputLabel>Chủ đề</InputLabel>
                <Select
                  value={category}
                  label="Chủ đề"
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={uploading || loadingCategories}
                >
                  {categories.map(cat => (
                    <MenuItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>
                  {loadingCategories ? 'Đang tải chủ đề...' : 
                   categories.length === 0 ? 'Chưa có chủ đề nào. Hãy tạo mới.' : 
                   'Chọn chủ đề để phân loại file'}
                </FormHelperText>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={4}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Add />}
                onClick={() => setShowNewCategoryDialog(true)}
                disabled={uploading || loadingCategories}
                sx={{ height: 56 }}
              >
                Tạo chủ đề mới
              </Button>
            </Grid>

            {/* Debug Info */}
            {process.env.NODE_ENV === 'development' && (
              <Grid item xs={12}>
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="caption" component="div">
                    Debug: Categories loaded: {categories.length} | 
                    Selected: {category || 'none'} | 
                    Firebase: {loadingCategories ? 'loading...' : 'ready'} |
                    <Button 
                      size="small" 
                      onClick={() => window.open('/api/debug/system', '_blank')}
                      sx={{ ml: 1 }}
                    >
                      Check System
                    </Button>
                    <Button 
                      size="small" 
                      onClick={async () => {
                        try {
                          const response = await fetch('/api/debug/create-sample-categories', { method: 'POST' });
                          const data = await response.json();
                          console.log('Sample categories:', data);
                          toast.success('Đã tạo categories mẫu');
                          loadCategories();
                        } catch (error) {
                          toast.error('Lỗi tạo categories mẫu');
                        }
                      }}
                      sx={{ ml: 1 }}
                    >
                      Create Sample Categories
                    </Button>
                  </Typography>
                </Alert>
              </Grid>
            )}

            {/* Selected Files List */}
            {files.length > 0 && (
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Danh sách file đã chọn ({files.length})
                </Typography>
                <List>
                  {files.map((file, index) => {
                    const status = fileStatuses[file.name] || { status: 'idle', progress: 0 };
                    return (
                      <ListItem
                        key={index}
                        secondaryAction={
                          !uploading ? (
                            <IconButton
                              edge="end"
                              onClick={() => handleRemoveFile(index)}
                              disabled={status.status === 'uploading'}
                            >
                              <Delete />
                            </IconButton>
                          ) : (
                            getStatusIcon(status)
                          )
                        }
                        sx={{
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 1,
                          mb: 1,
                          bgcolor: status.status === 'success' ? 'success.light' : 
                                  status.status === 'error' ? 'error.light' : 'transparent'
                        }}
                      >
                        <ListItemIcon>
                          {getFileTypeIcon(file)}
                        </ListItemIcon>
                        <ListItemText
                          primary={file.name}
                          secondary={
                            <Stack spacing={1}>
                              <Typography variant="caption">
                                {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type}
                              </Typography>
                              {status.status === 'uploading' && (
                                <Box sx={{ width: '100%' }}>
                                  <LinearProgress
                                    variant="determinate"
                                    value={status.progress}
                                    color={getProgressColor(status)}
                                  />
                                  <Typography variant="caption" color="text.secondary">
                                    {status.progress}%
                                  </Typography>
                                </Box>
                              )}
                              {status.status === 'error' && (
                                <Typography variant="caption" color="error">
                                  Lỗi: {status.error}
                                </Typography>
                              )}
                              {status.status === 'success' && (
                                <Typography variant="caption" color="success.main">
                                  Upload thành công
                                </Typography>
                              )}
                            </Stack>
                          }
                        />
                      </ListItem>
                    );
                  })}
                </List>
              </Grid>
            )}

            {/* Upload Button */}
            <Grid item xs={12}>
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleUpload}
                disabled={uploading || files.length === 0 || !category || loadingCategories}
                sx={{ py: 2 }}
              >
                {uploading ? `Đang upload...` : 
                 loadingCategories ? 'Đang tải chủ đề...' :
                 !category && files.length > 0 ? 'Chọn chủ đề để upload' :
                 `Upload ${files.length} file${files.length > 1 ? 's' : ''}`}
              </Button>
              
              {/* Error hints */}
              {!loadingCategories && categories.length === 0 && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    Chưa có chủ đề nào trong hệ thống. 
                    Hãy tạo chủ đề mới hoặc kiểm tra kết nối Firebase.
                  </Typography>
                </Alert>
              )}
              
              {files.length > 0 && !category && categories.length > 0 && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    Vui lòng chọn chủ đề trước khi upload file.
                  </Typography>
                </Alert>
              )}
            </Grid>

            {/* Upload Results */}
            {uploadedMedia.length > 0 && (
              <Grid item xs={12}>
                <Alert severity="success" icon={<Check />}>
                  <Typography variant="subtitle1" gutterBottom>
                    Upload thành công {uploadedMedia.length} file
                  </Typography>
                  <Typography variant="body2">
                    Các file đã được lưu vào thư mục: healthy_tip/{slugify(getSelectedCategoryName(), { lower: true, strict: true })}/{new Date().getFullYear()}/{(new Date().getMonth() + 1).toString().padStart(2, '0')}
                  </Typography>
                </Alert>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* Create New Category Dialog */}
      <Dialog
        open={showNewCategoryDialog}
        onClose={() => setShowNewCategoryDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Tạo chủ đề mới</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ pt: 1 }}>
            <TextField
              label="Tên chủ đề"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              fullWidth
              required
              autoFocus
            />
            <TextField
              label="Mô tả (tùy chọn)"
              value={newCategoryDescription}
              onChange={(e) => setNewCategoryDescription(e.target.value)}
              fullWidth
              multiline
              rows={3}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowNewCategoryDialog(false)}>
            Hủy
          </Button>
          <Button
            onClick={handleCreateNewCategory}
            variant="contained"
            disabled={!newCategoryName.trim()}
          >
            Tạo
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
