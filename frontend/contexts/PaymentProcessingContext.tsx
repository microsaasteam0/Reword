'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'

interface PaymentProcessingContextType {
  isProcessingPayment: boolean
  setIsProcessingPayment: (processing: boolean) => void
}

const PaymentProcessingContext = createContext<PaymentProcessingContextType | undefined>(undefined)

export const PaymentProcessingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)

  return (
    <PaymentProcessingContext.Provider value={{ isProcessingPayment, setIsProcessingPayment }}>
      {children}
    </PaymentProcessingContext.Provider>
  )
}

export const usePaymentProcessing = () => {
  const context = useContext(PaymentProcessingContext)
  if (context === undefined) {
    throw new Error('usePaymentProcessing must be used within a PaymentProcessingProvider')
  }
  return context
}