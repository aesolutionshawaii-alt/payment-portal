import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
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

    console.log('Starting Stripe ACH payment for amount:', amount)

    // Step 1: Get bank account details from Plaid
    const authResponse = await plaidClient.authGet({
      access_token: plaid_token,
    })

    const account = authResponse.data.accounts[0]
    const accountNumber = authResponse.data.numbers.ach[0].account
    const routingNumber = authResponse.data.numbers.ach[0].routing

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
    const bankAccount = await stripe.customers.createSource(customerId, {
      source: bankAccountToken,
    })

    console.log('Attached bank account to customer')

    // Step 5: Verify bank account (in test mode, this is instant)
    if (bankAccount.object === 'bank_account') {
      await stripe.customers.verifySource(
        customerId,
        bankAccount.id,
        { amounts: [32, 45] } // Test amounts for sandbox
      )
      console.log('Verified bank account')
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
