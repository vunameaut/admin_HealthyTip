import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Button,
  TextField,
  IconButton,
  Avatar,
  Divider,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  CardMedia,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Send as SendIcon,
  Image as ImageIcon,
  BugReport as BugIcon,
  Feedback as FeedbackIcon,
  Help as QuestionIcon,
  MoreHoriz as OtherIcon,
  Close as CloseIcon,
  CheckCircle as ResolveIcon,
  Lock as LockIcon,
  Person as PersonIcon,
  Devices as DeviceIcon,
} from '@mui/icons-material';
import { ref, get, set, push, onValue, off, update } from 'firebase/database';
import { database } from '@/lib/firebase';
import { getAuth } from 'firebase/auth';
import DashboardLayout from '@/components/DashboardLayout';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import toast from 'react-hot-toast';

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
}

interface Message {
  id: string;
  senderId: string;
  senderType: 'user' | 'admin';
  senderName: string;
  text: string;
  imageUrl?: string;
  timestamp: number;
  read: boolean;
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

export default function ReportDetailPage() {
  const router = useRouter();
  const { id: reportId } = router.query;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [report, setReport] = useState<Report | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [newStatus, setNewStatus] = useState<string>('');
  const [imageDialogUrl, setImageDialogUrl] = useState<string | null>(null);

  // Load report data
  useEffect(() => {
    if (!reportId) return;

    const reportRef = ref(database, `reports/${reportId}`);
    const messagesRef = ref(database, `reports/${reportId}/messages`);

    // Report listener
    const reportUnsubscribe = onValue(reportRef, (snapshot) => {
      setLoading(false);
      if (snapshot.exists()) {
        setReport({ id: snapshot.key!, ...snapshot.val() });
      } else {
        setError('Không tìm thấy báo cáo');
      }
    });

    // Messages listener
    const messagesUnsubscribe = onValue(messagesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const messagesArray: Message[] = Object.entries(data).map(([id, value]: [string, any]) => ({
          id,
          ...value,
        }));
        messagesArray.sort((a, b) => a.timestamp - b.timestamp);
        setMessages(messagesArray);
      } else {
        setMessages([]);
      }
    });

    return () => {
      off(reportRef);
      off(messagesRef);
    };
  }, [reportId]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark messages as read
  useEffect(() => {
    if (!reportId || !messages.length) return;

    messages.forEach((msg) => {
      if (msg.senderType === 'user' && !msg.read) {
        const msgRef = ref(database, `reports/${reportId}/messages/${msg.id}/read`);
        set(msgRef, true);
      }
    });
  }, [reportId, messages]);

