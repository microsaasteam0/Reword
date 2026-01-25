'use client'

import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '../contexts/AuthContext'
import { UserPreferencesProvider } from '../contexts/UserPreferencesContext'
import { ThemeProvider } from '../contexts/ThemeContext'
import { PaymentProcessingProvider } from '../contexts/PaymentProcessingContext'
import { SubscriptionProvider } from '../contexts/SubscriptionContext'
import SupportWidget from './SupportWidget'

interface ClientProvidersProps {
  children: React.ReactNode
}

export default function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SubscriptionProvider>
          <PaymentProcessingProvider>
            <UserPreferencesProvider>
              {children}
              <SupportWidget />
              <Toaster
                position="top-right"
                containerStyle={{
                  zIndex: 10002,
                }}
                toastOptions={{
                  duration: 4000,
                  className: 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700',
                  style: {
                    zIndex: 10002,
                  },
                  success: {
                    iconTheme: {
                      primary: '#10b981',
                      secondary: '#ffffff',
                    },
                  },
                  error: {
                    iconTheme: {
                      primary: '#ef4444',
                      secondary: '#ffffff',
                    },
                  },
                  loading: {
                    iconTheme: {
                      primary: '#3b82f6',
                      secondary: '#ffffff',
                    },
                  },
                }}
              />
            </UserPreferencesProvider>
          </PaymentProcessingProvider>
        </SubscriptionProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}