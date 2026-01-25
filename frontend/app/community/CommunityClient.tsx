'use client'

import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from '../../contexts/AuthContext'
import { UserPreferencesProvider } from '../../contexts/UserPreferencesContext'
import { ThemeProvider } from '../../contexts/ThemeContext'
import Navbar from '../../components/Navbar'
import AuthenticatedNavbar from '../../components/AuthenticatedNavbar'
import DashboardModal from '../../components/DashboardModal'
import AuthModal from '../../components/AuthModal'
import TopProgressBar from '../../components/TopProgressBar'
import LoadingSpinner from '../../components/LoadingSpinner'
import Footer from '../../components/Footer'
import CommunityTemplatesPage from '../../components/CommunityTemplatesPage'
import { useRouter } from 'next/navigation'

function CommunityContent() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login')
  const [showDashboard, setShowDashboard] = useState(false)
  const router = useRouter()

  // Redirect non-authenticated users to home (but wait for auth to load)
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/')
      return
    }
  }, [isAuthenticated, isLoading, router])

  const handleTemplateSelect = (template: any) => {
    // Store template in localStorage as a backup (persists across page reloads)
    localStorage.setItem('pendingTemplate', JSON.stringify({
      template: template,
      timestamp: Date.now()
    }))

    // Use a custom event to communicate with the main page
    // This works even across different routes
    const templateEvent = new CustomEvent('template-selected', {
      detail: {
        template: template,
        timestamp: Date.now()
      }
    })

    // Dispatch the event globally
    window.dispatchEvent(templateEvent)

    // Navigate to main page
    router.push('/')
  }

  const handleUpgradeClick = () => {
    router.push('/pricing')
  }

  // Don't render content for non-authenticated users (they'll be redirected)
  if (!isLoading && !isAuthenticated) {
    return <div>Redirecting...</div>
  }

  // Show loading while auth is being determined
  if (isLoading) {
    return <LoadingSpinner message="Loading community..." variant="community" fullScreen />
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Top Progress Bar - Only for page navigation */}
      <TopProgressBar isLoading={false} />

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authModalMode}
      />

      {/* Navigation */}
      <AuthenticatedNavbar isLoading={false} />

      {/* Main Content */}
      <main className="py-4 px-4 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <CommunityTemplatesPage
            onBack={() => router.push('/')}
            onTemplateSelect={handleTemplateSelect}
            onUpgradeClick={handleUpgradeClick}
          />
        </div>
      </main>

      {/* Footer */}
      <Footer />

      {/* Dashboard Modal */}
      <DashboardModal
        isOpen={showDashboard}
        onClose={() => setShowDashboard(false)}
      />
    </div>
  )
}

export default function CommunityClient() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <UserPreferencesProvider>
          <CommunityContent />
        </UserPreferencesProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}