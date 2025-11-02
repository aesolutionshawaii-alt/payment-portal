'use client'

import { useState } from 'react'

interface PaymentFormProps {
  plaidToken: string
  onPaymentComplete: () => void
}

export default function PaymentForm({ plaidToken, onPaymentComplete }: PaymentFormProps) {
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      const response = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(amount),
          plaid_token: plaidToken
        })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        setAmount('')
        onPaymentComplete()
        setTimeout(() => setSuccess(false), 5000)
      } else {
        setError(data.error || 'Payment failed')
      }
    } catch (err) {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-light text-white mb-8">Send Payment</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-400 mb-3 uppercase tracking-wider">
            Amount
          </label>
          <div className="relative">
            <span className="absolute left-6 top-1/2 transform -translate-y-1/2 text-2xl text-gray-400">
              $
            </span>
            <input
              id="amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
              className="w-full pl-12 pr-6 py-5 bg-white/5 border border-white/10 rounded-xl text-white text-2xl focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent placeholder-gray-600 transition-all"
            />
          </div>
          <p className="mt-2 text-xs text-gray-500">Enter the amount you wish to send</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-xl text-sm flex items-center gap-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Payment initiated successfully!
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !amount}
          className="w-full bg-white text-black py-5 rounded-xl font-semibold hover:bg-gray-100 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-3">
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </span>
          ) : (
            'Send Payment'
          )}
        </button>
      </form>
    </div>
  )
}
