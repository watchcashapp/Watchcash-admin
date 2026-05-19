"use client";

import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Chip,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Grid,
  Button,
  CircularProgress,
  LinearProgress,
  Avatar,
  Stack,
  Card,
  Skeleton,
} from '@mui/material';
import { Search, CardGiftcard, Refresh, UploadFile, Close } from '@mui/icons-material';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useToast } from '@/components/shared';

const FileUploadZone = dynamic(() => import('@/components/shared/FileUploadZone'), {
  ssr: false,
  loading: () => <Skeleton variant="rectangular" width="100%" height={150} sx={{ borderRadius: 2 }} />
});
import { config } from '@/config/env';
import { 
  useGetRewardCatalogsQuery, 
  RewardCatalog 
} from '@/store/api/rewardCatalogsApi';
import { PermissionGuard } from '@/components/shared/PermissionGuard';
import { getTokenFromCookie } from "@/utils/auth";
import { Input } from '@/components/shared';

function CatalogSkeleton() {
  return (
    <Grid container spacing={2}>
      {[...Array(8)].map((_, i) => (
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={i}>
          <Card 
            elevation={0} 
            sx={{ 
              height: '100%', 
              borderRadius: 2, 
              border: (theme) => theme.palette.mode === 'dark'
                ? '1px solid rgba(255, 255, 255, 0.08)'
                : '1px solid rgba(0, 0, 0, 0.05)',
            }}
          >
            <Box sx={{ p: 1.5 }}>
              <Stack direction="row" spacing={1.5} alignItems="flex-start" mb={2}>
                <Skeleton variant="rounded" width={48} height={48} sx={{ borderRadius: 1.5 }} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton width="80%" height={20} sx={{ mb: 0.5 }} />
                  <Skeleton width="40%" height={14} />
                </Box>
              </Stack>
              <Stack spacing={1}>
                {[...Array(3)].map((_, j) => (
                  <Box key={j} display="flex" justifyContent="space-between">
                    <Skeleton width={40} height={14} />
                    <Skeleton width={60} height={14} />
                  </Box>
                ))}
              </Stack>
            </Box>
            <Box sx={{ px: 2, py: 1.5, borderTop: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Skeleton width={50} height={20} sx={{ borderRadius: 1 }} />
              <Skeleton width={70} height={14} />
            </Box>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

export default function RewardCatalogPage() {
  const { showSuccess, showError } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [search, setSearch] = useState('');
  const [localSearch, setLocalSearch] = useState(searchParams.get('search') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get('search') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [currency, setCurrency] = useState(searchParams.get('currency') || '');
  const [limit] = useState(8);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [allRewards, setAllRewards] = useState<RewardCatalog[]>([]);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isManualUploading, setIsManualUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(localSearch);
    }, 500);
    return () => clearTimeout(handler);
  }, [localSearch]);

  // Sync local search with global search
  useEffect(() => {
    if (debouncedSearch === '') {
      setLocalSearch('');
    }
  }, [debouncedSearch]);

  // Sync state with URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    
    let changed = false;
    const urlSearch = searchParams.get('search') || "";
    const urlStatus = searchParams.get('status') || "";
    const urlCurrency = searchParams.get('currency') || "";

    if (debouncedSearch !== urlSearch) {
      if (debouncedSearch) params.set('search', debouncedSearch); else params.delete('search');
      changed = true;
    }
    if (status !== urlStatus) {
      if (status) params.set('status', status); else params.delete('status');
      changed = true;
    }
    if (currency !== urlCurrency) {
      if (currency) params.set('currency', currency); else params.delete('currency');
      changed = true;
    }

    if (changed) {
      const queryString = params.toString();
      const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
      // Use window.history.replaceState to update URL without losing focus
      window.history.replaceState({ ...window.history.state, as: newUrl, url: newUrl }, '', newUrl);
    }
  }, [debouncedSearch, status, currency, pathname, router, searchParams]);

  const { data, isLoading, isFetching, refetch } = useGetRewardCatalogsQuery({
    search: debouncedSearch,
    status: status || undefined,
    currency: currency || undefined,
    limit,
    cursor,
  });

  useEffect(() => {
    if (data?.items) {
      if (!cursor) {
        setAllRewards(data.items);
      } else {
        setAllRewards(prev => {
          // Create a Map of existing IDs to ensure uniqueness
          const existingIds = new Set(prev.map(r => r.id));
          const newItems = data.items.filter(r => !existingIds.has(r.id));
          return [...prev, ...newItems];
        });
      }
    }
  }, [data]); // Removed 'cursor' dependency to fix duplication race condition

  const showSkeletons = (isLoading || (isFetching && !cursor)) && allRewards.length === 0;
  const displayedRewards = useMemo(() => {
    if (allRewards.length > 0) return allRewards;
    return (!cursor && data?.items) ? data.items : [];
  }, [allRewards, cursor, data?.items]);

  const handleSearchChange = (val: string) => {
    setLocalSearch(val);
    setCursor(undefined);
  };

  const handleStatusChange = (val: string) => {
    setStatus(val);
    setCursor(undefined);
  };

  const handleCurrencyChange = (val: string) => {
    setCurrency(val);
    setCursor(undefined);
  };

  const handleLoadMore = () => {
    if (data?.pagination?.nextCursor) {
      setCursor(data.pagination.nextCursor);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      showError('Please select a valid CSV file');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setIsManualUploading(true);
    try {
      const accessToken = getTokenFromCookie("accessToken");
      const response = await fetch(`${config.apiUrl}/admin/reward-catalogs/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'ngrok-skip-browser-warning': 'true',
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to upload reward catalog');
      }

      showSuccess('Reward catalog updated successfully');
      setCursor(undefined);
      setAllRewards([]);
      refetch();
    } catch (err: any) {
      showError(err.message || 'Failed to upload reward catalog');
    } finally {
      setIsManualUploading(false);
      setIsImportDialogOpen(false);
    }
  };

  const handleFileSelect = (file: File) => {
    handleFileChange({ target: { files: [file] } } as any);
  };

  const getStatusStyle = (val: string) => {
    const isActive = val === 'ACTIVE';
    return {
      bgcolor: isActive ? 'rgba(106, 179, 68, 0.1)' : 'rgba(239, 68, 68, 0.1)',
      color: isActive ? '#6AB344' : '#ef4444',
      borderColor: isActive ? 'rgba(106, 179, 68, 0.2)' : 'rgba(239, 68, 68, 0.2)',
    };
  };

  return (
    <PermissionGuard permission="reward_catalogs:list">
      <Box>
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mb: 1.5,
            flexWrap: 'wrap',
            gap: 2
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', m: 0, p: 0 }}>
            <Typography 
              sx={{ 
                fontWeight: 700, 
                fontSize: '1.1rem',
                lineHeight: 1,
                mb: 0.5,
                background: (theme) => theme.palette.mode === 'dark' ? 'none' : 'linear-gradient(45deg, #213350, #6AB344)',
              WebkitBackgroundClip: (theme) => theme.palette.mode === 'dark' ? 'unset' : 'text',
              WebkitTextFillColor: (theme) => theme.palette.mode === 'dark' ? 'white' : 'transparent',
              backgroundClip: (theme) => theme.palette.mode === 'dark' ? 'unset' : 'text',
              color: (theme) => theme.palette.mode === 'dark' ? 'white' : 'inherit',
              }}
            >
              Reward Catalog
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1, m: 0 }}>
              Explore and manage available reward items
            </Typography>
          </Box>

          <input
            type="file"
            hidden
            ref={fileInputRef}
            accept=".csv"
            onChange={handleFileChange}
          />

          <Button
            variant="contained"
            size="small"
            startIcon={<UploadFile />}
            onClick={() => setIsImportDialogOpen(true)}
            disabled={isManualUploading || isFetching}
            sx={{
              background: "linear-gradient(45deg, #213350, #6AB344)",
              fontSize: '0.75rem',
              height: '32px',
              px: 2,
              borderRadius: '8px',
              '&:hover': {
                background: "linear-gradient(45deg, #1a2940, #5a9b3a)",
              }
            }}
          >
            IMPORT CSV
          </Button>
        </Box>

        <Paper 
          elevation={0}
          sx={{ 
            p: 1.5, 
            mb: 2, 
            borderRadius: 2,
            bgcolor: 'background.paper',
            position: 'relative',
            overflow: 'hidden',
            border: (theme) => theme.palette.mode === 'dark'
              ? '1px solid rgba(255, 255, 255, 0.1)'
              : '1px solid rgba(0, 0, 0, 0.05)',
          }}
        >
          {(isFetching || isManualUploading) && (
            <LinearProgress 
              sx={{ 
                height: 2, 
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 1,
                bgcolor: 'transparent',
                '& .MuiLinearProgress-bar': {
                  background: 'linear-gradient(45deg, #213350, #6AB344)',
                }
              }} 
            />
          )}
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 5 }}>
              <Input
                placeholder="Search rewards or brands..."
                fullWidth
                value={localSearch}
                onChange={(e) => handleSearchChange(e.target.value)}
                disabled={isManualUploading}
                slotProps={{
                  input: {
                    sx: { fontSize: '0.8rem', height: '36px' },
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search sx={{ fontSize: '1.1rem', color: 'primary.main' }} />
                      </InputAdornment>
                    ),
                  }
                }}
              />
            </Grid>
            
            <Grid size={{ xs: 6, md: 3 }}>
              <Input
                select
                label="Status"
                value={status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={isManualUploading}
                SelectProps={{ displayEmpty: true }}
                InputLabelProps={{ shrink: true }}
                slotProps={{
                  select: { 
                    displayEmpty: true,
                    sx: { fontSize: '0.8rem', height: '36px', display: 'flex', alignItems: 'center' } 
                  },
                }}
              >
                <MenuItem value="" sx={{ fontSize: '0.8rem' }}>All Status</MenuItem>
                <MenuItem value="ACTIVE" sx={{ fontSize: '0.8rem' }}>Active</MenuItem>
                <MenuItem value="INACTIVE" sx={{ fontSize: '0.8rem' }}>Inactive</MenuItem>
              </Input>
            </Grid>

            <Grid size={{ xs: 6, md: 3 }}>
              <Input
                select
                label="Currency"
                value={currency}
                onChange={(e) => handleCurrencyChange(e.target.value)}
                disabled={isManualUploading}
                SelectProps={{ displayEmpty: true }}
                InputLabelProps={{ shrink: true }}
                slotProps={{
                  select: { 
                    displayEmpty: true,
                    sx: { fontSize: '0.8rem', height: '36px', display: 'flex', alignItems: 'center' } 
                  },
                }}
              >
                <MenuItem value="" sx={{ fontSize: '0.8rem' }}>All Currencies</MenuItem>
                <MenuItem value="USD" sx={{ fontSize: '0.8rem' }}>USD</MenuItem>
                <MenuItem value="INR" sx={{ fontSize: '0.8rem' }}>INR</MenuItem>
                <MenuItem value="EUR" sx={{ fontSize: '0.8rem' }}>EUR</MenuItem>
              </Input>
            </Grid>

            <Grid size={{ xs: 12, md: 1 }}>
              <Button 
                fullWidth 
                size="small" 
                variant="outlined" 
                onClick={() => {
                  setLocalSearch('');
                  setDebouncedSearch('');
                  setSearch('');
                  setStatus('');
                  setCurrency('');
                  setCursor(undefined);
                }}
                disabled={isManualUploading}
                sx={{ 
                  height: '36px',
                  borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : '#213350',
                  color: (theme) => theme.palette.mode === 'dark' ? 'text.secondary' : '#213350',
                  '&:hover': { borderColor: '#6AB344' }
                }}
              >
                Clear
              </Button>
            </Grid>
          </Grid>
        </Paper>

        <Grid container spacing={2}>
          {displayedRewards.map((reward) => (
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={reward.id}>
              <Card
                elevation={0}
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 2,
                  transition: 'all 0.2s ease',
                  border: (theme) => theme.palette.mode === 'dark'
                    ? '1px solid rgba(255, 255, 255, 0.08)'
                    : '1px solid rgba(0, 0, 0, 0.05)',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: (theme) => theme.palette.mode === 'dark'
                      ? '0 8px 24px rgba(0,0,0,0.4)'
                      : '0 8px 24px rgba(33, 51, 80, 0.1)',
                  }
                }}
              >
                <Box sx={{ p: 1.5, flex: 1 }}>
                  <Stack direction="row" spacing={1.5} alignItems="flex-start" mb={2}>
                    <Avatar 
                      src={reward.imageUrl || undefined} 
                      variant="rounded"
                      sx={{ 
                        width: 48, 
                        height: 48, 
                        bgcolor: 'rgba(33, 51, 80, 0.03)',
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1.5
                      }}
                    >
                      <CardGiftcard sx={{ color: 'primary.main' }} />
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography 
                        variant="subtitle2" 
                        sx={{ 
                          fontWeight: 700, 
                          lineHeight: 1.2,
                          mb: 0.5,
                          fontSize: '0.85rem',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}
                      >
                        {reward.rewardName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        {reward.brandName}
                      </Typography>
                    </Box>
                  </Stack>

                  <Stack spacing={1}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="caption" color="text.secondary">UTID</Typography>
                      <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                        {reward.utid}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="caption" color="text.secondary">Currency</Typography>
                      <Chip 
                        label={reward.currencyCode} 
                        size="small" 
                        sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }} 
                      />
                    </Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="caption" color="text.secondary">Value</Typography>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.main' }}>
                        {reward.valueType === 'VARIABLE' 
                          ? `${reward.minValue} - ${reward.maxValue}`
                          : reward.faceValue} {reward.currencyCode}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
                
                <Box sx={{ px: 2, py: 1.5, borderTop: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'rgba(33, 51, 80, 0.01)' }}>
                  <Chip
                    label={reward.status}
                    size="small"
                    variant="outlined"
                    sx={{
                      height: 20,
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      ...getStatusStyle(reward.status)
                    }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                    Type: {reward.rewardType}
                  </Typography>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>

        {showSkeletons && (
          <CatalogSkeleton />
        )}

        {displayedRewards.length === 0 && !showSkeletons && !isLoading && !isFetching && (
          <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 2 }}>
            <Typography color="text.secondary">No rewards found matching your criteria</Typography>
          </Paper>
        )}

        {data?.pagination?.hasMore && !showSkeletons && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 2 }}>
            <Button
              variant="contained"
              onClick={handleLoadMore}
              disabled={isFetching}
              startIcon={isFetching ? <CircularProgress size={16} color="inherit" /> : <Refresh />}
              sx={{
                background: 'linear-gradient(45deg, #213350, #6AB344)',
                borderRadius: '20px',
                px: 4,
                color: 'white',
                boxShadow: '0 4px 12px rgba(33, 51, 80, 0.2)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #1a2940, #6AB344)',
                  boxShadow: '0 6px 16px rgba(33, 51, 80, 0.3)',
                }
              }}
            >
              {isFetching ? 'LOADING...' : 'LOAD MORE REWARDS'}
            </Button>
          </Box>
        )}

        <Dialog 
          open={isImportDialogOpen} 
          onClose={() => !isManualUploading && setIsImportDialogOpen(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: { borderRadius: 3, p: 1 }
          }}
        >
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Import Reward Catalog</Typography>
            <IconButton 
              size="small" 
              onClick={() => setIsImportDialogOpen(false)}
              disabled={isManualUploading}
            >
              <Close />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Upload a CSV file containing your reward catalog details. The list will be automatically updated after a successful upload.
            </Typography>
            <FileUploadZone 
              onFileSelect={handleFileSelect}
              isUploading={isManualUploading}
              accept=".csv"
              label="Drag and drop your CSV file here, or click to browse"
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button 
              onClick={() => setIsImportDialogOpen(false)} 
              disabled={isManualUploading}
              color="inherit"
              sx={{ fontWeight: 600 }}
            >
              Cancel
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </PermissionGuard>
  );
}
