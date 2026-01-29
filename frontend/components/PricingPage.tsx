'use client'

import React, { useState } from 'react'
import { Check, X, Crown, Users, Sparkles, BarChart3, Heart, Plus, Minus } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import PaymentModal from './PaymentModal'
import AuthModal from './AuthModal'
import DowngradeModal from './DowngradeModal'
import axios from 'axios'
import toast from 'react-hot-toast'
import { API_URL } from '@/lib/api-config'

interface PricingPageProps {
  onSignUp: (plan: string) => void
}

interface FAQItemProps {
  faq: {
    question: string
    answer: string
  }
  index: number
}

function FAQItem({ faq, index }: FAQItemProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="border border-gray-300 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-gray-800/50 backdrop-blur-sm">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors duration-200"
      >
        <span className="text-lg font-semibold text-gray-900 dark:text-white pr-4">
          {faq.question}
        </span>
        <div className="flex-shrink-0">
          {isExpanded ? (
            <Minus className="w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-200" />
          ) : (
            <Plus className="w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-200" />
          )}
        </div>
      </button>

      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}>
        <div className="px-6 pb-5 pt-0">
          <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              {faq.answer}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PricingPage({ onSignUp }: PricingPageProps) {
  const { isAuthenticated, user, updateUser } = useAuth()
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<string>('pro')
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('register')
  const [isDowngrading, setIsDowngrading] = useState(false)
  const [showDowngradeModal, setShowDowngradeModal] = useState(false)

  const handleDowngradeToFree = async () => {
    if (!user?.is_premium) return

    setIsDowngrading(true)
    try {
      // Set flag to indicate this is a manual cancellation
      sessionStorage.setItem('manual_cancellation', 'true')

      const response = await axios.post(`${API_URL}/api/v1/payment/cancel`)

      if (response.data.success) {
        // Update user state
        updateUser({ is_premium: false })

        // Clear any cached data that might be premium-specific
        const keys = Object.keys(sessionStorage)
        keys.forEach(key => {
          if (key.includes('usage_stats') || key.includes('dashboard_stats')) {
            sessionStorage.removeItem(key)
          }
        })

        // Dispatch a custom event to notify other components
        window.dispatchEvent(new CustomEvent('subscription-cancelled', {
          detail: { is_premium: false }
        }))

        toast.success('Successfully downgraded to Free plan')
        setShowDowngradeModal(false)

        // Call the onSignUp callback to handle any additional logic
        onSignUp('free')
      } else {
        toast.error(response.data.message || 'Failed to downgrade subscription')
      }
    } catch (error: any) {
      console.error('Error downgrading subscription:', error)
      if (error.response?.status === 400) {
        toast.error('No active subscription found')
      } else {
        toast.error('Failed to downgrade subscription. Please try again.')
      }
    } finally {
      setIsDowngrading(false)
    }
  }

  const handlePlanSelection = (planId: string) => {
    if (planId === 'free') {
      // If user is premium and selecting free, show downgrade modal
      if (user?.is_premium) {
        setShowDowngradeModal(true)
      } else {
        onSignUp(planId)
      }
    } else {
      // Check if user is authenticated for premium plans
      if (!isAuthenticated) {
        setSelectedPlan(planId)
        setAuthModalMode('register')
        setShowAuthModal(true)
        return
      }

      setSelectedPlan(planId)
      setShowPaymentModal(true)
    }
  }

  const handleAuthModalClose = () => {
    setShowAuthModal(false)
    // Check if user is now authenticated after closing auth modal
    if (isAuthenticated) {
      // Small delay to ensure auth state is updated
      setTimeout(() => {
        setShowPaymentModal(true)
      }, 100)
    }
  }

  const plans = [
    {
      id: 'free',
      name: 'Free',
      description: 'Perfect for trying out Reword',
      price: { monthly: 0, yearly: 0 },
      badge: null,
      features: [
        '2 content generations per day',
        'Transform text content only',
        'X/Twitter, LinkedIn, Instagram formats',
        'Copy to clipboard',
        'Basic content history (view only)',
        'Community support',
        'Up to 10,000 characters per input'
      ],
      limitations: [
        'No content saving or organization',
        'No URL processing',
        'No export to files (TXT, JSON, CSV)',
        'No custom templates',
        'No template browsing',
        'Limited content length'
      ],
      cta: 'Get Started Free',
      popular: false,
      color: 'gray'
    },
    {
      id: 'pro',
      name: 'Pro',
      description: 'For serious content creators and marketers',
      price: { monthly: 14, yearly: 129 },
      badge: 'Most Popular',
      features: [
        '20 content generations per day',
        'Transform text + process URLs directly',
        'X/Twitter, LinkedIn, Instagram formats',
        'Save & organize unlimited content',
        'Full content history with search',
        'Export to TXT, JSON, CSV formats',
        'Create custom templates',
        'Browse community templates',
        'Bulk processing (up to 50 items)',
        'Extended content support (50,000 chars)',
        'Priority processing speed',
        'Email support'
      ],
      limitations: [],
      cta: 'Start Pro Plan',
      popular: true,
      color: 'blue'
    }
  ]

  const getSavings = (plan: typeof plans[0]) => {
    if (plan.price.yearly === 0) return 0
    const monthlyCost = plan.price.monthly * 12
    const yearlyCost = plan.price.yearly
    return Math.round(((monthlyCost - yearlyCost) / monthlyCost) * 100)
  }

  const faqs = [
    {
      question: 'What happens when I reach my daily limit on the free plan?',
      answer: 'Free users get 2 content generations per 24-hour period. Once you reach this limit, you can either wait for the reset or upgrade to Pro for 20 generations per day.'
    },
    {
      question: 'Can I process content from URLs?',
      answer: 'URL processing is a Pro feature. Free users can only input text directly. Pro users can paste any article, blog post, or webpage URL and we\'ll extract and transform the content automatically.'
    },
    {
      question: 'What social media platforms do you support?',
      answer: 'We currently support X/Twitter (thread format), LinkedIn (professional posts), and Instagram (carousel slides). All plans include these three platforms.'
    },
    {
      question: 'Can I save and organize my generated content?',
      answer: 'Content saving and organization features are available for Pro users only. This includes unlimited saves, search, tags, favorites, and full content history.'
    },
    {
      question: 'What export formats are available?',
      answer: 'Free users can copy content to clipboard. Pro users can export to TXT, JSON, and CSV files for easy backup, sharing, and integration with other tools.'
    },
    {
      question: 'What are custom templates?',
      answer: 'Pro users can create and save their own content templates for reuse, and browse community templates shared by other users. This helps maintain consistency and saves time.'
    },
    {
      question: 'How does the content length limit work?',
      answer: 'Free users can input up to 10,000 characters per generation. Pro users can input up to 50,000 characters, perfect for longer articles, newsletters, and comprehensive content.'
    },
    {
      question: 'Do you offer refunds?',
      answer: 'Yes! We offer a 14-day money-back guarantee for all paid plans. If you\'re not satisfied, contact our support team for a full refund.'
    },
    {
      question: 'Is my content secure and private?',
      answer: 'Absolutely! We process your content securely and never store it permanently. Your data is encrypted in transit and at rest, and we never share your content with third parties.'
    }
  ]

  const getColorClasses = (color: string, variant: 'border' | 'bg' | 'text' | 'button') => {
    const colors = {
      gray: {
        border: 'border-gray-300 dark:border-gray-600',
        bg: 'bg-gray-100 dark:bg-gray-800/50',
        text: 'text-gray-600 dark:text-gray-400',
        button: 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white'
      },
      blue: {
        border: 'border-blue-500',
        bg: 'bg-blue-500/10',
        text: 'text-blue-600 dark:text-blue-500 dark:text-blue-400',
        button: 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'
      },
      purple: {
        border: 'border-purple-500',
        bg: 'bg-purple-500/10',
        text: 'text-purple-600 dark:text-purple-400',
        button: 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white'
      }
    }
    return colors[color as keyof typeof colors][variant]
  }

  return (
    <div className="space-y-16">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
          Simple, Transparent Pricing
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
          Choose the perfect plan for your content creation needs. Start free and upgrade as you grow.
        </p>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center mb-12">
          <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${billingCycle === 'monthly'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2 rounded-lg font-medium transition-all relative ${billingCycle === 'yearly'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
            >
              Yearly
              <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                Save 20%
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`relative bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm border rounded-2xl p-8 transition-all duration-300 hover:scale-105 ${plan.popular
              ? `${getColorClasses(plan.color, 'border')} shadow-2xl shadow-blue-500/20`
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
          >
            {/* Badge */}
            {plan.badge && (
              <div className={`absolute -top-4 left-1/2 transform -translate-x-1/2 px-4 py-1 rounded-full text-sm font-medium ${getColorClasses(plan.color, 'bg')} ${getColorClasses(plan.color, 'text')} border ${getColorClasses(plan.color, 'border')}`}>
                {plan.badge}
              </div>
            )}

            {/* Current Plan Indicator */}
            {isAuthenticated && (
              (plan.id === 'free' && !user?.is_premium) ||
              (plan.id === 'pro' && user?.is_premium)
            ) && (
                <div className="absolute -top-4 right-4 px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium border border-green-500/30">
                  Current Plan
                </div>
              )}

            {/* Plan Header */}
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{plan.name}</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">{plan.description}</p>

              <div className="mb-6">
                <div className="flex items-baseline justify-center">
                  <span className="text-5xl font-bold text-gray-900 dark:text-white">
                    ${plan.price[billingCycle]}
                  </span>
                  {plan.price[billingCycle] > 0 && (
                    <span className="text-gray-600 dark:text-gray-400 ml-2">
                      /{billingCycle === 'monthly' ? 'month' : 'year'}
                    </span>
                  )}
                </div>
                {billingCycle === 'yearly' && plan.price.yearly > 0 && (
                  <div className="mt-2">
                    <span className="text-green-400 text-sm font-medium">
                      Save {getSavings(plan)}% annually
                    </span>
                  </div>
                )}
              </div>

              <button
                onClick={() => handlePlanSelection(plan.id)}
                disabled={isAuthenticated && (
                  (plan.id === 'free' && !user?.is_premium) ||
                  (plan.id === 'pro' && user?.is_premium)
                )}
                className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-200 ${isAuthenticated && (
                  (plan.id === 'free' && !user?.is_premium) ||
                  (plan.id === 'pro' && user?.is_premium)
                )
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30 cursor-not-allowed'
                  : getColorClasses(plan.color, 'button')
                  }`}
              >
                {isAuthenticated
                  ? (plan.id === 'free'
                    ? (!user?.is_premium ? 'Current Plan' : 'Downgrade to Free')
                    : user?.is_premium
                      ? 'Current Plan'
                      : 'Upgrade Now')
                  : (plan.id === 'free'
                    ? plan.cta
                    : 'Sign Up & Upgrade')
                }
              </button>
            </div>

            {/* Features */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 dark:text-white">What's included:</h4>
              <ul className="space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600 dark:text-gray-300 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              {plan.limitations.length > 0 && (
                <>
                  <h4 className="font-semibold text-gray-500 dark:text-gray-400 mt-6">Not included:</h4>
                  <ul className="space-y-3">
                    {plan.limitations.map((limitation, index) => (
                      <li key={index} className="flex items-start">
                        <X className="w-5 h-5 text-gray-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-500 text-sm">{limitation}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-br from-gray-200/50 to-gray-300/50 dark:from-gray-800/50 dark:to-gray-900/50 backdrop-blur-sm rounded-3xl p-4 sm:p-8 border border-gray-300/50 dark:border-gray-700/50 shadow-2xl overflow-hidden">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Compare Features
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg max-w-2xl mx-auto">
            See exactly what's included in each plan. All plans include our core AI-powered content transformation.
          </p>
        </div>

        <div className="overflow-x-auto pb-4 scrollbar-hide -mx-4 sm:mx-0 px-4 sm:px-0">
          <table className="w-full min-w-[600px] table-fixed">
            <thead>
              <tr className="border-b-2 border-slate-200 dark:border-slate-800">
                <th className="text-left py-4 sm:py-6 px-3 sm:px-6 text-slate-900 dark:text-white font-bold text-base sm:text-lg w-[40%]">Features</th>
                <th className="text-center py-4 sm:py-6 px-3 sm:px-6 w-[30%] align-bottom">
                  <div className="flex flex-col items-center justify-end h-full">
                    <span className="text-slate-900 dark:text-white font-bold text-base sm:text-lg mb-1">Free</span>
                    <span className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">Forever Free</span>
                  </div>
                </th>
                <th className="text-center py-4 sm:py-6 px-3 sm:px-6 w-[30%] align-bottom bg-blue-50/50 dark:bg-blue-900/10 rounded-t-xl border-t border-x border-blue-100 dark:border-blue-800/30">
                  <div className="flex flex-col items-center justify-end h-full">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] uppercase tracking-wider px-3 py-1 rounded-full font-bold mb-2 sm:mb-3 shadow-sm transform -translate-y-1">
                      Most Popular
                    </div>
                    <span className="text-slate-900 dark:text-white font-bold text-base sm:text-lg mb-1">Pro</span>
                    <span className="text-blue-600 dark:text-blue-400 text-xs sm:text-sm font-medium">
                      ${billingCycle === 'monthly' ? '15/mo' : '144/yr'}
                    </span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="text-xs sm:text-sm">
              {[
                {
                  category: 'Content Generation',
                  feature: 'Daily Generations',
                  free: '2 per day',
                  pro: '20/Day',
                  highlight: true
                },
                {
                  feature: 'Input Methods',
                  free: 'Text only',
                  pro: 'Text + URLs'
                },
                {
                  feature: 'Content Length Limit',
                  free: '10,000 chars',
                  pro: '50,000 chars'
                },
                {
                  feature: 'Social Platforms',
                  free: 'X, LinkedIn, Inst.',
                  pro: 'X, LinkedIn, Inst.'
                },
                {
                  category: 'Content Management',
                  feature: 'Save Content',
                  free: { icon: 'X', color: 'text-red-500 dark:text-red-400' },
                  pro: 'Unlimited saves',
                  highlight: true
                },
                {
                  feature: 'Content History',
                  free: 'View only',
                  pro: 'Full + search'
                },
                {
                  feature: 'Content Organization',
                  free: { icon: 'X', color: 'text-red-500 dark:text-red-400' },
                  pro: 'Tags, favorites'
                },
                {
                  category: 'Templates & Customization',
                  feature: 'Custom Templates',
                  free: { icon: 'X', color: 'text-red-500 dark:text-red-400' },
                  pro: 'Create & manage',
                  highlight: true
                },
                {
                  feature: 'Community Grid',
                  free: { icon: 'X', color: 'text-red-500 dark:text-red-400' },
                  pro: 'Browse & share'
                },
                {
                  category: 'Export & Sharing',
                  feature: 'Copy to Clipboard',
                  free: { icon: 'Check', color: 'text-green-400' },
                  pro: { icon: 'Check', color: 'text-green-400' },
                  highlight: true
                },
                {
                  feature: 'Export Formats',
                  free: 'Clipboard only',
                  pro: 'TXT, JSON, CSV'
                },
                {
                  feature: 'Bulk Processing',
                  free: '1 item',
                  pro: 'Up to 50 items'
                },
                {
                  category: 'Processing & Performance',
                  feature: 'Processing Speed',
                  free: 'Standard',
                  pro: 'Priority',
                  highlight: true
                },
                {
                  category: 'Support',
                  feature: 'Support Level',
                  free: 'Community',
                  pro: 'Email support',
                  highlight: true
                }
              ].map((row, index) => (
                <React.Fragment key={index}>
                  {row.category && (
                    <tr className="bg-gray-300/30 dark:bg-gray-700/30">
                      <td colSpan={3} className="py-2 sm:py-3 px-3 sm:px-6 text-blue-500 dark:text-blue-400 font-semibold text-xs sm:text-sm uppercase tracking-wide border-t border-gray-400 dark:border-gray-600">
                        {row.category}
                      </td>
                    </tr>
                  )}
                  <tr className={`border-b border-gray-300 dark:border-gray-800 hover:bg-gray-200/20 dark:hover:bg-gray-700/20 transition-colors ${row.highlight ? 'bg-gray-200/10 dark:bg-gray-700/10' : ''}`}>
                    <td className="py-3 sm:py-4 px-3 sm:px-6 text-gray-700 dark:text-gray-300 font-medium truncate" title={typeof row.feature === 'string' ? row.feature : ''}>{row.feature}</td>
                    <td className="py-3 sm:py-4 px-3 sm:px-6 text-center">
                      {typeof row.free === 'object' ? (
                        <div className="flex justify-center">
                          {row.free.icon === 'Check' ? (
                            <Check className={`w-4 h-4 sm:w-5 sm:h-5 ${row.free.color}`} />
                          ) : (
                            <X className={`w-4 h-4 sm:w-5 sm:h-5 ${row.free.color}`} />
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-600 dark:text-gray-400 font-medium whitespace-normal">{row.free}</span>
                      )}
                    </td>
                    <td className="py-3 sm:py-4 px-3 sm:px-6 text-center bg-blue-500/5 border-l border-r border-blue-500/20">
                      {typeof row.pro === 'object' ? (
                        <div className="flex justify-center">
                          {row.pro.icon === 'Check' ? (
                            <Check className={`w-4 h-4 sm:w-5 sm:h-5 ${row.pro.color}`} />
                          ) : (
                            <X className={`w-4 h-4 sm:w-5 sm:h-5 ${row.pro.color}`} />
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-900 dark:text-white font-semibold whitespace-normal">{row.pro}</span>
                      )}
                    </td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* CTA Buttons in Table */}
        <div className="mt-8 grid md:grid-cols-2 gap-4">
          <div className="text-center">
            <button
              onClick={() => handlePlanSelection('free')}
              disabled={isAuthenticated && !user?.is_premium}
              className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-200 ${isAuthenticated && !user?.is_premium
                ? 'bg-green-500/20 text-green-400 border border-green-500/30 cursor-not-allowed'
                : 'bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 text-gray-900 dark:text-white border border-gray-400 dark:border-gray-600'
                }`}
            >
              {isAuthenticated && !user?.is_premium ? 'Current Plan' :
                isAuthenticated && user?.is_premium ? 'Downgrade to Free' : 'Get Started Free'}
            </button>
          </div>
          <div className="text-center">
            <button
              onClick={() => handlePlanSelection('pro')}
              disabled={isAuthenticated && user?.is_premium}
              className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-200 ${isAuthenticated && user?.is_premium
                ? 'bg-green-500/20 text-green-400 border border-green-500/30 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg shadow-blue-500/25'
                }`}
            >
              {isAuthenticated && user?.is_premium ? 'Current Plan' : 'Upgrade to Pro'}
            </button>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="mt-8 grid md:grid-cols-2 gap-6 text-center">
          <div className="p-4 bg-gray-300/30 dark:bg-gray-700/30 rounded-xl border border-gray-400/50 dark:border-gray-600/50">
            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-6 h-6 text-green-400" />
            </div>
            <h4 className="text-gray-900 dark:text-white font-semibold mb-2">Start Free</h4>
            <p className="text-gray-600 dark:text-gray-400 text-sm">No credit card required. Get started in seconds.</p>
          </div>
          <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/30">
            <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <Crown className="w-6 h-6 text-blue-500 dark:text-blue-400" />
            </div>
            <h4 className="text-gray-900 dark:text-white font-semibold mb-2">High Volume</h4>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Pro users get 20 generations per day and advanced features.</p>
          </div>
        </div>
      </div>

      {/* Social Proof */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Trusted by Content Creators Worldwide
        </h2>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="bg-gray-200 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-300 dark:border-gray-700">
            <div className="flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-blue-500 dark:text-blue-400" />
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">1,000+</div>
            <div className="text-gray-600 dark:text-gray-400">Active Users</div>
          </div>

          <div className="bg-gray-200 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-300 dark:border-gray-700">
            <div className="flex items-center justify-center mb-4">
              <BarChart3 className="w-8 h-8 text-green-400" />
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">50K+</div>
            <div className="text-gray-600 dark:text-gray-400">Posts Generated</div>
          </div>

          <div className="bg-gray-200 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-300 dark:border-gray-700">
            <div className="flex items-center justify-center mb-4">
              <Heart className="w-8 h-8 text-red-500 dark:text-red-400" />
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">4.8/5</div>
            <div className="text-gray-600 dark:text-gray-400">User Rating</div>
          </div>
        </div>
      </div>

      {/* Enhanced FAQ Section */}
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-block px-4 py-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full text-sm font-medium mb-4 border border-blue-500/20">
            FAQ & CLARITY LAYER
          </div>
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Common Queries
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Direct answers about Reword's content transformation platform.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <FAQItem key={index} faq={faq} index={index} />
          ))}
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        selectedPlan={selectedPlan}
        billingCycle={billingCycle}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={handleAuthModalClose}
        initialMode={authModalMode}
      />

      {/* Downgrade Modal */}
      <DowngradeModal
        isOpen={showDowngradeModal}
        onClose={() => setShowDowngradeModal(false)}
        onConfirm={handleDowngradeToFree}
        isLoading={isDowngrading}
      />
    </div>
  )
}