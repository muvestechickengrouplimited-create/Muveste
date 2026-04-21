import React from 'react';

export default function ContactPage() {
  return (
    <div className="min-h-[75vh] bg-[#f9fafb] p-6 py-24 flex items-center justify-center">
      <div className="max-w-4xl w-full bg-white rounded-[3rem] p-10 md:p-20 shadow-2xl border border-gray-100">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-[#1B6B3A] mb-6 tracking-tight">Contact Us</h1>
          <p className="text-gray-500 text-xl font-medium">We'd love to hear from you. Reach out to the appropriate department directly.</p>
        </div>

        <div className="space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-8 bg-[#EAF5EE] rounded-3xl border-l-8 border-[#1B6B3A] hover:shadow-md transition-shadow">
            <div className="mb-4 md:mb-0">
              <h3 className="font-bold text-2xl text-[#1B6B3A] mb-1">General Inquiries / HQ</h3>
              <p className="text-gray-600 font-medium">Ngoma Farm & Corporate Services</p>
            </div>
            <p className="text-3xl font-black text-[#111827] tracking-wider">0788227587</p>
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-8 bg-yellow-50 rounded-3xl border-l-8 border-[#F5C518] hover:shadow-md transition-shadow">
            <div className="mb-4 md:mb-0">
              <h3 className="font-bold text-2xl text-yellow-900 mb-1">Egg Kiosk</h3>
              <p className="text-yellow-700 font-medium">Retail & Wholesale Eggs (Nyabugogo)</p>
            </div>
            <p className="text-3xl font-black text-[#111827] tracking-wider">0793528820</p>
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-8 bg-orange-50 rounded-3xl border-l-8 border-[#E07B00] hover:shadow-md transition-shadow">
            <div className="mb-4 md:mb-0">
              <h3 className="font-bold text-2xl text-orange-900 mb-1">butcher Shop</h3>
              <p className="text-orange-700 font-medium">Fresh Meat Orders (Nyabugogo)</p>
            </div>
            <p className="text-3xl font-black text-[#111827] tracking-wider">0795092624</p>
          </div>
        </div>
      </div>
    </div>
  );
}
