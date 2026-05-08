import React from 'react';

export default function ContactPage() {
  return (
    <div className="min-h-[75vh] bg-[#f5f5f0] p-6 py-24 flex items-center justify-center">
      <div className="max-w-4xl w-full bg-white rounded-[3rem] p-10 md:p-20 shadow-2xl border border-gray-100">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold font-['Cormorant_Garamond',serif] text-[#228B22] mb-6 tracking-tight">Contact Us</h1>
          <p className="text-gray-500 text-xl font-medium">We'd love to hear from you. Reach out to us directly for orders or inquiries.</p>
        </div>

        <div className="space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-8 bg-[#EAF5EE] rounded-3xl border-l-8 border-[#228B22] hover:shadow-md transition-shadow">
            <div className="mb-4 md:mb-0">
              <h3 className="font-bold text-2xl text-[#228B22] mb-1">General Inquiries / HQ</h3>
              <p className="text-gray-600 font-medium">Ngoma Farm & Corporate Services</p>
            </div>
            <p className="text-2xl font-black text-[#111827] tracking-wider">+250 785 329 989</p>
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-8 bg-[rgba(255,222,26,0.06)] rounded-3xl border-l-8 border-[#FFDE1A] hover:shadow-md transition-shadow">
            <div className="mb-4 md:mb-0">
              <h3 className="font-bold text-2xl text-amber-950 mb-1">Kigali Butcher Shop</h3>
              <p className="text-amber-700 font-medium">Fresh Meat Orders (Nyabugogo Outlet)</p>
            </div>
            <p className="text-2xl font-black text-[#111827] tracking-wider">+250 785 329 989</p>
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-8 bg-[#EAF5EE] rounded-3xl border-l-8 border-[#228B22] hover:shadow-md transition-shadow">
            <div className="mb-4 md:mb-0">
              <h3 className="font-bold text-2xl text-[#228B22] mb-1">Eastern Province Butcher Outlets</h3>
              <p className="text-gray-600 font-medium">Fresh Meat Orders (Rwamagana & Kibungo)</p>
            </div>
            <p className="text-2xl font-black text-[#111827] tracking-wider">+250 785 329 989</p>
          </div>
        </div>
      </div>
    </div>
  );
}
