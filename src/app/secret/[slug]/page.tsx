'use client';

import React, { useState, useEffect } from 'react';
import {
  Container,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Paper,
  Chip,
} from '@mui/material';
import { useParams, useRouter } from 'next/navigation';
import { Navigation } from '@/components/Navigation';
import { Visibility, Lock, ContentCopy } from '@mui/icons-material';
import dayjs from 'dayjs';

export default function SecretPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  
  const [password, setPassword] = useState('');
  const [secretData, setSecretData] = useState<any>(null);
  const [requirements, setRequirements] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const checkRequirements = async () => {
      try {
        const response = await fetch(`/api/trpc/secret.checkRequirements?input=${encodeURIComponent(JSON.stringify({ slug }))}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error?.message || 'Failed to check secret requirements');
        }
        
        setRequirements(data.result.data);
      } catch (error: any) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    checkRequirements();
  }, [slug]);

  const handleViewSecret = async () => {
    setSubmitting(true);
    try {
      setError(null);
      
      const payload = {
        slug,
        ...(password && { password }),
      };
      
      const response = await fetch(`/api/trpc/secret.getBySlug?input=${encodeURIComponent(JSON.stringify(payload))}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to retrieve secret');
      }
      
      setSecretData(data.result.data);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  if (loading) {
    return (
      <>
        <Navigation />
        <Container maxWidth="md">
          <Box sx={{ py: 8, textAlign: 'center' }}>
            <Typography variant="h5">Loading secret...</Typography>
          </Box>
        </Container>
      </>
    );
  }

  if (error && !requirements) {
    return (
      <>
        <Navigation />
        <Container maxWidth="md">
          <Box sx={{ py: 8 }}>
            <Card>
              <CardContent sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h4" color="error" gutterBottom>
                  Secret Not Available
                </Typography>
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
                <Button
                  variant="outlined"
                  onClick={() => router.push('/')}
                >
                  Go Home
                </Button>
              </CardContent>
            </Card>
          </Box>
        </Container>
      </>
    );
  }

  // Show the secret content if we have it
  if (secretData) {
    return (
      <>
        <Navigation />
        <Container maxWidth="md">
          <Box sx={{ py: 8 }}>
            <Card>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
                    {secretData.title || 'Secret Message'}
                  </Typography>
                  {secretData.isOneTimeAccess && (
                    <Chip
                      icon={<Visibility />}
                      label="One-time access"
                      color="warning"
                      variant="outlined"
                    />
                  )}
                </Box>

                {secretData.expiresAt && (
                  <Alert severity="info" sx={{ mb: 3 }}>
                    <strong>Expires:</strong> {dayjs(secretData.expiresAt).format('MMMM D, YYYY at h:mm A')}
                  </Alert>
                )}

                {secretData.isOneTimeAccess && (
                  <Alert severity="warning" sx={{ mb: 3 }}>
                    <strong>Warning:</strong> This secret has been marked for one-time access and will be permanently deleted now that you&apos;ve viewed it.
                  </Alert>
                )}

                <Paper sx={{ p: 3, bgcolor: 'grey.50', mb: 3 }}>
                  <Typography
                    variant="body1"
                    component="pre"
                    sx={{
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      fontFamily: 'monospace',
                      fontSize: '1rem',
                    }}
                  >
                    {secretData.content}
                  </Typography>
                </Paper>

                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                  <Button
                    variant="contained"
                    startIcon={<ContentCopy />}
                    onClick={() => copyToClipboard(secretData.content)}
                  >
                    Copy Secret
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => router.push('/')}
                  >
                    Done
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Container>
      </>
    );
  }

  // Show password form if required or confirmation
  return (
    <>
      <Navigation />
      <Container maxWidth="sm">
        <Box sx={{ py: 8 }}>
          <Card>
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              {requirements?.requiresPassword && (
                <Lock sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
              )}
              
              <Typography variant="h4" component="h1" gutterBottom>
                {requirements?.title || 'Secret Message'}
              </Typography>
              
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                {requirements?.requiresPassword 
                  ? 'This secret is password protected. Enter the password to view it.'
                  : 'Are you ready to view this secret?'
                }
              </Typography>

              {requirements?.expiresAt && (
                <Alert severity="info" sx={{ mb: 3 }}>
                  <strong>Expires:</strong> {dayjs(requirements.expiresAt).format('MMMM D, YYYY at h:mm A')}
                </Alert>
              )}

              {requirements?.isOneTimeAccess && (
                <Alert severity="warning" sx={{ mb: 3 }}>
                  <strong>One-time access:</strong> This secret will be permanently deleted after viewing.
                </Alert>
              )}

              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}

              {requirements?.requiresPassword && (
                <TextField
                  label="Password"
                  type="password"
                  fullWidth
                  margin="normal"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  sx={{ mb: 3 }}
                />
              )}

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleViewSecret}
                  disabled={submitting || (requirements?.requiresPassword && !password)}
                >
                  {submitting ? 'Loading...' : 'View Secret'}
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => router.push('/')}
                >
                  Cancel
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Container>
    </>
  );
}