'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import PaymentForm from '@/components/PaymentForm'
import PaymentHistory from '@/components/PaymentHistory'
import PlaidLink from '@/components/PlaidLink'

export default function Home() {
  const [bankLinked, setBankLinked] = useState(false)
  const [accessToken, setAccessToken] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'bank' | 'card'>('bank')
  const [oauthRedirectUri, setOauthRedirectUri] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('plaid_access_token')
    if (token) {
      setAccessToken(token)
      setBankLinked(true)
    }

    // Check for OAuth redirect (user returning from bank authentication)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('oauth_state_id')) {
        // User is returning from OAuth - capture the full URL
        setOauthRedirectUri(window.location.href)
      }
    }
  }, [])

  const handleBankLinked = (token: string) => {
    localStorage.setItem('plaid_access_token', token)
    setAccessToken(token)
    setBankLinked(true)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="container mx-auto px-4 py-8 md:py-16">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <Image
              src="/ahitrooper_white1.png"
              alt="Logo"
              width={200}
              height={80}
              priority
            />
          </div>
          <p className="text-gray-500 text-xs mt-2">Powered by High Seas Hawaii Media Group Inc</p>
          <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-6"></div>
          <p className="text-gray-400 text-sm uppercase tracking-widest">Payment Portal</p>
        </div>

        {/* Main Card */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
            <div className="p-8 md:p-12">
              {!bankLinked && paymentMethod === 'bank' ? (
                <div className="text-center py-12">
                  <h2 className="text-2xl font-light text-white mb-4">First Time Setup</h2>
                  <p className="text-gray-400 mb-12 max-w-md mx-auto">
                    Securely link your bank account to get started. This is a one-time setup that takes less than a minute.
                  </p>
                  <PlaidLink onSuccess={handleBankLinked} receivedRedirectUri={oauthRedirectUri} />
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-light text-white mb-8">Send Payment</h2>
                  
                  {/* Payment Method Toggle */}
                  <div className="mb-8">
                    <div className="flex gap-4 p-1 bg-white/5 rounded-lg">
                      <button
                        onClick={() => setPaymentMethod('bank')}
                        className={`flex-1 py-3 px-4 rounded-md transition-all ${
                          paymentMethod === 'bank'
                            ? 'bg-white text-black font-medium'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        🏦 Bank Account (0.8% fee)
                      </button>
                      <button
                        onClick={() => setPaymentMethod('card')}
                        className={`flex-1 py-3 px-4 rounded-md transition-all ${
                          paymentMethod === 'card'
                            ? 'bg-white text-black font-medium'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        💳 Credit Card (2.9% + $0.30)
                      </button>
                    </div>
                  </div>

                  {paymentMethod === 'bank' && !bankLinked && (
                    <div className="mb-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <p className="text-blue-400 text-sm mb-4">Link your bank account to pay with ACH</p>
                      <PlaidLink onSuccess={handleBankLinked} receivedRedirectUri={oauthRedirectUri} />
                    </div>
                  )}

                  <PaymentForm 
                    plaidToken={accessToken} 
                    paymentMethod={paymentMethod}
                  />
                </>
              )}
            </div>
          </div>

          <PaymentHistory />

          <div className="text-center mt-8 text-gray-500 text-sm">
            Secured by Plaid & Stripe • All transactions encrypted
          </div>
        </div>
      </div>
    </main>
  )
}
