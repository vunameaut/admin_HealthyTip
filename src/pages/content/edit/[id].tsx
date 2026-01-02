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
  TextFields,
  FormatQuote,
  Visibility
} from '@mui/icons-material';
import LayoutWrapper from '../../../components/LayoutWrapper';
import AuthGuard, { useCurrentUser } from '../../../components/AuthGuard';
import ContentPreview from '../../../components/ContentPreview';
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
  const [blocks, setBlocks] = useState<Array<{ 
    type: 'text' | 'image' | 'heading' | 'quote'; 
    value: string; 
    metadata?: {
      level?: 1 | 2 | 3 | 4 | 5 | 6;
      style?: string;
      caption?: string;
      alt?: string;
      author?: string;
      source?: string;
    }
  }>>([]);
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState('');
const [videoUrl, setVideoUrl] = useState('');
  const [author, setAuthor] = useState('');
  const [isFeature, setIsFeature] = useState(false);
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>('draft');
  const [newTag, setNewTag] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    if (currentUser && !userLoading && id) {
      loadHealthTip();
      loadCategories();
    }
  }, [currentUser, userLoading, id]);
  
  // Xử lý khi quay trở lại từ media library
  useEffect(() => {
    // Kiểm tra xem có URL ảnh được chọn từ media library không
    const selectedImageUrl = sessionStorage.getItem('selectedImageUrl');
    if (selectedImageUrl) {
      // Kiểm tra xem đang chỉnh sửa block hay ảnh đại diện
      const editingBlockIndex = sessionStorage.getItem('editingImageBlock');
      
      if (editingBlockIndex !== null) {
        // Cập nhật block ảnh
        const index = parseInt(editingBlockIndex);
        if (!isNaN(index) && index >= 0 && index < blocks.length) {
          handleBlockChange(index, 'value', selectedImageUrl);
        }
        sessionStorage.removeItem('editingImageBlock');
      } else {
        // Cập nhật ảnh đại diện
        setImageUrl(selectedImageUrl);
      }
      
      // Xóa thông tin đã lưu
      sessionStorage.removeItem('selectedImageUrl');
    }
  }, [router.asPath, blocks]);

  const loadHealthTip = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const data = await healthTipsService.getById(id as string);
      
      // Debug thông tin
      console.log('Health Tip data loaded:', data);
      console.log('contentBlocks:', data?.contentBlocks);
      console.log('content:', data?.content);
      
      if (data) {
        setHealthTip(data);
        setTitle(data.title || '');
        setExcerpt(data.excerpt || '');
        // Kiểm tra contentBlocks (định dạng mới)
        console.log('Checking contentBlocks', data.contentBlocks);
        if (Array.isArray(data.contentBlocks)) {
          console.log('Using contentBlocks');
          const convertedBlocks = data.contentBlocks.map((block: any) => {
            const value = block.value || block.content || '';
            let type = block.type;
            // Ensure type is one of the supported types
            if (!['text', 'image', 'heading', 'quote'].includes(type)) {
              type = 'text'; // Default to text for unsupported types
            }
            
            // Ensure metadata is never undefined
            let metadata = {};
            if (block.metadata) {
              if (type === 'image') {
                metadata = {
                  alt: block.metadata.alt || '',
                  caption: block.metadata.caption || ''
                };
              } else if (type === 'heading') {
                metadata = {
                  level: block.metadata.level || 2 as 1 | 2 | 3 | 4 | 5 | 6,
                  style: block.metadata.style || 'bold'
                };
              } else if (type === 'quote') {
                metadata = {
                  author: block.metadata.author || '',
                  source: block.metadata.source || ''
                };
              }
            } else {
              // Set default metadata based on type
              if (type === 'image') {
                metadata = { alt: '', caption: '' };
              } else if (type === 'heading') {
                metadata = { level: 2 as 1 | 2 | 3 | 4 | 5 | 6, style: 'bold' };
              } else if (type === 'quote') {
                metadata = { author: '', source: '' };
              }
            }
            
            return { 
              type: type as 'text' | 'image' | 'heading' | 'quote', 
              value, 
              metadata 
            };
          });
          console.log('Converted blocks from contentBlocks:', convertedBlocks);
          setBlocks(convertedBlocks);
        }
        // Kiểm tra content (định dạng cũ)
        else if (typeof data.content === 'string') {
          console.log('Using content as string');
          setBlocks([{ type: 'text', value: data.content }]);
        } else if (Array.isArray(data.content)) {
          console.log('Using content as array');
          // Format cũ có thể có content property thay vì value
          const convertedBlocks = data.content.map((block: any) => {
            const value = block.value || block.content || '';
            let type = block.type;
            // Ensure type is one of the supported types
            if (!['text', 'image', 'heading', 'quote'].includes(type)) {
              type = 'text'; // Default to text for unsupported types
            }
            
            // Ensure metadata is never undefined
            let metadata = {};
            if (block.metadata) {
              if (type === 'image') {
                metadata = {
                  alt: block.metadata.alt || '',
                  caption: block.metadata.caption || ''
                };
              } else if (type === 'heading') {
                metadata = {
                  level: block.metadata.level || 2 as 1 | 2 | 3 | 4 | 5 | 6,
                  style: block.metadata.style || 'bold'
                };
              } else if (type === 'quote') {
                metadata = {
                  author: block.metadata.author || '',
                  source: block.metadata.source || ''
                };
              }
            } else {
              // Set default metadata based on type
              if (type === 'image') {
                metadata = { alt: '', caption: '' };
              } else if (type === 'heading') {
                metadata = { level: 2 as 1 | 2 | 3 | 4 | 5 | 6, style: 'bold' };
              } else if (type === 'quote') {
                metadata = { author: '', source: '' };
              }
            }
            
            return { 
              type: type as 'text' | 'image' | 'heading' | 'quote', 
              value, 
              metadata 
            };
          });
          console.log('Converted blocks from content:', convertedBlocks);
          setBlocks(convertedBlocks);
        } else {
          console.warn('No content or contentBlocks found!', data);
          // Set default empty text block if no content exists
          setBlocks([{ type: 'text', value: '', metadata: {} }]);
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
      console.log('Loaded categories:', categoriesList);
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

      if (!category) {
        toast.error('Vui lòng chọn danh mục');
        return;
      }

      if (blocks.length === 0) {
        toast.error('Vui lòng thêm nội dung cho bài viết');
        return;
      }

      setSaving(true);
      const now = Date.now();
      
      // Convert blocks to ContentBlock format with id
      const contentBlocks = blocks.map((block, index) => {
        // Ensure metadata is never undefined
        let metadata = {};
        
        if (block.type === 'image') {
          metadata = {
            alt: block.metadata?.alt || '',
            caption: block.metadata?.caption || ''
          };
        } else if (block.type === 'heading') {
          metadata = {
            level: block.metadata?.level || 2 as 1 | 2 | 3 | 4 | 5 | 6,
            style: block.metadata?.style || 'bold'
          };
        } else if (block.type === 'quote') {
          metadata = {
            author: block.metadata?.author || '',
            source: block.metadata?.source || ''
          };
        }
        
        return {
          id: `block_${index}_${now}`,
          type: block.type,
          value: block.value || '',
          metadata
        };
      });
      
      // Create clean update data without potential conflicting fields
      const updatedData = {
        title: title.trim(),
        excerpt: excerpt.trim(),
        contentBlocks: contentBlocks, // Use new field contentBlocks
        content: contentBlocks, // Keep content for backward compatibility
        categoryId: category,
        tags: tags || [],
        imageUrl: imageUrl || '',
        author: author || '',
        isFeature: isFeature || false,
        status: status || 'draft',
        updatedAt: now,
        // Keep original creation data if exists
        createdAt: healthTip?.createdAt || now,
        viewCount: healthTip?.viewCount || 0,
        likeCount: healthTip?.likeCount || 0,
      };

      console.log('Updating with data:', updatedData);
      console.log('ID:', id);
      
      await healthTipsService.update(id as string, updatedData);
      
      toast.success('Cập nhật bài viết thành công!');
      router.push('/content');
    } catch (error) {
      console.error('Error updating health tip:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        errorObject: error
      });
      
      let errorMessage = 'Có lỗi khi cập nhật bài viết';
      if (error instanceof Error) {
        errorMessage += `: ${error.message}`;
      }
      
      toast.error(errorMessage);
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

  const handleAddBlock = (type: 'text' | 'image' | 'heading' | 'quote') => {
    let metadata = {};
    
    if (type === 'image') {
      metadata = { alt: '', caption: '' };
    } else if (type === 'heading') {
      metadata = { level: 2 as 1 | 2 | 3 | 4 | 5 | 6, style: 'bold' };
    } else if (type === 'quote') {
      metadata = { author: '', source: '' };
    }
    
    const newBlock = { 
      type, 
      value: '', 
      metadata
    };
    setBlocks([...blocks, newBlock]);
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

  const handleBlockChange = (index: number, field: string, value: any) => {
    const newBlocks = [...blocks];
    
    if (field === 'value') {
      newBlocks[index].value = value || '';
    } else {
      // Handle metadata fields - ensure metadata exists
      if (!newBlocks[index].metadata) {
        newBlocks[index].metadata = {};
      }
      
      // Type-safe handling for level field
      if (field === 'level') {
        const levelValue = Number(value);
        if (levelValue >= 1 && levelValue <= 6) {
          newBlocks[index].metadata.level = levelValue as 1 | 2 | 3 | 4 | 5 | 6;
        }
      } else {
        // Ensure we don't set undefined values
        const cleanValue = value === undefined || value === null ? '' : value;
        // Type-safe metadata assignment
        if (field === 'alt' || field === 'caption' || field === 'author' || field === 'source' || field === 'style') {
          (newBlocks[index].metadata as any)[field] = cleanValue;
        }
      }
    }
    
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
                variant="outlined"
                startIcon={<Visibility />}
                onClick={() => setPreviewOpen(true)}
                disabled={saving}
              >
                Xem trước
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
                            {block.type === 'text' && (
                              <TextField
                                label={`Khối văn bản #${index + 1}`}
                                value={block.value}
                                onChange={(e) => handleBlockChange(index, 'value', e.target.value)}
                                fullWidth
                                multiline
                                rows={4}
                              />
                            )}
                            
                            {block.type === 'image' && (
                              <Stack spacing={1}>
                                <Stack direction="row" spacing={1}>
                                  <TextField
                                    label={`URL hình ảnh #${index + 1}`}
                                    value={block.value}
                                    onChange={(e) => handleBlockChange(index, 'value', e.target.value)}
                                    fullWidth
                                    sx={{
                                      '& .MuiInputBase-root': {
                                        bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                                      },
                                      '& .MuiOutlinedInput-notchedOutline': {
                                        borderColor: 'divider'
                                      }
                                    }}
                                  />
                                  <Button 
                                    variant="outlined" 
                                    onClick={() => {
                                      // Lưu vị trí block đang được chỉnh sửa vào sessionStorage
                                      sessionStorage.setItem('editingImageBlock', index.toString());
                                      router.push('/media?returnTo=' + encodeURIComponent(`/content/edit/${id}`));
                                    }}
                                    sx={{ whiteSpace: 'nowrap' }}
                                  >
                                    Chọn ảnh
                                  </Button>
                                </Stack>
                                <TextField
                                  label="Alt text"
                                  value={block.metadata?.alt || ''}
                                  onChange={(e) => handleBlockChange(index, 'alt', e.target.value)}
                                  fullWidth
                                  size="small"
                                  sx={{
                                    '& .MuiInputBase-root': {
                                      bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                                    },
                                    '& .MuiOutlinedInput-notchedOutline': {
                                      borderColor: 'divider'
                                    }
                                  }}
                                />
                                <TextField
                                  label="Caption"
                                  value={block.metadata?.caption || ''}
                                  onChange={(e) => handleBlockChange(index, 'caption', e.target.value)}
                                  fullWidth
                                  size="small"
                                  sx={{
                                    '& .MuiInputBase-root': {
                                      bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                                    },
                                    '& .MuiOutlinedInput-notchedOutline': {
                                      borderColor: 'divider'
                                    }
                                  }}
                                />
                                {block.value && (
                                  <Paper 
                                    elevation={0} 
                                    variant="outlined" 
                                    sx={{ 
                                      p: 1, 
                                      borderColor: 'divider',
                                      bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#f8f8f8' 
                                    }}
                                  >
                                    <img 
                                      src={block.value} 
                                      alt={block.metadata?.alt || `Block ${index + 1}`} 
                                      style={{ width: '100%', maxHeight: 200, objectFit: 'contain' }} 
                                    />
                                    {block.metadata?.caption && (
                                      <Typography 
                                        variant="caption" 
                                        sx={{ 
                                          display: 'block', 
                                          textAlign: 'center', 
                                          mt: 0.5,
                                          color: 'text.secondary'
                                        }}
                                      >
                                        {block.metadata.caption}
                                      </Typography>
                                    )}
                                  </Paper>
                                )}
                              </Stack>
                            )}
                            
                            {block.type === 'heading' && (
                              <Stack spacing={1}>
                                <TextField
                                  label={`Tiêu đề #${index + 1}`}
                                  value={block.value}
                                  onChange={(e) => handleBlockChange(index, 'value', e.target.value)}
                                  fullWidth
                                />
                                <FormControl size="small" fullWidth>
                                  <InputLabel>Cấp độ</InputLabel>
                                  <Select
                                    value={block.metadata?.level || 2}
                                    onChange={(e) => handleBlockChange(index, 'level', Number(e.target.value))}
                                    label="Cấp độ"
                                  >
                                    {[1, 2, 3, 4, 5, 6].map(level => (
                                      <MenuItem key={level} value={level}>H{level}</MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                              </Stack>
                            )}
                            
                            {block.type === 'quote' && (
                              <Stack spacing={1}>
                                <Paper elevation={1} sx={{ 
                                  p: 2, 
                                  border: '1px solid',
                                  borderColor: 'divider',
                                  bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)'
                                }}>
                                  <TextField
                                    label={`Nội dung trích dẫn #${index + 1}`}
                                    value={block.value}
                                    onChange={(e) => handleBlockChange(index, 'value', e.target.value)}
                                    fullWidth
                                    multiline
                                    rows={3}
                                    variant="outlined"
                                    sx={{
                                      mb: 2,
                                      '& .MuiInputBase-input': {
                                        color: 'text.primary'
                                      },
                                      '& .MuiOutlinedInput-root': {
                                        bgcolor: (theme) => theme.palette.mode === 'dark' ? theme.palette.background.paper : '#ffffff'
                                      },
                                      '& .MuiFormLabel-root': {
                                        color: 'text.secondary'
                                      }
                                    }}
                                  />
                                  
                                  <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                      <TextField
                                        label="Tác giả"
                                        value={block.metadata?.author || ''}
                                        onChange={(e) => handleBlockChange(index, 'author', e.target.value)}
                                        fullWidth
                                        size="small"
                                        variant="outlined"
                                        sx={{
                                          '& .MuiOutlinedInput-root': {
                                            bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.2)' : '#ffffff'
                                          }
                                        }}
                                      />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                      <TextField
                                        label="Nguồn"
                                        value={block.metadata?.source || ''}
                                        onChange={(e) => handleBlockChange(index, 'source', e.target.value)}
                                        fullWidth
                                        size="small"
                                        variant="outlined"
                                        sx={{
                                          '& .MuiOutlinedInput-root': {
                                            bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.2)' : '#ffffff'
                                          }
                                        }}
                                      />
                                    </Grid>
                                  </Grid>
                                </Paper>
                                
                                {block.value && (
                                  <Paper elevation={0} sx={{ 
                                    p: 2, 
                                    borderLeft: '4px solid #4CAF50', 
                                    bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#f5f5f5',
                                    my: 1
                                  }}>
                                    <Typography variant="body1" sx={{ fontStyle: 'italic' }}>
                                      "{block.value}"
                                    </Typography>
                                    {block.metadata?.author && (
                                      <Typography variant="body2" sx={{ mt: 1, textAlign: 'right', fontWeight: 'bold', color: 'text.secondary' }}>
                                        — {block.metadata.author}
                                        {block.metadata?.source && `, ${block.metadata.source}`}
                                      </Typography>
                                    )}
                                  </Paper>
                                )}
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

                    <Stack direction="row" spacing={2} flexWrap="wrap">
                      <Button onClick={() => handleAddBlock('text')} startIcon={<TextFields />}>Thêm văn bản</Button>
                      <Button onClick={() => handleAddBlock('heading')} startIcon={<Article />}>Thêm tiêu đề</Button>
                      <Button onClick={() => handleAddBlock('image')} startIcon={<Image />}>Thêm hình ảnh</Button>
                      <Button onClick={() => handleAddBlock('quote')} startIcon={<FormatQuote />}>Thêm trích dẫn</Button>
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
                        <InputLabel sx={{ color: 'text.secondary' }}>Danh mục</InputLabel>
                        <Select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          label="Danh mục"
                          sx={{
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: 'divider'
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: 'primary.main'
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: 'primary.main'
                            },
                            color: 'text.primary',
                            bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'transparent'
                          }}
                          MenuProps={{
                            PaperProps: {
                              sx: {
                                bgcolor: (theme) => theme.palette.mode === 'dark' ? 'background.paper' : '#fff'
                              }
                            }
                          }}
                        >
                          <MenuItem value="">Chọn danh mục</MenuItem>
                          {categories.map((cat) => (
                            <MenuItem key={cat.id} value={cat.id}>
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
                          sx={{
                            '& .MuiInputBase-root': {
                              bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                              color: 'text.primary'
                            },
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: 'divider'
                            },
                            '& .MuiInputLabel-root': {
                              color: 'text.secondary'
                            }
                          }}
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
                            sx={{
                              bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : '#f5f5f5',
                              borderColor: 'divider',
                              color: 'text.primary',
                              '& .MuiChip-deleteIcon': {
                                color: 'text.secondary',
                                '&:hover': {
                                  color: 'error.main'
                                }
                              }
                            }}
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
                      <Stack spacing={1}>
                        <TextField
                          label="URL hình ảnh"
                          value={imageUrl}
                          onChange={(e) => setImageUrl(e.target.value)}
                          fullWidth
                          variant="outlined"
                          InputProps={{
                            startAdornment: <Image sx={{ mr: 1, color: 'text.secondary' }} />,
                          }}
                          sx={{
                            '& .MuiInputBase-root': {
                              bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                              color: 'text.primary'
                            },
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: 'divider'
                            },
                            '& .MuiInputLabel-root': {
                              color: 'text.secondary'
                            }
                          }}
                        />
                        <Button 
                          variant="outlined" 
                          color="primary" 
                          onClick={() => router.push('/media?returnTo=' + encodeURIComponent(`/content/edit/${id}`))}
                          startIcon={<Image />}
                          fullWidth
                        >
                          Chọn ảnh từ thư viện
                        </Button>
                        {imageUrl && (
                          <Box sx={{ mt: 1, p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                            <img 
                              src={imageUrl} 
                              alt="Ảnh đại diện" 
                              style={{ width: '100%', height: 'auto', maxHeight: '150px', objectFit: 'contain' }} 
                            />
                          </Box>
                        )}
                      </Stack>
                      
                      <TextField
                        label="URL video"
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        fullWidth
                        variant="outlined"
                        InputProps={{
                          startAdornment: <VideoLibrary sx={{ mr: 1, color: 'text.secondary' }} />,
                        }}
                        sx={{
                          '& .MuiInputBase-root': {
                            bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                            color: 'text.primary'
                          },
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'divider'
                          },
                          '& .MuiInputLabel-root': {
                            color: 'text.secondary'
                          }
                        }}
                      />
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
            content={blocks.map(block => ({
              type: block.type,
              content: block.value,
              metadata: block.metadata
            }))}
            category={categories.find(c => c.id === category)?.name}
            tags={tags}
            author={author}
            imageUrl={imageUrl}
            videoUrl={videoUrl}
            isFeature={isFeature}
            status={status}
            createdAt={healthTip?.createdAt}
            viewCount={healthTip?.viewCount}
            likeCount={healthTip?.likeCount}
          />
        </Box>
      </LayoutWrapper>
    </AuthGuard>
  );
}