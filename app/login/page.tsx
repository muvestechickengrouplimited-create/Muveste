'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { useToast } from '../../components/ui/Toast';
import { UserRole } from '../../types';

// Map specific roles to their dashboard routes
const ROLE_DASHBOARDS: Record<string, string> = {
  'broiler_farm': '/broiler-farm',
  'butcher_kibungo': '/butcher-kibungo',
  'butcher_rwamagana': '/butcher-rwamagana',
  'butcher_nyabugogo': '/butcher-nyabugogo',
  'finance': '/finance',
  'admin': '/admin',
};

// User mapping rules according to system business rules
const ROLE_MAP: Record<string, UserRole> = {
  'broiler@muveste.com': 'broiler_farm',
  'butchery-kibungo@muveste.com': 'butcher_kibungo',
  'butcher-kibungo@muveste.com': 'butcher_kibungo',
  'butchery-rwamagana@muveste.com': 'butcher_rwamagana',
  'butcher-rwamagana@muveste.com': 'butcher_rwamagana',
  'butchery-nyabugogo@muveste.com': 'butcher_nyabugogo',
  'butcher-nyabugogo@muveste.com': 'butcher_nyabugogo',
  'finance@muveste.com': 'finance',
  'admin@muveste.com': 'admin',
};

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast('Please enter both email and password', 'error');
      return;
    }

    setIsLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();
      await signInWithEmailAndPassword(auth, cleanEmail, password);

      // Set a generic session cookie so middleware knows a session exists.
      // Firebase will handle the actual secure Client SDK token verification.
      document.cookie = `session=true; path=/; max-age=86400; SameSite=Lax`;

      let role = ROLE_MAP[cleanEmail];
      
      // Fallback: Smart matching in case of typos in Firebase Auth (e.g. .rw instead of .com, dots instead of dashes)
      if (!role) {
        if (cleanEmail.includes('kibungo')) role = 'butcher_kibungo';
        else if (cleanEmail.includes('rwamagana')) role = 'butcher_rwamagana';
        else if (cleanEmail.includes('nyabugogo')) role = 'butcher_nyabugogo';
        else if (cleanEmail.includes('broiler')) role = 'broiler_farm';
        else if (cleanEmail.includes('finance')) role = 'finance';
        else if (cleanEmail.includes('admin')) role = 'admin';
      }

      if (!role) {
        toast(`Login successful, but ${cleanEmail} is not mapped to any dashboard.`, 'error');
        // Sign out if they shouldn't be here?
        // await auth.signOut();
        router.push('/');
        setIsLoading(false);
        return;
      }

      // Admin might have its own dashboard or a fallback
      const redirectPath = ROLE_DASHBOARDS[role] || '/';

      toast('Login successful!', 'success');

      // Navigate to the user's specific dashboard
      router.push(redirectPath);
    } catch (error) {
      console.error('Login error:', error);
      toast('Invalid credentials or login failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#EAF5EE] flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0 relative">
        <a
          href="/"
          className="absolute top-4 left-6 text-[#1B6B3A] text-sm hover:underline"
        >
          ← Back to home
        </a>
        <CardHeader className="text-center space-y-4 pt-8">
          <div className="flex justify-center">
            <div className="w-24 h-24 relative overflow-hidden rounded-full shadow-lg border-4 border-white bg-white flex items-center justify-center">
              <Image
                src="/logo.jpeg"
                alt="Muveste Logo"
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
          <CardDescription className="text-base">
            Enter your credentials to access the Muveste management system
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-8">
          <form onSubmit={handleLogin} className="space-y-6">
            <Input
              label="Email Address"
              type="email"
              placeholder="e.g. admin@muveste.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button
              type="submit"
              className="w-full text-base tracking-wide h-12 shadow-sm"
              isLoading={isLoading}
            >
              Sign In to Dashboard
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
