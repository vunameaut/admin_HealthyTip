import React from 'react';
import { useTheme } from '@mui/material/styles';
import { Box } from '@mui/material';

interface LogoProps {
  size?: 'small' | 'medium' | 'large' | 'xl';
}

const Logo: React.FC<LogoProps> = ({ size = 'medium' }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  
  const dimensions = {
    small: 24,
    medium: 32,
    large: 40,
    xl: 56
  };

  const logoSize = dimensions[size];

  return (
    <Box
      component="img"
      src={isDark ? '/images/logos/cu_black_rmbg.png' : '/images/logos/cu_night_rmbg.png'}
      alt="HealthTips Smart Logo"
      sx={{
        width: logoSize,
        height: logoSize,
        objectFit: 'contain',
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          transform: 'scale(1.05)',
        }
      }}
    />
  );
};

export default Logo;
