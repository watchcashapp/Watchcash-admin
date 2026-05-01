"use client";

import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, CircularProgress, Alert } from '@mui/material';
import { Gavel, Save, Edit, Visibility } from '@mui/icons-material';
import Button from '@/components/shared/Button';
import Textarea from '@/components/shared/Textarea';
import RichTextEditor from '@/components/shared/RichTextEditor';
import { useGetAdminPrivacyQuery, useGetPublicPrivacyQuery, useUpdatePrivacyMutation } from '@/store/api/legalApi';
import { useToast } from '@/components/shared/Toaster';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { usePermissions } from '@/hooks/usePermissions';

export default function PrivacyPolicyPage() {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { isFullAdmin } = usePermissions();
  const canEdit = isAuthenticated && isFullAdmin;

  const { data: publicData, isLoading, error, refetch } = useGetPublicPrivacyQuery();

  const [updatePrivacy, { isLoading: isUpdating }] = useUpdatePrivacyMutation();
  const { showSuccess, showError } = useToast();

  const [bodyHtml, setBodyHtml] = useState('');
  const [title, setTitle] = useState('');
  const [initialBodyHtml, setInitialBodyHtml] = useState('');
  const [initialTitle, setInitialTitle] = useState('');
  const [isPreview, setIsPreview] = useState(false);

  useEffect(() => {
    if (publicData) {
      const currentBody = publicData.bodyHtml || '';
      const currentTitle = publicData.title || 'Privacy Policy';
      setBodyHtml(currentBody);
      setTitle(currentTitle);
      setInitialBodyHtml(currentBody);
      setInitialTitle(currentTitle);
    }
    // If not an admin, always show preview
    if (!canEdit) {
      setIsPreview(true);
    }
  }, [publicData, canEdit]);

  const hasChanges = bodyHtml !== initialBodyHtml || title !== initialTitle;

  const handleSave = async () => {
    try {
      await updatePrivacy({ title, bodyHtml }).unwrap();
      showSuccess('Privacy Policy updated successfully');
      setInitialBodyHtml(bodyHtml);
      setInitialTitle(title);
      refetch();
    } catch (err: any) {
      showError(err?.data?.message || 'Failed to update Privacy Policy');
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 1 }, maxWidth: '1200px', mx: 'auto' }}>
      {isAuthenticated && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 4,
            flexWrap: 'wrap',
            gap: 2
          }}
        >
          <Box>
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: '1.1rem',
                background: (theme) => theme.palette.mode === 'dark' ? 'none' : 'linear-gradient(45deg, #213350, #6AB344)',
                WebkitBackgroundClip: (theme) => theme.palette.mode === 'dark' ? 'unset' : 'text',
                WebkitTextFillColor: (theme) => theme.palette.mode === 'dark' ? 'white' : 'transparent',
                backgroundClip: (theme) => theme.palette.mode === 'dark' ? 'unset' : 'text',
                color: (theme) => theme.palette.mode === 'dark' ? 'white' : 'inherit',
                display: 'inline-block'
              }}
            >
              {title}
            </Typography>
            {canEdit && (
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', mt: 0 }}>
                Configure and update your application's privacy policy.
              </Typography>
            )}
          </Box>

          {canEdit && (
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                startIcon={isPreview ? <Edit /> : <Visibility />}
                onClick={() => setIsPreview(!isPreview)}
                sx={{
                  borderRadius: 2,
                  minWidth: '160px',
                  px: 0,
                  fontWeight: 600,
                }}
              >
                {isPreview ? 'Edit Source' : 'View Preview'}
              </Button>
              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={handleSave}
                loading={isUpdating}
                disabled={!hasChanges}
                sx={{
                  borderRadius: 2,
                  px: 4,
                  fontWeight: 600,
                }}
              >
                Save Changes
              </Button>
            </Box>
          )}
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 4, borderRadius: 3 }}>
          Failed to load Privacy Policy. Please try refreshing or check your connection.
        </Alert>
      )}

      <Box sx={{ position: 'relative' }}>
        {isPreview ? (
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, md: 5 },
              borderRadius: 4,
              minHeight: '600px',
              border: '1px solid',
              borderColor: 'divider',
              background: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : '#fff',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.05)',
            }}
          >
            <RichTextEditor
              value={bodyHtml}
              readOnly={true}
            />
          </Paper>
        ) : (
          <RichTextEditor
            label="Legal Document Content"
            value={bodyHtml}
            onChange={setBodyHtml}
          />
        )}
      </Box>
    </Box>
  );
}
