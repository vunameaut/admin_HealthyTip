import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
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
  Switch,
  FormControlLabel,
  Collapse,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  Article,
  VideoLibrary,
  Category,
  People,
  Analytics,
  Settings,
  Logout,
  Notifications,
  LightMode,
  DarkMode,
  AdminPanelSettings,
  Collections as Collection,
  Campaign,
  Search,
  CalendarMonth as EditCalendar,
  Security,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  Favorite,
  FitnessCenter,
} from '@mui/icons-material';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { User } from '@/types';
import toast from 'react-hot-toast';
import Header from './Header';
import { useCurrentUser } from './AuthGuard';

const drawerWidth = 280;

interface DashboardLayoutProps {
  children: React.ReactNode;
  darkMode?: boolean;
  toggleDarkMode?: () => void;
}

export default function DashboardLayout({
  children,
  darkMode = false,
  toggleDarkMode = () => {},
}: DashboardLayoutProps) {
  const { currentUser } = useCurrentUser();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [openMenus, setOpenMenus] = useState<{ [key: string]: boolean }>({});
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success('Đăng xuất thành công');
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Có lỗi xảy ra khi đăng xuất');
    }
    handleProfileMenuClose();
  };

  const menuItems = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      icon: Dashboard,
      path: '/dashboard',
    },
    {
      id: 'content-management',
      title: 'Quản lý Nội dung',
      icon: Article,
      subItems: [
        { id: 'health-tips', title: 'Bài viết (Health Tips)', icon: Article, path: '/content' },
        { id: 'videos', title: 'Video ngắn', icon: VideoLibrary, path: '/videos' },
        { id: 'categories', title: 'Danh mục & Tags', icon: Category, path: '/content/categories' },
        { id: 'collections', title: 'Collections', icon: Collection, path: '/collections' },
      ]
    },
    {
      id: 'users',
      title: 'Quản lý Người dùng',
      icon: People,
      path: '/users',
    },
    {
      id: 'notifications',
      title: 'Push Notifications',
      icon: Notifications,
      path: '/notifications',
    },
    {
      id: 'search',
      title: 'Tìm kiếm nội dung',
      icon: Search,
      path: '/search',
    },
    {
      id: 'analytics',
      title: 'Analytics & Reports',
      icon: Analytics,
      path: '/analytics',
    },
    {
      id: 'moderation',
      title: 'Content Moderation',
      icon: Security,
      path: '/moderation',
    },
    {
      id: 'settings',
      title: 'Cài đặt',
      icon: Settings,
      path: '/settings',
    },
  ];

  const drawer = (
    <Box>
      <Toolbar>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2,
          py: 1,
          width: '100%'
        }}>
          <Header size="medium" />
        </Box>
      </Toolbar>
      <Divider sx={{ opacity: 0.12 }} />
      
      {/* Health Stats Card */}
      <Box sx={{ p: 2 }}>
        <Card sx={{ 
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(135deg, #1e1e1e 0%, #262626 100%)'
            : 'linear-gradient(135deg, #E8F5E8 0%, #F1F8E9 100%)',
          border: theme.palette.mode === 'dark'
            ? '1px solid #404040'
            : `1px solid ${theme.palette.primary.light}20`,
          boxShadow: 'none',
        }}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Favorite sx={{ color: theme.palette.primary.main, fontSize: 18 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Hệ thống sức khỏe
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip 
                label="Online" 
                size="small" 
                sx={{ 
                  backgroundColor: theme.palette.success.main,
                  color: 'white',
                  fontSize: '0.7rem',
                  height: 20
                }}
              />
              <Chip 
                label="Stable" 
                size="small" 
                sx={{ 
                  backgroundColor: theme.palette.primary.main,
                  color: 'white',
                  fontSize: '0.7rem',
                  height: 20
                }}
              />
            </Box>
          </CardContent>
        </Card>
      </Box>
      
      <List sx={{ px: 1 }}>
        {menuItems.map((item) => (
          <React.Fragment key={item.id}>
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => {
                  if (item.subItems) {
                    setOpenMenus((prev: { [key: string]: boolean }) => ({
                      ...prev,
                      [item.id]: !prev[item.id],
                    }));
                  } else if (item.path) {
                    router.push(item.path);
                    if (isMobile) {
                      setMobileOpen(false);
                    }
                  }
                }}
                selected={router.pathname === item.path}
                sx={{
                  minHeight: 48,
                  px: 2.5,
                  py: 1.5,
                  mb: 0.5,
                  borderRadius: 3,
                  transition: 'all 0.2s ease-in-out',
                  '&.Mui-selected': {
                    backgroundColor: theme.palette.primary.main + '15',
                    borderLeft: `4px solid ${theme.palette.primary.main}`,
                    boxShadow: `0 2px 8px ${theme.palette.primary.main}20`,
                    '& .MuiListItemIcon-root': {
                      color: theme.palette.primary.main,
                      transform: 'scale(1.1)',
                    },
                    '& .MuiListItemText-primary': {
                      color: theme.palette.primary.main,
                      fontWeight: 600,
                    },
                  },
                  '&:hover': {
                    backgroundColor: theme.palette.primary.main + '08',
                    transform: 'translateX(4px)',
                    '& .MuiListItemIcon-root': {
                      color: theme.palette.primary.main,
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: 3,
                    justifyContent: 'center',
                    fontSize: 20,
                    transition: 'all 0.2s ease-in-out',
                  }}
                >
                  <item.icon sx={{ fontSize: 20 }} />
                </ListItemIcon>
                <ListItemText
                  primary={item.title}
                  sx={{ 
                    opacity: 1,
                    '& .MuiListItemText-primary': {
                      fontSize: '0.875rem',
                      fontWeight: 500,
                    }
                  }}
                />
                {item.subItems && (
                  <IconButton 
                    size="small"
                    sx={{
                      color: theme.palette.text.secondary,
                      transition: 'transform 0.2s ease-in-out',
                      transform: openMenus[item.id] ? 'rotate(180deg)' : 'rotate(0deg)',
                    }}
                  >
                    {openMenus[item.id] ? (
                      <ExpandLessIcon fontSize="small" />
                    ) : (
                      <ExpandMoreIcon fontSize="small" />
                    )}
                  </IconButton>
                )}
              </ListItemButton>
            </ListItem>
            
            {item.subItems && (
              <Collapse in={openMenus[item.id]} timeout="auto" unmountOnExit>
                <List component="div" disablePadding sx={{ pl: 1 }}>
                  {item.subItems.map((subItem) => (
                    <ListItem key={subItem.id} disablePadding>
                      <ListItemButton
                        onClick={() => {
                          if (subItem.path) {
                            router.push(subItem.path);
                            if (isMobile) {
                              setMobileOpen(false);
                            }
                          }
                        }}
                        selected={router.pathname === subItem.path}
                        sx={{
                          pl: 6,
                          py: 1,
                          borderRadius: 2,
                          mb: 0.5,
                          transition: 'all 0.2s ease-in-out',
                          '&.Mui-selected': {
                            backgroundColor: theme.palette.secondary.main + '15',
                            borderLeft: `3px solid ${theme.palette.secondary.main}`,
                            '& .MuiListItemIcon-root': {
                              color: theme.palette.secondary.main,
                            },
                            '& .MuiListItemText-primary': {
                              color: theme.palette.secondary.main,
                              fontWeight: 600,
                            },
                          },
                          '&:hover': {
                            backgroundColor: theme.palette.secondary.main + '08',
                            transform: 'translateX(2px)',
                          },
                        }}
                      >
                        <ListItemIcon
                          sx={{
                            minWidth: 0,
                            mr: 2,
                            justifyContent: 'center',
                            fontSize: 16,
                          }}
                        >
                          <subItem.icon sx={{ fontSize: 16 }} />
                        </ListItemIcon>
                        <ListItemText 
                          primary={subItem.title}
                          sx={{
                            '& .MuiListItemText-primary': {
                              fontSize: '0.8rem',
                              fontWeight: 400,
                            }
                          }}
                        />
                      </ListItemButton>
                    </ListItem>
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
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          backgroundColor: darkMode ? '#161B22' : '#FFFFFF',
          borderBottom: `1px solid ${darkMode ? '#30363D' : '#E1E8ED'}`,
          boxShadow: darkMode 
            ? '0 2px 8px rgba(0,0,0,0.3)' 
            : '0 2px 8px rgba(0,0,0,0.08)',
        }}
      >
        <Toolbar sx={{ px: { xs: 2, md: 3 } }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ 
              mr: 2, 
              display: { md: 'none' },
              color: theme.palette.text.primary,
            }}
          >
            <MenuIcon />
          </IconButton>
          
          <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box>
              <Typography 
                variant="h5" 
                component="div" 
                sx={{ 
                  fontWeight: 600,
                  color: theme.palette.text.primary,
                  fontSize: { xs: '1.1rem', md: '1.25rem' }
                }}
              >
                {menuItems.find(item => item.path === router.pathname)?.title || 'Dashboard'}
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: theme.palette.text.secondary,
                  fontSize: '0.8rem'
                }}
              >
                HealthyTip Admin Panel
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Health Indicator */}
            <Box sx={{ 
              display: { xs: 'none', sm: 'flex' }, 
              alignItems: 'center', 
              gap: 1,
              px: 2,
              py: 0.5,
              borderRadius: 2,
              backgroundColor: theme.palette.success.main + '15',
              border: `1px solid ${theme.palette.success.main}30`,
            }}>
              <FitnessCenter sx={{ 
                fontSize: 16, 
                color: theme.palette.success.main 
              }} />
              <Typography variant="caption" sx={{ 
                color: theme.palette.success.main,
                fontWeight: 600,
                fontSize: '0.75rem'
              }}>
                Hệ thống khỏe mạnh
              </Typography>
            </Box>
            
            <FormControlLabel
              control={
                <Switch
                  checked={darkMode}
                  onChange={toggleDarkMode}
                  icon={<LightMode sx={{ fontSize: 16 }} />}
                  checkedIcon={<DarkMode sx={{ fontSize: 16 }} />}
                  size="small"
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: theme.palette.primary.main,
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: theme.palette.primary.main,
                    },
                  }}
                />
              }
              label=""
            />
            
            <IconButton 
              color="inherit"
              sx={{ 
                color: theme.palette.text.primary,
                '&:hover': {
                  backgroundColor: theme.palette.primary.main + '10',
                }
              }}
            >
              <Badge 
                badgeContent={4} 
                color="error"
                sx={{
                  '& .MuiBadge-badge': {
                    backgroundColor: '#FF5722',
                    color: 'white',
                  }
                }}
              >
                <Notifications />
              </Badge>
            </IconButton>

            <IconButton
              onClick={handleProfileMenuOpen}
              sx={{ 
                p: 0,
                border: `2px solid ${theme.palette.primary.main}30`,
                '&:hover': {
                  border: `2px solid ${theme.palette.primary.main}`,
                }
              }}
            >
              <Avatar
                src={currentUser?.photoUrl}
                alt={currentUser?.displayName}
                sx={{ 
                  width: 36, 
                  height: 36,
                  background: 'linear-gradient(135deg, #4CAF50 0%, #81C784 100%)',
                  fontWeight: 600,
                }}
              >
                {currentUser?.displayName?.charAt(0) || 'A'}
              </Avatar>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={() => router.push('/dashboard/profile')}>
          <ListItemIcon>
            <People fontSize="small" />
          </ListItemIcon>
          Hồ sơ cá nhân
        </MenuItem>
        <MenuItem onClick={() => router.push('/dashboard/settings')}>
          <ListItemIcon>
            <Settings fontSize="small" />
          </ListItemIcon>
          Cài đặt
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <Logout fontSize="small" />
          </ListItemIcon>
          Đăng xuất
        </MenuItem>
      </Menu>

      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
          open
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
          minHeight: '100vh',
          backgroundColor: darkMode ? '#121212' : '#fafafa',
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}
