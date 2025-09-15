import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import {
  Box,
  Container,
  Typography,
  Button,
  Alert,
  Stack,
  Card,
  CardContent
} from '@mui/material';
import toast, { Toaster } from 'react-hot-toast';

const SimpleTestPage: NextPage = () => {
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const checkSystem = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/debug/system');
      const data = await response.json();
      setSystemStatus(data);
      console.log('System status:', data);
    } catch (error) {
      console.error('Error checking system:', error);
      toast.error('Không thể kiểm tra hệ thống');
    } finally {
      setLoading(false);
    }
  };

  const createSampleCategories = async () => {
    try {
      const response = await fetch('/api/debug/create-sample-categories', {
        method: 'POST'
      });
      const data = await response.json();
      console.log('Sample categories result:', data);
      toast.success('Đã tạo categories mẫu');
      checkSystem(); // Refresh system status
    } catch (error) {
      console.error('Error creating sample categories:', error);
      toast.error('Lỗi tạo categories mẫu');
    }
  };

  useEffect(() => {
    checkSystem();
  }, []);

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Toaster position="top-right" />
      
      <Typography variant="h4" gutterBottom>
        System Debug & Test
      </Typography>

      <Stack spacing={3}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              System Status
            </Typography>
            
            <Stack spacing={2}>
              <Button 
                variant="outlined" 
                onClick={checkSystem} 
                disabled={loading}
              >
                {loading ? 'Đang kiểm tra...' : 'Kiểm tra hệ thống'}
              </Button>

              {systemStatus && (
                <Box>
                  <Alert severity={systemStatus.firebase?.connected ? 'success' : 'error'}>
                    Firebase: {systemStatus.firebase?.connected ? 'Connected' : 'Disconnected'}
                  </Alert>
                  
                  <Alert severity={systemStatus.cloudinary?.has_secret ? 'success' : 'error'} sx={{ mt: 1 }}>
                    Cloudinary: {systemStatus.cloudinary?.cloud_name} 
                    {systemStatus.cloudinary?.has_secret ? ' (API Secret OK)' : ' (Missing API Secret)'}
                  </Alert>

                  <Typography variant="body2" sx={{ mt: 2 }}>
                    <strong>Categories:</strong> {systemStatus.categories?.total || 0} total, {systemStatus.categories?.active || 0} active
                  </Typography>
                  
                  <Typography variant="body2">
                    <strong>Media:</strong> {systemStatus.media?.total || 0} total ({systemStatus.media?.images || 0} images, {systemStatus.media?.videos || 0} videos)
                  </Typography>

                  {systemStatus.categories?.data && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2">Categories:</Typography>
                      {systemStatus.categories.data.map((cat: any) => (
                        <Typography key={cat.id} variant="caption" display="block">
                          - {cat.name} ({cat.isActive ? 'active' : 'inactive'})
                        </Typography>
                      ))}
                    </Box>
                  )}
                </Box>
              )}
            </Stack>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            
            <Stack direction="row" spacing={2}>
              <Button 
                variant="contained" 
                onClick={createSampleCategories}
              >
                Tạo Categories Mẫu
              </Button>
              
              <Button 
                variant="outlined" 
                onClick={() => window.open('/test-upload', '_blank')}
              >
                Test Upload
              </Button>
              
              <Button 
                variant="outlined" 
                onClick={() => window.open('/media', '_blank')}
              >
                Media Manager
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Container>
  );
};

export default SimpleTestPage;
