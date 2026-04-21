'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { auth } from '../../lib/firebase';
import { signOut } from 'firebase/auth';
import { Button } from '../ui/Button';
import { useAuth } from '../../lib/auth-context';

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  
  // Dashboard Navbar logic
  const isPublicRoute = ['/', '/about', '/contact', '/login'].includes(pathname);

  if (!isPublicRoute && user) {
    const getPageTitle = (path: string) => {
      if (path === '/') return 'Dashboard';
      const segments = path.split('/').filter(Boolean);
      if (segments.length === 0) return 'Dashboard';
      return segments[0]
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    };

    const handleLogout = async () => {
      try {
        await signOut(auth);
        document.cookie = 'session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        router.push('/login');
      } catch (error) {
        console.error('Error logging out:', error);
      }
    };

    return (
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between bg-white px-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border-b border-gray-100">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-[#111827] tracking-tight">
            {getPageTitle(pathname)}
          </h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col items-end mr-4">
            <span className="text-sm font-medium text-gray-900">{user.email}</span>
            <span className="text-xs text-gray-500 capitalize">{user.role.replace('_', ' ')}</span>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout} className="text-[#EF4444] border-gray-200 hover:border-[#EF4444] hover:bg-red-50 hover:text-[#EF4444] focus:ring-[#EF4444]">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </Button>
        </div>
      </header>
    );
  }

  // Public Navbar
  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <img 
            src="/logo.png" 
            alt="30 Plus Logo" 
            className="h-14 w-auto object-contain"
          />
        </Link>

        {/* Center Links (Desktop) */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="/" className="text-[#2D2D2D] hover:text-[#1B6B3A] hover:underline decoration-[#1B6B3A] underline-offset-8 font-medium text-sm transition-colors">Home</Link>
          <Link href="/about" className="text-[#2D2D2D] hover:text-[#1B6B3A] hover:underline decoration-[#1B6B3A] underline-offset-8 font-medium text-sm transition-colors">About Us</Link>
          <a href="#marketplace" className="text-[#2D2D2D] hover:text-[#1B6B3A] hover:underline decoration-[#1B6B3A] underline-offset-8 font-medium text-sm transition-colors">Marketplace</a>
          <a href="#locations" className="text-[#2D2D2D] hover:text-[#1B6B3A] hover:underline decoration-[#1B6B3A] underline-offset-8 font-medium text-sm transition-colors">Locations</a>
          <a href="#contact" className="text-[#2D2D2D] hover:text-[#1B6B3A] hover:underline decoration-[#1B6B3A] underline-offset-8 font-medium text-sm transition-colors">Contact Us</a>
        </div>

        {/* Right Button (Desktop) */}
        <div className="hidden md:block">
          <Link href="/login" className="bg-[#1B6B3A] text-white hover:bg-[#E07B00] rounded-full px-5 py-2.5 font-semibold text-sm transition-all duration-300 shadow-sm active:scale-95">
            Staff Login
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button 
          className="md:hidden text-[#2D2D2D] p-2"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <div className="space-y-1.5 w-6">
            <span className={`block h-[2.5px] bg-[#2D2D2D] transition-all ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`block h-[2.5px] bg-[#2D2D2D] transition-opacity ${isMenuOpen ? 'opacity-0' : ''}`} />
            <span className={`block h-[2.5px] bg-[#2D2D2D] transition-all ${isMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </div>
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-100 shadow-md flex flex-col animate-in slide-in-from-top duration-300">
          <Link href="/" onClick={() => setIsMenuOpen(false)} className="text-[#2D2D2D] py-3 px-6 font-medium border-b border-gray-50">Home</Link>
          <Link href="/about" onClick={() => setIsMenuOpen(false)} className="text-[#2D2D2D] py-3 px-6 font-medium border-b border-gray-50">About Us</Link>
          <a href="#marketplace" onClick={() => setIsMenuOpen(false)} className="text-[#2D2D2D] py-3 px-6 font-medium border-b border-gray-50">Marketplace</a>
          <a href="#locations" onClick={() => setIsMenuOpen(false)} className="text-[#2D2D2D] py-3 px-6 font-medium border-b border-gray-50">Locations</a>
          <a href="#contact" onClick={() => setIsMenuOpen(false)} className="text-[#2D2D2D] py-3 px-6 font-medium border-b border-gray-50">Contact Us</a>
          <div className="p-4">
            <Link href="/login" onClick={() => setIsMenuOpen(false)} className="block w-full bg-[#1B6B3A] text-white hover:bg-[#E07B00] rounded-full px-5 py-3 font-semibold text-center transition-all shadow-sm">
              Staff Login
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
