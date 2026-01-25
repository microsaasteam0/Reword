'use client'

import { Loader2 } from 'lucide-react'

export default function PageLoader() {
  return (
    <div className="fixed inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="text-center">
        <div className="relative">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
          <div className="absolute -inset-2 bg-blue-500/20 rounded-full animate-pulse"></div>
        </div>
        <p className="text-gray-600 dark:text-gray-300 font-medium">Loading...</p>
      </div>
    </div>
  )
}