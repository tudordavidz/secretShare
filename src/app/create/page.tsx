'use client';

import React, { useState } from 'react';
import {
  Container,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Box,
  FormControlLabel,
  Switch,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { trpc } from '@/lib/trpc';
import { useRouter } from 'next/navigation';
import { Navigation } from '@/components/Navigation';
import dayjs from 'dayjs';
import { ContentCopy, Share } from '@mui/icons-material';

const createSecretSchema = z.object({
  title: z.string().optional(),
  content: z.string().min(1, 'Content is required'),
  password: z.string().optional(),
  expiresAt: z.date().optional().nullable(),
  isOneTimeAccess: z.boolean(),
  expirationOption: z.string(),
});

type CreateSecretForm = z.infer<typeof createSecretSchema>;

export default function CreateSecretPage() {
  const router = useRouter();
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const createSecretMutation = trpc.secret.create.useMutation();

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateSecretForm>({
    resolver: zodResolver(createSecretSchema),
    defaultValues: {
      isOneTimeAccess: false,
      expirationOption: 'never',
    },
  });

  const expirationOption = watch('expirationOption');

  const onSubmit = async (data: CreateSecretForm) => {
    try {
      setError(null);
      setSuccess(null);

      let expiresAt: string | undefined;
      
      if (data.expirationOption !== 'never' && data.expirationOption !== 'custom') {
        const hours = parseInt(data.expirationOption);
        expiresAt = dayjs().add(hours, 'hour').toISOString();
      } else if (data.expirationOption === 'custom' && data.expiresAt) {
        expiresAt = dayjs(data.expiresAt).toISOString();
      }

      const result = await createSecretMutation.mutateAsync({
        title: data.title,
        content: data.content,
        password: data.password || undefined,
        expiresAt,
        isOneTimeAccess: data.isOneTimeAccess,
      });

      const secretUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/secret/${result.slug}`;
      setSuccess(secretUrl);
    } catch (error: any) {
      setError(error.message || 'Failed to create secret');
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  if (success) {
    return (
      <>
        <Navigation />
        <Container maxWidth="md">
          <Box sx={{ py: 8 }}>
            <Card>
              <CardContent sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h4" component="h1" gutterBottom color="success.main">
                  Secret Created Successfully!
                </Typography>
                
                <Typography variant="body1" sx={{ mb: 4 }}>
                  Your secret has been created. Share this link with the intended recipient:
                </Typography>

                <Box sx={{ 
                  p: 3, 
                  bgcolor: 'grey.100', 
                  borderRadius: 2, 
                  mb: 3,
                  wordBreak: 'break-all',
                  fontSize: '1.1rem',
                  fontFamily: 'monospace'
                }}>
                  {success}
                </Box>

                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 4 }}>
                  <Button
                    variant="contained"
                    startIcon={<ContentCopy />}
                    onClick={() => copyToClipboard(success)}
                  >
                    Copy Link
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Share />}
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: 'Secret Link',
                          url: success,
                        });
                      }
                    }}
                  >
                    Share
                  </Button>
                </Box>

                <Alert severity="warning" sx={{ mb: 3 }}>
                  <strong>Important:</strong> This link will only be shown once. Make sure to copy it now!
                </Alert>

                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setSuccess(null);
                      setError(null);
                    }}
                  >
                    Create Another Secret
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => router.push('/dashboard')}
                  >
                    Go to Dashboard
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Container>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <Container maxWidth="md">
        <Box sx={{ py: 8 }}>
          <Typography variant="h3" component="h1" gutterBottom textAlign="center">
            Create Secret
          </Typography>
          
          <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ mb: 4 }}>
            Share sensitive information securely with time-limited, password-protected links.
          </Typography>

          <Card>
            <CardContent sx={{ p: 4 }}>
              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}

              <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                <TextField
                  {...register('title')}
                  label="Title (optional)"
                  fullWidth
                  placeholder="Enter a title for your secret"
                  error={!!errors.title}
                  helperText={errors.title?.message}
                  sx={{ mb: 3 }}
                />

                <TextField
                  {...register('content')}
                  label="Secret Content"
                  multiline
                  rows={6}
                  fullWidth
                  placeholder="Enter your secret content here..."
                  error={!!errors.content}
                  helperText={errors.content?.message}
                  required
                  sx={{ mb: 3 }}
                />

                <TextField
                  {...register('password')}
                  label="Password (optional)"
                  type="password"
                  fullWidth
                  placeholder="Add password protection"
                  error={!!errors.password}
                  helperText={errors.password?.message || 'Leave empty for no password protection'}
                  sx={{ mb: 3 }}
                />

                <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                  <FormControl fullWidth>
                    <InputLabel>Expiration</InputLabel>
                    <Controller
                      name="expirationOption"
                      control={control}
                      render={({ field }) => (
                        <Select {...field} label="Expiration">
                          <MenuItem value="never">Never expire</MenuItem>
                          <MenuItem value="1">1 hour</MenuItem>
                          <MenuItem value="24">24 hours</MenuItem>
                          <MenuItem value="168">7 days</MenuItem>
                          <MenuItem value="720">30 days</MenuItem>
                          <MenuItem value="custom">Custom date</MenuItem>
                        </Select>
                      )}
                    />
                  </FormControl>

                  {expirationOption === 'custom' && (
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <Controller
                        name="expiresAt"
                        control={control}
                        render={({ field }) => (
                          <DateTimePicker
                            label="Custom Expiration"
                            value={field.value ? dayjs(field.value) : null}
                            onChange={(newValue) => {
                              field.onChange(newValue ? newValue.toDate() : null);
                            }}
                            slotProps={{
                              textField: {
                                fullWidth: true,
                                error: !!errors.expiresAt,
                                helperText: errors.expiresAt?.message,
                              },
                            }}
                          />
                        )}
                      />
                    </LocalizationProvider>
                  )}
                </Box>

                <FormControlLabel
                  control={
                    <Controller
                      name="isOneTimeAccess"
                      control={control}
                      render={({ field }) => (
                        <Switch
                          checked={field.value}
                          onChange={field.onChange}
                        />
                      )}
                    />
                  }
                  label="One-time access (secret will be deleted after first view)"
                  sx={{ mb: 3 }}
                />

                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={isSubmitting}
                    sx={{ minWidth: 200 }}
                  >
                    {isSubmitting ? 'Creating Secret...' : 'Create Secret'}
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={() => router.push('/')}
                  >
                    Cancel
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Container>
    </>
  );
}
