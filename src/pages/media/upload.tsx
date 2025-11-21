import React from 'react';
import { Box, Typography } from '@mui/material';
import LayoutWrapper from '../../components/LayoutWrapper';
import AuthGuard from '../../components/AuthGuard';
import MediaUploadForm from '../../components/MediaUploadForm';

interface MediaUploadPageProps {
  darkMode?: boolean;
  toggleDarkMode?: () => void;
}

export default function MediaUploadPage({ darkMode, toggleDarkMode }: MediaUploadPageProps) {
  return (
    <AuthGuard>
      <LayoutWrapper darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
        <Box sx={{ p: 3 }}>
          <Typography variant="h4" sx={{ mb: 3 }}>
            Upload Media
          </Typography>
          <MediaUploadForm />
        </Box>
      </LayoutWrapper>
    </AuthGuard>
  );
}
