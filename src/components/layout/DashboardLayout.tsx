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
  Collapse,
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
  Security,
  Brightness4,
  Badge,
  ExpandLess,
  ExpandMore,
  PersonOutline,
  AdminPanelSettings,
} from '@mui/icons-material';
import { useRouter, usePathname } from 'next/navigation';
import { useToast, ConfirmDialog } from '@/components/shared';
import { useLogoutMutation } from '@/store/api/authApi';
import { clearAuth } from '@/store/slices/authSlice';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import ThemeSwitcher from '@/components/ThemeSwitcher';

const drawerWidth = 280;

interface DashboardLayoutProps {
  children: React.ReactNode;
}

interface MenuItem {
  text: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { text: string; icon: React.ReactNode; path: string }[];
}

const menuItems: MenuItem[] = [
  { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
  { text: 'User Management', icon: <People />, path: '/users' },
  {
    text: 'Staff Management',
    icon: <Badge />,
    subItems: [
      { text: 'Staff Users', icon: <PersonOutline />, path: '/staff/users' },
      { text: 'Roles', icon: <AdminPanelSettings />, path: '/staff/roles' },
    ]
  },
  { text: 'Reward Redemptions', icon: <AccountBalance />, path: '/reward-redemptions' },
  { text: 'Sessions', icon: <BarChart />, path: '/sessions' },
  { text: 'App Rules', icon: <Rule />, path: '/app-rules' },
  { text: 'Global Rules', icon: <Settings />, path: '/global-rules' },
  // { text: 'Transactions', icon: <AccountBalance />, path: '/transactions' },
  { text: 'Profile Settings', icon: <AccountCircle />, path: '/profile' },
  // { text: 'Reports', icon: <BarChart />, path: '/reports' },
  // { text: 'Settings', icon: <Settings />, path: '/settings' },
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
  const [themeDialogOpen, setThemeDialogOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [openSubMenus, setOpenSubMenus] = useState<{ [key: string]: boolean }>({});

  // Auto-expand submenus when their child routes are active
  React.useEffect(() => {
    menuItems.forEach((item) => {
      if (item.subItems) {
        const isChildActive = item.subItems.some(subItem =>
          pathname === subItem.path || pathname.startsWith(subItem.path + '/')
        );
        if (isChildActive && !openSubMenus[item.text]) {
          setOpenSubMenus(prev => ({
            ...prev,
            [item.text]: true
          }));
        }
      }
    });
  }, [pathname]);

  // Ctrl+K shortcut for theme switcher
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        setThemeDialogOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogoutClick = () => {
    handleMenuClose();
    setLogoutConfirmOpen(true);
  };

  const handleLogoutConfirm = async () => {
    setIsLoggingOut(true);
    try {
      if (refreshToken) {
        await logout({ refreshToken }).unwrap();
      }
      dispatch(clearAuth());

      // Clear all auth cookies including agency owner token
      document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
      document.cookie = 'refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
      document.cookie = 'agency_owner_gs_authtoken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';

      showSuccess('Logged out successfully!');

      // Use window.location for hard redirect to ensure middleware picks up cleared cookie
      window.location.href = '/auth/login';
    } catch (error: any) {
      const errorMessage = error?.data?.message || error?.message || 'Logout failed';
      showError(errorMessage);
      setIsLoggingOut(false);
      setLogoutConfirmOpen(false);
    }
  };

  const handleNavigation = (path: string) => {
    router.push(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const handleSubMenuToggle = (menuText: string) => {
    setOpenSubMenus(prev => ({
      ...prev,
      [menuText]: !prev[menuText]
    }));
  };

  const isMenuItemActive = (item: MenuItem): boolean => {
    if (item.path) {
      return pathname === item.path || pathname.startsWith(item.path + '/');
    }
    if (item.subItems) {
      return item.subItems.some(subItem =>
        pathname === subItem.path || pathname.startsWith(subItem.path + '/')
      );
    }
    return false;
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
          <React.Fragment key={item.text}>
            <ListItem disablePadding>
              <ListItemButton
                selected={isMenuItemActive(item)}
                onClick={() => {
                  if (item.path) {
                    handleNavigation(item.path);
                  } else if (item.subItems) {
                    handleSubMenuToggle(item.text);
                  }
                }}
                sx={{
                  '&.Mui-selected': {
                    background: item.subItems
                      ? 'rgba(102, 126, 234, 0.15)'
                      : 'linear-gradient(45deg, #667eea, #764ba2)',
                    color: item.subItems ? 'text.primary' : 'white',
                    '&:hover': {
                      background: item.subItems
                        ? 'rgba(102, 126, 234, 0.2)'
                        : 'linear-gradient(45deg, #5a67d8, #764ba2)',
                    },
                    '& .MuiListItemIcon-root': {
                      color: item.subItems ? '#667eea' : 'white',
                    },
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(102, 126, 234, 0.08)',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isMenuItemActive(item)
                      ? (item.subItems ? '#667eea' : 'white')
                      : 'text.secondary',
                    transition: 'color 0.2s ease',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  sx={{
                    '& .MuiListItemText-primary': {
                      color: isMenuItemActive(item)
                        ? (item.subItems ? 'text.primary' : 'white')
                        : 'text.primary',
                      fontWeight: isMenuItemActive(item) ? 600 : 400,
                      transition: 'all 0.2s ease',
                    }
                  }}
                />
                {item.subItems && (
                  openSubMenus[item.text] ? <ExpandLess /> : <ExpandMore />
                )}
              </ListItemButton>
            </ListItem>

            {item.subItems && (
              <Collapse in={openSubMenus[item.text]} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {item.subItems.map((subItem) => (
                    <ListItemButton
                      key={subItem.text}
                      selected={pathname === subItem.path || pathname.startsWith(subItem.path + '/')}
                      onClick={() => handleNavigation(subItem.path)}
                      sx={{
                        pl: 4,
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
                          color: pathname === subItem.path || pathname.startsWith(subItem.path + '/') ? 'white' : 'text.secondary',
                          transition: 'color 0.2s ease',
                          minWidth: 40,
                        }}
                      >
                        {subItem.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={subItem.text}
                        sx={{
                          '& .MuiListItemText-primary': {
                            color: pathname === subItem.path || pathname.startsWith(subItem.path + '/') ? 'white' : 'text.primary',
                            fontWeight: pathname === subItem.path || pathname.startsWith(subItem.path + '/') ? 600 : 400,
                            transition: 'all 0.2s ease',
                            fontSize: '0.9rem',
                          }
                        }}
                      />
                    </ListItemButton>
                  ))}
                </List>
              </Collapse>
            )}
          </React.Fragment>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          backgroundColor: 'background.paper',
          color: 'text.primary',
          boxShadow: 1,
          zIndex: 1200,
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
                {user?.name?.[0]?.toUpperCase() || ''}
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
              slotProps={{
                paper: {
                  sx: {
                    bgcolor: 'background.paper',
                    backdropFilter: 'blur(20px)',
                    boxShadow: (theme) => theme.palette.mode === 'dark'
                      ? '0 8px 32px rgba(0, 0, 0, 0.6)'
                      : '0 8px 32px rgba(0, 0, 0, 0.1)',
                    border: (theme) => theme.palette.mode === 'dark'
                      ? '1px solid rgba(255, 255, 255, 0.1)'
                      : '1px solid rgba(0, 0, 0, 0.1)',
                    minWidth: 200,
                  }
                }
              }}
            >
              {user && (
                <Box sx={{
                  px: 2,
                  py: 1.5,
                  borderBottom: (theme) => theme.palette.mode === 'dark'
                    ? '1px solid rgba(255, 255, 255, 0.1)'
                    : '1px solid rgba(0, 0, 0, 0.08)'
                }}>
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
                onClick={() => {
                  handleMenuClose();
                  setThemeDialogOpen(true);
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
                  <Brightness4 fontSize="small" />
                </ListItemIcon>
                <Typography sx={{ fontWeight: 500 }}>Theme</Typography>
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
                onClick={handleLogoutClick}
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
          p: { xs: 2, sm: 3 },
          width: { md: `calc(100% - ${drawerWidth}px)` },
          maxWidth: '100%',
          overflow: 'auto',
          backgroundColor: 'background.default',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Toolbar />
        {children}
      </Box>

      {/* Theme Switcher Dialog */}
      <ThemeSwitcher open={themeDialogOpen} onClose={() => setThemeDialogOpen(false)} />

      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        open={logoutConfirmOpen}
        title="Confirm Logout"
        message="Are you sure you want to logout? You will need to login again to access the dashboard."
        confirmText="Logout"
        cancelText="Cancel"
        severity="error"
        isLoading={isLoggingOut}
        onConfirm={handleLogoutConfirm}
        onCancel={() => setLogoutConfirmOpen(false)}
      />
    </Box>
  );
}
