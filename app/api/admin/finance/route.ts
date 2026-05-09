import { NextResponse } from 'next/server';
import { getRows } from '../../../../lib/sheets';
import admin from '../../../../lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const token = await admin.auth().verifyIdToken(authHeader.split('Bearer ')[1]);
    const emailLower = token.email?.toLowerCase();
    if (emailLower !== 'admin@muveste.com') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const rows = await getRows('finance-summary');
    if (!rows || rows.length <= 1) return NextResponse.json([]);

    let data = rows.slice(1);

    // Convert to objects mirroring standard finance response
    // Updated column mapping: no longer has egg farm or kiosk columns
    // Columns: date(0), bfRev(1), bfExp(2), bfProf(3), buRev(4), buExp(5), buProf(6),
    //          totalRev(7), totalExp(8), netProfit(9), timestamp(10)
    const formatRow = (r: string[]) => ({
      date: r[0] || '',
      broilerRevenue: Number(r[1]) || 0, broilerExpenses: Number(r[2]) || 0, broilerProfit: Number(r[3]) || 0,
      kibungoRevenue: Number(r[4]) || 0, kibungoExpenses: Number(r[5]) || 0, kibungoProfit: Number(r[6]) || 0,
      rwamaganaRevenue: Number(r[7]) || 0, rwamaganaExpenses: Number(r[8]) || 0, rwamaganaProfit: Number(r[9]) || 0,
      nyabugogoRevenue: Number(r[10]) || 0, nyabugogoExpenses: Number(r[11]) || 0, nyabugogoProfit: Number(r[12]) || 0,
      totalRevenue: Number(r[13]) || 0, totalExpenses: Number(r[14]) || 0, netProfit: Number(r[15]) || 0,
      timestamp: r[16] || ''
    });

    return NextResponse.json(
      data.map(formatRow).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    );
  } catch (error) {
    console.error('API Admin Finance Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
