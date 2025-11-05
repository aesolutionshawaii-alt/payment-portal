'use client'

import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface PaymentFormProps {
  plaidToken: string
  paymentMethod?: 'bank' | 'card'

  onPaymentComplete?: () => void  // ✅ added this line
}

function PaymentFormContent({ plaidToken, paymentMethod, onPaymentComplete }: PaymentFormProps) {
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const stripe = useStripe()
  const elements = useElements()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount')
      return
    }

    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      if (paymentMethod === 'card') {
        if (!stripe || !elements) throw new Error('Stripe not loaded')

        const cardElement = elements.getElement(CardElement)
        if (!cardElement) throw new Error('Card element not found')

        const response = await fetch('/api/payment/create-card-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: parseFloat(amount) }),
        })

        const { clientSecret } = await response.json()
        const result = await stripe.confirmCardPayment(clientSecret, {
          payment_method: { card: cardElement },
        })

        if (result.error) throw new Error(result.error.message)

        setSuccess(true)
        setAmount('')
        cardElement.clear()
      } else {
        const response = await fetch('/api/payment/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: parseFloat(amount), plaid_token: plaidToken }),
        })

        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Payment failed')

        setSuccess(true)
        setAmount('')
      }

      // ✅ trigger callback when payment completes
      onPaymentComplete?.()

      // Refresh payment history
      setTimeout(() => window.location.reload(), 1500)
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* (rest of your JSX unchanged) */}
    </form>
  )
}

export default function PaymentForm(props: PaymentFormProps) {
  // set a default if it's missing
  const method = props.paymentMethod ?? 'bank';

  return (
    <Elements stripe={stripePromise}>
      <PaymentFormContent
        plaidToken={props.plaidToken}
        paymentMethod={method}
        onPaymentComplete={props.onPaymentComplete}
      />
    </Elements>
  );
}
