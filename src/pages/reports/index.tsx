import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as ViewIcon,
  BugReport as BugIcon,
  Feedback as FeedbackIcon,
  Help as QuestionIcon,
  MoreHoriz as OtherIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  FiberManualRecord as UnreadIcon,
} from '@mui/icons-material';
import { ref, get, onValue, off, query, orderByChild } from 'firebase/database';
import { database } from '@/lib/firebase';
import DashboardLayout from '@/components/DashboardLayout';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

// Types
interface Report {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  title: string;
  content: string;
  imageUrl?: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'closed';
  createdAt: number;
  updatedAt: number;
  lastMessageAt?: number;
  lastMessagePreview?: string;
  deviceInfo?: string;
  hasUnreadUserMessage?: boolean; // NEW: Flag để đánh dấu có tin nhắn chưa đọc từ user
  lastUserMessageAt?: number; // NEW: Timestamp của tin nhắn cuối từ user
}

interface ReportStats {
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
  closed: number;
}

// Status config
const statusConfig = {
  pending: { label: 'Chưa xử lý', color: 'warning' as const },
  in_progress: { label: 'Đang trao đổi', color: 'info' as const },
  resolved: { label: 'Đã xử lý', color: 'success' as const },
  closed: { label: 'Đã đóng', color: 'default' as const },
};

// Report type config
const reportTypeConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  bug: { label: 'Báo cáo lỗi', icon: <BugIcon />, color: '#F44336' },
  feedback: { label: 'Góp ý', icon: <FeedbackIcon />, color: '#2196F3' },
  question: { label: 'Câu hỏi', icon: <QuestionIcon />, color: '#9C27B0' },
  other: { label: 'Khác', icon: <OtherIcon />, color: '#607D8B' },
};

