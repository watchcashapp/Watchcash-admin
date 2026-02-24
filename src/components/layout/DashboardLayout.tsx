"use client";

import React, { useState } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  AccountBalance,
  BarChart,
  Settings,
  Logout,
  AccountCircle,
  Rule,
  People,
} from '@mui/icons-material';
import { useRouter, usePathname } from 'next/navigation';
import { useToast } from '@/components/shared';
import { useLogoutMutation } from '@/store/api/authApi';
import { clearAuth } from '@/store/slices/authSlice';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';

const drawerWidth = 280;

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const menuItems = [
  { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
  { text: 'User Management', icon: <People />, path: '/users' },
  { text: 'App Rules', icon: <Rule />, path: '/app-rules' },
  { text: 'Global Rules', icon: <Settings />, path: '/global-rules' },
  { text: 'Transactions', icon: <AccountBalance />, path: '/transactions' },
  { text: 'Profile Settings', icon: <AccountCircle />, path: '/profile' },
  { text: 'Reports', icon: <BarChart />, path: '/reports' },
  { text: 'Settings', icon: <Settings />, path: '/settings' },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch();
  const { showSuccess, showError } = useToast();
  const [logout] = useLogoutMutation();
  const { refreshToken, user } = useSelector((state: RootState) => state.auth);

  console.log('DashboardLayout - user from Redux:', user);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      if (refreshToken) {
        await logout({ refreshToken }).unwrap();
      }
      dispatch(clearAuth());
      
      // Clear both cookies
      document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
      document.cookie = 'refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
      
      showSuccess('Logged out successfully!');
      
      // Use window.location for hard redirect to ensure middleware picks up cleared cookie
      window.location.href = '/auth/login';
    } catch (error: any) {
      const errorMessage = error?.data?.message || error?.message || 'Logout failed';
      showError(errorMessage);
    }
    handleMenuClose();
  };

  const handleNavigation = (path: string) => {
    router.push(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const drawer = (
    <Box>
      <Toolbar>
        <Typography 
          variant="h6" 
          noWrap 
          component="div" 
          sx={{ 
            fontWeight: 700,
            background: 'linear-gradient(45deg, #667eea, #764ba2)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          }}
        >
          WatchCash Admin
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={pathname === item.path}
              onClick={() => handleNavigation(item.path)}
              sx={{
                '&.Mui-selected': {
                  background: 'linear-gradient(45deg, #667eea, #764ba2)',
                  color: 'white',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #5a67d8, #764ba2)',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'white',
                  },
                },
                '&:hover': {
                  backgroundColor: 'rgba(102, 126, 234, 0.08)',
                },
              }}
            >
              <ListItemIcon 
                sx={{ 
                  color: pathname === item.path ? 'white' : 'text.secondary',
                  transition: 'color 0.2s ease',
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text}
                sx={{ 
                  '& .MuiListItemText-primary': {
                    color: pathname === item.path ? 'white' : 'text.primary',
                    fontWeight: pathname === item.path ? 600 : 400,
                    transition: 'all 0.2s ease',
                  }
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          backgroundColor: 'background.paper',
          color: 'text.primary',
          boxShadow: 1,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Box sx={{ flexGrow: 1 }} />
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {user && (
              <>
                <Box sx={{ display: { xs: 'none', sm: 'block' }, textAlign: 'right' }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontWeight: 600,
                      background: 'linear-gradient(45deg, #667eea, #764ba2)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      lineHeight: 1.2,
                    }}
                  >
                    {user.name}
                  </Typography>
                 
                </Box>
              </>
            )}
            
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenuOpen}
              color="inherit"
              sx={{
                '& .MuiAvatar-root': {
                  background: 'linear-gradient(45deg, #667eea, #764ba2)',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                }
              }}
            >
              <Avatar sx={{ width: 32, height: 32 }}>
                {user?.name?.[0]?.toUpperCase() || 'A'}
              </Avatar>
            </IconButton>
            
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              PaperProps={{
                sx: {
                  background: 'rgba(255, 255, 255, 0.98)',
                  backdropFilter: 'blur(20px)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  minWidth: 200,
                }
              }}
            >
              {user && (
                <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid rgba(0, 0, 0, 0.08)' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    {user.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {user.email}
                  </Typography>
                </Box>
              )}
              <MenuItem 
                onClick={() => {
                  handleMenuClose();
                  router.push('/profile');
                }}
                sx={{
                  '&:hover': {
                    backgroundColor: 'rgba(102, 126, 234, 0.08)',
                  }
                }}
              >
                <ListItemIcon 
                  sx={{ 
                    color: 'text.secondary',
                    '&:hover': {
                      color: 'primary.main',
                    }
                  }}
                >
                  <AccountCircle fontSize="small" />
                </ListItemIcon>
                <Typography sx={{ fontWeight: 500 }}>Profile</Typography>
              </MenuItem>
              <MenuItem 
                onClick={handleMenuClose}
                sx={{
                  '&:hover': {
                    backgroundColor: 'rgba(102, 126, 234, 0.08)',
                  }
                }}
              >
                <ListItemIcon 
                  sx={{ 
                    color: 'text.secondary',
                    '&:hover': {
                      color: 'primary.main',
                    }
                  }}
                >
                  <Settings fontSize="small" />
                </ListItemIcon>
                <Typography sx={{ fontWeight: 500 }}>Settings</Typography>
              </MenuItem>
              <Divider />
              <MenuItem 
                onClick={handleLogout}
                sx={{
                  '&:hover': {
                    backgroundColor: 'rgba(239, 68, 68, 0.08)',
                  }
                }}
              >
                <ListItemIcon 
                  sx={{ 
                    color: 'error.main',
                  }}
                >
                  <Logout fontSize="small" />
                </ListItemIcon>
                <Typography sx={{ fontWeight: 500, color: 'error.main' }}>Logout</Typography>
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
        aria-label="mailbox folders"
      >
        <Drawer
          variant={isMobile ? 'temporary' : 'permanent'}
          open={isMobile ? mobileOpen : true}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              borderRight: '1px solid',
              borderColor: 'divider',
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          backgroundColor: 'background.default',
          minHeight: '100vh',
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}
