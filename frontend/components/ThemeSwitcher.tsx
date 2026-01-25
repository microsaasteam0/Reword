'use client'

import { useState } from 'react'
import { useTheme } from '../contexts/ThemeContext'

export default function ThemeSwitcher() {
  const { setTheme, resolvedTheme } = useTheme()
  const [isAnimating, setIsAnimating] = useState(false)

  const isDark = resolvedTheme === 'dark'

  const handleThemeToggle = () => {
    if (isAnimating) return
    
    setIsAnimating(true)
    setTheme(isDark ? 'light' : 'dark')
    
    setTimeout(() => setIsAnimating(false), 600)
  }

  return (
    <button
      onClick={handleThemeToggle}
      disabled={isAnimating}
      className="relative p-2 rounded-lg transition-all duration-300 hover:bg-gray-100 dark:hover:bg-gray-800 group"
      aria-label="Toggle theme"
    >
      {/* Sun Icon */}
      <svg 
        className={`w-5 h-5 absolute transition-all duration-500 ease-out ${
          isDark 
            ? 'opacity-0 scale-0 rotate-90' 
            : 'opacity-100 scale-100 rotate-0'
        } ${isAnimating ? 'animate-spin' : ''}`}
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <circle cx="12" cy="12" r="5"/>
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
      </svg>

      {/* Moon Icon */}
      <svg 
        className={`w-5 h-5 absolute transition-all duration-500 ease-out ${
          isDark 
            ? 'opacity-100 scale-100 rotate-0' 
            : 'opacity-0 scale-0 -rotate-90'
        } ${isAnimating ? 'animate-pulse' : ''}`}
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
      </svg>

      {/* Invisible spacer to maintain button size */}
      <div className="w-5 h-5 opacity-0">
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="5"/>
        </svg>
      </div>

      {/* Simple tooltip */}
      <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
        {isDark ? 'Light mode' : 'Dark mode'}
      </span>
    </button>
  )
}