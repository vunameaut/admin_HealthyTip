import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Button,
  Stack,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem as SelectItem,
  CircularProgress,
  Pagination
} from '@mui/material';
import {
  Image,
  VideoLibrary,
  Delete,
  Edit,
  MoreVert,
  Search,
  FilterList,
  Refresh,
  Download,
  ContentCopy,
  Visibility
} from '@mui/icons-material';
import { Media, Category } from '../types';
import { mediaService, categoriesService } from '../services/firebase';
import VideoPlayer from './VideoPlayer';
import toast from 'react-hot-toast';

interface MediaLibraryProps {
  onMediaSelect?: (media: Media) => void;
  selectionMode?: boolean;
  categoryFilter?: string;
  typeFilter?: 'image' | 'video' | 'all';
}

export default function MediaLibrary({
  onMediaSelect,
  selectionMode = false,
  categoryFilter,
  typeFilter = 'all'
}: MediaLibraryProps) {
  const [media, setMedia] = useState<Media[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentCategory, setCurrentCategory] = useState(categoryFilter || 'all');
  const [currentType, setCurrentType] = useState<'all' | 'image' | 'video'>(typeFilter);
  const [page, setPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuMedia, setMenuMedia] = useState<Media | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, [currentCategory, currentType]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [mediaData, categoriesData] = await Promise.all([
        mediaService.getAll({
          categoryId: currentCategory !== 'all' ? currentCategory : undefined,
          type: currentType !== 'all' ? currentType : undefined
        }),
        categoriesService.getAll()
      ]);
      
      setMedia(mediaData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const filteredMedia = media.filter(item => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        item.original_filename?.toLowerCase().includes(query) ||
        item.public_id.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const paginatedMedia = filteredMedia.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const totalPages = Math.ceil(filteredMedia.length / itemsPerPage);

  const handleMediaClick = (mediaItem: Media) => {
    if (selectionMode) {
      onMediaSelect?.(mediaItem);
    } else {
      setSelectedMedia(mediaItem);
      setPreviewDialogOpen(true);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, mediaItem: Media) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setMenuMedia(mediaItem);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuMedia(null);
  };

  const handleCopyUrl = () => {
    if (menuMedia) {
      navigator.clipboard.writeText(menuMedia.secure_url);
      toast.success('Đã copy URL');
    }
    handleMenuClose();
  };

  const handleDownload = () => {
    if (menuMedia) {
      const link = document.createElement('a');
      link.href = menuMedia.secure_url;
      link.download = menuMedia.original_filename || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Đang tải xuống...');
    }
    handleMenuClose();
  };

  const handleDeleteConfirm = async () => {
    if (!menuMedia) return;

    try {
      await mediaService.delete(menuMedia.id);
      setMedia(prev => prev.filter(item => item.id !== menuMedia.id));
      toast.success('Đã xóa media');
    } catch (error) {
      console.error('Error deleting media:', error);
      toast.error('Không thể xóa media');
    } finally {
      setDeleteDialogOpen(false);
      handleMenuClose();
    }
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'N/A';
    const mb = bytes / 1024 / 1024;
    return `${mb.toFixed(2)} MB`;
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString('vi-VN');
  };

  const getCategoryName = (categoryId: string): string => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.name || 'Unknown';
  };

  return (
    <Box>
      {/* Header & Filters */}
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h5">
            Thư viện Media ({filteredMedia.length})
          </Typography>
          <Button
            startIcon={<Refresh />}
            onClick={loadData}
            disabled={loading}
            variant="outlined"
          >
            Làm mới
          </Button>
        </Stack>

        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <TextField
            placeholder="Tìm kiếm..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 200 }}
          />

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Chủ đề</InputLabel>
            <Select
              value={currentCategory}
              label="Chủ đề"
              onChange={(e) => setCurrentCategory(e.target.value)}
            >
              <SelectItem value="all">Tất cả</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Loại</InputLabel>
            <Select
              value={currentType}
              label="Loại"
              onChange={(e) => setCurrentType(e.target.value as 'all' | 'image' | 'video')}
            >
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="image">Ảnh</SelectItem>
              <SelectItem value="video">Video</SelectItem>
            </Select>
          </FormControl>
        </Stack>
      </Box>

      {/* Content */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : filteredMedia.length === 0 ? (
        <Alert severity="info">
          Không tìm thấy media nào {searchQuery && `với từ khóa "${searchQuery}"`}
        </Alert>
      ) : (
        <>
          {/* Media Grid */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {paginatedMedia.map((mediaItem) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={mediaItem.id}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    transition: 'transform 0.2s, shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: 4
                    }
                  }}
                  onClick={() => handleMediaClick(mediaItem)}
                >
                  {/* Media Preview */}
                  <Box sx={{ position: 'relative', paddingTop: '75%' }}>
                    <Box
                      component="img"
                      src={mediaItem.type === 'video' ? mediaItem.thumbnail_url : mediaItem.secure_url}
                      alt={mediaItem.original_filename || 'Media'}
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />

                    {/* Type Icon */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 8,
                        left: 8,
                        bgcolor: 'rgba(0,0,0,0.7)',
                        borderRadius: 1,
                        p: 0.5
                      }}
                    >
                      {mediaItem.type === 'video' ? (
                        <VideoLibrary sx={{ color: 'white', fontSize: 16 }} />
                      ) : (
                        <Image sx={{ color: 'white', fontSize: 16 }} />
                      )}
                    </Box>

                    {/* Menu Button */}
                    <IconButton
                      sx={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        bgcolor: 'rgba(0,0,0,0.7)',
                        color: 'white',
                        '&:hover': {
                          bgcolor: 'rgba(0,0,0,0.9)'
                        }
                      }}
                      size="small"
                      onClick={(e) => handleMenuOpen(e, mediaItem)}
                    >
                      <MoreVert fontSize="small" />
                    </IconButton>
                  </Box>

                  {/* Media Info */}
                  <CardContent sx={{ p: 1 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 'bold',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        display: 'block'
                      }}
                    >
                      {mediaItem.original_filename || 'Unknown'}
                    </Typography>

                    <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }}>
                      <Chip
                        label={formatFileSize(mediaItem.bytes)}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.7rem', height: 20 }}
                      />
                      {mediaItem.width && mediaItem.height && (
                        <Chip
                          label={`${mediaItem.width}×${mediaItem.height}`}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.7rem', height: 20 }}
                        />
                      )}
                    </Stack>

                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                      {getCategoryName(mediaItem.categoryId)}
                    </Typography>
                    
                    <Typography variant="caption" color="text.secondary" display="block">
                      {formatDate(mediaItem.uploadDate)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(event, value) => setPage(value)}
                color="primary"
              />
            </Box>
          )}
        </>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => setPreviewDialogOpen(true)}>
          <ListItemIcon><Visibility fontSize="small" /></ListItemIcon>
          <ListItemText>Xem trước</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleCopyUrl}>
          <ListItemIcon><ContentCopy fontSize="small" /></ListItemIcon>
          <ListItemText>Copy URL</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDownload}>
          <ListItemIcon><Download fontSize="small" /></ListItemIcon>
          <ListItemText>Tải xuống</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => setDeleteDialogOpen(true)}>
          <ListItemIcon><Delete fontSize="small" /></ListItemIcon>
          <ListItemText>Xóa</ListItemText>
        </MenuItem>
      </Menu>

      {/* Preview Dialog */}
      <Dialog
        open={previewDialogOpen}
        onClose={() => setPreviewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedMedia?.original_filename || 'Media Preview'}
        </DialogTitle>
        <DialogContent>
          {selectedMedia && (
            selectedMedia.type === 'video' ? (
              <VideoPlayer media={selectedMedia} />
            ) : (
              <Box
                component="img"
                src={selectedMedia.secure_url}
                alt={selectedMedia.original_filename}
                sx={{ width: '100%', height: 'auto' }}
              />
            )
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialogOpen(false)}>
            Đóng
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Xác nhận xóa</DialogTitle>
        <DialogContent>
          <Typography>
            Bạn có chắc chắn muốn xóa file "{menuMedia?.original_filename}"?
            Hành động này không thể hoàn tác.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Hủy
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
          >
            Xóa
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
