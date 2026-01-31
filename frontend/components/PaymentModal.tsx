'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
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
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const pricing = {
    pro: { monthly: 15, yearly: 144 }
  }

  const planNames = {
    pro: 'Creator Pro'
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

  if (!isOpen || !mounted) return null

  return createPortal(
    <div className="fixed inset-0 bg-[#0F172A]/80 backdrop-blur-md z-[2000000] flex items-center justify-center p-4">
      <div className="relative bg-[#1E293B] dark:bg-[#020617] rounded-3xl border border-slate-700/50 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl overflow-hidden">

        {/* Background Effects */}
        <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-blue-600/10 to-transparent pointer-events-none"></div>
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Header */}
        <div className="relative p-6 pb-0 flex items-center justify-between z-10">
          <div className="flex items-center gap-2 text-white">
            <div className="p-2 bg-blue-500/20 rounded-xl border border-blue-500/30">
              <Crown className="w-5 h-5 text-blue-400" />
            </div>
            <h2 className="text-lg font-bold">Upgrade to Pro</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-full p-2 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="relative p-6 z-10">

          {/* Plan Summary Card */}
          <div className="relative bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6 mb-8 overflow-hidden group hover:border-blue-500/50 transition-colors duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-transparent to-purple-600/5 group-hover:from-blue-600/10 transition-colors"></div>

            <div className="relative flex justify-between items-start mb-4">
              <div>
                <p className="text-slate-400 text-sm font-medium mb-1">Selected Plan</p>
                <h3 className="text-2xl font-bold text-white tracking-tight">{planNames[selectedPlan as keyof typeof planNames] || selectedPlan}</h3>
              </div>
              <div className="text-right">
                <div className="flex items-baseline gap-1 justify-end">
                  <span className="text-3xl font-bold text-white tracking-tight">${amount}</span>
                  <span className="text-slate-400 font-medium">/{billingCycle}</span>
                </div>
                {savings > 0 && (
                  <span className="inline-block mt-1 px-2 py-0.5 bg-green-500/10 text-green-400 text-xs font-bold rounded-full border border-green-500/20">
                    Save {savings}%
                  </span>
                )}
              </div>
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent my-4"></div>

            {/* Feature List */}
            <ul className="space-y-3">
              {[
                "20 content generations per day",
                "URL processing & extraction",
                "Content library & history",
                "Advanced AI templates",
                "Priority 24/7 support"
              ].map((feature, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-slate-300">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                    <Check className="w-3 h-3 text-blue-400" />
                  </div>
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* Checkout Action */}
          <div className="space-y-4">
            <button
              onClick={handleCheckout}
              disabled={loading}
              className="w-full group relative py-4 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-900/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <span className="relative flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Secure Checkout
                    <ExternalLink className="w-4 h-4 opacity-70" />
                  </>
                )}
              </span>
            </button>

            <div className="flex items-center justify-center gap-4 text-[10px] text-slate-500 font-medium">
              <span className="flex items-center gap-1.5">
                <svg className="w-3 h-3 text-slate-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9v-2h2v2zm0-4H9V7h2v5z" /></svg>
                Secure by Dodo Payments
              </span>
              <span className="w-1 h-1 rounded-full bg-slate-700"></span>
              <span className="flex items-center gap-1.5">
                <svg className="w-3 h-3 text-slate-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" /></svg>
                SSL Encrypted
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>,
    document.body
  )
}

export default PaymentModal