'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Sparkles, Twitter, Linkedin, Instagram, Link as LinkIcon, FileText, Loader2, Copy, Check, Star, Zap, Shield, Users, TrendingUp, Clock, ChevronRight, Play, ArrowRight, HelpCircle, CheckCircle, AlertCircle, User, LogIn, Settings, Crown, Lock, X, Plus } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { XDisplay, LinkedInDisplay, InstagramCarousel } from '../components/FormattedText'
import { useAuth } from '../contexts/AuthContext'
import { useSubscription } from '../contexts/SubscriptionContext'
import { useFeatureGate } from '../hooks/useFeatureGate'
import { useUserPreferences } from '../contexts/UserPreferencesContext'
import { usePaymentProcessing } from '../contexts/PaymentProcessingContext'
import { FeatureGate, ProBadge, UsageCounter } from '../components/FeatureGate'
import AuthModal from '../components/AuthModal'
import PaymentModal from '../components/PaymentModal'
import CustomTemplateModal from '../components/CustomTemplateModal'
import TemplateSelector from '../components/TemplateSelector'
import ThemeSwitcher from '../components/ThemeSwitcher'
import TopProgressBar from '../components/TopProgressBar'
import Navbar from '../components/Navbar'
import AuthenticatedNavbar from '../components/AuthenticatedNavbar'
import DashboardModal from '../components/DashboardModal'
import SubscriptionWarning from '../components/SubscriptionWarning'
import Footer from '../components/Footer'
import { requestCache } from '@/lib/requestCache'

interface SocialMediaResponse {
  twitter_thread: string[]
  linkedin_post: string
  instagram_carousel: string[]
  original_content_preview: string
}

type TabType = 'home' | 'features' | 'pricing' | 'updates' | 'about' | 'community'
type OnboardingStep = 'welcome' | 'choose-input' | 'add-content' | 'transform' | 'results' | 'completed'

