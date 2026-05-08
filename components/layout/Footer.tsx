import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#133813] pt-[60px] pb-[32px] px-[60px] mt-auto font-['DM_Sans',sans-serif]">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div className="flex flex-col">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-[38px] h-[38px] relative overflow-hidden rounded-lg flex-shrink-0 bg-white">
              <Image src="/logo.jpeg" alt="Muveste Logo" fill className="object-cover" />
            </div>
            <span className="text-[#FFDE1A] font-['Cormorant_Garamond',serif] text-[22px] font-bold">
              Muveste
            </span>
          </Link>
          <p className="text-[rgba(255,255,255,0.5)] text-[13px] mt-3 mb-6 max-w-sm leading-relaxed">
            Experience the finest quality poultry, raised with care and delivered fresh daily from our farm to your table.
          </p>
        </div>

        <div className="flex flex-col">
          <h3 className="text-[#FFDE1A] text-[10px] uppercase tracking-widest mb-4 font-bold">
            Quick Links
          </h3>
          <div className="flex flex-col gap-3">
            <Link href="/" className="text-[rgba(255,255,255,0.7)] text-[13px] hover:text-[#FFDE1A] transition-colors w-fit">Home</Link>
            <Link href="/about" className="text-[rgba(255,255,255,0.7)] text-[13px] hover:text-[#FFDE1A] transition-colors w-fit">About</Link>
            <Link href="/#products" className="text-[rgba(255,255,255,0.7)] text-[13px] hover:text-[#FFDE1A] transition-colors w-fit">Products</Link>
            <Link href="/#locations" className="text-[rgba(255,255,255,0.7)] text-[13px] hover:text-[#FFDE1A] transition-colors w-fit">Locations</Link>
          </div>
        </div>

        <div className="flex flex-col">
          <h3 className="text-[#FFDE1A] text-[10px] uppercase tracking-widest mb-4 font-bold">
            Contact
          </h3>
          <div className="flex flex-col gap-3">
            <a href="tel:+250785329989" className="text-[rgba(255,255,255,0.7)] text-[13px] hover:text-[#FFDE1A] transition-colors w-fit">
              +250 785 329 989
            </a>
            <span className="text-[rgba(255,255,255,0.7)] text-[13px]">
              Zaza, Ngoma, Eastern Province
            </span>
            <a href="mailto:muvestechickengroup@gmail.com" className="text-[rgba(255,255,255,0.7)] text-[13px] hover:text-[#FFDE1A] transition-colors w-fit">
              muvestechickengroup@gmail.com
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto border-t border-[rgba(255,255,255,0.08)] pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-[rgba(255,255,255,0.35)] text-xs">
          &copy; {currentYear} Muveste Ltd. All rights reserved.
        </p>
        <p className="text-[rgba(255,255,255,0.35)] text-xs">
          Zaza, Ngoma, Eastern Province, Rwanda
        </p>
      </div>
    </footer>
  );
}
