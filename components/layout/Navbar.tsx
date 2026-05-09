'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between bg-white pl-14 pr-6 md:px-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border-b border-gray-100">
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
    <nav className="sticky top-0 z-50 bg-white border-b border-[#e8e6e0] font-['DM_Sans',sans-serif]">
      <div className="h-[68px] px-6 md:px-[60px] flex items-center justify-between w-full">
        {/* Left */}
        <Link href="/" className="flex items-center gap-3">
          <div className="w-[38px] h-[38px] relative overflow-hidden rounded-lg flex-shrink-0">
            <Image src="/logo.jpeg" alt="Muveste Logo" fill className="object-cover" />
          </div>
          <span className="text-[#228B22] font-['Cormorant_Garamond',serif] text-[22px] font-bold">
            Muveste
          </span>
        </Link>

        {/* Center Links (Desktop) */}
        <div className="hidden md:flex items-center gap-8 h-full">
          <Link href="/" className={`text-[13px] h-full flex items-center border-b-[2px] transition-colors ${pathname === '/' ? 'text-[#228B22] border-[#FFDE1A]' : 'text-[#6b6960] border-transparent hover:text-[#228B22]'}`}>Home</Link>
          <Link href="/about" className={`text-[13px] h-full flex items-center border-b-[2px] transition-colors ${pathname === '/about' ? 'text-[#228B22] border-[#FFDE1A]' : 'text-[#6b6960] border-transparent hover:text-[#228B22]'}`}>About</Link>
          <Link href="/#products" className="text-[#6b6960] text-[13px] h-full flex items-center border-b-[2px] border-transparent hover:text-[#228B22] transition-colors">Products</Link>
          <Link href="/#locations" className="text-[#6b6960] text-[13px] h-full flex items-center border-b-[2px] border-transparent hover:text-[#228B22] transition-colors">Locations</Link>
          <Link href="/#contact" className="text-[#6b6960] text-[13px] h-full flex items-center border-b-[2px] border-transparent hover:text-[#228B22] transition-colors">Contact</Link>
        </div>

        {/* Right Button (Desktop) */}
        <div className="hidden md:block">
          <Link href="/login" className="border-[1.5px] border-[#228B22] text-[#228B22] bg-transparent rounded-lg px-5 py-2 text-[14px] font-medium hover:bg-[#228B22] hover:text-white transition-colors">
            Staff Portal
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button 
          className="md:hidden text-[#228B22] p-2"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <div className="space-y-1.5 w-6">
            <span className={`block h-[2.5px] bg-current transition-all ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`block h-[2.5px] bg-current transition-opacity ${isMenuOpen ? 'opacity-0' : ''}`} />
            <span className={`block h-[2.5px] bg-current transition-all ${isMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </div>
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-b border-[#e8e6e0] shadow-md flex flex-col animate-in slide-in-from-top duration-300">
          <Link href="/" onClick={() => setIsMenuOpen(false)} className="text-[#6b6960] py-4 px-6 text-[13px] border-b border-[#e8e6e0]">Home</Link>
          <Link href="/about" onClick={() => setIsMenuOpen(false)} className="text-[#6b6960] py-4 px-6 text-[13px] border-b border-[#e8e6e0]">About</Link>
          <Link href="/#products" onClick={() => setIsMenuOpen(false)} className="text-[#6b6960] py-4 px-6 text-[13px] border-b border-[#e8e6e0]">Products</Link>
          <Link href="/#locations" onClick={() => setIsMenuOpen(false)} className="text-[#6b6960] py-4 px-6 text-[13px] border-b border-[#e8e6e0]">Locations</Link>
          <Link href="/#contact" onClick={() => setIsMenuOpen(false)} className="text-[#6b6960] py-4 px-6 text-[13px] border-b border-[#e8e6e0]">Contact</Link>
          <div className="p-6">
            <Link href="/login" onClick={() => setIsMenuOpen(false)} className="block w-full border-[1.5px] border-[#228B22] text-[#228B22] bg-transparent rounded-lg px-5 py-3 text-center text-sm font-medium hover:bg-[#228B22] hover:text-white transition-colors">
              Staff Portal
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
