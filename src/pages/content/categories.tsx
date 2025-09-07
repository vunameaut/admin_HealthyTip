import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
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
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Category,
  Tag,
} from '@mui/icons-material';
import LayoutWrapper from '@/components/LayoutWrapper';
import AuthGuard, { useCurrentUser } from '@/components/AuthGuard';
import { database } from '@/lib/firebase';
import { ref, get, set, remove } from 'firebase/database';
import toast from 'react-hot-toast';

interface Category {
  id: string;
  name: string;
  description: string;
  color: string;
  count: number;
  createdAt: number;
  updatedAt: number;
}

export default function CategoriesPage() {
  const { currentUser, loading: userLoading } = useCurrentUser();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#4CAF50',
  });

  useEffect(() => {
    if (currentUser && !userLoading) {
      loadCategories();
    }
  }, [currentUser, userLoading]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const categoriesRef = ref(database, 'categories');
      const snapshot = await get(categoriesRef);
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        const categoriesList = Object.entries(data).map(([id, category]: [string, any]) => ({
          id,
          ...category,
        }));
        setCategories(categoriesList);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error('Có lỗi khi tải danh mục');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        description: category.description,
        color: category.color,
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        description: '',
        color: '#4CAF50',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
      color: '#4CAF50',
    });
  };

  const handleSave = async () => {
    try {
      if (!formData.name.trim()) {
        toast.error('Vui lòng nhập tên danh mục');
        return;
      }

      const now = Date.now();
      const categoryData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        color: formData.color,
        updatedAt: now,
        ...(editingCategory ? {} : { createdAt: now, count: 0 }),
      };

      const categoryId = editingCategory?.id || `category_${now}`;
      const categoryRef = ref(database, `categories/${categoryId}`);
      
      await set(categoryRef, categoryData);
      
      toast.success(editingCategory ? 'Cập nhật danh mục thành công!' : 'Tạo danh mục thành công!');
      handleCloseDialog();
      loadCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error('Có lỗi khi lưu danh mục');
    }
  };

  const handleDelete = async (category: Category) => {
    if (confirm(`Bạn có chắc muốn xóa danh mục "${category.name}"?`)) {
      try {
        const categoryRef = ref(database, `categories/${category.id}`);
        await remove(categoryRef);
        toast.success('Xóa danh mục thành công!');
        loadCategories();
      } catch (error) {
        console.error('Error deleting category:', error);
        toast.error('Có lỗi khi xóa danh mục');
      }
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
              <Category sx={{ fontSize: 32, color: '#4CAF50' }} />
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#2E7D32' }}>
                  Quản lý Danh mục & Tags
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Tạo và quản lý danh mục cho nội dung sức khỏe
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
              Thêm Danh mục
            </Button>
          </Box>

          {/* Stats Cards */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Tổng danh mục
                  </Typography>
                  <Typography variant="h4" sx={{ color: '#4CAF50', fontWeight: 700 }}>
                    {categories.length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Đang sử dụng
                  </Typography>
                  <Typography variant="h4" sx={{ color: '#2196F3', fontWeight: 700 }}>
                    {categories.filter(c => c.count > 0).length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Chưa sử dụng
                  </Typography>
                  <Typography variant="h4" sx={{ color: '#FF9800', fontWeight: 700 }}>
                    {categories.filter(c => c.count === 0).length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Categories Table */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Tag />
                Danh sách danh mục
              </Typography>
              
              {loading ? (
                <LinearProgress />
              ) : (
                <TableContainer component={Paper} sx={{ mt: 2 }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Tên danh mục</TableCell>
                        <TableCell>Mô tả</TableCell>
                        <TableCell align="center">Màu sắc</TableCell>
                        <TableCell align="center">Số bài viết</TableCell>
                        <TableCell align="center">Ngày tạo</TableCell>
                        <TableCell align="center">Thao tác</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {categories.map((category) => (
                        <TableRow key={category.id}>
                          <TableCell>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                              {category.name}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {category.description || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              size="small"
                              sx={{
                                backgroundColor: category.color,
                                color: 'white',
                                fontWeight: 600
                              }}
                              label={category.color}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2">
                              {category.count || 0}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2">
                              {new Date(category.createdAt).toLocaleDateString('vi-VN')}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <IconButton 
                              size="small" 
                              onClick={() => handleOpenDialog(category)}
                              sx={{ color: '#4CAF50' }}
                            >
                              <Edit />
                            </IconButton>
                            <IconButton 
                              size="small" 
                              onClick={() => handleDelete(category)}
                              sx={{ color: '#f44336' }}
                            >
                              <Delete />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                      {categories.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} align="center">
                            <Typography variant="body2" color="text.secondary">
                              Chưa có danh mục nào
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
              {editingCategory ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
            </DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                <TextField
                  label="Tên danh mục"
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
                <TextField
                  label="Màu sắc"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  fullWidth
                />
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Hủy</Button>
              <Button onClick={handleSave} variant="contained">
                {editingCategory ? 'Cập nhật' : 'Tạo mới'}
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </LayoutWrapper>
    </AuthGuard>
  );
}
