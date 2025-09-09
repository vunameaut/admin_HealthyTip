import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  IconButton,
  Slider,
  Typography,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  VolumeUp,
  VolumeOff,
  Fullscreen,
  FullscreenExit,
} from '@mui/icons-material';
import { getCloudinaryVideoUrl, getCloudinaryVideoThumbnail } from '../utils/cloudinary';

interface VideoPlayerProps {
  videoUrl?: string;
  cloudinaryPublicId?: string;
  thumbnailUrl?: string;
  title?: string;
  width?: number | string;
  height?: number | string;
  autoPlay?: boolean;
  muted?: boolean;
  controls?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
}

export default function VideoPlayer({
  videoUrl,
  cloudinaryPublicId,
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
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(muted);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Get the appropriate video URL
  const finalVideoUrl = cloudinaryPublicId 
    ? getCloudinaryVideoUrl(cloudinaryPublicId, { quality: 'auto' })
    : videoUrl;

  // Get the appropriate thumbnail URL
  const finalThumbnailUrl = cloudinaryPublicId
    ? getCloudinaryVideoThumbnail(cloudinaryPublicId)
    : thumbnailUrl;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      onTimeUpdate?.(video.currentTime, video.duration);
    };

    const handlePlay = () => {
      setIsPlaying(true);
      onPlay?.();
    };

    const handlePause = () => {
      setIsPlaying(false);
      onPause?.();
    };

    const handleEnded = () => {
      setIsPlaying(false);
      onEnded?.();
    };

    const handleError = () => {
      setError(true);
      setLoading(false);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
    };
  }, [onPlay, onPause, onEnded, onTimeUpdate]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
  };

  const handleSeek = (value: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = value;
    setCurrentTime(value);
  };

  const handleVolumeChange = (value: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.volume = value;
    setVolume(value);
    setIsMuted(value === 0);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isMuted) {
      video.volume = volume;
      setIsMuted(false);
    } else {
      video.volume = 0;
      setIsMuted(true);
    }
  };

  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;

    if (!isFullscreen) {
      if (video.requestFullscreen) {
        video.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (error) {
    return (
      <Box
        sx={{
          width,
          height,
          bgcolor: 'grey.200',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          borderRadius: 1,
        }}
      >
        <Typography color="error" variant="body2">
          Không thể tải video
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {finalVideoUrl}
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        position: 'relative',
        width,
        height,
        bgcolor: 'black',
        borderRadius: 1,
        overflow: 'hidden',
        '&:hover .video-controls': {
          opacity: 1,
        },
      }}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={finalVideoUrl}
        poster={finalThumbnailUrl}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
        }}
        autoPlay={autoPlay}
        muted={muted}
        playsInline
      />

      {/* Loading */}
      {loading && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <CircularProgress color="primary" />
        </Box>
      )}

      {/* Custom Controls */}
      {controls && !loading && (
        <Box
          className="video-controls"
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
            p: 1,
            opacity: 0,
            transition: 'opacity 0.3s ease',
          }}
        >
          {/* Progress Bar */}
          <Slider
            size="small"
            value={currentTime}
            min={0}
            max={duration || 100}
            onChange={(_, value) => handleSeek(value as number)}
            sx={{
              color: '#4CAF50',
              mb: 1,
              '& .MuiSlider-thumb': {
                width: 12,
                height: 12,
              },
            }}
          />

          {/* Control Buttons */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Play/Pause */}
            <Tooltip title={isPlaying ? 'Pause' : 'Play'}>
              <IconButton size="small" onClick={togglePlay} sx={{ color: 'white' }}>
                {isPlaying ? <Pause /> : <PlayArrow />}
              </IconButton>
            </Tooltip>

            {/* Time */}
            <Typography variant="caption" sx={{ color: 'white', minWidth: 80 }}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </Typography>

            {/* Spacer */}
            <Box sx={{ flexGrow: 1 }} />

            {/* Volume */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: 100 }}>
              <Tooltip title={isMuted ? 'Unmute' : 'Mute'}>
                <IconButton size="small" onClick={toggleMute} sx={{ color: 'white' }}>
                  {isMuted ? <VolumeOff /> : <VolumeUp />}
                </IconButton>
              </Tooltip>
              <Slider
                size="small"
                value={isMuted ? 0 : volume}
                min={0}
                max={1}
                step={0.1}
                onChange={(_, value) => handleVolumeChange(value as number)}
                sx={{
                  color: 'white',
                  '& .MuiSlider-thumb': {
                    width: 8,
                    height: 8,
                  },
                }}
              />
            </Box>

            {/* Fullscreen */}
            <Tooltip title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}>
              <IconButton size="small" onClick={toggleFullscreen} sx={{ color: 'white' }}>
                {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      )}

      {/* Title Overlay */}
      {title && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(rgba(0,0,0,0.7), transparent)',
            p: 1,
            opacity: 0,
            transition: 'opacity 0.3s ease',
            '.video-controls:hover ~ &, &:hover': {
              opacity: 1,
            },
          }}
        >
          <Typography variant="subtitle2" sx={{ color: 'white' }}>
            {title}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
