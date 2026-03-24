"use client";

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
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
  Skeleton,
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
  Badge as BadgeIcon,
  ExpandLess,
  ExpandMore,
  PersonOutline,
  AdminPanelSettings,
  History,
  NotificationsNone,
  DoneAll,
  Brightness4,
  CardGiftcard,
  ReceiptLong,
  Login,
  Gavel,
  FormatListBulleted,
  Person,
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

const drawerWidth = 240;

interface DashboardLayoutProps {
  children: React.ReactNode;
}

interface MenuItem {
  text: string;
  icon?: React.ReactNode;
  path?: string;
  permission?: string;
  subItems?: { text: string; icon: React.ReactNode; path: string; permission?: string }[];
  isHeader?: boolean;
}

const menuItems: MenuItem[] = [
  { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard', permission: 'dashboard:view' },
  { text: 'Sessions', icon: <BarChart />, path: '/sessions', permission: 'sessions:view_live' },
  { text: 'User Management', icon: <People />, path: '/users', permission: 'users:list' },
  { text: 'RBAC Rules', icon: <Gavel />, path: '/rbac-rules', permission: 'rbac:manage_roles' },
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
  { text: 'App Rules', icon: <FormatListBulleted />, path: '/app-rules', permission: 'app_rules:list' },
  { text: 'Global Rules', icon: <Gavel />, path: '/global-rules', permission: 'global_rules:view' },
  { text: 'Audit Logs', icon: <ReceiptLong />, path: '/audit-logs', permission: 'admin_audit_logs:view' },
  { text: 'Login History', icon: <Login />, path: '/login-history', permission: 'login_history:list' },
  { text: 'App Management', icon: <AdminPanelSettings />, path: '/app-management', permission: 'admin:full_access' },
  { text: 'Notifications', icon: <NotificationsNone />, path: '/notifications' },
  { text: 'Profile Settings', icon: <AccountCircle />, path: '/profile' },
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
  const { refreshToken, user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { hasPermission, isInitialized } = usePermissions();
  const {
    bellItems,
    unreadCount,
    markAllAsRead,
    markOneAsRead,
    isMarkingAllRead: isMarkingAllNotificationsRead,
  } = useNotifications();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState<null | HTMLElement>(null);
  const [themeDialogOpen, setThemeDialogOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [openSubMenus, setOpenSubMenus] = useState<{ [key: string]: boolean }>({});
  const [isMounted, setIsMounted] = useState(false);

  const showSkeletons = !isMounted || !isInitialized || !user;

  const filteredMenuItems = useMemo(() => {
    return menuItems
      .filter(item => !item.permission || hasPermission(item.permission))
      .map(item => {
        if (!item.subItems) return item;
        const visibleSubItems = item.subItems.filter(subItem =>
          !subItem.permission || hasPermission(subItem.permission)
        );
        return { ...item, subItems: visibleSubItems };
      })
      .filter(item => !(item.subItems && item.subItems.length === 0 && !item.path));
  }, [hasPermission]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Proactively prefetch all visible menu items once initialized
  useEffect(() => {
    if (!showSkeletons && filteredMenuItems.length > 0) {
      filteredMenuItems.forEach(item => {
        if (item.path) router.prefetch(item.path);
        if (item.subItems) {
          item.subItems.forEach(sub => router.prefetch(sub.path));
        }
      });
    }
  }, [showSkeletons, filteredMenuItems, router]);

  const isAuthPage = pathname.startsWith('/auth');

  const isMenuItemActive = (item: MenuItem): boolean => {
    if (item.path) return pathname === item.path || pathname.startsWith(item.path + '/');
    if (item.subItems) return item.subItems.some(subItem => pathname === subItem.path || pathname.startsWith(subItem.path + '/'));
    return false;
  };


  // Auto-expand submenus when their child routes are active
  React.useEffect(() => {
    if (!filteredMenuItems.length) return;

    setOpenSubMenus(prev => {
      const newState = { ...prev };
      let changed = false;

      filteredMenuItems.forEach((item) => {
        if (item.subItems) {
          const isChildActive = isMenuItemActive(item);
          if (isChildActive && !newState[item.text]) {
            newState[item.text] = true;
            changed = true;
          }
        }
      });

      return changed ? newState : prev;
    });
  }, [pathname, filteredMenuItems]);

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
      showError(error?.data?.message || error?.message || 'Failed to mark notifications');
    }
  };

  const handleNotificationClick = async (notificationId: string, isRead: boolean) => {
    try {
      if (!isRead) await markOneAsRead(notificationId);
    } catch (_error) {
    } finally {
      handleNotificationMenuClose();
      router.push('/notifications');
    }
  };

  const formatNotificationTime = (dateValue: string) => {
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  const handleLogoutConfirm = async () => {
    setIsLoggingOut(true);
    try {
      if (refreshToken) await logout({ refreshToken }).unwrap();
      dispatch(clearAuth());
      document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
      document.cookie = 'refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
      showSuccess('Logged out successfully!');
      window.location.href = '/auth/login';
    } catch (error: any) {
      showError(error?.data?.message || 'Logout failed');
      setIsLoggingOut(false);
      setLogoutConfirmOpen(false);
    }
  };

  const handleNavigation = (path: string) => {
    router.push(path);
    if (isMobile) setMobileOpen(false);
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Toolbar sx={{ minHeight: '64px !important', height: 64, display: 'flex', alignItems: 'center', px: 2 }}>
        <Box component="img" src="/assets/images/email-template-logo.svg" alt="Logo" sx={{ height: 40, width: 'auto', mr: 2 }} />
      </Toolbar>
      <Divider />
      <Box sx={{ 
        flexGrow: 1, 
        overflowY: 'auto',
        '&::-webkit-scrollbar': {
          width: '4px',
        },
        '&::-webkit-scrollbar-track': {
          backgroundColor: 'transparent',
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: 'rgba(33, 51, 80, 0.1)',
          borderRadius: '10px',
          '&:hover': {
            backgroundColor: 'rgba(33, 51, 80, 0.2)',
          },
        },
      }}>
        <List sx={{ px: 1 }}>
          {showSkeletons ? (
            // Sidebar Skeleton
            [...Array(10)].map((_, i) => (
              <Box key={i} sx={{ px: 2, py: 1.2 }}>
                <Skeleton variant="rectangular" height={32} sx={{ borderRadius: 1, opacity: 0.6 }} />
              </Box>
            ))
          ) : (
            filteredMenuItems.map((item, index) => (
              <React.Fragment key={item.text + index}>
                <ListItem disablePadding sx={{ mb: 0.3 }}>
                  <ListItemButton
                    component={item.path ? Link : 'div'}
                    {...(item.path ? { href: item.path, prefetch: true } : {})}
                    disableRipple
                    selected={isMenuItemActive(item)}
                    onClick={() => item.path ? (isMobile && setMobileOpen(false)) : setOpenSubMenus(prev => ({ ...prev, [item.text]: !prev[item.text] }))}
                    sx={{
                      py: 0.5,
                      minHeight: 38,
                      borderRadius: '8px',
                      mx: 1,
                      '&.Mui-selected': {
                        background: item.subItems ? 'rgba(33, 51, 80, 0.06)' : 'linear-gradient(45deg, #213350, #6AB344)',
                        color: item.subItems ? '#213350' : 'white',
                        '& .MuiListItemIcon-root': { color: item.subItems ? '#213350' : 'white' },
                      },
                      '&:hover': {
                        bgcolor: 'rgba(33, 51, 80, 0.04)',
                      }
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 32, color: isMenuItemActive(item) ? (item.subItems ? '#213350' : 'white') : 'text.secondary' }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText 
                      primary={item.text} 
                      sx={{ 
                        '& .MuiListItemText-primary': { 
                          fontSize: '0.78rem', 
                          fontWeight: isMenuItemActive(item) ? 600 : 500,
                          letterSpacing: '0.01rem'
                        } 
                      }} 
                    />
                    {item.subItems && (openSubMenus[item.text] ? <ExpandLess sx={{ fontSize: '1.1rem' }} /> : <ExpandMore sx={{ fontSize: '1.1rem' }} />)}
                  </ListItemButton>
                </ListItem>
                {item.subItems && (
                  <Collapse in={openSubMenus[item.text]} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding sx={{ mb: 1 }}>
                      {item.subItems.map((subItem) => (
                        <ListItemButton
                          key={subItem.text}
                          component={Link}
                          href={subItem.path}
                          prefetch={true}
                          disableRipple
                          selected={pathname === subItem.path}
                          onClick={() => isMobile && setMobileOpen(false)}
                          sx={{
                            pl: 4.5, py: 0.4, minHeight: 32,
                            mx: 1,
                            borderRadius: '6px',
                            mb: 0.2,
                            '&.Mui-selected': { 
                              background: 'linear-gradient(45deg, #213350, #6AB344)', 
                              color: 'white', 
                              '& .MuiListItemIcon-root': { color: 'white' } 
                            },
                            '&:hover': {
                              bgcolor: 'rgba(33, 51, 80, 0.04)',
                            }
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 34, color: pathname === subItem.path ? 'white' : 'text.secondary' }}>
                            <Box sx={{ scale: '0.85', display: 'flex' }}>{subItem.icon}</Box>
                          </ListItemIcon>
                          <ListItemText 
                            primary={subItem.text} 
                            sx={{ 
                              '& .MuiListItemText-primary': { 
                                fontSize: '0.75rem', 
                                fontWeight: pathname === subItem.path ? 600 : 400 
                              } 
                            }} 
                          />
                        </ListItemButton>
                      ))}
                    </List>
                  </Collapse>
                )}
              </React.Fragment>
            ))
          )}
        </List>
      </Box>
    </Box>
  );

  // if (!isMounted) return null; // Removed to prevent flickering

  if (isAuthPage) return <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>{children}</Box>;

  if (!isAuthenticated) {
    return (
      <Box sx={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', bgcolor: 'background.default' }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden', width: '100%' }}>
      <AppBar
        position="fixed"
        sx={{ width: { md: `calc(100% - ${drawerWidth}px)` }, ml: { md: `${drawerWidth}px` }, bgcolor: 'background.paper', color: 'text.primary', boxShadow: 1, zIndex: 1100 }}
      >
        <Toolbar sx={{ minHeight: '64px !important', height: 64 }}>
          <IconButton color="inherit" edge="start" onClick={handleDrawerToggle} sx={{ mr: 2, display: { md: 'none' } }}><MenuIcon /></IconButton>
          <Box sx={{ flexGrow: 1 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={handleNotificationMenuOpen} color="inherit">
              <Badge badgeContent={unreadCount} color="error"><NotificationsNone /></Badge>
            </IconButton>
            <Menu anchorEl={notificationAnchorEl} open={Boolean(notificationAnchorEl)} onClose={handleNotificationMenuClose}>
              <Box sx={{ px: 2, py: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Notifications</Typography>
              </Box>
              <Divider />
              {bellItems.length === 0 ? <Box sx={{ p: 2 }}><Typography variant="body2">No notifications</Typography></Box> : 
                bellItems.map(n => (
                  <MenuItem key={n.id} onClick={() => handleNotificationClick(n.id, n.is_read)} sx={{ bgcolor: n.is_read ? 'transparent' : 'rgba(33, 51, 80, 0.04)' }}>
                    <Box><Typography variant="body2" sx={{ fontWeight: n.is_read ? 400 : 600 }}>{n.title}</Typography></Box>
                  </MenuItem>
                ))
              }
              <Divider />
              <MenuItem onClick={handleMarkAllNotificationsRead} sx={{ justifyContent: 'center', color: 'primary.main' }}>Read all</MenuItem>
            </Menu>
            {showSkeletons ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, ml: 1 }}>
                <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
                  <Skeleton width={80} height={16} />
                  <Skeleton width={50} height={12} sx={{ ml: 'auto' }} />
                </Box>
                <Skeleton variant="circular" width={38} height={38} />
              </Box>
            ) : (
              <Box onClick={handleMenuOpen} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer', ml: 1 }}>
                <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1 }}>{user?.name}</Typography>
                  {user?.userType && 
                   user.userType.toUpperCase() !== 'STAFF' && 
                   user.userType.toLowerCase() !== user?.name?.toLowerCase() && (
                    <Typography variant="caption" color="text.secondary">
                      {user?.userType}
                    </Typography>
                  )}
                </Box>
                <Avatar sx={{ 
                  width: 38, 
                  height: 38, 
                  background: 'linear-gradient(45deg, #213350, #6AB344)',
                  border: '2px solid #fff', 
                  boxShadow: '0 2px 10px rgba(33, 51, 80, 0.15)',
                  fontWeight: 700,
                  fontSize: '1rem'
                }}>
                  {user?.name?.[0]}
                </Avatar>
              </Box>
            )}
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose} PaperProps={{ sx: { width: 220, mt: 1.5, boxShadow: '0 4px 20px rgba(0,0,0,0.1)', borderRadius: 2 } }}>
              <Box sx={{ px: 2, py: 1.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{user?.name}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{user?.email}</Typography>
              </Box>
              <Divider />
              <MenuItem onClick={() => { handleMenuClose(); router.push('/profile'); }} sx={{ fontSize: '0.85rem' }}>
                Profile
              </MenuItem>
              <MenuItem onClick={() => { handleMenuClose(); router.push('/app-management'); }} sx={{ fontSize: '0.85rem' }}>
                Settings
              </MenuItem>
              <MenuItem onClick={() => { handleMenuClose(); setThemeDialogOpen(true); }} sx={{ fontSize: '0.85rem' }}>
                Theme
              </MenuItem>
              <Divider />
              <MenuItem onClick={() => { handleMenuClose(); setLogoutConfirmOpen(true); }} sx={{ fontSize: '0.85rem', color: 'error.main' }}>
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
        <Drawer
          variant={isMobile ? 'temporary' : 'permanent'}
          open={isMobile ? mobileOpen : true}
          onClose={handleDrawerToggle}
          sx={{
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              overflow: 'hidden',
            }
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
          bgcolor: 'background.default',
          height: '100vh',
          overflowY: 'auto',
          overflowX: 'hidden',
          '&::-webkit-scrollbar': {
            width: '4px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(33, 51, 80, 0.1)',
            borderRadius: '10px',
            '&:hover': {
              backgroundColor: 'rgba(33, 51, 80, 0.2)',
            },
          },
        }}
      >
        <Toolbar sx={{ minHeight: '64px !important' }} />
        {children}
      </Box>
      <ThemeSwitcher open={themeDialogOpen} onClose={() => setThemeDialogOpen(false)} />
      <ConfirmDialog open={logoutConfirmOpen} title="Logout" message="Confirm logout?" confirmText="Logout" onConfirm={handleLogoutConfirm} onCancel={() => setLogoutConfirmOpen(false)} />
    </Box>
  );
}
