import { createTheme } from '@mui/material/styles';

// Health-themed color palette
const healthColors = {
  primary: {
    light: '#81C784', // Light green
    main: '#4CAF50',  // Green (health, nature)
    dark: '#388E3C',  // Dark green
    contrastText: '#fff',
  },
  secondary: {
    light: '#81D4FA', // Light blue
    main: '#2196F3',  // Blue (trust, medical)
    dark: '#1976D2',  // Dark blue
    contrastText: '#fff',
  },
  accent: {
    mint: '#00E676',     // Fresh mint
    teal: '#26C6DA',     // Medical teal
    orange: '#FF7043',   // Vitamin orange
    purple: '#AB47BC',   // Wellness purple
  },
  neutral: {
    light: '#F8F9FA',
    medium: '#E9ECEF',
    dark: '#6C757D',
  },
  status: {
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
    info: '#2196F3',
  }
};

export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: healthColors.primary,
    secondary: healthColors.secondary,
    background: {
      default: '#F5F7FA',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#2E3440',
      secondary: '#5E6B7C',
    },
    divider: '#E1E8ED',
    success: {
      main: healthColors.status.success,
    },
    warning: {
      main: healthColors.status.warning,
    },
    error: {
      main: healthColors.status.error,
    },
    info: {
      main: healthColors.status.info,
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      color: '#2E3440',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      color: '#2E3440',
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
      color: '#2E3440',
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 600,
      color: '#2E3440',
    },
    h5: {
      fontSize: '1rem',
      fontWeight: 600,
      color: '#2E3440',
    },
    h6: {
      fontSize: '0.875rem',
      fontWeight: 600,
      color: '#2E3440',
    },
    subtitle1: {
      fontSize: '1rem',
      fontWeight: 500,
      color: '#5E6B7C',
    },
    body1: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
      color: '#2E3440',
    },
    body2: {
      fontSize: '0.75rem',
      lineHeight: 1.5,
      color: '#5E6B7C',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          borderBottom: '1px solid #E1E8ED',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#FFFFFF',
          borderRight: '1px solid #E1E8ED',
          boxShadow: '2px 0 12px rgba(0,0,0,0.08)',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '2px 8px',
          '&.Mui-selected': {
            backgroundColor: 'rgba(76, 175, 80, 0.12)',
            borderLeft: '3px solid #4CAF50',
            '& .MuiListItemIcon-root': {
              color: '#4CAF50',
            },
            '& .MuiListItemText-primary': {
              color: '#4CAF50',
              fontWeight: 600,
            },
          },
          '&:hover': {
            backgroundColor: 'rgba(76, 175, 80, 0.08)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          border: '1px solid #E1E8ED',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
        },
        contained: {
          boxShadow: '0 2px 8px rgba(76, 175, 80, 0.3)',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(76, 175, 80, 0.4)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
        },
      },
    },
  },
});

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: healthColors.primary,
    secondary: healthColors.secondary,
    background: {
      default: '#0D1117',
      paper: '#161B22',
    },
    text: {
      primary: '#F0F6FC',
      secondary: '#7D8590',
    },
    divider: '#30363D',
    success: {
      main: healthColors.status.success,
    },
    warning: {
      main: healthColors.status.warning,
    },
    error: {
      main: healthColors.status.error,
    },
    info: {
      main: healthColors.status.info,
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      color: '#F0F6FC',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      color: '#F0F6FC',
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
      color: '#F0F6FC',
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 600,
      color: '#F0F6FC',
    },
    h5: {
      fontSize: '1rem',
      fontWeight: 600,
      color: '#F0F6FC',
    },
    h6: {
      fontSize: '0.875rem',
      fontWeight: 600,
      color: '#F0F6FC',
    },
    subtitle1: {
      fontSize: '1rem',
      fontWeight: 500,
      color: '#7D8590',
    },
    body1: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
      color: '#F0F6FC',
    },
    body2: {
      fontSize: '0.75rem',
      lineHeight: 1.5,
      color: '#7D8590',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#161B22',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          borderBottom: '1px solid #30363D',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#161B22',
          borderRight: '1px solid #30363D',
          boxShadow: '2px 0 12px rgba(0,0,0,0.3)',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '2px 8px',
          '&.Mui-selected': {
            backgroundColor: 'rgba(76, 175, 80, 0.2)',
            borderLeft: '3px solid #4CAF50',
            '& .MuiListItemIcon-root': {
              color: '#4CAF50',
            },
            '& .MuiListItemText-primary': {
              color: '#4CAF50',
              fontWeight: 600,
            },
          },
          '&:hover': {
            backgroundColor: 'rgba(76, 175, 80, 0.1)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          border: '1px solid #30363D',
          backgroundColor: '#161B22',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
        },
        contained: {
          boxShadow: '0 2px 8px rgba(76, 175, 80, 0.3)',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(76, 175, 80, 0.4)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
        },
      },
    },
  },
});

export { healthColors };
