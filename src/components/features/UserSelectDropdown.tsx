"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Checkbox,
  TextField,
  Autocomplete,
  Chip,
  ListItem,
  ListItemText,
  Paper,
  Button,
  Divider,
} from '@mui/material';
import { Search, People, CheckBox as CheckBoxIcon, CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon } from '@mui/icons-material';
import { useGetUsersQuery, User } from '@/store/api/usersApi';

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

interface UserSelectDropdownProps {
  selectedUserIds: string[];
  onSelectUser: (id: string) => void;
  onSelectAll: (ids: string[]) => void;
  onClearSelection: () => void;
}

export default function UserSelectDropdown({
  selectedUserIds,
  onSelectUser,
  onSelectAll,
  onClearSelection,
}: UserSelectDropdownProps) {
  const [inputValue, setInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [users, setUsers] = useState<User[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(inputValue);
      setCursor(undefined); // Reset pagination on search
      setUsers([]);
    }, 500);
    return () => clearTimeout(timer);
  }, [inputValue]);

  const { data, isLoading, isFetching } = useGetUsersQuery({
    search: searchQuery,
    cursor: cursor,
    limit: 20,
    userType: 'APP', // Only show APP users as recipients by default
  }, {
    skip: !isMenuOpen && searchQuery === '',
  });

  // Append users when data arrives
  useEffect(() => {
    if (data?.users) {
      setUsers((prev) => {
        const newUsers = data.users.filter(
          (newUser) => !prev.some((oldUser) => oldUser.id === newUser.id)
        );
        return [...prev, ...newUsers];
      });
    }
  }, [data]);

  const hasMore = data?.pagination?.hasMore && data?.pagination?.nextCursor;

  const handleScroll = (event: React.UIEvent<HTMLUListElement>) => {
    const listboxNode = event.currentTarget;
    if (
      listboxNode.scrollTop + listboxNode.clientHeight >=
      listboxNode.scrollHeight - 10
    ) {
      if (hasMore && !isFetching) {
        setCursor(data.pagination.nextCursor || undefined);
      }
    }
  };

  const selectedUsers = useMemo(() => {
    // We might not have all selected users in the 'users' list if they weren't fetched yet
    // But for the Autocomplete 'value' prop, we need the objects.
    // However, since we only have IDs, we'll try to find them in our 'users' list.
    return users.filter(u => selectedUserIds.includes(u.id));
  }, [users, selectedUserIds]);

  return (
    <Box sx={{ width: '100%' }}>
      <Autocomplete
        multiple
        open={isMenuOpen}
        onOpen={() => setIsMenuOpen(true)}
        onClose={() => setIsMenuOpen(false)}
        options={users}
        disableCloseOnSelect
        getOptionLabel={(option) => option.name || option.email}
        value={selectedUsers}
        onChange={(_, newValue) => {
          // This is tricky because newValue only contains fetched users
          // We handle individual selection via onSelectUser
        }}
        inputValue={inputValue}
        onInputChange={(_, newInputValue) => setInputValue(newInputValue)}
        loading={isLoading || isFetching}
        renderOption={(props, option, { selected }) => {
          const { key, ...rest } = props as any;
          return (
            <li key={option.id} {...rest} onClick={(e) => {
              e.preventDefault();
              onSelectUser(option.id);
            }}>
              <Checkbox
                icon={icon}
                checkedIcon={checkedIcon}
                style={{ marginRight: 8 }}
                checked={selectedUserIds.includes(option.id)}
              />
              <ListItemText
                primary={option.name}
                secondary={option.email}
                primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 600 }}
                secondaryTypographyProps={{ fontSize: '0.75rem' }}
              />
            </li>
          );
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            variant="outlined"
            label="Search and Select Users"
            placeholder="Type name or email..."
            slotProps={{
              input: {
                ...params.InputProps,
                startAdornment: (
                  <>
                    <Search sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} />
                    {params.InputProps.startAdornment}
                  </>
                ),
                endAdornment: (
                  <>
                    {isLoading || isFetching ? (
                      <CircularProgress color="inherit" size={20} />
                    ) : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              },
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                bgcolor: 'background.paper',
                '& fieldset': {
                  borderColor: 'divider',
                },
                '&:hover fieldset': {
                  borderColor: 'primary.main',
                },
              },
            }}
          />
        )}
        ListboxProps={{
          onScroll: handleScroll,
          sx: {
            maxHeight: 300,
            '& .MuiAutocomplete-option': {
              padding: '8px 12px',
              '&:hover': {
                bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(106, 179, 68, 0.1)' : 'rgba(33, 51, 80, 0.04)',
              },
            },
            '&::-webkit-scrollbar': {
              width: '6px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              background: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
              borderRadius: '10px',
            },
            '&::-webkit-scrollbar-thumb:hover': {
              background: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
            },
          },
        }}
        renderTags={(tagValue, getTagProps) =>
          tagValue.map((option, index) => {
             const { key, ...tagProps } = getTagProps({ index });
             return (
            <Chip
              key={option.id}
              label={option.name}
              size="small"
              {...tagProps}
              onDelete={() => onSelectUser(option.id)}
              sx={{
                borderRadius: 1,
                bgcolor: 'primary.light',
                color: 'primary.contrastText',
                fontWeight: 600,
                fontSize: '0.75rem',
                m: 0.5,
              }}
            />
          )})
        }
        noOptionsText={
          isLoading ? 'Loading users...' : 'No users found'
        }
      />
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, px: 0.5 }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <People sx={{ fontSize: 14 }} />
          {selectedUserIds.length} users selected
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button 
            size="small" 
            variant="text" 
            onClick={() => {
              // Fetch all users and select them? 
              // Usually we'd want to select all users currently in the list or all users in DB.
              // For now, let's just clear.
              onClearSelection();
            }}
            sx={{ fontSize: '0.7rem', color: 'error.main' }}
          >
            Clear All
          </Button>
          <Button 
            size="small" 
            variant="text" 
            onClick={() => {
              // Select all visible users
              const allVisibleIds = users.map(u => u.id);
              onSelectAll(Array.from(new Set([...selectedUserIds, ...allVisibleIds])));
            }}
            sx={{ fontSize: '0.7rem' }}
          >
            Select All Visible
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
