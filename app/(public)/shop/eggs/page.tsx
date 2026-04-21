import React from 'react';

export default function EggsShop() {
  return (
    <div className="min-h-[70vh] bg-white text-center flex flex-col items-center justify-center p-6 py-24">
      <h1 className="text-5xl md:text-6xl font-bold text-[#1B6B3A] mb-6 tracking-tight">Premium Farm Fresh Eggs</h1>
      <p className="text-xl text-gray-500 max-w-2xl mb-16 leading-relaxed">The highest quality, locally sourced premium eggs in Rwanda. Available directly for wholesale and retail purchases.</p>
      
      <div className="bg-gradient-to-br from-[#EAF5EE] to-white p-16 rounded-[3rem] shadow-xl border border-[#1B6B3A]/10 max-w-2xl w-full flex flex-col items-center transform transition-transform hover:scale-105 duration-300">
        <div className="w-28 h-28 bg-white border-4 border-[#F5C518] shadow-lg rounded-full flex items-center justify-center mb-8">
           <span className="text-5xl">🥚</span>
        </div>
        <h2 className="text-4xl font-bold mb-4 text-[#111827]">Order via WhatsApp</h2>
        <p className="text-lg text-gray-500 mb-10 max-w-md">Click below to message our Eggs Shop directly for current prices, availability, and bulk delivery scheduling.</p>
        <a href="https://wa.me/250793528820" target="_blank" rel="noopener noreferrer" className="w-full">
          <button className="w-full h-20 bg-[#F5C518] hover:bg-[#dcae15] text-[#111827] rounded-2xl text-2xl font-bold shadow-lg hover:shadow-2xl transition-all focus:outline-none focus:ring-4 focus:ring-[#F5C518]/50">
            WhatsApp 0793528820
          </button>
        </a>
      </div>
    </div>
  );
}
