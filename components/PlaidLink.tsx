'use client'

import { usePlaidLink } from 'react-plaid-link'
import { useEffect, useState } from 'react'

interface PlaidLinkProps {
  onSuccess: (publicToken: string) => void
}

export default function PlaidLink({ onSuccess }: PlaidLinkProps) {
  const [linkToken, setLinkToken] = useState<string | null>(null)

  useEffect(() => {
    // Get link token from API
    fetch('/api/plaid/create-link-token')
      .then(res => res.json())
      .then(data => setLinkToken(data.link_token))
  }, [])

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: (public_token) => {
      // Exchange public token for access token
      fetch('/api/plaid/exchange-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ public_token })
      })
        .then(res => res.json())
        .then(data => {
          onSuccess(data.access_token)
        })
    },
  })

  return (
    <button
      onClick={() => open()}
      disabled={!ready}
      className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
    >
      Link Bank Account
    </button>
  )
}
