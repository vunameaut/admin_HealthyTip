import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
} from '@mui/material';
import {
  Add,
  FileDownload,
  FileUpload,
  Collections,
} from '@mui/icons-material';

export default function CollectionsPage() {
  const [collections, setCollections] = useState([]);

  const handleExport = () => {
    const dataToExport = collections.map(collection => ({
      id: collection.id,
      name: collection.name,
      description: collection.description,
      type: collection.type,
      items: collection.items || [],
      featured: collection.featured
    }));

    const dataStr = JSON.stringify(dataToExport, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `collections-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImport = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result;
        const importedCollections = JSON.parse(content);
        
        if (!Array.isArray(importedCollections)) {
          alert('File không đúng định dạng!');
          return;
        }

        setCollections(importedCollections);
        alert(`Nhập thành công ${importedCollections.length} bộ sưu tập!`);
      } catch (error) {
        alert('Có lỗi khi nhập dữ liệu!');
      }
    };
    
    reader.readAsText(file);
    event.target.value = '';
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Collections sx={{ fontSize: 32, color: '#4CAF50' }} />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#2E7D32' }}>
              Quản lý Bộ sưu tập
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Tạo và quản lý bộ sưu tập nội dung
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {/* Export Button */}
          <Button
            variant="outlined"
            startIcon={<FileDownload />}
            onClick={handleExport}
            disabled={collections.length === 0}
            sx={{
              borderColor: '#4CAF50',
              color: '#4CAF50',
            }}
          >
            Xuất dữ liệu
          </Button>
          
          {/* Import Button */}
          <Button
            variant="outlined"
            component="label"
            startIcon={<FileUpload />}
            sx={{
              borderColor: '#2196F3',
              color: '#2196F3',
            }}
          >
            Nhập dữ liệu
            <input
              type="file"
              hidden
              accept=".json"
              onChange={handleImport}
            />
          </Button>
          
          {/* Add Collection Button */}
          <Button
            variant="contained"
            startIcon={<Add />}
            sx={{
              background: 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)',
            }}
          >
            Thêm Bộ sưu tập
          </Button>
        </Box>
      </Box>

      {/* Content */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Danh sách bộ sưu tập
          </Typography>
          
          {collections.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              Chưa có bộ sưu tập nào. Hãy thêm bộ sưu tập mới hoặc nhập từ file JSON.
            </Typography>
          ) : (
            <Typography variant="body1">
              Có {collections.length} bộ sưu tập
            </Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
