import React from 'react';
import Link from 'next/link';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#164F2C] py-12 md:py-16 px-6 md:px-12 border-t border-white/5 mt-auto">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 items-center">
        <div className="flex flex-col items-center md:items-start gap-4">
          <Link href="/" className="flex items-center gap-1 group">
            <span className="text-[#F5C518] text-2xl font-bold transition-transform group-hover:scale-105">30</span>
            <span className="text-white text-2xl font-bold translate-y-[-1px]">Plus</span>
          </Link>
          <p className="text-white/40 text-[10px] font-bold tracking-[0.2em] uppercase">Fresh from Rwanda 🇷🇼</p>
        </div>

        <div className="flex flex-wrap justify-center gap-6 md:gap-8">
          <Link href="/" className="text-white/50 text-xs font-bold hover:text-[#F5C518] transition-colors uppercase tracking-widest">Home</Link>
          <Link href="/about" className="text-white/50 text-xs font-bold hover:text-[#F5C518] transition-colors uppercase tracking-widest">About Us</Link>
          <a href="#marketplace" className="text-white/50 text-xs font-bold hover:text-[#F5C518] transition-colors uppercase tracking-widest">Marketplace</a>
          <a href="#locations" className="text-white/50 text-xs font-bold hover:text-[#F5C518] transition-colors uppercase tracking-widest">Locations</a>
          <a href="#contact" className="text-white/50 text-xs font-bold hover:text-[#F5C518] transition-colors uppercase tracking-widest">Contact Us</a>
        </div>

        <div className="text-center md:text-right">
          <p className="text-white/40 text-[11px] font-medium">
            &copy; {currentYear} 30 Plus. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