export default function ReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<ReportStats>({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0,
  });

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Load reports from Firebase
  useEffect(() => {
    const reportsRef = ref(database, 'reports');
    
    const unsubscribe = onValue(reportsRef, (snapshot) => {
      setLoading(false);
      if (snapshot.exists()) {
        const data = snapshot.val();
        const reportsArray: Report[] = Object.entries(data).map(([id, value]: [string, any]) => ({
          id,
          ...value,
        }));
        
        // Sort by createdAt descending
        reportsArray.sort((a, b) => b.createdAt - a.createdAt);
        
        setReports(reportsArray);
        
        // Calculate stats
        const newStats: ReportStats = {
          total: reportsArray.length,
          pending: reportsArray.filter(r => r.status === 'pending').length,
          inProgress: reportsArray.filter(r => r.status === 'in_progress').length,
          resolved: reportsArray.filter(r => r.status === 'resolved').length,
          closed: reportsArray.filter(r => r.status === 'closed').length,
        };
        setStats(newStats);
      } else {
        setReports([]);
        setStats({ total: 0, pending: 0, inProgress: 0, resolved: 0, closed: 0 });
      }
    }, (error) => {
      setLoading(false);
      setError('Không thể tải danh sách báo cáo');
      console.error('Error loading reports:', error);
    });

    return () => off(reportsRef);
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...reports];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r =>
        r.content?.toLowerCase().includes(query) ||
        r.userName?.toLowerCase().includes(query) ||
        r.userEmail?.toLowerCase().includes(query) ||
        r.id.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(r => r.title === typeFilter);
    }

    setFilteredReports(filtered);
    setPage(0); // Reset to first page when filters change
  }, [reports, searchQuery, statusFilter, typeFilter]);

  const handleViewReport = (reportId: string) => {
    router.push(`/reports/${reportId}`);
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const formatTime = (timestamp: number) => {
    if (!timestamp) return 'N/A';
    return format(new Date(timestamp), 'dd/MM/yyyy HH:mm', { locale: vi });
  };

  const getReportTypeInfo = (type: string) => {
    return reportTypeConfig[type] || reportTypeConfig.other;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" fontWeight="bold">
            Quản lý Báo cáo
          </Typography>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => window.location.reload()}
          >
            Làm mới
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Stats Cards */}
        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" fontWeight="bold">
                  {stats.total}
                </Typography>
                <Typography color="textSecondary">Tổng cộng</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ borderLeft: 4, borderColor: 'warning.main' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" fontWeight="bold" color="warning.main">
                  {stats.pending}
                </Typography>
                <Typography color="textSecondary">Chưa xử lý</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ borderLeft: 4, borderColor: 'info.main' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" fontWeight="bold" color="info.main">
                  {stats.inProgress}
                </Typography>
                <Typography color="textSecondary">Đang trao đổi</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ borderLeft: 4, borderColor: 'success.main' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" fontWeight="bold" color="success.main">
                  {stats.resolved}
                </Typography>
                <Typography color="textSecondary">Đã xử lý</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ borderLeft: 4, borderColor: 'grey.500' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" fontWeight="bold" color="grey.600">
                  {stats.closed}
                </Typography>
                <Typography color="textSecondary">Đã đóng</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                placeholder="Tìm kiếm theo nội dung, người dùng, ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Trạng thái</InputLabel>
                <Select
                  value={statusFilter}
                  label="Trạng thái"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="all">Tất cả</MenuItem>
                  <MenuItem value="pending">Chưa xử lý</MenuItem>
                  <MenuItem value="in_progress">Đang trao đổi</MenuItem>
                  <MenuItem value="resolved">Đã xử lý</MenuItem>
                  <MenuItem value="closed">Đã đóng</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Loại báo cáo</InputLabel>
                <Select
                  value={typeFilter}
                  label="Loại báo cáo"
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <MenuItem value="all">Tất cả</MenuItem>
                  <MenuItem value="bug">Báo cáo lỗi</MenuItem>
                  <MenuItem value="feedback">Góp ý</MenuItem>
                  <MenuItem value="question">Câu hỏi</MenuItem>
                  <MenuItem value="other">Khác</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Typography variant="body2" color="textSecondary">
                {filteredReports.length} kết quả
              </Typography>
            </Grid>
          </Grid>
        </Paper>

        {/* Reports Table */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Loại</TableCell>
                <TableCell>Người gửi</TableCell>
                <TableCell>Nội dung</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell>Thời gian</TableCell>
                <TableCell align="center">Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredReports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography color="textSecondary">
                      Không có báo cáo nào
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredReports
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((report) => {
                    const typeInfo = getReportTypeInfo(report.title);
                    return (
                      <TableRow
                        key={report.id}
                        hover
                        sx={{ 
                          cursor: 'pointer',
                          bgcolor: report.hasUnreadUserMessage ? 'action.hover' : 'inherit',
                        }}
                        onClick={() => handleViewReport(report.id)}
                      >
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            {report.hasUnreadUserMessage && (
                              <UnreadIcon 
                                sx={{ 
                                  fontSize: 12, 
                                  color: 'error.main',
                                  animation: 'pulse 1.5s ease-in-out infinite',
                                  '@keyframes pulse': {
                                    '0%, 100%': { opacity: 1 },
                                    '50%': { opacity: 0.5 },
                                  },
                                }} 
                              />
                            )}
                            <Typography variant="body2" fontFamily="monospace">
                              {report.id.substring(0, 8).toUpperCase()}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={typeInfo.icon as any}
                            label={typeInfo.label}
                            size="small"
                            sx={{
                              bgcolor: typeInfo.color,
                              color: 'white',
                              '& .MuiChip-icon': { color: 'white' },
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="500">
                            {report.userName || 'Unknown'}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {report.userEmail}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ maxWidth: 300 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                            }}
                          >
                            {report.content}
                          </Typography>
                          {report.imageUrl && (
                            <Chip
                              label="Có ảnh"
                              size="small"
                              variant="outlined"
                              sx={{ mt: 0.5 }}
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={statusConfig[report.status]?.label || report.status}
                            color={statusConfig[report.status]?.color || 'default'}
                            size="small"
                          />
                          {report.hasUnreadUserMessage && (
                            <Chip
                              label="Tin nhắn mới"
                              size="small"
                              color="error"
                              variant="outlined"
                              sx={{ ml: 0.5 }}
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatTime(report.createdAt)}
                          </Typography>
                          {report.lastMessageAt && (
                            <Typography variant="caption" color="textSecondary">
                              Cập nhật: {formatTime(report.lastMessageAt)}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            color="primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewReport(report.id);
                            }}
                          >
                            <ViewIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })
              )}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={filteredReports.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50]}
            labelRowsPerPage="Số hàng mỗi trang:"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} trong ${count}`
            }
          />
        </TableContainer>
      </Box>
    </DashboardLayout>
  );
}

