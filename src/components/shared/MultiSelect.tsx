import React from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  Chip,
  Box,
  SelectChangeEvent,
  FormHelperText,
} from '@mui/material';

export interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  label: string;
  value: string[];
  options: MultiSelectOption[];
  onChange: (value: string[]) => void;
  error?: boolean;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export default function MultiSelect({
  label,
  value,
  options,
  onChange,
  error = false,
  helperText,
  required = false,
  disabled = false,
  placeholder = 'Select options',
}: MultiSelectProps) {
  const handleChange = (event: SelectChangeEvent<string[]>) => {
    const selectedValue = event.target.value;
    onChange(typeof selectedValue === 'string' ? selectedValue.split(',') : selectedValue);
  };

  const handleDelete = (optionValue: string) => {
    onChange(value.filter((v) => v !== optionValue));
  };

  return (
    <FormControl fullWidth error={error} disabled={disabled}>
      <InputLabel
        sx={{
          color: 'text.secondary',
          fontSize: '0.875rem',
          transform: 'translate(20px, -8px) scale(0.8)',
          fontWeight: 500,
          bgcolor: 'background.paper',
          padding: '0 4px',
          borderRadius: '4px',
        }}
      >
        {label}
        {required && <span style={{ color: '#f44336' }}> *</span>}
      </InputLabel>
      <Select
        multiple
        value={value}
        onChange={handleChange}
        renderValue={(selected) => (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {selected.length === 0 ? (
              <span style={{ color: '#999', fontSize: '0.875rem' }}>{placeholder}</span>
            ) : (
              selected.map((val) => {
                const option = options.find((opt) => opt.value === val);
                return (
                  <Chip
                    key={val}
                    label={option?.label || val}
                    size="small"
                    onDelete={() => handleDelete(val)}
                    onMouseDown={(event) => {
                      event.stopPropagation();
                    }}
                    sx={{
                      height: '24px',
                      fontSize: '0.75rem',
                      backgroundColor: 'rgba(102, 126, 234, 0.1)',
                      color: '#667eea',
                      '& .MuiChip-deleteIcon': {
                        color: '#667eea',
                        fontSize: '16px',
                        '&:hover': {
                          color: '#5a67d8',
                        },
                      },
                    }}
                  />
                );
              })
            )}
          </Box>
        )}
        sx={{
          '& .MuiInputBase-input': {
            fontSize: '0.875rem',
          },
          '& .MuiOutlinedInput-root': {
            marginTop: '4px',
          },
        }}
        MenuProps={{
          PaperProps: {
            style: {
              maxHeight: 300,
            },
          },
        }}
      >
        {options.length === 0 ? (
          <MenuItem disabled>
            <ListItemText primary="No options available" />
          </MenuItem>
        ) : (
          options.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              <Checkbox
                checked={value.indexOf(option.value) > -1}
                sx={{
                  color: '#667eea',
                  '&.Mui-checked': {
                    color: '#667eea',
                  },
                }}
              />
              <ListItemText
                primary={option.label}
                sx={{
                  '& .MuiListItemText-primary': {
                    fontSize: '0.875rem',
                  },
                }}
              />
            </MenuItem>
          ))
        )}
      </Select>
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
}
