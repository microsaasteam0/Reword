'use client'

import React, { createContext, useContext, useState } from 'react'
import { Loader2 } from 'lucide-react'

interface LoadingContextType {
  isLoading: boolean
  loadingMessage: string
  setLoading: (loading: boolean, message?: string) => void
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined)

export const useGlobalLoading = () => {
  const context = useContext(LoadingContext)
  if (!context) {
    throw new Error('useGlobalLoading must be used within a GlobalLoadingProvider')
  }
  return context
}

interface GlobalLoadingProviderProps {
  children: React.ReactNode
}

export const GlobalLoadingProvider: React.FC<GlobalLoadingProviderProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('')

  const setLoading = (loading: boolean, message: string = 'Loading...') => {
    setIsLoading(loading)
    setLoadingMessage(message)
  }

  return (
    <LoadingContext.Provider value={{ isLoading, loadingMessage, setLoading }}>
      {children}
      
      {/* Global Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            <span className="text-gray-900 dark:text-white font-medium">
              {loadingMessage}
            </span>
          </div>
        </div>
      )}
    </LoadingContext.Provider>
  )
}