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
  IconButton
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
  ArrowUpward,
  ArrowDownward,
  TextFields
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
  
  // State for the form
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [blocks, setBlocks] = useState<Array<{ type: 'text' | 'image'; value: string; }>>([]);
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [author, setAuthor] = useState('');
  const [isFeature, setIsFeature] = useState(false);
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>('draft');
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
        setTitle(data.title || '');
        setExcerpt(data.excerpt || '');
        if (typeof data.content === 'string') {
          setBlocks([{ type: 'text', value: data.content }]);
        } else if (Array.isArray(data.content)) {
          const convertedBlocks = data.content.reduce((acc: Array<{ type: 'text' | 'image'; value: string }>, block: any) => {
            const value = block.value || block.content || '';
            if (block.type === 'text' || block.type === 'image') {
                acc.push({ type: block.type, value });
            } else if (block.type === 'heading' || block.type === 'quote') { // handle other text-based types
                acc.push({ type: 'text', value });
            }
            return acc;
          }, []);
          setBlocks(convertedBlocks);
        }
        setCategory(data.categoryId || '');
        setTags(data.tags || []);
        setImageUrl(data.imageUrl || '');
        // videoUrl is not in HealthTip interface, skip it
        setAuthor(data.author || '');
        setIsFeature(data.isFeature || false);
        setStatus((data.status as 'draft' | 'published' | 'archived') || 'published');
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
      if (!title.trim()) {
        toast.error('Vui lòng nhập đầy đủ tiêu đề');
        return;
      }

      setSaving(true);
      const now = Date.now();
      const updatedData = {
        ...healthTip,
        title: title.trim(),
        excerpt: excerpt.trim(),
        content: blocks,
        categoryId: category,
        tags,
        imageUrl,
        author,
        isFeature,
        status,
        updatedAt: now,
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
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleAddBlock = (type: 'text' | 'image') => {
    setBlocks([...blocks, { type, value: '' }]);
  };

  const handleRemoveBlock = (index: number) => {
    const newBlocks = [...blocks];
    newBlocks.splice(index, 1);
    setBlocks(newBlocks);
  };

  const handleMoveBlock = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === blocks.length - 1)
    ) {
      return;
    }
    const newBlocks = [...blocks];
    const block = newBlocks[index];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    newBlocks[index] = newBlocks[swapIndex];
    newBlocks[swapIndex] = block;
    setBlocks(newBlocks);
  };

  const handleBlockChange = (index: number, value: string) => {
    const newBlocks = [...blocks];
    newBlocks[index].value = value;
    setBlocks(newBlocks);
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
                  <Stack spacing={3}>
                    <TextField
                      label="Tiêu đề"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      fullWidth
                      required
                      variant="outlined"
                    />
                    
                    <TextField
                      label="Tóm tắt"
                      value={excerpt}
                      onChange={(e) => setExcerpt(e.target.value)}
                      fullWidth
                      multiline
                      rows={2}
                      variant="outlined"
                    />
                    
                    <Divider />

                    <Typography variant="h6">Nội dung</Typography>

                    {blocks.map((block, index) => (
                      <Paper key={index} variant="outlined" sx={{ p: 2 }}>
                        <Grid container spacing={1} alignItems="center">
                          <Grid item xs={10}>
                            {block.type === 'text' ? (
                              <TextField
                                label={`Khối văn bản #${index + 1}`}
                                value={block.value}
                                onChange={(e) => handleBlockChange(index, e.target.value)}
                                fullWidth
                                multiline
                                rows={4}
                              />
                            ) : (
                              <Stack spacing={1}>
                                <TextField
                                  label={`URL hình ảnh #${index + 1}`}
                                  value={block.value}
                                  onChange={(e) => handleBlockChange(index, e.target.value)}
                                  fullWidth
                                />
                                {block.value && <img src={block.value} alt={`Block ${index + 1}`} style={{ width: '100%', maxHeight: 200, objectFit: 'contain' }} />}
                              </Stack>
                            )}
                          </Grid>
                          <Grid item xs={2}>
                            <Stack>
                              <IconButton onClick={() => handleMoveBlock(index, 'up')} disabled={index === 0}>
                                <ArrowUpward />
                              </IconButton>
                              <IconButton onClick={() => handleMoveBlock(index, 'down')} disabled={index === blocks.length - 1}>
                                <ArrowDownward />
                              </IconButton>
                              <IconButton onClick={() => handleRemoveBlock(index)} color="error">
                                <Delete />
                              </IconButton>
                            </Stack>
                          </Grid>
                        </Grid>
                      </Paper>
                    ))}

                    <Stack direction="row" spacing={2}>
                      <Button onClick={() => handleAddBlock('text')} startIcon={<TextFields />}>Thêm văn bản</Button>
                      <Button onClick={() => handleAddBlock('image')} startIcon={<Image />}>Thêm hình ảnh</Button>
                    </Stack>

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
                          value={status}
                          onChange={(e) => setStatus(e.target.value as any)}
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
                            checked={isFeature}
                            onChange={(e) => setIsFeature(e.target.checked)}
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
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          label="Danh mục"
                        >
                          <MenuItem value="">Chọn danh mục</MenuItem>
                          {categories.map((cat) => (
                            <MenuItem key={cat.id} value={cat.name}>
                              {cat.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      
                      <TextField
                        label="Tác giả"
                        value={author}
                        onChange={(e) => setAuthor(e.target.value)}
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
                        {tags.map((tag, index) => (
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
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        fullWidth
                        variant="outlined"
                        InputProps={{
                          startAdornment: <Image sx={{ mr: 1, color: 'text.secondary' }} />,
                        }}
                      />
                      
                      <TextField
                        label="URL video"
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
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