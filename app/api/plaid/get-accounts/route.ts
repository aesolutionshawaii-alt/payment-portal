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
    const { access_token } = await request.json()

    const response = await plaidClient.accountsGet({
      access_token,
    })

    // Filter to only checking and savings accounts
    const accounts = response.data.accounts
      .filter(acc => acc.type === 'depository')
      .map(acc => ({
        id: acc.account_id,
        name: acc.name,
        mask: acc.mask,
        type: acc.subtype,
        balance: acc.balances.available || acc.balances.current,
      }))

    return NextResponse.json({ accounts })
  } catch (error) {
    console.error('Error getting accounts:', error)
    return NextResponse.json(
      { error: 'Failed to get accounts' },
      { status: 500 }
    )
  }
}
