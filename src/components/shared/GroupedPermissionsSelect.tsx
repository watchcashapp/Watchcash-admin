import { useState } from 'react';
import {
  Box,
  FormControl,
  FormLabel,
  Paper,
  Checkbox,
  FormControlLabel,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
} from '@mui/material';
import { ExpandMore } from '@mui/icons-material';

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
  const [expanded, setExpanded] = useState<string[]>(
    Object.keys(groupedPermissions)
  );

  const handleToggleCategory = (category: string) => {
    setExpanded((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

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
            mb: 1,
            fontWeight: 600,
            color: 'text.primary',
            '&.Mui-focused': {
              color: 'text.primary',
            },
          }}
        >
          {label}
        </FormLabel>
      )}
      <Paper
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          overflow: 'hidden',
        }}
      >
        {Object.entries(groupedPermissions).map(([category, permissions]) => {
          const { selected, total } = getCategoryStats(permissions);
          const allSelected = selected === total;
          const someSelected = selected > 0 && selected < total;

          return (
            <Accordion
              key={category}
              expanded={expanded.includes(category)}
              onChange={() => handleToggleCategory(category)}
              sx={{
                '&:before': { display: 'none' },
                boxShadow: 'none',
                borderBottom: '1px solid',
                borderColor: 'divider',
                '&:last-child': {
                  borderBottom: 'none',
                },
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMore />}
                sx={{
                  minHeight: '48px',
                  '&.Mui-expanded': {
                    minHeight: '48px',
                  },
                  '& .MuiAccordionSummary-content': {
                    margin: '8px 0',
                    '&.Mui-expanded': {
                      margin: '8px 0',
                    },
                  },
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                }}
              >
                <Box
                  display="flex"
                  alignItems="center"
                  gap={2}
                  width="100%"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Checkbox
                    checked={allSelected}
                    indeterminate={someSelected}
                    onChange={() => handleSelectAll(category, permissions)}
                    onClick={(e) => e.stopPropagation()}
                    size="small"
                    disabled={permissions.every(isPermissionDisabled)}
                  />
                  <Typography
                    sx={{
                      fontWeight: 600,
                      flex: 1,
                      fontSize: '0.875rem',
                    }}
                  >
                    {formatCategoryName(category)}
                  </Typography>
                  <Chip
                    label={`${selected}/${total}`}
                    size="small"
                    color={selected > 0 ? 'primary' : 'default'}
                    sx={{ fontWeight: 500, height: '24px' }}
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0, pb: 1, px: 2 }}>
                <Box display="flex" flexDirection="column" gap={0} pl={1}>
                  {permissions.map((permission) => (
                    <FormControlLabel
                      key={permission.id}
                      control={
                        <Checkbox
                          checked={value.includes(permission.id)}
                          onChange={() => handleTogglePermission(permission)}
                          size="small"
                          disabled={isPermissionDisabled(permission)}
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.8125rem' }}>
                            {permission.name} {permission.isDirect === false && (
                              <Typography component="span" variant="caption" sx={{ color: 'text.secondary', ml: 0.5, fontWeight: 400 }}>
                                (assigned by role)
                              </Typography>
                            )}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: 'block', fontSize: '0.75rem', lineHeight: 1.2 }}
                          >
                            {permission.code}
                          </Typography>
                        </Box>
                      }
                      sx={{
                        ml: 0,
                        py: 0.25,
                        px: 1,
                        borderRadius: 1,
                        '&:hover': {
                          bgcolor: 'action.hover',
                        },
                      }}
                    />
                  ))}
                </Box>
              </AccordionDetails>
            </Accordion>
          );
        })}
      </Paper>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
        {value.length} permission(s) selected
      </Typography>
    </FormControl>
  );
}
