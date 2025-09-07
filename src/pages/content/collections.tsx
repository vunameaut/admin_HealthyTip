import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Alert,
  LinearProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Collections,
  Article,
  VideoLibrary,
} from '@mui/icons-material';
import LayoutWrapper from '@/components/LayoutWrapper';
import AuthGuard, { useCurrentUser } from '@/components/AuthGuard';
import { database } from '@/lib/firebase';
import { ref, get, set, remove } from 'firebase/database';
import toast from 'react-hot-toast';

interface Collection {
  id: string;
  name: string;
  description: string;
  type: 'health-tips' | 'videos' | 'mixed';
  items: string[];
  featured: boolean;
  createdAt: number;
  updatedAt: number;
}

export default function CollectionsPage() {
  const { currentUser, loading: userLoading } = useCurrentUser();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'health-tips' as 'health-tips' | 'videos' | 'mixed',
    featured: false,
  });

  useEffect(() => {
    if (currentUser && !userLoading) {
      loadCollections();
    }
  }, [currentUser, userLoading]);

  const loadCollections = async () => {
    try {
      setLoading(true);
      const collectionsRef = ref(database, 'collections');
      const snapshot = await get(collectionsRef);
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        const collectionsList = Object.entries(data).map(([id, collection]: [string, any]) => ({
          id,
          ...collection,
        }));
        setCollections(collectionsList);
      }
    } catch (error) {
      console.error('Error loading collections:', error);
      toast.error('Có lỗi khi tải bộ sưu tập');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (collection?: Collection) => {
    if (collection) {
      setEditingCollection(collection);
      setFormData({
        name: collection.name,
        description: collection.description,
        type: collection.type,
        featured: collection.featured,
      });
    } else {
      setEditingCollection(null);
      setFormData({
        name: '',
        description: '',
        type: 'health-tips',
        featured: false,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingCollection(null);
    setFormData({
      name: '',
      description: '',
      type: 'health-tips',
      featured: false,
    });
  };

  const handleSave = async () => {
    try {
      if (!formData.name.trim()) {
        toast.error('Vui lòng nhập tên bộ sưu tập');
        return;
      }

      const now = Date.now();
      const collectionData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        type: formData.type,
        featured: formData.featured,
        updatedAt: now,
        ...(editingCollection ? {} : { createdAt: now, items: [] }),
      };

      const collectionId = editingCollection?.id || `collection_${now}`;
      const collectionRef = ref(database, `collections/${collectionId}`);
      
      await set(collectionRef, collectionData);
      
      toast.success(editingCollection ? 'Cập nhật bộ sưu tập thành công!' : 'Tạo bộ sưu tập thành công!');
      handleCloseDialog();
      loadCollections();
    } catch (error) {
      console.error('Error saving collection:', error);
      toast.error('Có lỗi khi lưu bộ sưu tập');
    }
  };

  const handleDelete = async (collection: Collection) => {
    if (confirm(`Bạn có chắc muốn xóa bộ sưu tập "${collection.name}"?`)) {
      try {
        const collectionRef = ref(database, `collections/${collection.id}`);
        await remove(collectionRef);
        toast.success('Xóa bộ sưu tập thành công!');
        loadCollections();
      } catch (error) {
        console.error('Error deleting collection:', error);
        toast.error('Có lỗi khi xóa bộ sưu tập');
      }
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'health-tips': return <Article />;
      case 'videos': return <VideoLibrary />;
      case 'mixed': return <Collections />;
      default: return <Collections />;
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'health-tips': return 'Bài viết';
      case 'videos': return 'Video';
      case 'mixed': return 'Hỗn hợp';
      default: return 'Không xác định';
    }
  };

  if (userLoading || !currentUser) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <LinearProgress sx={{ width: 200 }} />
      </Box>
    );
  }

  return (
    <AuthGuard>
      <LayoutWrapper>
        <Box sx={{ flexGrow: 1, p: 3 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Collections sx={{ fontSize: 32, color: '#4CAF50' }} />
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#2E7D32' }}>
                  Quản lý Bộ sưu tập
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Tạo và quản lý bộ sưu tập nội dung
                </Typography>
              </Box>
            </Box>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenDialog()}
              sx={{
                background: 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #388E3C 0%, #1B5E20 100%)',
                }
              }}
            >
              Thêm Bộ sưu tập
            </Button>
          </Box>

          {/* Stats Cards */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Tổng bộ sưu tập
                  </Typography>
                  <Typography variant="h4" sx={{ color: '#4CAF50', fontWeight: 700 }}>
                    {collections.length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Nổi bật
                  </Typography>
                  <Typography variant="h4" sx={{ color: '#2196F3', fontWeight: 700 }}>
                    {collections.filter(c => c.featured).length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Tổng nội dung
                  </Typography>
                  <Typography variant="h4" sx={{ color: '#FF9800', fontWeight: 700 }}>
                    {collections.reduce((sum, c) => sum + (c.items?.length || 0), 0)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Collections Table */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Collections />
                Danh sách bộ sưu tập
              </Typography>
              
              {loading ? (
                <LinearProgress />
              ) : (
                <TableContainer component={Paper} sx={{ mt: 2 }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Tên bộ sưu tập</TableCell>
                        <TableCell>Mô tả</TableCell>
                        <TableCell align="center">Loại</TableCell>
                        <TableCell align="center">Số nội dung</TableCell>
                        <TableCell align="center">Nổi bật</TableCell>
                        <TableCell align="center">Ngày tạo</TableCell>
                        <TableCell align="center">Thao tác</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {collections.map((collection) => (
                        <TableRow key={collection.id}>
                          <TableCell>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                              {collection.name}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {collection.description || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              size="small"
                              icon={getTypeIcon(collection.type)}
                              label={getTypeName(collection.type)}
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2">
                              {collection.items?.length || 0}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            {collection.featured ? (
                              <Chip size="small" label="Nổi bật" color="primary" />
                            ) : (
                              <Chip size="small" label="Thường" variant="outlined" />
                            )}
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2">
                              {new Date(collection.createdAt).toLocaleDateString('vi-VN')}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <IconButton 
                              size="small" 
                              onClick={() => handleOpenDialog(collection)}
                              sx={{ color: '#4CAF50' }}
                            >
                              <Edit />
                            </IconButton>
                            <IconButton 
                              size="small" 
                              onClick={() => handleDelete(collection)}
                              sx={{ color: '#f44336' }}
                            >
                              <Delete />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                      {collections.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} align="center">
                            <Typography variant="body2" color="text.secondary">
                              Chưa có bộ sưu tập nào
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>

          {/* Add/Edit Dialog */}
          <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
            <DialogTitle>
              {editingCollection ? 'Chỉnh sửa bộ sưu tập' : 'Thêm bộ sưu tập mới'}
            </DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                <TextField
                  label="Tên bộ sưu tập"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  fullWidth
                  required
                />
                <TextField
                  label="Mô tả"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  fullWidth
                  multiline
                  rows={3}
                />
                <FormControl fullWidth>
                  <InputLabel>Loại nội dung</InputLabel>
                  <Select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    label="Loại nội dung"
                  >
                    <MenuItem value="health-tips">Bài viết</MenuItem>
                    <MenuItem value="videos">Video</MenuItem>
                    <MenuItem value="mixed">Hỗn hợp</MenuItem>
                  </Select>
                </FormControl>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="body2">Đánh dấu nổi bật:</Typography>
                  <Button
                    variant={formData.featured ? "contained" : "outlined"}
                    onClick={() => setFormData({ ...formData, featured: !formData.featured })}
                    size="small"
                  >
                    {formData.featured ? 'Nổi bật' : 'Thường'}
                  </Button>
                </Box>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Hủy</Button>
              <Button onClick={handleSave} variant="contained">
                {editingCollection ? 'Cập nhật' : 'Tạo mới'}
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </LayoutWrapper>
    </AuthGuard>
  );
}
