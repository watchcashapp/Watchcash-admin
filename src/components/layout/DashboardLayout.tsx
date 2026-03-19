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
  Badge,
  useTheme,
  useMediaQuery,
  Collapse,
  CircularProgress,
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
  Badge as BadgeIcon,
  ExpandLess,
  ExpandMore,
  PersonOutline,
  AdminPanelSettings,
  History,
  NotificationsNone,
  DoneAll,
  Close,
  CardGiftcard,
} from '@mui/icons-material';
import { useRouter, usePathname } from 'next/navigation';
import { useToast, ConfirmDialog } from '@/components/shared';
import { useLogoutMutation } from '@/store/api/authApi';
import { clearAuth } from '@/store/slices/authSlice';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import { usePermissions } from '@/hooks/usePermissions';
import { useNotifications } from '@/components/notifications/NotificationsProvider';

const drawerWidth = 210;

interface DashboardLayoutProps {
  children: React.ReactNode;
}

interface MenuItem {
  text: string;
  icon: React.ReactNode;
  path?: string;
  permission?: string;
  subItems?: { text: string; icon: React.ReactNode; path: string; permission?: string }[];
}

const menuItems: MenuItem[] = [
  { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard', permission: 'dashboard:view' },
  { text: 'User Management', icon: <People />, path: '/users', permission: 'users:list' },
  {
    text: 'Staff Management',
    icon: <BadgeIcon />,
    permission: 'staff:list',

    subItems: [
      { text: 'Staff Users', icon: <PersonOutline />, path: '/staff/users', permission: 'staff:list' },
      { text: 'Roles', icon: <AdminPanelSettings />, path: '/staff/roles', permission: 'rbac:manage_roles' },
    ]
  },
  { text: 'Reward Redemptions', icon: <AccountBalance />, path: '/reward-redemptions', permission: 'reward_redemptions:list' },
  { text: 'Reward Catalog', icon: <CardGiftcard />, path: '/reward-catalog', permission: 'reward_catalogs:list' },
  { text: 'Sessions', icon: <BarChart />, path: '/sessions', permission: 'sessions:view_live' },
  { text: 'App Rules', icon: <Rule />, path: '/app-rules', permission: 'app_rules:list' },
  { text: 'Audit Logs', icon: <History />, path: '/audit-logs', permission: 'admin_audit_logs:view' },
  { text: 'Login History', icon: <History />, path: '/login-history', permission: 'login_history:list' },
  { text: 'Global Rules', icon: <Settings />, path: '/global-rules', permission: 'global_rules:view' },
  { text: 'Profile Settings', icon: <AccountCircle />, path: '/profile' },
  { text: 'Notifications', icon: <NotificationsNone />, path: '/notifications' },
  { text: 'Settings', icon: <Settings />, path: '/settings', permission: 'admin:full_access' },
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
  const { hasPermission, isInitialized } = usePermissions();

  const filteredMenuItems = React.useMemo(() => {
    return menuItems
      .filter(item => !item.permission || hasPermission(item.permission))
      .map(item => {
        if (!item.subItems) return item;

        const visibleSubItems = item.subItems.filter(subItem =>
          !subItem.permission || hasPermission(subItem.permission)
        );

        return {
          ...item,
          subItems: visibleSubItems
        };
      })
      .filter(item => {
        // Hide parent if it has no path AND no visible sub-items
        if (item.subItems && item.subItems.length === 0 && !item.path) {
          return false;
        }
        return true;
      });
  }, [hasPermission]);

  console.log('DashboardLayout - user from Redux:', user);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState<null | HTMLElement>(null);
  const [themeDialogOpen, setThemeDialogOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [openSubMenus, setOpenSubMenus] = useState<{ [key: string]: boolean }>({});
  const [isMounted, setIsMounted] = useState(false);
  const {
    bellItems,
    unreadCount,
    markAllAsRead,
    markOneAsRead,
    deleteNotification,
    isMarkingAllRead: isMarkingAllNotificationsRead,
  } = useNotifications();

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  React.useEffect(() => {
    if (isMounted && isInitialized) {
      if (pathname.startsWith('/audit-logs') && !hasPermission('admin_audit_logs:view')) {
        router.push('/dashboard');
      } else if (pathname.startsWith('/login-history') && !hasPermission('login_history:list')) {
        router.push('/dashboard');
      }
    }
  }, [isMounted, isInitialized, hasPermission, router, pathname]);

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

  const handleNotificationMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchorEl(event.currentTarget);
  };

  const handleNotificationMenuClose = () => {
    setNotificationAnchorEl(null);
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await markAllAsRead();
      showSuccess('All notifications marked as read');
    } catch (error: any) {
      const errorMessage = error?.data?.message || error?.message || 'Failed to mark all notifications as read';
      showError(errorMessage);
    }
  };

  const handleNotificationClick = async (notificationId: string, isRead: boolean) => {
    try {
      if (!isRead) {
        await markOneAsRead(notificationId);
      }
    } catch (_error) {
      // Keep navigation responsive even if marking read fails.
    } finally {
      handleNotificationMenuClose();
      router.push('/notifications');
    }
  };

  const formatNotificationTime = (dateValue: string) => {
    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
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
      <Toolbar sx={{ minHeight: '64px !important', height: 64, display: 'flex', alignItems: 'center', px: 2 }}>
        <Box
          component="img"
          src="/assets/images/logo.svg"
          alt="WatchNCash Logo"
          sx={{
            height: 40,
            width: 'auto',
            mr: 2,
          }}
        />
        <Typography
          variant="h6"
          noWrap
          component="div"
          sx={{
            fontWeight: 700,
            background: 'linear-gradient(45deg, #213350, #6AB344)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          }}
        >
          
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {filteredMenuItems.map((item) => (
          <React.Fragment key={item.text}>
            <ListItem disablePadding suppressHydrationWarning>
              <ListItemButton
                suppressHydrationWarning
                selected={isMenuItemActive(item)}
                onClick={() => {
                  if (item.path) {
                    handleNavigation(item.path);
                  } else if (item.subItems) {
                    handleSubMenuToggle(item.text);
                  }
                }}
                sx={{
                  py: 0.5,
                  minHeight: 40,
                  '&.Mui-selected': {
                    background: item.subItems
                      ? 'rgba(33, 51, 80, 0.15)'
                      : 'linear-gradient(45deg, #213350, #6AB344)',
                    color: item.subItems ? 'text.primary' : 'white',
                    '&:hover': {
                      background: item.subItems
                        ? 'rgba(33, 51, 80, 0.2)'
                        : 'linear-gradient(45deg, #1a2940, #6AB344)',
                    },
                    '& .MuiListItemIcon-root': {
                      color: item.subItems ? '#213350' : 'white',
                    },
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(33, 51, 80, 0.08)',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 36,
                    color: isMenuItemActive(item)
                      ? (item.subItems ? '#213350' : 'white')
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
                      fontSize: '0.78rem',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
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
                      suppressHydrationWarning
                      key={subItem.text}
                      selected={pathname === subItem.path || pathname.startsWith(subItem.path + '/')}
                      onClick={() => handleNavigation(subItem.path)}
                      sx={{
                        pl: 4,
                        py: 0.4,
                        minHeight: 32,
                        '&.Mui-selected': {
                          background: 'linear-gradient(45deg, #213350, #6AB344)',
                          color: 'white',
                          '&:hover': {
                            background: 'linear-gradient(45deg, #1a2940, #6AB344)',
                          },
                          '& .MuiListItemIcon-root': {
                            color: 'white',
                          },
                        },
                        '&:hover': {
                          backgroundColor: 'rgba(33, 51, 80, 0.08)',
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
                            fontSize: '0.75rem',
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

  if (!isMounted) {
    return (
      <Box sx={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }} suppressHydrationWarning>
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
        <Toolbar sx={{ minHeight: '64px !important', height: 64 }}>
          <IconButton
            suppressHydrationWarning
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
            <IconButton
              suppressHydrationWarning
              size="large"
              aria-label="notifications"
              aria-controls="notifications-menu"
              aria-haspopup="true"
              onClick={handleNotificationMenuOpen}
              color="inherit"
              sx={{
                color: unreadCount > 0 ? 'primary.main' : 'text.secondary',
              }}
            >
              <Badge badgeContent={unreadCount} color="error" max={99}>
                <NotificationsNone />
              </Badge>
            </IconButton>

            <Menu
              id="notifications-menu"
              anchorEl={notificationAnchorEl}
              open={Boolean(notificationAnchorEl)}
              onClose={handleNotificationMenuClose}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              slotProps={{
                paper: {
                  sx: {
                    minWidth: 360,
                    maxWidth: 400,
                    maxHeight: 460,
                    bgcolor: 'background.paper',
                    border: (theme) => theme.palette.mode === 'dark'
                      ? '1px solid rgba(255, 255, 255, 0.1)'
                      : '1px solid rgba(0, 0, 0, 0.08)',
                  },
                },
              }}
            >
              <Box sx={{ px: 2, py: 1.25, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Notifications
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {unreadCount} unread
                </Typography>
              </Box>
              <Divider />

              {bellItems.length === 0 ? (
                <Box sx={{ px: 2, py: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    You are all caught up.
                  </Typography>
                </Box>
              ) : (
                bellItems.map((notification) => (
                  <MenuItem
                    key={notification.id}
                    suppressHydrationWarning
                    onClick={() => handleNotificationClick(notification.id, notification.is_read)}
                    sx={{
                      alignItems: 'flex-start',
                      py: 1.25,
                      backgroundColor: notification.is_read ? 'transparent' : 'rgba(33, 51, 80, 0.08)',
                      whiteSpace: 'normal',
                      '&:hover .delete-btn': {
                        opacity: 1,
                      },
                    }}
                  >
                    <Box sx={{ width: '100%', position: 'relative' }}>
                      <Box sx={{ pr: 3 }}>
                        <Typography variant="body2" sx={{ fontWeight: notification.is_read ? 500 : 700 }}>
                          {notification.title}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {notification.message}
                        </Typography>
                        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.5 }}>
                          {formatNotificationTime(notification.created_at)}
                        </Typography>
                      </Box>
                      <IconButton
                        className="delete-btn"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          void deleteNotification(notification.id);
                        }}
                        sx={{
                          position: 'absolute',
                          top: -4,
                          right: -4,
                          opacity: 0.5,
                          transition: 'opacity 0.2s',
                          '&:hover': {
                            color: 'error.main',
                            backgroundColor: 'rgba(239, 68, 68, 0.08)',
                          },
                        }}
                      >
                        <Close sx={{ fontSize: '1rem' }} />
                      </IconButton>
                    </Box>
                  </MenuItem>
                ))
              )}

              <Divider />
              <Box sx={{ px: 1, py: 0.5, display: 'flex', justifyContent: 'space-between', gap: 1 }}>
                <MenuItem
                  suppressHydrationWarning
                  onClick={() => {
                    handleNotificationMenuClose();
                    router.push('/notifications');
                  }}
                  sx={{ flex: 1, borderRadius: 1 }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>View all</Typography>
                </MenuItem>
                <MenuItem
                  suppressHydrationWarning
                  onClick={handleMarkAllNotificationsRead}
                  disabled={isMarkingAllNotificationsRead || unreadCount === 0}
                  sx={{ flex: 1, borderRadius: 1 }}
                >
                  <ListItemIcon sx={{ minWidth: 28 }}>
                    <DoneAll fontSize="small" />
                  </ListItemIcon>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>Read all</Typography>
                </MenuItem>
              </Box>
            </Menu>

            {user && (
              <>
                <Box sx={{ display: { xs: 'none', sm: 'block' }, textAlign: 'right' }}>
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 700,
                      background: 'linear-gradient(45deg, #213350, #6AB344)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      lineHeight: 1,
                    }}
                  >
                    {user.name}
                  </Typography>

                </Box>
              </>
            )}

            <IconButton
              suppressHydrationWarning
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenuOpen}
              color="inherit"
              sx={{
                '& .MuiAvatar-root': {
                  background: 'linear-gradient(45deg, #213350, #6AB344)',
                  boxShadow: '0 4px 12px rgba(33, 51, 80, 0.4)',
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
                suppressHydrationWarning
                onClick={() => {
                  handleMenuClose();
                  router.push('/profile');
                }}
                sx={{
                  '&:hover': {
                    backgroundColor: 'rgba(33, 51, 80, 0.08)',
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
                suppressHydrationWarning
                onClick={() => {
                  handleMenuClose();
                  setThemeDialogOpen(true);
                }}
                sx={{
                  '&:hover': {
                    backgroundColor: 'rgba(33, 51, 80, 0.08)',
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
                suppressHydrationWarning
                onClick={() => {
                  router.push('/settings');
                  handleMenuClose();
                }}
                sx={{
                  '&:hover': {
                    backgroundColor: 'rgba(33, 51, 80, 0.08)',
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
                suppressHydrationWarning
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
              '&::-webkit-scrollbar': { width: '4px' },
              '&::-webkit-scrollbar-track': { background: 'transparent' },
              '&::-webkit-scrollbar-thumb': { background: 'rgba(33, 51, 80, 0.2)', borderRadius: '4px' },
              '&::-webkit-scrollbar-thumb:hover': { background: 'rgba(33, 51, 80, 0.3)' },
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
          p: 1,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          maxWidth: '100%',
          overflow: 'auto',
          backgroundColor: 'background.default',
          display: 'flex',
          flexDirection: 'column',
          '&::-webkit-scrollbar': { width: '4px' },
          '&::-webkit-scrollbar-track': { background: 'transparent' },
          '&::-webkit-scrollbar-thumb': { background: 'rgba(33, 51, 80, 0.2)', borderRadius: '4px' },
          '&::-webkit-scrollbar-thumb:hover': { background: 'rgba(33, 51, 80, 0.3)' },
        }}
      >
        <Toolbar sx={{ minHeight: '48px !important', height: 48 }} />
        <Box sx={{ flexGrow: 1, p: 1 }}>
          {children}
        </Box>
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
