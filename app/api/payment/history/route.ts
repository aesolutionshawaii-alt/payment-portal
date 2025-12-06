import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function GET() {
  try {
    // Fetch charges from Stripe for the customer
    const charges = await stripe.charges.list({
      limit: 50,
      customer: await getCustomerId(),
    })

   const payments = charges.data
  .filter(charge => charge.amount >= 1000) // Only show payments $10 or more (1000 cents)
  .map(charge => ({
      id: charge.id,
      amount: charge.amount / 100,
      date: new Date(charge.created * 1000).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
      status: charge.status === 'succeeded' ? 'completed' : charge.status,
    }))

    return NextResponse.json({ payments })
  } catch (error: any) {
    console.error('Error fetching payment history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payment history', payments: [] },
      { status: 500 }
    )
  }
}

async function getCustomerId() {
  // Get or create customer for Tsutomu
  const customers = await stripe.customers.list({
    email: 'tsutomu@example.com',
    limit: 1,
  })

  if (customers.data.length > 0) {
    return customers.data[0].id
  }

  const customer = await stripe.customers.create({
    email: 'tsutomu@example.com',
    name: 'Tsutomu Client',
  })

  return customer.id
}
