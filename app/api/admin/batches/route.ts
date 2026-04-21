import { NextResponse } from 'next/server';
import { getRows, appendRow, updateCell } from '../../../../lib/sheets';

export async function GET() {
  try {
    const rows = await getRows('broiler-batches');
    return NextResponse.json(rows.slice(1));
  } catch (error) {
    console.error('API Error in admin/batches [GET]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { batchName, createdDate, status, createdBy } = await request.json();
    await appendRow('broiler-batches', [
      batchName,
      createdDate,
      status,
      createdBy
    ]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API Error in admin/batches [POST]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { batchName, status } = await request.json();
    const rows = await getRows('broiler-batches');
    const rowIndex = rows.findIndex(r => r[0] === batchName);
    
    if (rowIndex > -1) {
      // Column index 3 is 'Status' (1-indexed: A=1, B=2, C=3)
      await updateCell('broiler-batches', rowIndex + 1, 3, status);
      return NextResponse.json({ success: true });
    }
    
    return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
  } catch (error) {
    console.error('API Error in admin/batches [PATCH]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
