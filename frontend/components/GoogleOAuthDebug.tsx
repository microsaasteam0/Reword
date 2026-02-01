'use client'

import { useState, useEffect } from 'react'

export default function GoogleOAuthDebug() {
  const [debugInfo, setDebugInfo] = useState<any>({})
  const [testResult, setTestResult] = useState<string>('')

  useEffect(() => {
    setDebugInfo({
      origin: window.location.origin,
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      nodeEnv: process.env.NODE_ENV,
      apiUrl: process.env.NEXT_PUBLIC_API_URL
    })
  }, [])

  const testGoogleAuth = () => {
    setTestResult('Testing...')
    
    try {
      if (typeof window !== 'undefined' && window.google) {
        
        window.google.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
          callback: (response: any) => {
            setTestResult('✅ Google Auth callback received!')
          },
          error_callback: (error: any) => {
            console.error('Google Auth Error:', error)
            setTestResult(`❌ Google Auth Error: ${JSON.stringify(error)}`)
          }
        })
        
        // Try to prompt for sign-in
        window.google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed()) {
            setTestResult(`⚠️ Not displayed: ${notification.getNotDisplayedReason()}`)
          } else if (notification.isSkippedMoment()) {
            setTestResult(`⚠️ Skipped: ${notification.getSkippedReason()}`)
          } else {
            setTestResult('✅ Google prompt displayed successfully!')
          }
        })
        
        // Also try to render the button
        const buttonElement = document.getElementById('google-test-button')
        if (buttonElement) {
          buttonElement.innerHTML = '' // Clear previous content
          window.google.accounts.id.renderButton(
            buttonElement,
            { 
              theme: 'outline', 
              size: 'large',
              type: 'standard',
              text: 'signin_with'
            }
          )
          setTestResult('✅ Google Sign-In button rendered!')
        }
        
      } else {
        setTestResult('❌ Google Identity Services not loaded')
        console.error('Google object not found:', window.google)
      }
    } catch (error: any) {
      console.error('Test error:', error)
      setTestResult(`❌ Error: ${error.message}`)
    }
  }

  return (
    <div className="fixed top-4 left-4 z-50 bg-gray-900 border border-gray-700 rounded-lg p-4 max-w-md shadow-xl">
      <h3 className="text-white font-semibold mb-3">🔍 Google OAuth Debug</h3>
      
      <div className="space-y-2 text-sm text-gray-300 mb-4">
        <div><strong>Origin:</strong> {debugInfo.origin}</div>
        <div><strong>Client ID:</strong> {debugInfo.clientId ? '✅ Set' : '❌ Missing'}</div>
        <div><strong>Environment:</strong> {debugInfo.nodeEnv}</div>
        <div><strong>API URL:</strong> {debugInfo.apiUrl}</div>
      </div>

      <div className="mb-4">
        <h4 className="text-white font-medium mb-2">Required Origins in Google Console:</h4>
        <div className="text-xs text-gray-400 space-y-1">
          <div>• http://localhost:3000</div>
          <div>• http://127.0.0.1:3000</div>
          <div>• http://snippetstream-app.eastus.azurecontainer.io</div>
        </div>
      </div>

      <button
        onClick={testGoogleAuth}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm mb-3"
      >
        Test Google Auth
      </button>

      <div id="google-test-button" className="mb-3"></div>

      {testResult && (
        <div className="text-xs p-2 bg-gray-800 rounded border">
          {testResult}
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-gray-700">
        <a 
          href="https://console.cloud.google.com/apis/credentials" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300 text-xs"
        >
          🔗 Open Google Console
        </a>
      </div>
    </div>
  )
}