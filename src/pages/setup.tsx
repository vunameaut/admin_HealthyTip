import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Container,
  useTheme,
} from '@mui/material';
import {
  AdminPanelSettings,
  Person,
  Security,
  Check,
} from '@mui/icons-material';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useRouter } from 'next/router';

interface SetupForm {
  email: string;
  password: string;
  confirmPassword: string;
  displayName: string;
}

export default function SetupPage() {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [adminCreated, setAdminCreated] = useState(false);
  const theme = useTheme();
  const router = useRouter();

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    getValues,
  } = useForm<SetupForm>({
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      displayName: '',
    },
  });

  const password = watch('password');

  const steps = [
    'Thông tin cơ bản',
    'Tạo tài khoản',
    'Hoàn thành'
  ];

  const onSubmit = async (data: SetupForm) => {
    setLoading(true);
    try {
      setActiveStep(1);
      
      // Tạo user trong Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        data.email, 
        data.password
      );
      
      const user = userCredential.user;
      
      // Tạo admin record trong database
      const response = await fetch('/api/admin/create-first-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid: user.uid,
          email: data.email,
          displayName: data.displayName,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create admin');
      }

      setActiveStep(2);
      setAdminCreated(true);
      toast.success('Tài khoản admin đã được tạo thành công!');
      
      // Chuyển hướng sau 3 giây
      setTimeout(() => {
        router.push('/');
      }, 3000);
      
    } catch (error: any) {
      console.error('Setup error:', error);
      setActiveStep(0);
      
      let errorMessage = 'Có lỗi xảy ra khi tạo admin';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Email này đã được sử dụng';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Mật khẩu quá yếu';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Thiết lập tài khoản Admin đầu tiên
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Tạo tài khoản admin để quản lý hệ thống HealthTips
            </Typography>
            
            <Controller
              name="displayName"
              control={control}
              rules={{ required: 'Tên hiển thị là bắt buộc' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Tên hiển thị"
                  error={!!errors.displayName}
                  helperText={errors.displayName?.message}
                  sx={{ mb: 2 }}
                />
              )}
            />

            <Controller
              name="email"
              control={control}
              rules={{
                required: 'Email là bắt buộc',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Email không hợp lệ',
                },
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Email"
                  type="email"
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  sx={{ mb: 2 }}
                />
              )}
            />

            <Controller
              name="password"
              control={control}
              rules={{
                required: 'Mật khẩu là bắt buộc',
                minLength: {
                  value: 6,
                  message: 'Mật khẩu phải có ít nhất 6 ký tự',
                },
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Mật khẩu"
                  type="password"
                  error={!!errors.password}
                  helperText={errors.password?.message}
                  sx={{ mb: 2 }}
                />
              )}
            />

            <Controller
              name="confirmPassword"
              control={control}
              rules={{
                required: 'Xác nhận mật khẩu là bắt buộc',
                validate: value => value === password || 'Mật khẩu không khớp',
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Xác nhận mật khẩu"
                  type="password"
                  error={!!errors.confirmPassword}
                  helperText={errors.confirmPassword?.message}
                  sx={{ mb: 3 }}
                />
              )}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ py: 1.5 }}
            >
              {loading ? 'Đang tạo tài khoản...' : 'Tạo Admin'}
            </Button>
          </Box>
        );

      case 1:
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Security sx={{ fontSize: 64, color: theme.palette.primary.main, mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Đang tạo tài khoản...
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Vui lòng đợi trong khi chúng tôi thiết lập tài khoản admin cho bạn
            </Typography>
          </Box>
        );

      case 2:
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Check sx={{ fontSize: 64, color: theme.palette.success.main, mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Thiết lập hoàn tất!
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Tài khoản admin đã được tạo thành công. Bạn sẽ được chuyển hướng đến trang đăng nhập.
            </Typography>
            <Alert severity="success" sx={{ mt: 2 }}>
              Email: {getValues('email')}<br />
              Role: Admin
            </Alert>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: 2,
      }}
    >
      <Container maxWidth="sm">
        <Card
          sx={{
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(31, 38, 135, 0.37)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
          }}
        >
          <CardContent sx={{ p: 4 }}>
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <AdminPanelSettings
                sx={{ fontSize: 48, color: theme.palette.primary.main, mb: 1 }}
              />
              <Typography variant="h4" component="h1" gutterBottom>
                HealthTips Admin
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Thiết lập hệ thống lần đầu
              </Typography>
            </Box>

            {/* Stepper */}
            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)}>
              {renderStepContent(activeStep)}
            </form>

            {adminCreated && (
              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  Đang chuyển hướng...
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
