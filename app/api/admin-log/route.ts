import { NextResponse } from 'next/server';
import { getRows, prependRow } from '../../../lib/sheets';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin using environment variables if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_SERVICE_ACCOUNT_EMAIL || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || process.env.GOOGLE_PRIVATE_KEY)?.replace(/\\n/g, '\n'),
    }),
  });
}

// GET route to fetch the activity log for the admin dashboard
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing or invalid token format' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(token);
    } catch (error) {
      console.error('Token verification failed:', error);
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    const userEmail = decodedToken.email;
    // Security Rule: Only Admin can read the widespread activity log
    if (userEmail?.toLowerCase() !== 'admin@30plus.rw') {
       return NextResponse.json({ error: 'Forbidden: Admin access required to view logs' }, { status: 403 });
    }

    // Fetch raw rows from admin-log tab
    const rows = await getRows('admin-log');
    
    let headers: string[] = [];
    let dataRows: string[][] = [];
    
    // Process formatting and sorting (latest first)
    if (rows.length > 0) {
      headers = rows[0];
      dataRows = rows.slice(1);
      
      // Assume timestamp is at index 1 Based on our POST routes logs:
      // [ reportId(0), timestamp(1), userEmail(2), department(3), action(4), details(5) ]
      dataRows.sort((a, b) => {
        const dateA = new Date(a[1]).getTime();
        const dateB = new Date(b[1]).getTime();
        return (isNaN(dateB) ? 0 : dateB) - (isNaN(dateA) ? 0 : dateA);
      });
    }

    return NextResponse.json({ success: true, headers, data: dataRows }, { status: 200 });

  } catch (error) {
    console.error('API Error in admin-log/route.ts GET:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST route allows manual log entries if needed by client-side tools
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing or invalid token format' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(token);
    } catch (error) {
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    const userEmail = decodedToken.email;
    const body = await request.json();
    const { department, action, details } = body;

    if (!department || !action || !details) {
      return NextResponse.json({ error: 'Bad Request: Missing log details' }, { status: 400 });
    }

    const reportId = `LOG-${Date.now()}`;
    const timestamp = new Date().toISOString();

    const logData = [
      reportId,
      timestamp,
      userEmail || 'unknown',
      department,
      action,
      details
    ];

    await prependRow('admin-log', logData);

    return NextResponse.json({ success: true, reportId }, { status: 201 });

  } catch (error) {
    console.error('API Error in admin-log/route.ts POST:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
