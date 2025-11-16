import { useState, useEffect } from 'react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { Toaster } from 'react-hot-toast'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { vi } from 'date-fns/locale'

export default function App({ Component, pageProps }) {
  const [darkMode, setDarkMode] = useState(false)
  const [systemThemeDetected, setSystemThemeDetected] = useState(false)

  // Auto-detect system theme preference
  useEffect(() => {
    // Check if user has saved preference
    const savedTheme = localStorage.getItem('healthtips-admin-theme')
    
    if (savedTheme) {
      // Use saved preference
      setDarkMode(savedTheme === 'dark')
      setSystemThemeDetected(true)
    } else {
      // Auto-detect system theme
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setDarkMode(prefersDark)
      setSystemThemeDetected(true)
      
      // Save auto-detected theme
      localStorage.setItem('healthtips-admin-theme', prefersDark ? 'dark' : 'light')
      
      console.log('🎨 Auto-detected theme:', prefersDark ? 'dark' : 'light')
    }

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e) => {
      // Only auto-update if user hasn't manually changed theme recently
      const lastManualChange = localStorage.getItem('healthtips-admin-theme-manual')
      const now = Date.now()
      
      if (!lastManualChange || (now - parseInt(lastManualChange)) > 300000) { // 5 minutes
        setDarkMode(e.matches)
        localStorage.setItem('healthtips-admin-theme', e.matches ? 'dark' : 'light')
        console.log('🎨 System theme changed to:', e.matches ? 'dark' : 'light')
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  // Save theme preference when manually changed
  useEffect(() => {
    if (systemThemeDetected) {
      localStorage.setItem('healthtips-admin-theme', darkMode ? 'dark' : 'light')
    }
  }, [darkMode, systemThemeDetected])

  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: '#1976d2',
      },
      secondary: {
        main: '#dc004e',
      },
      background: {
        default: darkMode ? '#121212' : '#ffffff',
        paper: darkMode ? '#1e1e1e' : '#ffffff',
      },
    },
    components: {
      // Fix bright components in dark mode
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: darkMode ? '#121212' : '#ffffff',
            color: darkMode ? '#ffffff' : '#000000',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
          },
        },
      },
    },
  })

  const toggleDarkMode = () => {
    const newMode = !darkMode
    setDarkMode(newMode)
    
    // Mark as manual change
    localStorage.setItem('healthtips-admin-theme-manual', Date.now().toString())
    
    console.log('🎨 Manual theme change to:', newMode ? 'dark' : 'light')
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={vi}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Component {...pageProps} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: darkMode ? '#333' : '#fff',
              color: darkMode ? '#fff' : '#000',
            },
          }}
        />
      </ThemeProvider>
    </LocalizationProvider>
  )
}
