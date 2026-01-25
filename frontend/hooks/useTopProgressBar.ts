'use client'

import { useState, useCallback } from 'react'

interface ProgressState {
  isLoading: boolean
  progress?: number
  message?: string
}

export function useTopProgressBar() {
  const [state, setState] = useState<ProgressState>({
    isLoading: false,
    progress: undefined,
    message: undefined
  })

  const startLoading = useCallback((message?: string) => {
    setState({
      isLoading: true,
      progress: 0,
      message
    })
  }, [])

  const updateProgress = useCallback((progress: number, message?: string) => {
    setState(prev => ({
      ...prev,
      progress,
      message: message || prev.message
    }))
  }, [])

  const setMessage = useCallback((message: string) => {
    setState(prev => ({
      ...prev,
      message
    }))
  }, [])

  const stopLoading = useCallback(() => {
    setState(prev => ({
      ...prev,
      progress: 100
    }))
    
    // Reset after a short delay
    setTimeout(() => {
      setState({
        isLoading: false,
        progress: undefined,
        message: undefined
      })
    }, 500)
  }, [])

  const resetLoading = useCallback(() => {
    setState({
      isLoading: false,
      progress: undefined,
      message: undefined
    })
  }, [])

  return {
    ...state,
    startLoading,
    updateProgress,
    setMessage,
    stopLoading,
    resetLoading
  }
}