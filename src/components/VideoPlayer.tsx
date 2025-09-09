import React, { useRef, useEffect, useState } from 'react';
import {
  Box,
  CircularProgress,
  Alert,
  Typography,
  Chip,
  IconButton,
  Skeleton,
  Fade,
  Tooltip,
  LinearProgress,
  Slider
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  VolumeOff,
  VolumeUp,
  AspectRatio,
  Fullscreen,
  FitScreen
} from '@mui/icons-material';
import { getCloudinaryVideoThumbnail } from '../utils/cloudinary';

interface VideoPlayerProps {
  cloudinaryPublicId?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  title?: string;
  width?: string | number;
  height?: string | number;
  autoPlay?: boolean;
  muted?: boolean;
  controls?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onVideoInfoLoaded?: (info: { duration: number, fileSize: string, dimensions: string }) => void;
}

// Cloudinary utilities
const getCloudinaryVideoUrl = (publicId: string, options?: { quality?: string }) => {
  const cloudName = 'dazo6ypwt';
  const quality = options?.quality || 'auto';
  return `https://res.cloudinary.com/${cloudName}/video/upload/q_${quality}/${publicId}.mp4`;
};

// Utility functions
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

const estimateVideoFileSize = (duration: number, width: number, height: number) => {
  const pixelCount = width * height;
  const resolutionFactor = pixelCount / (1920 * 1080);
  const baseBitrate = 2000000;
  const estimatedBitrate = baseBitrate * Math.min(resolutionFactor, 1);
  const estimatedBytes = (duration * estimatedBitrate) / 8;
  return estimatedBytes;
};

