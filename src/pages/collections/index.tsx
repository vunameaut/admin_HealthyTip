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
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Checkbox,
  ListItemButton,
  Divider,
  Alert,
  LinearProgress
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Collections as CollectionsIcon,
  Article,
  Image,
  Visibility,
  DragIndicator
} from '@mui/icons-material';
import LayoutWrapper from '../../components/LayoutWrapper';
import AuthGuard from '../../components/AuthGuard';
import { healthTipsService, categoriesService } from '../../services/firebase';
import { HealthTip, Category } from '../../types';
import toast from 'react-hot-toast';
import { ref, push, set, get, update, remove } from 'firebase/database';
import { database } from '../../lib/firebase';

interface Collection {
  id: string;
  name: string;
  description: string;
  postIds: string[];
  categoryId?: string;
  imageUrl?: string;
  createdAt: number;
  updatedAt: number;
}

interface CollectionsPageProps {
  darkMode?: boolean;
  toggleDarkMode?: () => void;
}

export default function CollectionsPage({ darkMode, toggleDarkMode }: CollectionsPageProps) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [posts, setPosts] = useState<HealthTip[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryId: '',
    postIds: [] as string[],
    imageUrl: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [collectionsData, postsData, categoriesData] = await Promise.all([
        loadCollections(),
        healthTipsService.getAll(),
        categoriesService.getAll()
      ]);

      setCollections(collectionsData);
      setPosts(postsData.filter(p => p.status === 'published')); // Only published posts
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Có lỗi xảy ra khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const loadCollections = async (): Promise<Collection[]> => {
    try {
      const collectionsRef = ref(database, 'collections');
      const snapshot = await get(collectionsRef);

      if (!snapshot.exists()) return [];

      const collections: Collection[] = [];
      snapshot.forEach((child) => {
        collections.push({
          id: child.key!,
          ...child.val()
        });
      });

      return collections.sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
      console.error('Error loading collections:', error);
      return [];
    }
  };

  const handleOpenDialog = (collection?: Collection) => {
    if (collection) {
      setEditingCollection(collection);
      setFormData({
        name: collection.name,
        description: collection.description,
        categoryId: collection.categoryId || '',
        postIds: collection.postIds || [],
        imageUrl: collection.imageUrl || ''
      });
    } else {
      setEditingCollection(null);
      setFormData({
        name: '',
        description: '',
        categoryId: '',
        postIds: [],
        imageUrl: ''
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingCollection(null);
  };

  const handleSaveCollection = async () => {
    if (!formData.name.trim()) {
      toast.error('Vui lòng nhập tên collection');
      return;
    }

    if (formData.postIds.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 bài viết');
      return;
    }

    try {
      const now = Date.now();
      const collectionData = {
        name: formData.name,
        description: formData.description,
        categoryId: formData.categoryId,
        postIds: formData.postIds,
        imageUrl: formData.imageUrl || posts.find(p => p.id === formData.postIds[0])?.imageUrl || '',
        updatedAt: now
      };

      if (editingCollection) {
        // Update existing collection
        const collectionRef = ref(database, `collections/${editingCollection.id}`);
        await update(collectionRef, collectionData);
        toast.success('Đã cập nhật collection');
      } else {
        // Create new collection
        const collectionsRef = ref(database, 'collections');
        const newCollectionRef = push(collectionsRef);
        await set(newCollectionRef, {
          ...collectionData,
          createdAt: now
        });
        toast.success('Đã tạo collection mới');
      }

      handleCloseDialog();
      loadData();
    } catch (error) {
      console.error('Error saving collection:', error);
      toast.error('Có lỗi xảy ra khi lưu collection');
    }
  };

  const handleDeleteCollection = async (collectionId: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa collection này?')) {
      return;
    }

    try {
      const collectionRef = ref(database, `collections/${collectionId}`);
      await remove(collectionRef);
      toast.success('Đã xóa collection');
      loadData();
    } catch (error) {
      console.error('Error deleting collection:', error);
      toast.error('Có lỗi xảy ra khi xóa collection');
    }
  };

  const handleTogglePost = (postId: string) => {
    setFormData(prev => ({
      ...prev,
      postIds: prev.postIds.includes(postId)
        ? prev.postIds.filter(id => id !== postId)
        : [...prev.postIds, postId]
    }));
  };

  const getCategoryName = (categoryId?: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'No category';
  };

  const getPostTitle = (postId: string) => {
    const post = posts.find(p => p.id === postId);
    return post?.title || 'Unknown';
  };

  return (
    <AuthGuard>
      <LayoutWrapper darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
        <Box p={3}>
          {/* Header */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h4" component="h1" fontWeight="bold">
              Quản lý Collections
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenDialog()}
            >
              Tạo Collection
            </Button>
          </Box>

          {loading && <LinearProgress sx={{ mb: 2 }} />}

          {/* Stats */}
          <Grid container spacing={3} mb={3}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                      <CollectionsIcon />
                    </Avatar>
                    <Box>
                      <Typography color="text.secondary" variant="body2">
                        Tổng Collections
                      </Typography>
                      <Typography variant="h4" fontWeight="bold">
                        {collections.length}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar sx={{ bgcolor: 'success.main', width: 56, height: 56 }}>
                      <Article />
                    </Avatar>
                    <Box>
                      <Typography color="text.secondary" variant="body2">
                        Bài viết khả dụng
                      </Typography>
                      <Typography variant="h4" fontWeight="bold">
                        {posts.length}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar sx={{ bgcolor: 'warning.main', width: 56, height: 56 }}>
                      <Visibility />
                    </Avatar>
                    <Box>
                      <Typography color="text.secondary" variant="body2">
                        Trung bình mỗi collection
                      </Typography>
                      <Typography variant="h4" fontWeight="bold">
                        {collections.length > 0
                          ? Math.round(
                              collections.reduce((sum, c) => sum + c.postIds.length, 0) /
                                collections.length
                            )
                          : 0}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Collections List */}
          {collections.length === 0 ? (
            <Card>
              <CardContent>
                <Box textAlign="center" py={4}>
                  <CollectionsIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Chưa có collection nào
                  </Typography>
                  <Typography color="text.secondary" mb={2}>
                    Tạo collection để nhóm các bài viết theo chủ đề
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => handleOpenDialog()}
                  >
                    Tạo Collection Đầu Tiên
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ) : (
            <Grid container spacing={3}>
              {collections.map((collection) => (
                <Grid item xs={12} md={6} lg={4} key={collection.id}>
                  <Card>
                    {collection.imageUrl && (
                      <Box
                        component="img"
                        src={collection.imageUrl}
                        sx={{
                          width: '100%',
                          height: 200,
                          objectFit: 'cover'
                        }}
                      />
                    )}
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {collection.name}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 2, minHeight: 40 }}
                      >
                        {collection.description || 'Không có mô tả'}
                      </Typography>

                      <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
                        {collection.categoryId && (
                          <Chip
                            label={getCategoryName(collection.categoryId)}
                            size="small"
                            color="primary"
                          />
                        )}
                        <Chip
                          icon={<Article />}
                          label={`${collection.postIds.length} bài viết`}
                          size="small"
                        />
                      </Box>

                      <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                        Cập nhật: {new Date(collection.updatedAt).toLocaleDateString('vi-VN')}
                      </Typography>

                      <Box display="flex" gap={1}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<Edit />}
                          onClick={() => handleOpenDialog(collection)}
                          fullWidth
                        >
                          Sửa
                        </Button>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteCollection(collection.id)}
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}

          {/* Create/Edit Dialog */}
          <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
            <DialogTitle>
              {editingCollection ? 'Chỉnh sửa Collection' : 'Tạo Collection Mới'}
            </DialogTitle>
            <DialogContent>
              <Box sx={{ pt: 2 }}>
                <TextField
                  fullWidth
                  label="Tên Collection"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  sx={{ mb: 2 }}
                />

                <TextField
                  fullWidth
                  label="Mô tả"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  multiline
                  rows={2}
                  sx={{ mb: 2 }}
                />

                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Danh mục</InputLabel>
                  <Select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    label="Danh mục"
                  >
                    <MenuItem value="">Tất cả</MenuItem>
                    {categories.map((cat) => (
                      <MenuItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Typography variant="subtitle2" gutterBottom>
                  Chọn bài viết ({formData.postIds.length} đã chọn)
                </Typography>

                <List
                  sx={{
                    maxHeight: 300,
                    overflow: 'auto',
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1
                  }}
                >
                  {posts
                    .filter(
                      (post) =>
                        !formData.categoryId || post.categoryId === formData.categoryId
                    )
                    .map((post) => (
                      <ListItemButton
                        key={post.id}
                        onClick={() => handleTogglePost(post.id)}
                        dense
                      >
                        <Checkbox
                          edge="start"
                          checked={formData.postIds.includes(post.id)}
                          tabIndex={-1}
                          disableRipple
                        />
                        <ListItemAvatar>
                          <Avatar src={post.imageUrl} variant="rounded">
                            <Article />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={post.title}
                          secondary={getCategoryName(post.categoryId)}
                        />
                      </ListItemButton>
                    ))}
                </List>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Hủy</Button>
              <Button onClick={handleSaveCollection} variant="contained">
                {editingCollection ? 'Cập nhật' : 'Tạo'}
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </LayoutWrapper>
    </AuthGuard>
  );
}
