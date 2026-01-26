'use client'

import React, { useState } from 'react'
import { X, Crown, Check, Loader2, ExternalLink } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { API_URL } from '@/lib/api-config'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  selectedPlan?: string
  billingCycle?: 'monthly' | 'yearly'
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  selectedPlan = 'pro',
  billingCycle = 'monthly'
}) => {
  const { updateUser } = useAuth()
  const [loading, setLoading] = useState(false)

  const pricing = {
    pro: { monthly: 15, yearly: 144 },
    enterprise: { monthly: 49, yearly: 470 }
  }

  const planNames = {
    pro: 'Creator Pro',
    enterprise: 'Agency'
  }

  const amount = pricing[selectedPlan as keyof typeof pricing]?.[billingCycle] || 0
  const savings = billingCycle === 'yearly' ? Math.round(((pricing[selectedPlan as keyof typeof pricing]?.monthly * 12 - amount) / (pricing[selectedPlan as keyof typeof pricing]?.monthly * 12)) * 100) : 0

  const handleCheckout = async () => {
    setLoading(true)

    try {
      console.log('🔄 Creating Dodo Payments checkout session...')

      const requestData = {
        plan_id: selectedPlan,
        billing_cycle: billingCycle
      }

      console.log('📤 Sending checkout request:', requestData)

      const response = await axios.post(
        `${API_URL}/api/v1/payment/create-checkout`,
        requestData
      )

      console.log('📥 Checkout response:', response.data)

      if (response.data && response.data.success) {
        console.log('✅ Checkout session created!')
        console.log('🔗 Redirecting to:', response.data.checkout_url)

        // Redirect to Dodo Payments checkout
        window.location.href = response.data.checkout_url
      } else {
        console.error('❌ Checkout failed - no success in response')
        throw new Error('Failed to create checkout session')
      }
    } catch (error: any) {
      console.error('❌ Checkout error:', error)
      console.error('❌ Error response:', error.response)

      // Safely extract error message
      let message = 'Failed to create checkout session. Please try again.'

      if (error.response?.data) {
        console.log('Error response data:', error.response.data)
        if (typeof error.response.data === 'string') {
          message = error.response.data
        } else if (error.response.data.detail) {
          message = String(error.response.data.detail)
        } else if (error.response.data.message) {
          message = String(error.response.data.message)
        }
      } else if (error.message) {
        message = String(error.message)
      }

      console.log('Final error message:', message)

      // Ensure message is always a string
      const safeMessage = typeof message === 'string' ? message : 'Failed to create checkout session. Please try again.'
      toast.error(safeMessage)
    } finally {
      setLoading(false)
    }
  }

  // Lock body scroll when modal is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      document.documentElement.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
      document.documentElement.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
      document.documentElement.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[999999] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">

        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Upgrade to Pro
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg p-1 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Plan Summary */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span className="font-semibold text-gray-900 dark:text-white">{planNames[selectedPlan as keyof typeof planNames] || selectedPlan}</span>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">${amount}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">/{billingCycle}</div>
              </div>
            </div>

            {savings > 0 && (
              <div className="text-sm text-green-700 dark:text-green-400 font-medium">
                Save {savings}% with yearly billing
              </div>
            )}
          </div>

          {/* Dodo Payments Checkout Button */}
          <div className="mt-6">
            <button
              onClick={handleCheckout}
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 dark:from-blue-600 dark:to-purple-600 dark:hover:from-blue-700 dark:hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Crown className="w-5 h-5" />
                  Pay ${amount} {billingCycle}
                  <ExternalLink className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Secure payment powered by Dodo Payments
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                🔒 SSL encrypted • 14-day money-back guarantee
              </p>
            </div>
          </div>

          {/* Features List */}
          <div className="mt-6 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">What you'll get:</h4>
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                Unlimited content repurposing
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                URL processing & content extraction
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                Save & organize content library
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                Advanced AI templates & styles
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                Export to multiple formats
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                Priority support (24h response)
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PaymentModal