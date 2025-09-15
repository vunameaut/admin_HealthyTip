import React from 'react';
import { Box, Typography } from '@mui/material';
import LayoutWrapper from '../../components/LayoutWrapper';
import AuthGuard from '../../components/AuthGuard';
import MediaUploadForm from '../../components/MediaUploadForm';

export default function MediaUploadPage() {
  return (
    <AuthGuard>
      <LayoutWrapper>
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
