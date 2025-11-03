import { NextRequest, NextResponse } from 'next/server'
import { Client } from 'dwolla-v2'
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid'

const dwolla = new Client({
  key: process.env.DWOLLA_KEY!,
  secret: process.env.DWOLLA_SECRET!,
  environment: process.env.DWOLLA_ENVIRONMENT as 'sandbox' | 'production',
})

const plaidConfig = new Configuration({
  basePath: PlaidEnvironments.sandbox,
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID!,
      'PLAID-SECRET': process.env.PLAID_SECRET!,
    },
  },
})

const plaidClient = new PlaidApi(plaidConfig)

export async function POST(request: NextRequest) {
  try {
    const { amount, plaid_token } = await request.json()

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      )
    }

    console.log('Starting payment process for amount:', amount)

    // Step 1: Get bank account details from Plaid
    const authResponse = await plaidClient.authGet({
      access_token: plaid_token,
    })

    const account = authResponse.data.accounts[0]
    const accountNumber = authResponse.data.numbers.ach[0].account
    const routingNumber = authResponse.data.numbers.ach[0].routing

    console.log('Retrieved bank account from Plaid')

    // Step 2: Create or get Dwolla customer
    let customerUrl: string
    
    try {
      const customerResponse = await dwolla.post('customers', {
        firstName: 'Tsutomu',
        lastName: 'Client',
        email: 'tsutomu@example.com',
        type: 'receive-only',
      })
      customerUrl = customerResponse.headers.get('location')!
      console.log('Created Dwolla customer:', customerUrl)
    } catch (error: any) {
      // Customer might already exist
      if (error.body?._embedded?.errors?.[0]?.code === 'duplicate') {
        // Get existing customer
        const customers = await dwolla.get('customers', {
          search: 'tsutomu@example.com',
        })
        customerUrl = customers.body._embedded.customers[0]._links.self.href
        console.log('Using existing Dwolla customer:', customerUrl)
      } else {
        throw error
      }
    }

    // Step 3: Create funding source (bank account) for customer
    const fundingSourceResponse = await dwolla.post(
      `${customerUrl}/funding-sources`,
      {
        routingNumber: routingNumber,
        accountNumber: accountNumber,
        bankAccountType: 'checking',
        name: account.name,
      }
    )
    const sourceFundingSourceUrl = fundingSourceResponse.headers.get('location')!
    console.log('Created funding source:', sourceFundingSourceUrl)

    // Step 4: Get your Schwab funding source URL
    // In production, you'd have this stored. For sandbox, we'll create it
    let destinationFundingSourceUrl: string

    try {
      // Try to create your Schwab account as a funding source
      const schwabResponse = await dwolla.post('funding-sources', {
        routingNumber: '121202211',
        accountNumber: '440050477254',
        bankAccountType: 'checking',
        name: 'Josh Schwab Account',
      })
      destinationFundingSourceUrl = schwabResponse.headers.get('location')!
      console.log('Created destination funding source:', destinationFundingSourceUrl)
    } catch (error: any) {
      // If it already exists, get it
      const fundingSources = await dwolla.get('funding-sources')
      const schwabSource = fundingSources.body._embedded['funding-sources'].find(
        (fs: any) => fs.name === 'Josh Schwab Account'
      )
      if (schwabSource) {
        destinationFundingSourceUrl = schwabSource._links.self.href
      } else {
        throw new Error('Could not find or create destination funding source')
      }
    }

    // Step 5: Create the transfer
    const transferResponse = await dwolla.post('transfers', {
      _links: {
        source: {
          href: sourceFundingSourceUrl,
        },
        destination: {
          href: destinationFundingSourceUrl,
        },
      },
      amount: {
        currency: 'USD',
        value: amount.toFixed(2),
      },
    })

    const transferUrl = transferResponse.headers.get('location')!
    const transferId = transferUrl.split('/').pop()

    console.log('Transfer created:', transferUrl)

    return NextResponse.json({
      success: true,
      transfer_id: transferId,
      amount,
      status: 'pending',
    })
  } catch (error: any) {
    console.error('Payment error:', error)
    console.error('Error details:', error.body || error.message)
    
    return NextResponse.json(
      { 
        error: 'Payment failed',
        details: error.body?._embedded?.errors || error.message 
      },
      { status: 500 }
    )
  }
}
