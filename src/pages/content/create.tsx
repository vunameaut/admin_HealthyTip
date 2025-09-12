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
  Paper,
  IconButton,
  Divider,
  FormControlLabel,
  Switch
} from '@mui/material';
import {
  Save,
  Cancel,
  Add,
  Delete,
  ArrowUpward,
  ArrowDownward,
  TextFields,
  Image
} from '@mui/icons-material';
import LayoutWrapper from '../../components/LayoutWrapper';
import AuthGuard, { useCurrentUser } from '../../components/AuthGuard';
import RichContentEditor, { ContentBlock } from '../../components/RichContentEditor';
import { healthTipsService, categoriesService } from '../../services/firebase';
import { HealthTip } from '../../types';
import toast from 'react-hot-toast';

interface CreateHealthTipPageProps {
  darkMode?: boolean;
  toggleDarkMode?: () => void;
}

export default function CreateHealthTipPage({ darkMode, toggleDarkMode }: CreateHealthTipPageProps) {
  const router = useRouter();
  const { currentUser } = useCurrentUser();
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState<ContentBlock[]>([
    { id: 'initial', type: 'text', content: '' }
  ]);
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>('draft');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [isFeature, setIsFeature] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const categoriesList = await categoriesService.getAll();
      setCategories(categoriesList);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Vui lòng nhập tiêu đề');
      return;
    }

    if (!category) {
      toast.error('Vui lòng chọn danh mục');
      return;
    }

    if (content.length === 0 || content.every(block => !block.content.trim())) {
      toast.error('Vui lòng thêm nội dung cho bài viết');
      return;
    }

    try {
      setSaving(true);
      const now = Date.now();
      
      const newHealthTip = {
        title: title.trim(),
        content: content.filter(block => block.content.trim()), // Only save non-empty blocks
        categoryId: category,
        tags,
        status,
        author: currentUser?.displayName || 'Admin',
        createdAt: now,
        updatedAt: now,
        publishedAt: status === 'published' ? now : undefined,
        viewCount: 0,
        likeCount: 0,
        isFeature,
      };

      await healthTipsService.create(newHealthTip as Omit<HealthTip, 'id'>);
      
      toast.success('Tạo bài viết thành công!');
      router.push('/content');
    } catch (error) {
      console.error('Error creating health tip:', error);
      toast.error('Có lỗi khi tạo bài viết');
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

  return (
    <AuthGuard>
      <LayoutWrapper darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
        <Box sx={{ flexGrow: 1, p: 3 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              Tạo bài viết mới
            </Typography>
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
                startIcon={<Save />}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Đang lưu...' : 'Lưu bài viết'}
              </Button>
            </Stack>
          </Box>

          {/* Edit Form */}
          <Grid container spacing={3}>
            {/* Main Content */}
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <RichContentEditor
                    title={title}
                    content={content}
                    onTitleChange={setTitle}
                    onContentChange={setContent}
                  />
                </CardContent>
              </Card>
            </Grid>

            {/* Sidebar */}
            <Grid item xs={12} md={4}>
              <Stack spacing={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Trạng thái</Typography>
                    <FormControl fullWidth sx={{ mb: 2 }}>
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
                  </CardContent>
                </Card>

                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Phân loại</Typography>
                    <FormControl fullWidth>
                      <InputLabel>Danh mục</InputLabel>
                      <Select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        label="Danh mục"
                      >
                        <MenuItem value="">Chọn danh mục</MenuItem>
                        {categories.map((cat) => (
                          <MenuItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Tags</Typography>
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
                            variant="outlined"
                            size="small"
                          />
                        ))}
                      </Box>
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
