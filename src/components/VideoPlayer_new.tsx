import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Card,
  CardMedia,
  CardContent,
  Typography,
  IconButton,
  Slider,
  Stack,
  Tooltip,
  Chip,
  CircularProgress
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  VolumeUp,
  VolumeOff,
  Fullscreen,
  FullscreenExit
} from '@mui/icons-material';
import { Media } from '../types';

interface VideoPlayerProps {
  media: Media;
  autoPlay?: boolean;
  controls?: boolean;
  width?: number | string;
  height?: number | string;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
}

export default function VideoPlayer({
  media,
  autoPlay = false,
  controls = true,
  width = '100%',
  height = 'auto',
  onPlay,
  onPause,
  onEnded
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showControls, setShowControls] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedData = () => {
      setIsLoading(false);
      setDuration(video.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
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
      setHasError(true);
      setIsLoading(false);
    };

    const handleVolumeChange = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };

    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);
    video.addEventListener('volumechange', handleVolumeChange);

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
      video.removeEventListener('volumechange', handleVolumeChange);
    };
  }, [onPlay, onPause, onEnded]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
  };

  const handleSeek = (event: Event, newValue: number | number[]) => {
    const video = videoRef.current;
    if (!video) return;

    const seekTime = Array.isArray(newValue) ? newValue[0] : newValue;
    video.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const handleVolumeChange = (event: Event, newValue: number | number[]) => {
    const video = videoRef.current;
    if (!video) return;

    const newVolume = Array.isArray(newValue) ? newValue[0] : newValue;
    video.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      videoRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleMouseEnter = () => {
    setShowControls(true);
  };

  const handleMouseLeave = () => {
    if (isPlaying) {
      setShowControls(false);
    }
  };

  if (hasError) {
    return (
      <Card sx={{ width, height: height !== 'auto' ? height : 300 }}>
        <Box
          sx={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'grey.200',
            color: 'text.secondary'
          }}
        >
          <Typography>Không thể tải video</Typography>
        </Box>
      </Card>
    );
  }

  return (
    <Card sx={{ width, position: 'relative' }}>
      <Box
        sx={{ position: 'relative' }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Video Element */}
        <video
          ref={videoRef}
          poster={media.thumbnail_url}
          autoPlay={autoPlay}
          style={{
            width: '100%',
            height: height !== 'auto' ? height : 'auto',
            maxHeight: 400,
            display: 'block'
          }}
        >
          <source src={media.secure_url} type="video/mp4" />
          Trình duyệt không hỗ trợ video.
        </video>

        {/* Loading Spinner */}
        {isLoading && (
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 2
            }}
          >
            <CircularProgress />
          </Box>
        )}

        {/* Play/Pause Overlay */}
        {!isLoading && (
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
              cursor: 'pointer',
              opacity: showControls || !isPlaying ? 1 : 0,
              transition: 'opacity 0.3s ease'
            }}
            onClick={togglePlay}
          >
            {!isPlaying && (
              <IconButton
                sx={{
                  bgcolor: 'rgba(0,0,0,0.6)',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'rgba(0,0,0,0.8)'
                  }
                }}
              >
                <PlayArrow sx={{ fontSize: 48 }} />
              </IconButton>
            )}
          </Box>
        )}

        {/* Controls */}
        {controls && !isLoading && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              bgcolor: 'rgba(0,0,0,0.7)',
              color: 'white',
              p: 1,
              opacity: showControls ? 1 : 0,
              transition: 'opacity 0.3s ease'
            }}
          >
            {/* Progress Bar */}
            <Box sx={{ mb: 1 }}>
              <Slider
                value={currentTime}
                max={duration}
                onChange={handleSeek}
                sx={{
                  color: 'primary.main',
                  '& .MuiSlider-thumb': {
                    width: 12,
                    height: 12
                  },
                  '& .MuiSlider-track': {
                    height: 3
                  },
                  '& .MuiSlider-rail': {
                    height: 3,
                    opacity: 0.3
                  }
                }}
              />
            </Box>

            {/* Control Buttons */}
            <Stack direction="row" alignItems="center" spacing={1}>
              <IconButton size="small" onClick={togglePlay} sx={{ color: 'white' }}>
                {isPlaying ? <Pause /> : <PlayArrow />}
              </IconButton>

              <Typography variant="caption" sx={{ minWidth: 80 }}>
                {formatTime(currentTime)} / {formatTime(duration)}
              </Typography>

              <Box sx={{ flexGrow: 1 }} />

              <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 100 }}>
                <IconButton size="small" onClick={toggleMute} sx={{ color: 'white' }}>
                  {isMuted || volume === 0 ? <VolumeOff /> : <VolumeUp />}
                </IconButton>
                <Slider
                  value={isMuted ? 0 : volume}
                  max={1}
                  step={0.1}
                  onChange={handleVolumeChange}
                  sx={{
                    width: 60,
                    color: 'white',
                    '& .MuiSlider-thumb': {
                      width: 8,
                      height: 8
                    }
                  }}
                />
              </Box>

              <IconButton size="small" onClick={toggleFullscreen} sx={{ color: 'white' }}>
                {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
              </IconButton>
            </Stack>
          </Box>
        )}
      </Box>

      {/* Video Info */}
      <CardContent sx={{ pt: 1 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
            {media.original_filename}
          </Typography>
          <Stack direction="row" spacing={1}>
            {media.duration && (
              <Chip
                label={formatTime(media.duration)}
                size="small"
                variant="outlined"
              />
            )}
            <Chip
              label={media.format?.toUpperCase() || 'VIDEO'}
              size="small"
              color="primary"
              variant="outlined"
            />
          </Stack>
        </Stack>

        {media.width && media.height && (
          <Typography variant="caption" color="text.secondary" display="block">
            {media.width} × {media.height} • {Math.round((media.bytes || 0) / 1024 / 1024)} MB
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
