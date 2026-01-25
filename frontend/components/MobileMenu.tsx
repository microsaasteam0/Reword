'use client'

import { useState, useEffect } from 'react'
import { Menu, X, User, Crown, Users, Settings, LogOut, Home, Zap, Sparkles, MessageSquare, Info, LayoutDashboard, Globe, Shield } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

interface MobileMenuProps {
  isAuthenticated: boolean
  user?: any
  onSignIn?: () => void
  onSignUp?: () => void
  onDashboard?: () => void
  onTabChange?: (tab: string) => void
}

export default function MobileMenu({
  isAuthenticated,
  user,
  onSignIn,
  onSignUp,
  onDashboard,
  onTabChange
}: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { logout } = useAuth()
  const pathname = usePathname()

  const closeMenu = () => setIsOpen(false)

  // Block scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => { document.body.style.overflow = 'unset' }
  }, [isOpen])

  const isActive = (path: string) => pathname === path

  // Helper function to validate image URL
  const isValidImageUrl = (url: string): boolean => {
    if (!url || url.trim() === '') return false
    if (url.startsWith('data:image/')) return true
    try {
      const urlObj = new URL(url)
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
    } catch {
      return false
    }
  }

  const allLinks = [
    { name: isAuthenticated ? 'Repurpose' : 'Home', href: '/', icon: isAuthenticated ? Zap : Home, color: 'text-blue-500' },
    { name: 'Community', href: '/community', icon: Users, color: 'text-green-500', authOnly: true },
    { name: 'Features', href: '/features', icon: Sparkles, color: 'text-yellow-500', marketingOnly: true },
    { name: 'Pricing', href: '/pricing', icon: Crown, color: 'text-orange-500' },
    { name: 'Blog', href: '/blog', icon: MessageSquare, color: 'text-purple-500' },
    { name: 'About', href: '/about', icon: Info, color: 'text-cyan-500', marketingOnly: true },
    { name: 'Updates', href: '/updates', icon: Zap, color: 'text-pink-500', marketingOnly: true },
  ]

  const navLinks = allLinks.filter(link => {
    if (isAuthenticated) {
      // For logged in users, hide marketing-only links
      return !link.marketingOnly;
    } else {
      // For logged out users, hide auth-only links
      return !link.authOnly;
    }
  })

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 shadow-sm border border-gray-200 dark:border-gray-700 active:scale-90 transition-all"
        aria-label="Toggle Menu"
      >
        <Menu className="w-6 h-6" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 pt-10 pb-4 overflow-y-auto">
          <div
            className="fixed inset-0 bg-gray-950/90 backdrop-blur-md animate-in fade-in duration-300"
            onClick={closeMenu}
          />

          <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-slate-200 dark:border-slate-800">

            {/* Header */}
            <div className="p-5 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white dark:bg-slate-800 rounded-lg shadow-sm p-1 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                  <Image src="/logo.png" alt="Reword" width={32} height={32} unoptimized className="w-full h-full object-contain" />
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Reword</h2>
              </div>
              <button
                onClick={closeMenu}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User Info - Simplified */}
            {isAuthenticated && user && (
              <div className="p-5 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center relative overflow-hidden">
                    {user.profile_picture && isValidImageUrl(user.profile_picture) ? (
                      <Image
                        src={user.profile_picture}
                        alt="Profile"
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    ) : (
                      <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-white truncate">{user.username}</p>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {user.is_premium ? 'Pro Member' : 'Free Plan'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Links - Simple List */}
            <div className="flex-1 overflow-y-auto p-5">
              <nav className="space-y-1">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const active = isActive(link.href);
                  return (
                    <Link
                      key={link.name}
                      href={link.href}
                      onClick={closeMenu}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${active
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{link.name}</span>
                    </Link>
                  );
                })}

                {isAuthenticated && (
                  <button
                    onClick={() => { onDashboard?.(); closeMenu(); }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <LayoutDashboard className="w-5 h-5" />
                    <span className="font-medium">Dashboard</span>
                  </button>
                )}
              </nav>
            </div>

            {/* Footer Actions */}
            <div className="p-5 border-t border-slate-200 dark:border-slate-800">
              {isAuthenticated ? (
                <button
                  onClick={() => { logout(); closeMenu(); }}
                  className="w-full px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                >
                  Sign Out
                </button>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={() => { onSignUp?.(); closeMenu(); }}
                    className="w-full px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors"
                  >
                    Get Started Free
                  </button>
                  <button
                    onClick={() => { onSignIn?.(); closeMenu(); }}
                    className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    Sign In
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </>
  )
}