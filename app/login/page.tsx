'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { useToast } from '../../components/ui/Toast';
import { UserRole } from '../../types';

// Map specific roles to their dashboard routes
const ROLE_DASHBOARDS: Record<string, string> = {
  'egg_farm': '/egg-farm',
  'broiler_farm': '/broiler-farm',
  'egg_kiosk': '/egg-kiosk',
  'butcher': '/butcher',
  'finance': '/finance',
  'admin': '/admin',
};

// User mapping rules according to system business rules
const ROLE_MAP: Record<string, UserRole> = {
  'eggfarm@30plus.rw': 'egg_farm',
  'broiler@30plus.rw': 'broiler_farm',
  'eggkiosk@30plus.rw': 'egg_kiosk',
  'butcher@30plus.rw': 'butcher',
  'finance@30plus.rw': 'finance',
  'admin@30plus.rw': 'admin',
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
      await signInWithEmailAndPassword(auth, email, password);

      // Set a generic session cookie so middleware knows a session exists.
      // Firebase will handle the actual secure Client SDK token verification.
      document.cookie = `session=true; path=/; max-age=86400; SameSite=Lax`;

      const role = ROLE_MAP[email.toLowerCase()];
      // Admin might have its own dashboard or a fallback
      const redirectPath = role ? ROLE_DASHBOARDS[role] : '/';

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
          <div className="mx-auto w-20 h-20 bg-[#1B6B3A] rounded-full flex items-center justify-center shadow-md">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              30<span className="text-[#F5C518]">Plus</span>
            </h1>
          </div>
          <div>
            <CardTitle className="text-2xl mb-2">Staff Login</CardTitle>
            <CardDescription className="text-base">
              Enter your credentials to access the 30 Plus management system
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pb-8">
          <form onSubmit={handleLogin} className="space-y-6">
            <Input
              label="Email Address"
              type="email"
              placeholder="e.g. eggfarm@30plus.rw"
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
