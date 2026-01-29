'use client'

import { useState } from 'react'
import { AlertTriangle, X, Crown, Clock } from 'lucide-react'
import { useSubscription } from '../contexts/SubscriptionContext'
import { useAuth } from '../contexts/AuthContext'

interface SubscriptionWarningProps {
  onUpgradeClick?: () => void
}

export default function SubscriptionWarning({ onUpgradeClick }: SubscriptionWarningProps) {
  const { user } = useAuth()
  const { subscriptionInfo, isInGracePeriod, daysUntilExpiry, showExpirationWarning } = useSubscription()
  const [isDismissed, setIsDismissed] = useState(false)

  if (!showExpirationWarning || isDismissed || !user?.is_premium) {
    return null
  }

  const getWarningContent = () => {
    if (isInGracePeriod) {
      return {
        title: 'Subscription Expired - Grace Period Active',
        message: 'Your subscription has expired but you still have access for a few more days. Renew now to avoid losing premium features.',
        urgency: 'high',
        icon: AlertTriangle,
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        borderColor: 'border-red-200 dark:border-red-800',
        textColor: 'text-red-800 dark:text-red-200',
        buttonColor: 'bg-red-600 hover:bg-red-700'
      }
    } else if (daysUntilExpiry !== null && daysUntilExpiry <= 1) {
      return {
        title: 'Subscription Expires Tomorrow',
        message: 'Your premium subscription expires in less than 24 hours. Renew now to continue enjoying premium features.',
        urgency: 'high',
        icon: AlertTriangle,
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        borderColor: 'border-red-200 dark:border-red-800',
        textColor: 'text-red-800 dark:text-red-200',
        buttonColor: 'bg-red-600 hover:bg-red-700'
      }
    } else if (daysUntilExpiry !== null && daysUntilExpiry <= 3) {
      return {
        title: `Subscription Expires in ${daysUntilExpiry} Days`,
        message: 'Your premium subscription is expiring soon. Renew now to avoid any interruption to your premium features.',
        urgency: 'medium',
        icon: Clock,
        bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
        borderColor: 'border-yellow-200 dark:border-yellow-800',
        textColor: 'text-yellow-800 dark:text-yellow-200',
        buttonColor: 'bg-yellow-600 hover:bg-yellow-700'
      }
    }

    return null
  }

  const warningContent = getWarningContent()
  if (!warningContent) return null

  const { title, message, icon: Icon, bgColor, borderColor, textColor, buttonColor } = warningContent

  return (
    <div className={`${bgColor} ${borderColor} border rounded-lg p-4 mb-4 relative`}>
      <button
        onClick={() => setIsDismissed(true)}
        className={`absolute top-2 right-2 ${textColor} hover:opacity-70`}
        aria-label="Dismiss warning"
      >
        <X size={16} />
      </button>

      <div className="flex items-start space-x-3 pr-6">
        <Icon className={`${textColor} mt-0.5 flex-shrink-0`} size={20} />

        <div className="flex-1">
          <h3 className={`font-semibold ${textColor} text-sm mb-1`}>
            {title}
          </h3>
          <p className={`${textColor} text-sm mb-3 opacity-90`}>
            {message}
          </p>

          <div className="flex items-center space-x-3">
            <button
              onClick={onUpgradeClick}
              className={`${buttonColor} text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2`}
            >
              <Crown size={16} />
              <span>Renew Subscription</span>
            </button>

            {subscriptionInfo && (
              <div className={`${textColor} text-xs opacity-75`}>
                Plan: {subscriptionInfo.plan_type} ({subscriptionInfo.billing_cycle})
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}