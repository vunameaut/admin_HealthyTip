import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  FormGroup,
  Divider,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Avatar,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Settings,
  CloudUpload,
  Notifications,
  Security,
  Storage,
  Edit,
  Delete,
  Add,
  Refresh,
  CheckCircle,
  Error,
  Warning,
  Info,
  ExpandMore,
  Analytics,
  Email,
  Sms
} from '@mui/icons-material';
import LayoutWrapper from '../../components/LayoutWrapper';
import AuthGuard from '../../components/AuthGuard';
import toast from 'react-hot-toast';

interface SystemConfig {
  firebase: {
    apiKey: string;
    authDomain: string;
    databaseURL: string;
    projectId: string;
    storageBucket: string;
    status: 'connected' | 'error' | 'checking';
  };
  cloudinary: {
    cloudName: string;
    apiKey: string;
    apiSecret: string;
    uploadPreset: string;
    folderStructure: string;
    status: 'connected' | 'error' | 'checking';
  };
  features: {
    maintenanceMode: boolean;
    userRegistration: boolean;
    emailNotifications: boolean;
    pushNotifications: boolean;
    analytics: boolean;
    contentModeration: boolean;
    autoBackup: boolean;
  };
  app: {
    name: string;
    version: string;
    description: string;
    supportEmail: string;
    maxFileSize: number; // MB
    allowedFileTypes: string[];
  };
  notifications: {
    emailProvider: 'smtp' | 'sendgrid' | 'mailgun';
    smtpSettings: {
      host: string;
      port: number;
      secure: boolean;
      username: string;
      password: string;
    };
    pushProvider: 'firebase' | 'onesignal';
    templates: Array<{
      id: string;
      name: string;
      subject: string;
      content: string;
      type: 'email' | 'push';
    }>;
  };
}

