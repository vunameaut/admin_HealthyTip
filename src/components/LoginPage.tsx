import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  InputAdornment,
  IconButton,
  Divider,
  useTheme,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  LightMode,
  DarkMode,
} from '@mui/icons-material';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { ref, get } from 'firebase/database';
import { auth, database } from '@/lib/firebase';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';
import Logo from './Logo';

interface LoginForm {
  email: string;
  password: string;
}

interface LoginPageProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ darkMode, toggleDarkMode }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const router = useRouter();
  const theme = useTheme();

  const {
    control,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<LoginForm>({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const userRef = ref(database, `users/${user.uid}`);
        const snapshot = await get(userRef);
        const userData = snapshot.val();
        
        if (userData?.role === 'admin' || userData?.role === 'editor') {
          router.push('/dashboard');
        } else {
          toast.error('Bạn không có quyền truy cập trang admin');
          auth.signOut();
        }
      }
    });

    return () => unsubscribe();
  }, [router]);

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      const userRef = ref(database, `users/${user.uid}`);
      const snapshot = await get(userRef);
      const userData = snapshot.val();

      if (!userData) {
        throw new Error('Người dùng không tồn tại trong hệ thống');
      }

      if (userData.role !== 'admin' && userData.role !== 'editor') {
        throw new Error('Bạn không có quyền truy cập trang admin');
      }

      await fetch('/api/users/update-last-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: user.uid }),
      });

      toast.success('Đăng nhập thành công!');
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      let errorMessage = 'Đăng nhập thất bại';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'Email không tồn tại';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Mật khẩu không đúng';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Email không hợp lệ';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const email = getValues('email');
    if (!email) {
      toast.error('Vui lòng nhập email');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      toast.success('Email reset mật khẩu đã được gửi!');
      setShowForgotPassword(false);
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast.error('Có lỗi xảy ra khi gửi email reset mật khẩu');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: darkMode
          ? 'linear-gradient(135deg, #0D1117 0%, #161B22 50%, #21262D 100%)'
          : 'linear-gradient(135deg, #E8F5E8 0%, #F1F8E9 50%, #E0F2F1 100%)',
        padding: 2,
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: darkMode
            ? 'radial-gradient(circle at 30% 20%, rgba(76, 175, 80, 0.1) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(33, 150, 243, 0.1) 0%, transparent 50%)'
            : 'radial-gradient(circle at 30% 20%, rgba(76, 175, 80, 0.2) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(33, 150, 243, 0.2) 0%, transparent 50%)',
          pointerEvents: 'none',
        },
      }}
    >
      <Card
        sx={{
          maxWidth: 420,
          width: '100%',
          borderRadius: 4,
          boxShadow: darkMode
            ? '0 8px 32px rgba(0, 0, 0, 0.4), 0 4px 16px rgba(76, 175, 80, 0.1)'
            : '0 8px 32px rgba(76, 175, 80, 0.2), 0 4px 16px rgba(33, 150, 243, 0.1)',
          backdropFilter: 'blur(10px)',
          border: darkMode
            ? '1px solid rgba(76, 175, 80, 0.2)'
            : '1px solid rgba(76, 175, 80, 0.3)',
          background: darkMode
            ? 'rgba(22, 27, 34, 0.9)'
            : 'rgba(255, 255, 255, 0.95)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 4,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Logo size="medium" />
              <Box>
                <Typography
                  variant="h5"
                  fontWeight="bold"
                  sx={{
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    mb: 0.5,
                  }}
                >
                  HealthyTip Admin
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontSize: '0.85rem' }}
                >
                  Wisdom Admin Panel
                </Typography>
              </Box>
            </Box>
            
            <FormControlLabel
              control={
                <Switch
                  checked={darkMode}
                  onChange={toggleDarkMode}
                  icon={<LightMode />}
                  checkedIcon={<DarkMode />}
                  sx={{
                    '& .MuiSwitch-thumb': {
                      bgcolor: darkMode ? '#FFF' : theme.palette.primary.main,
                    },
                  }}
                />
              }
              label=""
            />
          </Box>

          <Typography
            variant="body1"
            color="text.secondary"
            align="center"
            sx={{ mb: 4, fontSize: '1rem' }}
          >
            Đăng nhập để quản lý hệ thống HealthTips thông minh
          </Typography>

          <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 1 }}>
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
                  variant="outlined"
                  margin="normal"
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email color="primary" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                      '&:hover fieldset': {
                        borderColor: theme.palette.primary.main,
                      },
                    },
                  }}
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
                  type={showPassword ? 'text' : 'password'}
                  variant="outlined"
                  margin="normal"
                  error={!!errors.password}
                  helperText={errors.password?.message}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock color="primary" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                      '&:hover fieldset': {
                        borderColor: theme.palette.primary.main,
                      },
                    },
                  }}
                />
              )}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={isLoading}
              sx={{
                mt: 3,
                mb: 2,
                py: 1.5,
                borderRadius: 3,
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                '&:hover': {
                  background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
                },
                fontSize: '1rem',
                fontWeight: 600,
              }}
            >
              {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </Button>

            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Button
                color="primary"
                onClick={() => setShowForgotPassword(!showForgotPassword)}
                sx={{ textTransform: 'none' }}
              >
                Quên mật khẩu?
              </Button>
            </Box>

            {showForgotPassword && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Nhập email để nhận link reset mật khẩu
                </Typography>
                <Button
                  onClick={handleForgotPassword}
                  variant="outlined"
                  fullWidth
                  sx={{ borderRadius: 2 }}
                >
                  Gửi email reset
                </Button>
              </Box>
            )}
          </Box>

          <Divider sx={{ my: 3 }} />
          <Typography variant="body2" color="text.secondary" align="center">
            © 2024 HealthTips Admin Panel
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default LoginPage;
