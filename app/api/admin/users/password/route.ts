import { NextResponse } from 'next/server';
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      privateKey: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = await admin.auth().verifyIdToken(authHeader.split('Bearer ')[1]);
    
    // STRICT SECURITY: Only the admin can do this
    if (token.email?.toLowerCase() !== 'admin@30plus.rw') {
      return NextResponse.json({ error: 'Forbidden. Only admin can change passwords.' }, { status: 403 });
    }

    const body = await request.json();
    const { email, newPassword } = body;

    if (!email || !newPassword) {
      return NextResponse.json({ error: 'Email and new password are required' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    // 1. Get the target user's UID
    const userRecord = await admin.auth().getUserByEmail(email);
    
    // 2. Update the password
    await admin.auth().updateUser(userRecord.uid, {
      password: newPassword
    });

    return NextResponse.json({ success: true, message: `Password updated successfully for ${email}` });

  } catch (error: any) {
    console.error('Password Update Error:', error);
    
    if (error.code === 'auth/user-not-found') {
      return NextResponse.json({ error: 'User not found in Firebase' }, { status: 404 });
    }
    
    return NextResponse.json({ error: 'Failed to update password' }, { status: 500 });
  }
}