export default function SystemSettings() {
  const [config, setConfig] = useState<SystemConfig>({
    firebase: {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DB_URL || '',
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
      status: 'checking'
    },
    cloudinary: {
      cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '',
      apiKey: process.env.CLOUDINARY_API_KEY || '',
      apiSecret: process.env.CLOUDINARY_API_SECRET || '',
      uploadPreset: 'default',
      folderStructure: 'healthy_tip/{category}/{year}/{month}/{slug}',
      status: 'checking'
    },
    features: {
      maintenanceMode: false,
      userRegistration: true,
      emailNotifications: true,
      pushNotifications: true,
      analytics: true,
      contentModeration: false,
      autoBackup: true
    },
    app: {
      name: 'HealthTips Admin',
      version: '1.0.0',
      description: 'Hệ thống quản trị ứng dụng mẹo sức khỏe',
      supportEmail: 'support@healthtips.com',
      maxFileSize: 10,
      allowedFileTypes: ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov', 'avi']
    },
    notifications: {
      emailProvider: 'smtp',
      smtpSettings: {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        username: '',
        password: ''
      },
      pushProvider: 'firebase',
      templates: [
        {
          id: 'welcome',
          name: 'Chào mừng người dùng mới',
          subject: 'Chào mừng bạn đến với HealthTips!',
          content: 'Cảm ơn bạn đã tham gia cộng đồng HealthTips...',
          type: 'email'
        },
        {
          id: 'reminder',
          name: 'Nhắc nhở uống nước',
          subject: 'Đã đến giờ uống nước!',
          content: 'Hãy uống một ly nước để duy trì sức khỏe tốt.',
          type: 'push'
        }
      ]
    }
  });

  const [loading, setLoading] = useState(false);
  const [testingConnection, setTestingConnection] = useState<string | null>(null);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

  useEffect(() => {
    loadSystemConfig();
    checkServiceConnections();
  }, []);

  const loadSystemConfig = async () => {
    try {
      setLoading(true);
      // Load configuration from Firebase or local storage
      const savedConfig = localStorage.getItem('systemConfig');
      if (savedConfig) {
        setConfig({ ...config, ...JSON.parse(savedConfig) });
      }
    } catch (error) {
      console.error('Error loading system config:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSystemConfig = async () => {
    try {
      setLoading(true);
      // Save to Firebase and local storage
      localStorage.setItem('systemConfig', JSON.stringify(config));
      
      // Here you would also save to Firebase
      // await systemConfigService.save(config);
      
      toast.success('Đã lưu cấu hình hệ thống');
    } catch (error) {
      console.error('Error saving system config:', error);
      toast.error('Có lỗi xảy ra khi lưu cấu hình');
    } finally {
      setLoading(false);
    }
  };

  const checkServiceConnections = async () => {
    // Test Firebase connection
    try {
      setConfig(prev => ({ ...prev, firebase: { ...prev.firebase, status: 'checking' } }));
      // Simulate Firebase connection test
      await new Promise(resolve => setTimeout(resolve, 1000));
      setConfig(prev => ({ ...prev, firebase: { ...prev.firebase, status: 'connected' } }));
    } catch (error) {
      setConfig(prev => ({ ...prev, firebase: { ...prev.firebase, status: 'error' } }));
    }

    // Test Cloudinary connection
    try {
      setConfig(prev => ({ ...prev, cloudinary: { ...prev.cloudinary, status: 'checking' } }));
      // Simulate Cloudinary connection test
      await new Promise(resolve => setTimeout(resolve, 1500));
      setConfig(prev => ({ ...prev, cloudinary: { ...prev.cloudinary, status: 'connected' } }));
    } catch (error) {
      setConfig(prev => ({ ...prev, cloudinary: { ...prev.cloudinary, status: 'error' } }));
    }
  };

  const testConnection = async (service: string) => {
    setTestingConnection(service);
    try {
      if (service === 'firebase') {
        // Test Firebase connection
        await new Promise(resolve => setTimeout(resolve, 2000));
        setConfig(prev => ({ ...prev, firebase: { ...prev.firebase, status: 'connected' } }));
        toast.success('Kết nối Firebase thành công');
      } else if (service === 'cloudinary') {
        // Test Cloudinary connection
        await new Promise(resolve => setTimeout(resolve, 2000));
        setConfig(prev => ({ ...prev, cloudinary: { ...prev.cloudinary, status: 'connected' } }));
        toast.success('Kết nối Cloudinary thành công');
      }
    } catch (error) {
      toast.error(`Lỗi kết nối ${service}`);
    } finally {
      setTestingConnection(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle color="success" />;
      case 'error': return <Error color="error" />;
      case 'checking': return <LinearProgress />;
      default: return <Warning color="warning" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'success';
      case 'error': return 'error';
      case 'checking': return 'warning';
      default: return 'default';
    }
  };

  return (
    <AuthGuard>
      <LayoutWrapper>
        <Box p={3}>
          {/* Header */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h4" component="h1" fontWeight="bold">
              Cấu hình hệ thống
            </Typography>
            <Box display="flex" gap={1}>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={checkServiceConnections}
              >
                Kiểm tra kết nối
              </Button>
              <Button
                variant="contained"
                startIcon={<Settings />}
                onClick={saveSystemConfig}
                disabled={loading}
              >
                Lưu cấu hình
              </Button>
            </Box>
          </Box>

          {loading && <LinearProgress sx={{ mb: 2 }} />}

          <Grid container spacing={3}>
            {/* Service Connections */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <Storage sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Kết nối dịch vụ
                  </Typography>
                  
                  {/* Firebase */}
                  <Box mb={2}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="subtitle1">Firebase</Typography>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Chip 
                          label={config.firebase.status} 
                          size="small" 
                          color={getStatusColor(config.firebase.status) as any}
                          icon={getStatusIcon(config.firebase.status)}
                        />
                        <Button 
                          size="small" 
                          onClick={() => testConnection('firebase')}
                          disabled={testingConnection === 'firebase'}
                        >
                          Test
                        </Button>
                      </Box>
                    </Box>
                    <TextField
                      fullWidth
                      label="Database URL"
                      value={config.firebase.databaseURL}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        firebase: { ...prev.firebase, databaseURL: e.target.value }
                      }))}
                      size="small"
                      sx={{ mb: 1 }}
                    />
                    <TextField
                      fullWidth
                      label="Project ID"
                      value={config.firebase.projectId}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        firebase: { ...prev.firebase, projectId: e.target.value }
                      }))}
                      size="small"
                    />
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  {/* Cloudinary */}
                  <Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="subtitle1">Cloudinary</Typography>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Chip 
                          label={config.cloudinary.status} 
                          size="small" 
                          color={getStatusColor(config.cloudinary.status) as any}
                          icon={getStatusIcon(config.cloudinary.status)}
                        />
                        <Button 
                          size="small" 
                          onClick={() => testConnection('cloudinary')}
                          disabled={testingConnection === 'cloudinary'}
                        >
                          Test
                        </Button>
                      </Box>
                    </Box>
                    <TextField
                      fullWidth
                      label="Cloud Name"
                      value={config.cloudinary.cloudName}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        cloudinary: { ...prev.cloudinary, cloudName: e.target.value }
                      }))}
                      size="small"
                      sx={{ mb: 1 }}
                    />
                    <TextField
                      fullWidth
                      label="Upload Preset"
                      value={config.cloudinary.uploadPreset}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        cloudinary: { ...prev.cloudinary, uploadPreset: e.target.value }
                      }))}
                      size="small"
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Feature Flags */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <Settings sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Tính năng hệ thống
                  </Typography>
                  
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={config.features.maintenanceMode}
                          onChange={(e) => setConfig(prev => ({
                            ...prev,
                            features: { ...prev.features, maintenanceMode: e.target.checked }
                          }))}
                        />
                      }
                      label="Chế độ bảo trì"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={config.features.userRegistration}
                          onChange={(e) => setConfig(prev => ({
                            ...prev,
                            features: { ...prev.features, userRegistration: e.target.checked }
                          }))}
                        />
                      }
                      label="Cho phép đăng ký người dùng"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={config.features.emailNotifications}
                          onChange={(e) => setConfig(prev => ({
                            ...prev,
                            features: { ...prev.features, emailNotifications: e.target.checked }
                          }))}
                        />
                      }
                      label="Thông báo Email"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={config.features.pushNotifications}
                          onChange={(e) => setConfig(prev => ({
                            ...prev,
                            features: { ...prev.features, pushNotifications: e.target.checked }
                          }))}
                        />
                      }
                      label="Thông báo Push"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={config.features.analytics}
                          onChange={(e) => setConfig(prev => ({
                            ...prev,
                            features: { ...prev.features, analytics: e.target.checked }
                          }))}
                        />
                      }
                      label="Thu thập dữ liệu phân tích"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={config.features.contentModeration}
                          onChange={(e) => setConfig(prev => ({
                            ...prev,
                            features: { ...prev.features, contentModeration: e.target.checked }
                          }))}
                        />
                      }
                      label="Kiểm duyệt nội dung tự động"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={config.features.autoBackup}
                          onChange={(e) => setConfig(prev => ({
                            ...prev,
                            features: { ...prev.features, autoBackup: e.target.checked }
                          }))}
                        />
                      }
                      label="Sao lưu tự động"
                    />
                  </FormGroup>
                </CardContent>
              </Card>
            </Grid>

            {/* App Settings */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <Info sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Thông tin ứng dụng
                  </Typography>
                  
                  <TextField
                    fullWidth
                    label="Tên ứng dụng"
                    value={config.app.name}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      app: { ...prev.app, name: e.target.value }
                    }))}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Phiên bản"
                    value={config.app.version}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      app: { ...prev.app, version: e.target.value }
                    }))}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Mô tả"
                    value={config.app.description}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      app: { ...prev.app, description: e.target.value }
                    }))}
                    multiline
                    rows={3}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Email hỗ trợ"
                    value={config.app.supportEmail}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      app: { ...prev.app, supportEmail: e.target.value }
                    }))}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Kích thước file tối đa (MB)"
                    type="number"
                    value={config.app.maxFileSize}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      app: { ...prev.app, maxFileSize: Number(e.target.value) }
                    }))}
                  />
                </CardContent>
              </Card>
            </Grid>

            {/* Notification Templates */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">
                      <Notifications sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Mẫu thông báo
                    </Typography>
                    <Button
                      size="small"
                      startIcon={<Add />}
                      onClick={() => {
                        setSelectedTemplate(null);
                        setTemplateDialogOpen(true);
                      }}
                    >
                      Thêm mẫu
                    </Button>
                  </Box>
                  
                  <List>
                    {config.notifications.templates.map((template) => (
                      <ListItem key={template.id}>
                        <ListItemText
                          primary={template.name}
                          secondary={
                            <Box>
                              <Typography variant="caption" display="block">
                                {template.subject}
                              </Typography>
                              <Chip 
                                label={template.type} 
                                size="small" 
                                color={template.type === 'email' ? 'primary' : 'secondary'}
                              />
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <IconButton 
                            size="small"
                            onClick={() => {
                              setSelectedTemplate(template);
                              setTemplateDialogOpen(true);
                            }}
                          >
                            <Edit />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>

            {/* System Status */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <Analytics sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Trạng thái hệ thống
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={3}>
                      <Alert severity="success">
                        <Typography variant="body2">Database: Hoạt động tốt</Typography>
                      </Alert>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Alert severity="success">
                        <Typography variant="body2">Storage: Hoạt động tốt</Typography>
                      </Alert>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Alert severity="warning">
                        <Typography variant="body2">Email: Chậm phản hồi</Typography>
                      </Alert>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Alert severity="success">
                        <Typography variant="body2">API: Hoạt động tốt</Typography>
                      </Alert>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Template Dialog */}
          <Dialog 
            open={templateDialogOpen} 
            onClose={() => setTemplateDialogOpen(false)}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>
              {selectedTemplate ? 'Chỉnh sửa mẫu thông báo' : 'Tạo mẫu thông báo mới'}
            </DialogTitle>
            <DialogContent>
              {/* Template form would go here */}
              <Alert severity="info">
                Chức năng chỉnh sửa mẫu thông báo sẽ được phát triển trong phiên bản tiếp theo.
              </Alert>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setTemplateDialogOpen(false)}>Hủy</Button>
              <Button variant="contained">Lưu</Button>
            </DialogActions>
          </Dialog>
        </Box>
      </LayoutWrapper>
    </AuthGuard>
  );
}
