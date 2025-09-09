import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  LinearProgress,
  Avatar,
  Tooltip,
  Menu,
  ListItemIcon,
  ListItemText,
  Fab,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  VideoLibrary,
  Add,
  Edit,
  Delete,
  Visibility,
  PlayArrow,
  CloudUpload,
  MoreVert,
  FilterList,
  Search,
  Refresh,
  Download,
  Settings,
  CheckCircle,
  Error,
  Schedule,
  TrendingUp,
  FileUpload,
  FileDownload
} from '@mui/icons-material';
import { DataGrid, GridColDef, GridRowSelectionModel } from '@mui/x-data-grid';
import { useDropzone } from 'react-dropzone';
import LayoutWrapper from '../../components/LayoutWrapper';
import AuthGuard from '../../components/AuthGuard';
import VideoPlayer from '../../components/VideoPlayer';
import { videosService, categoriesService } from '../../services/firebase';
import { ShortVideo, Category, FilterOptions } from '../../types';
import { getCloudinaryVideoThumbnail, getCloudinaryVideoUrl, uploadVideoToCloudinary } from '../../utils/cloudinary';
import toast from 'react-hot-toast';

interface VideoStats {
  totalVideos: number;
  publishedVideos: number;
  processingVideos: number;
  totalViews: number;
}

interface VideoManagementPageProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export default function VideoManagement({ darkMode, toggleDarkMode }: VideoManagementPageProps) {
  const router = useRouter();
  const [videos, setVideos] = useState<ShortVideo[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [videoStats, setVideoStats] = useState<VideoStats>({
    totalVideos: 0,
    publishedVideos: 0,
    processingVideos: 0,
    totalViews: 0
  });
  const [loading, setLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<GridRowSelectionModel>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [selectedVideo, setSelectedVideo] = useState<ShortVideo | null>(null);
  const [videoDetailOpen, setVideoDetailOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [vids, cats] = await Promise.all([
        videosService.getAll(),
        categoriesService.getAll()
      ]);
      
      setVideos(vids);
      setCategories(cats);
      calculateStats(vids);
    } catch (error) {
      console.error('Error loading videos:', error);
      toast.error('Có lỗi xảy ra khi tải dữ liệu video');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (videosList: ShortVideo[]) => {
    const stats: VideoStats = {
      totalVideos: videosList.length,
      publishedVideos: videosList.filter(v => v.status === 'published').length,
      processingVideos: videosList.filter(v => v.status === 'processing' || v.status === 'draft').length,
      totalViews: videosList.reduce((sum, video) => sum + (video.viewCount || 0), 0)
    };
    setVideoStats(stats);
  };

  const getFilteredVideos = () => {
    return videos.filter(video => {
      const matchesSearch = !searchQuery || 
        video.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        video.caption?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = !statusFilter || video.status === statusFilter;
      const matchesCategory = !categoryFilter || video.categoryId === categoryFilter;
      
      return matchesSearch && matchesStatus && matchesCategory;
    });
  };

  const handleVideoUpload = async (files: File[]) => {
    try {
      setUploading(true);
      setUploadProgress(0);
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        try {
          // Upload to Cloudinary
          const uploadResult = await uploadVideoToCloudinary(file, {
            folder: 'health_videos',
            onProgress: (progress) => {
              setUploadProgress((i / files.length * 100) + (progress / files.length));
            }
          });
          
          console.log('Upload result:', uploadResult); // Debug log
          
          // Create video record in Firebase
          const newVideo: Omit<ShortVideo, 'id'> = {
            title: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
            caption: '',
            videoUrl: uploadResult.secure_url,
            thumbnailUrl: uploadResult.thumbnail_url,
            cloudinaryPublicId: uploadResult.public_id,
            categoryId: categories[0]?.id || '',
            viewCount: 0,
            likeCount: 0,
            userId: 'admin', // Would be current user
            status: 'published',
            uploadDate: Date.now(),
            duration: uploadResult.duration || 0,
            width: uploadResult.width || 0,
            height: uploadResult.height || 0
          };
          
          console.log('New video data:', newVideo); // Debug log
          
          // Add to database
          await videosService.create(newVideo);
          
        } catch (uploadError) {
          console.error(`Error uploading ${file.name}:`, uploadError);
          toast.error(`Lỗi tải lên ${file.name}`);
        }
      }
      
      toast.success(`Đã tải lên ${files.length} video thành công`);
      setUploadDialogOpen(false);
      loadData();
    } catch (error) {
      console.error('Error uploading videos:', error);
      toast.error('Có lỗi xảy ra khi tải lên video');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const videoFiles = acceptedFiles.filter(file => file.type.startsWith('video/'));
    if (videoFiles.length > 0) {
      handleVideoUpload(videoFiles);
    } else {
      toast.error('Vui lòng chọn file video hợp lệ');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.mov', '.avi', '.mkv', '.webm']
    },
    multiple: true
  });

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'published': return 'success';
      case 'processing': return 'warning';
      case 'draft': return 'info';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'published': return <CheckCircle />;
      case 'processing': return <Schedule />;
      case 'draft': return <Edit />;
      case 'failed': return <Error />;
      default: return <VideoLibrary />;
    }
  };

