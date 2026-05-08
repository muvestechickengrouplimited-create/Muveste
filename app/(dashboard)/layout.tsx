'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '../../components/layout/Sidebar';
import { Navbar } from '../../components/layout/Navbar';
import { AuthProvider, useAuth } from '../../lib/auth-context';
import { ToastProvider } from '../../components/ui/Toast';

// The inner shell ensures we have access to the AuthContext
function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Additional client-side protection just in case middleware is bypassed
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Show a branded loading spinner while checking auth state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#EAF5EE]">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#1B6B3A] border-t-transparent shadow-md"></div>
          <p className="text-sm font-medium text-[#1B6B3A] animate-pulse">Loading Muveste Dashboard...</p>
        </div>
      </div>
    );
  }

  // Prevent rendering children if somehow the user is null
  if (!user) return null;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 min-w-0 ml-0 md:ml-0 overflow-x-hidden bg-[#f9fafb]">
        <Navbar />
        <div className="px-4 py-4 md:px-8 md:py-6">
          <div className="mx-auto w-full max-w-7xl animate-in fade-in duration-300">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

// Wrapper component to supply Contexts
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <AuthProvider>
        <DashboardShell>{children}</DashboardShell>
      </AuthProvider>
    </ToastProvider>
  );
}
