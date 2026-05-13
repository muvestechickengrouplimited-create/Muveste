import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us | Muveste',
  description: 'Discover Muveste—Rwanda\'s premium broiler farm and fresh butcher meat outlets network.',
  alternates: {
    canonical: 'https://muveste.com/about',
  },
};

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#f5f5f0] font-['DM_Sans',sans-serif]">
      
      {/* 1. PREMIUM HERO SECTION */}
      <section className="bg-[#006400] relative overflow-hidden py-28 px-6 md:px-[60px] flex flex-col items-center justify-center text-center">
        {/* Abstract design elements using yellow and green */}
        <div className="absolute border-[2px] border-[#FFDE1A]/10 w-[600px] h-[600px] rounded-full top-[-200px] right-[-150px] pointer-events-none" />
        <div className="absolute bg-[#FFDE1A]/5 border border-[#FFDE1A]/10 w-[400px] h-[400px] rounded-full bottom-[-100px] left-[-150px] pointer-events-none" />
        
        <div className="relative z-10 flex flex-col items-center max-w-4xl mx-auto">
          <span className="inline-flex items-center gap-2 bg-[#FFDE1A]/15 border border-[#FFDE1A]/30 text-[#FFDE1A] text-[10px] font-bold px-[18px] py-2 rounded-[30px] tracking-widest uppercase mb-6">
            <span className="w-[6px] h-[6px] rounded-full bg-[#FFDE1A] animate-pulse" />
            ABOUT MUVESTE
          </span>
          
          <h1 className="font-['Cormorant_Garamond',serif] text-5xl md:text-[76px] font-bold text-white leading-[1.0] mb-8">
            Feeding Rwanda with <br />
            <span className="text-[#FFDE1A]">Uncompromising Excellence</span>
          </h1>
          
          <p className="text-white/80 text-[16px] md:text-[18px] max-w-2xl mx-auto leading-relaxed mt-2 font-light">
            We are a premier agribusiness pioneer, establishing a direct bridge from our modern broiler farm in Zaza to our pristine butcher meat outlets in Nyabugogo, Rwamagana, and Kibungo.
          </p>
        </div>
      </section>

      {/* 2. THE THREE PILLARS (MISSION, VISION & COMMITMENT CARDS) */}
      <section className="py-[100px] px-6 md:px-[60px] bg-[#f5f5f0]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-[64px]">
            <span className="inline-block bg-[rgba(0,100,0,0.08)] border border-[rgba(0,100,0,0.15)] text-[#006400] text-[9px] font-bold px-3 py-1.5 rounded-full tracking-widest uppercase mb-3">
              OUR CORE DIRECTIVE
            </span>
            <h2 className="font-['Cormorant_Garamond',serif] text-[48px] font-bold text-[#1a1814]">
              What Defines Muveste
            </h2>
            <div className="w-[60px] h-[3px] bg-[#FFDE1A] mx-auto mt-4" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1: Our Mission */}
            <div className="bg-white rounded-[24px] p-10 border border-[#e8e6e0] shadow-sm hover:shadow-xl hover:border-[#FFDE1A] transition-all duration-500 flex flex-col justify-between group">
              <div>
                <div className="w-[56px] h-[56px] rounded-2xl bg-[#006400] flex items-center justify-center text-[24px] text-white mb-6 group-hover:bg-[#FFDE1A] group-hover:text-black transition-colors duration-500">
                  🎯
                </div>
                <h3 className="font-['Cormorant_Garamond',serif] font-bold text-[28px] text-[#006400] mb-4">
                  Our Mission
                </h3>
                <p className="text-[#6b6960] text-[14px] leading-relaxed">
                  To provide absolute food security and superior nutrition across Rwanda by supplying premium, farm-fresh chicken cuts at a transparent, standardized pricing.
                </p>
              </div>
              <div className="border-t border-gray-100 pt-6 mt-8 flex items-center text-[#006400] text-[12px] font-bold group-hover:text-black transition-colors">
                ZAZA BROILER OPERATIONS &rarr;
              </div>
            </div>

            {/* Card 2: Our Vision */}
            <div className="bg-white rounded-[24px] p-10 border border-[#e8e6e0] shadow-sm hover:shadow-xl hover:border-[#FFDE1A] transition-all duration-500 flex flex-col justify-between group">
              <div>
                <div className="w-[56px] h-[56px] rounded-2xl bg-[#006400] flex items-center justify-center text-[24px] text-white mb-6 group-hover:bg-[#FFDE1A] group-hover:text-black transition-colors duration-500">
                  👁️
                </div>
                <h3 className="font-['Cormorant_Garamond',serif] font-bold text-[28px] text-[#006400] mb-4">
                  Our Vision
                </h3>
                <p className="text-[#6b6960] text-[14px] leading-relaxed">
                  To build Rwanda's most streamlined farm-to-table network, eliminating unnecessary distribution steps to guarantee maximum freshness, hygiene, and unbeatable value.
                </p>
              </div>
              <div className="border-t border-gray-100 pt-6 mt-8 flex items-center text-[#006400] text-[12px] font-bold group-hover:text-black transition-colors">
                DIRECT BUTCHER OUTLETS &rarr;
              </div>
            </div>

            {/* Card 3: Our Quality Standard */}
            <div className="bg-white rounded-[24px] p-10 border border-[#e8e6e0] shadow-sm hover:shadow-xl hover:border-[#FFDE1A] transition-all duration-500 flex flex-col justify-between group">
              <div>
                <div className="w-[56px] h-[56px] rounded-2xl bg-[#006400] flex items-center justify-center text-[24px] text-white mb-6 group-hover:bg-[#FFDE1A] group-hover:text-black transition-colors duration-500">
                  ✨
                </div>
                <h3 className="font-['Cormorant_Garamond',serif] font-bold text-[28px] text-[#006400] mb-4">
                  Quality Standard
                </h3>
                <p className="text-[#6b6960] text-[14px] leading-relaxed">
                  Every gram of our chicken cuts and whole chickens is sourced from healthy, carefully bred broilers under the strictest biosecurity controls in the Eastern Province.
                </p>
              </div>
              <div className="border-t border-gray-100 pt-6 mt-8 flex items-center text-[#006400] text-[12px] font-bold group-hover:text-black transition-colors">
                100% HEALTH GUARANTEE &rarr;
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. IN-DEPTH STORY TIMELINE */}
      <section className="bg-[#006400] text-white py-[100px] px-6 md:px-[60px] relative overflow-hidden">
        <div className="absolute w-[200px] h-[200px] bg-[#FFDE1A]/5 rounded-full right-10 top-10 pointer-events-none" />
        
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <span className="inline-block bg-[#FFDE1A]/10 border border-[#FFDE1A]/20 text-[#FFDE1A] text-[9px] font-bold px-3 py-1.5 rounded-full tracking-widest uppercase mb-4">
                THE JOURNEY
              </span>
              <h2 className="font-['Cormorant_Garamond',serif] text-[48px] font-bold leading-[1.1] mb-6">
                From Our Broiler Farm <br />
                Direct to Your Town
              </h2>
              <p className="text-white/80 text-[15px] leading-relaxed mb-6">
                Muveste was founded to answer a critical need: the gap between rural production excellence and urban supply availability. We built our specialized broiler farm in **Zaza** with state-of-the-art poultry housing, feeding systems, and biological sanitation.
              </p>
              <p className="text-white/80 text-[15px] leading-relaxed mb-8">
                By controlling the entire process from hatching to daily logistics, we bypass brokers. That is how we deliver both full chicken and premium cut chicken at highly competitive, fair market rates to our meat outlets.
              </p>
              <Link 
                href="/#checkout" 
                className="inline-block bg-[#FFDE1A] text-black font-bold rounded-xl px-8 py-4 text-xs hover:bg-[#e6c710] transition-all shadow-lg"
              >
                Place An Order Now
              </Link>
            </div>

            {/* 4 locations grid cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-[20px] p-6 hover:bg-white/10 transition-all duration-300">
                <div className="text-[32px] mb-2">🐓</div>
                <h4 className="font-['Cormorant_Garamond',serif] font-bold text-xl text-[#FFDE1A] mb-1">Zaza Farm</h4>
                <p className="text-white/60 text-xs font-light">Main Broiler Production Center</p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-[20px] p-6 hover:bg-white/10 transition-all duration-300">
                <div className="text-[32px] mb-2">🥩</div>
                <h4 className="font-['Cormorant_Garamond',serif] font-bold text-xl text-[#FFDE1A] mb-1">Nyabugogo</h4>
                <p className="text-white/60 text-xs font-light">Kigali Core Meat Outlet</p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-[20px] p-6 hover:bg-white/10 transition-all duration-300">
                <div className="text-[32px] mb-2">🥩</div>
                <h4 className="font-['Cormorant_Garamond',serif] font-bold text-xl text-[#FFDE1A] mb-1">Rwamagana</h4>
                <p className="text-white/60 text-xs font-light">Eastern Hub Outlet</p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-[20px] p-6 hover:bg-white/10 transition-all duration-300">
                <div className="text-[32px] mb-2">🥩</div>
                <h4 className="font-['Cormorant_Garamond',serif] font-bold text-xl text-[#FFDE1A] mb-1">Kibungo</h4>
                <p className="text-white/60 text-xs font-light">Local Hub Outlet</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. KEY METRICS / ADVANTAGES */}
      <section className="py-[100px] px-6 md:px-[60px] bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block bg-[rgba(0,100,0,0.08)] border border-[rgba(0,100,0,0.15)] text-[#006400] text-[9px] font-bold px-3 py-1.5 rounded-full tracking-widest uppercase mb-3">
              MUVESTE EDGE
            </span>
            <h2 className="font-['Cormorant_Garamond',serif] text-[44px] font-bold text-black">
              Why Choose Our Poultry
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="border border-gray-100 rounded-[20px] p-6 text-center shadow-sm">
              <span className="block text-4xl mb-3">🛡️</span>
              <h4 className="font-bold text-base text-[#006400] mb-2">100% Bio-Secure</h4>
              <p className="text-xs text-[#6b6960] leading-relaxed">Our birds are raised with top veterinary standards and clean feed.</p>
            </div>

            <div className="border border-gray-100 rounded-[20px] p-6 text-center shadow-sm">
              <span className="block text-4xl mb-3">💰</span>
              <h4 className="font-bold text-base text-[#006400] mb-2">Fair Value</h4>
              <p className="text-xs text-[#6b6960] leading-relaxed">Highly competitive and honest market rates for both whole chickens and premium cuts.</p>
            </div>

            <div className="border border-gray-100 rounded-[20px] p-6 text-center shadow-sm">
              <span className="block text-4xl mb-3">🚚</span>
              <h4 className="font-bold text-base text-[#006400] mb-2">Direct Cold Chain</h4>
              <p className="text-xs text-[#6b6960] leading-relaxed">Fast delivery from Zaza to Kigali and Eastern Province outlets.</p>
            </div>

            <div className="border border-gray-100 rounded-[20px] p-6 text-center shadow-sm">
              <span className="block text-4xl mb-3">🇷🇼</span>
              <h4 className="font-bold text-base text-[#006400] mb-2">Proudly Rwandan</h4>
              <p className="text-xs text-[#6b6960] leading-relaxed">A home-grown agricultural success story supporting local communities.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. CTA PANEL */}
      <section className="bg-[#f5f5f0] py-[100px] px-6 md:px-[60px]">
        <div className="max-w-4xl mx-auto">
          <div className="bg-[#006400] rounded-[32px] p-12 md:p-16 text-center shadow-xl relative overflow-hidden flex flex-col items-center">
            <div className="absolute w-[180px] h-[180px] bg-[#FFDE1A]/5 rounded-full bottom-[-40px] right-[-40px] pointer-events-none" />
            <div className="absolute w-[180px] h-[180px] bg-[#FFDE1A]/5 rounded-full top-[-40px] left-[-40px] pointer-events-none" />
            
            <h2 className="font-['Cormorant_Garamond',serif] text-white text-4xl md:text-5xl font-bold mb-4 relative z-10">
              Ready to Order?
            </h2>
            <p className="text-white/80 text-[15px] mb-8 max-w-md relative z-10 font-light leading-relaxed">
              Order premium broiler chicken from our nearest meat outlet and experience quality farm produce.
            </p>
            
            <Link 
              href="/#checkout" 
              className="relative z-10 inline-block bg-[#FFDE1A] text-black font-bold rounded-xl px-10 py-5 text-xs hover:bg-[#e6c710] hover:scale-105 transition-all shadow-md"
            >
              Order via WhatsApp / Call &rarr;
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
