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
  Image,
  Visibility
} from '@mui/icons-material';
import LayoutWrapper from '../../components/LayoutWrapper';
import AuthGuard, { useCurrentUser } from '../../components/AuthGuard';
import RichContentEditor, { ContentBlock } from '../../components/RichContentEditor';
import MediaUploadForm from '../../components/MediaUploadForm';
import ContentPreview from '../../components/ContentPreview';
import { healthTipsService, categoriesService } from '../../services/firebase';
import { HealthTip, Media } from '../../types';
import toast from 'react-hot-toast';
import notificationService from '../../services/notificationService';

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
  const [uploadedMedia, setUploadedMedia] = useState<Media[]>([]);
  const [showMediaUpload, setShowMediaUpload] = useState(false);
  const [sendNotification, setSendNotification] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

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
      
      // Clean content blocks and remove ALL undefined values completely
      const cleanedContent = content
        .filter(block => block.content && block.content.trim())
        .map(block => {
          const cleanBlock: any = {
            id: block.id,
            type: block.type,
            content: block.content.trim()
          };
          
          // Only add metadata if it exists and has valid values
          if (block.metadata) {
            const validMetadata: any = {};
            
            for (const [key, value] of Object.entries(block.metadata)) {
              if (value !== undefined && value !== null && value !== '') {
                validMetadata[key] = value;
              }
            }
            
            // Only add metadata if it has valid entries
            if (Object.keys(validMetadata).length > 0) {
              cleanBlock.metadata = validMetadata;
            }
          }
          
          return cleanBlock;
        });

      // Debug: Log the cleaned content to check for undefined values
      console.log('Cleaned Content:', JSON.stringify(cleanedContent, null, 2));
      
      const newHealthTip: any = {
        title: title.trim(),
        content: cleanedContent,
        categoryId: category,
        tags,
        status,
        author: currentUser?.displayName || 'Admin',
        createdAt: now,
        updatedAt: now,
        viewCount: 0,
        likeCount: 0,
        isFeature,
      };

      // Only add publishedAt if status is published
      if (status === 'published') {
        newHealthTip.publishedAt = now;
      }

      const newTipId = await healthTipsService.create(newHealthTip as Omit<HealthTip, 'id'>);

      toast.success('Tạo bài viết thành công!');

      // Gửi thông báo nếu đã xuất bản và được chọn
      if (status === 'published' && sendNotification) {
        try {
          const result = await notificationService.sendNewHealthTip({
            healthTipId: newTipId,
          });

          if (result.success) {
            toast.success(`Đã gửi thông báo đến ${result.sentCount || 0} người dùng!`);
          }
        } catch (error) {
          console.error('Error sending notification:', error);
          toast.error('Bài viết đã được tạo nhưng gửi thông báo thất bại');
        }
      }

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

  const handleRemoveUploadedMedia = (mediaId: string) => {
    setUploadedMedia(prev => prev.filter(media => media.id !== mediaId));
    
    // Also remove from content if it was inserted
    setContent(prev => prev.filter(block => 
      !(block.type === 'image' && block.content.includes(mediaId))
    ));
    
    toast.success('Đã xóa media');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleMediaUploadComplete = (media: Media[]) => {
    setUploadedMedia(prev => [...prev, ...media]);
    toast.success(`Đã upload ${media.length} file thành công!`);
    
    // Auto insert images into content
    const imageBlocks: ContentBlock[] = media
      .filter(m => m.type === 'image')
      .map(m => ({
        id: `media_${m.id}_${Date.now()}`,
        type: 'image' as const,
        content: m.secure_url,
        metadata: {
          alt: m.original_filename || 'Uploaded image',
          caption: ''
        }
      }));
    
    if (imageBlocks.length > 0) {
      setContent(prev => [...prev, ...imageBlocks]);
    }
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
                variant="outlined"
                startIcon={<Visibility />}
                onClick={() => setPreviewOpen(true)}
                disabled={saving}
              >
                Xem trước
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
                    <FormControlLabel
                      control={
                        <Switch
                          checked={sendNotification}
                          onChange={(e) => setSendNotification(e.target.checked)}
                          disabled={status !== 'published'}
                        />
                      }
                      label="Gửi thông báo đến người dùng"
                    />
                    {status !== 'published' && sendNotification && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        * Chỉ gửi thông báo khi bài viết được xuất bản
                      </Typography>
                    )}
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
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">Media</Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => setShowMediaUpload(!showMediaUpload)}
                        startIcon={<Image />}
                      >
                        {showMediaUpload ? 'Ẩn Upload' : 'Upload Media'}
                      </Button>
                    </Box>
                    
                    {showMediaUpload && (
                      <Box sx={{ mb: 2 }}>
                        <MediaUploadForm
                          onUploadComplete={handleMediaUploadComplete}
                          allowMultiple={true}
                        />
                      </Box>
                    )}
                    
                    {uploadedMedia.length > 0 && (
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          Media đã upload ({uploadedMedia.length})
                        </Typography>
                        <Stack spacing={1}>
                          {uploadedMedia.slice(-5).map((media) => (
                            <Paper key={media.id} sx={{ p: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box 
                                component="img" 
                                src={media.thumbnail_url} 
                                alt={media.original_filename}
                                sx={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 1 }}
                              />
                              <Typography variant="caption" sx={{ flex: 1, fontSize: '0.75rem' }}>
                                {media.original_filename}
                              </Typography>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleRemoveUploadedMedia(media.id)}
                                sx={{ ml: 'auto' }}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </Paper>
                          ))}
                        </Stack>
                      </Box>
                    )}
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

          {/* Preview Dialog */}
          <ContentPreview
            open={previewOpen}
            onClose={() => setPreviewOpen(false)}
            title={title}
            content={content}
            category={categories.find(c => c.id === category)?.name}
            tags={tags}
            author={currentUser?.displayName || 'Admin'}
            isFeature={isFeature}
            status={status}
          />
        </Box>
      </LayoutWrapper>
    </AuthGuard>
  );
}
