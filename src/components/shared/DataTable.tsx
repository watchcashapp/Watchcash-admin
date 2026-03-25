import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Box,
  Typography,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import { Edit, Delete, ToggleOn, ToggleOff, Visibility, RateReview, Block } from '@mui/icons-material';

export interface Column<T> {
  id: keyof T | string;
  label: string;
  minWidth?: number;
  align?: 'left' | 'right' | 'center';
  format?: (value: any, row: T) => React.ReactNode;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  onView?: (row: T) => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  onToggle?: (row: T) => void;
  onMarkReview?: (row: T) => void;
  onBan?: (row: T) => void;
  getRowId: (row: T) => string;
  emptyMessage?: string;
  renderPagination?: () => React.ReactNode;
}

function DataTable<T extends Record<string, any>>({
  columns,
  data,
  isLoading = false,
  onView,
  onEdit,
  onDelete,
  onToggle,
  onMarkReview,
  onBan,
  getRowId,
  emptyMessage = 'No data available',
  renderPagination,
}: DataTableProps<T>) {

  if (isLoading && (!data || data.length === 0)) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress sx={{ color: (theme) => theme.palette.mode === 'dark' ? 'secondary.main' : 'primary.main' }} />
      </Box>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Paper
        sx={{
          p: 4,
          textAlign: 'center',
          bgcolor: 'background.paper',
          backdropFilter: 'blur(20px)',
          boxShadow: (theme) => theme.palette.mode === 'dark'
            ? '0 8px 32px rgba(0, 0, 0, 0.6)'
            : '0 8px 32px rgba(0, 0, 0, 0.1)',
          border: (theme) => theme.palette.mode === 'dark'
            ? '1px solid rgba(255, 255, 255, 0.1)'
            : '1px solid rgba(0, 0, 0, 0.05)',
          borderRadius: 3,
          overflow: 'visible',
        }}
      >
        <Typography variant="body1" color="text.secondary">
          {emptyMessage}
        </Typography>
      </Paper>
    );
  }



  return (
    <Paper
      sx={{
        overflow: 'visible',
        bgcolor: 'background.paper',
        backdropFilter: 'blur(20px)',
        boxShadow: (theme) => theme.palette.mode === 'dark'
          ? '0 8px 32px rgba(0, 0, 0, 0.6)'
          : '0 8px 32px rgba(0, 0, 0, 0.1)',
        border: (theme) => theme.palette.mode === 'dark'
          ? '1px solid rgba(255, 255, 255, 0.1)'
          : '1px solid rgba(0, 0, 0, 0.05)',
        borderRadius: 3,
      }}
    >
      <TableContainer 
        sx={{ 
          overflowX: 'auto',
          '&::-webkit-scrollbar': {
            height: '6px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(33, 51, 80, 0.15)',
            borderRadius: '10px',
            '&:hover': {
              backgroundColor: 'rgba(33, 51, 80, 0.25)',
            },
          },
        }}
      >
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={String(column.id)}
                  align={column.align || 'left'}
                  style={{ minWidth: column.minWidth }}
                  sx={{
                    fontWeight: 600,
                    background: (theme) => theme.palette.mode === 'dark'
                      ? 'linear-gradient(135deg, rgba(33, 51, 80, 0.15) 0%, rgba(106, 179, 68, 0.15) 100%)'
                      : 'linear-gradient(135deg, rgba(33, 51, 80, 0.08) 0%, rgba(106, 179, 68, 0.08) 100%)',
                    color: 'text.primary',
                    fontSize: '0.65rem',
                    whiteSpace: 'nowrap',
                    borderBottom: (theme) => theme.palette.mode === 'dark'
                      ? '2px solid rgba(33, 51, 80, 0.3)'
                      : '2px solid rgba(33, 51, 80, 0.2)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    py: 0.75,
                  }}
                >
                  {column.label}
                </TableCell>
              ))}
              {(onView || onEdit || onDelete || onToggle || onBan) && (
                <TableCell
                  align="center"
                  sx={{
                    fontWeight: 600,
                    background: (theme) => theme.palette.mode === 'dark'
                      ? 'linear-gradient(135deg, rgba(33, 51, 80, 0.15) 0%, rgba(106, 179, 68, 0.15) 100%)'
                      : 'linear-gradient(135deg, rgba(33, 51, 80, 0.08) 0%, rgba(106, 179, 68, 0.08) 100%)',
                    color: 'text.primary',
                    fontSize: '0.65rem',
                    whiteSpace: 'nowrap',
                    borderBottom: (theme) => theme.palette.mode === 'dark'
                      ? '2px solid rgba(33, 51, 80, 0.3)'
                      : '2px solid rgba(33, 51, 80, 0.2)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    py: 0.75,
                  }}
                >
                  Actions
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row, index) => (
              <TableRow
                hover
                key={getRowId(row)}
                sx={{
                  '&:hover': {
                    backgroundColor: (theme) => theme.palette.mode === 'dark'
                      ? 'rgba(33, 51, 80, 0.08)'
                      : 'rgba(33, 51, 80, 0.04)',
                    transition: 'background-color 0.2s ease',
                  },
                  '&:nth-of-type(even)': {
                    backgroundColor: (theme) => theme.palette.mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.02)'
                      : 'rgba(0, 0, 0, 0.01)',
                  },
                }}
              >
                {columns.map((column) => {
                  const value = column.id.toString().includes('.')
                    ? column.id.toString().split('.').reduce((obj, key) => obj?.[key], row)
                    : row[column.id];

                  return (
                    <TableCell
                      key={String(column.id)}
                      align={column.align || 'left'}
                      sx={{
                        fontSize: '0.7rem',
                        color: 'text.primary',
                        py: 0.5,
                        borderBottom: (theme) => theme.palette.mode === 'dark'
                          ? '1px solid rgba(255, 255, 255, 0.08)'
                          : '1px solid rgba(0, 0, 0, 0.06)',
                      }}
                    >
                      {column.format ? column.format(value, row) : (value as React.ReactNode)}
                    </TableCell>
                  );
                })}
                {(onView || onEdit || onDelete || onToggle || onMarkReview || onBan) && (
                  <TableCell
                    align="center"
                    sx={{
                      borderBottom: '1px solid',
                      borderBottomColor: (theme) => theme.palette.mode === 'dark'
                        ? 'rgba(255, 255, 255, 0.08)'
                        : 'rgba(0, 0, 0, 0.06)',
                      py: 0.5,
                    }}
                  >
                    <Box display="flex" gap={1} justifyContent="center">
                      {onMarkReview && (
                        <Tooltip title="Review" arrow>
                          <IconButton
                            size="small"
                            onClick={() => onMarkReview(row)}
                            sx={{
                              color: '#f59e0b',
                              '&:hover': {
                                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                                transform: 'scale(1.1)',
                              },
                              transition: 'all 0.2s ease',
                            }}
                          >
                            <RateReview fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {onView && (
                        <Tooltip title="View Details" arrow>
                          <IconButton
                            size="small"
                            onClick={() => onView(row)}
                            sx={{
                              color: '#10b981',
                              '&:hover': {
                                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                transform: 'scale(1.1)',
                              },
                              transition: 'all 0.2s ease',
                            }}
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {onToggle && (
                        <Tooltip title="Toggle Status" arrow>
                          <IconButton
                            size="small"
                            onClick={() => onToggle(row)}
                            sx={{
                              color: row.enabled ? '#10b981' : '#9ca3af',
                              '&:hover': {
                                backgroundColor: row.enabled ? 'rgba(16, 185, 129, 0.1)' : 'rgba(156, 163, 175, 0.1)',
                                transform: 'scale(1.1)',
                              },
                              transition: 'all 0.2s ease',
                            }}
                          >
                            {row.enabled ? <ToggleOn fontSize="medium" /> : <ToggleOff fontSize="medium" />}
                          </IconButton>
                        </Tooltip>
                      )}
                      {onEdit && (
                        <Tooltip title="Edit" arrow>
                          <IconButton
                            size="small"
                            onClick={() => onEdit(row)}
                            sx={{
                              color: (theme) => theme.palette.mode === 'dark' ? 'secondary.main' : 'primary.main',
                              '&:hover': {
                                backgroundColor: 'rgba(33, 51, 80, 0.1)',
                                transform: 'scale(1.1)',
                              },
                              transition: 'all 0.2s ease',
                            }}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {onDelete && (
                        <Tooltip title="Delete" arrow>
                          <IconButton
                            size="small"
                            onClick={() => onDelete(row)}
                            sx={{
                              color: '#ef4444',
                              '&:hover': {
                                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                transform: 'scale(1.1)',
                              },
                              transition: 'all 0.2s ease',
                            }}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {onBan && (
                        <Tooltip title="Ban User" arrow>
                          <IconButton
                            size="small"
                            onClick={() => onBan(row)}
                            sx={{
                              color: '#dc2626',
                              '&:hover': {
                                backgroundColor: 'rgba(220, 38, 38, 0.1)',
                                transform: 'scale(1.1)',
                              },
                              transition: 'all 0.2s ease',
                            }}
                          >
                            <Block fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {
        renderPagination && (
          <Box sx={{ p: 2, borderTop: (theme) => theme.palette.mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.06)' }}>
            {renderPagination()}
          </Box>
        )
      }
    </Paper>
  );
}

export default React.memo(DataTable) as any;
