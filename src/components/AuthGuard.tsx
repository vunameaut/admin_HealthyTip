import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Box, CircularProgress, Typography } from '@mui/material';
import { auth, database } from '@/lib/firebase';
import { ref, get } from 'firebase/database';
import { User } from '@/types';
import toast from 'react-hot-toast';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRoles?: ('admin' | 'editor' | 'moderator' | 'analyst' | 'viewer')[];
}

export default function AuthGuard({ children, requiredRoles = ['admin', 'editor'] }: AuthGuardProps) {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          // Lấy thông tin user từ database
          const userRef = ref(database, `users/${user.uid}`);
          const snapshot = await get(userRef);
          const userData = snapshot.val();

          if (userData) {
            const userWithUid = { ...userData, uid: user.uid };
            
            // Kiểm tra role
            if (requiredRoles.includes(userData.role)) {
              setCurrentUser(userWithUid);
              setAuthorized(true);
            } else {
              toast.error('Bạn không có quyền truy cập trang này');
              router.push('/');
              return;
            }
          } else {
            toast.error('Thông tin người dùng không tồn tại');
            auth.signOut();
            router.push('/');
            return;
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          toast.error('Có lỗi xảy ra khi xác thực người dùng');
          router.push('/');
          return;
        }
      } else {
        // Không có user đăng nhập
        router.push('/');
        return;
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router, requiredRoles]);

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          gap: 2,
        }}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" color="text.secondary">
          Đang xác thực...
        </Typography>
      </Box>
    );
  }

  if (!authorized) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          gap: 2,
        }}
      >
        <Typography variant="h5" color="error">
          Không có quyền truy cập
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Bạn không có quyền truy cập trang này.
        </Typography>
      </Box>
    );
  }

  return <>{children}</>;
}

// Custom hook để sử dụng current user
export const useCurrentUser = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const userRef = ref(database, `users/${user.uid}`);
          const snapshot = await get(userRef);
          const userData = snapshot.val();
          
          if (userData) {
            setCurrentUser({ ...userData, uid: user.uid });
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { currentUser, loading };
};
