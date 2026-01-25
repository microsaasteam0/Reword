'use client'

import { useState } from 'react'
import { TrendingUp, Zap, Shield, Users, CheckCircle, Star } from 'lucide-react'
import { AuthProvider, useAuth } from '../../contexts/AuthContext'
import { ThemeProvider } from '../../contexts/ThemeContext'
import { UserPreferencesProvider } from '../../contexts/UserPreferencesContext'
import Navbar from '../../components/Navbar'
import AuthModal from '../../components/AuthModal'
import TopProgressBar from '../../components/TopProgressBar'
import DashboardModal from '../../components/DashboardModal'
import Footer from '../../components/Footer'

function AboutContent() {
  const { user, isAuthenticated } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login')
  const [showDashboard, setShowDashboard] = useState(false)

  const handleCommunityClick = () => {
    // Redirect to community page
    window.location.href = '/community'
  }

  const handleUserDashboard = () => {
    // Open dashboard modal instead of redirecting
    setShowDashboard(true)
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
          {/* Enhanced Header */}
          <div className="text-center mb-12 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-cyan-50/30 dark:from-blue-900/10 dark:via-transparent dark:to-cyan-900/10 rounded-3xl"></div>
            <div className="relative z-10">
              <div className="inline-block px-4 py-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full text-sm font-medium mb-4 border border-blue-500/20">
                ABOUT REWORD
              </div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">About Reword</h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Empowering content creators with AI-powered social media optimization
              </p>
            </div>
          </div>

          {/* Enhanced Mission Section */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center mr-3">
                    <TrendingUp className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                  </div>
                  Our Mission
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed text-lg">
                  We believe every content creator deserves to maximize their reach without spending hours adapting content for different platforms. Reword was born from the frustration of manually reformatting the same content for X/Twitter, LinkedIn, and Instagram.
                </p>
                <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                  Our AI-powered platform understands the nuances of each social media platform and transforms your long-form content into engaging, platform-optimized posts that maintain your unique voice and style.
                </p>
              </div>

              <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-xl p-6">
                <div className="flex items-center text-blue-500 dark:text-blue-400 mb-3">
                  <Zap className="w-5 h-5 mr-2" />
                  <span className="font-semibold text-lg">Our Vision</span>
                </div>
                <p className="text-gray-700 dark:text-gray-300">
                  To become the go-to platform for content creators who want to focus on creating great content while we handle the platform optimization and distribution strategy.
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-2xl p-8 shadow-lg">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center mr-3">
                  <Users className="w-5 h-5 text-purple-500 dark:text-purple-400" />
                </div>
                Why We Built This
              </h3>
              <div className="space-y-4">
                <div className="flex items-start group">
                  <div className="w-3 h-3 bg-blue-400 rounded-full mt-2 mr-4 flex-shrink-0 group-hover:scale-110 transition-transform"></div>
                  <p className="text-gray-600 dark:text-gray-300">Content creators were spending 3-5 hours weekly adapting content for different platforms</p>
                </div>
                <div className="flex items-start group">
                  <div className="w-3 h-3 bg-purple-400 rounded-full mt-2 mr-4 flex-shrink-0 group-hover:scale-110 transition-transform"></div>
                  <p className="text-gray-600 dark:text-gray-300">Platform-specific optimization required deep knowledge of each social network's best practices</p>
                </div>
                <div className="flex items-start group">
                  <div className="w-3 h-3 bg-pink-400 rounded-full mt-2 mr-4 flex-shrink-0 group-hover:scale-110 transition-transform"></div>
                  <p className="text-gray-600 dark:text-gray-300">Manual adaptation often resulted in suboptimal engagement and missed opportunities</p>
                </div>
                <div className="flex items-start group">
                  <div className="w-3 h-3 bg-green-400 rounded-full mt-2 mr-4 flex-shrink-0 group-hover:scale-110 transition-transform"></div>
                  <p className="text-gray-600 dark:text-gray-300">Creators needed more time for strategy and creativity, less for repetitive formatting tasks</p>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Features Showcase */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50 rounded-2xl p-8 border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">What Makes Reword Different</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center group">
                <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Zap className="w-8 h-8 text-blue-500 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">AI-Powered Intelligence</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">Advanced AI that understands context, tone, and platform requirements for optimal content transformation.</p>
              </div>
              <div className="text-center group">
                <div className="w-16 h-16 bg-cyan-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Shield className="w-8 h-8 text-cyan-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Privacy First</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">Your content is processed securely and never stored permanently. We prioritize your privacy and data security.</p>
              </div>
              <div className="text-center group">
                <div className="w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-8 h-8 text-purple-500 dark:text-purple-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Platform Optimization</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">Content optimized specifically for X/Twitter, LinkedIn, and Instagram with platform-specific best practices.</p>
              </div>
            </div>
          </div>

          {/* Enhanced Team Values */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Our Values</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300">
                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-6 h-6 text-blue-500 dark:text-blue-400" />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">Simplicity</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">Making complex AI accessible through simple, intuitive interfaces.</p>
              </div>
              <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300">
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-6 h-6 text-green-400" />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">Privacy</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">Protecting user data and content with enterprise-grade security.</p>
              </div>
              <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300">
                <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="w-6 h-6 text-purple-500 dark:text-purple-400" />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">Quality</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">Delivering high-quality content transformations that maintain your voice.</p>
              </div>
              <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300">
                <div className="w-12 h-12 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-cyan-400" />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">Community</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">Building a supportive community of content creators and marketers.</p>
              </div>
            </div>
          </div>

          {/* Enhanced Contact Section */}
          <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Get in Touch</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
              Have questions, feedback, or feature requests? We'd love to hear from you! Our team is committed to helping you succeed with your content strategy.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={() => {
                  const subject = encodeURIComponent('Reword Support')
                  const body = encodeURIComponent(`Hi Reword Team,

I have a question/feedback about the platform:

[Please describe your question or feedback here]

Best regards`)
                  window.open(`mailto:business@entrext.in?subject=${subject}&body=${body}`)
                }}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all duration-200 flex items-center shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z" />
                  <path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z" />
                </svg>
                Email Support
              </button>
              <button
                onClick={() => {
                  const subject = encodeURIComponent('Reword Partnership Inquiry')
                  const body = encodeURIComponent(`Hi Reword Team,

I'm interested in exploring partnership opportunities:

Company/Organization: [Your company name]
Partnership Type: [Integration, Reseller, Content, etc.]
Brief Description: [What you have in mind]

Best regards`)
                  window.open(`mailto:business@entrext.in?subject=${subject}&body=${body}`)
                }}
                className="px-6 py-3 border border-blue-500 text-blue-500 dark:text-blue-400 hover:bg-blue-500 hover:text-white rounded-xl transition-all duration-200 flex items-center"
              >
                <Users className="w-5 h-5 mr-2" />
                Partnership Inquiries
              </button>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-4">
              We typically respond within 24 hours during business days
            </p>
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

export default function AboutClient() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <UserPreferencesProvider>
          <AboutContent />
        </UserPreferencesProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}