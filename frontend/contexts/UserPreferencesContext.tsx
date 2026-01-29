'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useAuth } from './AuthContext'
import axios from 'axios'
import { API_URL } from '@/lib/api-config'

interface UserPreferencesContextType {
  autoSaveEnabled: boolean
  setAutoSaveEnabled: (enabled: boolean) => void
  emailNotificationsEnabled: boolean
  setEmailNotificationsEnabled: (enabled: boolean) => void
  isLoading: boolean
}

const UserPreferencesContext = createContext<UserPreferencesContextType>({
  autoSaveEnabled: true,
  setAutoSaveEnabled: () => { },
  emailNotificationsEnabled: true,
  setEmailNotificationsEnabled: () => { },
  isLoading: true
})

export const useUserPreferences = () => useContext(UserPreferencesContext)

interface UserPreferencesProviderProps {
  children: ReactNode
}

export function UserPreferencesProvider({ children }: UserPreferencesProviderProps) {
  const { user, isAuthenticated } = useAuth()
  const [autoSaveEnabled, setAutoSaveEnabledState] = useState(true)
  const [emailNotificationsEnabled, setEmailNotificationsEnabledState] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [hasLoaded, setHasLoaded] = useState(false)

  // Load user preferences when authenticated (only once)
  useEffect(() => {
    if (isAuthenticated && user && !hasLoaded) {
      loadUserPreferences()
    } else if (!isAuthenticated) {
      // Use defaults for non-authenticated users
      setAutoSaveEnabledState(true)
      setEmailNotificationsEnabledState(true)
      setIsLoading(false)
      setHasLoaded(false) // Reset for next auth
    }
  }, [isAuthenticated, user, hasLoaded])

  const loadUserPreferences = async () => {
    if (hasLoaded) return // Prevent duplicate calls

    try {
      setIsLoading(true)
      setHasLoaded(true)
      const response = await axios.get(`${API_URL}/api/v1/auth/preferences`)
      if (response.data) {
        setAutoSaveEnabledState(response.data.auto_save_enabled ?? true)
        setEmailNotificationsEnabledState(response.data.email_notifications_enabled ?? true)
      }
    } catch (error: any) {
      console.error('Error loading user preferences:', error)
      setHasLoaded(false) // Allow retry on error
      // Use defaults if loading fails
      setAutoSaveEnabledState(true)
      setEmailNotificationsEnabledState(true)
    } finally {
      setIsLoading(false)
    }
  }

  const updateUserPreference = async (key: string, value: boolean) => {
    try {
      await axios.put(`${API_URL}/api/v1/auth/preferences`, {
        [key]: value
      })
    } catch (error: any) {
      console.error('Error updating user preference:', error)
      // Revert the state change if the API call fails
      if (key === 'auto_save_enabled') {
        setAutoSaveEnabledState(!value)
      } else if (key === 'email_notifications_enabled') {
        setEmailNotificationsEnabledState(!value)
      }
      throw error // Re-throw to let the caller handle the error
    }
  }

  const setAutoSaveEnabled = async (enabled: boolean) => {
    setAutoSaveEnabledState(enabled)
    if (isAuthenticated) {
      try {
        await updateUserPreference('auto_save_enabled', enabled)
      } catch (error) {
        // Error handling is done in updateUserPreference
      }
    }
  }

  const setEmailNotificationsEnabled = async (enabled: boolean) => {
    setEmailNotificationsEnabledState(enabled)
    if (isAuthenticated) {
      try {
        await updateUserPreference('email_notifications_enabled', enabled)
      } catch (error) {
        // Error handling is done in updateUserPreference
      }
    }
  }

  return (
    <UserPreferencesContext.Provider
      value={{
        autoSaveEnabled,
        setAutoSaveEnabled,
        emailNotificationsEnabled,
        setEmailNotificationsEnabled,
        isLoading
      }}
    >
      {children}
    </UserPreferencesContext.Provider>
  )
}