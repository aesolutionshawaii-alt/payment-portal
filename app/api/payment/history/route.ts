import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // In a real app, you would:
    // 1. Query Dwolla for transfer history
    // 2. Or query your own database for payment records
    
    // For now, returning mock data
    const payments = [
      {
        id: '1',
        amount: 1300,
        date: new Date().toISOString(),
        status: 'completed'
      }
    ]

    return NextResponse.json({ payments })
  } catch (error) {
    console.error('Error fetching payment history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payment history' },
      { status: 500 }
    )
  }
}
