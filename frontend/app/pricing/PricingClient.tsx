'use client'

import { useState, useEffect } from 'react'
import PricingPage from '../../components/PricingPage'
import { AuthProvider, useAuth } from '../../contexts/AuthContext'
import { UserPreferencesProvider } from '../../contexts/UserPreferencesContext'
import { ThemeProvider } from '../../contexts/ThemeContext'
import Navbar from '../../components/Navbar'
import AuthenticatedNavbar from '../../components/AuthenticatedNavbar'
import DashboardModal from '../../components/DashboardModal'
import AuthModal from '../../components/AuthModal'
import TopProgressBar from '../../components/TopProgressBar'
import Footer from '../../components/Footer'
import { useRouter } from 'next/navigation'

function PricingContent() {
  const { user, isAuthenticated } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login')
  const [showDashboard, setShowDashboard] = useState(false)
  const router = useRouter()

  const handleSignUp = (plan: string) => {
    // Handle signup logic here
    console.log('Sign up for plan:', plan)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Top Progress Bar - Only for page navigation */}
      <TopProgressBar isLoading={false} />
      
      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authModalMode}
      />
      
      {/* Navigation */}
      {isAuthenticated ? (
        <AuthenticatedNavbar isLoading={false} />
      ) : (
        <Navbar 
          isAuthenticated={isAuthenticated}
          user={user}
          activeMainTab="pricing"
          onSignIn={() => {
            setShowAuthModal(true)
            setAuthModalMode('login')
          }}
          onSignUp={() => {
            setShowAuthModal(true)
            setAuthModalMode('register')
          }}
        />
      )}

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-12">
        <PricingPage onSignUp={handleSignUp} />
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

export default function PricingClient() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <UserPreferencesProvider>
          <PricingContent />
        </UserPreferencesProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}