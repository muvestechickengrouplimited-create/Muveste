import { NextResponse } from 'next/server';
import { getRows } from '../../../../lib/sheets';
import * as admin from 'firebase-admin';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const token = await admin.auth().verifyIdToken(authHeader.split('Bearer ')[1]);
    if (token.email?.toLowerCase() !== 'admin@30plus.rw') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const rows = await getRows('finance-summary');
    if (!rows || rows.length <= 1) return NextResponse.json([]);

    let data = rows.slice(1);

    // Convert to objects mirroring standard finance response
    const formatRow = (r: string[]) => ({
      date: r[0] || '',
      eggFarmRevenue: Number(r[1]) || 0, eggFarmExpenses: Number(r[2]) || 0, eggFarmProfit: Number(r[3]) || 0,
      broilerRevenue: Number(r[4]) || 0, broilerExpenses: Number(r[5]) || 0, broilerProfit: Number(r[6]) || 0,
      kioskBatsindaRevenue: Number(r[7]) || 0, kioskBatsindaExpenses: Number(r[8]) || 0, kioskBatsindaProfit: Number(r[9]) || 0,
      kioskNyabugogoRevenue: Number(r[10]) || 0, kioskNyabugogoExpenses: Number(r[11]) || 0, kioskNyabugogoProfit: Number(r[12]) || 0,
      butcherRevenue: Number(r[13]) || 0, butcherExpenses: Number(r[14]) || 0, butcherProfit: Number(r[15]) || 0,
      totalRevenue: Number(r[16]) || 0, totalExpenses: Number(r[17]) || 0, netProfit: Number(r[18]) || 0,
      timestamp: r[19] || ''
    });

    return NextResponse.json(
      data.map(formatRow).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    );
  } catch (error) {
    console.error('API Admin Finance Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
