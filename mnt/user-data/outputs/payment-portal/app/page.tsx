'use client'

import { useState } from 'react'
import PlaidLink from '@/components/PlaidLink'
import PaymentForm from '@/components/PaymentForm'
import PaymentHistory from '@/components/PaymentHistory'

export default function Home() {
  const [bankLinked, setBankLinked] = useState(false)
  const [plaidToken, setPlaidToken] = useState('')
  const [refreshHistory, setRefreshHistory] = useState(0)

  const handleBankLinked = (publicToken: string) => {
    setBankLinked(true)
    setPlaidToken(publicToken)
  }

  const handlePaymentComplete = () => {
    setRefreshHistory(prev => prev + 1)
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Josh × Tsutomu
          </h1>
          <p className="text-gray-600 mb-8">Monthly Payment Portal</p>

          {!bankLinked ? (
            <div className="text-center py-12">
              <h2 className="text-xl font-semibold mb-4">First Time Setup</h2>
              <p className="text-gray-600 mb-8">
                Link your bank account to get started. This is a one-time setup.
              </p>
              <PlaidLink onSuccess={handleBankLinked} />
            </div>
          ) : (
            <>
              <PaymentForm 
                plaidToken={plaidToken} 
                onPaymentComplete={handlePaymentComplete}
              />
              
              <div className="mt-8 pt-8 border-t border-gray-200">
                <PaymentHistory key={refreshHistory} />
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
