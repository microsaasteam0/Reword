'use client'

import { useState } from 'react'
import { CheckCircle, Clock, FileText, Zap, TrendingUp, Settings, Plus, Crown, Shield, Users, Star } from 'lucide-react'
import { AuthProvider, useAuth } from '../../contexts/AuthContext'
import { ThemeProvider } from '../../contexts/ThemeContext'
import { UserPreferencesProvider } from '../../contexts/UserPreferencesContext'
import Navbar from '../../components/Navbar'
import AuthModal from '../../components/AuthModal'
import TopProgressBar from '../../components/TopProgressBar'
import DashboardModal from '../../components/DashboardModal'
import Footer from '../../components/Footer'

function UpdatesContent() {
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
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Platform Updates</h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Recent improvements and upcoming features for Reword
            </p>
          </div>

          {/* Recent Updates Section */}
          <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-400 mr-2" />
              Recent Updates
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm border border-gray-300 dark:border-gray-700 rounded-xl p-6">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
                  <Crown className="w-5 h-5 text-green-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Premium Features</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">Implemented Pro plan with URL processing, content saving, custom templates, and export functionality.</p>
                <div className="text-xs text-green-400 font-medium">✅ Completed - January 2025</div>
              </div>

              <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm border border-gray-300 dark:border-gray-700 rounded-xl p-6">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Database Migration</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">Successfully migrated to Neon PostgreSQL for improved performance and reliability.</p>
                <div className="text-xs text-green-400 font-medium">✅ Completed - January 2025</div>
              </div>

              <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm border border-gray-300 dark:border-gray-700 rounded-xl p-6">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">User Authentication</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">Enhanced Google OAuth integration with improved error handling and user experience.</p>
                <div className="text-xs text-green-400 font-medium">✅ Completed - January 2025</div>
              </div>

              <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm border border-gray-300 dark:border-gray-700 rounded-xl p-6">
                <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center mb-4">
                  <Star className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">UI/UX Improvements</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">Updated pricing page, enhanced FAQ section, and improved theme switching experience.</p>
                <div className="text-xs text-green-400 font-medium">✅ Completed - January 2025</div>
              </div>
            </div>
          </div>

          {/* Planned Features Section */}
          <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center flex items-center justify-center">
              <Clock className="w-6 h-6 text-blue-500 dark:text-blue-400 mr-2" />
              Planned Features
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm border border-gray-300 dark:border-gray-700 rounded-xl p-6">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
                  <FileText className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Content Analytics</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">Track performance metrics and engagement statistics for your generated content.</p>
                <div className="text-xs text-blue-500 dark:text-blue-400 font-medium">📋 Planned</div>
              </div>

              <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm border border-gray-300 dark:border-gray-700 rounded-xl p-6">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Bulk Processing</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">Process multiple pieces of content simultaneously for increased efficiency.</p>
                <div className="text-xs text-blue-500 dark:text-blue-400 font-medium">📋 Planned</div>
              </div>

              <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm border border-gray-300 dark:border-gray-700 rounded-xl p-6">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Scheduling Integration</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">Direct integration with social media scheduling tools for seamless publishing.</p>
                <div className="text-xs text-blue-500 dark:text-blue-400 font-medium">📋 Under Consideration</div>
              </div>

              <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm border border-gray-300 dark:border-gray-700 rounded-xl p-6">
                <div className="w-10 h-10 bg-pink-500/20 rounded-lg flex items-center justify-center mb-4">
                  <Settings className="w-5 h-5 text-pink-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Advanced Customization</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">More granular control over content transformation and formatting options.</p>
                <div className="text-xs text-blue-500 dark:text-blue-400 font-medium">📋 Under Consideration</div>
              </div>

              <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm border border-gray-300 dark:border-gray-700 rounded-xl p-6">
                <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center mb-4">
                  <FileText className="w-5 h-5 text-cyan-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">API Access</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">Developer API for integrating Reword into your own applications and workflows.</p>
                <div className="text-xs text-blue-500 dark:text-blue-400 font-medium">📋 Under Consideration</div>
              </div>

              <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm border border-gray-300 dark:border-gray-700 rounded-xl p-6">
                <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center mb-4">
                  <Plus className="w-5 h-5 text-orange-500 dark:text-orange-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">More Platforms</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">Support for additional social media platforms like TikTok, YouTube, and Facebook.</p>
                <div className="text-xs text-blue-500 dark:text-blue-400 font-medium">📋 Under Consideration</div>
              </div>
            </div>
          </div>

          {/* Platform Stats */}
          <div className="bg-gray-200 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-300 dark:border-gray-700 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">Platform Statistics</h2>
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-3xl font-bold text-blue-500 dark:text-blue-400 mb-2">3</div>
                <div className="text-gray-600 dark:text-gray-300 text-sm mb-2">Supported Platforms</div>
                <div className="text-xs text-gray-500 dark:text-gray-500">X/Twitter, LinkedIn, Instagram</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-400 mb-2">2</div>
                <div className="text-gray-600 dark:text-gray-300 text-sm mb-2">Plan Options</div>
                <div className="text-xs text-gray-500 dark:text-gray-500">Free and Pro tiers</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-400 mb-2">5+</div>
                <div className="text-gray-600 dark:text-gray-300 text-sm mb-2">Export Formats</div>
                <div className="text-xs text-gray-500 dark:text-gray-500">TXT, JSON, CSV, and more</div>
              </div>
            </div>
          </div>

          {/* Feedback Section */}
          <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Help Shape Reword</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Your feedback helps us prioritize features and improvements. Let us know what you'd like to see next!
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={() => {
                  const subject = encodeURIComponent('Reword Feedback')
                  const body = encodeURIComponent(`Hi Reword Team,

I'd like to share my feedback about the platform:

What I like:
- 

What could be improved:
- 

Feature suggestions:
- 

Overall experience: [Great/Good/Okay/Needs Work]

Best regards`)
                  window.open(`mailto:business@entrext.in?subject=${subject}&body=${body}`)
                }}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all duration-200 flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Share Feedback
              </button>
              <button
                onClick={() => {
                  const subject = encodeURIComponent('Reword Feature Request')
                  const body = encodeURIComponent(`Hi Reword Team,

I'd like to request a new feature:

Feature Name: [Brief name]

Description: [What should this feature do?]

Use Case: [How would this help you?]

Priority: [High/Medium/Low]

Additional Details: [Any other relevant information]

Best regards`)
                  window.open(`mailto:business@entrext.in?subject=${subject}&body=${body}`)
                }}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-all duration-200 flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Request Feature
              </button>
            </div>
          </div>

          {/* Changelog */}
          <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm border border-gray-300 dark:border-gray-700 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Recent Changelog</h2>
            <div className="space-y-6">
              <div className="border-l-4 border-green-400 pl-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">v1.2.0</h3>
                  <span className="text-sm text-gray-500 dark:text-gray-400">January 22, 2025</span>
                </div>
                <ul className="text-gray-600 dark:text-gray-300 text-sm space-y-1">
                  <li>• Enhanced FAQ section with expandable design</li>
                  <li>• Improved theme switcher with smooth animations</li>
                  <li>• Updated pricing page to reflect actual features</li>
                  <li>• Fixed text visibility issues in light theme</li>
                </ul>
              </div>

              <div className="border-l-4 border-blue-500 dark:border-blue-400 pl-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">v1.1.0</h3>
                  <span className="text-sm text-gray-500 dark:text-gray-400">January 20, 2025</span>
                </div>
                <ul className="text-gray-600 dark:text-gray-300 text-sm space-y-1">
                  <li>• Implemented Pro plan with premium features</li>
                  <li>• Added custom templates functionality</li>
                  <li>• Enhanced export capabilities (TXT, JSON, CSV)</li>
                  <li>• Improved content saving and organization</li>
                </ul>
              </div>

              <div className="border-l-4 border-purple-500 dark:border-purple-400 pl-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">v1.0.0</h3>
                  <span className="text-sm text-gray-500 dark:text-gray-400">January 15, 2025</span>
                </div>
                <ul className="text-gray-600 dark:text-gray-300 text-sm space-y-1">
                  <li>• Initial platform launch</li>
                  <li>• Core content transformation features</li>
                  <li>• Support for X/Twitter, LinkedIn, Instagram</li>
                  <li>• User authentication and basic dashboard</li>
                </ul>
              </div>
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

export default function UpdatesClient() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <UserPreferencesProvider>
          <UpdatesContent />
        </UserPreferencesProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}