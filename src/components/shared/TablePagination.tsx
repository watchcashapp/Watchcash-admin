"use client";

import React from 'react';
import {
    Box,
    Typography,
    IconButton,
    MenuItem,
    TextField,
} from '@mui/material';
import { NavigateBefore, NavigateNext } from '@mui/icons-material';

interface TablePaginationProps {
    pageNumber: number;
    limit: number;
    onLimitChange: (newLimit: number) => void;
    canGoBack: boolean;
    hasMore: boolean;
    onNext: () => void;
    onPrevious: () => void;
    totalResults?: number | null;
    resultsOnPage: number;
    isLoading?: boolean;
}

const TablePagination: React.FC<TablePaginationProps> = ({
    pageNumber,
    limit,
    onLimitChange,
    canGoBack,
    hasMore,
    onNext,
    onPrevious,
    totalResults,
    resultsOnPage,
    isLoading = false,
}) => {
    if (isLoading) return null;

    return (
        <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mt: 2,
            mb: 1,
            px: { xs: 0, sm: 1 }
        }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                Showing {resultsOnPage}{typeof totalResults === 'number' ? ` of ${totalResults}` : ''} results
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', display: { xs: 'none', sm: 'block' } }}>
                        Rows per page:
                    </Typography>
                    <TextField
                        select
                        size="small"
                        value={limit}
                        onChange={(e) => onLimitChange(Number(e.target.value))}
                        sx={{
                            '& .MuiInputBase-root': {
                                fontSize: '0.75rem',
                                height: '28px',
                                minWidth: '60px',
                                borderRadius: 1,
                            },
                        }}
                    >
                        {[6, 20, 50, 100].map((option) => (
                            <MenuItem key={option} value={option} sx={{ fontSize: '0.75rem' }}>
                                {option}
                            </MenuItem>
                        ))}
                    </TextField>
                </Box>

                <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                    <IconButton
                        size="small"
                        onClick={onPrevious}
                        disabled={!canGoBack}
                        sx={{
                            color: !canGoBack ? 'action.disabled' : 'text.secondary',
                            '&:hover': { bgcolor: 'action.hover' }
                        }}
                    >
                        <NavigateBefore fontSize="small" />
                    </IconButton>
                    <Typography variant="body2" sx={{ mx: 0.5, minWidth: '40px', textAlign: 'center', color: 'text.secondary', fontSize: '0.75rem' }}>
                        Page {pageNumber}
                    </Typography>
                    <IconButton
                        size="small"
                        onClick={onNext}
                        disabled={!hasMore}
                        sx={{
                            color: !hasMore ? 'action.disabled' : 'text.secondary',
                            '&:hover': { bgcolor: 'action.hover' }
                        }}
                    >
                        <NavigateNext fontSize="small" />
                    </IconButton>
                </Box>
            </Box>
        </Box>
    );
};

export default TablePagination;
