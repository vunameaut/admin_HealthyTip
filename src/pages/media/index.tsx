import React, { useState } from 'react';
import { NextPage } from 'next';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Paper
} from '@mui/material';
import { CloudUpload, PhotoLibrary } from '@mui/icons-material';
import DashboardLayout from '../../components/DashboardLayout';
import MediaUploadForm from '../../components/MediaUploadForm';
import MediaLibrary from '../../components/MediaLibrary';
import { Media } from '../../types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index, ...other }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`media-tabpanel-${index}`}
      aria-labelledby={`media-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

const MediaPage: NextPage = () => {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleUploadComplete = (newMedia: Media[]) => {
    // Switch to library tab after successful upload
    setActiveTab(1);
  };

  return (
    <DashboardLayout>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Typography variant="h4" gutterBottom>
          Quản lý Media
        </Typography>

        <Typography variant="body1" color="text.secondary" paragraph>
          Upload và quản lý ảnh, video cho HealthyTip Admin
        </Typography>

        <Paper sx={{ width: '100%' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={activeTab} onChange={handleTabChange}>
              <Tab
                icon={<CloudUpload />}
                label="Upload Media"
                id="media-tab-0"
                aria-controls="media-tabpanel-0"
              />
              <Tab
                icon={<PhotoLibrary />}
                label="Thư viện Media"
                id="media-tab-1"
                aria-controls="media-tabpanel-1"
              />
            </Tabs>
          </Box>

          <TabPanel value={activeTab} index={0}>
            <Box sx={{ p: 3 }}>
              <MediaUploadForm onUploadComplete={handleUploadComplete} />
            </Box>
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            <Box sx={{ p: 3 }}>
              <MediaLibrary />
            </Box>
          </TabPanel>
        </Paper>
      </Container>
    </DashboardLayout>
  );
};

export default MediaPage;
