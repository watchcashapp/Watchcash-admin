"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
  MenuItem as MuiMenuItem,
  Badge,
  useTheme,
  useMediaQuery,
  Collapse,
  CircularProgress,
  Skeleton,
  Tooltip,
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
  AdsClick,
  VpnKey,
  CheckCircle,
  Error as ErrorIcon,
  Warning,
  DeleteOutline,
} from '@mui/icons-material';
import { useRouter, usePathname } from 'next/navigation';
import { useToast } from '@/components/shared/Toaster';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { useLogoutMutation } from '@/store/api/authApi';
import { clearAuth } from '@/store/slices/authSlice';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import dynamic from 'next/dynamic';
import { usePermissions } from '@/hooks/usePermissions';
import { isPublicGuestRoute } from '@/utils/publicRoutes';
import { useNotifications, NotificationsProvider } from '@/components/notifications/NotificationsProvider';

const ThemeSwitcher = dynamic(() => import('@/components/ThemeSwitcher'), { ssr: false });

const drawerWidth = 240;

interface MenuItem {
  text: string;
  icon?: React.ReactNode;
  path?: string;
  permission?: string;
  subItems?: { text: string; icon: React.ReactNode; path: string; permission?: string | string[] }[];
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
      { text: 'Roles', icon: <AdminPanelSettings />, path: '/staff/roles', permission: 'staff:assign_roles' },
    ]
  },
  { text: 'Reward Redemptions', icon: <AccountBalance />, path: '/reward-redemptions', permission: 'reward_redemptions:list' },
  { text: 'Reward Catalog', icon: <CardGiftcard />, path: '/reward-catalog', permission: 'reward_catalogs:list' },
  { text: 'App Rules', icon: <FormatListBulleted />, path: '/app-rules', permission: 'app_rules:list' },
  { text: 'Global Rules', icon: <Gavel />, path: '/global-rules', permission: 'global_rules:view' },
  { text: 'Audit Logs', icon: <ReceiptLong />, path: '/audit-logs', permission: 'admin_audit_logs:view' },
  { text: 'Login History', icon: <Login />, path: '/login-history', permission: 'login_history:list' },
  { text: 'App Management', icon: <AdminPanelSettings />, path: '/app-management', permission: 'admin:full_access' },
  { text: 'Ads Management', icon: <AdsClick />, path: '/ads-management', permission: 'admin:full_access' },
  {
    text: 'Notifications',
    icon: <NotificationsNone />,
    subItems: [
      { text: 'View All', icon: <FormatListBulleted />, path: '/notifications' },
    ]
  },
  { text: 'Profile Settings', icon: <AccountCircle />, path: '/profile' },
  {
    text: 'Pages',
    icon: <Rule />,
    permission: 'admin:full_access',
    subItems: [
      { text: 'Privacy Policy', icon: <Gavel />, path: '/pages/privacy-policy' },
      { text: 'Terms & Conditions', icon: <Rule />, path: '/pages/terms-and-conditions' },
    ]
  },
  { text: 'Settings', icon: <Settings />, path: '/settings', permission: 'admin:full_access' },
];

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch();
  const { showSuccess, showError } = useToast();
  const [logout] = useLogoutMutation();
  const { refreshToken, user, isAuthenticated, isLoading } = useSelector((state: RootState) => state.auth);
  const { hasPermission, isInitialized } = usePermissions();
  const {
    bellItems,
    unreadCount,
    markAllAsRead,
    markOneAsRead,
  } = useNotifications();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState<null | HTMLElement>(null);
  const [themeDialogOpen, setThemeDialogOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [openSubMenus, setOpenSubMenus] = useState<{ [key: string]: boolean }>({});
  const [activeOverride, setActiveOverride] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const mainContentRef = useRef<HTMLDivElement>(null);

  // Skeletons should show until the full profile (and permissions) has finished loading
  const showSkeletons = !isMounted || !isInitialized || isLoading || !user;

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

  // Redirect to login if not authenticated and initialized
  useEffect(() => {
    const isPublic = isPublicGuestRoute(pathname);
                     
    if (isMounted && isInitialized && !isAuthenticated && !isPublic) {
      router.push('/auth/login');
    }
  }, [isMounted, isInitialized, isAuthenticated, router, pathname]);


  const isMenuItemActive = (item: MenuItem): boolean => {
    const currentPath = activeOverride || pathname;
    if (item.path) return currentPath === item.path || currentPath.startsWith(item.path + '/');
    if (item.subItems) return item.subItems.some(subItem => currentPath === subItem.path || currentPath.startsWith(subItem.path + '/'));
    return false;
  };

  // Auto-expand submenus
  useEffect(() => {
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

  // Sync activeOverride with pathname
  useEffect(() => {
    if (activeOverride && (pathname === activeOverride || pathname.startsWith(activeOverride + '/'))) {
      setActiveOverride(null);
    }
  }, [pathname, activeOverride]);
  
  // Auto-scroll main content to top on pathname change
  useEffect(() => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = 0;
    }
  }, [pathname]);

  // Add Ctrl+K keyboard shortcut for Theme Switcher
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setThemeDialogOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const handleNotificationMenuOpen = (event: React.MouseEvent<HTMLElement>) => setNotificationAnchorEl(event.currentTarget);
  const handleNotificationMenuClose = () => setNotificationAnchorEl(null);

  const handleMarkAllNotificationsRead = async () => {
    try {
      await markAllAsRead();
      showSuccess('All notifications marked as read');
      handleNotificationMenuClose();
    } catch (error: any) {
      showError(error);
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

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const getNotificationIcon = (n: any) => {
    const entityType = (n.entity_type || n.entityType || '').toLowerCase();
    const section = (n.section || '').toLowerCase();
    const action = (n.action || '').toLowerCase();
    const title = (n.title || '').toLowerCase();
    const message = (n.message || '').toLowerCase();
    
    // Check structured data first
    if (entityType === 'user' || entityType === 'staff') return <Person fontSize="small" />;
    if (entityType === 'role' || entityType === 'permission') return <AdminPanelSettings fontSize="small" />;
    if (entityType === 'ad_provider' || section === 'ads') return <AdsClick fontSize="small" />;
    if (entityType === 'reward_redemption' || section === 'redemptions') return <AccountBalance fontSize="small" />;
    if (entityType === 'reward_catalog' || section === 'catalog') return <CardGiftcard fontSize="small" />;
    if (section === 'sessions') return <BarChart fontSize="small" />;
    if (section === 'audit_logs') return <ReceiptLong fontSize="small" />;
    if (action.includes('password') || section === 'auth') return <VpnKey fontSize="small" />;
    
    // Fallback to title/message parsing
    if (title.includes('password') || message.includes('password')) return <VpnKey fontSize="small" />;
    if (title.includes('success') || message.includes('success')) return <CheckCircle fontSize="small" />;
    if (title.includes('fail') || title.includes('error') || message.includes('fail')) return <ErrorIcon fontSize="small" />;
    if (title.includes('warning') || title.includes('alert')) return <Warning fontSize="small" />;
    if (title.includes('user') || message.includes('user')) return <Person fontSize="small" />;
    
    return <NotificationsNone fontSize="small" />;
  };

  const getNotificationColor = (n: any) => {
    const action = (n.action || '').toLowerCase();
    const title = (n.title || '').toLowerCase();
    const message = (n.message || '').toLowerCase();

    if (action.includes('error') || action.includes('fail') || title.includes('fail') || title.includes('error') || message.includes('fail')) return '#ef4444'; // Red
    if (action.includes('success') || title.includes('success') || message.includes('success')) return '#10b981'; // Green
    if (action.includes('warning') || title.includes('warning') || title.includes('alert')) return '#f59e0b'; // Amber
    if (action.includes('create') || action.includes('add')) return '#3b82f6'; // Blue
    
    return '#213350'; // Default dark navy
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
      showError(error);
      setIsLoggingOut(false);
      setLogoutConfirmOpen(false);
    }
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Toolbar sx={{ minHeight: '64px !important', height: 64, display: 'flex', justifyContent: 'center', alignItems: 'center', px: 2 }}>
        <Image 
          src="/assets/images/email-template-logo.svg" 
          alt="Logo" 
          width={120} 
          height={40} 
          priority 
          unoptimized={true}
          style={{ height: 'auto', width: 'auto' }} 
        />
      </Toolbar>
      <Divider />
      <Box sx={{
        flexGrow: 1,
        overflowY: 'auto',
        '&::-webkit-scrollbar': { width: '4px' },
        '&::-webkit-scrollbar-track': { backgroundColor: 'transparent' },
        '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(33, 51, 80, 0.1)', borderRadius: '10px' },
      }}>
        <List sx={{ px: 1 }}>
          {showSkeletons ? (
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
                    onClick={() => {
                      if (item.path) {
                        setActiveOverride(item.path);
                        if (isMobile) setMobileOpen(false);
                      } else {
                        setOpenSubMenus(prev => ({ ...prev, [item.text]: !prev[item.text] }));
                      }
                    }}
                    sx={{
                      py: 0.5, minHeight: 38, borderRadius: '8px', mx: 1,
                      '&.Mui-selected': {
                        background: item.subItems ? 'rgba(33, 51, 80, 0.06)' : 'linear-gradient(45deg, #213350, #6AB344)',
                        color: item.subItems ? (theme.palette.mode === 'dark' ? 'white' : '#213350') : 'white',
                        '& .MuiListItemIcon-root': { color: item.subItems ? (theme.palette.mode === 'dark' ? 'white' : '#213350') : 'white' },
                      },
                      '&:hover': { bgcolor: 'rgba(33, 51, 80, 0.04)' }
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 32, color: isMenuItemActive(item) ? (item.subItems ? (theme.palette.mode === 'dark' ? 'white' : '#213350') : 'white') : 'text.secondary' }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.text}
                      sx={{ '& .MuiListItemText-primary': { fontSize: '0.78rem', fontWeight: isMenuItemActive(item) ? 600 : 500 } }}
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
                          selected={pathname === subItem.path || pathname.startsWith(subItem.path + '/')}
                          onClick={() => {
                            setActiveOverride(subItem.path);
                            if (isMobile) setMobileOpen(false);
                          }}
                          sx={{
                            pl: 4.5, py: 0.4, minHeight: 32, mx: 1, borderRadius: '6px', mb: 0.2,
                            '&.Mui-selected': {
                              background: 'linear-gradient(45deg, #213350, #6AB344)',
                              color: 'white',
                              '& .MuiListItemIcon-root': { color: 'white' }
                            },
                            '&:hover': { bgcolor: 'rgba(33, 51, 80, 0.04)' }
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 34, color: (pathname === subItem.path || pathname.startsWith(subItem.path + '/')) ? 'white' : 'text.secondary' }}>
                            <Box sx={{ scale: '0.85', display: 'flex' }}>{subItem.icon}</Box>
                          </ListItemIcon>
                          <ListItemText
                            primary={subItem.text}
                            sx={{ '& .MuiListItemText-primary': { fontSize: '0.75rem', fontWeight: (subItem.path === (activeOverride || pathname)) ? 600 : 400 } }}
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
            <Menu 
              anchorEl={notificationAnchorEl} 
              open={Boolean(notificationAnchorEl)} 
              onClose={handleNotificationMenuClose}
              PaperProps={{
                sx: {
                  width: 320,
                  maxHeight: 480,
                  mt: 1.5,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  borderRadius: 2,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column'
                }
              }}
            >
              <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Notifications</Typography>
                {unreadCount > 0 && (
                  <Typography 
                    variant="caption" 
                    onClick={handleMarkAllNotificationsRead}
                    sx={{ 
                      color: 'primary.main', 
                      cursor: 'pointer',
                      fontWeight: 600,
                      '&:hover': { textDecoration: 'underline' } 
                    }}
                  >
                    Mark all read
                  </Typography>
                )}
              </Box>
              <Divider />
              <Box sx={{ 
                maxHeight: 350, 
                overflowY: 'auto', 
                '&::-webkit-scrollbar': { width: '4px' }, 
                '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(0,0,0,0.1)', borderRadius: 2 } 
              }}>
                {bellItems.length === 0 ? (
                  <Box sx={{ p: 4, textAlign: 'center' }}>
                    <NotificationsNone sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">No notifications</Typography>
                  </Box>
                ) : (
                  bellItems.map(n => (
                    <MuiMenuItem 
                      key={n.id} 
                      onClick={() => handleNotificationClick(n.id, n.is_read)} 
                      sx={{ 
                        py: 1.5,
                        px: 2,
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        whiteSpace: 'normal',
                        alignItems: 'flex-start',
                        gap: 1.5,
                        bgcolor: n.is_read ? 'transparent' : 'rgba(106, 179, 68, 0.05)',
                        '&:hover': { bgcolor: 'rgba(33, 51, 80, 0.04)' }
                      }}
                    >
                      <Avatar sx={{ 
                        width: 34, 
                        height: 34, 
                        bgcolor: n.is_read ? 'action.disabledBackground' : getNotificationColor(n),
                        color: 'white',
                        fontSize: '1rem',
                        boxShadow: n.is_read ? 'none' : '0 2px 8px rgba(0,0,0,0.1)'
                      }}>
                        {getNotificationIcon(n)}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: n.is_read ? 500 : 700, fontSize: '0.8rem', mb: 0.25, color: 'text.primary' }}>
                          {n.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.75rem', lineHeight: 1.3, mb: 0.5 }}>
                          {n.message}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'primary.main', fontSize: '0.65rem', fontWeight: 600 }}>
                          {formatTimeAgo(n.created_at)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                        {!n.is_read && (
                          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'error.main' }} />
                        )}
                        {!n.is_read && (
                          <Tooltip title="Mark as read">
                            <IconButton 
                              size="small" 
                              onClick={(e) => {
                                e.stopPropagation();
                                markOneAsRead(n.id);
                              }}
                              sx={{ 
                                p: 0.5,
                                color: 'primary.main',
                                '&:hover': { bgcolor: 'rgba(106, 179, 68, 0.1)' }
                              }}
                            >
                              <DoneAll sx={{ fontSize: '0.9rem' }} />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </MuiMenuItem>
                  ))
                )}
              </Box>
              <Divider />
              <MuiMenuItem 
                onClick={() => { handleNotificationMenuClose(); router.push('/notifications'); }}
                sx={{ 
                  justifyContent: 'center', 
                  py: 1.5,
                  color: 'primary.main',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' }
                }}
              >
                View all notifications
              </MuiMenuItem>
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
                  <Typography 
                    variant="body2" 
                    noWrap
                    sx={{ 
                      fontWeight: 700, 
                      lineHeight: 1,
                      maxWidth: 150,
                      textOverflow: 'ellipsis',
                      overflow: 'hidden'
                    }}
                  >
                    {user?.name}
                  </Typography>
                  {user?.userType &&
                    user.userType.toUpperCase() !== 'STAFF' &&
                    user.userType.toLowerCase() !== user?.name?.toLowerCase() && (
                      <Typography variant="caption" color="text.secondary">
                        {user?.userType}
                      </Typography>
                    )}
                </Box>
                <Avatar sx={{
                  width: 38, height: 38,
                  background: 'linear-gradient(45deg, #213350, #6AB344)',
                  border: '2px solid #fff', boxShadow: '0 2px 10px rgba(33, 51, 80, 0.15)',
                  fontWeight: 700, fontSize: '1rem'
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
              <MuiMenuItem onClick={() => { handleMenuClose(); router.push('/profile'); }} sx={{ fontSize: '0.85rem' }}>Profile</MuiMenuItem>
              {hasPermission('admin:full_access') && (
                <MuiMenuItem onClick={() => { handleMenuClose(); router.push('/settings'); }} sx={{ fontSize: '0.85rem' }}>Settings</MuiMenuItem>
              )}
              <MuiMenuItem onClick={() => { handleMenuClose(); setThemeDialogOpen(true); }} sx={{ fontSize: '0.85rem' }}>Theme</MuiMenuItem>
              <Divider />
              <MuiMenuItem onClick={() => { handleMenuClose(); setLogoutConfirmOpen(true); }} sx={{ fontSize: '0.85rem', color: 'error.main' }}>Logout</MuiMenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
        <Drawer
          variant={isMobile ? 'temporary' : 'permanent'}
          open={isMobile ? mobileOpen : true}
          onClose={handleDrawerToggle}
          sx={{ '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box', overflow: 'hidden' } }}
        >
          {drawer}
        </Drawer>
      </Box>
      <Box 
        component="main" 
        ref={mainContentRef}
        sx={{
          flexGrow: 1, p: { xs: 2, sm: 3 }, width: { md: `calc(100% - ${drawerWidth}px)` },
          bgcolor: 'background.default', height: '100vh', overflowY: 'auto', overflowX: 'hidden',
          '&::-webkit-scrollbar': { width: '4px' },
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
