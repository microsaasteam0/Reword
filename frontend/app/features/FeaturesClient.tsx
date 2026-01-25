'use client'

import { useState } from 'react'
import { TrendingUp, Zap, Shield, Star, FileText, Crown } from 'lucide-react'
import Link from 'next/link'
import { AuthProvider, useAuth } from '../../contexts/AuthContext'
import { UserPreferencesProvider } from '../../contexts/UserPreferencesContext'
import { ThemeProvider } from '../../contexts/ThemeContext'
import Navbar from '../../components/Navbar'
import AuthModal from '../../components/AuthModal'
import TopProgressBar from '../../components/TopProgressBar'
import DashboardModal from '../../components/DashboardModal'
import Footer from '../../components/Footer'

function FeaturesContent() {
  const { user, isAuthenticated } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login')
  const [isPageLoading, setIsPageLoading] = useState(false)
  const [showDashboard, setShowDashboard] = useState(false)

  const handleCommunityClick = () => {
    setIsPageLoading(true)
    // Simulate loading
    setTimeout(() => {
      window.location.href = '/community'
    }, 500)
  }

  const handleUserDashboard = () => {
    setIsPageLoading(true)
    // Simulate loading
    setTimeout(() => {
      setShowDashboard(true)
    }, 500)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Top Progress Bar - Only for page navigation */}
      <TopProgressBar isLoading={isPageLoading} message={isPageLoading ? 'Loading...' : undefined} />

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authModalMode}
      />

      {/* Navigation */}
      <Navbar
        isAuthenticated={isAuthenticated}
        user={user}
        onSignIn={() => {
          setShowAuthModal(true)
          setAuthModalMode('login')
        }}
        onSignUp={() => {
          setShowAuthModal(true)
          setAuthModalMode('register')
        }}
        onUserDashboard={handleUserDashboard}
        onCommunityClick={handleCommunityClick}
      />

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="space-y-12">
          {/* Hero Section */}
          <div className="text-center mb-16 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-cyan-50/30 dark:from-blue-900/10 dark:via-transparent dark:to-cyan-900/10 rounded-3xl"></div>
            <div className="relative z-10">
              <div className="inline-block px-4 py-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full text-sm font-medium mb-4 border border-blue-500/20">
                POWERFUL FEATURES
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
                Everything You Need to
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-500"> Repurpose Content</span>
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
                Transform your long-form content into engaging social media posts with our AI-powered platform.
                Optimized for X/Twitter, LinkedIn, and Instagram.
              </p>
            </div>
          </div>

          {/* Core Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-2xl p-8 hover:shadow-lg transition-all duration-300 group">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6 text-blue-500 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">AI-Powered Transformation</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Advanced AI understands your content context and transforms it into platform-optimized posts that maintain your unique voice and style.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-2xl p-8 hover:shadow-lg transition-all duration-300 group">
              <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Multi-Platform Optimization</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Content automatically optimized for X/Twitter threads, LinkedIn posts, and Instagram carousels with platform-specific best practices.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-2xl p-8 hover:shadow-lg transition-all duration-300 group">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6 text-purple-500 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">URL Processing</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Simply paste a URL and our AI will extract and transform the content automatically. Works with blogs, articles, and newsletters.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-2xl p-8 hover:shadow-lg transition-all duration-300 group">
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Content Templates</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Create and save custom templates for consistent branding. Access community templates for inspiration and quick starts.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-2xl p-8 hover:shadow-lg transition-all duration-300 group">
              <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Shield className="w-6 h-6 text-orange-500 dark:text-orange-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Export & Save</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Export your content in multiple formats (TXT, JSON, CSV) and save to your dashboard for future reference and organization.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-2xl p-8 hover:shadow-lg transition-all duration-300 group">
              <div className="w-12 h-12 bg-pink-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Star className="w-6 h-6 text-pink-500 dark:text-pink-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Premium Features</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Unlock unlimited transformations, priority processing, advanced templates, and premium export options with Pro plan.
              </p>
            </div>
          </div>

          {/* Platform Showcase */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50 rounded-2xl p-8 border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">Optimized for Every Platform</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-500 dark:text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">X/Twitter Threads</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">Break down long content into engaging thread format with optimal character limits and hooks.</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600 dark:text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">LinkedIn Posts</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">Professional formatting with industry insights and engagement-focused structure.</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-pink-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-pink-500 dark:text-pink-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Instagram Carousels</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">Visual-first content broken into digestible slides with compelling storytelling flow.</p>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Ready to Transform Your Content?</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
              Join thousands of content creators who are saving hours every week with Reword's AI-powered content repurposing.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/"
                className="px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-bold rounded-xl transition-all duration-300 flex items-center shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Zap className="w-5 h-5 mr-2" />
                Start Creating Now
              </Link>
              <Link
                href="/pricing"
                className="px-8 py-4 border border-blue-500 text-blue-500 dark:text-blue-400 hover:bg-blue-500 hover:text-white rounded-xl transition-all duration-300 flex items-center"
              >
                <Crown className="w-5 h-5 mr-2" />
                View Pricing
              </Link>
            </div>
          </div>
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

export default function FeaturesClient() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <UserPreferencesProvider>
          <FeaturesContent />
        </UserPreferencesProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}