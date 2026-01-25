'use client'

import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function GoogleAuthTest() {
  const [isVisible, setIsVisible] = useState(false)
  const { user, isAuthenticated, logout } = useAuth()

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsVisible(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-lg text-sm"
        >
          🧪 Test Auth
        </button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-gray-900 border border-gray-700 rounded-lg p-4 max-w-sm shadow-xl">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-white font-semibold">Auth Test Panel</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="text-gray-300">
          <strong>Status:</strong> {isAuthenticated ? '✅ Authenticated' : '❌ Not authenticated'}
        </div>
        
        {user && (
          <div className="text-gray-300 space-y-1">
            <div><strong>Email:</strong> {user.email}</div>
            <div><strong>Username:</strong> {user.username}</div>
            <div><strong>Name:</strong> {user.full_name || 'Not set'}</div>
            <div><strong>Premium:</strong> {user.is_premium ? 'Yes' : 'No'}</div>
            <div><strong>Verified:</strong> {user.is_verified ? 'Yes' : 'No'}</div>
          </div>
        )}
        
        {isAuthenticated && (
          <button
            onClick={logout}
            className="w-full mt-3 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
          >
            Logout
          </button>
        )}
        
        <div className="mt-3 pt-3 border-t border-gray-700">
          <div className="text-xs text-gray-400">
            Environment: {process.env.NODE_ENV}
          </div>
          <div className="text-xs text-gray-400">
            API: {process.env.NEXT_PUBLIC_API_URL}
          </div>
          <div className="text-xs text-gray-400">
            Google Client ID: {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? '✅ Set' : '❌ Missing'}
          </div>
          <div className="text-xs text-gray-400">
            Current Origin: {typeof window !== 'undefined' ? window.location.origin : 'Loading...'}
          </div>
        </div>
      </div>
    </div>
  )
}