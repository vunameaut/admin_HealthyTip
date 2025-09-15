import React, { useState, useCallback } from 'react';
import {
  Box,
  TextField,
  Button,
  IconButton,
  Paper,
  Typography,
  Grid,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
} from '@mui/material';
import {
  Add,
  Delete,
  ArrowUpward,
  ArrowDownward,
  TextFields,
  Image,
  CloudUpload,
  Preview,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';

export interface ContentBlock {
  id: string;
  type: 'text' | 'image' | 'heading' | 'quote';
  content: string;
  metadata?: {
    level?: 1 | 2 | 3 | 4 | 5 | 6; // For headings
    alt?: string; // For images
    caption?: string; // For images
  };
}

interface RichContentEditorProps {
  title: string;
  content: ContentBlock[];
  onTitleChange: (title: string) => void;
  onContentChange: (content: ContentBlock[]) => void;
}

export default function RichContentEditor({
  title,
  content,
  onTitleChange,
  onContentChange,
}: RichContentEditorProps) {
  const [imageUploadOpen, setImageUploadOpen] = useState(false);
  const [currentBlockIndex, setCurrentBlockIndex] = useState(-1);
  const [previewMode, setPreviewMode] = useState(false);

  const generateId = () => `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const addBlock = (type: ContentBlock['type'], index?: number) => {
    const newBlock: ContentBlock = {
      id: generateId(),
      type,
      content: '',
    };

    // Only add metadata for heading blocks
    if (type === 'heading') {
      newBlock.metadata = { level: 2 };
    }

    const newContent = [...content];
    if (index !== undefined) {
      newContent.splice(index + 1, 0, newBlock);
    } else {
      newContent.push(newBlock);
    }
    onContentChange(newContent);
  };

  const updateBlock = (id: string, updates: Partial<ContentBlock>) => {
    const newContent = content.map(block => {
      if (block.id === id) {
        const updatedBlock = { ...block, ...updates };
        
        // Clean metadata - remove empty values
        if (updatedBlock.metadata) {
          const cleanMetadata: any = {};
          
          for (const [key, value] of Object.entries(updatedBlock.metadata)) {
            if (value !== undefined && value !== null && value !== '') {
              cleanMetadata[key] = value;
            }
          }
          
          if (Object.keys(cleanMetadata).length > 0) {
            updatedBlock.metadata = cleanMetadata;
          } else {
            delete updatedBlock.metadata;
          }
        }
        
        return updatedBlock;
      }
      return block;
    });
    onContentChange(newContent);
  };

  const deleteBlock = (id: string) => {
    if (content.length === 1) {
      toast.error('Không thể xóa khối cuối cùng');
      return;
    }
    const newContent = content.filter(block => block.id !== id);
    onContentChange(newContent);
  };

  const moveBlock = (id: string, direction: 'up' | 'down') => {
    const currentIndex = content.findIndex(block => block.id === id);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= content.length) return;

    const newContent = [...content];
    [newContent[currentIndex], newContent[newIndex]] = [newContent[newIndex], newContent[currentIndex]];
    onContentChange(newContent);
  };

  const uploadImageToCloudinary = async (file: File): Promise<string> => {
    try {
      // Get upload config (unsigned approach)
      const configResponse = await fetch('/api/cloudinary/signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: 'editor-images', // Default category for RichEditor images
          resourceType: 'image'
        }),
      });

      if (!configResponse.ok) {
        throw new Error('Failed to get upload config');
      }

      const { upload_preset, cloud_name, folder, upload_url } = await configResponse.json();

      // Prepare form data for unsigned upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', upload_preset);
      formData.append('folder', folder);
      
      // Upload to Cloudinary using unsigned upload
      const uploadResponse = await fetch(upload_url, {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }

      const result = await uploadResponse.json();
      return result.secure_url;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    if (file.type.startsWith('image/')) {
      try {
        toast.promise(
          uploadImageToCloudinary(file),
          {
            loading: 'Đang tải lên hình ảnh...',
            success: 'Tải lên thành công!',
            error: 'Lỗi khi tải lên hình ảnh',
          }
        ).then((imageUrl) => {
          if (currentBlockIndex >= 0) {
            updateBlock(content[currentBlockIndex].id, {
              content: imageUrl,
              metadata: { alt: file.name.replace(/\.[^/.]+$/, ''), caption: '' }
            });
          }
          setImageUploadOpen(false);
          setCurrentBlockIndex(-1);
        }).catch((error) => {
          console.error('Upload failed:', error);
        });
      } catch (error) {
        console.error('Upload error:', error);
        toast.error('Có lỗi xảy ra khi tải lên hình ảnh');
      }
    }
  }, [currentBlockIndex, content]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    multiple: false
  });

  const handleImageUpload = (blockIndex: number) => {
    setCurrentBlockIndex(blockIndex);
    setImageUploadOpen(true);
  };

  const renderBlockEditor = (block: ContentBlock, index: number) => {
    return (
      <Card key={block.id} variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Typography variant="caption" color="text.secondary">
              {block.type === 'text' ? 'Đoạn văn' : 
               block.type === 'heading' ? 'Tiêu đề' :
               block.type === 'image' ? 'Hình ảnh' :
               block.type === 'quote' ? 'Trích dẫn' : block.type}
            </Typography>
            <Stack direction="row" spacing={0.5}>
              <IconButton
                size="small"
                onClick={() => moveBlock(block.id, 'up')}
                disabled={index === 0}
              >
                <ArrowUpward fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => moveBlock(block.id, 'down')}
                disabled={index === content.length - 1}
              >
                <ArrowDownward fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                color="error"
                onClick={() => deleteBlock(block.id)}
                disabled={content.length === 1}
              >
                <Delete fontSize="small" />
              </IconButton>
            </Stack>
          </Box>

          {block.type === 'text' && (
            <TextField
              fullWidth
              multiline
              minRows={3}
              placeholder="Nhập nội dung đoạn văn..."
              value={block.content}
              onChange={(e) => updateBlock(block.id, { content: e.target.value })}
              variant="outlined"
            />
          )}

          {block.type === 'heading' && (
            <Stack spacing={2}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={8}>
                  <TextField
                    fullWidth
                    placeholder="Nhập tiêu đề..."
                    value={block.content}
                    onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Cấp độ</InputLabel>
                    <Select
                      value={block.metadata?.level || 2}
                      onChange={(e) => updateBlock(block.id, {
                        metadata: { 
                          ...(block.metadata || {}), 
                          level: e.target.value as 1 | 2 | 3 | 4 | 5 | 6 
                        }
                      })}
                      label="Cấp độ"
                    >
                      <MenuItem value={1}>H1</MenuItem>
                      <MenuItem value={2}>H2</MenuItem>
                      <MenuItem value={3}>H3</MenuItem>
                      <MenuItem value={4}>H4</MenuItem>
                      <MenuItem value={5}>H5</MenuItem>
                      <MenuItem value={6}>H6</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Stack>
          )}

          {block.type === 'quote' && (
            <TextField
              fullWidth
              multiline
              minRows={2}
              placeholder="Nhập trích dẫn..."
              value={block.content}
              onChange={(e) => updateBlock(block.id, { content: e.target.value })}
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#f5f5f5',
                  fontStyle: 'italic',
                }
              }}
            />
          )}

          {block.type === 'image' && (
            <Stack spacing={2}>
              {block.content ? (
                <Box>
                  <img
                    src={block.content}
                    alt={block.metadata?.alt || ''}
                    style={{
                      width: '100%',
                      maxHeight: 300,
                      objectFit: 'contain',
                      borderRadius: 8,
                    }}
                  />
                  <Button
                    size="small"
                    onClick={() => handleImageUpload(index)}
                    sx={{ mt: 1 }}
                  >
                    Thay đổi hình ảnh
                  </Button>
                </Box>
              ) : (
                <Button
                  variant="outlined"
                  startIcon={<CloudUpload />}
                  onClick={() => handleImageUpload(index)}
                  sx={{ py: 3 }}
                >
                  Tải lên hình ảnh
                </Button>
              )}
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Alt text"
                    value={block.metadata?.alt || ''}
                    onChange={(e) => updateBlock(block.id, {
                      metadata: { 
                        ...(block.metadata || {}), 
                        alt: e.target.value
                      }
                    })}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Chú thích"
                    value={block.metadata?.caption || ''}
                    onChange={(e) => updateBlock(block.id, {
                      metadata: { 
                        ...(block.metadata || {}), 
                        caption: e.target.value
                      }
                    })}
                  />
                </Grid>
              </Grid>
            </Stack>
          )}

          {/* Add new block buttons */}
          <Box display="flex" justifyContent="center" mt={2}>
            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                startIcon={<TextFields />}
                onClick={() => addBlock('text', index)}
              >
                Văn bản
              </Button>
              <Button
                size="small"
                startIcon={<TextFields />}
                onClick={() => addBlock('heading', index)}
              >
                Tiêu đề
              </Button>
              <Button
                size="small"
                startIcon={<Image />}
                onClick={() => addBlock('image', index)}
              >
                Hình ảnh
              </Button>
              <Button
                size="small"
                onClick={() => addBlock('quote', index)}
              >
                Trích dẫn
              </Button>
            </Stack>
          </Box>
        </CardContent>
      </Card>
    );
  };

  const renderPreview = () => {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          {title || 'Tiêu đề bài viết'}
        </Typography>
        
        {content.map((block) => (
          <Box key={block.id} mb={2}>
            {block.type === 'text' && (
              <Typography variant="body1" paragraph>
                {block.content || 'Nội dung đoạn văn...'}
              </Typography>
            )}
            
            {block.type === 'heading' && (
              <Typography
                variant={`h${block.metadata?.level || 2}` as any}
                gutterBottom
              >
                {block.content || 'Tiêu đề...'}
              </Typography>
            )}
            
            {block.type === 'quote' && (
              <Box
                sx={{
                  borderLeft: 4,
                  borderColor: 'primary.main',
                  pl: 2,
                  py: 1,
                  backgroundColor: '#f5f5f5',
                  fontStyle: 'italic',
                }}
              >
                <Typography variant="body1">
                  {block.content || 'Trích dẫn...'}
                </Typography>
              </Box>
            )}
            
            {block.type === 'image' && block.content && (
              <Box textAlign="center">
                <img
                  src={block.content}
                  alt={block.metadata?.alt || ''}
                  style={{
                    maxWidth: '100%',
                    height: 'auto',
                    borderRadius: 8,
                  }}
                />
                {block.metadata?.caption && (
                  <Typography variant="caption" display="block" mt={1}>
                    {block.metadata.caption}
                  </Typography>
                )}
              </Box>
            )}
          </Box>
        ))}
      </Paper>
    );
  };

  return (
    <Box>
      {/* Title Editor */}
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Nhập tiêu đề bài viết..."
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        sx={{
          mb: 3,
          '& .MuiOutlinedInput-root': {
            fontSize: '1.5rem',
            fontWeight: 'bold',
          }
        }}
      />

      {/* Mode Toggle */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">
          {previewMode ? 'Xem trước bài viết' : 'Chỉnh sửa nội dung'}
        </Typography>
        <Button
          variant={previewMode ? 'contained' : 'outlined'}
          startIcon={<Preview />}
          onClick={() => setPreviewMode(!previewMode)}
        >
          {previewMode ? 'Chỉnh sửa' : 'Xem trước'}
        </Button>
      </Box>

      {/* Content */}
      {previewMode ? (
        renderPreview()
      ) : (
        <Box>
          {content.map((block, index) => renderBlockEditor(block, index))}
          
          {content.length === 0 && (
            <Box textAlign="center" py={4}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Chưa có nội dung nào. Hãy thêm khối nội dung đầu tiên.
              </Typography>
              <Stack direction="row" spacing={2} justifyContent="center">
                <Button
                  variant="contained"
                  startIcon={<TextFields />}
                  onClick={() => addBlock('text')}
                >
                  Thêm văn bản
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Image />}
                  onClick={() => addBlock('image')}
                >
                  Thêm hình ảnh
                </Button>
              </Stack>
            </Box>
          )}
        </Box>
      )}

      {/* Image Upload Dialog */}
      <Dialog open={imageUploadOpen} onClose={() => setImageUploadOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Tải lên hình ảnh</DialogTitle>
        <DialogContent>
          <Box {...getRootProps()} sx={{
            border: '2px dashed #ccc',
            borderRadius: 2,
            p: 4,
            textAlign: 'center',
            cursor: 'pointer',
            bgcolor: isDragActive ? 'action.hover' : 'background.paper',
          }}>
            <input {...getInputProps()} />
            <CloudUpload sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              {isDragActive ? 'Thả hình ảnh vào đây...' : 'Kéo thả hình ảnh hoặc click để chọn'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Hỗ trợ: PNG, JPG, JPEG, GIF, WebP
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImageUploadOpen(false)}>Hủy</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
