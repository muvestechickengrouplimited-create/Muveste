import { NextResponse } from 'next/server';
import { getRows } from '@/lib/sheets';

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    console.log('Fetching products from sheet...')
    const rows = await getRows('products', true)
    console.log('Raw products rows:', rows)
    
    const products = rows.slice(1)
      .filter(row => row[1] && row[2]) // Ensure basic data exists
      .map(row => ({
        id: row[0],
        name: row[1],
        category: row[2]?.toLowerCase().trim(),
        price: parseFloat(row[3]?.toString().replace(/[^0-9.]/g, '')) || 0,
        available: row[4]?.toString().toUpperCase() === 'TRUE'
      }))
    
    console.log('Parsed products:', products)
    return NextResponse.json(
      { success: true, data: products },
      { 
        headers: {
          'Cache-Control': 
            'no-store, no-cache, must-revalidate',
        }
      }
    )
  } catch (error) {
    console.error('Products fetch error:', error)
    return NextResponse.json(
      { success: false, data: [] },
      { status: 500 }
    )
  }
}
