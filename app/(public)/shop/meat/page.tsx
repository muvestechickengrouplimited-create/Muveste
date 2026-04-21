import React from 'react';

export default function MeatShop() {
  return (
    <div className="min-h-[70vh] bg-white text-center flex flex-col items-center justify-center p-6 py-24">
      <h1 className="text-5xl md:text-6xl font-bold text-[#1B6B3A] mb-6 tracking-tight">Premium Broiler Meat</h1>
      <p className="text-xl text-gray-500 max-w-2xl mb-16 leading-relaxed">Professionally processed, high-quality broiler meat at our Nyabugogo butcher Shop. Freshness guaranteed daily.</p>

      <div className="bg-gradient-to-br from-[#fff7ed] to-white p-16 rounded-[3rem] shadow-xl border border-orange-100 max-w-2xl w-full flex flex-col items-center transform transition-transform hover:scale-105 duration-300">
        <div className="w-28 h-28 bg-[#E07B00] text-white shadow-lg rounded-full flex items-center justify-center mb-8 ring-8 ring-orange-50">
          <span className="text-5xl">🍗</span>
        </div>
        <h2 className="text-4xl font-bold mb-4 text-[#111827]">Order via WhatsApp</h2>
        <p className="text-lg text-gray-500 mb-10 max-w-md">Click below to message our Master butcher directly for stock updates and bulk meat order reservations.</p>
        <a href="https://wa.me/250795092624" target="_blank" rel="noopener noreferrer" className="w-full">
          <button className="w-full h-20 bg-[#E07B00] hover:bg-[#c46b00] text-white rounded-2xl text-2xl font-bold shadow-lg hover:shadow-2xl transition-all focus:outline-none focus:ring-4 focus:ring-[#E07B00]/50">
            WhatsApp 0795092624
          </button>
        </a>
      </div>
    </div>
  );
}
