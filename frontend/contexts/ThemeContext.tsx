'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: 'light' | 'dark'
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

interface ThemeProviderProps {
  children: React.ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>('dark')
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark')
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('snippetstream-theme') as Theme
    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      console.log('🎨 Loading saved theme:', savedTheme)
      setThemeState(savedTheme)
    } else {
      console.log('🎨 No saved theme, using default: dark')
    }
    setIsInitialized(true)
  }, [])

  // Update resolved theme based on theme setting
  useEffect(() => {
    if (!isInitialized) return
    
    const updateResolvedTheme = () => {
      if (theme === 'system') {
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        const newResolvedTheme = systemPrefersDark ? 'dark' : 'light'
        setResolvedTheme(newResolvedTheme)
      } else {
        setResolvedTheme(theme)
      }
    }

    updateResolvedTheme()

    // Listen for system theme changes
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleChange = () => updateResolvedTheme()

      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }
  }, [theme, isInitialized])

  // Apply theme to document (only after initialization to prevent flash)
  useEffect(() => {
    if (!isInitialized) return
    
    const root = document.documentElement
    
    console.log('🎨 Applying theme:', resolvedTheme)
    
    // Remove existing theme classes
    root.classList.remove('light', 'dark')
    
    // Add current theme class
    if (resolvedTheme === 'dark') {
      root.classList.add('dark')
      root.style.setProperty('--bg-color', '#111827')
      root.style.setProperty('--text-color', '#ffffff')
      root.style.colorScheme = 'dark'
    } else {
      root.style.setProperty('--bg-color', '#f9fafb')
      root.style.setProperty('--text-color', '#111827')
      root.style.colorScheme = 'light'
    }
    
    // Add theme-loaded class to enable transitions
    root.classList.add('theme-loaded')
    
    console.log('🎨 HTML classes:', root.className)
    
    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', resolvedTheme === 'dark' ? '#111827' : '#ffffff')
    }
  }, [resolvedTheme, isInitialized])

  const setTheme = (newTheme: Theme) => {
    console.log('🎨 Setting theme to:', newTheme)
    setThemeState(newTheme)
    localStorage.setItem('snippetstream-theme', newTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}