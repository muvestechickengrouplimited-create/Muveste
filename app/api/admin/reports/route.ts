import { NextResponse } from 'next/server';
import { getRows } from '../../../../lib/sheets';
import admin from '../../../lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const token = await admin.auth().verifyIdToken(authHeader.split('Bearer ')[1]);
    const emailLower = token.email?.toLowerCase();
    if (emailLower !== 'admin@muveste.com') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const dept = searchParams.get('dept');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    if (!dept) return NextResponse.json({ error: 'Department query is required' }, { status: 400 });

    const rows = await getRows(dept);
    if (!rows || rows.length === 0) return NextResponse.json({ headers: [], data: [] });

    const headers = rows[0].map(String);
    let data = rows.slice(1);

    // Assuming column 0 is Date
    if (fromDate || toDate) {
      data = data.filter(r => {
        const d = new Date(r[0]).getTime();
        const f = fromDate ? new Date(fromDate).getTime() : 0;
        const t = toDate ? new Date(toDate).getTime() : Infinity;
        if (isNaN(d)) return false;
        return d >= f && d <= t;
      });
    }

    // Sort newest first
    data.sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime());

    return NextResponse.json({ headers, data });
  } catch (error) {
    console.error('API Admin Reports Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
