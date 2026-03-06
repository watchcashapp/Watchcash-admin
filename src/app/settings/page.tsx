npm "use client";

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
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useToast } from '@/components/shared';
import { useGetSettingsQuery, useUpdateSettingsMutation } from '@/store/api/settingsApi';

export default function SettingsPage() {
    const [metadata, setMetadata] = useState([{ metakey: '', metavalue: '' }]);
    const [originalSettings, setOriginalSettings] = useState<Record<string, any>>({});
    const [editingRows, setEditingRows] = useState<Record<number, boolean>>({});
    const { showSuccess, showError } = useToast();

    const { data: response, isLoading: isFetching } = useGetSettingsQuery();
    const [updateSettings, { isLoading: isUpdating }] = useUpdateSettingsMutation();

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
        const newMetadata = [...metadata];
        newMetadata[index][field] = value;
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
            <DashboardLayout>
                <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
                    <CircularProgress sx={{ color: '#667eea' }} />
                </Box>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <Box sx={{ width: '100%', mt: 4, px: { xs: 2, md: 4 } }}>
                <Typography
                    variant="h4"
                    gutterBottom
                    sx={{
                        fontWeight: 700,
                        background: 'linear-gradient(45deg, #667eea, #764ba2)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        mb: 4,
                    }}
                >
                    Settings
                </Typography>

                <Paper
                    elevation={0}
                    sx={{
                        p: { xs: 2, md: 5 },
                        borderRadius: 4,
                        bgcolor: 'background.paper',
                        backdropFilter: 'blur(20px)',
                        boxShadow: (theme) => theme.palette.mode === 'dark'
                            ? '0 12px 48px rgba(0, 0, 0, 0.6)'
                            : '0 12px 48px rgba(0, 0, 0, 0.08)',
                        border: (theme) => theme.palette.mode === 'dark'
                            ? '1px solid rgba(255, 255, 255, 0.1)'
                            : '1px solid rgba(0, 0, 0, 0.05)',
                        transition: 'all 0.3s ease-in-out',
                    }}
                >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
                            Metadata Configuration
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ opacity: 0.8 }}>
                            {metadata.length - 1} existing settings
                        </Typography>
                    </Box>

                    {metadata.map((row, index) => {
                        const isExisting = !!originalSettings[row.metakey];
                        const isEditing = editingRows[index];
                        const isDisabled = isUpdating || (isExisting && !isEditing);

                        return (
                            <Box
                                key={index}
                                sx={{
                                    display: 'flex',
                                    gap: 3,
                                    mb: 2,
                                    alignItems: 'center',
                                    p: 1.5,
                                    borderRadius: 2,
                                    transition: 'background-color 0.2s ease',
                                    '&:hover': {
                                        bgcolor: (theme) => theme.palette.mode === 'dark'
                                            ? 'rgba(255, 255, 255, 0.03)'
                                            : 'rgba(0, 0, 0, 0.02)',
                                    },
                                    border: index === 0 ? '1px dashed #667eea' : '1px solid transparent',
                                    bgcolor: index === 0 ? 'rgba(102, 126, 234, 0.04)' : 'transparent',
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
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            '&:hover fieldset': {
                                                borderColor: '#667eea',
                                            },
                                            '&.Mui-focused fieldset': {
                                                borderColor: '#667eea',
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
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            '&:hover fieldset': {
                                                borderColor: '#667eea',
                                            },
                                            '&.Mui-focused fieldset': {
                                                borderColor: '#667eea',
                                            },
                                        },
                                        '& .MuiInputBase-input.Mui-disabled': {
                                            WebkitTextFillColor: (theme) => theme.palette.text.primary,
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

                    <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                            variant="contained"
                            onClick={handleSubmit}
                            disabled={isUpdating}
                            sx={{
                                background: 'linear-gradient(45deg, #667eea, #764ba2)',
                                px: 4,
                                py: 1,
                                fontSize: '1rem',
                                fontWeight: 600,
                                textTransform: 'none',
                                boxShadow: '0 4px 14px 0 rgba(102, 126, 234, 0.39)',
                                '&:hover': {
                                    background: 'linear-gradient(45deg, #5a67d8, #6b46c1)',
                                    boxShadow: '0 6px 20px rgba(102, 126, 234, 0.23)',
                                },
                                '&.Mui-disabled': {
                                    background: 'rgba(102, 126, 234, 0.5)',
                                    color: 'white',
                                }
                            }}
                        >
                            {isUpdating ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Submit'}
                        </Button>
                    </Box>
                </Paper>
            </Box>
        </DashboardLayout>
    );
}
