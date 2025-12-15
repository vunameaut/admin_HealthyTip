import { useState } from 'react';
import { Box, Button, TextField, Typography, Paper, Alert } from '@mui/material';
import DashboardLayout from '@/components/DashboardLayout';

export default function TestNotification() {
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testSendNotification = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/notifications/send-to-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          title: 'Test Notification from Admin',
          body: 'This is a test message to verify FCM is working correctly',
          data: {
            type: 'ADMIN_REPLY',
            reportId: 'test-report-id',
          },
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult(data);
      } else {
        setError(JSON.stringify(data, null, 2));
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <Box p={3}>
        <Typography variant="h4" gutterBottom>
          Test Notification System
        </Typography>

        <Paper sx={{ p: 3, mt: 3, maxWidth: 600 }}>
          <Typography variant="h6" gutterBottom>
            Test Send Notification to User
          </Typography>

          <TextField
            fullWidth
            label="User ID"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="Enter user ID to test"
            sx={{ mt: 2 }}
          />

          <Button
            variant="contained"
            onClick={testSendNotification}
            disabled={!userId || loading}
            sx={{ mt: 2 }}
          >
            {loading ? 'Sending...' : 'Send Test Notification'}
          </Button>

          {result && (
            <Alert severity="success" sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Success!
              </Typography>
              <pre style={{ fontSize: 12, overflow: 'auto' }}>
                {JSON.stringify(result, null, 2)}
              </pre>
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Error!
              </Typography>
              <pre style={{ fontSize: 12, overflow: 'auto' }}>
                {error}
              </pre>
            </Alert>
          )}
        </Paper>

        <Paper sx={{ p: 3, mt: 3, maxWidth: 600 }}>
          <Typography variant="h6" gutterBottom>
            Instructions
          </Typography>
          <Typography variant="body2" paragraph>
            1. Get user ID from Firebase Realtime Database (users node)
          </Typography>
          <Typography variant="body2" paragraph>
            2. Make sure the user has FCM token registered
          </Typography>
          <Typography variant="body2" paragraph>
            3. Click "Send Test Notification" button
          </Typography>
          <Typography variant="body2" paragraph>
            4. Check Android app for notification
          </Typography>
          <Typography variant="body2" paragraph>
            5. Check browser console for detailed logs
          </Typography>
        </Paper>
      </Box>
    </DashboardLayout>
  );
}
