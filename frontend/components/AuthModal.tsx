'use client'

import { useState, useEffect } from 'react'
import { X, Mail, Lock, User, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

// Declare global google object
declare global {
  interface Window {
    google: any
  }
}

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  initialMode?: 'login' | 'register'
}

export default function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    fullName: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [isRegisteredSuccessfully, setIsRegisteredSuccessfully] = useState(false)

  const { login, register, googleAuth } = useAuth()

  // Load Google Identity Services
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true

      script.onload = () => {
        if (window.google) {
          window.google.accounts.id.initialize({
            client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
            callback: handleGoogleResponse,
          })
        }
      }

      // Only add script if it doesn't exist
      if (!document.querySelector('script[src="https://accounts.google.com/gsi/client"]')) {
        document.head.appendChild(script)
      } else if (window.google) {
        // Script already loaded, just initialize
        window.google.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse,
        })
      }
    }
  }, [])

  const handleGoogleResponse = async (response: any) => {
    console.log('🎯 Google Response received in AuthModal:', response)
    setIsGoogleLoading(true)
    try {
      if (response.credential) {
        console.log('🔑 Google credential received, length:', response.credential.length)
        const success = await googleAuth(response.credential)
        console.log('🔄 GoogleAuth result:', success)
        if (success) {
          console.log('✅ Google Auth successful, closing modal')
          onClose()
          setFormData({ email: '', username: '', password: '', fullName: '' })
          setErrors({})
        } else {
          console.error('❌ GoogleAuth returned false')
        }
      } else {
        console.error('❌ No credential in Google response')
      }
    } catch (error) {
      console.error('❌ Google auth error in AuthModal:', error)
    } finally {
      setIsGoogleLoading(false)
    }
  }

  const handleGoogleSignIn = () => {
    console.log('Google Sign-In clicked - redirecting to Google OAuth')

    // Create Google OAuth URL for redirect flow (not popup)
    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    const redirectUri = `${window.location.origin}/auth/google/callback`
    const scope = 'openid email profile'
    const responseType = 'code'
    // Generate a more robust state parameter
    const state = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`

    console.log('Generated state:', state)

    // Store the state in sessionStorage for verification
    sessionStorage.setItem('google_oauth_state', state)

    // Verify it was stored
    const storedState = sessionStorage.getItem('google_oauth_state')
    console.log('Stored state:', storedState)

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${googleClientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${encodeURIComponent(scope)}&` +
      `response_type=${responseType}&` +
      `state=${state}&` +
      `access_type=offline&` +
      `prompt=consent`

    console.log('Redirecting to Google OAuth URL:', googleAuthUrl)

    // Redirect to Google OAuth in the same tab
    window.location.href = googleAuthUrl
  }

  if (!isOpen) return null

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email'
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    } else if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain letters and numbers'
    }

    // Username validation for registration
    if (mode === 'register') {
      if (!formData.username) {
        newErrors.username = 'Username is required'
      } else if (formData.username.length < 3) {
        newErrors.username = 'Username must be at least 3 characters'
      } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
        newErrors.username = 'Username can only contain letters, numbers, and underscores'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      let success = false

      if (mode === 'login') {
        success = await login(formData.email, formData.password)
      } else {
        success = await register(
          formData.email,
          formData.username,
          formData.password,
          formData.fullName || undefined
        )
      }

      if (success) {
        if (mode === 'register') {
          setIsRegisteredSuccessfully(true)
        } else {
          onClose()
          setFormData({ email: '', username: '', password: '', fullName: '' })
          setErrors({})
        }
      }
    } catch (error) {
      console.error('Auth error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login')
    setErrors({})
    setFormData({ email: '', username: '', password: '', fullName: '' })
    setIsRegisteredSuccessfully(false)
  }

  if (isRegisteredSuccessfully) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-8 max-w-md w-full shadow-2xl text-center">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-blue-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Check your email</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            We've sent a verification link to <span className="font-semibold text-gray-900 dark:text-white">{formData.email}</span>.
            Please click the link to verify your account.
          </p>
          <button
            onClick={() => {
              onClose();
              setIsRegisteredSuccessfully(false);
              setFormData({ email: '', username: '', password: '', fullName: '' });
            }}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-blue-500/20 active:scale-95"
          >
            Got it
          </button>
          <button
            onClick={() => setIsRegisteredSuccessfully(false)}
            className="mt-4 text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 w-5 h-5" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all ${errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                placeholder="Enter your email"
                disabled={isSubmitting}
              />
            </div>
            {errors.email && (
              <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          {/* Username (Register only) */}
          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all ${errors.username ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  placeholder="Choose a username"
                  disabled={isSubmitting}
                />
              </div>
              {errors.username && (
                <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.username}</p>
              )}
            </div>
          )}

          {/* Full Name (Register only, optional) */}
          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Full Name (Optional)
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all"
                  placeholder="Enter your full name"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          )}

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 w-5 h-5" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className={`w-full pl-10 pr-12 py-3 bg-gray-50 dark:bg-gray-800 border rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all ${errors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                placeholder="Enter your password"
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
                disabled={isSubmitting}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.password}</p>
            )}
            {mode === 'register' && (
              <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                Must be at least 8 characters with letters and numbers
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                {mode === 'login' ? 'Signing In...' : 'Creating Account...'}
              </>
            ) : (
              mode === 'login' ? 'Sign In' : 'Create Account'
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="mt-6 mb-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">Or continue with</span>
            </div>
          </div>
        </div>

        {/* Google Sign-In Button Container */}
        <div className="mb-6">
          <button
            onClick={handleGoogleSignIn}
            disabled={isSubmitting || isGoogleLoading}
            className="w-full py-3 bg-white hover:bg-gray-50 disabled:bg-gray-300 text-gray-900 font-semibold rounded-xl transition-all duration-200 flex items-center justify-center border border-gray-300 disabled:cursor-not-allowed"
          >
            {isGoogleLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Signing in with Google...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </>
            )}
          </button>
        </div>

        {/* Switch Mode */}
        <div className="mt-6 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
            <button
              onClick={switchMode}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 ml-2 font-medium transition-colors"
              disabled={isSubmitting}
            >
              {mode === 'login' ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>

        {/* Benefits for Registration */}
        {mode === 'register' && (
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
            <h4 className="text-gray-900 dark:text-white font-medium mb-2">Account Benefits:</h4>
            <ul className="text-gray-700 dark:text-gray-300 text-sm space-y-1">
              <li>• Save and organize your generated content</li>
              <li>• Access your content history</li>
              <li>• Higher rate limits for content generation</li>
              <li>• Premium features and templates</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}