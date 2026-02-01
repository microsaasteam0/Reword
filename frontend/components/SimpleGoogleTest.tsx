'use client'

import { useEffect } from 'react'

export default function SimpleGoogleTest() {
  useEffect(() => {
    // Load Google Identity Services
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    
    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: '812229233766-ro0kem734rb7q9rn0h07fmcrouqdb6ft.apps.googleusercontent.com',
          callback: (response: any) => {
            alert('Google Sign-In Success! Check console for token.')
          }
        })
        
        // Render button
        window.google.accounts.id.renderButton(
          document.getElementById('simple-google-button'),
          {
            theme: 'filled_blue',
            size: 'large',
            type: 'standard',
            text: 'signin_with'
          }
        )
      }
    }
    
    document.head.appendChild(script)
    
    return () => {
      document.head.removeChild(script)
    }
  }, [])

  return (
    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-white p-8 rounded-lg shadow-xl">
      <h2 className="text-black text-xl mb-4">Simple Google Test</h2>
      <div id="simple-google-button"></div>
      <p className="text-gray-600 text-sm mt-4">This should show a Google Sign-In button</p>
    </div>
  )
}