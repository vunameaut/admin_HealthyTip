import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Fab,
  Tooltip,
  Avatar,
  Menu,
  ListItemIcon,
  ListItemText,
  Checkbox,
  FormGroup,
  FormControlLabel,
  Alert,
  LinearProgress
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
  MoreVert,
  FilterList,
  Search,
  Publish,
  Archive,
  Star,
  StarBorder,
  FileDownload,
  FileUpload,
  Refresh
} from '@mui/icons-material';
import { DataGrid, GridColDef, GridRowSelectionModel } from '@mui/x-data-grid';
import LayoutWrapper from '../../components/LayoutWrapper';
import AuthGuard from '../../components/AuthGuard';
import { healthTipsService, categoriesService, analyticsService } from '../../services/firebase';
import { HealthTip, Category, FilterOptions } from '../../types';
import toast from 'react-hot-toast';

interface ContentManagementPageProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export default function ContentManagement({ darkMode, toggleDarkMode }: ContentManagementPageProps) {
  const router = useRouter();
  const [healthTips, setHealthTips] = useState<HealthTip[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRows, setSelectedRows] = useState<GridRowSelectionModel>([]);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [bulkActionMenuAnchor, setBulkActionMenuAnchor] = useState<null | HTMLElement>(null);
  const [filters, setFilters] = useState<FilterOptions>({});
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tips, cats] = await Promise.all([
        healthTipsService.getAll(filters),
        categoriesService.getAll()
      ]);
      
      // Filter by search query
      let filteredTips = tips;
      if (searchQuery) {
        filteredTips = tips.filter(tip => 
          tip.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tip.content.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      setHealthTips(filteredTips);
      setCategories(cats);
    } catch (error) {
      console.error('Error loading content:', error);
      toast.error('Có lỗi xảy ra khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAction = async (action: string) => {
    try {
      const selectedIds = selectedRows as string[];
      
      switch (action) {
        case 'publish':
          await Promise.all(
            selectedIds.map(id => 
              healthTipsService.update(id, { status: 'published', publishedAt: Date.now() })
            )
          );
          toast.success(`Đã xuất bản ${selectedIds.length} bài viết`);
          break;
          
        case 'unpublish':
          await Promise.all(
            selectedIds.map(id => 
              healthTipsService.update(id, { status: 'draft' })
            )
          );
          toast.success(`Đã hủy xuất bản ${selectedIds.length} bài viết`);
          break;
          
        case 'archive':
          await Promise.all(
            selectedIds.map(id => 
              healthTipsService.update(id, { status: 'archived' })
            )
          );
          toast.success(`Đã lưu trữ ${selectedIds.length} bài viết`);
          break;
          
        case 'feature':
          await Promise.all(
            selectedIds.map(id => 
              healthTipsService.update(id, { isFeature: true })
            )
          );
          toast.success(`Đã đặt làm nổi bật ${selectedIds.length} bài viết`);
          break;
          
        case 'delete':
          if (window.confirm(`Bạn có chắc muốn xóa ${selectedIds.length} bài viết?`)) {
            await Promise.all(selectedIds.map(id => healthTipsService.delete(id)));
            toast.success(`Đã xóa ${selectedIds.length} bài viết`);
          }
          break;
      }
      
      setSelectedRows([]);
      setBulkActionMenuAnchor(null);
      loadData();
    } catch (error) {
      console.error('Error performing bulk action:', error);
      toast.error('Có lỗi xảy ra khi thực hiện thao tác');
    }
  };

  const handleFeatureToggle = async (id: string, currentStatus: boolean) => {
    try {
      await healthTipsService.update(id, { isFeature: !currentStatus });
      toast.success(currentStatus ? 'Đã bỏ nổi bật' : 'Đã đặt làm nổi bật');
      loadData();
    } catch (error) {
      console.error('Error toggling feature status:', error);
      toast.error('Có lỗi xảy ra');
    }
  };

  const exportData = () => {
    const dataToExport = healthTips.map(tip => ({
      id: tip.id,
      title: tip.title,
      content: tip.content,
      category: categories.find(c => c.id === tip.categoryId)?.name || '',
      status: tip.status,
      viewCount: tip.viewCount,
      likeCount: tip.likeCount,
      createdAt: new Date(tip.createdAt).toLocaleDateString('vi-VN'),
      author: tip.author
    }));

    const dataStr = JSON.stringify(dataToExport, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `health-tips-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const columns: GridColDef[] = [
    {
      field: 'title',
      headerName: 'Tiêu đề',
      flex: 1,
      minWidth: 200,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" fontWeight="medium">
            {params.value}
          </Typography>
          {params.row.isFeature && (
            <Chip label="Nổi bật" size="small" color="primary" variant="outlined" />
          )}
        </Box>
      )
    },
    {
      field: 'categoryId',
      headerName: 'Danh mục',
      width: 120,
      renderCell: (params) => {
        const category = categories.find(c => c.id === params.value);
        return category ? (
          <Chip 
            label={category.name} 
            size="small" 
            style={{ backgroundColor: category.color, color: 'white' }}
          />
        ) : '-';
      }
    },
    {
      field: 'status',
      headerName: 'Trạng thái',
      width: 120,
      renderCell: (params) => {
        const statusColors = {
          published: 'success',
          draft: 'warning',
          archived: 'default',
          review: 'info'
        };
        return (
          <Chip 
            label={params.value || 'published'} 
            size="small" 
            color={statusColors[params.value as keyof typeof statusColors] as any}
          />
        );
      }
    },
    {
      field: 'viewCount',
      headerName: 'Lượt xem',
      width: 100,
      type: 'number',
      renderCell: (params) => (
        <Box display="flex" alignItems="center" gap={0.5}>
          <Visibility fontSize="small" color="action" />
          {params.value || 0}
        </Box>
      )
    },
    {
      field: 'likeCount',
      headerName: 'Lượt thích',
      width: 100,
      type: 'number',
      renderCell: (params) => (
        <Box display="flex" alignItems="center" gap={0.5}>
          <Avatar sx={{ width: 16, height: 16, bgcolor: 'transparent' }}>❤️</Avatar>
          {params.value || 0}
        </Box>
      )
    },
    {
      field: 'createdAt',
      headerName: 'Ngày tạo',
      width: 120,
      renderCell: (params) => 
        new Date(params.value).toLocaleDateString('vi-VN')
    },
    {
      field: 'actions',
      headerName: 'Thao tác',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <Tooltip title="Chỉnh sửa">
            <IconButton size="small" onClick={() => router.push(`/content/edit/${params.row.id}`)}>
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={params.row.isFeature ? "Bỏ nổi bật" : "Đặt làm nổi bật"}>
            <IconButton 
              size="small" 
              onClick={() => handleFeatureToggle(params.row.id, params.row.isFeature)}
            >
              {params.row.isFeature ? <Star fontSize="small" color="warning" /> : <StarBorder fontSize="small" />}
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ];

  return (
    <AuthGuard>
      <LayoutWrapper darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
        <Box p={3}>
          {/* Header */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h4" component="h1" fontWeight="bold">
              Quản lý nội dung
            </Typography>
            <Box display="flex" gap={1}>
              <Button
                variant="outlined"
                startIcon={<FileDownload />}
                onClick={exportData}
                disabled={healthTips.length === 0}
              >
                Xuất dữ liệu
              </Button>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={loadData}
              >
                Làm mới
              </Button>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => window.open('/content/create', '_blank')}
              >
                Tạo bài viết
              </Button>
            </Box>
          </Box>

          {/* Search and Filters */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    placeholder="Tìm kiếm bài viết..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                      startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth>
                    <InputLabel>Danh mục</InputLabel>
                    <Select
                      value={filters.category || ''}
                      onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                      label="Danh mục"
                    >
                      <MenuItem value="">Tất cả</MenuItem>
                      {categories.map(cat => (
                        <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth>
                    <InputLabel>Trạng thái</InputLabel>
                    <Select
                      value={filters.status || ''}
                      onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                      label="Trạng thái"
                    >
                      <MenuItem value="">Tất cả</MenuItem>
                      <MenuItem value="published">Đã xuất bản</MenuItem>
                      <MenuItem value="draft">Bản nháp</MenuItem>
                      <MenuItem value="archived">Lưu trữ</MenuItem>
                      <MenuItem value="review">Chờ duyệt</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => setFilters({})}
                  >
                    Xóa bộ lọc
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Bulk Actions */}
          {selectedRows.length > 0 && (
            <Alert 
              severity="info" 
              sx={{ mb: 2 }}
              action={
                <Button
                  size="small"
                  onClick={(e) => setBulkActionMenuAnchor(e.currentTarget)}
                >
                  Thao tác hàng loạt ({selectedRows.length})
                </Button>
              }
            >
              Đã chọn {selectedRows.length} bài viết
            </Alert>
          )}

          {/* Data Grid */}
          <Card>
            <Box sx={{ height: 600, width: '100%' }}>
              {loading && <LinearProgress />}
              <DataGrid
                rows={healthTips}
                columns={columns}
                checkboxSelection
                disableRowSelectionOnClick
                rowSelectionModel={selectedRows}
                onRowSelectionModelChange={setSelectedRows}
                pageSizeOptions={[25, 50, 100]}
                initialState={{
                  pagination: { paginationModel: { pageSize: 25 } }
                }}
                localeText={{
                  noRowsLabel: 'Không có dữ liệu',
                  MuiTablePagination: {
                    labelRowsPerPage: 'Số hàng mỗi trang:'
                  }
                }}
              />
            </Box>
          </Card>

          {/* Bulk Actions Menu */}
          <Menu
            anchorEl={bulkActionMenuAnchor}
            open={Boolean(bulkActionMenuAnchor)}
            onClose={() => setBulkActionMenuAnchor(null)}
          >
            <MenuItem onClick={() => handleBulkAction('publish')}>
              <ListItemIcon><Publish fontSize="small" /></ListItemIcon>
              <ListItemText>Xuất bản</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => handleBulkAction('unpublish')}>
              <ListItemIcon><Archive fontSize="small" /></ListItemIcon>
              <ListItemText>Hủy xuất bản</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => handleBulkAction('feature')}>
              <ListItemIcon><Star fontSize="small" /></ListItemIcon>
              <ListItemText>Đặt làm nổi bật</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => handleBulkAction('archive')}>
              <ListItemIcon><Archive fontSize="small" /></ListItemIcon>
              <ListItemText>Lưu trữ</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => handleBulkAction('delete')} sx={{ color: 'error.main' }}>
              <ListItemIcon><Delete fontSize="small" color="error" /></ListItemIcon>
              <ListItemText>Xóa</ListItemText>
            </MenuItem>
          </Menu>

          {/* FAB for quick add */}
          <Fab
            color="primary"
            aria-label="add"
            sx={{ position: 'fixed', bottom: 16, right: 16 }}
            onClick={() => window.open('/content/create', '_blank')}
          >
            <Add />
          </Fab>
        </Box>
      </LayoutWrapper>
    </AuthGuard>
  );
}