export default function Home() {
  const { user, isAuthenticated, isLoading: authLoading, forceRestoreAuth, updateUser } = useAuth()
  const featureGate = useFeatureGate()
  const { autoSaveEnabled } = useUserPreferences()
  const { isProcessingPayment, setIsProcessingPayment } = usePaymentProcessing()
  const searchParams = useSearchParams()
  const router = useRouter()

  // Get initial tab - always 'home' for main page
  const [activeMainTab, setActiveMainTab] = useState<TabType>('home')
  const [content, setContent] = useState('')
  const [isNavigating, setIsNavigating] = useState(false)

  // State variables
  const [url, setUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<SocialMediaResponse | null>(null)
  const [activeTab, setActiveTab] = useState<'content' | 'url'>('content')
  const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>({})
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>('welcome')
  const [isFirstVisit, setIsFirstVisit] = useState(true)
  const [transformProgress, setTransformProgress] = useState(0)
  const [currentProcessingStep, setCurrentProcessingStep] = useState('')
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login')
  const [usageStats, setUsageStats] = useState<any>(null)
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [isSubscribing, setIsSubscribing] = useState(false)
  const [paymentProcessed, setPaymentProcessed] = useState(false)
  const [verificationInProgress, setVerificationInProgress] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showCustomTemplateModal, setShowCustomTemplateModal] = useState(false)
  const [showTemplateSelector, setShowTemplateSelector] = useState(false)
  const [templateSelectorSource, setTemplateSelectorSource] = useState<string>('all') // Track which source to show
  const [showDashboard, setShowDashboard] = useState(false)
  const [browserFingerprint, setBrowserFingerprint] = useState<any>(null)

  // Sample content suggestions
  const contentSuggestions = [
    {
      title: "Blog Post Example",
      content: "The future of AI in content creation is here. Artificial intelligence is revolutionizing how we create, optimize, and distribute content across platforms. From automated writing to personalized recommendations, AI tools are becoming essential for modern content creators. Here are the key trends shaping this transformation...",
      type: "blog"
    },
    {
      title: "Newsletter Example",
      content: "Weekly Tech Insights: This week in technology brought us exciting developments in AI, blockchain, and sustainable tech. The most significant announcement was the breakthrough in quantum computing that could revolutionize data processing. Meanwhile, several startups secured major funding for climate tech solutions...",
      type: "newsletter"
    },
    {
      title: "Article Example",
      content: "5 Productivity Hacks That Actually Work. After testing dozens of productivity methods, these five strategies consistently deliver results. First, the two-minute rule: if something takes less than two minutes, do it immediately. Second, time-blocking helps you focus on deep work without distractions...",
      type: "article"
    }
  ]

  const processingSteps = [
    "Analyzing your content...",
    "Extracting key insights...",
    "Optimizing for X/Twitter...",
    "Creating LinkedIn post...",
    "Designing Instagram slides...",
    "Finalizing results..."
  ]

  // Load pending template on page load (from community templates)
  useEffect(() => {
    // Check for pending template from localStorage (used by community templates)
    const pendingTemplateStr = localStorage.getItem('pendingTemplate')
    if (pendingTemplateStr) {
      try {
        const template = JSON.parse(pendingTemplateStr)
        console.log('📦 Found pending template:', template.name)
        setContent(template.content)
        setActiveTab('content')
        toast.success(`Template "${template.name}" loaded!`)

        trackAnalytics('community_template_used', {
          template_id: template.id,
          template_name: template.name,
          template_category: template.category
        })

        // Clean up regardless of whether we used it
        localStorage.removeItem('pendingTemplate')
      } catch (e) {
        console.warn('Failed to parse pending template:', e)
        localStorage.removeItem('pendingTemplate')
      }
    }

    // Also check sessionStorage as fallback
    const storedTemplate = sessionStorage.getItem('selectedTemplate')
    if (storedTemplate) {
      try {
        const template = JSON.parse(storedTemplate)
        console.log('📦 Found stored template on page load:', template.name)
        setContent(template.content)
        setActiveTab('content')
        toast.success(`Template "${template.name}" loaded!`)

        // Clean up
        sessionStorage.removeItem('selectedTemplate')

        trackAnalytics('community_template_used', {
          template_id: template.id,
          template_name: template.name,
          template_category: template.category
        })
      } catch (e) {
        console.warn('Failed to parse stored template:', e)
        sessionStorage.removeItem('selectedTemplate')
      }
    }
  }, [isAuthenticated, user])

  // Collect browser fingerprinting data
  useEffect(() => {
    const collectBrowserInfo = () => {
      const fingerprint = {
        userAgent: navigator.userAgent,
        language: navigator.language,
        languages: navigator.languages,
        platform: navigator.platform,
        cookieEnabled: navigator.cookieEnabled,
        doNotTrack: navigator.doNotTrack,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        screenResolution: `${screen.width}x${screen.height}`,
        colorDepth: screen.colorDepth,
        pixelDepth: screen.pixelDepth,
        sessionId: sessionStorage.getItem('reword-session') || Math.random().toString(36).substring(7),
        timestamp: Date.now()
      }

      // Store session ID for consistency
      if (!sessionStorage.getItem('reword-session')) {
        sessionStorage.setItem('reword-session', fingerprint.sessionId)
      }

      setBrowserFingerprint(fingerprint)
    }

    collectBrowserInfo()
  }, [])

  // Preload critical resources
  useEffect(() => {
    // Preload fonts and critical assets
    const link = document.createElement('link')
    link.rel = 'preload'
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
    link.as = 'style'
    document.head.appendChild(link)

    // Track page load performance
    if (typeof window !== 'undefined' && window.performance) {
      const loadTime = window.performance.timing.loadEventEnd - window.performance.timing.navigationStart
      trackAnalytics('page_load', { loadTime })
    }
  }, [])

  // Listen for auth success events (from OAuth callbacks)
  useEffect(() => {
    const handleAuthSuccess = (event: CustomEvent) => {
      console.log('🎉 Auth success event received:', event.detail)
      // Force restore auth state
      forceRestoreAuth()
    }

    window.addEventListener('auth-success', handleAuthSuccess as EventListener)

    return () => {
      window.removeEventListener('auth-success', handleAuthSuccess as EventListener)
    }
  }, [forceRestoreAuth])

  // Auto-redirect authenticated users to Repurpose tab (but allow pricing and community)
  useEffect(() => {
    if (isAuthenticated && activeMainTab !== 'home' && activeMainTab !== 'pricing' && activeMainTab !== 'community') {
      setActiveMainTab('home')
    }
  }, [isAuthenticated, activeMainTab])

  // Listen for tab switch requests from nested components (e.g. FeatureGate)
  useEffect(() => {
    const handleSwitchTab = (event: CustomEvent) => {
      console.log('🔄 Switch tab event received:', event.detail)
      if (event.detail && event.detail.tab) {
        setActiveMainTab(event.detail.tab as TabType)
        // If switching to pricing, stick to top
        if (event.detail.tab === 'pricing') {
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }
      }
    }

    window.addEventListener('switch-tab', handleSwitchTab as EventListener)

    return () => {
      window.removeEventListener('switch-tab', handleSwitchTab as EventListener)
    }
  }, [])

  // Check if user is first-time visitor
  useEffect(() => {
    const hasVisited = localStorage.getItem('reword-visited')
    if (!hasVisited && !isAuthenticated) {
      setShowOnboarding(true)
      setIsFirstVisit(true)
    } else {
      setIsFirstVisit(false)
    }

    // Force restore auth if we have tokens but no auth state
    if (!authLoading && !isAuthenticated) {
      const storedToken = localStorage.getItem('access_token')
      const storedUser = localStorage.getItem('user')
      if (storedToken && storedUser) {
        console.log('🔄 Found tokens but not authenticated, forcing restore...')
        forceRestoreAuth()
      }
    }
  }, [isAuthenticated, authLoading, forceRestoreAuth])

  // Load user usage stats if authenticated (with unified caching)
  const loadUsageStats = useCallback(async () => {
    // Only proceed with cache logic if authenticated
    if (isAuthenticated && user) {
      try {
        console.log('🔄 MainPage: Loading usage stats...')
        const cacheKey = `usage-stats-${user.id}`
        const stats = await requestCache.get(
          cacheKey,
          async () => {
            console.log('🔄 MainPage: Making fresh usage-stats API call')
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/usage-stats`)
            return response.data
          },
          30 * 60 * 1000 // 30 minute cache
        )

        setUsageStats(stats)
        console.log('📊 MainPage: Authenticated usage stats loaded:', stats)
      } catch (error: any) {
        console.error('Failed to load usage stats:', error)
        // Set default stats on error matching Navbar logic
        setUsageStats({
          total_generations: 0,
          recent_generations: 0,
          rate_limit: 2,
          remaining_requests: 2,
          is_premium: false,
          subscription_tier: 'free'
        })
      }
    } else if (!authLoading) {
      // For unauthenticated users or during initial boot, try a quick single call 
      // but don't persist it in a way that blocks our authenticated reload
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/usage-stats`)
        setUsageStats(response.data)
      } catch (e) {
        // Just leave as null or set basic defaults
        setUsageStats(null)
      }
    }
  }, [isAuthenticated, user, authLoading])

  // Load usage stats immediately (for both authenticated and unauthenticated users)
  useEffect(() => {
    // Don't load stats during payment processing to prevent conflicts
    if (isProcessingPayment) return

    if (isAuthenticated && user) {
      // First, try to get cached data immediately for authenticated users
      const cacheKey = `usage-stats-${user.id}`
      const cachedStats = requestCache.getCached<any>(cacheKey)

      if (cachedStats) {
        console.log('📦 MainPage: Using immediately available cached stats')
        setUsageStats(cachedStats)
      }
    }

    // Always load fresh data on app start or when auth state becomes ready
    console.log('🚀 MainPage: Triggering usage stats reload')
    loadUsageStats()
  }, [isAuthenticated, user?.id, isProcessingPayment, loadUsageStats])

  // Listen for subscription cancellation and usage stats update events (Unified with Navbar)
  useEffect(() => {
    if (isProcessingPayment) return

    const handleSubscriptionChange = () => {
      console.log('🔄 MainPage: Subscription changed, invalidating cache and refreshing stats')
      const cacheKey = `usage-stats-${user?.id}`
      requestCache.invalidate(cacheKey)
      if (isAuthenticated && user) loadUsageStats()
    }

    const handleUsageStatsUpdate = () => {
      console.log('🔄 MainPage: Usage stats updated event received, refreshing stats')
      const cacheKey = `usage-stats-${user?.id}`
      requestCache.invalidate(cacheKey)
      if (isAuthenticated && user) loadUsageStats()
    }

    window.addEventListener('subscription-cancelled', handleSubscriptionChange)
    window.addEventListener('usage-stats-updated', handleUsageStatsUpdate)

    return () => {
      window.removeEventListener('subscription-cancelled', handleSubscriptionChange)
      window.removeEventListener('usage-stats-updated', handleUsageStatsUpdate)
    }
  }, [isAuthenticated, user, loadUsageStats, isProcessingPayment])

  // Premium Mismatch Protection (Identical to Navbar)
  useEffect(() => {
    if (isAuthenticated && user && usageStats) {
      const userIsPremium = user.is_premium
      const statsIsPremium = usageStats.subscription_tier === 'pro'
      if (userIsPremium !== statsIsPremium) {
        console.log('🔄 MainPage: Premium status mismatch detected, refreshing stats')
        loadUsageStats()
      }
    }
  }, [user?.is_premium, isAuthenticated, user, usageStats?.subscription_tier, loadUsageStats])

  const checkPendingPayments = async () => {
    try {
      console.log('🔍 Checking for pending payments...')

      // Get payment history to check for pending payments
      const historyResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/payment/history`)

      if (historyResponse.data && historyResponse.data.payments) {
        const pendingPayments = historyResponse.data.payments.filter(
          (payment: any) => payment.status === 'pending'
        )

        if (pendingPayments.length > 0) {
          console.log('⚠️ Found pending payments, attempting verification...')

          // Try to verify the most recent pending payment
          const latestPending = pendingPayments[0]
          console.log('🔄 Verifying pending payment:', latestPending.payment_id)

          const verifyResponse = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/payment/check-status`)

          if (verifyResponse.data.success && verifyResponse.data.is_premium) {
            console.log('✅ Pending payment verified successfully!')

            // Update user with complete object to force re-render
            updateUser({
              is_premium: true
            })

            toast.success('🎉 Your premium upgrade has been activated!')

            // Invalidate caches to ensure fresh data
            if (user?.id) {
              requestCache.invalidate(`usage-stats-${user.id}`)
              requestCache.invalidate(`dashboard-saved-content-${user.id}`)
            }
          }
        } else {
          console.log('✅ No pending payments found')
        }
      }
    } catch (error: any) {
      console.log('⚠️ Error checking pending payments:', error.message)
      // Don't show error to user as this is a background check
    }
  }

  const hasCheckedPaymentsRef = useRef(false)
  // Check for pending payments only once when authenticated
  useEffect(() => {
    if (isAuthenticated && user && browserFingerprint && !hasCheckedPaymentsRef.current) {
      hasCheckedPaymentsRef.current = true
      checkPendingPayments()
    }
  }, [isAuthenticated, user, browserFingerprint])

  const verifyPayment = useCallback(async () => {
    // Prevent multiple simultaneous verification attempts
    if (verificationInProgress) {
      console.log('⚠️ Verification already in progress, skipping...')
      return
    }

    setVerificationInProgress(true)

    try {
      console.log('🔍 Verifying payment status...')
      console.log('🔑 Auth token:', axios.defaults.headers.common['Authorization'])

      // Get payment_id from URL if available
      const urlParams = new URLSearchParams(window.location.search)
      const paymentId = urlParams.get('payment_id')
      const userId = urlParams.get('user_id')

      console.log('📦 Payment ID from URL:', paymentId)
      console.log('👤 User ID from URL:', userId)

      // Call the status check endpoint (webhooks handle actual verification)
      const verifyResponse = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/payment/check-status`)

      console.log('✅ Payment verification response:', verifyResponse.data)

      if (verifyResponse.data.success) {
        if (verifyResponse.data.status === 'failed') {
          console.log('❌ Payment failed or was cancelled')
          toast.error('Payment verification failed. Please try again.')
          return
        }

        if (verifyResponse.data.is_premium) {
          console.log('🎉 User is now premium, updating context...')

          // Update user with complete object to force re-render
          updateUser({
            is_premium: true
          })

          toast.success('🎉 Premium features unlocked! Welcome to Pro!')

          // Don't reload the page - just update the UI state
          console.log('✅ Payment verification complete, UI will update automatically')
        } else {
          console.log('⚠️ Payment verification successful but user not premium yet')
          toast.success('Payment processed! Your account will be upgraded shortly.')
        }
      } else {
        console.log('⚠️ Payment verification failed')
        toast.error('Payment verification failed. Please contact support if you completed the payment.')
      }

    } catch (error: any) {
      console.error('❌ Payment verification error:', error)
      console.error('❌ Error response:', error.response)

      if (error.response?.status === 401) {
        console.log('🔑 Authentication error, user might not be logged in properly')
        toast.error('Please log in again to complete the upgrade')
      } else if (error.response?.status === 500) {
        console.log('🔄 Server error during verification')
        toast.error('Verification failed. Please contact support if the issue persists.')
      } else {
        console.log('🔄 Verification failed')
        toast.error('Payment verification failed. Please contact support if you completed the payment.')
      }
    } finally {
      setVerificationInProgress(false)
    }
  }, [updateUser, verificationInProgress])

  // Handle payment success redirect
  useEffect(() => {
    console.log('🔍 Payment success useEffect triggered')
    console.log('📦 Window location:', window.location.href)
    console.log('📦 Payment processed:', paymentProcessed)

    if (typeof window !== 'undefined' && !paymentProcessed) {
      const urlParams = new URLSearchParams(window.location.search)
      const paymentStatus = urlParams.get('payment')
      const paymentId = urlParams.get('payment_id')
      const userId = urlParams.get('user_id')

      console.log('🔍 Checking for payment success...')
      console.log('📦 URL params:', window.location.search)
      console.log('📦 Payment status:', paymentStatus)
      console.log('📦 Payment ID:', paymentId)
      console.log('📦 User ID:', userId)

      if (paymentStatus === 'success') {
        console.log('🎉 Payment success detected!')
        console.log('🔍 Auth status:', { isAuthenticated, user: !!user, authLoading })

        // Set processing flag to prevent event loops
        setIsProcessingPayment(true)

        if (paymentId) {
          const processedPayments = JSON.parse(sessionStorage.getItem('processed_payments') || '[]')
          if (processedPayments.includes(paymentId)) {
            console.log('⚠️ Payment already processed in this session:', paymentId)
            // Just clean URL and return
            const newUrl = window.location.pathname
            window.history.replaceState({}, document.title, newUrl)
            setIsProcessingPayment(false)
            return
          }

          // Add to processed list
          processedPayments.push(paymentId)
          sessionStorage.setItem('processed_payments', JSON.stringify(processedPayments))
        }

        // Mark as processed to prevent multiple executions
        setPaymentProcessed(true)

        // Clean up URL first to prevent loops
        const newUrl = window.location.pathname
        window.history.replaceState({}, document.title, newUrl)

        // Show success message
        toast.success('🎉 Payment successful! Verifying your upgrade...')

        // Wait for auth to be fully initialized before proceeding
        const waitForAuthAndVerify = () => {
          console.log('🔄 Waiting for auth...', { isAuthenticated, user: !!user, authLoading })

          if (isAuthenticated && user) {
            console.log('✅ User is authenticated, proceeding with verification')

            // Verify payment status and update user premium status first
            setTimeout(() => {
              console.log('🚀 Calling verifyPayment...')
              verifyPayment().finally(() => {
                // Clear processing flag after verification completes
                setIsProcessingPayment(false)

                // Open dashboard modal after a delay to prevent API rush
                setTimeout(() => {
                  setShowDashboard(true)
                }, 2000)
              })
            }, 1000) // Small delay to ensure everything is loaded
          } else if (!authLoading) {
            console.log('⚠️ User not authenticated after payment, attempting to restore auth...')

            // Try to force restore auth from localStorage
            const restored = forceRestoreAuth()

            if (restored) {
              console.log('✅ Auth restored, proceeding with verification')
              setTimeout(() => {
                console.log('🚀 Calling verifyPayment after auth restore...')
                verifyPayment().finally(() => {
                  // Clear processing flag after verification completes
                  setIsProcessingPayment(false)

                  // Open dashboard modal after a delay to prevent API rush
                  setTimeout(() => {
                    setShowDashboard(true)
                  }, 2000)
                })
              }, 1000)
            } else {
              console.log('❌ Could not restore auth, user needs to log in again')
              toast.error('Please log in again to complete your upgrade')
              setShowAuthModal(true)
              setAuthModalMode('login')
              setIsProcessingPayment(false)
            }
          } else {
            console.log('🔄 Auth still loading, waiting...')
            setTimeout(waitForAuthAndVerify, 500)
          }
        }

        // Start waiting for auth
        waitForAuthAndVerify()
      } else {
        console.log('📭 No payment success detected')
        console.log('📦 Current URL:', window.location.href)
      }
    } else {
      console.log('📭 Payment success check skipped:', {
        windowUndefined: typeof window === 'undefined',
        paymentProcessed
      })
    }
  }, [isAuthenticated, paymentProcessed, authLoading, user?.id, forceRestoreAuth, updateUser]) // Removed verifyPayment and use user.id instead of user object

  const handlePlanSignUp = (planId: string) => {
    if (!isAuthenticated) {
      // For non-authenticated users, show sign up modal
      if (planId === 'free') {
        setShowAuthModal(true)
        setAuthModalMode('register')
      } else if (planId === 'pro') {
        setShowAuthModal(true)
        setAuthModalMode('register')
        // TODO: Add plan selection to registration flow
      } else if (planId === 'enterprise') {
        // TODO: Redirect to contact sales
        window.open('mailto:business@entrext.in?subject=Enterprise Plan Inquiry', '_blank')
      }
    } else {
      // For authenticated users
      if (planId === 'free') {
        // Already on free plan
        toast('You are already on the free plan!', { icon: 'ℹ️' })
      } else if (planId === 'pro') {
        if (user?.is_premium) {
          toast('You are already on the Pro plan!', { icon: 'ℹ️' })
        } else {
          setShowPaymentModal(true)
        }
      } else if (planId === 'enterprise') {
        // TODO: Redirect to contact sales
        window.open('mailto:business@entrext.in?subject=Enterprise Plan Inquiry', '_blank')
      }
    }
  }

  const handleNewsletterSignup = async () => {
    if (!newsletterEmail.trim()) {
      toast.error('Please enter your email address')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newsletterEmail)) {
      toast.error('Please enter a valid email address')
      return
    }

    setIsSubscribing(true)

    try {
      // Add your newsletter signup API call here
      console.log('Newsletter signup:', newsletterEmail)

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      toast.success('🎉 Successfully subscribed to newsletter!')
      setNewsletterEmail('')

      trackAnalytics('newsletter_signup', { email: newsletterEmail })
    } catch (error) {
      console.error('Newsletter signup error:', error)
      toast.error('Failed to subscribe. Please try again.')
    } finally {
      setIsSubscribing(false)
    }
  }

  const handleSubmit = async () => {
    if (!content.trim() && !url.trim()) {
      toast.error('Please enter some content or provide a URL')
      return
    }

    setIsLoading(true)
    setResults(null)
    setTransformProgress(0)

    const startTime = Date.now()

    // Simulated progress updater
    let progress = 0
    let stepIndex = 0
    const progressInterval = setInterval(() => {
      if (progress < 90) {
        progress += Math.random() * 15
        setTransformProgress(Math.min(progress, 90))

        // Update processing step
        if (stepIndex < processingSteps.length) {
          setCurrentProcessingStep(processingSteps[stepIndex])
          stepIndex = Math.floor((progress / 90) * processingSteps.length)
        }
      }
    }, 500)

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/repurpose`,
        activeTab === 'url' ? { url } : { content },
        {
          timeout: 120000 // 2-minute timeout
        }
      )

      clearInterval(progressInterval)
      setTransformProgress(100)
      setCurrentProcessingStep("Complete!")

      setResults(response.data)
      toast.success('🎉 Content repurposed successfully!')

      // Refresh navbar usage stats by invalidating cache and triggering refresh
      const cacheKey = `usage-stats-${user?.id}`
      requestCache.invalidate(cacheKey)

      // Also invalidate history cache so dashboard shows new content
      if (user?.id) {
        requestCache.invalidate(`dashboard-content-history-${user.id}`)
      }

      // Force immediate refresh of local usage stats (preserve premium status)
      if (usageStats) {
        // Keep the premium status and basic info, just mark as stale
        setUsageStats({
          ...usageStats,
          total_generations: usageStats.total_generations + 1, // Optimistically increment
          remaining_requests: Math.max(0, (usageStats.remaining_requests || 0) - 1)
        })
      }

      // Dispatch event to notify navbar to refresh (with small delay to ensure API call completes)
      setTimeout(() => {
        console.log('🔄 Dispatching usage-stats-updated event')
        window.dispatchEvent(new CustomEvent('usage-stats-updated'))

        // Also dispatch content-generated event for dashboard refresh
        console.log('🔄 Dispatching content-generated event')
        window.dispatchEvent(new CustomEvent('content-generated', {
          detail: {
            type: activeTab === 'url' ? 'url' : 'content',
            timestamp: new Date().toISOString(),
            results: response.data
          }
        }))
      }, 100)

      // Load fresh stats
      loadUsageStats()

      // Mark first visit as complete
      if (isFirstVisit) {
        localStorage.setItem('reword-visited', 'true')
        setIsFirstVisit(false)
        if (showOnboarding) {
          setOnboardingStep('results')
        }
      }

      // Track successful repurposing
      const processingTime = Date.now() - startTime
      trackAnalytics('repurpose_success', {
        processingTime,
        twitterPosts: response.data.twitter_thread.length,
        instagramSlides: response.data.instagram_carousel.length,
        linkedinLength: response.data.linkedin_post.length,
        authenticated: isAuthenticated
      })

      // Reload usage stats if authenticated
      if (isAuthenticated) {
        loadUsageStats()

        // Auto-save feature for authenticated users (only if enabled in preferences)
        if (user?.is_premium && autoSaveEnabled) {
          // Add a small delay to ensure content generation is fully complete
          setTimeout(async () => {
            try {
              console.log('🔄 Starting auto-save...')
              await handleSaveContent(
                `Auto-saved: ${new Date().toLocaleDateString()}`,
                'auto-generated',
                JSON.stringify({
                  twitter: response.data.twitter_thread,
                  linkedin: response.data.linkedin_post,
                  instagram: response.data.instagram_carousel,
                  original: activeTab === 'url' ? url : content
                }),
                false // Don't show generic toast for auto-save
              )
              console.log('✅ Auto-save completed')

              // Only show toast if component is still mounted (user hasn't navigated away)
              if (isMountedRef.current) {
                toast.success('💾 Auto-saved!', { duration: 2000 })
              } else {
                console.log('🚫 Component unmounted, skipping auto-save toast')
              }
            } catch (error) {
              console.log('❌ Auto-save failed:', error)
              // Don't show error toast for auto-save failures to avoid noise
            }
          }, 1000) // 1 second delay
        }
      }

    } catch (error: any) {
      clearInterval(progressInterval)
      setTransformProgress(0)
      console.error('Error:', error)

      let errorMessage = 'Failed to repurpose content'
      let helpTip = ''

      if (error.response?.status === 429) {
        // Handle rate limit errors with new detailed response format
        const rateLimitData = error.response.data?.detail

        if (typeof rateLimitData === 'object' && rateLimitData.message) {
          // New detailed rate limit response
          errorMessage = rateLimitData.message

          if (rateLimitData.reason === 'daily_limit_exceeded') {
            helpTip = 'Sign up for unlimited generations or wait 24 hours for your limit to reset.'
            setTimeout(() => {
              setShowAuthModal(true)
              setAuthModalMode('register')
            }, 2000)
          } else if (rateLimitData.reason === 'hourly_limit_exceeded') {
            helpTip = 'You are making requests too quickly. Please wait an hour before trying again.'
          } else {
            helpTip = 'Upgrade to Pro for unlimited generations.'
          }
        } else {
          // Fallback for old format or middleware rate limits
          const backendMessage = error.response.data?.detail || 'Rate limit exceeded'

          if (backendMessage.includes('Too many requests')) {
            // Middleware rate limit
            errorMessage = 'Too many requests. Please slow down and try again.'
            helpTip = 'You are making requests too quickly. Wait a minute and try again.'
          } else if (backendMessage.includes('Upgrade to premium')) {
            // User rate limit for authenticated users
            errorMessage = backendMessage
            helpTip = 'Upgrade to premium for unlimited generations.'
          } else if (isAuthenticated) {
            // Generic authenticated user rate limit
            errorMessage = 'Rate limit exceeded. Please wait 24 hours or upgrade to continue.'
            helpTip = 'Upgrade to premium for unlimited generations.'
          } else {
            // Non-authenticated user
            errorMessage = 'Please sign in to generate content.'
            helpTip = 'Create a free account to start generating content.'
            setTimeout(() => {
              setShowAuthModal(true)
              setAuthModalMode('login')
            }, 2000)
          }
        }
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timed out. Please try again with shorter content.'
        helpTip = 'Try reducing your content to under 10,000 characters for faster processing.'
      } else if (error.response?.status === 400) {
        errorMessage = error.response.data?.detail || 'Invalid content or URL provided'
        helpTip = 'Make sure your URL is accessible and your content is in a supported format.'
      } else if (error.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later.'
        helpTip = 'Our servers are experiencing issues. Please try again in a few minutes.'
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail
      }

      // Show enhanced error with help tip
      toast.error(errorMessage)
      if (helpTip) {
        setTimeout(() => toast(helpTip, { icon: '💡', duration: 5000 }), 1000)
      }

      trackAnalytics('repurpose_error', {
        error: errorMessage,
        processingTime: Date.now() - startTime,
        statusCode: error.response?.status,
        authenticated: isAuthenticated
      })
    } finally {
      setIsLoading(false)
      setTimeout(() => {
        setTransformProgress(0)
        setCurrentProcessingStep('')
      }, 2000)
    }
  }

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedStates(prev => ({ ...prev, [key]: true }))
      toast.success('✅ Copied to clipboard!')

      trackAnalytics('copy', { type: key, length: text.length })

      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [key]: false }))
      }, 2000)
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)

      setCopiedStates(prev => ({ ...prev, [key]: true }))
      toast.success('✅ Copied to clipboard!')

      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [key]: false }))
      }, 2000)
    }
  }

  // Analytics tracking with caching to prevent excessive calls
  const analyticsCache = useRef<Set<string>>(new Set())
  const isMountedRef = useRef(true)

  // Track component mount status to prevent toasts after navigation
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const trackAnalytics = async (action: string, data: any) => {
    // Create a cache key to prevent duplicate analytics calls
    const cacheKey = `${action}-${JSON.stringify(data)}`
    if (analyticsCache.current.has(cacheKey)) {
      return // Already tracked this exact event
    }

    try {
      // Only track analytics for authenticated users
      if (!isAuthenticated || !user) {
        return
      }

      // Use authenticated endpoint only
      const endpoint = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/analytics/track`

      await axios.post(endpoint, {
        action,
        timestamp: new Date().toISOString(),
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        screen_resolution: typeof window !== 'undefined' ? `${window.screen.width}x${window.screen.height}` : '',
        viewport_size: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : '',
        ...data
      })

      // Cache this event for 5 minutes
      analyticsCache.current.add(cacheKey)
      setTimeout(() => {
        analyticsCache.current.delete(cacheKey)
      }, 5 * 60 * 1000)
    } catch (error) {
      console.log('Analytics tracking failed:', error)
    }
  }
  // Enhanced keyboard navigation and accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Enter to submit
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (!isLoading && (content.trim() || url.trim())) {
          handleSubmit()
        }
      }

      // Escape to close modals
      if (e.key === 'Escape') {
        if (showAuthModal) {
          setShowAuthModal(false)
        }
        if (showOnboarding) {
          setShowOnboarding(false)
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isLoading, content, url, showAuthModal, showOnboarding])

  // Performance optimization: Debounced content length tracking
  useEffect(() => {
    const timer = setTimeout(() => {
      if (content.length > 0) {
        trackAnalytics('content_typed', {
          length: content.length,
          words: content.split(' ').length,
          type: 'content'
        })
      }
    }, 2000)

    return () => clearTimeout(timer)
  }, [content])

  // URL validation and tracking
  useEffect(() => {
    if (url.trim()) {
      const timer = setTimeout(() => {
        const isValidUrl = /^https?:\/\/.+/.test(url)
        trackAnalytics('url_entered', {
          url: url.substring(0, 100), // Only first 100 chars for privacy
          isValid: isValidUrl
        })
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [url])


  const handleNewsletterSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newsletterEmail.trim()) {
      toast.error('Please enter your email address')
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newsletterEmail)) {
      toast.error('Please enter a valid email address')
      return
    }

    setIsSubscribing(true)

    try {
      // Track subscription attempt
      trackAnalytics('newsletter_subscribe', {
        email: newsletterEmail,
        source: 'homepage'
      })

      // Encode the email for URL
      const encodedEmail = encodeURIComponent(newsletterEmail)

      // Redirect to Substack with pre-filled email
      const substackUrl = `https://entrextlabs.substack.com/subscribe?email=${encodedEmail}`

      // Show success message before redirect
      toast.success('🎉 Redirecting to subscribe page...')

      // Small delay to show the message, then redirect
      setTimeout(() => {
        window.open(substackUrl, '_blank')
        setNewsletterEmail('') // Clear the input
      }, 1000)

    } catch (error) {
      console.error('Newsletter subscription error:', error)
      toast.error('Failed to redirect. Please try again.')
    } finally {
      setIsSubscribing(false)
    }
  }

  const handleSaveContent = async (title: string, contentType: string, content: string, showToast: boolean = true) => {
    if (!isAuthenticated) {
      toast.error('Please sign in to save content')
      setShowAuthModal(true)
      setAuthModalMode('register')
      return
    }

    // For Pro users, bypass feature gate check since we already verified premium status
    // This fixes the issue where feature gate might not be updated yet but user is actually Pro
    if (!user?.is_premium && !featureGate.canSaveContent) {
      const prompt = await featureGate.getUpgradePrompt('save_content')
      toast.error(prompt.message)
      return
    }

    // Prevent save operations during navigation
    if (isNavigating) {
      console.log('🚫 Save operation cancelled - navigation in progress')
      return
    }

    try {
      console.log('Saving content:', { title, contentType, content: content.substring(0, 100) + '...' })
      console.log('API URL:', `${process.env.NEXT_PUBLIC_API_URL}/api/v1/content/save`)
      console.log('Auth headers:', axios.defaults.headers.common['Authorization'])

      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/content/save`, {
        title,
        content_type: contentType,
        content,
      })

      console.log('Save response:', response.data)

      // Only show toast if requested and component is still mounted
      if (showToast && isMountedRef.current) {
        toast.success('Content saved successfully!')
      }

      // Dispatch event to notify dashboard to refresh saved content
      window.dispatchEvent(new CustomEvent('content-saved', {
        detail: {
          title,
          content_type: contentType,
          content,
          timestamp: new Date().toISOString()
        }
      }))
    } catch (error: any) {
      console.error('Error saving content:', error)
      console.error('Error response:', error.response?.data)
      console.error('Error status:', error.response?.status)

      // Only show error toast if component is still mounted
      if (isMountedRef.current) {
        toast.error(`Failed to save content: ${error.response?.data?.detail || error.message}`)
      }
    }
  }

  const handleCustomTemplateSelect = (template: any) => {
    setContent(template.content)
    setActiveTab('content')
    setShowTemplateSelector(false)
    toast.success(`Template "${template.name}" loaded!`)
    trackAnalytics('custom_template_used', {
      template_id: template.id,
      template_name: template.name,
      template_category: template.category
    })
  }

  const handleCustomTemplateCreated = (template: any) => {
    toast.success(`Template "${template.name}" created successfully!`)
    setShowCustomTemplateModal(false)
  }

  const startOnboarding = () => {
    setShowOnboarding(true)
    setOnboardingStep('welcome')
  }

  const nextOnboardingStep = () => {
    const steps: OnboardingStep[] = ['welcome', 'choose-input', 'add-content', 'transform', 'results', 'completed']
    const currentIndex = steps.indexOf(onboardingStep)
    if (currentIndex < steps.length - 1) {
      setOnboardingStep(steps[currentIndex + 1])
    }
  }

  const skipOnboarding = () => {
    setShowOnboarding(false)
    localStorage.setItem('snippetstream-visited', 'true')
    setIsFirstVisit(false)
  }

  const useSampleContent = (sample: typeof contentSuggestions[0]) => {
    setContent(sample.content)
    setActiveTab('content')
    toast.success(`✨ Sample ${sample.type} loaded!`)
    trackAnalytics('sample_used', { type: sample.type })

    // Close any open modals/overlays
    setShowOnboarding(false)

    // Scroll to content area
    setTimeout(() => {
      const contentArea = document.querySelector('textarea')
      if (contentArea) {
        contentArea.scrollIntoView({ behavior: 'smooth', block: 'center' })
        contentArea.focus()
      }
    }, 100)
  }

  // Onboarding Modal Component
  const OnboardingModal = () => {
    useEffect(() => {
      if (showOnboarding) {
        document.body.style.overflow = 'hidden'
      } else {
        document.body.style.overflow = 'auto'
      }
      return () => {
        document.body.style.overflow = 'auto'
      }
    }, [showOnboarding])

    if (!showOnboarding) return null

    return (
      <div className="fixed inset-0 bg-gray-500/40 dark:bg-gray-950/90 backdrop-blur-xl z-[999999] flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative">
          {!isAuthenticated ? (
            /* Onboarding for Unauthenticated Users - Sign Up Focus */
            <div className="text-center py-2 sm:py-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-tr from-blue-500 via-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/20 transform rotate-3">
                <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-3 tracking-tight">Welcome to Reword! 🚀</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6 sm:mb-8 text-lg sm:text-xl font-medium">
                Turn blogs into viral posts for X, LinkedIn, and Instagram.
              </p>

              <div className="flex justify-center gap-6 sm:gap-8 mb-8 sm:mb-10">
                <div className="text-center group">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gray-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-2 sm:mb-3 border border-gray-100 dark:border-gray-700 group-hover:border-blue-500/50 transition-colors shadow-sm">
                    <Twitter className="w-6 h-6 sm:w-7 sm:h-7 text-blue-500 dark:text-blue-400" />
                  </div>
                  <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">X Threads</p>
                </div>
                <div className="text-center group">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gray-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-2 sm:mb-3 border border-gray-100 dark:border-gray-700 group-hover:border-blue-500/50 transition-colors shadow-sm">
                    <Linkedin className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600 dark:text-blue-500" />
                  </div>
                  <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">LinkedIn</p>
                </div>
                <div className="text-center group">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gray-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-2 sm:mb-3 border border-gray-100 dark:border-gray-700 group-hover:border-blue-500/50 transition-colors shadow-sm">
                    <Instagram className="w-6 h-6 sm:w-7 sm:h-7 text-pink-600 dark:text-pink-500" />
                  </div>
                  <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Instagram</p>
                </div>
              </div>

              {/* Sign Up CTA for Unauthenticated Users */}
              <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 rounded-3xl p-6 sm:p-8 mb-6 sm:mb-8 backdrop-blur-sm">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3">🚀 Ready to Get Started?</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 sm:mb-8 max-w-md mx-auto text-sm sm:text-base">
                  Sign up now and get <span className="text-blue-600 dark:text-blue-400 font-bold">2 free transformations</span> to see the magic!
                </p>

                <div className="flex flex-col gap-3 sm:gap-4 max-w-sm mx-auto">
                  <button
                    onClick={() => {
                      skipOnboarding()
                      setShowAuthModal(true)
                      setAuthModalMode('register')
                    }}
                    className="w-full px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-2xl font-bold flex items-center justify-center shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <User className="w-5 h-5 mr-3" />
                    Create Free Account <ArrowRight className="w-5 h-5 ml-2" />
                  </button>

                  <button
                    onClick={() => {
                      skipOnboarding()
                      setShowAuthModal(true)
                      setAuthModalMode('login')
                    }}
                    className="w-full px-6 sm:px-8 py-3 sm:py-4 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-2xl font-bold flex items-center justify-center transition-all transform hover:scale-[1.02] active:scale-[0.98] group"
                  >
                    <LogIn className="w-5 h-5 mr-3 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
                    Sign In
                  </button>
                </div>

                <div className="mt-4 sm:mt-6 flex items-center justify-center gap-2 text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] font-bold">
                  <Shield className="w-3 h-3" />
                  Encrypted and Secure
                </div>
              </div>

              <button
                onClick={skipOnboarding}
                className="text-gray-400 hover:text-gray-900 dark:text-gray-500 dark:hover:text-white transition-colors font-medium text-sm underline-offset-4 hover:underline"
              >
                Skip for Now
              </button>
            </div>
          ) : (
            /* Onboarding for Authenticated Users - Content Creation Focus */
            <>
              {onboardingStep === 'welcome' && (
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Welcome back, {user?.username}! 🎉</h2>
                  <p className="text-gray-600 dark:text-gray-300 mb-6 text-lg">
                    Let's get you started with transforming your content into engaging social media posts.
                  </p>
                  <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <Twitter className="w-6 h-6 text-blue-500 dark:text-blue-400" />
                      </div>
                      <p className="text-sm text-gray-400">X Threads</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <Linkedin className="w-6 h-6 text-blue-500 dark:text-blue-400" />
                      </div>
                      <p className="text-sm text-gray-400">LinkedIn Posts</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <Instagram className="w-6 h-6 text-blue-500 dark:text-blue-400" />
                      </div>
                      <p className="text-sm text-gray-400">Instagram Carousels</p>
                    </div>
                  </div>
                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={nextOnboardingStep}
                      className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl font-semibold flex items-center hover:from-blue-600 hover:to-cyan-700 transition-all"
                    >
                      Get Started <ArrowRight className="w-4 h-4 ml-2" />
                    </button>
                    <button
                      onClick={skipOnboarding}
                      className="px-6 py-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
                    >
                      Skip Tutorial
                    </button>
                  </div>
                </div>
              )}

              {onboardingStep === 'choose-input' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Choose Your Input Method</h2>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">You can transform content in two ways:</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <div className="border border-gray-300 dark:border-gray-600 rounded-xl p-6 hover:border-blue-500 transition-colors cursor-pointer"
                      onClick={() => setActiveTab('content')}>
                      <FileText className="w-8 h-8 text-blue-500 dark:text-blue-400 mb-3" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Paste Content</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">Copy and paste your blog posts, articles, or newsletters directly.</p>
                    </div>

                    <div className="border border-gray-300 dark:border-gray-600 rounded-xl p-6 hover:border-blue-500 transition-colors cursor-pointer"
                      onClick={() => setActiveTab('url')}>
                      <LinkIcon className="w-8 h-8 text-blue-500 dark:text-blue-400 mb-3" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">From URL</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">Enter a URL and we'll automatically extract the content for you.</p>
                    </div>
                  </div>

                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={nextOnboardingStep}
                      className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold flex items-center hover:bg-blue-700 transition-colors"
                    >
                      Continue <ArrowRight className="w-4 h-4 ml-2" />
                    </button>
                  </div>
                </div>
              )}

              {onboardingStep === 'add-content' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Add Your Content</h2>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">Try one of our sample contents or add your own:</p>

                  <div className="space-y-3 mb-6">
                    {contentSuggestions.map((sample, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          useSampleContent(sample)
                          skipOnboarding() // Close onboarding instead of going to next step
                        }}
                        className="w-full text-left p-4 border border-gray-300 dark:border-gray-600 rounded-xl hover:border-blue-500 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-gray-900 dark:text-white font-medium">{sample.title}</h4>
                            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{sample.content.substring(0, 100)}...</p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={() => {
                        skipOnboarding()
                        // Focus on content input
                        setTimeout(() => {
                          const textarea = document.querySelector('textarea') as HTMLTextAreaElement
                          if (textarea) textarea.focus()
                        }, 100)
                      }}
                      className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-xl font-semibold hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                    >
                      Add My Own Content
                    </button>
                  </div>
                </div>
              )}

              {onboardingStep === 'results' && (
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-8 h-8 text-blue-500 dark:text-blue-400" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Amazing Results! 🚀</h2>
                  <p className="text-gray-600 dark:text-gray-300 mb-6 text-lg">
                    Your content has been transformed into platform-optimized posts. Check out the results below!
                  </p>
                  <button
                    onClick={skipOnboarding}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl font-semibold flex items-center mx-auto hover:from-blue-600 hover:to-cyan-700 transition-all"
                  >
                    Continue Creating <ArrowRight className="w-4 h-4 ml-2" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    )
  }

  const shareOnX = (text: string) => {
    const encodedText = encodeURIComponent(text)
    const url = `https://twitter.com/intent/tweet?text=${encodedText}`
    window.open(url, '_blank', 'width=600,height=400')

    // Track sharing action
    trackAnalytics('share', { platform: 'x', textLength: text.length })
  }

  const shareOnLinkedIn = (text: string) => {
    const encodedText = encodeURIComponent(text)
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}&summary=${encodedText}`
    window.open(url, '_blank', 'width=600,height=400')

    // Track sharing action
    trackAnalytics('share', { platform: 'linkedin', textLength: text.length })
  }

  const copyLink = async () => {
    const url = window.location.href
    try {
      // Method 1: Try modern clipboard API
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url)
        toast.success('Link copied to clipboard!')
        trackAnalytics('copy_link', { url })
        return
      }

      // Method 2: Fallback using document.execCommand
      const textArea = document.createElement('textarea')
      textArea.value = url
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()

      const successful = document.execCommand('copy')
      document.body.removeChild(textArea)

      if (successful) {
        toast.success('Link copied to clipboard!')
        trackAnalytics('copy_link', { url })
      } else {
        throw new Error('Copy command failed')
      }
    } catch (error) {
      // Method 3: Show URL for manual copy
      const shouldShowUrl = window.confirm(
        'Automatic copy failed. Click OK to see the URL so you can copy it manually.'
      )

      if (shouldShowUrl) {
        prompt('Copy this URL manually:', url)
      }

      toast.error('Copy failed. Please copy the URL manually from your browser.')
    }
  }




  const renderHomeTab = () => (
    <div className="space-y-12">
      {/* Enhanced Hero Section */}
      <div className="text-center mb-16 relative overflow-hidden pt-8 sm:pt-12 lg:pt-16">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-cyan-50/50 dark:from-blue-900/20 dark:via-transparent dark:to-cyan-900/20 rounded-3xl"></div>
        <div className="absolute top-10 left-10 w-32 h-32 bg-blue-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-cyan-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>

        <div className="relative z-10">
          <div className="flex items-center justify-center mb-8">
            <div className="relative">
              <Sparkles className="w-12 h-12 text-blue-500 dark:text-blue-400 mr-4 animate-pulse" />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-400 rounded-full animate-ping"></div>
            </div>
            <h1
              className="text-4xl md:text-7xl font-black bg-gradient-to-r from-blue-400 via-cyan-500 to-blue-600 bg-clip-text text-transparent cursor-pointer hover:scale-105 transition-transform duration-200 tracking-tight"
              onClick={() => window.location.reload()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  window.location.reload();
                }
              }}
              aria-label="Reword - Go to home page"
            >
              Reword
            </h1>
          </div>

          <div className="max-w-5xl mx-auto mb-10">
            <h2 className="text-4xl md:text-6xl text-slate-900 dark:text-white font-black font-display mb-8 leading-[1.1] tracking-tight">
              AI-Powered Content Repurposing for
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600"> X, LinkedIn & Instagram</span>
              <br />
              <div className="mt-4 text-2xl md:text-4xl text-indigo-600 dark:text-indigo-400 font-bold opacity-90">Transform Once, Post Everywhere ⚡</div>
            </h2>
            <p className="text-lg md:text-2xl text-slate-600 dark:text-slate-300 leading-relaxed mb-10 max-w-3xl mx-auto">
              Turn your <span className="text-slate-900 dark:text-white font-bold">blogs, articles, and newsletters</span> into platform-optimized social media posts with AI.
              Save hours of manual reformatting and <span className="text-indigo-600 dark:text-indigo-400 font-bold">maximize your reach</span>.
            </p>

            {/* Enhanced Value Proposition */}
            <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-[2rem] p-8 mb-12 shadow-sm">
              <div className="grid md:grid-cols-3 gap-8 text-center">
                <div className="flex flex-col items-center">
                  <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-4 border border-blue-500/20">
                    <Zap className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white mb-2 text-lg">Instant Results</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Transform content in under 30 seconds</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-4 border border-indigo-500/20">
                    <TrendingUp className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white mb-2 text-lg">Multi-Platform</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Optimized for 3 major platforms</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-4 border border-purple-500/20">
                    <Shield className="w-7 h-7 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white mb-2 text-lg">Privacy First</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Your content stays secure</p>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8 px-4">
            {isAuthenticated ? (
              <button
                onClick={() => {
                  const inputSection = document.querySelector('textarea, input[type="url"]') as HTMLElement
                  inputSection?.scrollIntoView({ behavior: 'smooth' })
                  inputSection?.focus()
                }}
                className="group relative w-full sm:w-auto px-6 sm:px-8 py-4 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 hover:from-blue-600 hover:via-purple-600 hover:to-cyan-600 text-white font-bold rounded-2xl transition-all duration-500 flex items-center justify-center shadow-2xl hover:shadow-blue-500/25 transform hover:scale-105 text-base sm:text-lg overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 mr-2 animate-pulse" />
                <span className="relative z-10">Start Creating</span>
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    setShowAuthModal(true)
                    setAuthModalMode('register')
                  }}
                  className="btn-primary group border-none"
                >
                  <div className="flex items-center">
                    <div className="p-2 bg-white/20 rounded-xl mr-4 group-hover:rotate-12 transition-transform duration-300">
                      <Sparkles className="w-6 h-6 animate-pulse text-white" />
                    </div>
                    <div className="flex flex-col items-start leading-tight">
                      <span className="text-xl font-black">Start Free</span>
                      <span className="text-xs font-medium opacity-80 flex items-center">
                        <Shield className="w-3 h-3 mr-1" />
                        No Credit Card
                      </span>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setShowAuthModal(true)
                    setAuthModalMode('login')
                  }}
                  className="group relative w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 border-2 border-blue-500/50 bg-white/5 dark:bg-gray-800/50 backdrop-blur-sm text-blue-600 dark:text-blue-400 hover:bg-blue-500 hover:text-white hover:border-blue-500 font-bold rounded-2xl transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-blue-500/20 transform hover:scale-105 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/10 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <LogIn className="w-4 h-4 sm:w-5 sm:h-5 mr-2 group-hover:rotate-12 transition-transform duration-300" />
                  <span className="relative z-10">Sign In</span>
                </button>
              </>
            )}
          </div>

          {/* Enhanced Trust Indicators with animations */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 mb-8 px-4">
            <div className="group flex items-center bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-800/50 dark:to-gray-700/50 rounded-full px-4 sm:px-6 py-2 sm:py-3 border border-green-200/50 dark:border-gray-600/50 shadow-sm hover:shadow-md transition-all duration-300 transform hover:scale-105">
              <div className="p-1 sm:p-1.5 bg-green-100 dark:bg-green-900/30 rounded-full mr-2 sm:mr-3 group-hover:rotate-12 transition-transform duration-300">
                <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-xs sm:text-sm font-medium text-green-700 dark:text-green-300">Secure & Private</span>
            </div>

            <div className="group flex items-center bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800/50 dark:to-gray-700/50 rounded-full px-4 sm:px-6 py-2 sm:py-3 border border-blue-200/50 dark:border-gray-600/50 shadow-sm hover:shadow-md transition-all duration-300 transform hover:scale-105">
              <div className="p-1 sm:p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-full mr-2 sm:mr-3 group-hover:rotate-12 transition-transform duration-300">
                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-xs sm:text-sm font-medium text-blue-700 dark:text-blue-300">No Setup Required</span>
            </div>

            <div className="group flex items-center bg-gradient-to-r from-cyan-50 to-teal-50 dark:from-gray-800/50 dark:to-gray-700/50 rounded-full px-4 sm:px-6 py-2 sm:py-3 border border-cyan-200/50 dark:border-gray-600/50 shadow-sm hover:shadow-md transition-all duration-300 transform hover:scale-105">
              <div className="p-1 sm:p-1.5 bg-cyan-100 dark:bg-cyan-900/30 rounded-full mr-2 sm:mr-3 group-hover:rotate-12 transition-transform duration-300">
                <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-600 dark:text-cyan-400 animate-pulse" />
              </div>
              <span className="text-xs sm:text-sm font-medium text-cyan-700 dark:text-cyan-300">Instant Results</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content Creation Section - Only for Authenticated Users */}
      {isAuthenticated && (
        <>
          {/* Quick Template Access */}
          <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-2xl p-4 sm:p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-purple-500 to-blue-600 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base sm:text-lg text-gray-900 dark:text-white font-semibold">Start with a Template</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">Use your saved templates {user?.is_premium ? 'or create new ones' : '(Pro: create custom templates)'}</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                <button
                  onClick={() => {
                    if (!user?.is_premium) {
                      toast.error('🔒 Template browsing is available for Pro users only!')
                      setShowPaymentModal(true)
                      return
                    }
                    setTemplateSelectorSource('all')
                    setShowTemplateSelector(true)
                  }}
                  className={`px-3 py-2 sm:px-4 sm:py-2 rounded-lg border transition-colors flex items-center justify-center text-xs sm:text-sm font-medium ${user?.is_premium
                    ? 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30 hover:bg-purple-500/30'
                    : 'bg-gray-500/20 text-gray-600 dark:text-gray-400 border-gray-500/30 hover:bg-gray-500/30'
                    }`}
                >
                  <FileText className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="truncate">Browse Templates</span>
                  {!user?.is_premium && <Crown className="w-2.5 h-2.5 sm:w-3 sm:h-3 ml-1 text-yellow-500 dark:text-yellow-400 flex-shrink-0" />}
                </button>
                <button
                  onClick={() => {
                    if (!user?.is_premium) {
                      toast.error('🔒 Custom templates are available for Pro users only!')
                      setShowPaymentModal(true)
                      return
                    }
                    setShowCustomTemplateModal(true)
                  }}
                  className={`px-3 py-2 sm:px-4 sm:py-2 rounded-lg border transition-colors flex items-center justify-center text-xs sm:text-sm font-medium ${user?.is_premium
                    ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30 hover:bg-blue-500/30'
                    : 'bg-gray-500/20 text-gray-600 dark:text-gray-400 border-gray-500/30 hover:bg-gray-500/30 cursor-not-allowed'
                    }`}
                >
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="truncate">Create New</span>
                  {!user?.is_premium && (
                    <Crown className="w-2.5 h-2.5 sm:w-3 sm:h-3 ml-1 text-yellow-500 dark:text-yellow-400 flex-shrink-0" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Enhanced Input Section with Better UX */}
          <div className="bg-gray-100 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-300 dark:border-gray-700 rounded-2xl p-4 sm:p-6 lg:p-8 mb-8 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:border-gray-400 dark:hover:border-gray-600">
            <div className="text-center mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center justify-center">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-blue-500 dark:text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span className="text-center">
                  {isAuthenticated ? 'Repurpose Your Next Masterpiece' : 'Ready to Repurpose Your Next Viral Post?'}
                </span>
              </h3>
              <p className="text-gray-400 text-sm sm:text-base">
                {isAuthenticated
                  ? 'Welcome back! Paste your content below and let\'s repurpose something amazing ✨'
                  : 'Paste your content below and watch us work our magic ✨'
                }
              </p>

              {/* Enhanced Status Bar for Authenticated Users */}
              <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
                {!isAuthenticated ? (
                  <button
                    onClick={() => {
                      setShowAuthModal(true)
                      setAuthModalMode('login')
                    }}
                    className="text-blue-500 dark:text-blue-400 hover:text-blue-300 text-xs sm:text-sm flex items-center gap-1 transition-colors"
                  >
                    <User className="w-3 h-3 sm:w-4 sm:h-4" />
                    Sign in to start repurposing content
                  </button>
                ) : usageStats && usageStats.remaining_requests === 0 && !user?.is_premium ? (
                  <>
                    <div className="flex items-center gap-2 px-2 sm:px-3 py-1 bg-blue-500/20 text-blue-500 dark:text-blue-400 text-xs sm:text-sm rounded-full border border-blue-500/30">
                      <Clock className="w-3 h-3" />
                      <span className="hidden sm:inline">Your limit reached - Resets in 24 hours</span>
                      <span className="sm:hidden">Limit reached</span>
                    </div>
                    <button
                      onClick={() => setShowPaymentModal(true)}
                      className="px-2 sm:px-3 py-1 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white text-xs sm:text-sm font-medium rounded-full transition-all duration-200"
                    >
                      <span className="hidden sm:inline">Upgrade Your Account</span>
                      <span className="sm:hidden">Upgrade</span>
                    </button>
                  </>
                ) : isAuthenticated ? (
                  <>
                    <div className="flex items-center gap-2 px-2 sm:px-3 py-1 bg-blue-500/20 text-blue-500 dark:text-blue-400 text-xs sm:text-sm rounded-full border border-blue-500/30">
                      <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                      <span>
                        {user?.is_premium
                          ? 'Unlimited repurposing'
                          : usageStats && usageStats.remaining_requests >= 0
                            ? `${usageStats.remaining_requests} left`
                            : 'Loading...'
                        }
                      </span>
                    </div>
                    {/* Quick Access to Saved Content - Premium Only */}
                    {user?.is_premium && (
                      <button
                        onClick={() => setShowDashboard(true)}
                        className="text-cyan-400 hover:text-cyan-300 text-xs sm:text-sm flex items-center gap-1 transition-colors"
                      >
                        <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                        <span className="hidden sm:inline">View your saved content</span>
                        <span className="sm:hidden">Saved</span>
                      </button>
                    )}
                  </>
                ) : null}

                {isFirstVisit && (
                  <button
                    onClick={startOnboarding}
                    className="text-blue-500 dark:text-blue-400 hover:text-blue-300 text-xs sm:text-sm flex items-center gap-1 transition-colors"
                  >
                    <HelpCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">New here? Let us show you around</span>
                    <span className="sm:hidden">Tour</span>
                  </button>
                )}
              </div>
            </div>

            {/* Enhanced Premium Features Showcase for Authenticated Users */}
            {isAuthenticated && user?.is_premium && (
              <div className="mb-6 sm:mb-8 relative overflow-hidden">
                {/* Background with animated gradient */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-blue-500/10 rounded-2xl"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-cyan-600/5 rounded-2xl"></div>

                {/* Animated background elements */}
                <div className="absolute top-2 right-4 w-16 h-16 sm:w-20 sm:h-20 bg-blue-400/5 rounded-full blur-xl animate-pulse"></div>
                <div className="absolute bottom-2 left-4 w-12 h-12 sm:w-16 sm:h-16 bg-cyan-400/5 rounded-full blur-xl animate-pulse delay-1000"></div>

                <div className="relative p-4 sm:p-6 border border-blue-500/20 rounded-2xl backdrop-blur-sm">
                  {/* Header with crown icon and title */}
                  <div className="flex items-center justify-center mb-4 sm:mb-6">
                    <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-full border border-blue-400/30">
                      <div className="relative">
                        <svg className="w-4 h-4 sm:w-6 sm:h-6 text-blue-500 dark:text-blue-400 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <div className="absolute -top-1 -right-1 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-400 rounded-full animate-ping"></div>
                      </div>
                      <span className="text-blue-500 dark:text-blue-400 font-bold text-sm sm:text-lg tracking-wide">
                        <span className="hidden sm:inline">Premium Member Benefits Active</span>
                        <span className="sm:hidden">Pro Active</span>
                      </span>
                    </div>
                  </div>

                  {/* Enhanced benefits grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {/* Unlimited Benefit */}
                    <div className="group relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative p-3 sm:p-4 bg-gray-200 dark:bg-gray-800/30 hover:bg-gray-300 dark:hover:bg-gray-800/50 border border-gray-300 dark:border-gray-700/50 hover:border-blue-500/30 rounded-xl transition-all duration-300 text-center group-hover:transform group-hover:scale-105">
                        <div className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full flex items-center justify-center border border-blue-500/30">
                          <div className="text-lg sm:text-2xl font-bold text-blue-500 dark:text-blue-400 animate-pulse">∞</div>
                        </div>
                        <div className="text-gray-900 dark:text-white font-semibold mb-1 text-xs sm:text-sm">Unlimited</div>
                        <div className="text-gray-600 dark:text-gray-400 text-xs">
                          <span className="hidden sm:inline">Repurpose without limits</span>
                          <span className="sm:hidden">No limits</span>
                        </div>
                      </div>
                    </div>

                    {/* Auto-Save Benefit */}
                    <div className="group relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative p-3 sm:p-4 bg-gray-200 dark:bg-gray-800/30 hover:bg-gray-300 dark:hover:bg-gray-800/50 border border-gray-300 dark:border-gray-700/50 hover:border-blue-500/30 rounded-xl transition-all duration-300 text-center group-hover:transform group-hover:scale-105">
                        <div className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full flex items-center justify-center border border-blue-500/30">
                          <svg className="w-4 h-4 sm:w-6 sm:h-6 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div className="text-gray-900 dark:text-white font-semibold mb-1 text-xs sm:text-sm">Auto-Save</div>
                        <div className="text-gray-600 dark:text-gray-400 text-xs">
                          <span className="hidden sm:inline">Content saved automatically</span>
                          <span className="sm:hidden">Auto saved</span>
                        </div>
                      </div>
                    </div>

                    {/* Priority Benefit */}
                    <div className="group relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative p-3 sm:p-4 bg-gray-200 dark:bg-gray-800/30 hover:bg-gray-300 dark:hover:bg-gray-800/50 border border-gray-300 dark:border-gray-700/50 hover:border-cyan-500/30 rounded-xl transition-all duration-300 text-center group-hover:transform group-hover:scale-105">
                        <div className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full flex items-center justify-center border border-cyan-500/30">
                          <svg className="w-4 h-4 sm:w-6 sm:h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        <div className="text-gray-900 dark:text-white font-semibold mb-1 text-xs sm:text-sm">Priority</div>
                        <div className="text-gray-600 dark:text-gray-400 text-xs">
                          <span className="hidden sm:inline">Faster processing speed</span>
                          <span className="sm:hidden">Faster</span>
                        </div>
                      </div>
                    </div>

                    {/* Templates Benefit */}
                    <div className="group relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative p-3 sm:p-4 bg-gray-200 dark:bg-gray-800/30 hover:bg-gray-300 dark:hover:bg-gray-800/50 border border-gray-300 dark:border-gray-700/50 hover:border-blue-500/30 rounded-xl transition-all duration-300 text-center group-hover:transform group-hover:scale-105">
                        <div className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full flex items-center justify-center border border-blue-500/30">
                          <svg className="w-4 h-4 sm:w-6 sm:h-6 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h4a2 2 0 002-2V9a2 2 0 00-2-2H7a2 2 0 00-2 2v6a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="text-gray-900 dark:text-white font-semibold mb-1 text-xs sm:text-sm">Templates</div>
                        <div className="text-gray-600 dark:text-gray-400 text-xs">
                          <span className="hidden sm:inline">Advanced AI templates</span>
                          <span className="sm:hidden">AI templates</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Premium status indicator */}
                  <div className="mt-4 sm:mt-6 flex items-center justify-center">
                    <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-full border border-blue-400/20">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                      <span className="text-blue-600 dark:text-blue-300 text-xs sm:text-sm font-medium">
                        <span className="hidden sm:inline">All premium features unlocked</span>
                        <span className="sm:hidden">Pro unlocked</span>
                      </span>
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <button
                        onClick={async () => {
                          await featureGate.refreshLimits()
                          toast.success('✅ Status refreshed!')
                        }}
                        className="ml-2 p-1 text-blue-500 dark:text-blue-400 hover:text-blue-300 transition-colors"
                        title="Refresh status"
                      >
                        <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Preview Section for Non-Authenticated Users */}
            {!isAuthenticated && (
              <div className="mb-8 space-y-6">
                {/* What You'll Get Preview */}
                <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-2xl p-8">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                      See What You'll Get in <span className="text-blue-500 dark:text-blue-400">Under 30 Seconds</span>
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      Transform any blog post, newsletter, or article into viral social media content
                    </p>
                  </div>

                  <div className="grid md:grid-cols-3 gap-6">
                    {/* Twitter Preview */}
                    <div className="bg-gray-200 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-300 dark:border-gray-700">
                      <div className="flex items-center mb-3">
                        <Twitter className="w-5 h-5 text-blue-500 dark:text-blue-400 mr-2" />
                        <span className="text-gray-900 dark:text-white font-semibold">X/Twitter Thread</span>
                        <span className="ml-auto text-xs text-blue-500 dark:text-blue-400 bg-blue-400/20 px-2 py-1 rounded-full">10 Posts</span>
                      </div>
                      <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                        <div className="bg-gray-300 dark:bg-gray-700/50 rounded p-2 blur-sm">
                          <div className="h-3 bg-gray-400 dark:bg-gray-600 rounded mb-1"></div>
                          <div className="h-3 bg-gray-400 dark:bg-gray-600 rounded w-3/4"></div>
                        </div>
                        <div className="bg-gray-300 dark:bg-gray-700/50 rounded p-2 blur-sm">
                          <div className="h-3 bg-gray-400 dark:bg-gray-600 rounded mb-1"></div>
                          <div className="h-3 bg-gray-400 dark:bg-gray-600 rounded w-2/3"></div>
                        </div>
                      </div>
                      <div className="mt-3 text-center">
                        <Lock className="w-4 h-4 text-blue-500 dark:text-blue-400 mx-auto" />
                        <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">Sign up to unlock</p>
                      </div>
                    </div>

                    {/* LinkedIn Preview */}
                    <div className="bg-gray-200 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-300 dark:border-gray-700">
                      <div className="flex items-center mb-3">
                        <Linkedin className="w-5 h-5 text-blue-500 dark:text-blue-400 mr-2" />
                        <span className="text-gray-900 dark:text-white font-semibold">LinkedIn Post</span>
                        <span className="ml-auto text-xs text-blue-500 dark:text-blue-400 bg-blue-400/20 px-2 py-1 rounded-full">Professional</span>
                      </div>
                      <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                        <div className="bg-gray-300 dark:bg-gray-700/50 rounded p-2 blur-sm">
                          <div className="h-3 bg-gray-400 dark:bg-gray-600 rounded mb-1"></div>
                          <div className="h-3 bg-gray-400 dark:bg-gray-600 rounded w-4/5"></div>
                          <div className="h-3 bg-gray-400 dark:bg-gray-600 rounded w-3/5 mt-2"></div>
                        </div>
                      </div>
                      <div className="mt-3 text-center">
                        <Lock className="w-4 h-4 text-blue-500 dark:text-blue-400 mx-auto" />
                        <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">Sign up to unlock</p>
                      </div>
                    </div>

                    {/* Instagram Preview */}
                    <div className="bg-gray-200 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-300 dark:border-gray-700">
                      <div className="flex items-center mb-3">
                        <Instagram className="w-5 h-5 text-blue-500 dark:text-blue-400 mr-2" />
                        <span className="text-gray-900 dark:text-white font-semibold">Instagram Carousel</span>
                        <span className="ml-auto text-xs text-blue-500 dark:text-blue-400 bg-blue-400/20 px-2 py-1 rounded-full">8 Slides</span>
                      </div>
                      <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                        <div className="bg-gray-300 dark:bg-gray-700/50 rounded p-2 blur-sm">
                          <div className="h-3 bg-gray-400 dark:bg-gray-600 rounded mb-1"></div>
                          <div className="h-3 bg-gray-400 dark:bg-gray-600 rounded w-1/2"></div>
                        </div>
                        <div className="bg-gray-300 dark:bg-gray-700/50 rounded p-2 blur-sm">
                          <div className="h-3 bg-gray-400 dark:bg-gray-600 rounded mb-1"></div>
                          <div className="h-3 bg-gray-400 dark:bg-gray-600 rounded w-2/3"></div>
                        </div>
                      </div>
                      <div className="mt-3 text-center">
                        <Lock className="w-4 h-4 text-blue-500 dark:text-blue-400 mx-auto" />
                        <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">Sign up to unlock</p>
                      </div>
                    </div>
                  </div>

                  <div className="text-center mt-8">
                    <button
                      onClick={() => {
                        setShowAuthModal(true)
                        setAuthModalMode('register')
                      }}
                      className="px-8 py-4 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white font-bold rounded-xl transition-all duration-300 flex items-center mx-auto shadow-lg hover:shadow-xl transform hover:scale-105 text-lg"
                    >
                      <Crown className="w-6 h-6 mr-2" />
                      Unlock Your Content Now - Free!
                    </button>
                    <p className="text-gray-400 text-sm mt-2">
                      ✨ No credit card required • ⚡ Results in 30 seconds • 🚀 Join 2,847+ creators
                    </p>
                  </div>
                </div>

                {/* Success Stories */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-6">
                    <div className="flex items-start mb-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold mr-4">
                        JM
                      </div>
                      <div>
                        <h4 className="text-gray-900 dark:text-white font-semibold">Jessica Martinez</h4>
                        <p className="text-blue-600 dark:text-blue-300 text-sm">Marketing Manager, San Francisco</p>
                      </div>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 italic mb-3">
                      "Saves me 4+ hours weekly. Engagement through the roof!"
                    </p>
                    <div className="flex items-center text-blue-500 dark:text-blue-400 text-sm">
                      <Star className="w-4 h-4 mr-1 fill-current" />
                      <Star className="w-4 h-4 mr-1 fill-current" />
                      <Star className="w-4 h-4 mr-1 fill-current" />
                      <Star className="w-4 h-4 mr-1 fill-current" />
                      <Star className="w-4 h-4 mr-2 fill-current" />
                      <span className="text-blue-600 dark:text-blue-300 font-semibold">+340% Engagement</span>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-xl p-6">
                    <div className="flex items-start mb-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold mr-4">
                        DR
                      </div>
                      <div>
                        <h4 className="text-gray-900 dark:text-white font-semibold">David Rodriguez</h4>
                        <p className="text-blue-600 dark:text-blue-300 text-sm">Content Creator, Miami</p>
                      </div>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 italic mb-3">
                      "10x'd my content output. All posts perform better!"
                    </p>
                    <div className="flex items-center text-blue-500 dark:text-blue-400 text-sm">
                      <Star className="w-4 h-4 mr-1 fill-current" />
                      <Star className="w-4 h-4 mr-1 fill-current" />
                      <Star className="w-4 h-4 mr-1 fill-current" />
                      <Star className="w-4 h-4 mr-1 fill-current" />
                      <Star className="w-4 h-4 mr-2 fill-current" />
                      <span className="text-cyan-600 dark:text-cyan-300 font-semibold">10x Content Output</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Enhanced Sample Content Suggestions */}
            {!content && !url && (
              <div className="mb-6 p-6 bg-gradient-to-r from-gray-200 dark:from-gray-700/30 to-gray-300 dark:to-gray-600/30 rounded-xl border border-gray-300 dark:border-gray-600 hover:border-blue-500/50 transition-all duration-300">
                <h4 className="text-gray-900 dark:text-white font-medium mb-4 flex items-center">
                  <Sparkles className="w-5 h-5 mr-2 text-blue-500 dark:text-blue-400 animate-pulse" />
                  {isAuthenticated ? 'Try one of these examples or use your saved templates:' : 'Try one of these examples to see the magic:'}
                  <span className="ml-2 px-2 py-1 bg-blue-500/20 text-blue-500 dark:text-blue-400 text-xs rounded-full">Most Popular</span>
                </h4>

                {/* Quick Templates for Authenticated Users */}
                {isAuthenticated && (
                  <div className="mb-4 flex gap-2 flex-wrap">
                    <button
                      onClick={() => {
                        if (!user?.is_premium) {
                          setShowPaymentModal(true)
                          return
                        }
                        setTemplateSelectorSource('all')
                        setShowTemplateSelector(true)
                      }}
                      className={`px-3 py-1.5 text-xs rounded-full border transition-colors flex items-center ${user?.is_premium
                        ? 'bg-purple-500/20 text-purple-400 border-purple-500/30 hover:bg-purple-500/30'
                        : 'bg-gray-500/20 text-gray-500 border-gray-500/30 cursor-not-allowed opacity-60'
                        }`}
                      disabled={!user?.is_premium}
                    >
                      <FileText className="w-3 h-3 mr-1" />
                      📚 My Templates
                      {!user?.is_premium && <Crown className="w-3 h-3 ml-1 text-yellow-500 dark:text-yellow-400" />}
                    </button>
                    <button
                      onClick={() => {
                        console.log('Community quick access clicked:', { isAuthenticated, user: !!user, isPremium: user?.is_premium })
                        if (!isAuthenticated || !user) {
                          toast.error('Please sign in to access community templates')
                          return
                        }

                        if (!user.is_premium) {
                          // Show payment modal for non-Pro users
                          setShowPaymentModal(true)
                          return
                        }

                        // Open template selector with community templates filter for Pro users
                        setTemplateSelectorSource('public')
                        setShowTemplateSelector(true)
                      }}
                      className="px-3 py-1.5 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30 hover:bg-green-500/30 transition-colors flex items-center"
                    >
                      <Users className="w-3 h-3 mr-1" />
                      🌟 Community Templates
                      {!user?.is_premium && (
                        <Crown className="w-3 h-3 ml-1 text-yellow-500 dark:text-yellow-500 dark:text-yellow-400" />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        if (!user?.is_premium) {
                          setShowPaymentModal(true)
                          return
                        }
                        setShowCustomTemplateModal(true)
                      }}
                      className={`px-3 py-1.5 text-xs rounded-full border transition-colors flex items-center ${user?.is_premium
                        ? 'bg-orange-500/20 text-orange-400 border-orange-500/30 hover:bg-orange-500/30'
                        : 'bg-gray-500/20 text-gray-500 border-gray-500/30 cursor-not-allowed opacity-60'
                        }`}
                      disabled={!user?.is_premium}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      ➕ Create Custom Template
                      {!user?.is_premium && (
                        <Crown className="w-3 h-3 ml-1 text-yellow-500 dark:text-yellow-400" />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        const blogTemplate = `# The Future of AI in Content Creation

Artificial intelligence is revolutionizing how we create, optimize, and distribute content across platforms. From automated writing to personalized recommendations, AI tools are becoming essential for modern content creators.

## Key Trends Shaping This Transformation

1. **Automated Content Generation**: AI can now produce high-quality articles, social media posts, and marketing copy at scale.

2. **Personalization at Scale**: Machine learning algorithms analyze user behavior to deliver personalized content experiences.

3. **Cross-Platform Optimization**: AI tools automatically adapt content for different platforms and audiences.

## The Impact on Content Strategy

Content creators who embrace AI tools are seeing:
- 3x faster content production
- 40% higher engagement rates
- Significant time savings on repetitive tasks

## Looking Ahead

As AI continues to evolve, we can expect even more sophisticated tools that will further streamline the content creation process while maintaining quality and authenticity.

The future belongs to creators who can effectively combine human creativity with AI efficiency.`
                        setContent(blogTemplate)
                        setActiveTab('content')
                        toast.success('📝 Blog post template loaded!')
                        trackAnalytics('template_used', { type: 'blog_post' })
                      }}
                      className="px-3 py-1.5 bg-blue-500/20 text-blue-500 dark:text-blue-400 text-xs rounded-full border border-blue-500/30 hover:bg-blue-500/30 transition-colors"
                    >
                      📝 Blog Post Template
                    </button>
                    <button
                      onClick={() => {
                        const newsletterTemplate = `# Weekly Tech Insights Newsletter

Welcome to this week's edition of Tech Insights! Here's what caught our attention in the world of technology and innovation.

## 🚀 This Week's Highlights

**AI Breakthrough**: A new machine learning model has achieved unprecedented accuracy in natural language processing, opening doors for more sophisticated AI applications.

**Startup Spotlight**: Three promising startups secured major funding rounds this week, focusing on climate tech, healthcare AI, and blockchain infrastructure.

**Industry News**: Major tech companies announced new partnerships and product launches that could reshape the competitive landscape.

## 📊 Market Trends

The tech sector continues to show resilience with:
- 15% growth in AI investments
- Increased focus on sustainable technology
- Rising demand for cybersecurity solutions

## 🔮 What's Coming Next Week

Keep an eye on:
- The upcoming tech conference announcements
- New product launches from major players
- Regulatory developments in the AI space

## 💡 Quick Tip

Remember to diversify your tech portfolio and stay informed about emerging trends. The landscape changes rapidly, and staying ahead requires continuous learning.

Thanks for reading! Forward this to colleagues who might find it valuable.

Best regards,
The Tech Insights Team`
                        setContent(newsletterTemplate)
                        setActiveTab('content')
                        toast.success('📧 Newsletter template loaded!')
                        trackAnalytics('template_used', { type: 'newsletter' })
                      }}
                      className="px-3 py-1.5 bg-cyan-500/20 text-cyan-400 text-xs rounded-full border border-cyan-500/30 hover:bg-cyan-500/30 transition-colors"
                    >
                      📧 Newsletter Template
                    </button>
                    <button
                      onClick={() => {
                        const marketingTemplate = `# 5 Proven Strategies to Boost Your Marketing ROI

Are you struggling to maximize your marketing return on investment? You're not alone. Many businesses face the challenge of optimizing their marketing spend for better results.

## Strategy #1: Data-Driven Decision Making

Stop guessing and start measuring. Use analytics tools to track:
- Customer acquisition costs
- Lifetime value metrics
- Conversion rates across channels
- Attribution modeling

## Strategy #2: Personalization at Scale

Modern consumers expect personalized experiences. Implement:
- Dynamic content based on user behavior
- Segmented email campaigns
- Personalized product recommendations
- Targeted social media advertising

## Strategy #3: Multi-Channel Integration

Create a seamless experience across all touchpoints:
- Consistent messaging across platforms
- Cross-channel retargeting campaigns
- Unified customer data management
- Coordinated content calendars

## Strategy #4: Marketing Automation

Streamline repetitive tasks and nurture leads effectively:
- Automated email sequences
- Lead scoring systems
- Social media scheduling
- Customer journey mapping

## Strategy #5: Continuous Testing and Optimization

Never stop improving your marketing efforts:
- A/B test everything (subject lines, CTAs, landing pages)
- Monitor performance metrics regularly
- Iterate based on data insights
- Stay updated with industry trends

## The Bottom Line

Implementing these strategies requires commitment and resources, but the payoff is substantial. Companies that follow data-driven, personalized, and integrated approaches see 2-3x better ROI than those using traditional methods.

Start with one strategy, master it, then expand to others. Your bottom line will thank you.`
                        setContent(marketingTemplate)
                        setActiveTab('content')
                        toast.success('🎯 Marketing template loaded!')
                        trackAnalytics('template_used', { type: 'marketing' })
                      }}
                      className="px-3 py-1.5 bg-blue-500/20 text-blue-500 dark:text-blue-400 text-xs rounded-full border border-blue-500/30 hover:bg-blue-500/30 transition-colors"
                    >
                      🎯 Marketing Template
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {contentSuggestions.map((sample, index) => (
                    <button
                      key={index}
                      onClick={() => useSampleContent(sample)}
                      className="text-left p-4 bg-gray-300 dark:bg-gray-600/50 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600/70 transition-all duration-300 border border-gray-400 dark:border-gray-500/50 hover:border-blue-500/50 hover:shadow-lg transform hover:scale-105 group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-blue-500 dark:text-blue-400 text-sm font-medium">{sample.title}</div>
                        <svg className="w-4 h-4 text-gray-500 dark:text-gray-400 group-hover:text-blue-500 dark:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                      <div className="text-gray-700 dark:text-gray-300 text-xs leading-relaxed">{sample.content.substring(0, 80)}...</div>
                      <div className="mt-2 text-xs text-gray-600 dark:text-gray-500 flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Perfect for your {sample.type} content
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Enhanced Tab Navigation - Mobile Optimized */}
            <div className="flex mb-4 sm:mb-6 bg-gray-200 dark:bg-gray-800/50 rounded-xl p-1 relative">
              {!isAuthenticated && (
                <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-xl z-10 flex items-center justify-center">
                  <div className="text-center p-4">
                    <Lock className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500 mx-auto mb-2" />
                    <p className="text-gray-900 dark:text-white font-semibold mb-1 text-sm sm:text-base">Sign Up to Start Creating</p>
                    <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm">Join 2,847+ creators transforming their content</p>
                    <button
                      onClick={() => {
                        setShowAuthModal(true)
                        setAuthModalMode('register')
                      }}
                      className="mt-2 sm:mt-3 px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-green-500 to-blue-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-blue-700 transition-all text-xs sm:text-sm"
                    >
                      Get Started Free
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={() => setActiveTab('content')}
                className={`flex-1 flex items-center justify-center px-3 py-2.5 sm:px-6 sm:py-3 font-medium transition-all duration-300 rounded-lg text-sm sm:text-base ${activeTab === 'content'
                  ? 'text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-700 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
                  }`}
              >
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Paste Your Content</span>
                <span className="sm:hidden">Content</span>
                {activeTab === 'content' && (
                  <span className="ml-1 sm:ml-2 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full animate-pulse"></span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('url')}
                disabled={!isAuthenticated}
                className={`flex-1 flex items-center justify-center px-3 py-2.5 sm:px-6 sm:py-3 font-medium transition-all duration-300 rounded-lg text-sm sm:text-base ${activeTab === 'url'
                  ? 'text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-700 shadow-sm'
                  : !isAuthenticated
                    ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-60'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
                  }`}
              >
                <LinkIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">From Your URL</span>
                <span className="sm:hidden">URL</span>
                {!isAuthenticated && <Crown className="ml-1 w-3 h-3 text-yellow-500" />}
                {activeTab === 'url' && isAuthenticated && (
                  <span className="ml-1 sm:ml-2 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full animate-pulse"></span>
                )}
              </button>
            </div>

            {activeTab === 'content' ? (
              <div className="space-y-4 relative">
                {!isAuthenticated && (
                  <div className="absolute inset-0 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm rounded-xl z-20 flex items-center justify-center">
                    <div className="text-center bg-white/90 dark:bg-gray-800/90 rounded-xl p-8 border border-gray-200 dark:border-gray-700 max-w-md">
                      <Crown className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Ready to Transform Your Content?</h3>
                      <p className="text-gray-600 dark:text-gray-300 mb-4">
                        10x your social media presence
                      </p>
                      <div className="space-y-3">
                        <button
                          onClick={() => {
                            setShowAuthModal(true)
                            setAuthModalMode('register')
                          }}
                          className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white font-bold rounded-lg transition-all duration-300"
                        >
                          Start Free - No Credit Card
                        </button>
                        <button
                          onClick={() => {
                            setShowAuthModal(true)
                            setAuthModalMode('login')
                          }}
                          className="w-full px-6 py-2 border border-gray-400 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all"
                        >
                          Already have an account?
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                        ✨ Free forever • ⚡ No setup required • 🚀 Results in 30 seconds
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="hidden sm:inline">Paste your content here (blog post, article, newsletter, etc.)</span>
                    <span className="sm:hidden">Paste your content</span>
                  </label>
                  <div className="flex items-center gap-1 sm:gap-2 text-xs text-gray-600 dark:text-gray-500">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    <span className="hidden sm:inline">We're Secure & Private</span>
                    <span className="sm:hidden">Secure</span>
                  </div>
                </div>
                <div className="relative">
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Paste your blog post, article, newsletter, or any long-form content here...

💡 Pro tip: The more detailed your content, the better we can optimize it for each platform!"
                    className="w-full h-32 sm:h-40 lg:h-48 p-3 sm:p-4 bg-gray-100 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-300 hover:border-gray-400 dark:hover:border-gray-500 text-sm sm:text-base"
                    maxLength={featureGate.maxContentLength === Infinity ? 50000 : featureGate.maxContentLength}
                  />
                  {content && (
                    <button
                      onClick={() => setContent('')}
                      className="absolute top-2 sm:top-3 right-2 sm:right-3 p-1.5 sm:p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors bg-white dark:bg-gray-800 rounded-full shadow-sm"
                      title="Clear content"
                    >
                      <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-xs">
                  <div className="flex items-center gap-2 sm:gap-4 text-gray-600 dark:text-gray-500">
                    <span className="flex items-center">
                      <svg className="w-3 h-3 mr-1 text-blue-500 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="hidden sm:inline">Markdown</span>
                      <span className="sm:hidden">MD</span>
                    </span>
                    <span className="flex items-center">
                      <svg className="w-3 h-3 mr-1 text-blue-500 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      HTML
                    </span>
                    <span className="flex items-center">
                      <svg className="w-3 h-3 mr-1 text-blue-500 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="hidden sm:inline">Plain text</span>
                      <span className="sm:hidden">Text</span>
                    </span>
                  </div>
                  <span className={`font-medium text-xs sm:text-sm ${content.length > (featureGate.maxContentLength * 0.8) ? 'text-blue-500 dark:text-blue-400' :
                    content.length > (featureGate.maxContentLength * 0.95) ? 'text-cyan-400' :
                      'text-gray-600 dark:text-gray-500'
                    }`}>
                    {content.length.toLocaleString()}/{featureGate.maxContentLength === Infinity ? '50K' : featureGate.maxContentLength.toLocaleString()} chars
                  </span>
                </div>
                {/* Character limit warning */}
                {content.length > (featureGate.maxContentLength * 0.8) && (
                  <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${content.length > (featureGate.maxContentLength * 0.95)
                    ? 'bg-blue-900/20 border border-blue-500/30 text-blue-300'
                    : 'bg-cyan-900/20 border border-cyan-500/30 text-cyan-300'
                    }`}>
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <div>
                      {content.length > (featureGate.maxContentLength * 0.95) ? (
                        <>
                          <strong>Character limit almost reached!</strong> Your content will be truncated to {featureGate.maxContentLength.toLocaleString()} characters.
                          {!featureGate.isPro && (
                            <span className="block mt-1">
                              <button
                                onClick={() => setShowPaymentModal(true)}
                                className="text-blue-500 dark:text-blue-400 hover:text-blue-300 underline"
                              >
                                Upgrade to Pro
                              </button> for 50,000 character limit.
                            </span>
                          )}
                        </>
                      ) : (
                        <>
                          <strong>Approaching character limit.</strong> You have {(featureGate.maxContentLength - content.length).toLocaleString()} characters remaining.
                          {!featureGate.isPro && (
                            <span className="block mt-1">
                              <button
                                onClick={() => setShowPaymentModal(true)}
                                className="text-blue-500 dark:text-blue-400 hover:text-blue-300 underline"
                              >
                                Upgrade to Pro
                              </button> for 50,000 character limit.
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                    <svg className="w-4 h-4 mr-2 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    Enter your URL (Blog, Medium, Substack, etc.)
                  </label>
                  <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-500">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
                    </svg>
                    We'll Auto-Extract
                  </div>
                </div>
                <FeatureGate feature="url_processing">
                  <div className="relative">
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://yourblog.com/your-article"
                      className="w-full p-4 bg-gray-100 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-300 hover:border-gray-400 dark:hover:border-gray-500"
                    />
                    {url && (
                      <button
                        onClick={() => setUrl('')}
                        className="absolute top-1/2 right-3 transform -translate-y-1/2 p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
                        title="Clear URL"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </FeatureGate>
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                  <p className="text-xs text-blue-600 dark:text-blue-300 flex items-center">
                    <svg className="w-4 h-4 mr-2 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    We'll automatically extract and optimize content from your URL. Supports most blog platforms, Medium, Substack, and more.
                  </p>
                </div>
              </div>
            )}

            {/* Enhanced Progress Indicator */}
            {isLoading && (
              <div className="mt-6 p-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center mr-3">
                      <Loader2 className="w-5 h-5 text-blue-500 dark:text-blue-400 animate-spin" />
                    </div>
                    <span className="text-gray-900 dark:text-white font-semibold">We're repurposing your content...</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-blue-500 dark:text-blue-400 text-sm font-medium mr-2">{Math.round(transformProgress || 0)}%</span>
                    <div className="w-16 h-2 bg-gray-300 dark:bg-gray-600 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500 ease-out"
                        style={{ width: `${Math.max(0, Math.min(100, transformProgress || 0))}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                <div className="w-full bg-gray-300 dark:bg-gray-600 rounded-full h-3 mb-4 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500 ease-out relative"
                    style={{ width: `${Math.max(0, Math.min(100, transformProgress || 0))}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                  </div>
                </div>
                <div className="text-gray-600 dark:text-gray-300 text-sm flex items-center justify-center">
                  <svg className="w-4 h-4 mr-2 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  {currentProcessingStep}
                </div>
                <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 text-center">
                  AI optimizing for maximum engagement
                </div>
              </div>
            )}

            {/* Enhanced Action Section */}
            <div className="flex flex-col sm:flex-row items-center justify-between mt-8 gap-6">
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 bg-gray-200 dark:bg-gray-800/30 rounded-lg px-4 py-2 border border-gray-300 dark:border-gray-700">
                <svg className="w-4 h-4 text-blue-500 dark:text-blue-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                <span>Secure processing, never stored</span>
              </div>

              {/* Usage Counter for Free Users */}
              <UsageCounter className="mb-4" stats={usageStats} />

              <button
                onClick={handleSubmit}
                disabled={
                  isLoading ||
                  (!content.trim() && !url.trim()) ||
                  (!isAuthenticated) ||
                  (isAuthenticated && !user?.is_premium && (
                    (usageStats
                      ? (usageStats.remaining_requests ?? usageStats.remaining_generations ?? (usageStats.rate_limit - usageStats.recent_generations)) === 0
                      : featureGate.remainingGenerations === 0)
                  ))
                }
                className="group px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold rounded-xl transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed min-w-[280px]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    <span className="animate-pulse">We're Repurposing Your Content...</span>
                  </>
                ) : !isAuthenticated ? (
                  <>
                    <LogIn className="w-5 h-5 mr-2" />
                    Sign In to Repurpose Content
                    <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </>
                ) : isAuthenticated && !user?.is_premium && (usageStats ? (usageStats.remaining_requests ?? usageStats.remaining_generations ?? (usageStats.rate_limit - usageStats.recent_generations)) === 0 : featureGate.remainingGenerations === 0) ? (
                  <>
                    <Clock className="w-5 h-5 mr-2" />
                    Your Limit Reached - Upgrade to Continue
                    <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2 group-hover:animate-pulse" />
                    <span>
                      {isAuthenticated
                        ? (user?.is_premium
                          ? 'Repurpose Your Content (Unlimited)'
                          : `Repurpose Your Content (${usageStats ? (usageStats.remaining_requests ?? usageStats.remaining_generations ?? (usageStats.rate_limit - usageStats.recent_generations)) : (featureGate.loading ? '...' : featureGate.remainingGenerations)} left)`
                        )
                        : 'Sign In to Repurpose Content'
                      }
                    </span>
                    <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Enhanced Results Section */}
          {results && (
            <div className="space-y-8 animate-fade-in">
              {/* Enhanced Success Message with Engagement */}
              <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-xl p-6 text-center animate-slide-up">
                <div className="flex items-center justify-center mb-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center mr-3 animate-bounce">
                    <svg className="w-6 h-6 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="text-2xl font-bold text-blue-500 dark:text-blue-400">Your Content Successfully Repurposed!</span>
                </div>
                <p className="text-blue-600 dark:text-blue-300 mb-4">
                  Content optimized for all platforms. Ready to boost engagement!
                </p>

                {/* Save Feature Notice for Non-Authenticated Users */}
                {!isAuthenticated && (
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-4 animate-fade-in-delay">
                    <div className="flex items-center justify-center mb-2">
                      <svg className="w-5 h-5 text-blue-500 dark:text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                      <span className="text-blue-500 dark:text-blue-400 font-semibold">💡 Pro Tip: Save Your Amazing Content!</span>
                    </div>
                    <p className="text-blue-600 dark:text-blue-300 text-sm mb-3">
                      Join us to save your generated content and access it anytime from your personal dashboard
                    </p>
                    <button
                      onClick={() => {
                        setShowAuthModal(true)
                        setAuthModalMode('register')
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105"
                    >
                      Join Us to Save Your Content
                    </button>
                  </div>
                )}

                {/* Enhanced Features for Authenticated Users */}
                {isAuthenticated && (
                  <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/30 rounded-lg p-4 mb-4 animate-fade-in-delay">
                    <div className="text-center mb-3">
                      <div className="flex items-center justify-center mb-2">
                        <svg className="w-5 h-5 text-blue-500 dark:text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                        <span className="text-blue-500 dark:text-blue-400 font-semibold">
                          {user?.is_premium && autoSaveEnabled ? '✨ Auto-saved to your dashboard!' : '💾 Ready to save your content?'}
                        </span>
                      </div>
                      <button
                        onClick={() => setShowDashboard(true)}
                        className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-500 dark:text-blue-400 rounded-lg text-sm font-medium transition-all duration-200"
                      >
                        View Dashboard
                      </button>
                    </div>
                    <div className="flex flex-wrap justify-center gap-4 text-xs">
                      <div className="flex items-center text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-800/30 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700/50">
                        <svg className="w-3 h-3 mr-2 text-blue-500 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Content History
                      </div>
                      <div className="flex items-center text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-800/30 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700/50">
                        <svg className="w-3 h-3 mr-2 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Export Options
                      </div>
                      <div className="flex items-center text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-800/30 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700/50">
                        <svg className="w-3 h-3 mr-2 text-blue-500 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Analytics
                      </div>
                      <div className="flex items-center text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-800/30 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700/50">
                        <svg className="w-3 h-3 mr-2 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {user?.is_premium && autoSaveEnabled ? 'Auto-Save' : 'Manual Save'}
                      </div>
                    </div>
                  </div>
                )}

                {/* Enhanced Engagement CTAs */}
                <div className="flex flex-wrap justify-center gap-3 text-sm">
                  <div className="bg-gray-200 dark:bg-gray-800/50 rounded-lg px-4 py-2.5 border border-gray-300 dark:border-gray-600 hover:border-blue-500/50 transition-all duration-300 transform hover:scale-105">
                    <span className="text-gray-700 dark:text-gray-300 flex items-center">
                      <svg className="w-4 h-4 mr-2 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      💡 Pro Tip: Post at optimal times for maximum reach and engagement
                    </span>
                  </div>
                  <div className="bg-gray-200 dark:bg-gray-800/50 rounded-lg px-4 py-2.5 border border-gray-300 dark:border-gray-600 hover:border-purple-500/50 transition-all duration-300 transform hover:scale-105">
                    <span className="text-gray-700 dark:text-gray-300 flex items-center">
                      <svg className="w-4 h-4 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Each platform optimized specifically for your audience
                    </span>
                  </div>
                  {isAuthenticated && (
                    <div className="bg-gray-800/50 rounded-lg px-4 py-2.5 border border-gray-600 hover:border-green-500/50 transition-all duration-300 transform hover:scale-105">
                      <span className="text-gray-300 flex items-center">
                        <svg className="w-4 h-4 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                        💾 Use save buttons below to keep your favorites for later
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Enhanced Platform Results */}
              <div className="grid gap-8 lg:grid-cols-1 xl:grid-cols-1">
                {/* X Thread */}
                <div className="transform hover:scale-[1.02] transition-all duration-300 animate-slide-up-delay-1">
                  <div className="mb-4 text-center">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 flex items-center justify-center group">
                      <div className="w-8 h-8 bg-gray-800 dark:bg-gray-800 rounded-full flex items-center justify-center mr-3 group-hover:bg-gray-700 dark:group-hover:bg-gray-700 transition-colors">
                        <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                      </div>
                      X Thread ({results.twitter_thread.length} Posts)
                      {isAuthenticated && (
                        <span className="ml-2 px-2 py-1 bg-blue-500/20 text-blue-500 dark:text-blue-400 text-xs rounded-full border border-blue-500/30 animate-pulse">
                          💾 Save This
                        </span>
                      )}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">Optimized for engagement</p>
                    {/* Export Options for Authenticated Users */}
                    {isAuthenticated && (
                      <div className="flex justify-center gap-2 mt-2">
                        <button
                          onClick={() => {
                            const content = results.twitter_thread.join('\n\n')
                            navigator.clipboard.writeText(content)
                            toast.success('X Thread copied to clipboard!')
                          }}
                          className="px-3 py-1 bg-blue-500/20 text-blue-500 dark:text-blue-400 text-xs rounded-full border border-blue-500/30 hover:bg-blue-500/30 transition-colors"
                        >
                          📋 Copy All
                        </button>
                        <button
                          onClick={() => {
                            if (!user?.is_premium) {
                              toast.error('🔒 Export is a Pro feature!')
                              setShowPaymentModal(true)
                              return
                            }
                            const content = results.twitter_thread.join('\n\n')
                            const blob = new Blob([content], { type: 'text/plain' })
                            const url = URL.createObjectURL(blob)
                            const a = document.createElement('a')
                            a.href = url
                            a.download = 'x-thread.txt'
                            a.click()
                            URL.revokeObjectURL(url)
                            toast.success('X Thread exported!')
                          }}
                          className={`px-3 py-1 text-xs rounded-full border transition-colors flex items-center ${user?.is_premium
                            ? 'bg-cyan-500/30 text-white border-cyan-400 hover:bg-cyan-500/40'
                            : 'bg-gray-700/50 text-white border-gray-400 hover:bg-gray-700/70'
                            }`}
                        >
                          📥 Export {!user?.is_premium && <Crown className="w-3 h-3 ml-1 text-yellow-500 dark:text-yellow-400" />}
                        </button>
                      </div>
                    )}
                  </div>
                  <XDisplay
                    tweets={results.twitter_thread}
                    onCopy={copyToClipboard}
                    copiedStates={copiedStates}
                    onSave={featureGate.canSaveContent ? () => handleSaveContent('Twitter Thread', 'twitter', JSON.stringify(results.twitter_thread)) : undefined}
                  />
                </div>

                {/* LinkedIn Post */}
                <div className="transform hover:scale-[1.02] transition-all duration-300 animate-slide-up-delay-2">
                  <div className="mb-4 text-center">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 flex items-center justify-center group">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mr-3 group-hover:bg-blue-500 transition-colors">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                        </svg>
                      </div>
                      LinkedIn Professional Post
                      {isAuthenticated && (
                        <span className="ml-2 px-2 py-1 bg-blue-500/20 text-blue-500 dark:text-blue-400 text-xs rounded-full border border-blue-500/30 animate-pulse">
                          💾 Save This
                        </span>
                      )}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">Professional networking format</p>
                    {/* Export Options for Authenticated Users */}
                    {isAuthenticated && (
                      <div className="flex justify-center gap-2 mt-2">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(results.linkedin_post)
                            toast.success('LinkedIn post copied to clipboard!')
                          }}
                          className="px-3 py-1 bg-blue-500/20 text-blue-500 dark:text-blue-400 text-xs rounded-full border border-blue-500/30 hover:bg-blue-500/30 transition-colors"
                        >
                          📋 Copy
                        </button>
                        <button
                          onClick={() => {
                            if (!user?.is_premium) {
                              toast.error('🔒 Export is a Pro feature!')
                              setShowPaymentModal(true)
                              return
                            }
                            const blob = new Blob([results.linkedin_post], { type: 'text/plain' })
                            const url = URL.createObjectURL(blob)
                            const a = document.createElement('a')
                            a.href = url
                            a.download = 'linkedin-post.txt'
                            a.click()
                            URL.revokeObjectURL(url)
                            toast.success('LinkedIn post exported!')
                          }}
                          className={`px-3 py-1 text-xs rounded-full border transition-colors flex items-center ${user?.is_premium
                            ? 'bg-cyan-500/30 text-white border-cyan-400 hover:bg-cyan-500/40'
                            : 'bg-gray-700/50 text-white border-gray-400 hover:bg-gray-700/70'
                            }`}
                        >
                          📥 Export {!user?.is_premium && <Crown className="w-3 h-3 ml-1 text-yellow-500 dark:text-yellow-400" />}
                        </button>
                      </div>
                    )}
                  </div>
                  <LinkedInDisplay
                    post={results.linkedin_post}
                    onCopy={copyToClipboard}
                    copied={copiedStates.linkedin || false}
                    onSave={featureGate.canSaveContent ? () => handleSaveContent('LinkedIn Post', 'linkedin', results.linkedin_post) : undefined}
                  />
                </div>

                {/* Instagram Carousel */}
                <div className="transform hover:scale-[1.02] transition-all duration-300 animate-slide-up-delay-3">
                  <div className="mb-4 text-center">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 flex items-center justify-center group">
                      <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center mr-3 group-hover:from-pink-400 group-hover:to-purple-500 transition-all">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                        </svg>
                      </div>
                      Instagram Carousel ({results.instagram_carousel.length} Slides)
                      {isAuthenticated && (
                        <span className="ml-2 px-2 py-1 bg-blue-500/20 text-blue-500 dark:text-blue-400 text-xs rounded-full border border-blue-500/30 animate-pulse">
                          💾 Save This
                        </span>
                      )}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">Visual storytelling format</p>
                    {/* Export Options for Authenticated Users */}
                    {isAuthenticated && (
                      <div className="flex justify-center gap-2 mt-2">
                        <button
                          onClick={() => {
                            const content = results.instagram_carousel.map((slide, i) => `Slide ${i + 1}:\n${slide}`).join('\n\n')
                            navigator.clipboard.writeText(content)
                            toast.success('Instagram carousel copied to clipboard!')
                          }}
                          className="px-3 py-1 bg-blue-500/20 text-blue-500 dark:text-blue-400 text-xs rounded-full border border-blue-500/30 hover:bg-blue-500/30 transition-colors"
                        >
                          📋 Copy All
                        </button>
                        <button
                          onClick={() => {
                            if (!user?.is_premium) {
                              toast.error('🔒 Export is a Pro feature!')
                              setShowPaymentModal(true)
                              return
                            }
                            const content = results.instagram_carousel.map((slide, i) => `Slide ${i + 1}:\n${slide}`).join('\n\n')
                            const blob = new Blob([content], { type: 'text/plain' })
                            const url = URL.createObjectURL(blob)
                            const a = document.createElement('a')
                            a.href = url
                            a.download = 'instagram-carousel.txt'
                            a.click()
                            URL.revokeObjectURL(url)
                            toast.success('Instagram carousel exported!')
                          }}
                          className={`px-3 py-1 text-xs rounded-full border transition-colors flex items-center ${user?.is_premium
                            ? 'bg-cyan-500/30 text-white border-cyan-400 hover:bg-cyan-500/40'
                            : 'bg-gray-700/50 text-white border-gray-400 hover:bg-gray-700/70'
                            }`}
                        >
                          📥 Export {!user?.is_premium && <Crown className="w-3 h-3 ml-1 text-yellow-500 dark:text-yellow-400" />}
                        </button>
                      </div>
                    )}
                  </div>
                  <InstagramCarousel
                    slides={results.instagram_carousel}
                    onCopy={copyToClipboard}
                    copiedStates={copiedStates}
                    onSave={featureGate.canSaveContent ? () => handleSaveContent('Instagram Carousel', 'instagram', JSON.stringify(results.instagram_carousel)) : undefined}
                  />
                </div>
              </div>

              {/* Enhanced Call to Action Section */}
              <div className="relative overflow-hidden bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-pink-600/10 border border-blue-500/20 rounded-3xl p-8 text-center backdrop-blur-sm">
                {/* Animated background elements */}
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute top-4 left-4 w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  <div className="absolute top-8 right-8 w-1 h-1 bg-cyan-400 rounded-full animate-ping"></div>
                  <div className="absolute bottom-6 left-8 w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
                  <div className="absolute bottom-4 right-4 w-2 h-2 bg-blue-300 rounded-full animate-ping"></div>
                </div>

                <div className="relative z-10">
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-3 animate-bounce">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                    <h3 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                      Love Your Results? Share the Magic!
                    </h3>
                    <span className="text-2xl ml-2 animate-pulse">✨</span>
                  </div>

                  <p className="text-gray-600 dark:text-gray-300 mb-8 text-lg leading-relaxed max-w-2xl mx-auto">
                    Share <span className="text-blue-600 dark:text-blue-500 dark:text-blue-400 font-semibold">AI content magic</span> with other creators
                  </p>

                  <div className="flex flex-wrap justify-center gap-4">
                    <button
                      onClick={() => shareOnX("Reword transforms long-form content into viral social media posts for X, LinkedIn, and Instagram with AI-powered optimization. Try it free!")}
                      className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-2xl transition-all duration-300 flex items-center transform hover:scale-105 hover:shadow-xl shadow-blue-500/25"
                    >
                      <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mr-3 group-hover:bg-white/30 transition-colors">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                      </div>
                      <span className="font-semibold">Share Your Success</span>
                    </button>

                    <button
                      onClick={() => shareOnLinkedIn("Reword is an AI-powered platform that transforms your long-form content into viral social media posts optimized for X, LinkedIn, and Instagram. Perfect for content creators, marketers, and businesses looking to maximize their social media reach.")}
                      className="group px-8 py-4 bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white rounded-2xl transition-all duration-300 flex items-center transform hover:scale-105 hover:shadow-xl shadow-blue-600/25"
                    >
                      <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mr-3 group-hover:bg-white/30 transition-colors">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                        </svg>
                      </div>
                      <span className="font-semibold">Tell Your Network</span>
                    </button>

                    <button
                      onClick={copyLink}
                      className="group px-8 py-4 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white rounded-2xl transition-all duration-300 flex items-center transform hover:scale-105 hover:shadow-xl shadow-gray-500/25"
                    >
                      <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mr-3 group-hover:bg-white/30 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                        </svg>
                      </div>
                      <span className="font-semibold">Copy Link</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Enhanced Newsletter Subscription Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-900/90 via-blue-900/20 to-purple-900/20 backdrop-blur-sm border border-gray-700/50 rounded-3xl p-10 text-center hover:border-blue-500/30 transition-all duration-500 shadow-2xl">
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20"></div>
          <div className="absolute top-4 left-4 w-32 h-32 bg-blue-500/10 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute bottom-4 right-4 w-24 h-24 bg-cyan-500/10 rounded-full blur-xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-blue-500/5 rounded-full blur-2xl animate-pulse delay-500"></div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mr-4 animate-pulse shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-400 rounded-full animate-ping"></div>
            </div>
            <div className="text-left">
              <h3 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent tracking-wide">
                Weekly Creator Tips ✨
              </h3>
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg leading-relaxed">
            Join <span className="text-blue-500 dark:text-blue-400 font-medium">5,000+ creators</span> getting AI strategies & growth hacks.
          </p>

          {/* Enhanced Email Subscription Form */}
          <form onSubmit={handleNewsletterSubscribe} className="max-w-md mx-auto mb-8 px-4">
            <div className="flex flex-col sm:flex-row bg-gray-200 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-600 rounded-2xl sm:rounded-full p-2 hover:border-blue-500/50 transition-all duration-300 shadow-lg gap-2 sm:gap-0">
              <div className="flex items-center flex-1">
                <div className="flex items-center pl-4">
                  <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 px-4 py-3 focus:outline-none text-sm min-w-0"
                  disabled={isSubscribing}
                />
              </div>
              <button
                type="submit"
                disabled={isSubscribing}
                className="px-4 sm:px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-xl sm:rounded-full font-semibold transition-all duration-300 flex items-center justify-center transform hover:scale-105 disabled:transform-none shadow-lg text-sm whitespace-nowrap"
              >
                {isSubscribing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="hidden sm:inline">Subscribing...</span>
                    <span className="sm:hidden">...</span>
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline">Subscribe</span>
                    <span className="sm:hidden">Join</span>
                    <svg className="w-4 h-4 ml-1 sm:ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
              ✨ No spam, unsubscribe anytime
            </p>
          </form>

          {/* Enhanced Social Media Links */}
          <div className="mb-6">
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">Follow for daily tips:</p>
            <div className="flex justify-center space-x-4">
              <a
                href="https://discord.com/invite/ZZx3cBrx2"
                target="_blank"
                rel="noopener noreferrer"
                className="group w-12 h-12 bg-gray-200 dark:bg-gray-800/50 hover:bg-indigo-600/20 border border-gray-300 dark:border-gray-600 hover:border-indigo-500/50 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110"
                title="Join Discord"
              >
                <svg className="w-6 h-6 text-gray-600 dark:text-gray-400 group-hover:text-indigo-400 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
              </a>

              <a
                href="https://linktr.ee/entrext.in"
                target="_blank"
                rel="noopener noreferrer"
                className="group w-12 h-12 bg-gray-200 dark:bg-gray-800/50 hover:bg-blue-600/20 border border-gray-300 dark:border-gray-600 hover:border-blue-500/50 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110"
                title="All Links"
              >
                <svg className="w-6 h-6 text-gray-600 dark:text-gray-400 group-hover:text-green-400 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M7.953 15.011H4.681V9.047h3.272v5.964zm6.318 0h-3.272V9.047h3.272v5.964zM12 7.15a1.897 1.897 0 1 1-3.794 0 1.897 1.897 0 0 1 3.794 0zM24 12c0 6.627-5.373 12-12 12S0 18.627 0 12 5.373 0 12 0s12 5.373 12 12zM9.271 5.393a1.897 1.897 0 1 0 0 3.794 1.897 1.897 0 0 0 0-3.794zm5.458 0a1.897 1.897 0 1 0 0 3.794 1.897 1.897 0 0 0 0-3.794zM12 13.806a1.897 1.897 0 1 0 0 3.794 1.897 1.897 0 0 0 0-3.794z" />
                </svg>
              </a>

              <a
                href="https://www.linkedin.com/company/entrext/posts/?feedView=all"
                target="_blank"
                rel="noopener noreferrer"
                className="group w-12 h-12 bg-gray-200 dark:bg-gray-800/50 hover:bg-blue-600/20 border border-gray-300 dark:border-gray-600 hover:border-blue-500/50 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110"
                title="Follow LinkedIn"
              >
                <svg className="w-6 h-6 text-gray-600 dark:text-gray-400 group-hover:text-blue-500 dark:text-blue-400 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>

              <a
                href="https://www.instagram.com/entrext.labs/"
                target="_blank"
                rel="noopener noreferrer"
                className="group w-12 h-12 bg-gray-200 dark:bg-gray-800/50 hover:bg-pink-600/20 border border-gray-300 dark:border-gray-600 hover:border-pink-500/50 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110"
                title="Follow Instagram"
              >
                <svg className="w-6 h-6 text-gray-600 dark:text-gray-400 group-hover:text-pink-400 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>

              <a
                href="https://substack.com/@entrextlabs"
                target="_blank"
                rel="noopener noreferrer"
                className="group w-12 h-12 bg-gray-200 dark:bg-gray-800/50 hover:bg-orange-600/20 border border-gray-300 dark:border-gray-600 hover:border-orange-500/50 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110"
                title="Read Newsletter"
              >
                <svg className="w-6 h-6 text-gray-600 dark:text-gray-400 group-hover:text-orange-400 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22.539 8.242H1.46V5.406h21.08v2.836zM1.46 10.812V24L12 18.11 22.54 24V10.812H1.46zM22.54 0H1.46v2.836h21.08V0z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Community Stats */}
          <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500 dark:text-blue-400">5K+</div>
              <div className="text-xs text-gray-500">Creators</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">50K+</div>
              <div className="text-xs text-gray-500">Posts Generated</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">99.9%</div>
              <div className="text-xs text-gray-500">Uptime</div>
            </div>
          </div>
        </div>
      </div>

    </div>
  )

  const renderFeaturesTab = () => (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
          {isAuthenticated ? 'Your Content Toolkit' : 'Transform Content with AI'}
        </h2>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto mb-8">
          {isAuthenticated
            ? `${user?.is_premium ? 'You have access to our complete suite of AI-powered content tools' : 'See what you can unlock with Pro to enhance your content creation'}`
            : 'AI-powered platform that transforms your long-form content into engaging social media posts for X/Twitter, LinkedIn, and Instagram.'
          }
        </p>

        {/* User Status Indicator */}
        {isAuthenticated && (
          <div className="mt-6 flex justify-center">
            <div className={`px-8 py-4 rounded-full border ${user?.is_premium
              ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/30 text-yellow-500 dark:text-yellow-400'
              : 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-500/30 text-blue-500 dark:text-blue-400'
              }`}>
              <div className="flex items-center gap-3">
                {user?.is_premium ? (
                  <>
                    <Crown className="w-6 h-6" />
                    <div>
                      <span className="font-bold text-lg">Pro User</span>
                      <div className="text-sm opacity-80">All features unlocked</div>
                    </div>
                  </>
                ) : (
                  <>
                    <User className="w-6 h-6" />
                    <div>
                      <span className="font-bold text-lg">Free User</span>
                      <div className="text-sm opacity-80">2 generations/day • Upgrade for unlimited</div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Features Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* AI Content Transformation */}
        <div className={`group bg-gradient-to-br from-blue-500/10 to-purple-500/10 backdrop-blur-sm border border-blue-500/30 rounded-2xl p-8 hover:border-blue-400/50 transition-all duration-300 hover:scale-105 ${!isAuthenticated || user?.is_premium ? '' : 'relative overflow-hidden'
          }`}>
          {!isAuthenticated && (
            <div className="absolute top-4 right-4 bg-green-500/20 text-green-400 text-xs px-3 py-1 rounded-full border border-green-500/30 font-semibold">
              FREE INCLUDED
            </div>
          )}
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">AI Content Transformation</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
            Transform your long-form content into platform-optimized social media posts that maintain your voice and style.
          </p>
          <div className="space-y-3">
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
              <CheckCircle className="w-4 h-4 text-green-400 mr-3 flex-shrink-0" />
              <span>Platform-specific formatting</span>
            </div>
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
              <CheckCircle className="w-4 h-4 text-green-400 mr-3 flex-shrink-0" />
              <span>Maintains your writing style</span>
            </div>
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
              <CheckCircle className="w-4 h-4 text-green-400 mr-3 flex-shrink-0" />
              <span>Instant content generation</span>
            </div>
          </div>
          {isAuthenticated && !user?.is_premium && (
            <div className="mt-6 text-sm text-yellow-500 dark:text-yellow-400 bg-yellow-500/10 rounded-lg p-4 border border-yellow-500/20">
              <strong>Free Plan:</strong> 2 transformations per day
              <br />
              <span className="text-xs opacity-80">Upgrade for unlimited access</span>
            </div>
          )}
        </div>

        {/* Multi-Platform Publishing */}
        <div className="group bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm border border-purple-500/30 rounded-2xl p-8 hover:border-purple-400/50 transition-all duration-300 hover:scale-105">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <TrendingUp className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Multi-Platform Support</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
            Generate content optimized for X/Twitter threads, LinkedIn posts, and Instagram carousels from a single input.
          </p>
          <div className="space-y-3">
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
              <Twitter className="w-4 h-4 text-blue-500 dark:text-blue-400 mr-3 flex-shrink-0" />
              <span>X/Twitter thread format</span>
            </div>
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
              <Linkedin className="w-4 h-4 text-blue-500 dark:text-blue-400 mr-3 flex-shrink-0" />
              <span>LinkedIn professional posts</span>
            </div>
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
              <Instagram className="w-4 h-4 text-blue-500 dark:text-blue-400 mr-3 flex-shrink-0" />
              <span>Instagram carousel slides</span>
            </div>
          </div>
          {isAuthenticated && user?.is_premium && (
            <div className="mt-6 text-sm text-green-400 bg-green-500/10 rounded-lg p-4 border border-green-500/20">
              <Crown className="w-4 h-4 inline mr-2" />
              <strong>Pro:</strong> Unlimited across all platforms
            </div>
          )}
        </div>

        {/* URL Processing */}
        <div className={`group bg-gradient-to-br from-cyan-500/10 to-blue-500/10 backdrop-blur-sm border border-cyan-500/30 rounded-2xl p-8 hover:border-cyan-400/50 transition-all duration-300 hover:scale-105 ${isAuthenticated && !user?.is_premium ? 'opacity-75 relative' : ''
          }`}>
          {!isAuthenticated && (
            <div className="absolute top-4 right-4 bg-yellow-500/20 text-yellow-500 dark:text-yellow-400 text-xs px-3 py-1 rounded-full border border-yellow-500/30 font-semibold">
              PRO FEATURE
            </div>
          )}
          <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <LinkIcon className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">URL Processing</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
            Paste any blog URL, article, or webpage link and automatically extract and transform the content.
          </p>
          <div className="space-y-3">
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
              <CheckCircle className="w-4 h-4 text-green-400 mr-3 flex-shrink-0" />
              <span>Automatic content extraction</span>
            </div>
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
              <CheckCircle className="w-4 h-4 text-green-400 mr-3 flex-shrink-0" />
              <span>Works with most websites</span>
            </div>
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
              <CheckCircle className="w-4 h-4 text-green-400 mr-3 flex-shrink-0" />
              <span>No manual copy-paste needed</span>
            </div>
          </div>
          {isAuthenticated && !user?.is_premium && (
            <div className="mt-6 text-sm text-red-500 dark:text-red-400 bg-red-500/10 rounded-lg p-4 border border-red-500/20">
              <Lock className="w-4 h-4 inline mr-2" />
              <strong>Upgrade to Pro</strong> to unlock URL processing
            </div>
          )}
        </div>

        {/* Content Library */}
        <div className={`group bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-sm border border-green-500/30 rounded-2xl p-8 hover:border-green-400/50 transition-all duration-300 hover:scale-105 ${isAuthenticated && !user?.is_premium ? 'opacity-75 relative' : ''
          }`}>
          {!isAuthenticated && (
            <div className="absolute top-4 right-4 bg-yellow-500/20 text-yellow-500 dark:text-yellow-400 text-xs px-3 py-1 rounded-full border border-yellow-500/30 font-semibold">
              PRO FEATURE
            </div>
          )}
          <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Star className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Content Library & Export</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
            Save your generated content, organize it in your personal library, and export in multiple formats.
          </p>
          <div className="space-y-3">
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
              <CheckCircle className="w-4 h-4 text-green-400 mr-3 flex-shrink-0" />
              <span>Unlimited content saves</span>
            </div>
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
              <CheckCircle className="w-4 h-4 text-green-400 mr-3 flex-shrink-0" />
              <span>Export to TXT, JSON, CSV</span>
            </div>
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
              <CheckCircle className="w-4 h-4 text-green-400 mr-3 flex-shrink-0" />
              <span>Search and organize content</span>
            </div>
          </div>
          {isAuthenticated && !user?.is_premium && (
            <div className="mt-6 text-sm text-red-500 dark:text-red-400 bg-red-500/10 rounded-lg p-4 border border-red-500/20">
              <Lock className="w-4 h-4 inline mr-2" />
              <strong>Upgrade to Pro</strong> for unlimited saves & exports
            </div>
          )}
        </div>

        {/* Custom Templates */}
        <div className={`group bg-gradient-to-br from-indigo-500/10 to-purple-500/10 backdrop-blur-sm border border-indigo-500/30 rounded-2xl p-8 hover:border-indigo-400/50 transition-all duration-300 hover:scale-105 ${isAuthenticated && !user?.is_premium ? 'opacity-75 relative' : ''
          }`}>
          {!isAuthenticated && (
            <div className="absolute top-4 right-4 bg-yellow-500/20 text-yellow-500 dark:text-yellow-400 text-xs px-3 py-1 rounded-full border border-yellow-500/30 font-semibold">
              PRO FEATURE
            </div>
          )}
          <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Custom Templates</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
            Create and save your own content templates, plus browse community templates shared by other users.
          </p>
          <div className="space-y-3">
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
              <CheckCircle className="w-4 h-4 text-green-400 mr-3 flex-shrink-0" />
              <span>Create custom templates</span>
            </div>
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
              <CheckCircle className="w-4 h-4 text-green-400 mr-3 flex-shrink-0" />
              <span>Browse community templates</span>
            </div>
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
              <CheckCircle className="w-4 h-4 text-green-400 mr-3 flex-shrink-0" />
              <span>Consistent content style</span>
            </div>
          </div>
          {isAuthenticated && !user?.is_premium && (
            <div className="mt-6 text-sm text-red-500 dark:text-red-400 bg-red-500/10 rounded-lg p-4 border border-red-500/20">
              <Lock className="w-4 h-4 inline mr-2" />
              <strong>Upgrade to Pro</strong> for custom templates
            </div>
          )}
        </div>

        {/* Privacy & Security */}
        <div className="group bg-gradient-to-br from-gray-600/10 to-gray-500/10 backdrop-blur-sm border border-gray-600/30 rounded-2xl p-8 hover:border-gray-500/50 transition-all duration-300 hover:scale-105">
          <div className="absolute top-4 right-4 bg-green-500/20 text-green-400 text-xs px-3 py-1 rounded-full border border-green-500/30 font-semibold">
            ALWAYS FREE
          </div>
          <div className="w-16 h-16 bg-gradient-to-r from-gray-600 to-gray-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Privacy & Security</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
            Your content is processed securely and never stored permanently. We prioritize your privacy and data security.
          </p>
          <div className="space-y-3">
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
              <CheckCircle className="w-4 h-4 text-green-400 mr-3 flex-shrink-0" />
              <span>Secure content processing</span>
            </div>
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
              <CheckCircle className="w-4 h-4 text-green-400 mr-3 flex-shrink-0" />
              <span>No permanent content storage</span>
            </div>
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
              <CheckCircle className="w-4 h-4 text-green-400 mr-3 flex-shrink-0" />
              <span>Privacy-focused design</span>
            </div>
          </div>
        </div>
      </div>

      {/* Upgrade CTA for Free Users */}
      {isAuthenticated && !user?.is_premium && (
        <div className="bg-gradient-to-r from-blue-500/20 to-purple-600/20 border border-blue-500/30 rounded-2xl p-10 text-center">
          <Crown className="w-16 h-16 text-yellow-500 dark:text-yellow-400 mx-auto mb-6" />
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Ready to Unlock Pro Features?</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-8 text-lg max-w-2xl mx-auto">
            Upgrade to Pro for unlimited generations, URL processing, content library, custom templates, and more.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/pricing"
              className="px-10 py-5 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold rounded-xl transition-all duration-300 flex items-center text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Crown className="w-6 h-6 mr-3" />
              Upgrade to Pro
              <ArrowRight className="w-6 h-6 ml-3" />
            </Link>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              14-day money-back guarantee • Cancel anytime
            </p>
          </div>
        </div>
      )}

      {/* Feature Comparison */}
      <div className="bg-gray-200 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-300 dark:border-gray-700 rounded-2xl p-8">
        <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
          {isAuthenticated ? 'Free vs Pro Features' : 'Why Choose Reword?'}
        </h3>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
            <h4 className="text-xl font-semibold text-red-500 dark:text-red-400 mb-6 flex items-center">
              <X className="w-6 h-6 mr-3" />
              {isAuthenticated ? 'Free Plan Limitations' : 'Manual Content Creation'}
            </h4>
            <ul className="space-y-4 text-gray-700 dark:text-gray-300">
              {isAuthenticated ? (
                <>
                  <li className="flex items-start">
                    <X className="w-5 h-5 text-red-500 dark:text-red-400 mr-3 mt-0.5 flex-shrink-0" />
                    <span>Limited to 2 generations per day</span>
                  </li>
                  <li className="flex items-start">
                    <X className="w-5 h-5 text-red-500 dark:text-red-400 mr-3 mt-0.5 flex-shrink-0" />
                    <span>No URL processing capability</span>
                  </li>
                  <li className="flex items-start">
                    <X className="w-5 h-5 text-red-500 dark:text-red-400 mr-3 mt-0.5 flex-shrink-0" />
                    <span>Cannot save or organize content</span>
                  </li>
                  <li className="flex items-start">
                    <X className="w-5 h-5 text-red-500 dark:text-red-400 mr-3 mt-0.5 flex-shrink-0" />
                    <span>No custom templates</span>
                  </li>
                  <li className="flex items-start">
                    <X className="w-5 h-5 text-red-500 dark:text-red-400 mr-3 mt-0.5 flex-shrink-0" />
                    <span>No export options</span>
                  </li>
                </>
              ) : (
                <>
                  <li className="flex items-start">
                    <Clock className="w-5 h-5 text-red-500 dark:text-red-400 mr-3 mt-0.5 flex-shrink-0" />
                    <span>Hours spent rewriting content</span>
                  </li>
                  <li className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 mr-3 mt-0.5 flex-shrink-0" />
                    <span>Inconsistent formatting</span>
                  </li>
                  <li className="flex items-start">
                    <HelpCircle className="w-5 h-5 text-red-500 dark:text-red-400 mr-3 mt-0.5 flex-shrink-0" />
                    <span>Platform-specific knowledge needed</span>
                  </li>
                  <li className="flex items-start">
                    <TrendingUp className="w-5 h-5 text-red-500 dark:text-red-400 mr-3 mt-0.5 flex-shrink-0 rotate-180" />
                    <span>Risk of poor engagement</span>
                  </li>
                  <li className="flex items-start">
                    <X className="w-5 h-5 text-red-500 dark:text-red-400 mr-3 mt-0.5 flex-shrink-0" />
                    <span>Repetitive manual work</span>
                  </li>
                </>
              )}
            </ul>
          </div>
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6">
            <h4 className="text-xl font-semibold text-green-400 mb-6 flex items-center">
              <CheckCircle className="w-6 h-6 mr-3" />
              {isAuthenticated ? 'Pro Plan Benefits' : 'Reword Benefits'}
            </h4>
            <ul className="space-y-4 text-gray-700 dark:text-gray-300">
              {isAuthenticated ? (
                <>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                    <span>Unlimited content generations</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                    <span>URL processing included</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                    <span>Content library & exports</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                    <span>Custom templates</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                    <span>Priority support</span>
                  </li>
                </>
              ) : (
                <>
                  <li className="flex items-start">
                    <Zap className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                    <span>Transform content in seconds</span>
                  </li>
                  <li className="flex items-start">
                    <Star className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                    <span>Professional, consistent formatting</span>
                  </li>
                  <li className="flex items-start">
                    <TrendingUp className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                    <span>Platform-optimized content</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                    <span>Improved engagement potential</span>
                  </li>
                  <li className="flex items-start">
                    <Crown className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                    <span>Focus on strategy, not execution</span>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )

  const renderUpdatesTab = () => (
    <div className="space-y-12">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Platform Updates</h2>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
          Recent improvements and upcoming features for Reword
        </p>
      </div>

      {/* Recent Updates Section */}
      <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30 rounded-2xl p-8">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center flex items-center justify-center">
          <CheckCircle className="w-6 h-6 text-green-400 mr-2" />
          Recent Updates
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm border border-gray-300 dark:border-gray-700 rounded-xl p-6">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
              <Crown className="w-5 h-5 text-green-400" />
            </div>
            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Premium Features</h4>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">Implemented Pro plan with URL processing, content saving, custom templates, and export functionality.</p>
            <div className="text-xs text-green-400 font-medium">✅ Completed - January 2025</div>
          </div>

          <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm border border-gray-300 dark:border-gray-700 rounded-xl p-6">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
              <Shield className="w-5 h-5 text-blue-500 dark:text-blue-400" />
            </div>
            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Database Migration</h4>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">Successfully migrated to Neon PostgreSQL for improved performance and reliability.</p>
            <div className="text-xs text-green-400 font-medium">✅ Completed - January 2025</div>
          </div>

          <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm border border-gray-300 dark:border-gray-700 rounded-xl p-6">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
              <Users className="w-5 h-5 text-purple-400" />
            </div>
            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">User Authentication</h4>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">Enhanced Google OAuth integration with improved error handling and user experience.</p>
            <div className="text-xs text-green-400 font-medium">✅ Completed - January 2025</div>
          </div>

          <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm border border-gray-300 dark:border-gray-700 rounded-xl p-6">
            <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center mb-4">
              <Star className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />
            </div>
            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">UI/UX Improvements</h4>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">Updated pricing page, enhanced FAQ section, and improved theme switching experience.</p>
            <div className="text-xs text-green-400 font-medium">✅ Completed - January 2025</div>
          </div>
        </div>
      </div>

      {/* Planned Features Section */}
      <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-2xl p-8">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center flex items-center justify-center">
          <Clock className="w-6 h-6 text-blue-500 dark:text-blue-400 mr-2" />
          Planned Features
        </h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm border border-gray-300 dark:border-gray-700 rounded-xl p-6">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
              <FileText className="w-5 h-5 text-blue-500 dark:text-blue-400" />
            </div>
            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Content Analytics</h4>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">Track performance metrics and engagement statistics for your generated content.</p>
            <div className="text-xs text-blue-500 dark:text-blue-400 font-medium">📋 Planned</div>
          </div>

          <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm border border-gray-300 dark:border-gray-700 rounded-xl p-6">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
              <Zap className="w-5 h-5 text-purple-400" />
            </div>
            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Bulk Processing</h4>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">Process multiple pieces of content simultaneously for increased efficiency.</p>
            <div className="text-xs text-blue-500 dark:text-blue-400 font-medium">📋 Planned</div>
          </div>

          <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm border border-gray-300 dark:border-gray-700 rounded-xl p-6">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Scheduling Integration</h4>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">Direct integration with social media scheduling tools for seamless publishing.</p>
            <div className="text-xs text-blue-500 dark:text-blue-400 font-medium">📋 Under Consideration</div>
          </div>

          <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm border border-gray-300 dark:border-gray-700 rounded-xl p-6">
            <div className="w-10 h-10 bg-pink-500/20 rounded-lg flex items-center justify-center mb-4">
              <Settings className="w-5 h-5 text-pink-400" />
            </div>
            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Advanced Customization</h4>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">More granular control over content transformation and formatting options.</p>
            <div className="text-xs text-blue-500 dark:text-blue-400 font-medium">📋 Under Consideration</div>
          </div>

          <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm border border-gray-300 dark:border-gray-700 rounded-xl p-6">
            <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center mb-4">
              <LinkIcon className="w-5 h-5 text-cyan-400" />
            </div>
            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">API Access</h4>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">Developer API for integrating Reword into your own applications and workflows.</p>
            <div className="text-xs text-blue-500 dark:text-blue-400 font-medium">📋 Under Consideration</div>
          </div>

          <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm border border-gray-300 dark:border-gray-700 rounded-xl p-6">
            <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center mb-4">
              <Plus className="w-5 h-5 text-orange-500 dark:text-orange-400" />
            </div>
            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">More Platforms</h4>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">Support for additional social media platforms like TikTok, YouTube, and Facebook.</p>
            <div className="text-xs text-blue-500 dark:text-blue-400 font-medium">📋 Under Consideration</div>
          </div>
        </div>
      </div>

      {/* Platform Stats */}
      <div className="bg-gray-200 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-300 dark:border-gray-700 rounded-2xl p-8">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">Platform Statistics</h3>
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
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Help Shape Reword</h3>
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
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Recent Changelog</h3>
        <div className="space-y-6">
          <div className="border-l-4 border-green-400 pl-6">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">v1.2.0</h4>
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
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">v1.1.0</h4>
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
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">v1.0.0</h4>
              <span className="text-sm text-gray-500 dark:text-gray-400">January 15, 2025</span>
            </div>
            <ul className="text-gray-600 dark:text-gray-300 text-sm space-y-1">
              <li>• Initial platform launch</li>
              <li>• AI-powered content transformation</li>
              <li>• Support for X/Twitter, LinkedIn, Instagram</li>
              <li>• User authentication with Google OAuth</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )

  const renderAboutTab = () => (
    <div className="space-y-12">
      {/* Enhanced Header */}
      <div className="text-center mb-12 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-cyan-50/30 dark:from-blue-900/10 dark:via-transparent dark:to-cyan-900/10 rounded-3xl"></div>
        <div className="relative z-10">
          <div className="inline-block px-4 py-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full text-sm font-medium mb-4 border border-blue-500/20">
            ABOUT REWORD
          </div>
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">About Reword</h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Empowering content creators with AI-powered social media optimization
          </p>
        </div>
      </div>

      {/* Enhanced Mission Section */}
      <div className="grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <div>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center mr-3">
                <TrendingUp className="w-5 h-5 text-blue-500 dark:text-blue-400" />
              </div>
              Our Mission
            </h3>
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
          <h4 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center mr-3">
              <Users className="w-5 h-5 text-purple-500 dark:text-purple-400" />
            </div>
            Why We Built This
          </h4>
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
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">What Makes Reword Different</h3>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center group">
            <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <Zap className="w-8 h-8 text-blue-500 dark:text-blue-400" />
            </div>
            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">AI-Powered Intelligence</h4>
            <p className="text-gray-600 dark:text-gray-300 text-sm">Advanced AI that understands context, tone, and platform requirements for optimal content transformation.</p>
          </div>
          <div className="text-center group">
            <div className="w-16 h-16 bg-cyan-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <Shield className="w-8 h-8 text-cyan-400" />
            </div>
            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Privacy First</h4>
            <p className="text-gray-600 dark:text-gray-300 text-sm">Your content is processed securely and never stored permanently. We prioritize your privacy and data security.</p>
          </div>
          <div className="text-center group">
            <div className="w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-8 h-8 text-purple-500 dark:text-purple-400" />
            </div>
            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Platform Optimization</h4>
            <p className="text-gray-600 dark:text-gray-300 text-sm">Content optimized specifically for X/Twitter, LinkedIn, and Instagram with platform-specific best practices.</p>
          </div>
        </div>
      </div>

      {/* Enhanced Team Values */}
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Our Values</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300">
            <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-6 h-6 text-blue-500 dark:text-blue-400" />
            </div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-2">Simplicity</h4>
            <p className="text-gray-600 dark:text-gray-300 text-sm">Making complex AI accessible through simple, intuitive interfaces.</p>
          </div>
          <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300">
            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-6 h-6 text-green-400" />
            </div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-2">Privacy</h4>
            <p className="text-gray-600 dark:text-gray-300 text-sm">Protecting user data and content with enterprise-grade security.</p>
          </div>
          <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300">
            <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="w-6 h-6 text-purple-500 dark:text-purple-400" />
            </div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-2">Quality</h4>
            <p className="text-gray-600 dark:text-gray-300 text-sm">Delivering high-quality content transformations that maintain your voice.</p>
          </div>
          <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300">
            <div className="w-12 h-12 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 text-cyan-400" />
            </div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-2">Community</h4>
            <p className="text-gray-600 dark:text-gray-300 text-sm">Building a supportive community of content creators and marketers.</p>
          </div>
        </div>
      </div>

      {/* Enhanced Contact Section */}
      <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-2xl p-8 text-center">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Get in Touch</h3>
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
  )

  const renderPricingTab = () => (
    <div className="space-y-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-6">
          Simple, Transparent Pricing
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
          Choose the perfect plan for your content creation needs. Start free and upgrade as you grow.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Free Plan */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-lg">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Free</h3>
            <div className="text-4xl font-bold text-gray-900 dark:text-white mb-4">$0</div>
            <p className="text-gray-600 dark:text-gray-400">Perfect for trying Reword</p>
          </div>

          <ul className="space-y-4 mb-8">
            <li className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-gray-700 dark:text-gray-300">3 content generations per day</span>
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-gray-700 dark:text-gray-300">Transform text and content only</span>
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-gray-700 dark:text-gray-300">7 Twitter, LinkedIn, Instagram formats</span>
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-gray-700 dark:text-gray-300">Basic content history (new only)</span>
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-gray-700 dark:text-gray-300">Community support</span>
            </li>
          </ul>

          <button
            onClick={() => {
              setShowAuthModal(true)
              setAuthModalMode('register')
            }}
            className="w-full py-3 px-6 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Get Started Free
          </button>
        </div>

        {/* Pro Plan */}
        <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-4 right-4">
            <span className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-medium">
              Most Popular
            </span>
          </div>

          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold mb-2">Pro</h3>
            <div className="text-4xl font-bold mb-4">$15<span className="text-lg">/month</span></div>
            <p className="text-blue-100">For content creators and marketers</p>
          </div>

          <ul className="space-y-4 mb-8">
            <li className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-white" />
              <span>Unlimited content generations</span>
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-white" />
              <span>Transform URLs (blogs, articles, etc.)</span>
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-white" />
              <span>7 Twitter, LinkedIn, Instagram formats</span>
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-white" />
              <span>Full content history with search</span>
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-white" />
              <span>Create custom templates</span>
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-white" />
              <span>Priority processing speed</span>
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-white" />
              <span>Email support</span>
            </li>
          </ul>

          <button
            onClick={() => setShowPaymentModal(true)}
            className="w-full py-3 px-6 bg-white text-blue-600 rounded-lg font-medium hover:bg-gray-100 transition-colors"
          >
            Sign Up & Upgrade
          </button>
        </div>
      </div>
    </div>
  )

  const renderCommunityTab = () => (
    <div className="space-y-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-6">
          Community Templates
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
          Discover and use templates created by our community. Get inspired and save time with proven content formats.
        </p>
      </div>

      {/* Community Templates Component would go here */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-lg">
        <div className="text-center">
          <Users className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Community Templates
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Browse templates created by other users and contribute your own successful formats.
          </p>

          {!isAuthenticated ? (
            <button
              onClick={() => {
                setShowAuthModal(true)
                setAuthModalMode('login')
              }}
              className="px-6 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors"
            >
              Sign In to Access Templates
            </button>
          ) : !user?.is_premium ? (
            <div className="space-y-4">
              <p className="text-amber-600 dark:text-amber-400 font-medium">
                Community templates are available for Pro users
              </p>
              <button
                onClick={() => setShowPaymentModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-cyan-700 transition-colors"
              >
                Upgrade to Pro
              </button>
            </div>
          ) : (
            <div className="text-gray-600 dark:text-gray-400">
              Community templates feature coming soon...
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Onboarding Modal */}
      <OnboardingModal />

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authModalMode}
      />

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        selectedPlan="pro"
        billingCycle="monthly"
      />

      {/* Custom Template Modal */}
      <CustomTemplateModal
        isOpen={showCustomTemplateModal}
        onClose={() => setShowCustomTemplateModal(false)}
        onTemplateCreated={handleCustomTemplateCreated}
      />

      {/* Template Selector Modal */}
      <TemplateSelector
        isOpen={showTemplateSelector}
        onClose={() => {
          setShowTemplateSelector(false)
          setTemplateSelectorSource('all') // Reset to default
        }}
        onTemplateSelect={handleCustomTemplateSelect}
        defaultSource={templateSelectorSource}
      />

      {/* Top Progress Bar - Only for page navigation */}
      <TopProgressBar
        isLoading={isNavigating}
        progress={undefined}
        message={isNavigating ? 'Loading page...' : undefined}
      />

      {/* Navigation */}
      {isAuthenticated ? (
        <AuthenticatedNavbar isLoading={false} />
      ) : (
        <Navbar
          isAuthenticated={isAuthenticated}
          user={user}
          usageStats={usageStats}
          activeMainTab={activeMainTab}
          onSignIn={() => {
            setShowAuthModal(true)
            setAuthModalMode('login')
          }}
          onSignUp={() => {
            setShowAuthModal(true)
            setAuthModalMode('register')
          }}
          onUserDashboard={() => setShowDashboard(true)}
          onTabChange={(tab: string) => setActiveMainTab(tab as TabType)}
        />
      )}

      {/* Main Content */}
      <main className="py-4 px-4 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="max-w-6xl mx-auto">
          {/* Subscription Warning - Show for premium users with expiring subscriptions */}
          <SubscriptionWarning
            onUpgradeClick={() => setShowPaymentModal(true)}
          />

          {/* Render content based on active tab */}
          {activeMainTab === 'home' && renderHomeTab()}
          {activeMainTab === 'features' && renderFeaturesTab()}
          {activeMainTab === 'pricing' && renderPricingTab()}
          {activeMainTab === 'updates' && renderUpdatesTab()}
          {activeMainTab === 'about' && renderAboutTab()}
          {activeMainTab === 'community' && renderCommunityTab()}
        </div>
      </main>

      {/* Footer */}
      <Footer />

      {/* Dashboard Modal */}
      <DashboardModal
        isOpen={showDashboard}
        onClose={() => setShowDashboard(false)}
        externalUsageStats={usageStats}
      />
    </div>
  )
}
