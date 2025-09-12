import React from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip
} from '@mui/material';
import {
  VideoLibrary,
  CheckCircle,
  Error,
  Cancel,
  CloudUpload
} from '@mui/icons-material';

export interface UploadItem {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
  cloudinaryData?: {
    publicId: string;
    secureUrl: string;
    thumbnailUrl?: string;
    duration?: number;
    width?: number;
    height?: number;
  };
}

interface UploadProgressProps {
  uploads: UploadItem[];
  onCancel?: (id: string) => void;
  onRetry?: (id: string) => void;
}

export default function UploadProgress({ uploads, onCancel, onRetry }: UploadProgressProps) {
  const getStatusColor = (status: UploadItem['status']) => {
    switch (status) {
      case 'completed': return 'success';
      case 'error': return 'error';
      case 'uploading': return 'primary';
      case 'processing': return 'warning';
      case 'pending': return 'default';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: UploadItem['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle color="success" />;
      case 'error': return <Error color="error" />;
      case 'uploading': case 'processing': return <CloudUpload color="primary" />;
      case 'pending': return <VideoLibrary color="disabled" />;
      default: return <VideoLibrary />;
    }
  };

  const getStatusText = (status: UploadItem['status']) => {
    switch (status) {
      case 'pending': return 'Chờ tải lên';
      case 'uploading': return 'Đang tải lên';
      case 'processing': return 'Đang xử lý';
      case 'completed': return 'Hoàn thành';
      case 'error': return 'Lỗi';
      default: return status;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (uploads.length === 0) {
    return null;
  }

  const totalUploads = uploads.length;
  const completedUploads = uploads.filter(u => u.status === 'completed').length;
  const errorUploads = uploads.filter(u => u.status === 'error').length;
  const overallProgress = totalUploads > 0 ? (completedUploads / totalUploads) * 100 : 0;

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            Tiến trình tải lên ({completedUploads}/{totalUploads})
          </Typography>
          <Box display="flex" gap={1}>
            <Chip 
              label={`${completedUploads} thành công`} 
              color="success" 
              size="small" 
              variant="outlined"
            />
            {errorUploads > 0 && (
              <Chip 
                label={`${errorUploads} lỗi`} 
                color="error" 
                size="small" 
                variant="outlined"
              />
            )}
          </Box>
        </Box>

        <LinearProgress 
          variant="determinate" 
          value={overallProgress} 
          sx={{ mb: 2, height: 8, borderRadius: 1 }}
        />

        <List dense>
          {uploads.map((upload) => (
            <ListItem key={upload.id} divider>
              <ListItemIcon>
                {getStatusIcon(upload.status)}
              </ListItemIcon>
              
              <ListItemText
                primary={
                  <Box>
                    <Typography variant="body2" noWrap>
                      {upload.file.name}
                    </Typography>
                    <Box display="flex" gap={1} alignItems="center" mt={0.5}>
                      <Chip 
                        label={getStatusText(upload.status)} 
                        color={getStatusColor(upload.status) as any}
                        size="small"
                      />
                      <Typography variant="caption" color="text.secondary">
                        {formatFileSize(upload.file.size)}
                      </Typography>
                      {upload.cloudinaryData?.duration && (
                        <Typography variant="caption" color="text.secondary">
                          • {formatDuration(upload.cloudinaryData.duration)}
                        </Typography>
                      )}
                      {upload.cloudinaryData?.width && upload.cloudinaryData?.height && (
                        <Typography variant="caption" color="text.secondary">
                          • {upload.cloudinaryData.width}x{upload.cloudinaryData.height}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                }
                secondary={
                  <Box mt={1}>
                    {upload.status === 'error' && upload.error && (
                      <Typography variant="caption" color="error">
                        {upload.error}
                      </Typography>
                    )}
                    {(upload.status === 'uploading' || upload.status === 'processing') && (
                      <LinearProgress 
                        variant="determinate" 
                        value={upload.progress} 
                        sx={{ mt: 0.5, height: 4 }}
                      />
                    )}
                    {upload.status === 'uploading' && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                        {Math.round(upload.progress)}% đã tải lên
                      </Typography>
                    )}
                  </Box>
                }
              />

              <ListItemSecondaryAction>
                {upload.status === 'error' && onRetry && (
                  <IconButton 
                    edge="end" 
                    size="small" 
                    onClick={() => onRetry(upload.id)}
                    sx={{ mr: 1 }}
                  >
                    <CloudUpload />
                  </IconButton>
                )}
                {(upload.status === 'pending' || upload.status === 'uploading') && onCancel && (
                  <IconButton 
                    edge="end" 
                    size="small" 
                    onClick={() => onCancel(upload.id)}
                  >
                    <Cancel />
                  </IconButton>
                )}
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}
