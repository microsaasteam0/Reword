'use client'

import { useEffect, useState } from 'react'

interface TopProgressBarProps {
  isLoading: boolean
  progress?: number
  duration?: number
  message?: string
}

export default function TopProgressBar({ 
  isLoading, 
  progress, 
  duration = 2000,
  message 
}: TopProgressBarProps) {
  const [currentProgress, setCurrentProgress] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isLoading) {
      setIsVisible(true)
      setCurrentProgress(0)

      if (progress !== undefined) {
        // Use provided progress
        setCurrentProgress(progress)
      } else {
        // Auto-increment progress
        const interval = setInterval(() => {
          setCurrentProgress(prev => {
            if (prev >= 90) {
              clearInterval(interval)
              return 90
            }
            return prev + Math.random() * 15
          })
        }, 200)

        return () => clearInterval(interval)
      }
    } else {
      // Complete the progress bar
      setCurrentProgress(100)
      
      // Hide after animation completes
      const timeout = setTimeout(() => {
        setIsVisible(false)
        setCurrentProgress(0)
      }, 500)

      return () => clearTimeout(timeout)
    }
  }, [isLoading, progress])

  if (!isVisible) return null

  return (
    <>
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-[60] h-1">
        {/* Background */}
        <div className="absolute inset-0 bg-gray-200/50 dark:bg-gray-800/30" />
        
        {/* Progress Bar */}
        <div 
          className="h-full bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600 transition-all duration-300 ease-out relative overflow-hidden"
          style={{ width: `${Math.min(currentProgress, 100)}%` }}
        >
          {/* Animated shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
          
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/50 to-cyan-400/50 blur-sm" />
        </div>

        {/* Pulsing dots for indeterminate loading */}
        {progress === undefined && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex space-x-1">
            <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
            <div className="w-1 h-1 bg-cyan-500 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
            <div className="w-1 h-1 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
          </div>
        )}
      </div>

      {/* Loading Message */}
      {message && (
        <div className="fixed top-1 left-1/2 transform -translate-x-1/2 z-[61]">
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-full px-4 py-1 shadow-lg">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {message}
              </span>
              {progress !== undefined && (
                <span className="text-xs text-blue-500 dark:text-blue-400 font-semibold">
                  {Math.round(currentProgress)}%
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}