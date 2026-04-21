import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us | 30 Plus',
  description: 'Learn more about our passion for poultry farming and our journey in Rwanda.',
  alternates: {
    canonical: 'https://30plus.rw/about',
  },
};

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen font-sans">
      {/* ─── 1. HERO SECTION ─── */}
      <section className="bg-[#1B6B3A] relative overflow-hidden py-24 px-6 flex flex-col items-center justify-center">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-[#F5C518]/[0.08] translate-x-1/4 -translate-y-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white/5 -translate-x-1/4 translate-y-1/4 pointer-events-none" />
        
        <div className="relative z-10 text-center flex flex-col items-center w-full max-w-3xl">
          <span className="inline-block bg-[#F5C518]/[0.15] text-[#F5C518] text-xs font-bold px-4 py-1.5 rounded-full tracking-widest mb-6 uppercase">
            ABOUT 30 PLUS
          </span>
          <h1 className="text-4xl font-bold text-white leading-tight mb-6">
            Growing Rwanda <br className="hidden md:block" />
            <span className="text-[#F5C518]">One Egg at a Time</span>
          </h1>
          <p className="text-white/65 text-sm max-w-lg mx-auto leading-relaxed">
            We are a passionate poultry farming startup committed to delivering fresh, nutritious and sustainably produced eggs and chicken meat to families and businesses across Rwanda.
          </p>
        </div>
      </section>

      {/* ─── 2. MOTTOS SECTION ─── */}
      <section className="bg-[#F7F7F7] p-10">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8 md:text-center text-left">
            <span className="text-[#1B6B3A] font-bold text-xs tracking-widest uppercase block mb-2">OUR PHILOSOPHY</span>
            <h2 className="text-3xl font-bold text-[#2D2D2D] mb-2 tracking-tight">Our Mottos</h2>
            <p className="text-sm text-gray-500 font-medium max-w-md md:mx-auto">The core beliefs that shape our daily operations and long-term vision</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Motto Card 1 */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 relative overflow-hidden group hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
            <span className="text-6xl font-bold text-[#F5C518] opacity-20 absolute top-2 right-4 pointer-events-none">1</span>
            <div className="bg-[#EAF5EE] rounded-xl w-10 h-10 flex items-center justify-center text-xl mb-3">
              🥚
            </div>
            <h3 className="font-bold text-[#2D2D2D] text-base mb-2 relative z-10">
              Feeding the future, one egg at a time
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed relative z-10">
              Every egg we produce carries our commitment to nourishing Rwanda's future generations with quality protein.
            </p>
          </div>

          {/* Motto Card 2 */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 relative overflow-hidden group hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
            <span className="text-6xl font-bold text-[#F5C518] opacity-20 absolute top-2 right-4 pointer-events-none">2</span>
            <div className="bg-[#EAF5EE] rounded-xl w-10 h-10 flex items-center justify-center text-xl mb-3">
              🌱
            </div>
            <h3 className="font-bold text-[#2D2D2D] text-base mb-2 relative z-10">
              Where sustainability meets productivity
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed relative z-10">
              We prove that responsible farming and high productivity can coexist — building a better tomorrow today.
            </p>
          </div>

          {/* Motto Card 3 */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 relative overflow-hidden md:col-span-2 group hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
            <span className="text-6xl font-bold text-[#F5C518] opacity-20 absolute top-2 right-4 pointer-events-none">∞</span>
            <div className="bg-[#EAF5EE] rounded-xl w-10 h-10 flex items-center justify-center text-xl mb-3">
              🚀
            </div>
            <h3 className="font-bold text-[#2D2D2D] text-base mb-2 relative z-10">
              We grow beyond limits
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed relative z-10 flex-1 max-w-2xl">
              From our humble beginnings in Ngoma to serving Kigali — 30 Plus is just getting started. Our vision is to become Rwanda's most trusted poultry brand.
            </p>
          </div>

        </div>
        </div>
      </section>

      {/* ─── 3. VALUES SECTION ─── */}
      <section className="bg-white p-10">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8 md:text-center text-left">
            <span className="text-[#E07B00] font-bold text-xs tracking-[0.2em] uppercase block mb-2">OUR FOCUS</span>
            <h2 className="text-3xl font-bold text-[#2D2D2D] mb-2 tracking-tight">What Drives Us</h2>
            <p className="text-sm text-gray-500 font-medium max-w-md md:mx-auto">Three pillars that guide everything we do at 30 Plus</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Value 1 */}
            <div className="bg-[#EAF5EE] rounded-2xl p-6 group hover:-translate-y-1 hover:shadow-md transition-all duration-300">
              <div className="text-3xl mb-3">⭐</div>
              <h3 className="font-bold text-[#2D2D2D] text-base mb-2">Quality</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Every egg and every cut of meat meets our strict quality standards before reaching your table.
              </p>
            </div>

            {/* Value 2 */}
            <div className="bg-[#FFF8E1] rounded-2xl p-6 group hover:-translate-y-1 hover:shadow-md transition-all duration-300">
              <div className="text-3xl mb-3">♻️</div>
              <h3 className="font-bold text-[#2D2D2D] text-base mb-2">Sustainability</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                We farm responsibly — caring for our animals, our land and our community every single day.
              </p>
            </div>

            {/* Value 3 */}
            <div className="bg-[#FFF3E0] rounded-2xl p-6 group hover:-translate-y-1 hover:shadow-md transition-all duration-300">
              <div className="text-3xl mb-3">💪</div>
              <h3 className="font-bold text-[#2D2D2D] text-base mb-2">Nutrition</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Rich in protein and nutrients — our products fuel healthy families and growing businesses.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 4. OUR STORY SECTION ─── */}
      <section className="bg-[#1B6B3A] p-10">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          
          {/* LEFT SIDE */}
          <div>
            <h2 className="text-2xl font-bold text-white leading-snug mb-4">
              Our Story — <br />
              Built on <span className="text-[#F5C518]">Passion & Purpose</span>
            </h2>
            <p className="text-white/65 text-sm leading-relaxed mb-4">
              30 Plus was founded with a simple but powerful vision — to make fresh, quality poultry products accessible to every Rwandan family. Starting from our main farm in Ngoma, Eastern Province, we have grown to serve Kigali through our kiosks in Batsinda and Nyabugogo.
            </p>
            <p className="text-white/65 text-sm leading-relaxed">
              We believe that great food starts at the farm — with healthy birds, clean water, quality feed and dedicated workers who care about every detail.
            </p>
          </div>

          {/* RIGHT SIDE */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 border border-white/15 rounded-2xl p-4 text-center group hover:bg-white/15 transition-all duration-300">
              <div className="text-[#F5C518] text-2xl font-bold">3+</div>
              <div className="text-white/55 text-xs mt-1 font-medium tracking-wide">Locations</div>
            </div>
            <div className="bg-white/10 border border-white/15 rounded-2xl p-4 text-center group hover:bg-white/15 transition-all duration-300">
              <div className="text-[#F5C518] text-2xl font-bold">100%</div>
              <div className="text-white/55 text-xs mt-1 font-medium tracking-wide">Farm Fresh</div>
            </div>
            <div className="bg-white/10 border border-white/15 rounded-2xl p-4 text-center group hover:bg-white/15 transition-all duration-300">
              <div className="text-[#F5C518] text-2xl font-bold uppercase tracking-tight">Daily</div>
              <div className="text-white/55 text-xs mt-1 font-medium tracking-wide">Fresh Stock</div>
            </div>
            <div className="bg-white/10 border border-white/15 rounded-2xl p-4 text-center group hover:bg-white/15 transition-all duration-300">
              <div className="text-[#F5C518] text-2xl font-bold">🇷🇼</div>
              <div className="text-white/55 text-xs mt-1 font-medium tracking-wide">Proudly Rwandan</div>
            </div>
          </div>

        </div>
      </section>

      {/* ─── 5. LOCATIONS STRIP ─── */}
      <section className="bg-[#F7F7F7] p-10">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8 md:text-center text-left">
            <span className="text-[#1B6B3A] font-bold text-xs tracking-widest uppercase block mb-2">WHERE TO FIND US</span>
            <h2 className="text-lg font-bold text-[#2D2D2D]">Our Locations</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-4 border border-gray-100 group hover:-translate-y-1 hover:shadow-md transition-all duration-300">
              <span className="bg-[#EAF5EE] text-[#1B6B3A] text-xs font-bold px-3 py-1 rounded-full inline-block mb-2 tracking-widest uppercase">HEADQUARTERS</span>
              <h3 className="font-bold text-[#2D2D2D] text-base mb-1">Ngoma, Eastern Province</h3>
              <p className="text-gray-400 text-xs">Main farm & operations</p>
            </div>

            <div className="bg-white rounded-xl p-4 border border-gray-100 group hover:-translate-y-1 hover:shadow-md transition-all duration-300">
              <span className="bg-[#EAF5EE] text-[#1B6B3A] text-xs font-bold px-3 py-1 rounded-full inline-block mb-2 tracking-widest uppercase">EGGS</span>
              <h3 className="font-bold text-[#2D2D2D] text-base mb-1">Batsinda, Kigali</h3>
              <p className="text-gray-400 text-xs">Fresh eggs daily</p>
            </div>

            <div className="bg-white rounded-xl p-4 border border-gray-100 group hover:-translate-y-1 hover:shadow-md transition-all duration-300">
              <span className="bg-[#EAF5EE] text-[#1B6B3A] text-xs font-bold px-3 py-1 rounded-full inline-block mb-2 tracking-widest uppercase">EGGS & MEAT</span>
              <h3 className="font-bold text-[#2D2D2D] text-base mb-1">Nyabugogo, Kigali</h3>
              <p className="text-gray-400 text-xs">Eggs & chicken meat</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 6. CTA SECTION ─── */}
      <section className="bg-white p-10">
        <div className="max-w-4xl mx-auto">
          <div className="bg-[#1B6B3A] rounded-2xl p-8 text-center w-full shadow-lg relative overflow-hidden group">
            <div className="relative z-10 w-full flex flex-col items-center justify-center">
              <h2 className="text-white text-xl font-bold mb-2">Ready to Order Fresh Products?</h2>
              <p className="text-white/65 text-sm mb-5 max-w-sm mx-auto">
                Visit our marketplace and order directly via WhatsApp or call!
              </p>
              <Link 
                href="/#marketplace" 
                className="inline-block bg-[#F5C518] text-[#2D2D2D] font-bold rounded-full px-8 py-3 text-sm hover:bg-[#E07B00] hover:text-white transition-all duration-300 shadow-md transform hover:-translate-y-0.5 active:scale-95"
              >
                Order
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
