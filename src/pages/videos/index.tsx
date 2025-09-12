import React, { useState, useEffect, useCallback, Fragment, useMemo } from 'react';
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
  TableRow,
  List,
  ListItem,
  ListItemAvatar,
  Divider,
  Badge,
  Collapse
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
  FileDownload,
  Comment,
  Block,
  PersonOff,
  Clear,
  ExpandLess,
  ExpandMore
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

// =================================================================
// Comment Section Component
// =================================================================
const CommentSection = ({ video, onDeleteComment, onBanUser, formatDate }) => {
  const [showComments, setShowComments] = useState(true);
  const [expandedReplies, setExpandedReplies] = useState({});

  const toggleReplies = (commentId) => {
    setExpandedReplies(prev => ({ ...prev, [commentId]: !prev[commentId] }));
  };

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
          // Ensure replies is an array before pushing
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

    const commentBody = (
      <Box sx={{ flex: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" component="div">
              {comment.username || `User: ${String(comment.userId).substring(0, 8)}...`}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatDate(comment.createdAt)}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              {comment.text || <em style={{ color: '#999' }}>No content</em>}
            </Typography>
            <Box display="flex" alignItems="center" gap={1} sx={{ mt: 1 }}>
              <Badge badgeContent={comment.likeCount || 0} color="primary">
                <Chip size="small" label="Likes" />
              </Badge>
            </Box>
          </Box>
          <Box>
            <IconButton size="small" onClick={() => onDeleteComment(comment.id)} color="error" title="Delete comment">
              <Delete />
            </IconButton>
            <IconButton size="small" onClick={() => onBanUser(comment.userId)} color="error" title="Ban user">
              <PersonOff />
            </IconButton>
          </Box>
        </Box>
      </Box>
    );

    return (
      <ListItem 
        key={comment.id} 
        alignItems="flex-start" 
      >
        <ListItemAvatar>
          <Avatar sx={{ bgcolor: isReply ? 'secondary.main' : 'primary.main', width: isReply ? 32 : 40, height: isReply ? 32 : 40 }}>
            {String(comment.userId).charAt(0).toUpperCase() || 'U'}
          </Avatar>
        </ListItemAvatar>
        {isReply ? (
          <Paper sx={{ flex: 1, p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 2 }} variant="outlined">
            {commentBody}
          </Paper>
        ) : (
          commentBody
        )}
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
        <Paper variant="outlined" sx={{ maxHeight: 400, overflow: 'auto' }}>
          {processedComments.length === 0 ? (
            <Box p={3} textAlign="center">
              <Typography variant="body2" color="text.secondary">
                No comments yet.
              </Typography>
            </Box>
          ) : (
            <List>
              {processedComments.map((rootComment, index) => (
                <Fragment key={rootComment.id}>
                  {renderComment(rootComment, false)}
                  
                  {rootComment.replies && rootComment.replies.length > 0 && (
                    <Box sx={{ ml: 5 }}>
                      <Button
                        size="small"
                        onClick={() => toggleReplies(rootComment.id)}
                        startIcon={expandedReplies[rootComment.id] ? <ExpandLess /> : <ExpandMore />}
                      >
                        {expandedReplies[rootComment.id] ? 'Ẩn' : 'Xem'} {rootComment.replies.length} trả lời
                      </Button>
                      <Collapse in={expandedReplies[rootComment.id]}>
                        <List sx={{ pt: 0 }}>
                          {rootComment.replies.map(reply => renderComment(reply, true))}
                        </List>
                      </Collapse>
                    </Box>
                  )}

                  {index < processedComments.length - 1 && <Divider variant="inset" component="li" />}
                </Fragment>
              ))}
            </List>
          )}
        </Paper>
      </Collapse>
    </>
  );
};

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
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
  const [userToBan, setUserToBan] = useState<string | null>(null);

  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
  const [newVideoData, setNewVideoData] = useState({
    title: '',
    caption: '',
    categoryId: '',
    status: 'draft',
    tags: '',
  });

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
      if (cats.length > 0 && !newVideoData.categoryId) {
        setNewVideoData(prev => ({ ...prev, categoryId: cats[0].id }));
      }
      calculateStats(vids);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Có lỗi xảy ra khi tải dữ liệu');
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

  const handleCloseUploadDialog = () => {
    setUploadDialogOpen(false);
    setFilesToUpload([]);
    setNewVideoData({
      title: '',
      caption: '',
      categoryId: categories.length > 0 ? categories[0].id : '',
      status: 'draft',
      tags: '',
    });
  };

  const handleVideoUpload = async () => {
    if (filesToUpload.length === 0) {
      toast.error('Vui lòng chọn ít nhất một file video');
      return;
    }
    if (!newVideoData.title) {
      toast.error('Vui lòng nhập tiêu đề');
      return;
    }
    if (!newVideoData.categoryId) {
      toast.error('Vui lòng chọn danh mục');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);
      
      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        
        try {
          // Upload to Cloudinary
          const uploadResult = await uploadVideoToCloudinary(file, {
            folder: 'health_videos',
            onProgress: (progress) => {
              setUploadProgress((i / filesToUpload.length * 100) + (progress / filesToUpload.length));
            }
          });
          
          // Create video record in Firebase
          // Generate thumbnail URL
          const thumbnailUrl = getCloudinaryVideoThumbnail(uploadResult.public_id);
          
          const newVideo: Omit<ShortVideo, 'id'> = {
            title: newVideoData.title || file.name.replace(/\.[^/.]+$/, ""),
            caption: newVideoData.caption,
            videoUrl: uploadResult.secure_url,
            thumbnailUrl: thumbnailUrl,
            thumb: thumbnailUrl, // Save thumb URL to match data structure
            cldPublicId: uploadResult.public_id, // Use cldPublicId for consistency
            cldVersion: Date.now(), // Add version for Cloudinary URL generation
            categoryId: newVideoData.categoryId,
            viewCount: 0,
            likeCount: 0,
            userId: 'admin', // Would be current user
            status: newVideoData.status as 'draft' | 'published',
            uploadDate: Date.now(),
            updatedAt: Date.now(),
            duration: uploadResult.duration || 0,
            width: uploadResult.width || 0,
            height: uploadResult.height || 0,
            tags: newVideoData.tags.split(',').reduce((acc: Record<string, boolean>, tag) => {
              const trimmedTag = tag.trim();
              if (trimmedTag) {
                acc[trimmedTag] = true;
              }
              return acc;
            }, {}),
          };
          
          await videosService.create(newVideo);
          
        } catch (uploadError) {
          console.error(`Error uploading ${file.name}:`, uploadError);
          toast.error(`Lỗi tải lên ${file.name}`);
        }
      }
      
      toast.success(`Đã tải lên ${filesToUpload.length} video thành công`);
      handleCloseUploadDialog();
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
      setFilesToUpload(videoFiles);
      if (videoFiles.length === 1) {
        setNewVideoData(prev => ({
          ...prev,
          title: videoFiles[0].name.replace(/\.[^/.]+$/, ""),
        }));
      }
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
    console.log('Opening video dialog for:', video);
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

  // Comment Management Functions
  const handleDeleteComment = async (commentId: string) => {
    if (!selectedVideo) return;
    
    try {
      await videosService.deleteComment(selectedVideo.id, commentId);
      toast.success('Đã xóa comment');
      loadData(); // Reload to get updated video data
      
      // Update selected video data
      const updatedVideos = await videosService.getAll();
      const updatedVideo = updatedVideos.find(v => v.id === selectedVideo.id);
      if (updatedVideo) {
        setSelectedVideo(updatedVideo);
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Có lỗi xảy ra khi xóa comment');
    }
    setCommentToDelete(null);
  };

  const handleBanUser = async (userId: string) => {
    try {
      // This would require a user service to ban user
      console.log('Banning user:', userId);
      toast.success('Đã ban user');
      // TODO: Implement user banning functionality
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
            onClose={handleCloseUploadDialog}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>Tải lên Video</DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <Box {...getRootProps()} sx={{
                    border: '2px dashed #ccc',
                    borderRadius: 2,
                    p: 4,
                    textAlign: 'center',
                    cursor: 'pointer',
                    bgcolor: isDragActive ? 'action.hover' : 'background.paper',
                  }}>
                    <input {...getInputProps()} />
                    <CloudUpload sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      {isDragActive ? 'Thả file vào đây...' : 'Kéo thả video hoặc click để chọn'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Hỗ trợ: MP4, MOV, AVI, MKV, WebM
                    </Typography>
                    {filesToUpload.length > 0 && (
                      <Box mt={2}>
                        <Typography variant="subtitle1">File đã chọn:</Typography>
                        <List>
                          {filesToUpload.map(file => (
                            <ListItem key={file.name}>
                              <ListItemText primary={file.name} secondary={`${(file.size / 1024 / 1024).toFixed(2)} MB`} />
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    )}
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Tiêu đề"
                    value={newVideoData.title}
                    onChange={(e) => setNewVideoData({ ...newVideoData, title: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Mô tả"
                    multiline
                    rows={4}
                    value={newVideoData.caption}
                    onChange={(e) => setNewVideoData({ ...newVideoData, caption: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Danh mục</InputLabel>
                    <Select
                      value={newVideoData.categoryId}
                      onChange={(e) => setNewVideoData({ ...newVideoData, categoryId: e.target.value })}
                      label="Danh mục"
                    >
                      {categories.map(cat => (
                        <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Trạng thái</InputLabel>
                    <Select
                      value={newVideoData.status}
                      onChange={(e) => setNewVideoData({ ...newVideoData, status: e.target.value })}
                      label="Trạng thái"
                    >
                      <MenuItem value="draft">Bản nháp</MenuItem>
                      <MenuItem value="published">Xuất bản</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Tags (phân cách bởi dấu phẩy)"
                    value={newVideoData.tags}
                    onChange={(e) => setNewVideoData({ ...newVideoData, tags: e.target.value })}
                    placeholder="suckhoe, dinhduong, thethanh"
                    helperText="Ví dụ: suckhoe, dinhduong, thethanh"
                  />
                </Grid>
              </Grid>
              
              {uploading && (
                <Box mt={2}>
                  <Typography variant="body2" gutterBottom>
                    Đang tải lên... {Math.round(uploadProgress)}%
                  </Typography>
                  <LinearProgress variant="determinate" value={uploadProgress} />
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseUploadDialog} disabled={uploading}>
                Hủy
              </Button>
              <Button onClick={handleVideoUpload} variant="contained" disabled={uploading || filesToUpload.length === 0}>
                {uploading ? 'Đang tải lên...' : `Tải lên ${filesToUpload.length} video`}
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
                    
                    {/* Comments Section */}
                    <Grid item xs={12} sx={{ mt: 3 }}>
                       <CommentSection
                        video={selectedVideo}
                        onDeleteComment={setCommentToDelete}
                        onBanUser={setUserToBan}
                        formatDate={formatDate}
                      />
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

          {/* Delete Comment Confirmation Dialog */}
          <Dialog
            open={!!commentToDelete}
            onClose={() => setCommentToDelete(null)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>Xác nhận xóa comment</DialogTitle>
            <DialogContent>
              <Typography>
                Bạn có chắc chắn muốn xóa comment này? Hành động này không thể hoàn tác.
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setCommentToDelete(null)}>Hủy</Button>
              <Button 
                variant="contained" 
                color="error"
                onClick={() => commentToDelete && handleDeleteComment(commentToDelete)}
              >
                Xóa
              </Button>
            </DialogActions>
          </Dialog>

          {/* Ban User Confirmation Dialog */}
          <Dialog
            open={!!userToBan}
            onClose={() => setUserToBan(null)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>Xác nhận ban user</DialogTitle>
            <DialogContent>
              <Typography>
                Bạn có chắc chắn muốn ban user này? User sẽ không thể comment hoặc tương tác.
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                User ID: {userToBan}
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setUserToBan(null)}>Hủy</Button>
              <Button 
                variant="contained" 
                color="error"
                onClick={() => userToBan && handleBanUser(userToBan)}
              >
                Ban User
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