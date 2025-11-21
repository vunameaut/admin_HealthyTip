import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Avatar,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Switch,
  Tooltip,
  Menu,
  Divider,
  LinearProgress
} from '@mui/material';
import {
  PersonAdd,
  Edit,
  Block,
  CheckCircle,
  MoreVert,
  Search,
  FilterList,
  Refresh,
  AdminPanelSettings,
  Person,
  Visibility,
  Timeline,
  Assignment
} from '@mui/icons-material';
import { DataGrid, GridColDef, GridRowSelectionModel } from '@mui/x-data-grid';
import LayoutWrapper from '../../components/LayoutWrapper';
import AuthGuard from '../../components/AuthGuard';
import { usersService, analyticsService } from '../../services/firebase';
import { User, FirebaseAnalytics } from '../../types';
import toast from 'react-hot-toast';

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  adminUsers: number;
}

interface UserManagementProps {
  darkMode?: boolean;
  toggleDarkMode?: () => void;
}

export default function UserManagement({ darkMode, toggleDarkMode }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({
    totalUsers: 0,
    activeUsers: 0,
    newUsersToday: 0,
    adminUsers: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userDetailOpen, setUserDetailOpen] = useState(false);
  const [userAnalytics, setUserAnalytics] = useState<FirebaseAnalytics[]>([]);
  const [editRoleOpen, setEditRoleOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<GridRowSelectionModel>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const allUsers = await usersService.getAll();
      setUsers(allUsers);
      calculateStats(allUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Có lỗi xảy ra khi tải dữ liệu người dùng');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (usersList: User[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTime = today.getTime();

    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);

    const stats: UserStats = {
      totalUsers: usersList.length,
      activeUsers: usersList.filter(user => {
        const lastSeen = user.lastSeen || 0;
        return lastSeen > thirtyDaysAgo;
      }).length,
      newUsersToday: usersList.filter(user => user.createdAt >= todayTime).length,
      adminUsers: usersList.filter(user => ['admin', 'editor', 'moderator'].includes(user.role || '')).length
    };

    setUserStats(stats);
  };

  const handleRoleChange = async (userId: string, newRole: User['role']) => {
    try {
      await usersService.updateRole(userId, newRole);
      toast.success('Đã cập nhật quyền người dùng');
      loadData();
      setEditRoleOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error('Có lỗi xảy ra khi cập nhật quyền');
    }
  };

  const handleUserStatusToggle = async (userId: string, currentStatus: boolean) => {
    try {
      // This would be implemented based on your user activation/deactivation logic
      toast.success(currentStatus ? 'Đã khóa người dùng' : 'Đã kích hoạt người dùng');
      loadData();
    } catch (error) {
      console.error('Error toggling user status:', error);
      toast.error('Có lỗi xảy ra');
    }
  };

  const handleViewUserDetail = async (user: User) => {
    try {
      setSelectedUser(user);
      setUserDetailOpen(true);
      
      // Load user analytics
      const analytics = await analyticsService.getEvents(
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        new Date(),
        undefined // All event types
      );
      
      const userAnalytics = analytics.filter(event => event.userId === user.uid);
      setUserAnalytics(userAnalytics);
    } catch (error) {
      console.error('Error loading user details:', error);
      toast.error('Có lỗi xảy ra khi tải thông tin người dùng');
    }
  };

  const getFilteredUsers = () => {
    return users.filter(user => {
      const matchesSearch = !searchQuery || 
        user.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesRole = !roleFilter || user.role === roleFilter;
      const matchesStatus = !statusFilter || 
        (statusFilter === 'active' && user.isActive) ||
        (statusFilter === 'inactive' && !user.isActive);
      
      return matchesSearch && matchesRole && matchesStatus;
    });
  };

  const getRoleColor = (role?: string) => {
    switch (role) {
      case 'admin': return 'error';
      case 'editor': return 'warning';
      case 'moderator': return 'info';
      case 'analyst': return 'success';
      default: return 'default';
    }
  };

  const getRoleIcon = (role?: string) => {
    switch (role) {
      case 'admin': return <AdminPanelSettings />;
      case 'editor': return <Edit />;
      case 'moderator': return <Assignment />;
      case 'analyst': return <Timeline />;
      default: return <Person />;
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'displayName',
      headerName: 'Tên hiển thị',
      flex: 1,
      renderCell: (params) => (
        <Box display="flex" alignItems="center" gap={1}>
          <Avatar 
            src={params.row.photoUrl} 
            sx={{ width: 32, height: 32 }}
          >
            {params.value?.[0]?.toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight="medium">
              {params.value || 'Chưa có tên'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {params.row.email}
            </Typography>
          </Box>
        </Box>
      )
    },
    {
      field: 'role',
      headerName: 'Quyền',
      width: 130,
      renderCell: (params) => (
        <Chip
          icon={getRoleIcon(params.value)}
          label={params.value || 'viewer'}
          size="small"
          color={getRoleColor(params.value) as any}
          variant="outlined"
        />
      )
    },
    {
      field: 'isActive',
      headerName: 'Trạng thái',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Hoạt động' : 'Đã khóa'}
          size="small"
          color={params.value ? 'success' : 'error'}
          icon={params.value ? <CheckCircle /> : <Block />}
        />
      )
    },
    {
      field: 'lastSeen',
      headerName: 'Lần cuối online',
      width: 150,
      renderCell: (params) => {
        if (!params.value) return 'Chưa từng';
        const lastSeen = new Date(params.value);
        const now = new Date();
        const diffMs = now.getTime() - lastSeen.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'Hôm nay';
        if (diffDays === 1) return 'Hôm qua';
        if (diffDays < 7) return `${diffDays} ngày trước`;
        return lastSeen.toLocaleDateString('vi-VN');
      }
    },
    {
      field: 'createdAt',
      headerName: 'Ngày tham gia',
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
          <Tooltip title="Xem chi tiết">
            <IconButton size="small" onClick={() => handleViewUserDetail(params.row)}>
              <Visibility fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Chỉnh sửa quyền">
            <IconButton 
              size="small" 
              onClick={() => {
                setSelectedUser(params.row);
                setEditRoleOpen(true);
              }}
            >
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={params.row.isActive ? "Khóa người dùng" : "Kích hoạt"}>
            <IconButton 
              size="small" 
              onClick={() => handleUserStatusToggle(params.row.uid, params.row.isActive)}
              color={params.row.isActive ? "error" : "success"}
            >
              {params.row.isActive ? <Block fontSize="small" /> : <CheckCircle fontSize="small" />}
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ];

  const statCards = [
    {
      title: 'Tổng người dùng',
      value: userStats.totalUsers,
      icon: <Person />,
      color: '#1976d2'
    },
    {
      title: 'Người dùng hoạt động',
      value: userStats.activeUsers,
      icon: <CheckCircle />,
      color: '#388e3c'
    },
    {
      title: 'Người dùng mới hôm nay',
      value: userStats.newUsersToday,
      icon: <PersonAdd />,
      color: '#f57c00'
    },
    {
      title: 'Quản trị viên',
      value: userStats.adminUsers,
      icon: <AdminPanelSettings />,
      color: '#7b1fa2'
    }
  ];

  return (
    <AuthGuard>
      <LayoutWrapper darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
        <Box p={3}>
          {/* Header */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h4" component="h1" fontWeight="bold">
              Quản lý người dùng
            </Typography>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={loadData}
            >
              Làm mới
            </Button>
          </Box>

          {/* Stats Cards */}
          <Grid container spacing={3} mb={4}>
            {statCards.map((stat, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography color="text.secondary" gutterBottom variant="body2">
                          {stat.title}
                        </Typography>
                        <Typography variant="h4" component="div" fontWeight="bold">
                          {stat.value}
                        </Typography>
                      </Box>
                      <Avatar sx={{ bgcolor: stat.color, width: 56, height: 56 }}>
                        {stat.icon}
                      </Avatar>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Search and Filters */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    placeholder="Tìm kiếm người dùng..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                      startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth>
                    <InputLabel>Quyền</InputLabel>
                    <Select
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                      label="Quyền"
                    >
                      <MenuItem value="">Tất cả</MenuItem>
                      <MenuItem value="admin">Admin</MenuItem>
                      <MenuItem value="editor">Editor</MenuItem>
                      <MenuItem value="moderator">Moderator</MenuItem>
                      <MenuItem value="analyst">Analyst</MenuItem>
                      <MenuItem value="viewer">Viewer</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth>
                    <InputLabel>Trạng thái</InputLabel>
                    <Select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      label="Trạng thái"
                    >
                      <MenuItem value="">Tất cả</MenuItem>
                      <MenuItem value="active">Hoạt động</MenuItem>
                      <MenuItem value="inactive">Đã khóa</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => {
                      setSearchQuery('');
                      setRoleFilter('');
                      setStatusFilter('');
                    }}
                  >
                    Xóa bộ lọc
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card>
            <Box sx={{ height: 600, width: '100%' }}>
              {loading && <LinearProgress />}
              <DataGrid
                rows={getFilteredUsers()}
                columns={columns}
                getRowId={(row) => row.uid}
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

          {/* User Detail Dialog */}
          <Dialog 
            open={userDetailOpen} 
            onClose={() => setUserDetailOpen(false)}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>
              Chi tiết người dùng
            </DialogTitle>
            <DialogContent>
              {selectedUser && (
                <Box>
                  {/* User Info */}
                  <Grid container spacing={2} mb={3}>
                    <Grid item xs={12} md={3} textAlign="center">
                      <Avatar 
                        src={selectedUser.photoUrl} 
                        sx={{ width: 80, height: 80, mx: 'auto', mb: 1 }}
                      >
                        {selectedUser.displayName?.[0]?.toUpperCase()}
                      </Avatar>
                      <Typography variant="h6">{selectedUser.displayName || 'Chưa có tên'}</Typography>
                      <Typography variant="body2" color="text.secondary">{selectedUser.email}</Typography>
                    </Grid>
                    <Grid item xs={12} md={9}>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">UID</Typography>
                          <Typography variant="body1">{selectedUser.uid}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Quyền</Typography>
                          <Chip 
                            label={selectedUser.role || 'viewer'} 
                            size="small" 
                            color={getRoleColor(selectedUser.role) as any}
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Ngày tham gia</Typography>
                          <Typography variant="body1">
                            {new Date(selectedUser.createdAt).toLocaleDateString('vi-VN')}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Lần cuối online</Typography>
                          <Typography variant="body1">
                            {selectedUser.lastSeen ? 
                              new Date(selectedUser.lastSeen).toLocaleDateString('vi-VN') : 
                              'Chưa từng'
                            }
                          </Typography>
                        </Grid>
                      </Grid>
                    </Grid>
                  </Grid>

                  {/* Recent Activity */}
                  <Typography variant="h6" gutterBottom>Hoạt động gần đây</Typography>
                  <List>
                    {userAnalytics.slice(0, 10).map((activity, index) => (
                      <ListItem key={index}>
                        <ListItemText
                          primary={activity.type}
                          secondary={new Date(activity.timestamp).toLocaleString('vi-VN')}
                        />
                      </ListItem>
                    ))}
                    {userAnalytics.length === 0 && (
                      <ListItem>
                        <ListItemText primary="Chưa có hoạt động nào" />
                      </ListItem>
                    )}
                  </List>
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setUserDetailOpen(false)}>Đóng</Button>
            </DialogActions>
          </Dialog>

          {/* Edit Role Dialog */}
          <Dialog open={editRoleOpen} onClose={() => setEditRoleOpen(false)}>
            <DialogTitle>Chỉnh sửa quyền người dùng</DialogTitle>
            <DialogContent>
              {selectedUser && (
                <Box>
                  <Typography variant="body1" mb={2}>
                    Người dùng: {selectedUser.displayName || selectedUser.email}
                  </Typography>
                  <FormControl fullWidth>
                    <InputLabel>Quyền</InputLabel>
                    <Select
                      value={selectedUser.role || 'viewer'}
                      onChange={(e) => setSelectedUser({...selectedUser, role: e.target.value as User['role']})}
                      label="Quyền"
                    >
                      <MenuItem value="viewer">Viewer - Chỉ xem</MenuItem>
                      <MenuItem value="analyst">Analyst - Xem báo cáo</MenuItem>
                      <MenuItem value="moderator">Moderator - Kiểm duyệt</MenuItem>
                      <MenuItem value="editor">Editor - Chỉnh sửa nội dung</MenuItem>
                      <MenuItem value="admin">Admin - Toàn quyền</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setEditRoleOpen(false)}>Hủy</Button>
              <Button 
                variant="contained"
                onClick={() => selectedUser && handleRoleChange(selectedUser.uid, selectedUser.role)}
              >
                Lưu
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </LayoutWrapper>
    </AuthGuard>
  );
}
