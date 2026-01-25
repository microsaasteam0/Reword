'use client'

import { Loader2, Sparkles, Users, FileText, Crown, Zap, Globe, TrendingUp } from 'lucide-react'

interface LoadingSpinnerProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'gradient' | 'minimal' | 'community'
  fullScreen?: boolean
}

export default function LoadingSpinner({ 
  message = 'Loading...', 
  size = 'md',
  variant = 'default',
  fullScreen = false 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8', 
    lg: 'w-12 h-12'
  }

  const containerClasses = fullScreen 
    ? 'min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-gray-900'
    : 'flex items-center justify-center p-8'

  const renderSpinner = () => {
    switch (variant) {
      case 'community':
        return (
          <div className="relative">
            {/* Animated background circles - Enhanced for light theme */}
            <div className="absolute inset-0 -m-8">
              <div className="absolute top-0 left-0 w-16 h-16 bg-gradient-to-r from-blue-500/15 to-purple-500/15 dark:from-blue-500/20 dark:to-purple-500/20 rounded-full animate-pulse shadow-lg"></div>
              <div className="absolute top-4 right-0 w-12 h-12 bg-gradient-to-r from-green-500/15 to-cyan-500/15 dark:from-green-500/20 dark:to-cyan-500/20 rounded-full animate-pulse delay-300 shadow-md"></div>
              <div className="absolute bottom-0 left-4 w-10 h-10 bg-gradient-to-r from-yellow-500/15 to-orange-500/15 dark:from-yellow-500/20 dark:to-orange-500/20 rounded-full animate-pulse delay-700 shadow-md"></div>
              <div className="absolute bottom-4 right-4 w-8 h-8 bg-gradient-to-r from-pink-500/15 to-red-500/15 dark:from-pink-500/20 dark:to-red-500/20 rounded-full animate-pulse delay-1000 shadow-sm"></div>
            </div>

            {/* Central loading animation */}
            <div className="relative z-10 flex flex-col items-center">
              {/* Main spinner with gradient border */}
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 p-1 animate-spin shadow-xl">
                  <div className="w-full h-full rounded-full bg-white dark:bg-gray-900 flex items-center justify-center shadow-inner">
                    <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                
                {/* Orbiting icons - Enhanced visibility for light theme */}
                <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s', animationDirection: 'reverse' }}>
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-green-50 dark:bg-green-500/20 border border-green-200 dark:border-green-500/30 rounded-full flex items-center justify-center shadow-sm">
                    <FileText className="w-3 h-3 text-green-600 dark:text-green-500" />
                  </div>
                  <div className="absolute top-1/2 -right-2 transform -translate-y-1/2 w-6 h-6 bg-yellow-50 dark:bg-yellow-500/20 border border-yellow-200 dark:border-yellow-500/30 rounded-full flex items-center justify-center shadow-sm">
                    <Crown className="w-3 h-3 text-yellow-600 dark:text-yellow-500" />
                  </div>
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-purple-50 dark:bg-purple-500/20 border border-purple-200 dark:border-purple-500/30 rounded-full flex items-center justify-center shadow-sm">
                    <Sparkles className="w-3 h-3 text-purple-600 dark:text-purple-500" />
                  </div>
                  <div className="absolute top-1/2 -left-2 transform -translate-y-1/2 w-6 h-6 bg-cyan-50 dark:bg-cyan-500/20 border border-cyan-200 dark:border-cyan-500/30 rounded-full flex items-center justify-center shadow-sm">
                    <Globe className="w-3 h-3 text-cyan-600 dark:text-cyan-500" />
                  </div>
                </div>
              </div>

              {/* Floating elements - Enhanced for light theme */}
              <div className="absolute -top-8 -left-8 animate-bounce delay-200">
                <div className="w-7 h-7 bg-gradient-to-br from-blue-50 to-blue-100 dark:bg-blue-500/20 border-2 border-blue-200 dark:border-blue-500/30 rounded-lg flex items-center justify-center shadow-lg">
                  <TrendingUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-500" />
                </div>
              </div>
              <div className="absolute -top-6 -right-10 animate-bounce delay-500">
                <div className="w-6 h-6 bg-gradient-to-br from-green-50 to-green-100 dark:bg-green-500/20 border-2 border-green-200 dark:border-green-500/30 rounded-full flex items-center justify-center shadow-lg">
                  <Zap className="w-3 h-3 text-green-600 dark:text-green-500" />
                </div>
              </div>
              <div className="absolute -bottom-8 -right-6 animate-bounce delay-700">
                <div className="w-5 h-5 bg-gradient-to-br from-purple-50 to-purple-100 dark:bg-purple-500/20 border-2 border-purple-200 dark:border-purple-500/30 rounded-lg flex items-center justify-center shadow-lg">
                  <Sparkles className="w-2.5 h-2.5 text-purple-600 dark:text-purple-500" />
                </div>
              </div>
            </div>

            {/* Pulsing glow effect - Enhanced for light theme */}
            <div className="absolute inset-0 -m-4 bg-gradient-to-r from-blue-500/8 via-purple-500/8 to-cyan-500/8 dark:from-blue-500/10 dark:via-purple-500/10 dark:to-cyan-500/10 rounded-full animate-pulse blur-xl"></div>
          </div>
        )
      case 'gradient':
        return (
          <div className="relative">
            <div className={`${sizeClasses[size]} bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center animate-pulse`}>
              <Sparkles className="w-1/2 h-1/2 text-white animate-spin" />
            </div>
            <div className="absolute -inset-2 bg-gradient-to-r from-blue-500/20 to-cyan-600/20 rounded-2xl blur-lg animate-pulse"></div>
          </div>
        )
      case 'minimal':
        return (
          <Loader2 className={`${sizeClasses[size]} text-blue-500 dark:text-blue-400 animate-spin`} />
        )
      default:
        return (
          <div className="relative">
            <Loader2 className={`${sizeClasses[size]} text-blue-500 dark:text-blue-400 animate-spin`} />
            <div className="absolute -inset-1 bg-blue-500/20 rounded-full animate-pulse"></div>
          </div>
        )
    }
  }

  const renderMessage = () => {
    if (variant === 'community') {
      return (
        <div className="text-center mt-8 space-y-3">
          <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent">
            {message}
          </h3>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-700 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-sm"></div>
              <span className="font-medium">Discovering templates</span>
            </div>
            <div className="w-1 h-1 bg-gray-500 dark:bg-gray-400 rounded-full"></div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-300 shadow-sm"></div>
              <span className="font-medium">Loading community</span>
            </div>
          </div>
          
          {/* Progress indicators */}
          <div className="flex justify-center gap-2 mt-4">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce shadow-sm"></div>
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce delay-100 shadow-sm"></div>
            <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce delay-200 shadow-sm"></div>
          </div>
        </div>
      )
    }

    return message ? (
      <p className="text-gray-700 dark:text-gray-300 font-medium text-sm">
        {message}
      </p>
    ) : null
  }

  return (
    <div className={containerClasses}>
      <div className="text-center">
        <div className="mb-4">
          {renderSpinner()}
        </div>
        {renderMessage()}
      </div>
    </div>
  )
}