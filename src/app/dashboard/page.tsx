'use client';

import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  TextField,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Pagination,
  InputAdornment,
  Menu,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Delete as DeleteIcon,
  Link as LinkIcon,
  Visibility as VisibilityIcon,
  Lock as LockIcon,
  MoreVert as MoreVertIcon,
  ContentCopy as ContentCopyIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Navigation } from '@/components/Navigation';
import { trpc } from '@/lib/trpc';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

interface Secret {
  id: string;
  title: string | null;
  slug: string;
  expiresAt: string | null;
  isOneTimeAccess: boolean;
  hasBeenAccessed: boolean;
  createdAt: string;
  accessCount: number;
  hasPassword: boolean;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedSecret, setSelectedSecret] = useState<Secret | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    expiresAt: '',
  });

  const limit = 10;

  // Fetch user secrets
  const {
    data: secretsData,
    isLoading,
    refetch,
  } = trpc.secret.getUserSecrets.useQuery(
    { page, limit },
    { enabled: !!user }
  );

  // Delete mutation
  const deleteMutation = trpc.secret.delete.useMutation({
    onSuccess: () => {
      refetch();
      setDeleteDialogOpen(false);
      setSelectedSecret(null);
    },
  });

  // Update mutation
  const updateMutation = trpc.secret.update.useMutation({
    onSuccess: () => {
      refetch();
      setEditDialogOpen(false);
      setSelectedSecret(null);
    },
  });

  // Filter secrets based on search query
  const filteredSecrets = secretsData?.secrets.filter((secret: any) =>
    secret.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    secret.slug.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleDeleteClick = (secret: Secret) => {
    setSelectedSecret(secret);
    setDeleteDialogOpen(true);
    setMenuAnchor(null);
  };

  const handleEditClick = (secret: Secret) => {
    setSelectedSecret(secret);
    setEditForm({
      title: secret.title || '',
      expiresAt: secret.expiresAt ? secret.expiresAt.split('T')[0] : '',
    });
    setEditDialogOpen(true);
    setMenuAnchor(null);
  };

  const handleEditSave = () => {
    if (selectedSecret) {
      updateMutation.mutate({
        id: selectedSecret.id,
        title: editForm.title || undefined,
        expiresAt: editForm.expiresAt ? new Date(editForm.expiresAt) : undefined,
      });
    }
  };

  const handleDeleteConfirm = () => {
    if (selectedSecret) {
      deleteMutation.mutate({ id: selectedSecret.id });
    }
  };

  const handleCopyUrl = async (slug: string) => {
    if (typeof window === 'undefined') return;
    
    const url = `${window.location.origin}/secret/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
    setMenuAnchor(null);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, secret: Secret) => {
    setMenuAnchor(event.currentTarget);
    setSelectedSecret(secret);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedSecret(null);
  };

  const getSecretStatus = (secret: Secret) => {
    if (secret.expiresAt && new Date(secret.expiresAt) < new Date()) {
      return { label: 'Expired', color: 'error' as const };
    }
    if (secret.isOneTimeAccess && secret.hasBeenAccessed) {
      return { label: 'Accessed', color: 'warning' as const };
    }
    return { label: 'Active', color: 'success' as const };
  };

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <>
      <Navigation />
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Box>
              <Typography variant="h4" component="h1" gutterBottom>
                My Secrets
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Manage your shared secrets and monitor their access
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => router.push('/create')}
              size="large"
            >
              Create New Secret
            </Button>
          </Box>

          {/* Search */}
          <Box sx={{ mb: 4 }}>
            <TextField
              fullWidth
              placeholder="Search secrets by title or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          {/* Success Alert */}
          {copySuccess && (
            <Alert severity="success" sx={{ mb: 3 }}>
              Secret URL copied to clipboard!
            </Alert>
          )}

          {/* Loading */}
          {isLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          )}

          {/* No secrets */}
          {!isLoading && filteredSecrets.length === 0 && !searchQuery && (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" gutterBottom>
                No secrets yet
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Create your first secret to get started
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => router.push('/create')}
              >
                Create Secret
              </Button>
            </Box>
          )}

          {/* No search results */}
          {!isLoading && filteredSecrets.length === 0 && searchQuery && (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" gutterBottom>
                No secrets found
              </Typography>
              <Typography variant="body1" color="text.secondary">
                No secrets match your search query "{searchQuery}"
              </Typography>
            </Box>
          )}

          {/* Secrets Grid */}
          {filteredSecrets.length > 0 && (
            <>
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
                gap: 3, 
                mb: 4 
              }}>
                {filteredSecrets.map((secret: any) => {
                  const status = getSecretStatus(secret);
                  return (
                    <Card key={secret.id} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Typography variant="h6" component="h3" noWrap sx={{ flexGrow: 1, mr: 1 }}>
                            {secret.title || 'Untitled Secret'}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuOpen(e, secret)}
                          >
                            <MoreVertIcon />
                          </IconButton>
                        </Box>

                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                          <Chip label={status.label} color={status.color} size="small" />
                          {secret.hasPassword && (
                            <Chip icon={<LockIcon />} label="Protected" size="small" variant="outlined" />
                          )}
                          {secret.isOneTimeAccess && (
                            <Chip icon={<VisibilityIcon />} label="One-time" size="small" variant="outlined" />
                          )}
                        </Box>

                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          ID: {secret.slug}
                        </Typography>

                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          Created: {dayjs(secret.createdAt).fromNow()}
                        </Typography>

                        {secret.expiresAt && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            Expires: {dayjs(secret.expiresAt).fromNow()}
                          </Typography>
                        )}

                        <Typography variant="body2" color="text.secondary">
                          Access count: {secret.accessCount}
                        </Typography>
                      </CardContent>

                      <CardActions>
                        <Button
                          size="small"
                          startIcon={<LinkIcon />}
                          onClick={() => handleCopyUrl(secret.slug)}
                        >
                          Copy URL
                        </Button>
                        <Button
                          size="small"
                          startIcon={<EditIcon />}
                          onClick={() => handleEditClick(secret)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleDeleteClick(secret)}
                        >
                          Delete
                        </Button>
                      </CardActions>
                    </Card>
                  );
                })}
              </Box>

              {/* Pagination */}
              {secretsData && secretsData.pages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                  <Pagination
                    count={secretsData.pages}
                    page={page}
                    onChange={(_, newPage) => setPage(newPage)}
                    color="primary"
                  />
                </Box>
              )}
            </>
          )}

          {/* Menu */}
          <Menu
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={() => selectedSecret && handleCopyUrl(selectedSecret.slug)}>
              <ContentCopyIcon sx={{ mr: 1 }} />
              Copy URL
            </MenuItem>
            <MenuItem onClick={() => selectedSecret && handleEditClick(selectedSecret)}>
              <EditIcon sx={{ mr: 1 }} />
              Edit
            </MenuItem>
            <MenuItem onClick={() => selectedSecret && handleDeleteClick(selectedSecret)}>
              <DeleteIcon sx={{ mr: 1 }} />
              Delete
            </MenuItem>
          </Menu>

          {/* Edit Dialog */}
          <Dialog
            open={editDialogOpen}
            onClose={() => setEditDialogOpen(false)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>Edit Secret</DialogTitle>
            <DialogContent>
              <Box sx={{ pt: 2 }}>
                <TextField
                  fullWidth
                  label="Title"
                  value={editForm.title}
                  onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                  margin="normal"
                  placeholder="Optional title for your secret"
                />
                <TextField
                  fullWidth
                  label="Expiration Date"
                  type="date"
                  value={editForm.expiresAt}
                  onChange={(e) => setEditForm(prev => ({ ...prev, expiresAt: e.target.value }))}
                  margin="normal"
                  InputLabelProps={{ shrink: true }}
                  helperText="Leave empty for no expiration"
                />
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleEditSave}
                variant="contained"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? (
                  <CircularProgress size={20} />
                ) : (
                  'Save Changes'
                )}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <Dialog
            open={deleteDialogOpen}
            onClose={() => setDeleteDialogOpen(false)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>Delete Secret</DialogTitle>
            <DialogContent>
              <Typography>
                Are you sure you want to delete this secret? This action cannot be undone.
              </Typography>
              {selectedSecret && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Secret: {selectedSecret.title || 'Untitled Secret'} ({selectedSecret.slug})
                </Typography>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleDeleteConfirm}
                color="error"
                variant="contained"
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? (
                  <CircularProgress size={20} />
                ) : (
                  'Delete'
                )}
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Container>
    </>
  );
}