  const sendMessage = async () => {
    if (!messageText.trim() || !report) return;
    if (report.status === 'closed') {
      toast.error('Báo cáo đã đóng, không thể gửi tin nhắn');
      return;
    }

    setSending(true);
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      
      const messagesRef = ref(database, `reports/${reportId}/messages`);
      const newMessageRef = push(messagesRef);
      
      const message: Omit<Message, 'id'> = {
        senderId: currentUser?.uid || 'admin',
        senderType: 'admin',
        senderName: currentUser?.displayName || currentUser?.email || 'Admin',
        text: messageText.trim(),
        timestamp: Date.now(),
        read: false,
      };

      await set(newMessageRef, message);

      // Update report
      const reportRef = ref(database, `reports/${reportId}`);
      await update(reportRef, {
        lastMessageAt: Date.now(),
        lastMessagePreview: `Admin: ${messageText.trim().substring(0, 50)}...`,
        updatedAt: Date.now(),
        status: report.status === 'pending' ? 'in_progress' : report.status,
      });

      // Send notification to user
      await sendUserNotification(report, messageText.trim());

      setMessageText('');
      toast.success('Đã gửi tin nhắn');
    } catch (err) {
      console.error('Error sending message:', err);
      toast.error('Không thể gửi tin nhắn');
    } finally {
      setSending(false);
    }
  };

  const sendUserNotification = async (report: Report, messageText: string) => {
    try {
      const response = await fetch('/api/notifications/send-to-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: report.userId,
          title: 'Phản hồi từ Admin',
          body: messageText.substring(0, 100),
          data: {
            type: 'ADMIN_REPLY',
            reportId: report.id,
          },
        }),
      });

      if (!response.ok) {
        console.error('Failed to send user notification');
      }
    } catch (err) {
      console.error('Error sending notification:', err);
    }
  };

  const handleStatusChange = async () => {
    if (!newStatus || !reportId) return;

    try {
      const reportRef = ref(database, `reports/${reportId}`);
      await update(reportRef, {
        status: newStatus,
        updatedAt: Date.now(),
      });
      toast.success('Đã cập nhật trạng thái');
      setShowStatusDialog(false);
    } catch (err) {
      console.error('Error updating status:', err);
      toast.error('Không thể cập nhật trạng thái');
    }
  };

  const formatTime = (timestamp: number) => {
    if (!timestamp) return '';
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

  if (error || !report) {
    return (
      <DashboardLayout>
        <Box p={3}>
          <Alert severity="error">{error || 'Không tìm thấy báo cáo'}</Alert>
          <Button
            startIcon={<BackIcon />}
            onClick={() => router.push('/reports')}
            sx={{ mt: 2 }}
          >
            Quay lại
          </Button>
        </Box>
      </DashboardLayout>
    );
  }

  const typeInfo = getReportTypeInfo(report.title);

  return (
    <DashboardLayout>
      <Box sx={{ p: 3, height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <IconButton onClick={() => router.push('/reports')}>
            <BackIcon />
          </IconButton>
          <Box flex={1}>
            <Typography variant="h5" fontWeight="bold">
              Báo cáo #{report.id.substring(0, 8).toUpperCase()}
            </Typography>
            <Box display="flex" gap={1} mt={0.5}>
              <Chip
                icon={typeInfo.icon as any}
                label={typeInfo.label}
                size="small"
                sx={{ bgcolor: typeInfo.color, color: 'white', '& .MuiChip-icon': { color: 'white' } }}
              />
              <Chip
                label={statusConfig[report.status]?.label}
                color={statusConfig[report.status]?.color}
                size="small"
              />
            </Box>
          </Box>
          <Button
            variant="outlined"
            onClick={() => {
              setNewStatus(report.status);
              setShowStatusDialog(true);
            }}
          >
            Đổi trạng thái
          </Button>
        </Box>

        <Grid container spacing={2} sx={{ flex: 1, overflow: 'hidden' }}>
          {/* Report Info - Left Panel */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, height: '100%', overflow: 'auto' }}>
              {/* User Info */}
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <PersonIcon />
                </Avatar>
                <Box>
                  <Typography fontWeight="500">{report.userName}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    {report.userEmail}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Report Content */}
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Nội dung báo cáo
              </Typography>
              <Typography variant="body2" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>
                {report.content}
              </Typography>

              {/* Report Image */}
              {report.imageUrl && (
                <Card sx={{ mb: 2 }}>
                  <CardMedia
                    component="img"
                    height="200"
                    image={report.imageUrl}
                    alt="Screenshot"
                    sx={{ cursor: 'pointer', objectFit: 'cover' }}
                    onClick={() => setImageDialogUrl(report.imageUrl!)}
                  />
                </Card>
              )}

              <Divider sx={{ my: 2 }} />

              {/* Device Info */}
              {report.deviceInfo && (
                <>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    <DeviceIcon fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                    Thông tin thiết bị
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: 12 }}>
                    {report.deviceInfo}
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                </>
              )}

              {/* Timestamps */}
              <Typography variant="caption" color="textSecondary" display="block">
                Tạo lúc: {formatTime(report.createdAt)}
              </Typography>
              <Typography variant="caption" color="textSecondary" display="block">
                Cập nhật: {formatTime(report.updatedAt)}
              </Typography>
            </Paper>
          </Grid>

          {/* Chat - Right Panel */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              {/* Chat Header */}
              <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="h6">Trao đổi</Typography>
                {report.status === 'closed' && (
                  <Alert severity="info" icon={<LockIcon />} sx={{ mt: 1 }}>
                    Báo cáo đã đóng. Chỉ xem lại lịch sử trao đổi.
                  </Alert>
                )}
              </Box>

              {/* Messages */}
              <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
                {messages.length === 0 ? (
                  <Box textAlign="center" py={4}>
                    <Typography color="textSecondary">
                      Chưa có tin nhắn nào. Gửi tin nhắn đầu tiên để bắt đầu trao đổi.
                    </Typography>
                  </Box>
                ) : (
                  messages.map((msg) => (
                    <Box
                      key={msg.id}
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: msg.senderType === 'admin' ? 'flex-end' : 'flex-start',
                        mb: 2,
                      }}
                    >
                      <Typography variant="caption" color="textSecondary" sx={{ mb: 0.5 }}>
                        {msg.senderName}
                      </Typography>
                      <Box
                        sx={{
                          maxWidth: '70%',
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: msg.senderType === 'admin' ? 'primary.main' : 'grey.100',
                          color: msg.senderType === 'admin' ? 'white' : 'text.primary',
                        }}
                      >
                        {msg.imageUrl && (
                          <Box
                            component="img"
                            src={msg.imageUrl}
                            alt="Attached"
                            sx={{
                              maxWidth: '100%',
                              maxHeight: 200,
                              borderRadius: 1,
                              mb: 1,
                              cursor: 'pointer',
                            }}
                            onClick={() => setImageDialogUrl(msg.imageUrl!)}
                          />
                        )}
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                          {msg.text}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5 }}>
                        {formatTime(msg.timestamp)}
                      </Typography>
                    </Box>
                  ))
                )}
                <div ref={messagesEndRef} />
              </Box>

              {/* Input */}
              {report.status !== 'closed' && (
                <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                  <Box display="flex" gap={1}>
                    <TextField
                      fullWidth
                      multiline
                      maxRows={4}
                      placeholder="Nhập tin nhắn..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      disabled={sending}
                    />
                    <IconButton
                      color="primary"
                      onClick={sendMessage}
                      disabled={!messageText.trim() || sending}
                    >
                      {sending ? <CircularProgress size={24} /> : <SendIcon />}
                    </IconButton>
                  </Box>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>

        {/* Status Change Dialog */}
        <Dialog open={showStatusDialog} onClose={() => setShowStatusDialog(false)}>
          <DialogTitle>Đổi trạng thái báo cáo</DialogTitle>
          <DialogContent sx={{ minWidth: 300 }}>
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Trạng thái mới</InputLabel>
              <Select
                value={newStatus}
                label="Trạng thái mới"
                onChange={(e) => setNewStatus(e.target.value)}
              >
                <MenuItem value="pending">Chưa xử lý</MenuItem>
                <MenuItem value="in_progress">Đang trao đổi</MenuItem>
                <MenuItem value="resolved">Đã xử lý</MenuItem>
                <MenuItem value="closed">Đã đóng</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowStatusDialog(false)}>Hủy</Button>
            <Button variant="contained" onClick={handleStatusChange}>
              Cập nhật
            </Button>
          </DialogActions>
        </Dialog>

        {/* Image Preview Dialog */}
        <Dialog
          open={!!imageDialogUrl}
          onClose={() => setImageDialogUrl(null)}
          maxWidth="lg"
        >
          <DialogContent sx={{ p: 0 }}>
            <Box
              component="img"
              src={imageDialogUrl || ''}
              alt="Full size"
              sx={{ maxWidth: '100%', maxHeight: '90vh' }}
            />
          </DialogContent>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
}

