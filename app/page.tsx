'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import PaymentForm from '@/components/PaymentForm'
import PaymentHistory from '@/components/PaymentHistory'
import PlaidLink from '@/components/PlaidLink'

interface BankAccount {
  id: string
  name: string
  mask: string
  type: string
  balance: number | null
}

export default function Home() {
  const [bankLinked, setBankLinked] = useState(false)
  const [accessToken, setAccessToken] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'bank' | 'card'>('bank')
  const [oauthRedirectUri, setOauthRedirectUri] = useState<string | null>(null)
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [selectedAccountId, setSelectedAccountId] = useState<string>('')
  const [loadingAccounts, setLoadingAccounts] = useState(false)

  // Fetch accounts when we have an access token
  const fetchAccounts = async (token: string) => {
    setLoadingAccounts(true)
    try {
      const res = await fetch('/api/plaid/get-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: token }),
      })
      const data = await res.json()
      if (data.accounts && data.accounts.length > 0) {
        setAccounts(data.accounts)
        // Use saved account or default to first
        const savedAccountId = localStorage.getItem('selected_account_id')
        if (savedAccountId && data.accounts.find((a: BankAccount) => a.id === savedAccountId)) {
          setSelectedAccountId(savedAccountId)
        } else {
          setSelectedAccountId(data.accounts[0].id)
        }
      }
    } catch (err) {
      console.error('Error fetching accounts:', err)
    } finally {
      setLoadingAccounts(false)
    }
  }

  useEffect(() => {
    const token = localStorage.getItem('plaid_access_token')
    if (token) {
      setAccessToken(token)
      setBankLinked(true)
      fetchAccounts(token)
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
    fetchAccounts(token)
  }

  const handleChangeBank = () => {
    // Clear stored tokens to force re-linking
    localStorage.removeItem('plaid_access_token')
    localStorage.removeItem('plaid_link_token')
    localStorage.removeItem('selected_account_id')
    setAccessToken('')
    setBankLinked(false)
    setAccounts([])
    setSelectedAccountId('')
  }

  const handleAccountChange = (accountId: string) => {
    setSelectedAccountId(accountId)
    localStorage.setItem('selected_account_id', accountId)
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

                  {paymentMethod === 'bank' && bankLinked && accounts.length > 0 && (
                    <div className="mb-8 p-4 bg-white/5 border border-white/10 rounded-lg">
                      <div className="flex justify-between items-center mb-3">
                        <label className="text-gray-400 text-sm font-medium uppercase tracking-wider">
                          Pay From
                        </label>
                        <button
                          onClick={handleChangeBank}
                          className="text-blue-400 text-sm hover:text-blue-300 transition-colors"
                        >
                          Change Bank
                        </button>
                      </div>
                      <select
                        value={selectedAccountId}
                        onChange={(e) => handleAccountChange(e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
                      >
                        {accounts.map((account) => (
                          <option key={account.id} value={account.id} className="bg-gray-900">
                            {account.name} (****{account.mask}) - {account.type}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {paymentMethod === 'bank' && bankLinked && loadingAccounts && (
                    <div className="mb-8 p-4 bg-white/5 border border-white/10 rounded-lg">
                      <p className="text-gray-400 text-sm">Loading accounts...</p>
                    </div>
                  )}

                  <PaymentForm
                    plaidToken={accessToken}
                    paymentMethod={paymentMethod}
                    accountId={selectedAccountId}
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
