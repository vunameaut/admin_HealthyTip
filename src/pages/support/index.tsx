import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
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
  Chip,
  Avatar,
  IconButton,
  LinearProgress,
  Paper,
  List,
  ListItem,
  Divider,
  InputAdornment
} from '@mui/material';
import {
  Refresh,
  Search,
  FilterList,
  Support,
  PendingActions,
  HourglassEmpty,
  CheckCircle,
  Send,
  Close,
  Image as ImageIcon,
  AttachFile
} from '@mui/icons-material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import LayoutWrapper from '../../components/LayoutWrapper';
import AuthGuard from '../../components/AuthGuard';
import { supportService } from '../../services/firebase';
import { SupportTicket, SupportMessage } from '../../types';
import toast from 'react-hot-toast';
import { auth } from '../../lib/firebase';

interface SupportStats {
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
}

interface SupportManagementProps {
  darkMode?: boolean;
  toggleDarkMode?: () => void;
}

export default function SupportManagement({ darkMode, toggleDarkMode }: SupportManagementProps) {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [stats, setStats] = useState<SupportStats>({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [issueTypeFilter, setIssueTypeFilter] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (chatOpen && selectedTicket) {
      loadMessages();
      const interval = setInterval(loadMessages, 5000); // Poll every 5 seconds
      return () => clearInterval(interval);
    }
  }, [chatOpen, selectedTicket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [allTickets, statsData] = await Promise.all([
        supportService.getAll(),
        supportService.getStats()
      ]);
      setTickets(allTickets);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading support tickets:', error);
      toast.error('Có lỗi xảy ra khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    if (!selectedTicket) return;
    try {
      const ticketMessages = await supportService.getMessages(selectedTicket.id);
      setMessages(ticketMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleOpenChat = async (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setChatOpen(true);
  };

  const handleCloseChat = () => {
    setChatOpen(false);
    setSelectedTicket(null);
    setMessages([]);
    setMessageText('');
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedTicket) return;

    const currentUser = auth.currentUser;
    if (!currentUser) {
      toast.error('Vui lòng đăng nhập');
      return;
    }

    setSendingMessage(true);
    try {
      const message: Omit<SupportMessage, 'id'> = {
        text: messageText,
        senderId: currentUser.uid,
        senderType: 'admin',
        senderName: currentUser.email || 'Admin',
        timestamp: Date.now()
      };

      await supportService.sendMessage(selectedTicket.id, message);
      setMessageText('');
      await loadMessages();
      await loadData(); // Refresh ticket list
      toast.success('Đã gửi tin nhắn');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Có lỗi xảy ra khi gửi tin nhắn');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleUpdateStatus = async (ticketId: string, newStatus: 'pending' | 'in_progress' | 'resolved') => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      toast.error('Vui lòng đăng nhập');
      return;
    }

    try {
      await supportService.updateStatus(ticketId, newStatus, currentUser.uid);
      toast.success('Đã cập nhật trạng thái');
      await loadData();

      // Update selected ticket if it's the one being updated
      if (selectedTicket?.id === ticketId) {
        const updatedTicket = await supportService.getById(ticketId);
        if (updatedTicket) {
          setSelectedTicket(updatedTicket);
        }
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Có lỗi xảy ra khi cập nhật trạng thái');
    }
  };

  const getFilteredTickets = () => {
    return tickets.filter(ticket => {
      const matchesSearch = !searchQuery ||
        ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.userEmail.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = !statusFilter || ticket.status === statusFilter;
      const matchesIssueType = !issueTypeFilter || ticket.issueType === issueTypeFilter;

      return matchesSearch && matchesStatus && matchesIssueType;
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'in_progress': return 'info';
      case 'resolved': return 'success';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Đang chờ';
      case 'in_progress': return 'Đang xử lý';
      case 'resolved': return 'Đã giải quyết';
      default: return status;
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'id',
      headerName: 'Ticket ID',
      width: 100,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight="medium">
          #{params.value.substring(0, 8).toUpperCase()}
        </Typography>
      )
    },
    {
      field: 'userEmail',
      headerName: 'Người dùng',
      flex: 1,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" fontWeight="medium">
            {params.row.userName || 'N/A'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {params.value}
          </Typography>
        </Box>
      )
    },
    {
      field: 'issueType',
      headerName: 'Loại',
      width: 130
    },
    {
      field: 'subject',
      headerName: 'Tiêu đề',
      flex: 1,
      renderCell: (params) => (
        <Typography variant="body2" noWrap>
          {params.value}
        </Typography>
      )
    },
    {
      field: 'status',
      headerName: 'Trạng thái',
      width: 150,
      renderCell: (params) => (
        <Chip
          label={getStatusLabel(params.value)}
          size="small"
          color={getStatusColor(params.value) as any}
        />
      )
    },
    {
      field: 'timestamp',
      headerName: 'Ngày tạo',
      width: 150,
      renderCell: (params) => {
        const date = new Date(params.value);
        return (
          <Typography variant="caption">
            {date.toLocaleDateString('vi-VN')} {date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
          </Typography>
        );
      }
    },
    {
      field: 'actions',
      headerName: 'Thao tác',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Button
          size="small"
          variant="outlined"
          onClick={() => handleOpenChat(params.row)}
        >
          Xem
        </Button>
      )
    }
  ];

  const statCards = [
    {
      title: 'Tổng số ticket',
      value: stats.total,
      icon: <Support />,
      color: '#1976d2'
    },
    {
      title: 'Đang chờ',
      value: stats.pending,
      icon: <HourglassEmpty />,
      color: '#ed6c02'
    },
    {
      title: 'Đang xử lý',
      value: stats.inProgress,
      icon: <PendingActions />,
      color: '#0288d1'
    },
    {
      title: 'Đã giải quyết',
      value: stats.resolved,
      icon: <CheckCircle />,
      color: '#2e7d32'
    }
  ];

  return (
    <AuthGuard>
      <LayoutWrapper darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
        <Box p={3}>
          {/* Header */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h4" component="h1" fontWeight="bold">
              Quản lý hỗ trợ
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
                    placeholder="Tìm kiếm ticket..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search />
                        </InputAdornment>
                      )
                    }}
                  />
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
                      <MenuItem value="pending">Đang chờ</MenuItem>
                      <MenuItem value="in_progress">Đang xử lý</MenuItem>
                      <MenuItem value="resolved">Đã giải quyết</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth>
                    <InputLabel>Loại vấn đề</InputLabel>
                    <Select
                      value={issueTypeFilter}
                      onChange={(e) => setIssueTypeFilter(e.target.value)}
                      label="Loại vấn đề"
                    >
                      <MenuItem value="">Tất cả</MenuItem>
                      <MenuItem value="bug">Lỗi</MenuItem>
                      <MenuItem value="feature">Tính năng</MenuItem>
                      <MenuItem value="question">Câu hỏi</MenuItem>
                      <MenuItem value="other">Khác</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('');
                      setIssueTypeFilter('');
                    }}
                  >
                    Xóa bộ lọc
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Tickets Table */}
          <Card>
            <Box sx={{ height: 600, width: '100%' }}>
              {loading && <LinearProgress />}
              <DataGrid
                rows={getFilteredTickets()}
                columns={columns}
                getRowId={(row) => row.id}
                disableRowSelectionOnClick
                pageSizeOptions={[25, 50, 100]}
                initialState={{
                  pagination: { paginationModel: { pageSize: 25 } }
                }}
                localeText={{
                  noRowsLabel: 'Không có ticket nào',
                  MuiTablePagination: {
                    labelRowsPerPage: 'Số hàng mỗi trang:'
                  }
                }}
              />
            </Box>
          </Card>

          {/* Chat Dialog */}
          <Dialog
            open={chatOpen}
            onClose={handleCloseChat}
            maxWidth="md"
            fullWidth
            PaperProps={{
              sx: { height: '80vh', display: 'flex', flexDirection: 'column' }
            }}
          >
            {selectedTicket && (
              <>
                <DialogTitle>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="h6">
                        #{selectedTicket.id.substring(0, 8).toUpperCase()} - {selectedTicket.subject}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {selectedTicket.userEmail} • {selectedTicket.issueType}
                      </Typography>
                    </Box>
                    <IconButton onClick={handleCloseChat}>
                      <Close />
                    </IconButton>
                  </Box>
                </DialogTitle>

                <Divider />

                {/* Ticket Info */}
                <Box p={2} bgcolor="background.default">
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">
                        Mô tả vấn đề:
                      </Typography>
                      <Typography variant="body1">
                        {selectedTicket.description}
                      </Typography>
                    </Grid>
                    {selectedTicket.imageUrl && (
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Ảnh đính kèm:
                        </Typography>
                        <img
                          src={selectedTicket.imageUrl}
                          alt="Issue"
                          style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 8 }}
                        />
                      </Grid>
                    )}
                    <Grid item xs={12}>
                      <Box display="flex" gap={1} alignItems="center">
                        <Typography variant="body2" color="text.secondary">
                          Trạng thái:
                        </Typography>
                        <Chip
                          label={getStatusLabel(selectedTicket.status)}
                          size="small"
                          color={getStatusColor(selectedTicket.status) as any}
                        />
                        <FormControl size="small" sx={{ minWidth: 150, ml: 2 }}>
                          <Select
                            value={selectedTicket.status}
                            onChange={(e) => handleUpdateStatus(selectedTicket.id, e.target.value as any)}
                          >
                            <MenuItem value="pending">Đang chờ</MenuItem>
                            <MenuItem value="in_progress">Đang xử lý</MenuItem>
                            <MenuItem value="resolved">Đã giải quyết</MenuItem>
                          </Select>
                        </FormControl>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>

                <Divider />

                {/* Messages */}
                <DialogContent sx={{ flex: 1, overflow: 'auto' }}>
                  <List>
                    {messages.map((message, index) => (
                      <ListItem
                        key={message.id || index}
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: message.senderType === 'admin' ? 'flex-end' : 'flex-start',
                          mb: 2
                        }}
                      >
                        <Paper
                          elevation={1}
                          sx={{
                            p: 2,
                            maxWidth: '70%',
                            bgcolor: message.senderType === 'admin' ? 'primary.main' : 'background.paper',
                            color: message.senderType === 'admin' ? 'white' : 'text.primary'
                          }}
                        >
                          <Typography variant="caption" display="block" sx={{ opacity: 0.8 }}>
                            {message.senderName} • {new Date(message.timestamp).toLocaleString('vi-VN')}
                          </Typography>
                          <Typography variant="body1" mt={1}>
                            {message.text}
                          </Typography>
                          {message.imageUrl && (
                            <Box mt={1}>
                              <img
                                src={message.imageUrl}
                                alt="Message attachment"
                                style={{ maxWidth: '100%', borderRadius: 4 }}
                              />
                            </Box>
                          )}
                        </Paper>
                      </ListItem>
                    ))}
                    <div ref={messagesEndRef} />
                  </List>
                </DialogContent>

                <Divider />

                {/* Message Input */}
                <DialogActions sx={{ p: 2 }}>
                  <TextField
                    fullWidth
                    multiline
                    maxRows={3}
                    placeholder="Nhập tin nhắn..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    disabled={sendingMessage}
                  />
                  <Button
                    variant="contained"
                    startIcon={<Send />}
                    onClick={handleSendMessage}
                    disabled={!messageText.trim() || sendingMessage}
                    sx={{ ml: 1 }}
                  >
                    Gửi
                  </Button>
                </DialogActions>
              </>
            )}
          </Dialog>
        </Box>
      </LayoutWrapper>
    </AuthGuard>
  );
}
