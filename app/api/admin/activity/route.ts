import { NextResponse } from 'next/server';
import { getRows } from '../../../../lib/sheets';
import * as admin from 'firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const token = await admin.auth().verifyIdToken(authHeader.split('Bearer ')[1]);
    const emailLower = token.email?.toLowerCase();
    if (emailLower !== 'admin@muveste.com') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const rows = await getRows('admin-log');
    if (!rows || rows.length <= 1) return NextResponse.json([]);

    // Sort newest first
    const dataRows = rows.slice(1).map(r => ({
      date: r[0] || '',
      time: r[1] || '',
      department: r[2] || '',
      action: r[3] || '',
      user: r[4] || '',
      status: r[5] || '',
      timestamp: r[6] || ''
    })).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Returns last 10 rows
    return NextResponse.json(dataRows.slice(0, 10));
  } catch (error) {
    console.error('API Admin Activity Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
