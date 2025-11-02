'use client'

import { useState } from 'react'
import PlaidLink from '@/components/PlaidLink'
import PaymentForm from '@/components/PaymentForm'
import PaymentHistory from '@/components/PaymentHistory'
import Image from 'next/image'

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
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <Image 
              src="/ahitrooper_white1.png"
              alt="Tsutomu" 
              width={300} 
              height={100}
              className="opacity-90"
            />
          </div>
          <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-6"></div>
          <p className="text-gray-400 text-sm uppercase tracking-widest">Payment Portal</p>
        </div>
<p className="text-gray-500 text-xs mt-2">Powered by High Seas Hawaii Media Group Inc</p>
        {/* Main Card */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
            <div className="p-8 md:p-12">
              {!bankLinked ? (
                <div className="text-center py-12">
                  <h2 className="text-2xl font-light text-white mb-4">First Time Setup</h2>
                  <p className="text-gray-400 mb-12 max-w-md mx-auto">
                    Securely link your bank account to get started. This is a one-time setup that takes less than a minute.
                  </p>
                  <PlaidLink onSuccess={handleBankLinked} />
                </div>
              ) : (
                <>
                  <PaymentForm 
                    plaidToken={plaidToken} 
                    onPaymentComplete={handlePaymentComplete}
                  />
                  
                  <div className="mt-12 pt-8 border-t border-white/10">
                    <PaymentHistory key={refreshHistory} />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-gray-500 text-xs">
              Secured by Plaid & Dwolla • All transactions encrypted
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
