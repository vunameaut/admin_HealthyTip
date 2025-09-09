import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import Logo from './Logo';

interface HeaderProps {
  darkMode?: boolean;
  size?: 'small' | 'medium' | 'large' | 'xl';
}

const Header: React.FC<HeaderProps> = ({ darkMode = false, size = 'medium' }) => {
  const theme = useTheme();
  
  const sizeConfig = {
    small: { logoSize: 'small' as const, titleVariant: 'h6' as const, subtitleVariant: 'caption' as const },
    medium: { logoSize: 'medium' as const, titleVariant: 'h5' as const, subtitleVariant: 'body2' as const },
    large: { logoSize: 'large' as const, titleVariant: 'h4' as const, subtitleVariant: 'body1' as const },
    xl: { logoSize: 'xl' as const, titleVariant: 'h3' as const, subtitleVariant: 'h6' as const },
  };

  const config = sizeConfig[size];

  return (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: 2,
      width: '100%',
      minWidth: 'fit-content' // Đảm bảo có đủ không gian cho nội dung
    }}>
      <Logo size={config.logoSize} />
      <Box sx={{ 
        flex: 1,
        minWidth: 'fit-content' // Text sẽ hiển thị đầy đủ
      }}>
        <Typography
          variant={config.titleVariant}
          fontWeight="bold"
          sx={{
            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: size === 'small' ? 0 : 0.5,
          }}
        >
          HealthyTip Admin
        </Typography>
        {size !== 'small' && (
          <Typography
            variant={config.subtitleVariant}
            color="text.secondary"
            sx={{ fontSize: size === 'large' ? '1rem' : '0.85rem' }}
          >
            Wisdom Admin Panel
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default Header;
