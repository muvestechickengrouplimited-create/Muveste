import { NextResponse } from 'next/server';
import { getRows } from '@/lib/sheets';

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const location = searchParams.get('location')

    const rows = await getRows('products')
    const products = rows.slice(1)
      .filter(row => {
        const available = row[5]?.toString().trim().toUpperCase() === 'TRUE' || row[5] === 'TRUE'
        if (location) {
          return available && 
            row[3]?.toString().trim().toLowerCase() === 
            location.toLowerCase()
        }
        return available
      })
      .map(row => ({
        id      : row[0]?.toString().trim() || '',
        name    : row[1]?.toString().trim() || '',
        category: row[2]?.toString().trim().toLowerCase() || '',
        location: row[3]?.toString().trim() || '',
        price   : parseFloat(row[4]?.toString().replace(/[^0-9.]/g, '')) || 0,
        available: row[5]?.toString().trim().toUpperCase() === 'TRUE' || row[5] === 'TRUE'
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
