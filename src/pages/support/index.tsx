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
  AttachFile,
  FiberManualRecord,
  Mail
} from '@mui/icons-material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import LayoutWrapper from '../../components/LayoutWrapper';
import AuthGuard from '../../components/AuthGuard';
import { supportService } from '../../services/firebase';
import { SupportTicket, SupportMessage } from '../../types';
import toast from 'react-hot-toast';
import { auth, database } from '../../lib/firebase';
import { ref, onValue } from 'firebase/database';
import { useRouter } from 'next/router';

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
  const router = useRouter();
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
    
    // Real-time listener cho support tickets
    const ticketsRef = ref(database, 'support_tickets');
    const unsubscribe = onValue(ticketsRef, (snapshot) => {
      if (snapshot.exists()) {
        const ticketsData: SupportTicket[] = [];
        snapshot.forEach((child) => {
          const ticket = child.val();
          ticketsData.push({
            id: child.key!,
            ...ticket
          });
        });
        // Sort by timestamp (newest first)
        ticketsData.sort((a, b) => b.timestamp - a.timestamp);
        setTickets(ticketsData);
        
        // Update stats
        const statsData = {
          total: ticketsData.length,
          pending: ticketsData.filter(t => t.status === 'pending').length,
          inProgress: ticketsData.filter(t => t.status === 'in_progress').length,
          resolved: ticketsData.filter(t => t.status === 'resolved').length
        };
        setStats(statsData);
      }
    });
    
    return () => unsubscribe();
  }, []);

  // Auto-open ticket from notification
  useEffect(() => {
    const ticketId = router.query.ticketId as string;
    const userId = router.query.userId as string;
    
    console.log('[Support] Query params:', { ticketId, userId, ticketsLength: tickets.length });
    
    if ((ticketId || userId) && tickets.length > 0) {
      // Find ticket by ticketId first, or by userId
      let ticket: SupportTicket | undefined;

      if (ticketId) {
        console.log('[Support] Looking for ticket by ID:', ticketId);
        ticket = tickets.find(t => t.id === ticketId);
        console.log('[Support] Found ticket by ID:', ticket ? ticket.id : 'NOT FOUND');
      } else if (userId) {
        console.log('[Support] Looking for ticket by userId:', userId);
        // Find the most recent ticket from this user
        ticket = tickets
          .filter(t => t.userId === userId)
          .sort((a, b) => b.timestamp - a.timestamp)[0];
        console.log('[Support] Found ticket by userId:', ticket ? ticket.id : 'NOT FOUND');
      }

      if (ticket) {
        console.log('[Support] Opening chat for ticket:', ticket.id);
        handleOpenChat(ticket);
        // Clear query params after opening
        router.replace('/support', undefined, { shallow: true });
      } else {
        console.error('[Support] No ticket found with query params:', { ticketId, userId });
      }
    }
  }, [router.query, tickets]);

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
      console.log('[Support] Loaded tickets:', allTickets.map(t => ({ 
        id: t.id, 
        hasUnreadUserMessage: t.hasUnreadUserMessage,
        lastUserMessageAt: t.lastUserMessageAt 
      })));
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
    console.log('[Support] Opening chat for ticket:', ticket.id, 'hasUnreadUserMessage:', ticket.hasUnreadUserMessage);
    setSelectedTicket(ticket);
    setChatOpen(true);
    
    // Clear unread flag khi admin mở chat
    if (ticket.hasUnreadUserMessage) {
      try {
        console.log('[Support] Clearing unread flag for ticket:', ticket.id);
        await supportService.clearUnreadUserMessage(ticket.id);
        
        // Update local state ngay lập tức để UI phản hồi nhanh
        setTickets(prevTickets => 
          prevTickets.map(t => {
            if (t.id === ticket.id) {
              return { ...t, hasUnreadUserMessage: false, lastUserMessageAt: undefined };
            }
            return t;
          })
        );
        console.log('[Support] Unread flag cleared successfully');
      } catch (error) {
        console.error('[Support] Error clearing unread flag:', error);
      }
    }
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

      // Send notification to user
      try {
        await fetch('/api/support/send-message-notification', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ticketId: selectedTicket.id,
            userId: selectedTicket.userId,
            senderType: 'admin',
            message: messageText,
            senderName: currentUser.email || 'Admin'
          }),
        });
      } catch (notifError) {
        console.error('Error sending notification:', notifError);
        // Don't fail the message send if notification fails
      }

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
      field: 'indicator',
      headerName: '',
      width: 50,
      sortable: false,
      renderCell: (params) => {
        // Kiểm tra xem ticket có tin nhắn mới từ user không
        const hasUnread = params.row.hasUnreadUserMessage || false;
        return hasUnread ? (
          <FiberManualRecord 
            sx={{ 
              color: '#f44336', 
              fontSize: 16,
              animation: 'pulse 2s infinite'
            }} 
          />
        ) : null;
      }
    },
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
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="body2" noWrap>
            {params.value}
          </Typography>
          {params.row.hasUnreadUserMessage && (
            <Chip 
              label="Tin nhắn mới" 
              size="small" 
              color="error"
              sx={{ height: 20, fontSize: '0.7rem' }}
            />
          )}
        </Box>
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
    },
    {
      title: 'Tin nhắn chưa đọc',
      value: tickets.filter(t => t.hasUnreadUserMessage).length,
      icon: <Mail />,
      color: '#d32f2f'
    }
  ];

  return (
    <AuthGuard>
      <LayoutWrapper darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
        <style>
          {`
            @keyframes pulse {
              0%, 100% {
                opacity: 1;
              }
              50% {
                opacity: 0.3;
              }
            }
          `}
        </style>
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
              sx: {
                height: '85vh',
                maxHeight: '85vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }
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

                {/* Ticket Info + Messages - Combined scrollable area */}
                <DialogContent sx={{ flex: 1, overflow: 'auto', p: 0 }}>
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
                          <Box
                            component="img"
                            src={selectedTicket.imageUrl}
                            alt="Issue"
                            sx={{
                              maxWidth: '300px',
                              maxHeight: '200px',
                              width: 'auto',
                              height: 'auto',
                              objectFit: 'contain',
                              borderRadius: 1,
                              cursor: 'pointer',
                              border: '1px solid',
                              borderColor: 'divider'
                            }}
                            onClick={() => window.open(selectedTicket.imageUrl, '_blank')}
                          />
                        </Grid>
                      )}
                      <Grid item xs={12}>
                        <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
                          <Typography variant="body2" color="text.secondary">
                            Trạng thái:
                          </Typography>
                          <Chip
                            label={getStatusLabel(selectedTicket.status)}
                            size="small"
                            color={getStatusColor(selectedTicket.status) as any}
                          />
                          <FormControl size="small" sx={{ minWidth: 150 }}>
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
                  <Box sx={{ p: 2 }}>
                    <List sx={{ py: 0 }}>
                      {messages.map((message, index) => (
                        <ListItem
                          key={message.id || index}
                          sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: message.senderType === 'admin' ? 'flex-end' : 'flex-start',
                            mb: 2,
                            px: 0
                          }}
                        >
                          <Paper
                            elevation={1}
                            sx={{
                              p: 1.5,
                              maxWidth: '70%',
                              bgcolor: message.senderType === 'admin' ? 'primary.main' : 'background.paper',
                              color: message.senderType === 'admin' ? 'white' : 'text.primary'
                            }}
                          >
                            <Typography variant="caption" display="block" sx={{ opacity: 0.8, mb: 0.5 }}>
                              {message.senderName} • {new Date(message.timestamp).toLocaleString('vi-VN')}
                            </Typography>
                            {message.text && (
                              <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                                {message.text}
                              </Typography>
                            )}
                            {message.imageUrl && (
                              <Box mt={1}>
                                <Box
                                  component="img"
                                  src={message.imageUrl}
                                  alt="Message attachment"
                                  sx={{
                                    maxWidth: '200px',
                                    maxHeight: '150px',
                                    width: 'auto',
                                    height: 'auto',
                                    objectFit: 'contain',
                                    borderRadius: 1,
                                    cursor: 'pointer',
                                    border: '1px solid',
                                    borderColor: message.senderType === 'admin' ? 'rgba(255,255,255,0.3)' : 'divider'
                                  }}
                                  onClick={() => window.open(message.imageUrl, '_blank')}
                                />
                              </Box>
                            )}
                          </Paper>
                        </ListItem>
                      ))}
                      <div ref={messagesEndRef} />
                    </List>
                  </Box>
                </DialogContent>

                <Divider />

                {/* Message Input - Fixed at bottom */}
                <Box sx={{ p: 2, bgcolor: 'background.paper' }}>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                    <TextField
                      fullWidth
                      multiline
                      maxRows={3}
                      size="small"
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
                      size="medium"
                      onClick={handleSendMessage}
                      disabled={!messageText.trim() || sendingMessage}
                      sx={{ minWidth: '80px', height: '40px' }}
                    >
                      <Send fontSize="small" />
                    </Button>
                  </Box>
                </Box>
              </>
            )}
          </Dialog>
        </Box>
      </LayoutWrapper>
    </AuthGuard>
  );
}