export default function VideoPlayer({
  cloudinaryPublicId,
  videoUrl,
  thumbnailUrl,
  title,
  width = '100%',
  height = 300,
  autoPlay = false,
  muted = false,
  controls = true,
  onPlay,
  onPause,
  onEnded,
  onTimeUpdate,
  onVideoInfoLoaded,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(muted);
  const [cover, setCover] = useState(false);
  const [theater, setTheater] = useState(false);
  const [showToolbar, setShowToolbar] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [videoInfo, setVideoInfo] = useState<{
    duration: number;
    fileSize: string;
    dimensions: string;
  } | null>(null);

  // URLs
  const finalVideoUrl = cloudinaryPublicId 
    ? getCloudinaryVideoUrl(cloudinaryPublicId, { quality: 'auto' })
    : videoUrl;

  const finalThumbnailUrl = cloudinaryPublicId
    ? getCloudinaryVideoThumbnail(cloudinaryPublicId)
    : thumbnailUrl;

  // Debug logging
  console.log('VideoPlayer Debug:', {
    cloudinaryPublicId,
    videoUrl,
    thumbnailUrl,
    finalVideoUrl,
    finalThumbnailUrl
  });

  // Validation - show placeholder for missing video
  if (!finalVideoUrl && !cloudinaryPublicId && !videoUrl) {
    return (
      <Box 
        sx={{ 
          width, 
          height, 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: '#f5f5f5',
          border: '2px dashed #ddd',
          borderRadius: 2
        }}
      >
        <PlayArrow sx={{ fontSize: 48, color: '#ccc', mb: 1 }} />
        <Typography variant="body2" color="text.secondary">
          Video đang xử lý hoặc chưa upload
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
          CloudinaryID: {cloudinaryPublicId || 'Không có'}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          VideoURL: {videoUrl || 'Không có'}
        </Typography>
      </Box>
    );
  }

  // Event handlers
  const handlePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().catch(console.warn);
      setIsPlaying(true);
      onPlay?.();
    } else {
      video.pause();
      setIsPlaying(false);
      onPause?.();
    }
  };

  const handleMuteToggle = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const handleFitToggle = () => {
    setCover(!cover);
  };

  const handleTheaterToggle = () => {
    setTheater(!theater);
  };

  const handleSeek = (event: Event, newValue: number | number[]) => {
    const video = videoRef.current;
    if (!video || Array.isArray(newValue)) return;

    const seekTime = (newValue / 100) * duration;
    video.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const getProgress = () => {
    if (duration === 0) return 0;
    return (currentTime / duration) * 100;
  };

  // Video event handlers
  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (!video) return;

    setLoading(false);
    setDuration(video.duration);
    
    // Unmute if not initially muted
    if (!muted) {
      video.muted = false;
      setIsMuted(false);
    }

    // Update video info
    if (video.duration && video.videoWidth && video.videoHeight) {
      const estimatedBytes = estimateVideoFileSize(video.duration, video.videoWidth, video.videoHeight);
      const info = {
        duration: video.duration,
        fileSize: formatFileSize(estimatedBytes),
        dimensions: `${video.videoWidth}x${video.videoHeight}`,
      };
      setVideoInfo(info);
      onVideoInfoLoaded?.(info);
    }
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;

    setCurrentTime(video.currentTime);
    onTimeUpdate?.(video.currentTime, video.duration);
  };

  const handleVideoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    handlePlayPause();
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', () => setIsPlaying(true));
    video.addEventListener('pause', () => setIsPlaying(false));
    video.addEventListener('ended', () => {
      setIsPlaying(false);
      onEnded?.();
    });
    video.addEventListener('error', () => {
      setError('Không thể tải video');
      setLoading(false);
    });

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [finalVideoUrl]);

  const aspectRatio = theater ? '21/9' : '16/9';
  const objectFit = cover ? 'cover' : 'contain';

  if (error) {
    return (
      <Box sx={{ width, height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width,
        aspectRatio,
        backgroundColor: '#000',
        position: 'relative',
        borderRadius: 2,
        overflow: 'hidden',
        boxShadow: 'none',
        cursor: 'pointer',
        border: '1px solid #333',
      }}
      onMouseEnter={() => setShowToolbar(true)}
      onMouseLeave={() => setShowToolbar(false)}
      onClick={handleVideoClick}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={finalVideoUrl || (cloudinaryPublicId ? getCloudinaryVideoUrl(cloudinaryPublicId) : undefined)}
        poster={finalThumbnailUrl}
        style={{
          width: '100%',
          height: '100%',
          objectFit,
          objectPosition: 'center',
        }}
        autoPlay={autoPlay}
        muted={isMuted}
        controls={false}
        playsInline
        preload="metadata"
      />

      {/* Skeleton Loading */}
      {loading && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#000',
            zIndex: 1,
          }}
        >
          <Skeleton
            variant="rectangular"
            width="100%"
            height="100%"
            animation="wave"
            sx={{
              bgcolor: '#1a1a1a',
              '&::after': {
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)',
              }
            }}
          />
          <CircularProgress
            sx={{
              position: 'absolute',
              color: 'primary.main',
            }}
          />
        </Box>
      )}

      {/* Title Overlay */}
      {title && !loading && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(180deg, rgba(0,0,0,0.7) 0%, transparent 100%)',
            p: 2,
            zIndex: 2,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              color: 'white',
              fontWeight: 'bold',
              textShadow: '0 2px 4px rgba(0,0,0,0.8)',
            }}
          >
            {title}
          </Typography>
        </Box>
      )}

      {/* Info Chips */}
      {videoInfo && !loading && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 24,
            right: 16,
            display: 'flex',
            gap: 1,
            zIndex: 2,
          }}
        >
          <Chip
            label={formatDuration(currentTime) + ' / ' + formatDuration(duration)}
            size="small"
            sx={{
              backgroundColor: 'rgba(0,0,0,0.7)',
              color: 'white',
              fontWeight: 'bold',
            }}
          />
          <Chip
            label={videoInfo.dimensions}
            size="small"
            sx={{
              backgroundColor: 'rgba(0,0,0,0.7)',
              color: 'white',
            }}
          />
          <Chip
            label={videoInfo.fileSize}
            size="small"
            sx={{
              backgroundColor: 'rgba(0,0,0,0.7)',
              color: 'white',
            }}
          />
        </Box>
      )}

      {/* Progress Bar */}
      {!loading && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 4,
            backgroundColor: 'rgba(255,255,255,0.3)',
            zIndex: 2,
            transition: 'height 0.2s ease',
            '&:hover': {
              height: 8,
            },
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <Slider
            value={getProgress()}
            onChange={handleSeek}
            sx={{
              position: 'absolute',
              top: -2,
              left: 0,
              right: 0,
              height: 8,
              padding: 0,
              '& .MuiSlider-track': {
                backgroundColor: 'primary.main',
                border: 'none',
                height: 4,
              },
              '& .MuiSlider-rail': {
                backgroundColor: 'rgba(255,255,255,0.3)',
                height: 4,
              },
              '& .MuiSlider-thumb': {
                width: 12,
                height: 12,
                backgroundColor: 'primary.main',
                border: '2px solid white',
                '&:hover': {
                  boxShadow: '0 0 0 8px rgba(25, 118, 210, 0.16)',
                },
                '&:focus, &:hover, &.Mui-active': {
                  boxShadow: '0 0 0 8px rgba(25, 118, 210, 0.16)',
                },
              },
            }}
          />
        </Box>
      )}

      {/* Toolbar */}
      <Fade in={showToolbar && !loading}>
        <Box
          sx={{
            position: 'absolute',
            bottom: 24,
            left: 16,
            display: 'flex',
            gap: 1,
            zIndex: 3,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <Tooltip title={isPlaying ? "Pause" : "Play"}>
            <IconButton
              onClick={handlePlayPause}
              sx={{
                backgroundColor: 'rgba(0,0,0,0.7)',
                color: 'white',
                '&:hover': { backgroundColor: 'rgba(0,0,0,0.9)' },
              }}
            >
              {isPlaying ? <Pause /> : <PlayArrow />}
            </IconButton>
          </Tooltip>

          <Tooltip title={isMuted ? "Unmute" : "Mute"}>
            <IconButton
              onClick={handleMuteToggle}
              sx={{
                backgroundColor: 'rgba(0,0,0,0.7)',
                color: 'white',
                '&:hover': { backgroundColor: 'rgba(0,0,0,0.9)' },
              }}
            >
              {isMuted ? <VolumeOff /> : <VolumeUp />}
            </IconButton>
          </Tooltip>

          <Tooltip title={cover ? "Fit: Contain" : "Fit: Cover"}>
            <IconButton
              onClick={handleFitToggle}
              sx={{
                backgroundColor: 'rgba(0,0,0,0.7)',
                color: 'white',
                '&:hover': { backgroundColor: 'rgba(0,0,0,0.9)' },
              }}
            >
              {cover ? <FitScreen /> : <AspectRatio />}
            </IconButton>
          </Tooltip>

          <Tooltip title={theater ? "Exit Theater" : "Theater Mode"}>
            <IconButton
              onClick={handleTheaterToggle}
              sx={{
                backgroundColor: 'rgba(0,0,0,0.7)',
                color: 'white',
                '&:hover': { backgroundColor: 'rgba(0,0,0,0.9)' },
              }}
            >
              <Fullscreen />
            </IconButton>
          </Tooltip>
        </Box>
      </Fade>
    </Box>
  );
}
