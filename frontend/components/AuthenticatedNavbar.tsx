import { useState, useEffect, useCallback } from 'react'
import { Sparkles, Users, Crown, LogOut, LayoutDashboard, Settings, User as UserIcon, Mail } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import ThemeSwitcher from './ThemeSwitcher'
import MobileMenu from './MobileMenu'
import DashboardModal from './DashboardModal'
import { useAuth } from '../contexts/AuthContext'
import { useSubscription } from '../contexts/SubscriptionContext'
import { usePaymentProcessing } from '../contexts/PaymentProcessingContext'
import { requestCache } from '@/lib/cache-util'
import axios from 'axios'
import toast from 'react-hot-toast'

interface UsageStats {
  total_generations: number
  recent_generations: number
  rate_limit: number
  remaining_requests: number
  remaining_generations?: number
  is_premium: boolean
  subscription_tier: string
}

interface AuthenticatedNavbarProps {
  activeTab?: string
  isLoading?: boolean
}

export default function AuthenticatedNavbar({ activeTab, isLoading = false }: AuthenticatedNavbarProps) {
  const { user, isAuthenticated } = useAuth()
  const { showExpirationWarning, daysUntilExpiry, isInGracePeriod } = useSubscription()
  const { isProcessingPayment } = usePaymentProcessing()
  const pathname = usePathname()
  const router = useRouter()
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [showDashboard, setShowDashboard] = useState(false)

  // Helper function to validate image URL
  const isValidImageUrl = (url: string): boolean => {
    if (!url || url.trim() === '') return false

    // Check for base64 images
    if (url.startsWith('data:image/')) {
      return true
    }

    // Check for regular URLs
    try {
      const urlObj = new URL(url)
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
    } catch {
      return false
    }
  }

  // Memoized function to load usage stats with unified caching
  const loadUsageStats = useCallback(async () => {
    if (!isAuthenticated || !user) return

    try {
      // Use unified cache key across all components
      const cacheKey = `usage-stats-${user.id}`
      const stats = await requestCache.get(
        cacheKey,
        async () => {
          console.log('🔄 Making fresh usage-stats API call')
          const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/usage-stats`)
          return response.data
        },
        30 * 60 * 1000 // 30 minute cache - long-lived until content generation
      )

      setUsageStats(stats)
    } catch (error) {
      console.error('Failed to load usage stats:', error)

      // Set reasonable defaults on error
      setUsageStats({
        total_generations: 0,
        recent_generations: 0,
        rate_limit: user?.is_premium ? -1 : 2,
        remaining_requests: user?.is_premium ? -1 : 2,
        is_premium: user?.is_premium || false,
        subscription_tier: user?.is_premium ? 'pro' : 'free'
      })
    }
  }, [isAuthenticated, user])

  // Manual refresh function with proper loading state
  const refreshUsageStats = useCallback(async () => {
    if (!isAuthenticated || !user) return

    setStatsLoading(true)
    try {
      // Invalidate cache first
      const cacheKey = `usage-stats-${user.id}`
      requestCache.invalidate(cacheKey)

      // Load fresh data
      await loadUsageStats()
    } finally {
      setStatsLoading(false)
    }
  }, [isAuthenticated, user, loadUsageStats])

  // Load stats immediately when authenticated (eager loading)
  useEffect(() => {
    // Don't load stats during payment processing
    if (isProcessingPayment) return

    if (isAuthenticated && user) {
      // First, try to get cached data immediately
      const cacheKey = `usage-stats-${user.id}`
      const cachedStats = requestCache.getCached<UsageStats>(cacheKey)

      if (cachedStats) {
        console.log('📦 AuthenticatedNavbar: Using immediately available cached stats')
        setUsageStats(cachedStats)
      }

      // Always load fresh data on app start to ensure accuracy
      console.log('🚀 AuthenticatedNavbar: Eager loading usage stats on app start')
      loadUsageStats()
    }
  }, [isAuthenticated, user, loadUsageStats, isProcessingPayment])

  // Listen for subscription changes and usage stats updates
  useEffect(() => {
    // Don't listen to events during payment processing
    if (isProcessingPayment) return

    const handleSubscriptionChange = () => {
      console.log('🔄 Subscription changed, invalidating cache and refreshing stats')
      const cacheKey = `usage-stats-${user?.id}`
      requestCache.invalidate(cacheKey)
      // Don't clear stats immediately, just refresh them to preserve premium status
      loadUsageStats()
    }

    const handleUsageStatsUpdate = () => {
      console.log('🔄 Usage stats updated event received in navbar, refreshing stats')
      const cacheKey = `usage-stats-${user?.id}`
      requestCache.invalidate(cacheKey)

      // Don't clear stats immediately, just refresh them
      loadUsageStats()
    }

    window.addEventListener('subscription-cancelled', handleSubscriptionChange)
    window.addEventListener('usage-stats-updated', handleUsageStatsUpdate)

    return () => {
      window.removeEventListener('subscription-cancelled', handleSubscriptionChange)
      window.removeEventListener('usage-stats-updated', handleUsageStatsUpdate)
    }
  }, [user, loadUsageStats, isProcessingPayment])

  // Refresh stats when premium status changes (only if different)
  useEffect(() => {
    if (isAuthenticated && user && usageStats) {
      const userIsPremium = user.is_premium
      const statsIsPremium = usageStats.subscription_tier === 'pro'

      if (userIsPremium !== statsIsPremium) {
        console.log('🔄 Premium status changed, refreshing stats')
        loadUsageStats()
      }
    }
  }, [user?.is_premium, isAuthenticated, user, usageStats?.subscription_tier, loadUsageStats])

  const isActive = (path: string) => {
    if (activeTab) {
      return activeTab === path.substring(1) || (path === '/' && activeTab === 'home')
    }
    return pathname === path
  }

  const handleNavigation = (path: string) => {
    router.push(path)
  }

  if (!isAuthenticated || !user) {
    return null
  }

  const resendVerification = async () => {
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/resend-verification`)
      if (response.data.success) {
        toast.success('Verification email sent! Please check your inbox.')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to resend verification email.')
    }
  }

  return (
    <>
      {!user.is_verified && (
        <div className="bg-gradient-to-r from-amber-500/90 to-orange-600/90 backdrop-blur-md text-white py-2 px-4 shadow-sm relative z-[60]">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-center sm:text-left">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              <p className="text-xs sm:text-sm font-medium">
                Your email <span className="font-bold underline">{user.email}</span> is not verified yet.
              </p>
            </div>
            <button
              onClick={resendVerification}
              className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-bold transition-all border border-white/30 active:scale-95 whitespace-nowrap"
            >
              Resend Verification Code
            </button>
          </div>
        </div>
      )}
      <nav className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 sticky top-0 z-[9999] w-full relative">
        <div className="max-w-7xl mx-auto px-6 py-4 sm:py-5">
          <div className="flex items-center justify-between gap-1 sm:gap-4">
            {/* Logo */}
            <Link href="/" className="flex items-center min-w-0 flex-shrink-0 group">
              <div className="bg-white rounded-lg sm:rounded-xl shadow-lg p-0.5 sm:p-1 mr-2 sm:mr-3 flex items-center justify-center w-7 h-7 sm:w-10 sm:h-10 transform transition-all duration-300 group-hover:rotate-3">
                <Image
                  src="/logo.png"
                  alt="Reword Logo"
                  width={40}
                  height={40}
                  quality={100}
                  unoptimized
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-xl sm:text-2xl font-black font-display tracking-tight bg-gradient-to-r from-blue-500 via-indigo-500 to-indigo-600 bg-clip-text text-transparent truncate">
                Reword
              </span>
            </Link>

            {/* Navigation Links (Desktop) */}
            <div className="hidden md:flex space-x-3 lg:space-x-6">
              <button
                onClick={() => handleNavigation('/')}
                className={`px-4 py-2 rounded-xl transition-all duration-300 font-bold text-sm lg:text-base ${isActive('/')
                  ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                  }`}
              >
                Repurpose
              </button>

              <button
                onClick={() => handleNavigation('/community')}
                className={`px-3 py-2 lg:px-4 lg:py-2 rounded-lg transition-all duration-200 font-medium flex items-center text-sm lg:text-base ${isActive('/community')
                  ? 'bg-green-500/20 text-green-600 dark:text-green-400 border border-green-500/30'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/50'
                  }`}
              >
                <Users className="w-3 h-3 lg:w-4 lg:h-4 mr-1 lg:mr-2" />
                Community
                {!user?.is_premium && (
                  <Crown className="w-2 h-2 lg:w-3 lg:h-3 ml-1 text-yellow-500 dark:text-yellow-400" />
                )}
              </button>

              <button
                onClick={() => handleNavigation('/blog')}
                className={`px-3 py-2 lg:px-4 lg:py-2 rounded-lg transition-all duration-200 font-medium text-sm lg:text-base ${isActive('/blog')
                  ? 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/50'
                  }`}
              >
                Blog
              </button>

              <button
                onClick={() => handleNavigation('/pricing')}
                className={`px-3 py-2 lg:px-4 lg:py-2 rounded-lg transition-all duration-200 font-medium text-sm lg:text-base ${isActive('/pricing')
                  ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/50'
                  }`}
              >
                {user?.is_premium ? 'Subscription' : 'Upgrade'}
              </button>
            </div>

            {/* Right Side - Usage Stats, Theme Switcher, and Mobile Menu */}
            <div className="flex items-center space-x-1 md:space-x-4">
              {/* Usage Stats (Limited on mobile) */}
              {!isLoading && (
                <div className="flex items-center gap-2">
                  {/* Stats Counter Button */}
                  <button
                    onClick={refreshUsageStats}
                    disabled={statsLoading}
                    className="flex items-center gap-1.5 px-2 py-1 bg-blue-500/10 hover:bg-blue-500/20 disabled:opacity-50 text-blue-600 dark:text-blue-400 rounded-full text-xs font-bold border border-blue-500/20 transition-all duration-200"
                    title="Click to refresh usage stats"
                  >
                    <Sparkles className={`w-3 h-3 ${statsLoading ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">
                      {statsLoading ? '...' : user?.is_premium ? 'Unlimited' : usageStats ? `${usageStats.remaining_requests ?? (usageStats.rate_limit - usageStats.recent_generations)}/${usageStats.rate_limit} left` : '?'}
                    </span>
                    <span className="sm:hidden text-[10px]">
                      {statsLoading ? '...' : user?.is_premium ? '∞' : usageStats ? usageStats.remaining_requests ?? (usageStats.rate_limit - usageStats.recent_generations) : '?'}
                    </span>
                  </button>

                  {user?.is_premium ? (
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-yellow-400/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20">
                      <Crown className="w-3 h-3" />
                      <span className="hidden xs:inline">Pro</span>
                    </div>
                  ) : (
                    <div className="flex items-center px-2 py-1 bg-gray-500/10 text-gray-500 rounded-full text-xs font-bold border border-gray-500/20">
                      Free
                    </div>
                  )}
                </div>
              )}

              <ThemeSwitcher />

              {/* User Toggle (Desktop Only) */}
              <div className="hidden md:block">
                <button
                  onClick={() => setShowDashboard(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-transparent hover:bg-gray-100/50 dark:hover:bg-gray-800/50 text-gray-900 dark:text-white rounded-lg transition-all duration-300 font-medium text-sm group"
                >
                  <div className="w-8 h-8 rounded-lg overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-blue-500/50 group-hover:scale-105 relative">
                    {user?.profile_picture && isValidImageUrl(user.profile_picture) ? (
                      <Image
                        src={user.profile_picture}
                        alt="Profile"
                        fill
                        className="object-cover"
                        sizes="32px"
                      />
                    ) : (
                      <UserIcon className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <svg className="w-4 h-4 text-gray-500 dark:text-gray-400 transition-all duration-300 group-hover:text-gray-700 dark:group-hover:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              {/* Mobile Menu */}
              <div className="flex-shrink-0 md:hidden">
                <MobileMenu
                  isAuthenticated={isAuthenticated}
                  user={user}
                  onDashboard={() => setShowDashboard(true)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Modal */}
        <DashboardModal
          isOpen={showDashboard}
          onClose={() => setShowDashboard(false)}
          externalUsageStats={usageStats}
        />
      </nav>
    </>
  )
}