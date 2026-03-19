import { useState } from 'react';
import {
  Box,
  FormControl,
  FormLabel,
  Paper,
  Checkbox,
  FormControlLabel,
  Typography,
  Chip,
  Grid,
  Tooltip,
  IconButton,
} from '@mui/material';
import { InfoOutlined, CheckCircleOutline, RadioButtonUnchecked } from '@mui/icons-material';

interface Permission {
  id: string;
  name: string;
  code: string;
  description: string;
  isDirect?: boolean;
}

interface GroupedPermissionsSelectProps {
  label?: string;
  groupedPermissions: { [category: string]: Permission[] };
  value: string[];
  onChange: (selectedIds: string[]) => void;
  disabledCodes?: string[];
}

export default function GroupedPermissionsSelect({
  label,
  groupedPermissions,
  value,
  onChange,
  disabledCodes = ['dashboard:view', 'dashboard:view_total_users'],
}: GroupedPermissionsSelectProps) {
  
  const handleSelectAll = (category: string, permissions: Permission[]) => {
    const categoryIds = permissions.map((p) => p.id);
    const allSelected = categoryIds.every((id) => value.includes(id));

    if (allSelected) {
      // Deselect all in this category
      onChange(value.filter((id) => !categoryIds.includes(id)));
    } else {
      // Select all in this category
      const newValue = [...value];
      categoryIds.forEach((id) => {
        if (!newValue.includes(id)) {
          newValue.push(id);
        }
      });
      onChange(newValue);
    }
  };

  const isPermissionDisabled = (permission: Permission) => {
    return disabledCodes.includes(permission.code);
  };

  const handleTogglePermission = (permission: Permission) => {
    if (isPermissionDisabled(permission)) return;

    if (value.includes(permission.id)) {
      onChange(value.filter((id) => id !== permission.id));
    } else {
      onChange([...value, permission.id]);
    }
  };

  const getCategoryStats = (permissions: Permission[]) => {
    const selected = permissions.filter((p) => value.includes(p.id)).length;
    const total = permissions.length;
    return { selected, total };
  };

  const formatCategoryName = (category: string) => {
    return category
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <FormControl fullWidth>
      {label && (
        <FormLabel
          sx={{
            mb: 2,
            fontWeight: 700,
            fontSize: '1rem',
            color: 'text.primary',
            '&.Mui-focused': {
              color: 'text.primary',
            },
          }}
        >
          {label}
        </FormLabel>
      )}

      <Grid container spacing={2}>
        {Object.entries(groupedPermissions).map(([category, permissions]) => {
          const { selected, total } = getCategoryStats(permissions);
          const allSelected = selected === total;
          const someSelected = selected > 0 && selected < total;

          return (
            <Grid key={category} size={{ xs: 12, md: 6, lg: 4 }}>
              <Paper
                elevation={0}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  overflow: 'hidden',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  bgcolor: (theme) => theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.02)' 
                    : 'rgba(0, 0, 0, 0.01)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: 'primary.main',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  }
                }}
              >
                {/* Category Header */}
                <Box
                  sx={{
                    p: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                  }}
                >
                  <Box display="flex" alignItems="center" gap={1}>
                    <Checkbox
                      checked={allSelected}
                      indeterminate={someSelected}
                      onChange={() => handleSelectAll(category, permissions)}
                      size="small"
                      disabled={permissions.every(isPermissionDisabled)}
                      icon={<RadioButtonUnchecked fontSize="small" />}
                      checkedIcon={<CheckCircleOutline fontSize="small" />}
                    />
                    <Typography
                      sx={{
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        color: 'text.primary',
                      }}
                    >
                      {formatCategoryName(category)}
                    </Typography>
                  </Box>
                  <Chip
                    label={`${selected}/${total}`}
                    size="small"
                    variant={selected > 0 ? "filled" : "outlined"}
                    color={selected > 0 ? 'primary' : 'default'}
                    sx={{ 
                      fontWeight: 600, 
                      height: '20px', 
                      fontSize: '0.65rem',
                      opacity: selected > 0 ? 1 : 0.6
                    }}
                  />
                </Box>

                {/* Permissions List with Internal Scroll */}
                <Box
                  sx={{
                    p: 1,
                    maxHeight: '220px',
                    overflowY: 'auto',
                    flexGrow: 1,
                    '&::-webkit-scrollbar': {
                      width: '4px',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      borderRadius: '4px',
                      bgcolor: 'rgba(0,0,0,0.1)',
                    },
                  }}
                >
                  <Box display="flex" flexDirection="column" gap={0.5}>
                    {permissions.map((permission) => (
                      <Box
                        key={permission.id}
                        sx={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          p: 0.5,
                          borderRadius: 1,
                          '&:hover': {
                            bgcolor: 'action.hover',
                          },
                        }}
                      >
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={value.includes(permission.id)}
                              onChange={() => handleTogglePermission(permission)}
                              size="small"
                              disabled={isPermissionDisabled(permission)}
                            />
                          }
                          label={
                            <Box sx={{ ml: -0.5 }}>
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  fontWeight: 500, 
                                  fontSize: '0.8125rem',
                                  color: value.includes(permission.id) ? 'primary.main' : 'text.primary'
                                }}
                              >
                                {permission.name}
                                {permission.isDirect === false && (
                                  <Typography component="span" variant="caption" sx={{ color: 'text.secondary', ml: 0.5 }}>
                                    (via role)
                                  </Typography>
                                )}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ display: 'block', fontSize: '0.7rem', opacity: 0.7 }}
                              >
                                {permission.code}
                              </Typography>
                            </Box>
                          }
                          sx={{
                            m: 0,
                            width: '100%',
                          }}
                        />
                        {permission.description && (
                          <Tooltip title={permission.description} arrow placement="top">
                            <IconButton size="small" sx={{ mt: 0.5, p: 0.25 }}>
                              <InfoOutlined sx={{ fontSize: '0.875rem', opacity: 0.5 }} />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Paper>
            </Grid>
          );
        })}
      </Grid>
      
      <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <CheckCircleOutline sx={{ fontSize: '1rem', color: 'primary.main' }} />
        <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.primary' }}>
          {value.length} permission(s) selected total
        </Typography>
      </Box>
    </FormControl>
  );
}
