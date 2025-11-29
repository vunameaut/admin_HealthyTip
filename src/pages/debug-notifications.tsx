import React, { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Button, Alert } from '@mui/material';
import { database } from '../lib/firebase';
import { ref, get } from 'firebase/database';

export default function DebugNotificationsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const notificationsRef = ref(database, 'admin_notifications');
      const snapshot = await get(notificationsRef);

      if (snapshot.exists()) {
        const data = snapshot.val();
        console.log('Raw Firebase data:', data);
        setData(data);
      } else {
        setData(null);
        setError('No data found in admin_notifications node');
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Debug Admin Notifications
      </Typography>

      <Button variant="contained" onClick={loadData} disabled={loading} sx={{ mb: 2 }}>
        {loading ? 'Loading...' : 'Reload Data'}
      </Button>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {data && (
        <>
          <Alert severity="info" sx={{ mb: 2 }}>
            Found {Object.keys(data).length} notifications in Firebase
          </Alert>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Raw Firebase Data:
              </Typography>
              <pre style={{
                background: '#f5f5f5',
                padding: '16px',
                overflow: 'auto',
                maxHeight: '600px',
                fontSize: '12px'
              }}>
                {JSON.stringify(data, null, 2)}
              </pre>
            </CardContent>
          </Card>

          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Parsed Notifications:
              </Typography>
              {Object.entries(data).map(([key, value]: [string, any]) => (
                <Box key={key} sx={{ mb: 2, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                  <Typography variant="subtitle2" color="primary">
                    ID: {key}
                  </Typography>
                  <Typography variant="body2">
                    Type: {value.type || 'N/A'}
                  </Typography>
                  <Typography variant="body2">
                    Title: {value.title || 'N/A'}
                  </Typography>
                  <Typography variant="body2">
                    Message: {value.message || 'N/A'}
                  </Typography>
                  <Typography variant="body2">
                    Read: {value.read ? 'Yes' : 'No'}
                  </Typography>
                  <Typography variant="body2">
                    Resolved: {value.resolved ? 'Yes' : 'No'}
                  </Typography>
                  <Typography variant="body2">
                    Priority: {value.priority || 'N/A'}
                  </Typography>
                  <Typography variant="body2">
                    Created: {value.createdAt ? new Date(value.createdAt).toLocaleString() : 'N/A'}
                  </Typography>
                  <Typography variant="body2">
                    Data: {JSON.stringify(value.data)}
                  </Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </>
      )}

      {!loading && !data && !error && (
        <Alert severity="warning">
          No notifications found. Click reload to try again.
        </Alert>
      )}
    </Box>
  );
}
