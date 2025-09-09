import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Stack,
  Alert,
  LinearProgress,
  Switch,
  FormControlLabel,
  Paper,
  Divider,
} from '@mui/material';
import {
  Save,
  Cancel,
  Delete,
  Add,
  Remove,
  Article,
  Image,
  VideoLibrary,
} from '@mui/icons-material';
import LayoutWrapper from '../../../components/LayoutWrapper';
import AuthGuard, { useCurrentUser } from '../../../components/AuthGuard';
import { healthTipsService, categoriesService } from '../../../services/firebase';
import { HealthTip } from '../../../types';
import toast from 'react-hot-toast';

interface EditHealthTipPageProps {
  darkMode?: boolean;
  toggleDarkMode?: () => void;
}

export default function EditHealthTipPage({ darkMode, toggleDarkMode }: EditHealthTipPageProps) {
  const router = useRouter();
  const { id } = router.query;
  const { currentUser, loading: userLoading } = useCurrentUser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [healthTip, setHealthTip] = useState<HealthTip | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    summary: '',
    category: '',
    tags: [] as string[],
    imageUrl: '',
    videoUrl: '',
    author: '',
    isFeature: false,
    status: 'published' as 'draft' | 'published' | 'archived',
  });
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    if (currentUser && !userLoading && id) {
      loadHealthTip();
      loadCategories();
    }
  }, [currentUser, userLoading, id]);

  const loadHealthTip = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const data = await healthTipsService.getById(id as string);
      
      if (data) {
        setHealthTip(data);
        setFormData({
          title: data.title || '',
          content: data.content || '',
          summary: data.summary || '',
          category: data.category || '',
          tags: data.tags || [],
          imageUrl: data.imageUrl || '',
          videoUrl: data.videoUrl || '',
          author: data.author || '',
          isFeature: data.isFeature || false,
          status: data.status || 'published',
        });
      } else {
        toast.error('Không tìm thấy bài viết');
        router.push('/content');
      }
    } catch (error) {
      console.error('Error loading health tip:', error);
      toast.error('Có lỗi khi tải bài viết');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const categoriesList = await categoriesService.getAll();
      setCategories(categoriesList);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleSave = async () => {
    try {
      if (!formData.title.trim() || !formData.content.trim()) {
        toast.error('Vui lòng nhập đầy đủ tiêu đề và nội dung');
        return;
      }

      setSaving(true);
      const now = Date.now();
      const updatedData = {
        ...healthTip,
        ...formData,
        updatedAt: now,
        title: formData.title.trim(),
        content: formData.content.trim(),
        summary: formData.summary.trim(),
      };

      await healthTipsService.update(id as string, updatedData);
      
      toast.success('Cập nhật bài viết thành công!');
      router.push('/content');
    } catch (error) {
      console.error('Error updating health tip:', error);
      toast.error('Có lỗi khi cập nhật bài viết');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Bạn có chắc muốn xóa bài viết này?')) return;
    
    try {
      setSaving(true);
      await healthTipsService.delete(id as string);
      
      toast.success('Xóa bài viết thành công!');
      router.push('/content');
    } catch (error) {
      console.error('Error deleting health tip:', error);
      toast.error('Có lỗi khi xóa bài viết');
    } finally {
      setSaving(false);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  if (userLoading || !currentUser) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <LinearProgress sx={{ width: 200 }} />
      </Box>
    );
  }

  if (loading) {
    return (
      <AuthGuard>
        <LayoutWrapper darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
          <Box sx={{ p: 3 }}>
            <LinearProgress />
            <Typography sx={{ mt: 2, textAlign: 'center' }}>Đang tải dữ liệu...</Typography>
          </Box>
        </LayoutWrapper>
      </AuthGuard>
    );
  }

  if (!healthTip) {
    return (
      <AuthGuard>
        <LayoutWrapper darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
          <Box sx={{ p: 3 }}>
            <Alert severity="error">Không tìm thấy bài viết</Alert>
          </Box>
        </LayoutWrapper>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <LayoutWrapper darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
        <Box sx={{ flexGrow: 1, p: 3 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Article sx={{ fontSize: 32, color: '#4CAF50' }} />
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#2E7D32' }}>
                  Chỉnh sửa bài viết
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Cập nhật thông tin bài viết sức khỏe
                </Typography>
              </Box>
            </Box>
            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                startIcon={<Cancel />}
                onClick={() => router.push('/content')}
                disabled={saving}
              >
                Hủy
              </Button>
              <Button
                variant="contained"
                color="error"
                startIcon={<Delete />}
                onClick={handleDelete}
                disabled={saving}
              >
                Xóa
              </Button>
              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={handleSave}
                disabled={saving}
                sx={{
                  background: 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #388E3C 0%, #1B5E20 100%)',
                  }
                }}
              >
                {saving ? 'Đang lưu...' : 'Lưu'}
              </Button>
            </Stack>
          </Box>

          {/* Edit Form */}
          <Grid container spacing={3}>
            {/* Main Content */}
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Nội dung chính
                  </Typography>
                  
                  <Stack spacing={3}>
                    <TextField
                      label="Tiêu đề"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      fullWidth
                      required
                      variant="outlined"
                    />
                    
                    <TextField
                      label="Tóm tắt"
                      value={formData.summary}
                      onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
                      fullWidth
                      multiline
                      rows={2}
                      variant="outlined"
                    />
                    
                    <TextField
                      label="Nội dung"
                      value={formData.content}
                      onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                      fullWidth
                      multiline
                      rows={10}
                      required
                      variant="outlined"
                    />
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            {/* Sidebar */}
            <Grid item xs={12} md={4}>
              <Stack spacing={3}>
                {/* Status & Feature */}
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Trạng thái
                    </Typography>
                    
                    <Stack spacing={2}>
                      <FormControl fullWidth>
                        <InputLabel>Trạng thái xuất bản</InputLabel>
                        <Select
                          value={formData.status}
                          onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                          label="Trạng thái xuất bản"
                        >
                          <MenuItem value="draft">Bản nháp</MenuItem>
                          <MenuItem value="published">Đã xuất bản</MenuItem>
                          <MenuItem value="archived">Lưu trữ</MenuItem>
                        </Select>
                      </FormControl>
                      
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.isFeature}
                            onChange={(e) => setFormData(prev => ({ ...prev, isFeature: e.target.checked }))}
                          />
                        }
                        label="Bài viết nổi bật"
                      />
                    </Stack>
                  </CardContent>
                </Card>

                {/* Category */}
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Phân loại
                    </Typography>
                    
                    <Stack spacing={2}>
                      <FormControl fullWidth>
                        <InputLabel>Danh mục</InputLabel>
                        <Select
                          value={formData.category}
                          onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                          label="Danh mục"
                        >
                          <MenuItem value="">Chọn danh mục</MenuItem>
                          {categories.map((category) => (
                            <MenuItem key={category.id} value={category.name}>
                              {category.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      
                      <TextField
                        label="Tác giả"
                        value={formData.author}
                        onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                        fullWidth
                        variant="outlined"
                      />
                    </Stack>
                  </CardContent>
                </Card>

                {/* Tags */}
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Tags
                    </Typography>
                    
                    <Stack spacing={2}>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <TextField
                          label="Thêm tag"
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          size="small"
                          onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                        />
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={handleAddTag}
                          startIcon={<Add />}
                        >
                          Thêm
                        </Button>
                      </Box>
                      
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {formData.tags.map((tag, index) => (
                          <Chip
                            key={index}
                            label={tag}
                            onDelete={() => handleRemoveTag(tag)}
                            deleteIcon={<Remove />}
                            variant="outlined"
                            size="small"
                          />
                        ))}
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>

                {/* Media */}
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Media
                    </Typography>
                    
                    <Stack spacing={2}>
                      <TextField
                        label="URL hình ảnh"
                        value={formData.imageUrl}
                        onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                        fullWidth
                        variant="outlined"
                        InputProps={{
                          startAdornment: <Image sx={{ mr: 1, color: 'text.secondary' }} />,
                        }}
                      />
                      
                      <TextField
                        label="URL video"
                        value={formData.videoUrl}
                        onChange={(e) => setFormData(prev => ({ ...prev, videoUrl: e.target.value }))}
                        fullWidth
                        variant="outlined"
                        InputProps={{
                          startAdornment: <VideoLibrary sx={{ mr: 1, color: 'text.secondary' }} />,
                        }}
                      />
                    </Stack>
                  </CardContent>
                </Card>
              </Stack>
            </Grid>
          </Grid>
        </Box>
      </LayoutWrapper>
    </AuthGuard>
  );
}
