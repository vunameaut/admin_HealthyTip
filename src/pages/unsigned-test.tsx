import React, { useState } from 'react';
import { NextPage } from 'next';
import {
  Box,
  Container,
  Typography,
  Button,
  Alert,
  Stack,
  Card,
  CardContent,
  TextField,
  Grid,
  Chip,
  Link
} from '@mui/material';
import toast, { Toaster } from 'react-hot-toast';

const UnsignedUploadTest: NextPage = () => {
  const [category, setCategory] = useState('test');
  const [resourceType, setResourceType] = useState<'image' | 'video'>('image');
  const [uploadConfig, setUploadConfig] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const getUploadConfig = async () => {
    setLoading(true);
    try {
      console.log('=== LẤY CẤU HÌNH UPLOAD KHÔNG CẦN CHỮ KÝ ===');
      
      const response = await fetch('/api/cloudinary/unsigned-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          category,
          resourceType 
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Lỗi API cấu hình: ${errorText}`);
      }

      const config = await response.json();
      setUploadConfig(config);
      console.log('Cấu hình upload:', config);
      toast.success('✅ Cấu hình upload đã sẵn sàng!');

    } catch (error) {
      console.error('Lỗi khi lấy cấu hình upload:', error);
      toast.error(`Lỗi: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    } finally {
      setLoading(false);
    }
  };

  const testUnsignedUpload = async () => {
    if (!uploadConfig) {
      toast.error('Vui lòng lấy cấu hình upload trước');
      return;
    }

    try {
      console.log('=== TEST UPLOAD KHÔNG CHỮ KÝ ===');
      console.log('Sử dụng cấu hình:', uploadConfig);

      // Tạo hình ảnh test
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      ctx!.fillStyle = '#FF6B6B';
      ctx!.fillRect(0, 0, 100, 100);
      ctx!.fillStyle = '#4ECDC4';
      ctx!.fillRect(25, 25, 50, 50);
      ctx!.fillStyle = '#45B7D1';
      ctx!.font = '20px Arial';
      ctx!.fillText('TEST', 30, 55);
      
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        
        const formData = new FormData();
        
        // Với unsigned upload: chỉ cần upload_preset + file + folder
        formData.append('file', blob, 'test-unsigned.png');
        formData.append('upload_preset', uploadConfig.upload_preset);
        formData.append('folder', uploadConfig.folder);
        
        console.log('FormData cho unsigned upload:');
        for (let [key, value] of formData.entries()) {
          console.log(`  ${key}:`, value instanceof File ? `File(${value.name}, ${value.size} bytes)` : value);
        }

        console.log('Đang upload lên:', uploadConfig.upload_url);

        const response = await fetch(uploadConfig.upload_url, {
          method: 'POST',
          body: formData
        });

        const result = await response.json();
        console.log('=== PHẢN HỒI TỪ CLOUDINARY ===');
        console.log('Trạng thái:', response.status);
        console.log('Kết quả:', result);

        if (response.ok) {
          toast.success('🎉 Upload thành công!');
          console.log('THÀNH CÔNG! Đã upload lên:', result.secure_url);
          console.log('Chi tiết upload:', {
            public_id: result.public_id,
            secure_url: result.secure_url,
            folder: result.folder,
            resource_type: result.resource_type,
            format: result.format
          });
        } else {
          console.error('❌ Upload thất bại:', result.error);
          if (result.error?.message?.includes('upload preset')) {
            toast.error('Không tìm thấy upload preset "healthtip_unsigned". Cần tạo preset trên Cloudinary dashboard!');
          } else {
            toast.error(`Upload thất bại: ${result.error?.message || 'Lỗi không xác định'}`);
          }
        }
      }, 'image/png');

    } catch (error) {
      console.error('Lỗi test unsigned upload:', error);
      toast.error(`Test thất bại: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Toaster position="top-right" />
      
      <Typography variant="h4" gutterBottom>
        🔓 Test Upload Không Chữ Ký (Unsigned Upload)
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Lưu ý:</strong> Phương pháp này sử dụng "upload preset" được cấu hình sẵn trên 
          Cloudinary dashboard, không cần chữ ký phức tạp. Nếu test thất bại, chúng ta cần tạo preset trước.
        </Typography>
      </Alert>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Tham Số Test
              </Typography>
              
              <Stack spacing={2}>
                <TextField
                  label="Danh mục (Category)"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  fullWidth
                  size="small"
                  helperText="VD: test, suc-khoe, dinh-duong"
                />
                
                <TextField
                  label="Loại tài liệu"
                  value={resourceType}
                  onChange={(e) => setResourceType(e.target.value as 'image' | 'video')}
                  select
                  SelectProps={{ native: true }}
                  fullWidth
                  size="small"
                >
                  <option value="image">Hình ảnh (Image)</option>
                  <option value="video">Video</option>
                </TextField>

                <Button 
                  variant="contained" 
                  onClick={getUploadConfig}
                  disabled={loading}
                  fullWidth
                  size="large"
                >
                  {loading ? '⏳ Đang lấy cấu hình...' : '🔧 Lấy Cấu Hình Upload'}
                </Button>

                {uploadConfig && (
                  <Button 
                    variant="outlined" 
                    onClick={testUnsignedUpload}
                    fullWidth
                    size="large"
                    color="success"
                  >
                    🚀 Test Upload (Không Chữ Ký)
                  </Button>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Stack spacing={2}>
            {uploadConfig && (
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    📋 Cấu Hình Upload
                  </Typography>
                  <Stack spacing={1}>
                    <Chip 
                      label={`Upload Preset: ${uploadConfig.upload_preset}`}
                      color="primary"
                      size="small"
                    />
                    <Chip 
                      label={`Cloud: ${uploadConfig.cloud_name}`}
                      color="secondary"
                      size="small"
                    />
                    <Chip 
                      label={`Loại: ${uploadConfig.resource_type}`}
                      color="info"
                      size="small"
                    />
                    <Chip 
                      label={`Thư mục: ${uploadConfig.folder}`}
                      color="success"
                      size="small"
                    />
                  </Stack>
                  <Box 
                    component="pre" 
                    sx={{ 
                      fontSize: '0.75rem', 
                      overflow: 'auto', 
                      bgcolor: 'grey.100', 
                      p: 1, 
                      borderRadius: 1,
                      mt: 2,
                      maxHeight: 200
                    }}
                  >
                    {JSON.stringify({
                      upload_preset: uploadConfig.upload_preset,
                      cloud_name: uploadConfig.cloud_name,
                      folder: uploadConfig.folder,
                      resource_type: uploadConfig.resource_type,
                      upload_url: uploadConfig.upload_url
                    }, null, 2)}
                  </Box>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  � Hướng Dẫn Chi Tiết
                </Typography>
                <Typography variant="body2" component="div">
                  <Box component="ol" sx={{ pl: 2 }}>
                    <li><strong>Bước 1:</strong> Nhấn "Lấy Cấu Hình Upload" để chuẩn bị</li>
                    <li><strong>Bước 2:</strong> Nếu upload preset chưa tồn tại, tạo trên Cloudinary:</li>
                    <Box component="ul" sx={{ pl: 2, mt: 1 }}>
                      <li>Vào <Link href="https://cloudinary.com/console" target="_blank">Cloudinary Console</Link></li>
                      <li>Chọn <strong>Settings → Upload → Upload presets</strong></li>
                      <li>Nhấn <strong>"Add upload preset"</strong></li>
                      <li>Đặt tên: <code style={{ backgroundColor: '#f5f5f5', padding: '2px 6px', borderRadius: '4px' }}>healthtip_unsigned</code></li>
                      <li>Chọn <strong>Signing Mode: Unsigned</strong></li>
                      <li>Trong tab <strong>Upload</strong>, đặt <strong>Folder: auto</strong> (để cho phép dynamic folder)</li>
                      <li>Nhấn <strong>Save</strong></li>
                    </Box>
                    <li><strong>Bước 3:</strong> Quay lại đây và nhấn "Test Upload"</li>
                    <li><strong>Bước 4:</strong> Nếu thành công, kiểm tra folder structure trên Cloudinary</li>
                  </Box>
                  
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    <Typography variant="caption">
                      <strong>Quan trọng:</strong> Upload preset phải được tạo với đúng tên 
                      <code style={{ margin: '0 4px' }}>healthtip_unsigned</code> và 
                      Signing Mode = <strong>Unsigned</strong>
                    </Typography>
                  </Alert>
                </Typography>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom color="success.main">
                  🎯 Folder Structure Tự Động
                </Typography>
                <Typography variant="body2">
                  Hệ thống sẽ tự động tạo cấu trúc thư mục theo format:
                </Typography>
                <Box 
                  sx={{ 
                    bgcolor: 'success.light', 
                    p: 1, 
                    borderRadius: 1, 
                    mt: 1,
                    fontFamily: 'monospace',
                    fontSize: '0.85rem'
                  }}
                >
                  healthy_tip/<strong style={{ color: '#1976d2' }}>[slug-danh-muc]</strong>/<strong style={{ color: '#d32f2f' }}>[YYYY]</strong>/<strong style={{ color: '#ed6c02' }}>[MM]</strong>
                </Box>
                <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                  VD: healthy_tip/test/2025/09/test-unsigned.png
                </Typography>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Container>
  );
};

export default UnsignedUploadTest;
