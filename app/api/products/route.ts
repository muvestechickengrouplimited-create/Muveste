import { NextResponse } from 'next/server';
import { getRows } from '@/lib/sheets';

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const rows = await getRows('products')
    
    // Skip header row
    const products = rows.slice(1)
      .filter(row => row[4]?.toString().trim().toUpperCase() === 'TRUE')
      .map(row => ({
        id      : row[0]?.toString().trim(),
        name    : row[1]?.toString().trim(),
        category: row[2]?.toString().trim().toLowerCase(),
        price   : parseFloat(row[3]?.toString().replace(/[^0-9.]/g, '')) || 0,
        available: row[4]?.toString().trim().toUpperCase() === 'TRUE'
      }))

    return NextResponse.json({ 
      success: true, 
      products 
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, products: [] },
      { status: 500 }
    )
  }
}
