import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  LinearProgress,
} from '@mui/material';
import { CloudUpload } from '@mui/icons-material';

export default function CloudinaryTestPage() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      setError('Vui lòng chọn file video');
      return;
    }

    try {
      setUploading(true);
      setError('');
      setProgress(0);

      // NOTE: uploadVideoToCloudinary function is not available
      // const uploadResult = await uploadVideoToCloudinary(file, {
      //   folder: 'health_videos_test',
      //   uploadPreset: 'ml_default', // Use default preset for testing
      //   onProgress: (progress: number) => {
      //     setProgress(progress);
      //   }
      // });

      // setResult(uploadResult);
      setError('Function uploadVideoToCloudinary is not implemented');
    } catch (error) {
      console.error('Upload error:', error);
      setError('Lỗi upload: ' + (error as Error).message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Test Cloudinary Upload
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Upload Video
          </Typography>
          
          <input
            accept="video/*"
            style={{ display: 'none' }}
            id="video-upload"
            type="file"
            onChange={handleFileSelect}
            disabled={uploading}
          />
          
          <label htmlFor="video-upload">
            <Button
              variant="contained"
              component="span"
              startIcon={<CloudUpload />}
              disabled={uploading}
              sx={{ mb: 2 }}
            >
              {uploading ? 'Đang upload...' : 'Chọn video'}
            </Button>
          </label>

          {uploading && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Upload progress: {Math.round(progress)}%
              </Typography>
              <LinearProgress variant="determinate" value={progress} />
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {result && (
            <Box>
              <Alert severity="success" sx={{ mb: 2 }}>
                Upload thành công!
              </Alert>
              
              <Typography variant="h6" gutterBottom>
                Upload Result:
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Public ID:</strong> {result.public_id}
                </Typography>
                <Typography variant="body2">
                  <strong>Video URL:</strong> {result.secure_url}
                </Typography>
                <Typography variant="body2">
                  <strong>Thumbnail URL:</strong> {result.thumbnail_url}
                </Typography>
                <Typography variant="body2">
                  <strong>Duration:</strong> {result.duration}s
                </Typography>
                <Typography variant="body2">
                  <strong>Dimensions:</strong> {result.width}x{result.height}
                </Typography>
              </Box>

              {/* Display thumbnail */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Thumbnail:</strong>
                </Typography>
                <img 
                  src={result.thumbnail_url} 
                  alt="Video thumbnail"
                  style={{ maxWidth: 200, height: 'auto' }}
                />
              </Box>

              {/* Display video */}
              <Box>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Video:</strong>
                </Typography>
                <video 
                  controls 
                  style={{ maxWidth: 400, height: 'auto' }}
                  poster={result.thumbnail_url}
                >
                  <source src={result.secure_url} type="video/mp4" />
                </video>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
