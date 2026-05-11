import { NextResponse } from 'next/server';
import admin from '../../../../../lib/firebase-admin';

export async function POST(request: Request) {
  
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = await admin.auth().verifyIdToken(authHeader.split('Bearer ')[1]);
    
    // STRICT SECURITY: Only the admin can do this
    const tokenEmail = token.email?.toLowerCase();
    if (tokenEmail !== 'admin@muveste.com') {
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

    // 1 & 2. Try to update existing user, or create if they don't exist
    try {
      const userRecord = await admin.auth().getUserByEmail(email);
      await admin.auth().updateUser(userRecord.uid, { password: newPassword });
    } catch (userError: any) {
      if (userError.code === 'auth/user-not-found') {
        // Automatically create the user account if it doesn't exist yet
        await admin.auth().createUser({ email, password: newPassword });
      } else {
        throw userError; // Re-throw other errors
      }
    }

    return NextResponse.json({ success: true, message: `Password updated successfully for ${email}` });

  } catch (error: any) {
    console.error('Password Update Error:', error);
    
    if (error.code === 'auth/user-not-found') {
      return NextResponse.json({ error: 'User not found in Firebase' }, { status: 404 });
    }
    
    return NextResponse.json({ error: `Failed to update password: ${error.message}` }, { status: 500 });
  }
}
