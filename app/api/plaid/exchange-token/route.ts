export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server'
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid'

const configuration = new Configuration({
  basePath: PlaidEnvironments[process.env.NEXT_PUBLIC_PLAID_ENV as 'sandbox' | 'production'],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
})

const plaidClient = new PlaidApi(configuration)

export async function POST(request: NextRequest) {
  try {
    const { public_token } = await request.json()

    const response = await plaidClient.itemPublicTokenExchange({
      public_token,
    })

    return NextResponse.json({
      access_token: response.data.access_token,
      item_id: response.data.item_id,
    })
  } catch (error) {
    console.error('Error exchanging token:', error)
    return NextResponse.json(
      { error: 'Failed to exchange token' },
      { status: 500 }
    )
  }
}
