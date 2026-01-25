'use client'

import { Crown, Clock, AlertTriangle, CheckCircle } from 'lucide-react'
import { useSubscription } from '../contexts/SubscriptionContext'
import { useAuth } from '../contexts/AuthContext'

interface SubscriptionStatusProps {
  showDetails?: boolean
  compact?: boolean
  onUpgradeClick?: () => void
}

export default function SubscriptionStatus({ 
  showDetails = true, 
  compact = false,
  onUpgradeClick 
}: SubscriptionStatusProps) {
  const { user } = useAuth()
  const { subscriptionInfo, isInGracePeriod, daysUntilExpiry, isLoading } = useSubscription()

  if (!user) return null

  if (isLoading) {
    return (
      <div className={`flex items-center space-x-2 ${compact ? 'text-sm' : ''}`}>
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-600"></div>
        <span className="text-gray-600 dark:text-gray-400">Checking status...</span>
      </div>
    )
  }

  if (!user.is_premium) {
    return (
      <div className={`flex items-center space-x-2 ${compact ? 'text-sm' : ''}`}>
        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
        <span className="text-gray-600 dark:text-gray-400">Free Plan</span>
        {onUpgradeClick && (
          <button
            onClick={onUpgradeClick}
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
          >
            Upgrade
          </button>
        )}
      </div>
    )
  }

  const getStatusDisplay = () => {
    if (isInGracePeriod) {
      return {
        icon: AlertTriangle,
        color: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-100 dark:bg-red-900/20',
        status: 'Grace Period',
        message: 'Subscription expired - limited time remaining'
      }
    } else if (daysUntilExpiry !== null && daysUntilExpiry <= 3) {
      return {
        icon: Clock,
        color: 'text-yellow-600 dark:text-yellow-400',
        bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
        status: 'Expiring Soon',
        message: `Expires in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}`
      }
    } else {
      return {
        icon: Crown,
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-100 dark:bg-green-900/20',
        status: 'Premium Active',
        message: subscriptionInfo?.expiry_info || 'Active subscription'
      }
    }
  }

  const { icon: Icon, color, bgColor, status, message } = getStatusDisplay()

  if (compact) {
    return (
      <div className="flex items-center space-x-2">
        <div className={`p-1 rounded-full ${bgColor}`}>
          <Icon className={`${color} w-3 h-3`} />
        </div>
        <span className={`text-sm font-medium ${color}`}>
          {status}
        </span>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-full ${bgColor}`}>
            <Icon className={`${color} w-5 h-5`} />
          </div>
          
          <div>
            <h3 className={`font-semibold ${color}`}>
              {status}
            </h3>
            {showDetails && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {message}
              </p>
            )}
            
            {showDetails && subscriptionInfo && (
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                <div>Plan: {subscriptionInfo.plan_type}</div>
                <div>Billing: {subscriptionInfo.billing_cycle}</div>
                {subscriptionInfo.amount && (
                  <div>
                    Amount: ${subscriptionInfo.amount}/{subscriptionInfo.billing_cycle === 'monthly' ? 'mo' : 'yr'}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {(isInGracePeriod || (daysUntilExpiry !== null && daysUntilExpiry <= 3)) && onUpgradeClick && (
          <button
            onClick={onUpgradeClick}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm font-medium transition-colors"
          >
            Renew
          </button>
        )}
      </div>
    </div>
  )
}