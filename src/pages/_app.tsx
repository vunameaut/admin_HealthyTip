import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import React, { useState, useEffect } from 'react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { Toaster } from 'react-hot-toast'

interface MyAppProps extends AppProps {
  darkMode?: boolean
  toggleDarkMode?: () => void
}

export default function App({ Component, pageProps }: AppProps) {
  const [darkMode, setDarkMode] = useState(false)

  // Load theme preference từ localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('healthtips-admin-theme')
    if (savedTheme) {
      setDarkMode(savedTheme === 'dark')
    } else {
      // Mặc định theo system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setDarkMode(prefersDark)
    }
  }, [])

  // Save theme preference
  useEffect(() => {
    localStorage.setItem('healthtips-admin-theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
  }

  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: '#4CAF50',  // Green (health, nature)
        dark: '#388E3C',  // Dark green
        light: '#81C784', // Light green
      },
      secondary: {
        main: '#2196F3',  // Blue (trust, medical)
        dark: '#1976D2',  // Dark blue
        light: '#81D4FA', // Light blue
      },
      background: {
        default: darkMode ? '#0D1117' : '#F5F7FA',
        paper: darkMode ? '#161B22' : '#FFFFFF',
      },
      text: {
        primary: darkMode ? '#F0F6FC' : '#2E3440',
        secondary: darkMode ? '#7D8590' : '#5E6B7C',
      },
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: 12,
            fontWeight: 600,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            boxShadow: darkMode 
              ? '0 4px 12px rgba(0,0,0,0.3)' 
              : '0 4px 12px rgba(0,0,0,0.1)',
          },
        },
      },
    },
  })

  const enhancedPageProps = {
    ...pageProps,
    darkMode,
    toggleDarkMode,
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Component {...enhancedPageProps} />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: darkMode ? '#161B22' : '#fff',
            color: darkMode ? '#F0F6FC' : '#2E3440',
            border: `1px solid ${darkMode ? '#30363D' : '#E1E8ED'}`,
            borderRadius: 12,
            boxShadow: darkMode 
              ? '0 4px 12px rgba(0,0,0,0.3)' 
              : '0 4px 12px rgba(0,0,0,0.1)',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#4CAF50',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#F44336',
              secondary: '#fff',
            },
          },
        }}
      />
    </ThemeProvider>
  )
}