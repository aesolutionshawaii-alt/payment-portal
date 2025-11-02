import { NextRequest, NextResponse } from 'next/server'
import { Client } from 'dwolla-v2'

const dwolla = new Client({
  key: process.env.DWOLLA_KEY!,
  secret: process.env.DWOLLA_SECRET!,
  environment: process.env.DWOLLA_ENVIRONMENT as 'sandbox' | 'production',
})

export async function POST(request: NextRequest) {
  try {
    const { amount, plaid_token } = await request.json()

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      )
    }

    // In a real app, you would:
    // 1. Get bank account details from Plaid using plaid_token
    // 2. Create a funding source in Dwolla with those details
    // 3. Initiate a transfer from their account to yours

    // For now, this is a placeholder that shows the structure
    // You'll need to implement the full Dwolla integration

    // Simulated response for sandbox testing
    const transferId = `transfer-${Date.now()}`

    return NextResponse.json({
      success: true,
      transfer_id: transferId,
      amount,
      status: 'pending',
    })
  } catch (error) {
    console.error('Payment error:', error)
    return NextResponse.json(
      { error: 'Payment failed' },
      { status: 500 }
    )
  }
}
