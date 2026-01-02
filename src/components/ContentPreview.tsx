import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  Divider,
  Avatar,
  Stack,
  IconButton,
  Paper
} from '@mui/material';
import {
  Close,
  Visibility,
  CalendarToday,
  Person,
  Category,
  Favorite,
  Share
} from '@mui/icons-material';
import { ContentBlock } from './RichContentEditor';

interface ContentPreviewProps {
  open: boolean;
  onClose: () => void;
  title: string;
  content: ContentBlock[] | any[];
  category?: string;
  tags?: string[];
  author?: string;
  imageUrl?: string;
  videoUrl?: string;
  isFeature?: boolean;
  status?: 'draft' | 'published' | 'archived' | 'review';
  createdAt?: number | string;
  viewCount?: number;
  likeCount?: number;
}

const ContentPreview: React.FC<ContentPreviewProps> = ({
  open,
  onClose,
  title,
  content,
  category,
  tags = [],
  author,
  imageUrl,
  videoUrl,
  isFeature,
  status,
  createdAt,
  viewCount = 0,
  likeCount = 0
}) => {
  const formatDate = (timestamp: number | string | undefined) => {
    if (!timestamp) return new Date().toLocaleDateString('vi-VN');
    const date = typeof timestamp === 'number' ? new Date(timestamp) : new Date(timestamp);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderContentBlock = (block: any, index: number) => {
    // Handle old format (with 'value' property)
    const blockContent = block.content || block.value || '';
    const blockType = block.type || 'text';

    switch (blockType) {
      case 'heading':
        const level = block.metadata?.level || 2;
        return (
          <Typography
            key={index}
            variant={`h${level}` as any}
            sx={{ 
              fontWeight: 600, 
              mb: 2,
              mt: level === 1 ? 3 : 2,
              color: 'primary.main'
            }}
          >
            {blockContent}
          </Typography>
        );

      case 'image':
        return (
          <Box key={index} sx={{ my: 3, textAlign: 'center' }}>
            <img
              src={blockContent}
              alt={block.metadata?.alt || 'Image'}
              style={{
                maxWidth: '100%',
                height: 'auto',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
            />
            {block.metadata?.caption && (
              <Typography
                variant="caption"
                sx={{ 
                  display: 'block', 
                  mt: 1, 
                  fontStyle: 'italic',
                  color: 'text.secondary'
                }}
              >
                {block.metadata.caption}
              </Typography>
            )}
          </Box>
        );

      case 'quote':
        return (
          <Paper
            key={index}
            elevation={0}
            sx={{
              my: 3,
              p: 3,
              borderLeft: 4,
              borderColor: 'primary.main',
              bgcolor: 'action.hover',
              fontStyle: 'italic'
            }}
          >
            <Typography variant="body1" sx={{ mb: 1 }}>
              "{blockContent}"
            </Typography>
            {block.metadata?.author && (
              <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'right' }}>
                — {block.metadata.author}
                {block.metadata?.source && `, ${block.metadata.source}`}
              </Typography>
            )}
          </Paper>
        );

      case 'text':
      default:
        return (
          <Typography
            key={index}
            variant="body1"
            sx={{ 
              mb: 2, 
              lineHeight: 1.8,
              color: 'text.primary',
              whiteSpace: 'pre-wrap'
            }}
          >
            {blockContent}
          </Typography>
        );
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          maxHeight: '90vh',
          borderRadius: 2
        }
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: 1,
          borderColor: 'divider',
          pb: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Visibility color="primary" />
          <Typography variant="h6" fontWeight={600}>
            Xem trước bài viết
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {/* Status and Feature Badge */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          {status && (
            <Chip
              label={
                status === 'published' ? 'Đã xuất bản' :
                status === 'draft' ? 'Bản nháp' :
                status === 'review' ? 'Chờ duyệt' :
                'Đã lưu trữ'
              }
              color={
                status === 'published' ? 'success' :
                status === 'draft' ? 'warning' :
                status === 'review' ? 'info' :
                'default'
              }
              size="small"
            />
          )}
          {isFeature && (
            <Chip
              label="Nổi bật"
              color="primary"
              size="small"
              icon={<Favorite />}
            />
          )}
        </Box>

        {/* Title */}
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            mb: 2,
            color: 'text.primary',
            lineHeight: 1.3
          }}
        >
          {title || 'Chưa có tiêu đề'}
        </Typography>

        {/* Meta Information */}
        <Stack direction="row" spacing={2} sx={{ mb: 3, flexWrap: 'wrap', gap: 1 }}>
          {author && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Person fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                {author}
              </Typography>
            </Box>
          )}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <CalendarToday fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {formatDate(createdAt)}
            </Typography>
          </Box>
          {category && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Category fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                {category}
              </Typography>
            </Box>
          )}
          {(viewCount > 0 || likeCount > 0) && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" color="text.secondary">
                <Visibility fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                {viewCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <Favorite fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                {likeCount}
              </Typography>
            </Box>
          )}
        </Stack>

        <Divider sx={{ mb: 3 }} />

        {/* Featured Image */}
        {imageUrl && (
          <Box sx={{ mb: 3 }}>
            <img
              src={imageUrl}
              alt={title}
              style={{
                width: '100%',
                height: 'auto',
                maxHeight: '400px',
                objectFit: 'cover',
                borderRadius: '8px'
              }}
            />
          </Box>
        )}

        {/* Video */}
        {videoUrl && (
          <Box sx={{ mb: 3, position: 'relative', paddingBottom: '56.25%', height: 0 }}>
            <iframe
              src={videoUrl}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                borderRadius: '8px',
                border: 'none'
              }}
              allowFullScreen
            />
          </Box>
        )}

        {/* Content */}
        <Box sx={{ mb: 3 }}>
          {Array.isArray(content) && content.length > 0 ? (
            content.map((block, index) => renderContentBlock(block, index))
          ) : (
            <Typography variant="body1" color="text.secondary" fontStyle="italic">
              Chưa có nội dung
            </Typography>
          )}
        </Box>

        {/* Tags */}
        {tags && tags.length > 0 && (
          <>
            <Divider sx={{ my: 3 }} />
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary" fontWeight={600}>
                Tags:
              </Typography>
              {tags.map((tag, index) => (
                <Chip
                  key={index}
                  label={tag}
                  size="small"
                  variant="outlined"
                  color="primary"
                />
              ))}
            </Box>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, borderTop: 1, borderColor: 'divider' }}>
        <Button onClick={onClose} variant="contained">
          Đóng
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ContentPreview;
