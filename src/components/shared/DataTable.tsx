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
  TablePagination,
} from '@mui/material';
import { Edit, Delete, ToggleOn, ToggleOff } from '@mui/icons-material';

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
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  onToggle?: (row: T) => void;
  getRowId: (row: T) => string;
  emptyMessage?: string;
}

export default function DataTable<T extends Record<string, any>>({
  columns,
  data,
  isLoading = false,
  onEdit,
  onDelete,
  onToggle,
  getRowId,
  emptyMessage = 'No data available',
}: DataTableProps<T>) {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress sx={{ color: '#667eea' }} />
      </Box>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Paper
        sx={{
          p: 4,
          textAlign: 'center',
          background: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: 3,
        }}
      >
        <Typography variant="body1" color="text.secondary">
          {emptyMessage}
        </Typography>
      </Paper>
    );
  }

  const paginatedData = data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Paper
      sx={{
        width: '100%',
        overflow: 'hidden',
        background: 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: 3,
      }}
    >
      <TableContainer sx={{ maxHeight: 600 }}>
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
                    background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%)',
                    color: '#4a5568',
                    fontSize: '0.75rem',
                    borderBottom: '2px solid rgba(102, 126, 234, 0.2)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    py: 1.5,
                  }}
                >
                  {column.label}
                </TableCell>
              ))}
              {(onEdit || onDelete || onToggle) && (
                <TableCell
                  align="center"
                  sx={{
                    fontWeight: 600,
                    background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%)',
                    color: '#4a5568',
                    fontSize: '0.75rem',
                    borderBottom: '2px solid rgba(102, 126, 234, 0.2)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    py: 1.5,
                  }}
                >
                  Actions
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.map((row, index) => (
              <TableRow 
                hover 
                key={getRowId(row)} 
                sx={{ 
                  '&:hover': { 
                    backgroundColor: 'rgba(102, 126, 234, 0.04)',
                    transition: 'background-color 0.2s ease',
                  },
                  '&:nth-of-type(even)': {
                    backgroundColor: 'rgba(0, 0, 0, 0.01)',
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
                        fontSize: '0.8125rem',
                        color: '#2d3748',
                        py: 1.5,
                        borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
                      }}
                    >
                      {column.format ? column.format(value, row) : value}
                    </TableCell>
                  );
                })}
                {(onEdit || onDelete || onToggle) && (
                  <TableCell 
                    align="center"
                    sx={{
                      borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
                      py: 1.5,
                    }}
                  >
                    <Box display="flex" gap={1} justifyContent="center">
                      {onToggle && (
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
                      )}
                      {onEdit && (
                        <IconButton
                          size="small"
                          onClick={() => onEdit(row)}
                          sx={{
                            color: '#667eea',
                            '&:hover': {
                              backgroundColor: 'rgba(102, 126, 234, 0.1)',
                              transform: 'scale(1.1)',
                            },
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                      )}
                      {onDelete && (
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
                      )}
                    </Box>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={data.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        sx={{
          borderTop: '1px solid rgba(0, 0, 0, 0.06)',
          '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
            fontSize: '0.875rem',
            color: '#4a5568',
          },
          '.MuiTablePagination-select': {
            fontSize: '0.875rem',
          },
        }}
      />
    </Paper>
  );
}
