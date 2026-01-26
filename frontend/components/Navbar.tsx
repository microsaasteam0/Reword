'use client'

import { Sparkles, Users, Crown, User } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import ThemeSwitcher from './ThemeSwitcher'
import MobileMenu from './MobileMenu'

interface NavbarProps {
  showAuthButtons?: boolean
  isAuthenticated?: boolean
  user?: any
  usageStats?: any
  activeMainTab?: string
  onSignIn?: () => void
  onSignUp?: () => void
  onUserDashboard?: () => void
  onCommunityClick?: () => void
  onTabChange?: (tab: string) => void
}

export default function Navbar({
  showAuthButtons = true,
  isAuthenticated = false,
  user = null,
  usageStats = null,
  activeMainTab = 'home',
  onSignIn,
  onSignUp,
  onUserDashboard,
  onCommunityClick,
  onTabChange
}: NavbarProps) {
  const pathname = usePathname()

  // For standalone pages, determine if we should show marketing tabs
  const isStandalonePage = pathname !== '/'
  const shouldShowMarketingTabs = !isAuthenticated

  const isActive = (path: string) => {
    // For standalone pages, use pathname only
    if (isStandalonePage) {
      if (path === '/') {
        return pathname === '/'
      }
      return pathname === path
    }

    // For home page, use activeMainTab logic
    if (path === '/') {
      return activeMainTab === 'home'
    }

    // For other tabs, check if activeMainTab matches the path (without leading slash)
    const tabName = path.substring(1)
    return activeMainTab === tabName
  }

  const handleSignIn = () => {
    if (onSignIn) {
      onSignIn()
    } else {
      window.location.href = '/?auth=login'
    }
  }

  const handleSignUp = () => {
    if (onSignUp) {
      onSignUp()
    } else {
      window.location.href = '/?auth=register'
    }
  }

  return (
    <nav className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 sticky top-0 z-50 w-full">
      <div className="max-w-7xl mx-auto px-6 py-4 sm:py-5">
        <div className="flex items-center justify-between gap-2 sm:gap-4 min-w-0">
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

          {/* Navigation Links - Desktop Only */}
          <div className="hidden md:flex space-x-2 lg:space-x-6">
            <Link
              href="/"
              className={`px-4 py-2 rounded-xl transition-all duration-300 font-bold text-sm lg:text-base ${pathname === '/'
                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                }`}
            >
              {isAuthenticated ? 'Repurpose' : 'Home'}
            </Link>

            {/* Community Templates tab for authenticated users */}
            {isAuthenticated && user && (
              <Link
                href="/community"
                className={`px-3 py-2 lg:px-4 lg:py-2 rounded-lg transition-all duration-200 font-medium flex items-center text-sm lg:text-base ${pathname === '/community'
                  ? 'bg-green-500/20 text-green-600 dark:text-green-400 border border-green-500/30'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/50'
                  }`}
              >
                <Users className="w-3 h-3 lg:w-4 lg:h-4 mr-1 lg:mr-2" />
                Community
                {!user?.is_premium && (
                  <Crown className="w-2 h-2 lg:w-3 lg:h-3 ml-1 text-yellow-500 dark:text-yellow-400" />
                )}
              </Link>
            )}

            {/* Show marketing pages for non-authenticated users OR standalone pages */}
            {shouldShowMarketingTabs && (
              <>
                <Link
                  href="/features"
                  className={`px-3 py-2 lg:px-4 lg:py-2 rounded-lg transition-all duration-200 font-medium text-sm lg:text-base ${pathname === '/features'
                    ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/50'
                    }`}
                >
                  Features
                </Link>
                <Link
                  href="/pricing"
                  className={`px-3 py-2 lg:px-4 lg:py-2 rounded-lg transition-all duration-200 font-medium text-sm lg:text-base ${pathname === '/pricing'
                    ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/50'
                    }`}
                >
                  Pricing
                </Link>
                <Link
                  href="/updates"
                  className={`px-3 py-2 lg:px-4 lg:py-2 rounded-lg transition-all duration-200 font-medium text-sm lg:text-base ${pathname === '/updates'
                    ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/50'
                    }`}
                >
                  Updates
                </Link>
                <Link
                  href="/about"
                  className={`px-3 py-2 lg:px-4 lg:py-2 rounded-lg transition-all duration-200 font-medium text-sm lg:text-base ${pathname === '/about'
                    ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/50'
                    }`}
                >
                  About
                </Link>
                <Link
                  href="/blog"
                  className={`px-3 py-2 lg:px-4 lg:py-2 rounded-lg transition-all duration-200 font-medium text-sm lg:text-base ${pathname.startsWith('/blog')
                    ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/50'
                    }`}
                >
                  Blog
                </Link>
              </>
            )}

            {/* Show pricing/subscription and blog tab for authenticated users */}
            {isAuthenticated && (
              <>
                <Link
                  href="/blog"
                  className={`px-3 py-2 lg:px-4 lg:py-2 rounded-lg transition-all duration-200 font-medium text-sm lg:text-base ${pathname.startsWith('/blog')
                    ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/50'
                    }`}
                >
                  Blog
                </Link>
                <Link
                  href="/pricing"
                  className={`px-3 py-2 lg:px-4 lg:py-2 rounded-lg transition-all duration-200 font-medium text-sm lg:text-base ${pathname === '/pricing'
                    ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/50'
                    }`}
                >
                  {user?.is_premium ? 'Subscription' : 'Upgrade'}
                </Link>
              </>
            )}
          </div>

          {/* Right Side - Theme Switcher, Mobile Menu, and Auth/User Section */}
          <div className="flex items-center space-x-1 md:space-x-3">
            <ThemeSwitcher />


            {/* Desktop Auth Section - Hidden on mobile */}
            {isAuthenticated ? (
              <div className="hidden md:flex items-center gap-2 md:gap-3">
                {/* User dashboard logic */}
              </div>
            ) : (
              showAuthButtons && (
                <div className="hidden md:flex items-center space-x-1 md:space-x-3">
                  <button
                    onClick={handleSignIn}
                    className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors text-sm font-medium"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={handleSignUp}
                    className="px-6 py-2 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 text-sm"
                  >
                    Sign Up Free
                  </button>
                </div>
              )
            )}

            {/* Mobile Menu Trigger (Visible only on mobile) */}
            <div className="md:hidden">
              <MobileMenu
                isAuthenticated={isAuthenticated}
                user={user}
                onSignIn={onSignIn}
                onSignUp={onSignUp}
                onDashboard={onUserDashboard}
                onTabChange={onTabChange}
              />
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}