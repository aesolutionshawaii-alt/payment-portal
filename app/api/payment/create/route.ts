import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const plaidConfig = new Configuration({
  basePath: PlaidEnvironments[process.env.NEXT_PUBLIC_PLAID_ENV as 'sandbox' | 'production'],
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
    const { amount, plaid_token, account_id } = await request.json()

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      )
    }

    console.log('Starting Stripe ACH payment for amount:', amount)

    // Step 1: Get bank account details from Plaid
    const authResponse = await plaidClient.authGet({
      access_token: plaid_token,
    })

    // Use specified account or fall back to first account
    const account = account_id
      ? authResponse.data.accounts.find(a => a.account_id === account_id) || authResponse.data.accounts[0]
      : authResponse.data.accounts[0]

    const achNumbers = authResponse.data.numbers.ach.find(a => a.account_id === account.account_id) || authResponse.data.numbers.ach[0]
    const accountNumber = achNumbers.account
    const routingNumber = achNumbers.routing

    console.log('Retrieved bank account from Plaid')

    // Step 2: Exchange Plaid token for Stripe bank account token
    const stripeTokenResponse = await plaidClient.processorStripeBankAccountTokenCreate({
      access_token: plaid_token,
      account_id: account.account_id,
    })

    const bankAccountToken = stripeTokenResponse.data.stripe_bank_account_token

    console.log('Got Stripe bank account token')

    // Step 3: Create or get Stripe customer
    let customerId: string
    
    const existingCustomers = await stripe.customers.list({
      email: 'tsutomu@example.com',
      limit: 1,
    })

    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id
      console.log('Using existing customer:', customerId)
    } else {
      const customer = await stripe.customers.create({
        email: 'tsutomu@example.com',
        name: 'Tsutomu Client',
      })
      customerId = customer.id
      console.log('Created new customer:', customerId)
    }

    // Step 4: Attach bank account to customer
let bankAccount
try {
  bankAccount = await stripe.customers.createSource(customerId, {
    source: bankAccountToken,
  })
  console.log('Attached bank account to customer')
} catch (error: any) {
  if (error.code === 'bank_account_exists') {
    // Get existing bank account
    const sources = await stripe.customers.listSources(customerId, {
      object: 'bank_account',
    })
    bankAccount = sources.data[0]
    console.log('Using existing bank account')
  } else {
    throw error
  }
}

    

    // Step 6: Create ACH charge
    const charge = await stripe.charges.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      customer: customerId,
      source: bankAccount.id,
      description: `Payment from Tsutomu - $${amount}`,
    })

    console.log('Charge created:', charge.id)

    return NextResponse.json({
      success: true,
      charge_id: charge.id,
      amount,
      status: charge.status,
    })
  } catch (error: any) {
    console.error('Payment error:', error)
    console.error('Error details:', error.message)
    
    return NextResponse.json(
      { 
        error: 'Payment failed',
        details: error.message 
      },
      { status: 500 }
    )
  }
}
