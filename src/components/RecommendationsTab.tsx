import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Stack,
  Chip,
  alpha,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Collapse,
  IconButton,
} from '@mui/material';
import {
  AutoAwesome,
  People,
  TrendingUp,
  Psychology,
  Send,
  Close,
  History,
  Refresh,
  ExpandMore,
  ExpandLess,
  CheckCircle,
  Error as ErrorIcon,
} from '@mui/icons-material';
import notificationService from '@/services/notificationService';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

interface User {
  uid: string;
  email: string;
  username: string;
}

interface RecommendationsTabProps {
  users: User[];
}

export default function RecommendationsTab({ users }: RecommendationsTabProps) {
  const theme = useTheme();

  // States for single user recommendation
  const [selectedUserId, setSelectedUserId] = useState('');
  const [algorithm, setAlgorithm] = useState<'content' | 'collaborative' | 'trending' | 'hybrid'>('hybrid');
  const [recommendationLimit, setRecommendationLimit] = useState(5);
  const [sendNotification, setSendNotification] = useState(true);
  const [generating, setGenerating] = useState(false);

  // States for batch recommendation
  const [batchGenerating, setBatchGenerating] = useState(false);
  const [batchSendNotifications, setBatchSendNotifications] = useState(false);
  const [batchMaxUsers, setBatchMaxUsers] = useState(50);

  // States for results
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [batchResults, setBatchResults] = useState<any>(null);
  const [showResultsDialog, setShowResultsDialog] = useState(false);

  // States for history
  const [history, setHistory] = useState<any[]>([]);
  const [batchLogs, setBatchLogs] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const result = await notificationService.getRecommendationsHistory({ limit: 50 });
      if (result.success) {
        setHistory(result.recommendations);
        setBatchLogs(result.batchLogs);
      }
    } catch (error: any) {
      console.error('Error loading history:', error);
      toast.error('Lỗi khi tải lịch sử đề xuất');
    } finally {
      setHistoryLoading(false);
    }
  };

  const toggleRow = (userId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedRows(newExpanded);
  };

  const handleGenerateForUser = async () => {
    if (!selectedUserId) {
      toast.error('Vui lòng chọn người dùng');
      return;
    }

    setGenerating(true);
    try {
      const result = await notificationService.generateRecommendationsForUser({
        userId: selectedUserId,
        limit: recommendationLimit,
        sendNotification,
        algorithm,
      });

      if (result.success) {
        setRecommendations(result.recommendations);
        setShowResultsDialog(true);
        toast.success(`Đã tạo ${result.totalRecommendations} đề xuất cho người dùng!`);
      } else {
        toast.error(result.error || 'Tạo đề xuất thất bại');
      }
    } catch (error: any) {
      console.error('Error generating recommendations:', error);
      toast.error(error.response?.data?.error || 'Lỗi khi tạo đề xuất');
    } finally {
      setGenerating(false);
    }
  };

  const handleBatchGenerate = async () => {
    setBatchGenerating(true);
    try {
      const result = await notificationService.generateBatchRecommendations({
        sendNotifications: batchSendNotifications,
        maxUsers: batchMaxUsers,
        algorithm,
      });

      if (result.success) {
        setBatchResults(result.results);
        toast.success(
          `Đã tạo đề xuất cho ${result.results.successCount}/${result.results.totalUsers} người dùng!`
        );
      } else {
        toast.error('Tạo đề xuất batch thất bại');
      }
    } catch (error: any) {
      console.error('Error batch generating recommendations:', error);
      toast.error(error.response?.data?.error || 'Lỗi khi tạo đề xuất batch');
    } finally {
      setBatchGenerating(false);
    }
  };

  const getAlgorithmIcon = (algo: string) => {
    switch (algo) {
      case 'content':
        return <Psychology />;
      case 'collaborative':
        return <People />;
      case 'trending':
        return <TrendingUp />;
      case 'hybrid':
      default:
        return <AutoAwesome />;
    }
  };

  const getAlgorithmDescription = (algo: string) => {
    switch (algo) {
      case 'content':
        return 'Dựa trên nội dung và sở thích của người dùng';
      case 'collaborative':
        return 'Dựa trên hành vi của người dùng tương tự';
      case 'trending':
        return 'Dựa trên nội dung đang hot';
      case 'hybrid':
      default:
        return 'Kết hợp tất cả các thuật toán (khuyến nghị)';
    }
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        🤖 Hệ thống đề xuất thông minh
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Sử dụng AI để tạo đề xuất cá nhân hóa cho người dùng dựa trên hành vi và sở thích
      </Typography>

      <Grid container spacing={3}>
        {/* Algorithm Selection */}
        <Grid item xs={12}>
          <Card elevation={0} sx={{ border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}` }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Chọn thuật toán đề xuất
              </Typography>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                {(['content', 'collaborative', 'trending', 'hybrid'] as const).map((algo) => (
                  <Grid item xs={12} sm={6} md={3} key={algo}>
                    <Card
                      elevation={0}
                      sx={{
                        cursor: 'pointer',
                        border: `2px solid ${
                          algorithm === algo ? theme.palette.primary.main : alpha(theme.palette.divider, 0.5)
                        }`,
                        bgcolor: algorithm === algo ? alpha(theme.palette.primary.main, 0.05) : 'transparent',
                        transition: 'all 0.2s',
                        '&:hover': {
                          borderColor: theme.palette.primary.main,
                          transform: 'scale(1.02)',
                        },
                      }}
                      onClick={() => setAlgorithm(algo)}
                    >
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Box sx={{ color: algorithm === algo ? 'primary.main' : 'text.secondary', mb: 1 }}>
                          {getAlgorithmIcon(algo)}
                        </Box>
                        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                          {algo.charAt(0).toUpperCase() + algo.slice(1)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {getAlgorithmDescription(algo)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Generate for Single User */}
        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`, height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📤 Tạo đề xuất cho 1 người dùng
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Tạo đề xuất cá nhân hóa cho một người dùng cụ thể
              </Typography>

              <Stack spacing={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Chọn người dùng</InputLabel>
                  <Select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    label="Chọn người dùng"
                  >
                    {users.map((user) => (
                      <MenuItem key={user.uid} value={user.uid}>
                        {user.username || user.email}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  label="Số lượng đề xuất"
                  type="number"
                  size="small"
                  value={recommendationLimit}
                  onChange={(e) => setRecommendationLimit(parseInt(e.target.value) || 5)}
                  inputProps={{ min: 1, max: 20 }}
                  fullWidth
                />

                <FormControl fullWidth size="small">
                  <InputLabel>Gửi thông báo?</InputLabel>
                  <Select
                    value={sendNotification ? 'yes' : 'no'}
                    onChange={(e) => setSendNotification(e.target.value === 'yes')}
                    label="Gửi thông báo?"
                  >
                    <MenuItem value="yes">Có - Gửi thông báo cho người dùng</MenuItem>
                    <MenuItem value="no">Không - Chỉ tạo đề xuất</MenuItem>
                  </Select>
                </FormControl>

                <Button
                  variant="contained"
                  startIcon={generating ? <CircularProgress size={20} /> : <Send />}
                  onClick={handleGenerateForUser}
                  disabled={generating || !selectedUserId}
                  fullWidth
                >
                  {generating ? 'Đang tạo...' : 'Tạo đề xuất'}
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Batch Generate */}
        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`, height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🚀 Tạo đề xuất hàng loạt
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Tạo đề xuất cho nhiều người dùng cùng lúc
              </Typography>

              <Stack spacing={2}>
                <TextField
                  label="Số lượng người dùng tối đa"
                  type="number"
                  size="small"
                  value={batchMaxUsers}
                  onChange={(e) => setBatchMaxUsers(parseInt(e.target.value) || 50)}
                  inputProps={{ min: 1, max: 500 }}
                  fullWidth
                  helperText={`Sẽ tạo đề xuất cho tối đa ${batchMaxUsers} người dùng`}
                />

                <FormControl fullWidth size="small">
                  <InputLabel>Gửi thông báo?</InputLabel>
                  <Select
                    value={batchSendNotifications ? 'yes' : 'no'}
                    onChange={(e) => setBatchSendNotifications(e.target.value === 'yes')}
                    label="Gửi thông báo?"
                  >
                    <MenuItem value="yes">Có - Gửi thông báo cho tất cả</MenuItem>
                    <MenuItem value="no">Không - Chỉ tạo đề xuất</MenuItem>
                  </Select>
                </FormControl>

                {batchResults && (
                  <Alert severity="success" sx={{ mt: 2 }}>
                    <Typography variant="body2" fontWeight="bold" gutterBottom>
                      Kết quả:
                    </Typography>
                    <Typography variant="body2">
                      ✅ Thành công: {batchResults.successCount}/{batchResults.totalUsers}
                    </Typography>
                    <Typography variant="body2">
                      ❌ Thất bại: {batchResults.failureCount}
                    </Typography>
                  </Alert>
                )}

                <Button
                  variant="contained"
                  color="success"
                  startIcon={batchGenerating ? <CircularProgress size={20} /> : <AutoAwesome />}
                  onClick={handleBatchGenerate}
                  disabled={batchGenerating}
                  fullWidth
                >
                  {batchGenerating ? 'Đang tạo...' : 'Tạo đề xuất hàng loạt'}
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recommendations History */}
      <Card elevation={0} sx={{ border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, mt: 4 }}>
        <CardContent>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <History sx={{ fontSize: 32, color: 'primary.main' }} />
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  Lịch Sử Đề Xuất
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {history.length} đề xuất đã tạo
                </Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={loadHistory}
                disabled={historyLoading}
                size="small"
              >
                Làm mới
              </Button>
              <Button
                variant={showHistory ? 'contained' : 'outlined'}
                onClick={() => setShowHistory(!showHistory)}
                startIcon={showHistory ? <ExpandLess /> : <ExpandMore />}
                size="small"
              >
                {showHistory ? 'Ẩn' : 'Xem'} lịch sử
              </Button>
            </Stack>
          </Stack>

          {showHistory && (
            <>
              {historyLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : history.length > 0 ? (
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell width={50}></TableCell>
                        <TableCell>Người dùng</TableCell>
                        <TableCell align="center">Số đề xuất</TableCell>
                        <TableCell>Thời gian tạo</TableCell>
                        <TableCell align="center">Trạng thái</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {history.map((item) => (
                        <React.Fragment key={item.userId}>
                          <TableRow hover>
                            <TableCell>
                              <IconButton
                                size="small"
                                onClick={() => toggleRow(item.userId)}
                              >
                                {expandedRows.has(item.userId) ? <ExpandLess /> : <ExpandMore />}
                              </IconButton>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight="medium">
                                {item.username || item.userEmail || item.userId}
                              </Typography>
                              {item.username && (
                                <Typography variant="caption" color="text.secondary">
                                  {item.userEmail}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell align="center">
                              <Chip label={item.recommendationsCount} color="primary" size="small" />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {formatDistanceToNow(item.generatedAt, { addSuffix: true, locale: vi })}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              {item.isExpired ? (
                                <Chip
                                  icon={<ErrorIcon />}
                                  label="Hết hạn"
                                  color="error"
                                  size="small"
                                />
                              ) : (
                                <Chip
                                  icon={<CheckCircle />}
                                  label="Còn hiệu lực"
                                  color="success"
                                  size="small"
                                />
                              )}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={5}>
                              <Collapse in={expandedRows.has(item.userId)} timeout="auto" unmountOnExit>
                                <Box sx={{ margin: 2 }}>
                                  <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                                    Danh sách đề xuất:
                                  </Typography>
                                  <List dense>
                                    {item.recommendations.map((rec: any, idx: number) => (
                                      <ListItem key={idx}>
                                        <ListItemText
                                          primary={
                                            <Stack direction="row" spacing={1} alignItems="center">
                                              <Chip label={`#${idx + 1}`} size="small" />
                                              <Typography variant="body2">{rec.title}</Typography>
                                            </Stack>
                                          }
                                          secondary={
                                            <Box sx={{ mt: 0.5 }}>
                                              <Typography variant="caption" color="text.secondary">
                                                Điểm: {rec.score?.toFixed(2)}
                                              </Typography>
                                              <br />
                                              {rec.reasons?.map((reason: string, i: number) => (
                                                <Chip
                                                  key={i}
                                                  label={reason}
                                                  size="small"
                                                  sx={{ mr: 0.5, mt: 0.5 }}
                                                />
                                              ))}
                                            </Box>
                                          }
                                        />
                                      </ListItem>
                                    ))}
                                  </List>
                                </Box>
                              </Collapse>
                            </TableCell>
                          </TableRow>
                        </React.Fragment>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Alert severity="info">Chưa có lịch sử đề xuất nào</Alert>
              )}

              {/* Batch Logs */}
              {batchLogs.length > 0 && (
                <Box sx={{ mt: 4 }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    📊 Lịch sử tạo hàng loạt
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Thời gian</TableCell>
                          <TableCell>Thuật toán</TableCell>
                          <TableCell align="center">Số users</TableCell>
                          <TableCell align="center">Thành công</TableCell>
                          <TableCell align="center">Thất bại</TableCell>
                          <TableCell align="center">Gửi thông báo</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {batchLogs.slice(0, 10).map((log) => (
                          <TableRow key={log.id} hover>
                            <TableCell>
                              {formatDistanceToNow(log.timestamp, { addSuffix: true, locale: vi })}
                            </TableCell>
                            <TableCell>
                              <Chip label={log.algorithm} size="small" />
                            </TableCell>
                            <TableCell align="center">{log.totalUsers}</TableCell>
                            <TableCell align="center">
                              <Chip label={log.successCount} color="success" size="small" />
                            </TableCell>
                            <TableCell align="center">
                              <Chip label={log.failureCount} color="error" size="small" />
                            </TableCell>
                            <TableCell align="center">
                              {log.sendNotifications ? (
                                <Chip label="Có" color="success" size="small" />
                              ) : (
                                <Chip label="Không" color="default" size="small" />
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Results Dialog */}
      <Dialog open={showResultsDialog} onClose={() => setShowResultsDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Kết quả đề xuất</Typography>
            <Button onClick={() => setShowResultsDialog(false)}>
              <Close />
            </Button>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {recommendations.length > 0 ? (
            <List>
              {recommendations.map((rec, index) => (
                <React.Fragment key={rec.healthTipId}>
                  <ListItem>
                    <ListItemIcon>
                      <Chip label={`#${index + 1}`} color="primary" size="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={rec.title}
                      secondary={
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            Điểm: {rec.score.toFixed(2)}
                          </Typography>
                          <br />
                          {rec.reasons.map((reason: string, idx: number) => (
                            <Chip key={idx} label={reason} size="small" sx={{ mr: 0.5, mt: 0.5 }} />
                          ))}
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < recommendations.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Alert severity="info">Không có đề xuất nào được tạo</Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowResultsDialog(false)}>Đóng</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
