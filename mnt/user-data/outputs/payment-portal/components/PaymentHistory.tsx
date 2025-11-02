'use client'

import { useEffect, useState } from 'react'

interface Payment {
  id: string
  amount: number
  date: string
  status: string
}

export default function PaymentHistory() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/payment/history')
      .then(res => res.json())
      .then(data => {
        setPayments(data.payments || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="text-center text-gray-500">Loading...</div>
  }

  if (payments.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        No payments yet
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Payment History</h2>
      <div className="space-y-3">
        {payments.map((payment) => (
          <div
            key={payment.id}
            className="flex justify-between items-center p-4 bg-gray-50 rounded-lg"
          >
            <div>
              <div className="font-semibold">{formatAmount(payment.amount)}</div>
              <div className="text-sm text-gray-600">{formatDate(payment.date)}</div>
            </div>
            <div className={`text-sm font-medium ${
              payment.status === 'completed' ? 'text-green-600' : 'text-yellow-600'
            }`}>
              {payment.status}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