  const handleViewVideo = (video: ShortVideo) => {
    console.log('Opening video dialog for:', video); // Debug log
    setSelectedVideo(video);
    setVideoDetailOpen(true);
  };

  const handleIncreaseView = async (videoId: string) => {
    try {
      await videosService.incrementViewCount(videoId);
      loadData();
    } catch (error) {
      console.error('Error incrementing view count:', error);
    }
  };

  // Bulk Actions Handlers
  const handleBulkStatusChange = async (newStatus: 'draft' | 'published' | 'archived' | 'processing' | 'failed') => {
    try {
      setLoading(true);
      const promises = selectedRows.map((id) => 
        videosService.update(id as string, { status: newStatus })
      );
      await Promise.all(promises);
      toast.success(`Đã cập nhật trạng thái cho ${selectedRows.length} video`);
      setSelectedRows([]);
      loadData();
    } catch (error) {
      console.error('Error updating video status:', error);
      toast.error('Có lỗi xảy ra khi cập nhật trạng thái');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa ${selectedRows.length} video đã chọn?`)) {
      return;
    }
    
    try {
      setLoading(true);
      const promises = selectedRows.map((id) => 
        videosService.delete(id as string)
      );
      await Promise.all(promises);
      toast.success(`Đã xóa ${selectedRows.length} video`);
      setSelectedRows([]);
      loadData();
    } catch (error) {
      console.error('Error deleting videos:', error);
      toast.error('Có lỗi xảy ra khi xóa video');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkExport = () => {
    try {
      const selectedVideos = videos.filter(video => selectedRows.includes(video.id));
      const dataStr = JSON.stringify(selectedVideos, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `videos_export_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success(`Đã export ${selectedRows.length} video`);
    } catch (error) {
      console.error('Error exporting videos:', error);
      toast.error('Có lỗi xảy ra khi export video');
    }
  };

