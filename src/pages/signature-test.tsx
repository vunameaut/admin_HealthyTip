import React, { useState } from 'react';
import { NextPage } from 'next';
import {
  Box,
  Container,
  Typography,
  Button,
  Alert,
  Stack,
  Card,
  CardContent,
  TextField,
  Grid
} from '@mui/material';
import toast, { Toaster } from 'react-hot-toast';

const SignatureTestPage: NextPage = () => {
  const [category, setCategory] = useState('test');
  const [resourceType, setResourceType] = useState<'image' | 'video'>('image');
  const [signatureResult, setSignatureResult] = useState<any>(null);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testSignature = async () => {
    setLoading(true);
    try {
      console.log('=== TESTING SIGNATURE GENERATION ===');
      
      const sigResponse = await fetch('/api/cloudinary/signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          category,
          resourceType 
        }),
      });

      if (!sigResponse.ok) {
        const errorText = await sigResponse.text();
        throw new Error(`Signature API error: ${errorText}`);
      }

      const signatureData = await sigResponse.json();
      setSignatureResult(signatureData);
      console.log('Received signature data:', signatureData);

      // Verify signature
      const sortedParams = {
        folder: signatureData.folder,
        timestamp: signatureData.timestamp
      };

      const verifyResponse = await fetch('/api/debug/verify-signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ params: sortedParams }),
      });

      const verifyData = await verifyResponse.json();
      setVerificationResult(verifyData);
      console.log('Verification result:', verifyData);

      if (verifyData.generatedSignature === signatureData.signature) {
        toast.success('✅ Signature verification passed!');
      } else {
        toast.error('❌ Signature mismatch!');
      }

    } catch (error) {
      console.error('Error testing signature:', error);
      toast.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const testCloudinaryDirect = async () => {
    if (!signatureResult) {
      toast.error('Generate signature first');
      return;
    }

    try {
      console.log('=== DIRECT CLOUDINARY UPLOAD TEST ===');
      console.log('Signature data to use:', {
        signature: signatureResult.signature?.substring(0, 20) + '...',
        timestamp: signatureResult.timestamp,
        folder: signatureResult.folder,
        api_key: signatureResult.api_key?.substring(0, 10) + '...',
        cloud_name: signatureResult.cloud_name,
        resource_type: signatureResult.resource_type
      });

      // Create test image
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext('2d');
      ctx!.fillStyle = 'red';
      ctx!.fillRect(0, 0, 1, 1);
      
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        
        const formData = new FormData();
        
        // Essential parameters theo Cloudinary docs
        formData.append('file', blob, 'test.png');
        formData.append('api_key', signatureResult.api_key);
        formData.append('signature', signatureResult.signature);
        
        // Signed parameters
        formData.append('folder', signatureResult.folder);
        formData.append('timestamp', signatureResult.timestamp.toString());
        
        const uploadUrl = `https://api.cloudinary.com/v1_1/${signatureResult.cloud_name}/${signatureResult.resource_type}/upload`;
        
        console.log('Upload URL:', uploadUrl);
        console.log('FormData contents:');
        for (let [key, value] of formData.entries()) {
          console.log(`  ${key}:`, value instanceof File ? `File(${value.name}, ${value.size} bytes)` : value);
        }

        const response = await fetch(uploadUrl, {
          method: 'POST',
          body: formData
        });

        const result = await response.json();
        console.log('Cloudinary response:', {
          status: response.status,
          ok: response.ok,
          result
        });

        if (response.ok) {
          toast.success('🎉 Upload successful!');
          console.log('SUCCESS! Uploaded to:', result.secure_url);
        } else {
          console.error('❌ Upload failed:', result.error);
          toast.error(`Upload failed: ${result.error?.message || 'Unknown error'}`);
        }
      }, 'image/png');

    } catch (error) {
      console.error('Direct upload test error:', error);
      toast.error(`Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Toaster position="top-right" />
      
      <Typography variant="h4" gutterBottom>
        🔍 Cloudinary Signature Debug
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Test Parameters
              </Typography>
              
              <Stack spacing={2}>
                <TextField
                  label="Category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  fullWidth
                  size="small"
                />
                
                <TextField
                  label="Resource Type"
                  value={resourceType}
                  onChange={(e) => setResourceType(e.target.value as 'image' | 'video')}
                  select
                  SelectProps={{ native: true }}
                  fullWidth
                  size="small"
                >
                  <option value="image">image</option>
                  <option value="video">video</option>
                </TextField>

                <Button 
                  variant="contained" 
                  onClick={testSignature}
                  disabled={loading}
                  fullWidth
                  size="large"
                >
                  {loading ? '⏳ Testing...' : '🔑 Test Signature Generation'}
                </Button>

                {signatureResult && (
                  <Button 
                    variant="outlined" 
                    onClick={testCloudinaryDirect}
                    fullWidth
                    size="large"
                    color="secondary"
                  >
                    🚀 Test Direct Upload
                  </Button>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Stack spacing={2}>
            {signatureResult && (
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    📝 Signature Result
                  </Typography>
                  <Box 
                    component="pre" 
                    sx={{ 
                      fontSize: '0.75rem', 
                      overflow: 'auto', 
                      bgcolor: 'grey.100', 
                      p: 1, 
                      borderRadius: 1,
                      maxHeight: 200
                    }}
                  >
                    {JSON.stringify({
                      signature: signatureResult.signature?.substring(0, 30) + '...',
                      timestamp: signatureResult.timestamp,
                      folder: signatureResult.folder,
                      api_key: signatureResult.api_key?.substring(0, 15) + '...',
                      cloud_name: signatureResult.cloud_name,
                      resource_type: signatureResult.resource_type
                    }, null, 2)}
                  </Box>
                </CardContent>
              </Card>
            )}

            {verificationResult && (
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    ✅ Verification Result
                  </Typography>
                  <Alert 
                    severity={verificationResult.generatedSignature === signatureResult?.signature ? 'success' : 'error'}
                    sx={{ mb: 1 }}
                  >
                    {verificationResult.generatedSignature === signatureResult?.signature ? 
                      '✅ Signature matches - Ready to upload!' : 
                      '❌ Signature mismatch - Check parameters!'
                    }
                  </Alert>
                  <Box 
                    component="pre" 
                    sx={{ 
                      fontSize: '0.75rem', 
                      overflow: 'auto', 
                      bgcolor: 'grey.100', 
                      p: 1, 
                      borderRadius: 1,
                      maxHeight: 150
                    }}
                  >
                    {JSON.stringify({
                      success: verificationResult.success,
                      matches: verificationResult.generatedSignature === signatureResult?.signature,
                      params: verificationResult.params
                    }, null, 2)}
                  </Box>
                </CardContent>
              </Card>
            )}
          </Stack>
        </Grid>
      </Grid>
    </Container>
  );
};

export default SignatureTestPage;
