'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '../../../../contexts/AuthContext'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Loader2 } from 'lucide-react'

export default function GoogleCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login } = useAuth()
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing')
  const [message, setMessage] = useState('Processing Google sign-in...')
  const hasProcessedRef = useRef(false)
  const processingRef = useRef(false)

  useEffect(() => {
    // Prevent multiple executions using refs (more reliable than state)
    if (hasProcessedRef.current || processingRef.current) {
      // console.log('🛑 Callback already processed or in progress, skipping...')
      return
    }

    const handleGoogleCallback = async () => {
      // Set processing flag immediately
      processingRef.current = true

      try {
        // Get the authorization code and state from URL
        const code = searchParams.get('code')
        const state = searchParams.get('state')
        const error = searchParams.get('error')

        // console.log('🔄 Google OAuth callback received with code:', code ? code.substring(0, 20) + '...' : 'Missing')
        // console.log('🔍 State:', state)
        // console.log('❌ Error:', error)

        // Mark as processed immediately to prevent duplicate calls
        hasProcessedRef.current = true

        // Check for errors from Google
        if (error) {
          throw new Error(`Google OAuth error: ${error}`)
        }

        if (!code) {
          throw new Error('No authorization code received from Google')
        }

        // Check if we already have valid tokens (from a previous successful request)
        const existingToken = localStorage.getItem('access_token')
        const existingUser = localStorage.getItem('user')

        if (existingToken && existingUser) {
          // console.log('✅ Already have valid tokens, redirecting...')
          setStatus('success')
          setMessage('Already authenticated! Redirecting...')

          // Set axios header
          axios.defaults.headers.common['Authorization'] = `Bearer ${existingToken}`

          // Dispatch auth success event
          window.dispatchEvent(new CustomEvent('auth-success', {
            detail: { user: JSON.parse(existingUser) }
          }))

          setTimeout(() => {
            window.location.replace('/')
          }, 500)
          return
        }

        setMessage('Authenticating with Reword...')

        // Create a unique request ID to track this specific request
        const requestId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
        // console.log('🆔 Request ID:', requestId)

        // Send the authorization code to your backend (as JSON)
        const apiUrl = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')
        const redirectUri = `${window.location.origin}/auth/google/callback`

        const payload = {
          code,
          state: state || 'dev-mode',
          request_id: requestId,
          redirect_uri: redirectUri
        }

        console.log('📤 Sending auth payload:', payload)

        const authResponse = await axios.post(`${apiUrl}/api/v1/auth/google/callback`, payload, {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 15000 // 15 second timeout
        })

        if (authResponse.data && authResponse.data.access_token) {
          // console.log('✅ Authentication successful!')

          // Store tokens directly in localStorage
          localStorage.setItem('access_token', authResponse.data.access_token)
          localStorage.setItem('refresh_token', authResponse.data.refresh_token)
          localStorage.setItem('user', JSON.stringify(authResponse.data.user))

          // Set axios default header immediately
          axios.defaults.headers.common['Authorization'] = `Bearer ${authResponse.data.access_token}`

          // Dispatch a custom event to notify other components
          window.dispatchEvent(new CustomEvent('auth-success', {
            detail: { user: authResponse.data.user }
          }))

          setStatus('success')
          setMessage('Sign-in successful! Redirecting...')

          toast.success('🎉 Successfully signed in with Google!')

          // Redirect to home page after a short delay
          setTimeout(() => {
            // Use replace to avoid back button issues
            window.location.replace('/')
          }, 1000)
        } else {
          throw new Error('Invalid response from authentication server')
        }

      } catch (error: any) {
        // console.error('❌ Google OAuth callback error:', error)

        // Check if this is a duplicate request error (400 status)
        if (error.response?.status === 400) {
          // console.log('⚠️ Duplicate request detected, checking for existing auth...')

          // Wait a moment and check if we have tokens from the successful request
          setTimeout(() => {
            const storedToken = localStorage.getItem('access_token')
            const storedUser = localStorage.getItem('user')

            if (storedToken && storedUser) {
              // console.log('✅ Found tokens from successful request, redirecting...')
              setStatus('success')
              setMessage('Authentication successful! Redirecting...')

              // Set axios header
              axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`

              // Dispatch auth success event
              window.dispatchEvent(new CustomEvent('auth-success', {
                detail: { user: JSON.parse(storedUser) }
              }))

              setTimeout(() => {
                window.location.replace('/')
              }, 500)
            } else {
              // No tokens found, this is a real error
              // console.error('❌ No tokens found after duplicate request')
              setStatus('error')
              setMessage('Authentication failed. Please try signing in again.')
              setTimeout(() => {
                router.push('/')
              }, 3000)
            }
          }, 200) // Small delay to allow the successful request to complete
        } else {
          // Other errors
          setStatus('error')
          setMessage(error.message || 'Authentication failed')

          // Only show toast for non-duplicate errors
          if (error.response?.status !== 400) {
            toast.error(`Google sign-in failed: ${error.message}`)
          }

          setTimeout(() => {
            router.push('/')
          }, 3000)
        }
      } finally {
        processingRef.current = false
      }
    }

    handleGoogleCallback()
  }, [searchParams, login, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-2xl p-8 max-w-md w-full text-center shadow-xl">
        <div className="mb-6">
          {status === 'processing' && (
            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Loader2 className="w-8 h-8 text-blue-500 dark:text-blue-400 animate-spin" />
            </div>
          )}

          {status === 'success' && (
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}

          {status === 'error' && (
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          )}
        </div>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          {status === 'processing' && 'Signing you in...'}
          {status === 'success' && 'Welcome to Reword!'}
          {status === 'error' && 'Sign-in Failed'}
        </h1>

        <p className="text-gray-600 dark:text-gray-300 mb-6">
          {message}
        </p>

        {status === 'processing' && (
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <div className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full animate-pulse delay-75"></div>
            <div className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full animate-pulse delay-150"></div>
          </div>
        )}

        {status === 'error' && (
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-lg transition-colors"
          >
            Return to Home
          </button>
        )}
      </div>
    </div>
  )
}