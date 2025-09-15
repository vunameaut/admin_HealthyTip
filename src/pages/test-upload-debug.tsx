import { useEffect, useState } from 'react';
import { Button, Box, Typography, Alert } from '@mui/material';

export default function TestUploadPage() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testCloudinaryConfig = async () => {
    setLoading(true);
    setResult('');

    try {
      console.log('Testing Cloudinary config...');
      
      const response = await fetch('/api/cloudinary/signature', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category: 'test-category',
          resourceType: 'image'
        }),
      });

      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Success:', data);
        setResult(`✅ SUCCESS: ${JSON.stringify(data, null, 2)}`);
      } else {
        const errorText = await response.text();
        console.log('Error:', errorText);
        setResult(`❌ ERROR: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      setResult(`❌ FETCH ERROR: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testUnsignedUpload = async () => {
    setLoading(true);
    setResult('');

    try {
      console.log('Testing unsigned upload...');
      
      // Create a small test file
      const blob = new Blob(['test content'], { type: 'text/plain' });
      const file = new File([blob], 'test.txt', { type: 'text/plain' });
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'healthtip_unsigned');
      formData.append('folder', 'healthy_tip/test/2024/01');

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/dazo6ypwt/raw/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      console.log('Upload response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Upload success:', data);
        setResult(`✅ UPLOAD SUCCESS: ${JSON.stringify(data, null, 2)}`);
      } else {
        const errorText = await response.text();
        console.log('Upload error:', errorText);
        setResult(`❌ UPLOAD ERROR: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setResult(`❌ UPLOAD ERROR: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Debug Upload System
      </Typography>
      
      <Box mb={2}>
        <Button 
          variant="contained" 
          onClick={testCloudinaryConfig}
          disabled={loading}
          sx={{ mr: 2 }}
        >
          Test Config API
        </Button>
        
        <Button 
          variant="contained" 
          color="secondary"
          onClick={testUnsignedUpload}
          disabled={loading}
        >
          Test Direct Upload
        </Button>
      </Box>

      {result && (
        <Alert severity={result.startsWith('✅') ? 'success' : 'error'}>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px' }}>
            {result}
          </pre>
        </Alert>
      )}
    </Box>
  );
}
