'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Crown, Zap, ArrowRight } from 'lucide-react'
import { useFeatureGate } from '../hooks/useFeatureGate'

interface FeatureGateProps {
  feature: string
  children: React.ReactNode
  fallback?: React.ReactNode
  showUpgradePrompt?: boolean
  className?: string
}

interface UpgradePromptModalProps {
  isOpen: boolean
  onClose: () => void
  feature: string
  onUpgrade: () => void
}

const UpgradePromptModal: React.FC<UpgradePromptModalProps> = ({
  isOpen,
  onClose,
  feature,
  onUpgrade
}) => {
  const { getUpgradePrompt } = useFeatureGate()
  const [promptData, setPromptData] = useState<any>(null)

  React.useEffect(() => {
    if (isOpen && feature) {
      getUpgradePrompt(feature).then(setPromptData)
    }
  }, [isOpen, feature, getUpgradePrompt])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 dark:bg-black/50 bg-black/30 backdrop-blur-sm z-[120] flex items-center justify-center p-4">
      <div className="dark:bg-gray-800 bg-white rounded-2xl border dark:border-gray-700 border-gray-200 max-w-md w-full p-6 relative shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 dark:text-gray-400 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          ✕
        </button>

        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Crown className="w-8 h-8 text-white" />
          </div>

          <h3 className="text-xl font-bold dark:text-white text-gray-900 mb-2">
            {promptData?.title || 'Upgrade to Pro'}
          </h3>

          <p className="dark:text-gray-300 text-gray-600 mb-6">
            {promptData?.message || 'Unlock this feature and many more with Pro.'}
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={onUpgrade}
              className="w-full py-3 px-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl font-semibold transition-all duration-200 flex items-center justify-center shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              <Crown className="w-5 h-5 mr-2" />
              {promptData?.cta || 'Upgrade Now'}
            </button>

            <button
              onClick={onClose}
              className="w-full py-3 px-6 dark:bg-gray-700 bg-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600 dark:text-white text-gray-700 rounded-xl font-medium transition-all duration-200"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export const FeatureGate: React.FC<FeatureGateProps> = ({
  feature,
  children,
  fallback,
  showUpgradePrompt = true,
  className = ''
}) => {
  const featureGate = useFeatureGate()
  const [showModal, setShowModal] = useState(false)
  const router = useRouter()

  // Feature access mapping
  const hasAccess = React.useMemo(() => {
    switch (feature) {
      case 'save_content':
        return featureGate.canSaveContent
      case 'url_processing':
        return featureGate.canProcessUrls
      case 'analytics':
        return featureGate.canAccessAnalytics
      case 'advanced_templates':
        return featureGate.canUseAdvancedTemplates
      case 'branding':
        return featureGate.canCustomizeBranding
      case 'export':
        return featureGate.exportFormats.length > 1
      default:
        return true
    }
  }, [feature, featureGate])

  const handleUpgrade = () => {
    setShowModal(false)
    // Use Next.js router to navigate to pricing page
    router.push('/pricing')
  }

  if (hasAccess) {
    return <>{children}</>
  }

  if (fallback) {
    return <>{fallback}</>
  }

  // Default locked state with upgrade prompt
  return (
    <div className={`relative ${className}`}>
      <div className="relative opacity-50 pointer-events-none">
        {children}
      </div>

      {showUpgradePrompt && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm rounded-lg">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105"
          >
            <Lock className="w-4 h-4" />
            <span>Upgrade to Unlock</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      <UpgradePromptModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        feature={feature}
        onUpgrade={handleUpgrade}
      />
    </div>
  )
}

interface ProBadgeProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export const ProBadge: React.FC<ProBadgeProps> = ({
  className = '',
  size = 'sm'
}) => {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  }

  return (
    <span className={`inline-flex items-center gap-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full font-medium ${sizeClasses[size]} ${className}`}>
      <Crown className="w-3 h-3" />
      PRO
    </span>
  )
}

interface UsageCounterProps {
  className?: string
  stats?: {
    remaining_requests?: number
    rate_limit?: number
    recent_generations?: number
    [key: string]: any
  } | null
}

export const UsageCounter: React.FC<UsageCounterProps> = ({ className = '', stats }) => {
  const { remainingGenerations: fgRemaining, generationLimit: fgLimit, tier, loading } = useFeatureGate()

  // remaining vs total logic
  const remaining = stats !== undefined && stats !== null
    ? (stats.remaining_requests ?? stats.remaining_generations ?? (stats.rate_limit !== undefined && stats.recent_generations !== undefined ? stats.rate_limit - stats.recent_generations : null) ?? fgRemaining)
    : fgRemaining

  const limit = stats !== undefined && stats !== null
    ? (stats.rate_limit ?? stats.generation_limit ?? fgLimit)
    : fgLimit

  if (loading || tier === 'pro') return null

  const percentage = limit > 0 && limit !== Infinity
    ? Math.max(0, Math.min(100, (remaining / limit) * 100))
    : 0
  const isLow = remaining <= 1 && limit !== Infinity

  return (
    <div className={`dark:bg-gray-800/50 bg-white border dark:border-gray-700 border-gray-200 rounded-lg p-3 shadow-sm ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm dark:text-gray-300 text-gray-600 font-medium tracking-tight">Daily Generations</span>
        <span className={`text-sm font-bold ${isLow ? 'text-red-500' : 'text-blue-600'}`}>
          {limit === Infinity ? 'Unlimited' : ` ${remaining}/${limit} left`}
        </span>
      </div>

      <div className="w-full dark:bg-gray-700 bg-gray-100 rounded-full h-3 overflow-hidden shadow-inner">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-out shadow-sm ${isLow ? 'bg-gradient-to-r from-red-400 to-rose-600' : 'bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-600'
            }`}
          style={{ width: `${limit === Infinity ? 100 : percentage}%` }}
        />
      </div>

      {remaining <= 1 && limit !== Infinity && (
        <div className="mt-2 flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-yellow-500 animate-pulse" />
          <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
            {remaining === 0 ? 'Limit reached!' : 'Only 1 left!'} Upgrade for more.
          </span>
        </div>
      )}
    </div>
  )
}

export default FeatureGate