  // Export all videos data
  const exportVideoData = () => {
    try {
      const dataStr = JSON.stringify(videos, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `all_videos_export_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success(`Đã export ${videos.length} video`);
    } catch (error) {
      console.error('Error exporting all videos:', error);
      toast.error('Có lỗi xảy ra khi export video');
    }
  };

  // Import videos from JSON file
  const handleVideoImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      toast.error('Vui lòng chọn file JSON hợp lệ');
      return;
    }

    try {
      setLoading(true);
      const fileContent = await file.text();
      const importedVideos = JSON.parse(fileContent);

      if (!Array.isArray(importedVideos)) {
        toast.error('File JSON không đúng định dạng (phải là mảng video)');
        return;
      }

      // Validate and process each video
      const validVideos = [];
      for (const video of importedVideos) {
        if (video.title && video.caption) {
          const processedVideo = {
            title: video.title,
            caption: video.caption || video.description || '',
            videoUrl: video.videoUrl || '',
            thumbnailUrl: video.thumbnailUrl || '',
            cloudinaryPublicId: video.cloudinaryPublicId || video.cldPublicId || '',
            categoryId: video.categoryId || '',
            uploadDate: video.uploadDate || Date.now(),
            duration: video.duration || 0,
            status: (video.status as 'draft' | 'published' | 'archived' | 'processing' | 'failed') || 'draft',
            tags: video.tags || {},
            viewCount: video.viewCount || video.views || 0,
            likeCount: video.likeCount || video.likes || 0,
            userId: video.userId || 'admin',
            width: video.width,
            height: video.height,
            updatedAt: Date.now()
          };
          validVideos.push(processedVideo);
        }
      }

      if (validVideos.length === 0) {
        toast.error('Không có video hợp lệ nào để import');
        return;
      }

      // Batch import to Firebase
      const promises = validVideos.map(video => videosService.create(video));
      await Promise.all(promises);

      toast.success(`Đã import thành công ${validVideos.length} video`);
      loadData(); // Reload data to show imported videos
      
      // Clear file input
      event.target.value = '';
    } catch (error) {
      console.error('Error importing videos:', error);
      toast.error('Có lỗi xảy ra khi import video. Vui lòng kiểm tra định dạng file.');
    } finally {
      setLoading(false);
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'thumbnailUrl',
      headerName: 'Thumbnail',
      width: 120,
      sortable: false,
      renderCell: (params) => {
        let thumbnailUrl = '';
        
        // Try different sources for thumbnail - prioritize 'thumb' field
        if (params.row.thumb) {
          thumbnailUrl = params.row.thumb;
        } else if (params.row.cldPublicId) {
          thumbnailUrl = getCloudinaryVideoThumbnail(params.row.cldPublicId, { width: 160, height: 120 });
        } else if (params.row.cloudinaryPublicId) {
          thumbnailUrl = getCloudinaryVideoThumbnail(params.row.cloudinaryPublicId, { width: 160, height: 120 });
        } else if (params.row.thumbnailUrl) {
          thumbnailUrl = params.row.thumbnailUrl;
        }
        
        return (
          <Box
            sx={{
              width: 80,
              height: 60,
              backgroundColor: '#f5f5f5',
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              overflow: 'hidden',
              border: '1px solid #ddd',
              position: 'relative'
            }}
            onClick={() => handleViewVideo(params.row)}
          >
            {thumbnailUrl && (
              <img
                src={thumbnailUrl}
                alt="Thumbnail"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
            {!thumbnailUrl && (
              <Typography variant="caption" sx={{ 
                fontSize: 8, 
                textAlign: 'center', 
                px: 0.5,
                color: 'text.secondary'
              }}>
                {params.row.title?.substring(0, 15)}...
              </Typography>
            )}
            <PlayArrow 
              sx={{ 
                position: 'absolute',
                color: thumbnailUrl ? 'white' : 'primary.main',
                fontSize: 20,
                backgroundColor: thumbnailUrl ? 'rgba(0,0,0,0.6)' : 'transparent',
                borderRadius: '50%',
                padding: 0.5
              }} 
            />
          </Box>
        );
      }
    },
    {
      field: 'title',
      headerName: 'Tiêu đề',
      flex: 1,
      minWidth: 200,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" fontWeight="medium">
            {params.value}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {params.row.caption}
          </Typography>
        </Box>
      )
    },
    {
      field: 'categoryId',
      headerName: 'Danh mục',
      width: 120,
      renderCell: (params) => {
        const category = categories.find(c => c.id === params.value);
        return category ? (
          <Chip 
            label={category.name} 
            size="small" 
            style={{ backgroundColor: category.color, color: 'white' }}
          />
        ) : '-';
      }
    },
    {
      field: 'status',
      headerName: 'Trạng thái',
      width: 120,
      renderCell: (params) => (
        <Chip
          icon={getStatusIcon(params.value)}
          label={params.value || 'processing'}
          size="small"
          color={getStatusColor(params.value) as any}
        />
      )
    },
    {
      field: 'viewCount',
      headerName: 'Lượt xem',
      width: 100,
      type: 'number',
      renderCell: (params) => (
        <Box display="flex" alignItems="center" gap={0.5}>
          <Visibility fontSize="small" color="action" />
          {params.value || 0}
        </Box>
      )
    },
    {
      field: 'likeCount',
      headerName: 'Lượt thích',
      width: 100,
      type: 'number',
      renderCell: (params) => (
        <Box display="flex" alignItems="center" gap={0.5}>
          <Avatar sx={{ width: 16, height: 16, bgcolor: 'transparent' }}>❤️</Avatar>
          {params.value || 0}
        </Box>
      )
    },
    {
      field: 'duration',
      headerName: 'Thời lượng',
      width: 100,
      renderCell: (params) => {
        const duration = params.value || 0;
        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
      }
    },
    {
      field: 'uploadDate',
      headerName: 'Ngày tải lên',
      width: 120,
      renderCell: (params) => 
        new Date(params.value).toLocaleDateString('vi-VN')
    },
    {
      field: 'actions',
      headerName: 'Thao tác',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <Tooltip title="Xem video">
            <IconButton size="small" onClick={() => handleViewVideo(params.row)}>
              <PlayArrow fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Chỉnh sửa">
            <IconButton size="small" onClick={() => router.push(`/videos/edit/${params.row.id}`)}>
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Tăng view">
            <IconButton size="small" onClick={() => handleIncreaseView(params.row.id)}>
              <TrendingUp fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ];

  const statCards = [
    {
      title: 'Tổng video',
      value: videoStats.totalVideos,
      icon: <VideoLibrary />,
      color: '#1976d2'
    },
    {
      title: 'Đã xuất bản',
      value: videoStats.publishedVideos,
      icon: <CheckCircle />,
      color: '#388e3c'
    },
    {
      title: 'Đang xử lý',
      value: videoStats.processingVideos,
      icon: <Schedule />,
      color: '#f57c00'
    },
    {
      title: 'Tổng lượt xem',
      value: videoStats.totalViews,
      icon: <Visibility />,
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
              Quản lý Video
            </Typography>
            <Box display="flex" gap={1}>
              <Button
                variant="outlined"
                startIcon={<FileUpload />}
                onClick={() => document.getElementById('video-import-file-input')?.click()}
              >
                Nhập dữ liệu
              </Button>
              <Button
                variant="outlined"
                startIcon={<FileDownload />}
                onClick={exportVideoData}
                disabled={videos.length === 0}
              >
                Xuất dữ liệu
              </Button>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={loadData}
              >
                Làm mới
              </Button>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setUploadDialogOpen(true)}
              >
                Tải lên Video
              </Button>
            </Box>
          </Box>

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

          {/* Search and Filters */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    placeholder="Tìm kiếm video..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                      startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth>
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
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth>
                    <InputLabel>Trạng thái</InputLabel>
                    <Select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      label="Trạng thái"
                    >
                      <MenuItem value="">Tất cả</MenuItem>
                      <MenuItem value="published">Đã xuất bản</MenuItem>
                      <MenuItem value="draft">Bản nháp</MenuItem>
                      <MenuItem value="processing">Đang xử lý</MenuItem>
                      <MenuItem value="failed">Lỗi</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('');
                      setCategoryFilter('');
                    }}
                  >
                    Xóa bộ lọc
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Videos Table */}
          <Card>
            {/* Bulk Actions Toolbar */}
            {selectedRows.length > 0 && (
              <Box sx={{ 
                p: 2, 
                bgcolor: 'action.selected', 
                borderBottom: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <Typography variant="subtitle1" fontWeight="medium">
                  Đã chọn {selectedRows.length} video
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<CheckCircle />}
                    onClick={() => handleBulkStatusChange('published')}
                  >
                    Xuất bản
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Schedule />}
                    onClick={() => handleBulkStatusChange('draft')}
                  >
                    Chuyển thành nháp
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Download />}
                    onClick={handleBulkExport}
                  >
                    Export
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    color="error"
                    startIcon={<Delete />}
                    onClick={handleBulkDelete}
                  >
                    Xóa
                  </Button>
                </Box>
              </Box>
            )}
            <Box sx={{ height: 600, width: '100%' }}>
              {loading && <LinearProgress />}
              <DataGrid
                rows={getFilteredVideos()}
                columns={columns}
                checkboxSelection
                disableRowSelectionOnClick
                rowSelectionModel={selectedRows}
                onRowSelectionModelChange={setSelectedRows}
                pageSizeOptions={[25, 50, 100]}
                initialState={{
                  pagination: { paginationModel: { pageSize: 25 } }
                }}
                localeText={{
                  noRowsLabel: 'Không có video nào',
                  MuiTablePagination: {
                    labelRowsPerPage: 'Số hàng mỗi trang:'
                  }
                }}
              />
            </Box>
          </Card>

          {/* Upload Dialog */}
          <Dialog 
            open={uploadDialogOpen} 
            onClose={() => setUploadDialogOpen(false)}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>Tải lên Video</DialogTitle>
            <DialogContent>
              <Box {...getRootProps()} sx={{
                border: '2px dashed #ccc',
                borderRadius: 2,
                p: 4,
                textAlign: 'center',
                cursor: 'pointer',
                bgcolor: isDragActive ? 'action.hover' : 'background.paper',
                mt: 2
              }}>
                <input {...getInputProps()} />
                <CloudUpload sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  {isDragActive ? 'Thả file vào đây...' : 'Kéo thả video hoặc click để chọn'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Hỗ trợ: MP4, MOV, AVI, MKV, WebM
                </Typography>
              </Box>
              
              {uploading && (
                <Box mt={2}>
                  <Typography variant="body2" gutterBottom>
                    Đang tải lên... {uploadProgress}%
                  </Typography>
                  <LinearProgress variant="determinate" value={uploadProgress} />
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setUploadDialogOpen(false)} disabled={uploading}>
                Hủy
              </Button>
            </DialogActions>
          </Dialog>

          {/* Video Detail Dialog */}
          <Dialog 
            open={videoDetailOpen} 
            onClose={() => setVideoDetailOpen(false)}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>Chi tiết Video</DialogTitle>
            <DialogContent>
              {selectedVideo && (
                <Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <VideoPlayer
                        videoUrl={selectedVideo.videoUrl}
                        cloudinaryPublicId={selectedVideo.cloudinaryPublicId}
                        cldPublicId={selectedVideo.cldPublicId}
                        thumbnailUrl={selectedVideo.thumbnailUrl}
                        thumb={selectedVideo.thumb}
                        title={selectedVideo.title}
                        width="100%"
                        height={200}
                        controls={true}
                        muted={false}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="h6" gutterBottom>{selectedVideo.title}</Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {selectedVideo.caption}
                      </Typography>
                      
                      <Grid container spacing={1}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Trạng thái</Typography>
                          <Chip 
                            label={selectedVideo.status || 'processing'} 
                            size="small" 
                            color={getStatusColor(selectedVideo.status) as any}
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Danh mục</Typography>
                          <Typography variant="body1">
                            {categories.find(c => c.id === selectedVideo.categoryId)?.name || '-'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Lượt xem</Typography>
                          <Typography variant="body1">{selectedVideo.viewCount || 0}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Lượt thích</Typography>
                          <Typography variant="body1">{selectedVideo.likeCount || 0}</Typography>
                        </Grid>
                      </Grid>
                    </Grid>
                  </Grid>
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setVideoDetailOpen(false)}>Đóng</Button>
              <Button 
                onClick={() => {
                  if (selectedVideo) {
                    console.log('Selected video data:', selectedVideo);
                    const dataStr = JSON.stringify(selectedVideo, null, 2);
                    const dataBlob = new Blob([dataStr], { type: 'application/json' });
                    const url = URL.createObjectURL(dataBlob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `video_debug_${selectedVideo.id}.json`;
                    link.click();
                    URL.revokeObjectURL(url);
                  }
                }}
              >
                Debug
              </Button>
              <Button 
                variant="contained"
                onClick={() => {
                  setVideoDetailOpen(false);
                  router.push(`/videos/edit/${selectedVideo?.id}`);
                }}
              >
                Chỉnh sửa
              </Button>
            </DialogActions>
          </Dialog>

          {/* FAB for quick upload */}
          <Fab
            color="primary"
            aria-label="upload"
            sx={{ position: 'fixed', bottom: 16, right: 16 }}
            onClick={() => setUploadDialogOpen(true)}
          >
            <Add />
          </Fab>

          {/* Hidden file input for import */}
          <input
            id="video-import-file-input"
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleVideoImportFile}
          />
        </Box>
      </LayoutWrapper>
    </AuthGuard>
  );
}
