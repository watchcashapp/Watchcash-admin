"use client";

import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    TextField,
    IconButton,
    Button,
    Paper,
    CircularProgress,
} from '@mui/material';
import { Add, Delete, Edit } from '@mui/icons-material';
import { useToast, PermissionGuard } from '@/components/shared';
import { useRouter } from 'next/navigation';
import { useGetSettingsQuery, useUpdateSettingsMutation } from '@/store/api/settingsApi';
import { usePermissions } from '@/hooks/usePermissions';

export default function SettingsPage() {
    const [metadata, setMetadata] = useState([{ metakey: '', metavalue: '' }]);
    const [originalSettings, setOriginalSettings] = useState<Record<string, any>>({});
    const [editingRows, setEditingRows] = useState<Record<number, boolean>>({});
    const { showSuccess, showError } = useToast();

    const { data: response, isLoading: isFetching } = useGetSettingsQuery();
    const [updateSettings, { isLoading: isUpdating }] = useUpdateSettingsMutation();
    const router = useRouter();
    const { hasPermission } = usePermissions();

    useEffect(() => {
        if (response?.settings) {
            const settingsObj = response.settings;
            setOriginalSettings(settingsObj);
            const initialMetadata = Object.keys(settingsObj).map((key) => ({
                metakey: key,
                metavalue: typeof settingsObj[key] === 'object' ? JSON.stringify(settingsObj[key]) : String(settingsObj[key])
            }));

            // Always start with a blank row at the top
            setMetadata([{ metakey: '', metavalue: '' }, ...initialMetadata]);
            setEditingRows({});
        }
    }, [response]);

    const isChanged = React.useMemo(() => {
        if (!response?.settings) return false;
        
        // Remove the blank row from consideration
        const actualMetadata = metadata.filter(row => row.metakey.trim() || row.metavalue.trim());
        
        // If lengths differ (excluding the blank row), it's changed
        const originalKeys = Object.keys(originalSettings);
        if (actualMetadata.length !== originalKeys.length) return true;

        // Check if any value or key has changed
        return actualMetadata.some(row => {
            const originalVal = originalSettings[row.metakey];
            if (originalVal === undefined) return true;

            let currentValue: any = row.metavalue;
            try {
                if (row.metavalue.startsWith('{') || row.metavalue.startsWith('[')) {
                    currentValue = JSON.parse(row.metavalue);
                }
            } catch (e) {}

            return JSON.stringify(currentValue) !== JSON.stringify(originalVal);
        });
    }, [metadata, originalSettings, response]);

    const handleAddRow = () => {
        setMetadata([{ metakey: '', metavalue: '' }, ...metadata]);
    };

    const handleRemoveRow = (index: number) => {
        if (metadata.length > 1) {
            const newMetadata = metadata.filter((_, i) => i !== index);
            setMetadata(newMetadata);
        } else {
            setMetadata([{ metakey: '', metavalue: '' }]);
        }
    };

    const handleChange = (index: number, field: 'metakey' | 'metavalue', value: string) => {
        let processedValue = value;
        
        // Prevent leading zeros if the value looks like a number and isn't just "0"
        if (field === 'metavalue' && /^\d+$/.test(value) && value.length > 1 && value.startsWith('0')) {
            processedValue = value.replace(/^0+/, '');
            if (processedValue === '') processedValue = '0';
        }

        const newMetadata = [...metadata];
        newMetadata[index][field] = processedValue;
        setMetadata(newMetadata);
    };

    const handleSubmit = async () => {
        try {
            // Format payload to { settings: { key1: val1, key2: val2 } }
            // Only include changes or new additions
            const settingsPayload: Record<string, any> = {};
            let hasChanges = false;

            metadata.forEach(row => {
                const trimmedKey = row.metakey.trim();
                const trimmedVal = row.metavalue.trim();

                if (trimmedKey || trimmedVal) {
                    // Validation: if either is present, both must be present
                    if (!trimmedKey || !trimmedVal) {
                        showError('Both Meta Key and Meta Value are required for all entries');
                        throw new Error('Validation failed');
                    }

                    // Attempt to parse JSON if it looks like one, otherwise string
                    let currentValue: any = row.metavalue;
                    try {
                        const valToParse = trimmedVal;
                        if (valToParse.startsWith('{') || valToParse.startsWith('[')) {
                            currentValue = JSON.parse(valToParse);
                        }
                    } catch (e) {
                        // Keep as string if parsing fails
                    }

                    const originalValue = originalSettings[trimmedKey];

                    // Compare current with original
                    // If original doesn't exist, it's a new record
                    // If it exists, check if value changed
                    const isNew = originalValue === undefined;
                    const isChanged = !isNew && JSON.stringify(currentValue) !== JSON.stringify(originalValue);

                    if (isNew || isChanged) {
                        settingsPayload[trimmedKey] = currentValue;
                        hasChanges = true;
                    }
                }
            });

            if (!hasChanges) {
                showSuccess('No changes to submit');
                return;
            }

            await updateSettings({ settings: settingsPayload }).unwrap();
            showSuccess('Settings updated successfully');
        } catch (error: any) {
            if (error.message !== 'Validation failed') {
                showError(error?.data?.message || error?.message || 'Failed to update settings');
            }
        }
    };

    if (isFetching) {
        return (
            <Box>
                <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
                    <CircularProgress sx={{ color: (theme) => theme.palette.mode === 'dark' ? 'secondary.main' : 'primary.main' }} />
                </Box>
            </Box>
        );
    }

    return (
        <PermissionGuard permission="admin:full_access">
            <Box>
                <Box sx={{ width: '100%', height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
                    <Typography
                        sx={{
                            fontWeight: 700,
                            fontSize: '1.1rem',
                            mb: 2,
                            background: (theme) => theme.palette.mode === 'dark' ? 'none' : 'linear-gradient(45deg, #213350, #6AB344)',
              WebkitBackgroundClip: (theme) => theme.palette.mode === 'dark' ? 'unset' : 'text',
              WebkitTextFillColor: (theme) => theme.palette.mode === 'dark' ? 'white' : 'transparent',
              backgroundClip: (theme) => theme.palette.mode === 'dark' ? 'unset' : 'text',
              color: (theme) => theme.palette.mode === 'dark' ? 'white' : 'inherit',
                        }}
                    >
                        Meta Settings
                    </Typography>

                    <Paper
                        elevation={0}
                        sx={{
                            p: 1.5,
                            bgcolor: 'background.paper',
                            borderRadius: 1.5,
                            border: '1px solid',
                            borderColor: (theme) =>
                                theme.palette.mode === 'dark'
                                    ? 'rgba(255, 255, 255, 0.1)'
                                    : 'rgba(33, 51, 80, 0.1)',
                            boxShadow: (theme) =>
                                theme.palette.mode === 'dark'
                                    ? '0 4px 20px rgba(0, 0, 0, 0.4)'
                                    : '0 4px 20px rgba(33, 51, 80, 0.05)',
                            flexGrow: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden'
                        }}
                    >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '1.1rem' }}>
                                Metadata Configuration
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ opacity: 0.8, fontSize: '0.75rem' }}>
                                {metadata.length - 1} existing settings
                            </Typography>
                        </Box>

                        <Box 
                            sx={{ 
                                flexGrow: 1, 
                                overflowY: 'auto', 
                                pr: 1,
                                '&::-webkit-scrollbar': {
                                    width: '6px',
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

                            {metadata.map((row, index) => {
                                const isExisting = row.metakey in originalSettings;
                                const isEditing = editingRows[index];
                                const isDisabled = isUpdating || (isExisting && !isEditing);

                                return (
                                    <Box
                                        key={index}
                                        sx={{
                                            display: 'flex',
                                            gap: 2,
                                            mb: 1,
                                            alignItems: 'center',
                                            p: 1,
                                            borderRadius: 1.5,
                                            transition: 'background-color 0.2s ease',
                                            '&:hover': {
                                                bgcolor: (theme) => theme.palette.mode === 'dark'
                                                    ? 'rgba(255, 255, 255, 0.03)'
                                                    : 'rgba(0, 0, 0, 0.02)',
                                            },
                                            border: index === 0 ? '1px dashed #213350' : '1px solid transparent',
                                            bgcolor: index === 0 ? 'rgba(33, 51, 80, 0.04)' : 'transparent',
                                        }}
                                    >
                                        <TextField
                                            fullWidth
                                            label="Meta Key"
                                            value={row.metakey}
                                            onChange={(e) => handleChange(index, 'metakey', e.target.value)}
                                            size="small"
                                            disabled={isUpdating || isExisting}
                                            required
                                            slotProps={{
                                                input: { sx: { fontSize: '0.75rem', height: '32px' } },
                                                inputLabel: { sx: { fontSize: '0.75rem' }, shrink: true }
                                            }}
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    '&:hover fieldset': {
                                                        borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.23)' : '#213350',
                                                    },
                                                    '&.Mui-focused fieldset': {
                                                        borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.23)' : '#213350',
                                                    },
                                                },
                                                '& .MuiInputBase-input.Mui-disabled': {
                                                    WebkitTextFillColor: (theme) => theme.palette.text.primary,
                                                    opacity: 0.7,
                                                }
                                            }}
                                        />
                                        <TextField
                                            fullWidth
                                            label="Meta Value"
                                            value={row.metavalue}
                                            onChange={(e) => handleChange(index, 'metavalue', e.target.value)}
                                            size="small"
                                            disabled={isDisabled}
                                            required
                                            slotProps={{
                                                input: { sx: { fontSize: '0.75rem', height: '32px' } },
                                                inputLabel: { sx: { fontSize: '0.75rem' }, shrink: true }
                                            }}
                                            sx={{
                                                '& .MuiInputLabel-root': {
                                                    transform: 'translate(14px, -6px) scale(0.75)',
                                                    bgcolor: 'background.paper',
                                                    px: 0.5,
                                                },
                                                '& .MuiInputLabel-shrink': {
                                                    transform: 'translate(14px, -6px) scale(0.75)',
                                                },
                                                '& .MuiOutlinedInput-root': {
                                                    '&:hover fieldset': {
                                                        borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.23)' : '#213350',
                                                    },
                                                    '&.Mui-focused fieldset': {
                                                        borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.23)' : '#213350',
                                                    },
                                                },
                                                '& .MuiInputBase-input.Mui-disabled': {
                                                    WebkitTextFillColor: (theme: any) => theme.palette.text.primary,
                                                    opacity: 0.7,
                                                }
                                            }}
                                        />

                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            {index === 0 && (
                                                <IconButton
                                                    onClick={handleAddRow}
                                                    disabled={isUpdating}
                                                    sx={{
                                                        color: '#10b981',
                                                        bgcolor: 'rgba(16, 185, 129, 0.1)',
                                                        '&:hover': { bgcolor: 'rgba(16, 185, 129, 0.2)' },
                                                    }}
                                                >
                                                    <Add />
                                                </IconButton>
                                            )}
                                            {isExisting && !isEditing && (
                                                <IconButton
                                                    onClick={() => setEditingRows(prev => ({ ...prev, [index]: true }))}
                                                    disabled={isUpdating}
                                                    sx={{
                                                        color: '#f59e0b',
                                                        bgcolor: 'rgba(245, 158, 11, 0.1)',
                                                        '&:hover': { bgcolor: 'rgba(245, 158, 11, 0.2)' },
                                                    }}
                                                >
                                                    <Edit />
                                                </IconButton>
                                            )}
                                            <IconButton
                                                onClick={() => handleRemoveRow(index)}
                                                disabled={isUpdating || (metadata.length === 1 && !row.metakey && !row.metavalue)}
                                                sx={{
                                                    color: (metadata.length === 1 && !row.metakey && !row.metavalue) ? 'text.disabled' : '#ef4444',
                                                    bgcolor: (metadata.length === 1 && !row.metakey && !row.metavalue) ? 'transparent' : 'rgba(239, 68, 68, 0.1)',
                                                    '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.2)' },
                                                }}
                                            >
                                                <Delete />
                                            </IconButton>
                                        </Box>
                                    </Box>
                                )
                            })}
                        </Box>

                        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid rgba(0,0,0,0.05)', pt: 2 }}>
                            <Button
                                variant="contained"
                                onClick={handleSubmit}
                                disabled={isUpdating || !isChanged}
                                sx={{
                                    height: '32px',
                                    fontSize: '0.75rem',
                                    px: 3,
                                    color: 'white',
                                    background: 'linear-gradient(45deg, #213350, #6AB344)',
                                    boxShadow: '0 4px 12px rgba(33, 51, 80, 0.4)',
                                    '&:hover': {
                                        background: 'linear-gradient(45deg, #1a2940, #6AB344)',
                                        boxShadow: '0 6px 16px rgba(33, 51, 80, 0.5)',
                                    },
                                    '&.Mui-disabled': {
                                        background: 'rgba(33, 51, 80, 0.5)',
                                        color: 'white',
                                    }
                                }}
                            >
                                {isUpdating ? <CircularProgress size={16} color="inherit" /> : 'Submit'}
                            </Button>
                        </Box>
                    </Paper>
                </Box>
            </Box>
        </PermissionGuard>
    );
}
