'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const WhatsAppIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.554 4.103 1.523 5.824L.057 23.882l6.233-1.635A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.007-1.368l-.36-.214-3.7.97.988-3.61-.234-.37A9.818 9.818 0 1112 21.818z"/>
  </svg>
);

const PhoneIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);

export default function HomePage() {
  const [products, setProducts] = useState<{ category: string; name: string; price: number; available?: boolean }[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const checkoutRef = useRef<HTMLDivElement>(null);

  const [qty, setQty] = useState(1);
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');

  useEffect(() => {
    fetch('/api/products')
      .then(r => r.json())
      .then((res: { data: { category: string; name: string; price: number; available?: boolean }[] }) => setProducts(res.data || []))
      .catch(e => console.error(e));
  }, []);

  const handleOrderClick = (productName: string) => {
    setSelectedProduct(productName);
    setQty(1);
    setShowCheckout(true);
    setTimeout(() => {
      checkoutRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleOrder = () => {
    setShowThankYou(true);
    setTimeout(() => {
      setShowThankYou(false);
      setShowCheckout(false);
    }, 3000);
  };

  const getProduct = (category: string) => {
    return products.find((p) => p.category === category);
  };

  const getPrice = (category: string) => {
    const p = getProduct(category);
    return p ? p.price : null;
  };

  const isAvailable = (category: string) => {
    const p = getProduct(category);
    return p ? p.available : true; // Default to true if not specified
  };


  const currentCategory = selectedProduct === 'Fresh Eggs' ? 'eggs' : 'meat';
  const price = getPrice(currentCategory);
  const totalPrice = (price || 0) * qty;

  const whatsappMessage = `Hello 30 Plus! 
Product: ${selectedProduct}
Quantity: ${qty} ${selectedProduct === 'Fresh Eggs' ? 'tray(s)' : 'kg'}
Total: RWF ${totalPrice}
Name: ${customerName}
Phone: ${phone}
Location: ${location}`;

  return (
    <div className="flex flex-col min-h-screen font-sans selection:bg-[#F5C518] selection:text-[#1B6B3A]">

      {/* ─── HERO SECTION ─── */}
      <section className="bg-[#1B6B3A] pt-12 pb-24 px-6 md:px-12 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-20 right-[-10%] w-[30vw] h-[30vw] border border-white/5 rounded-full pointer-events-none" />
        <div className="absolute bottom-10 left-[5%] w-[15vw] h-[15vw] border-2 border-white/5 rounded-full pointer-events-none" />
        
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
          <div className="hero-left text-center lg:text-left">
            <span className="inline-block bg-[#F5C518]/20 text-[#F5C518] text-xs font-bold px-3 py-1 rounded-full mb-6 uppercase tracking-widest">
              FRESH FROM THE FARM
            </span>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.1] mb-6 tracking-tight">
              Quality Poultry <br />
              <span className="text-[#F5C518]">Delivered Fresh</span> <br />
              to Kigali
            </h1>
            <p className="text-white/70 text-base md:text-lg leading-relaxed max-w-lg mb-10 mx-auto lg:mx-0 font-medium">
              30 Plus brings you the freshest farm eggs and premium <br className="hidden md:block"/>
              chicken meat directly from our farms in Rwanda.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <a href="#marketplace" className="bg-[#F5C518] text-[#2D2D2D] font-bold rounded-full px-8 py-4 text-center hover:bg-[#E07B00] hover:text-white transform hover:-translate-y-1 transition-all duration-300 shadow-lg shadow-black/10 active:scale-95">
                Order
              </a>
              <a href="#locations" className="border-2 border-white/40 text-white font-bold rounded-full px-8 py-4 text-center hover:bg-white/10 transition-all duration-300 active:scale-95">
                Our Locations
              </a>
            </div>
          </div>

          <div className="hero-right">
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-[2rem] p-8 md:p-12 shadow-2xl relative overflow-hidden">
              <div className="grid grid-cols-1 gap-10">
                <div className="flex flex-col gap-1">
                  <span className="text-[#F5C518] text-4xl font-bold tabular-nums">3+</span>
                  <span className="text-white/60 text-xs font-bold uppercase tracking-widest">Locations in Rwanda</span>
                </div>
                <div className="h-px bg-white/10 w-24" />
                <div className="flex flex-col gap-1">
                  <span className="text-[#F5C518] text-4xl font-bold tabular-nums">100%</span>
                  <span className="text-white/60 text-xs font-bold uppercase tracking-widest">Farm Fresh Quality</span>
                </div>
                <div className="h-px bg-white/10 w-24" />
                <div className="flex flex-col gap-1">
                  <span className="text-[#F5C518] text-4xl font-bold tabular-nums uppercase tracking-tight">Daily</span>
                  <span className="text-white/60 text-xs font-bold uppercase tracking-widest">Fresh Stock Available</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── MARKETPLACE SECTION ─── */}
      <section id="marketplace" className="bg-[#F7F7F7] py-24 md:py-32 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <span className="text-[#E07B00] font-bold text-sm tracking-[0.2em] uppercase">MARKETPLACE</span>
            <h2 className="text-4xl md:text-5xl font-bold text-[#111827] tracking-tight">Fresh Products</h2>
            <p className="text-gray-500 font-medium text-lg">Farm fresh — order directly via WhatsApp or call!</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch mb-16">
            
            {/* EGG CARD */}
            <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:-translate-y-1 hover:shadow-lg transition-all duration-200 h-full flex flex-col">
              <div className="relative w-full h-32 md:h-40 bg-white overflow-hidden">
                <Image src="/eggs.jpg" fill className="object-contain p-3" alt="Fresh Eggs" />
                <span className="absolute top-3 left-3 bg-[#1B6B3A] text-white text-[10px] font-bold px-2 py-1 rounded-full tracking-wider z-10">DAILY FRESH</span>
              </div>
              <div className="px-4 pb-4 pt-3 flex-1 flex flex-col justify-between">
                <div>
                  <p className="font-bold text-[#2D2D2D] text-base mb-1">Fresh Farm Eggs</p>
                  <p className="text-xs text-gray-400 mb-3">Farm fresh eggs collected daily from our layer hens</p>
                  <div className="h-px bg-gray-100 mb-3" />
                </div>
                <div className="flex justify-between items-center mt-auto">
                  <div>
                    <p className="text-lg font-bold text-[#E07B00]">
                      {getPrice('eggs') !== null ? `RWF ${getPrice('eggs')!.toLocaleString()}` : '---'}
                    </p>
                    <p className="text-xs text-gray-400">per tray</p>
                  </div>
                  <button 
                    onClick={() => handleOrderClick('Fresh Eggs')}
                    className="rounded-xl px-4 py-2 text-xs font-bold transition bg-[#F5C518] text-[#2D2D2D] hover:bg-[#E07B00] hover:text-white"
                  >
                    Order
                  </button>
                </div>
              </div>
            </div>

            {/* MEAT CARD */}
            <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:-translate-y-1 hover:shadow-lg transition-all duration-200 h-full flex flex-col">
              <div className="relative w-full h-32 md:h-40 bg-white overflow-hidden">
                <Image src="/chicken.jpg" fill className="object-contain p-3" alt="Chicken Meat" />
                <span className="absolute top-3 left-3 bg-[#E07B00] text-white text-[10px] font-bold px-2 py-1 rounded-full tracking-wider z-10">PREMIUM CUT</span>
              </div>
              <div className="px-4 pb-4 pt-3 flex-1 flex flex-col justify-between">
                <div>
                  <p className="font-bold text-[#2D2D2D] text-base mb-1">Premium Chicken Meat</p>
                  <p className="text-xs text-gray-400 mb-3">Freshly processed broiler chicken from our farms</p>
                  <div className="h-px bg-gray-100 mb-3" />
                </div>
                <div className="flex justify-between items-center mt-auto">
                  <div>
                    <p className="text-lg font-bold text-[#E07B00]">
                      {getPrice('meat') !== null ? `RWF ${getPrice('meat')!.toLocaleString()}` : '---'}
                    </p>
                    <p className="text-xs text-gray-400">per kg</p>
                  </div>
                  <button 
                    onClick={() => handleOrderClick('Chicken Meat')}
                    className="rounded-xl px-4 py-2 text-xs font-bold transition bg-[#F5C518] text-[#2D2D2D] hover:bg-[#E07B00] hover:text-white"
                  >
                    Order
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* CHECKOUT SECTION */}
          {showCheckout && selectedProduct && (
            <div ref={checkoutRef} className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl scroll-mt-24 relative">
              <button
                onClick={() => setShowCheckout(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center font-bold text-lg"
              >
                ×
              </button>

              {showThankYou ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-[#EAF5EE] rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-[#1B6B3A]">✓</svg>
                  </div>
                  <h3 className="text-lg font-bold text-[#2D2D2D]">
                    Thank you for your order!
                  </h3>
                  <p className="text-sm text-gray-400 mt-2">
                    We will contact you shortly to confirm.
                  </p>
                </div>
              ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                
                {/* LEFT SIDE: Order Summary */}
                <div>
                  <h3 className="text-lg font-bold text-[#2D2D2D] mb-6 border-b border-gray-100 pb-4">Complete Your Order</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Full Name *</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="Enter your full name" 
                        value={customerName}
                        onChange={e => setCustomerName(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#1B6B3A]/20 focus:border-[#1B6B3A] transition-all"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Phone Number *</label>
                      <input 
                        type="tel" 
                        required 
                        placeholder="07XX XXX XXX" 
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#1B6B3A]/20 focus:border-[#1B6B3A] transition-all"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Location *</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="Enter your delivery location" 
                        value={location}
                        onChange={e => setLocation(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#1B6B3A]/20 focus:border-[#1B6B3A] transition-all"
                      />
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-2">
                        <label className="block text-sm font-bold text-gray-700 mb-1">Product</label>
                        <input 
                          type="text" 
                          readOnly 
                          value={selectedProduct}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-500 font-medium font-sans outline-none"
                        />
                      </div>
                      <div className="col-span-1">
                        <label className="block text-sm font-bold text-gray-700 mb-1">
                          {selectedProduct === 'Fresh Eggs' ? 'Number of Trays' : 'Weight (kg)'}
                        </label>
                        <div className="flex items-center gap-2">
                          <input 
                            type="number" 
                            value={qty === 0 ? '' : qty}
                            min={1}
                            placeholder="1"
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '') {
                                setQty(0);
                              } else {
                                setQty(Math.max(1, parseInt(val) || 1));
                              }
                            }}
                            onBlur={(e) => {
                              if (!e.target.value || parseInt(e.target.value) < 1) {
                                setQty(1);
                              }
                            }}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#1B6B3A]/20 focus:border-[#1B6B3A] transition-all font-bold"
                          />
                          <span className="text-sm text-gray-400 font-medium">
                            {selectedProduct === 'Fresh Eggs' ? 'trays' : 'kg'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4">
                      <label className="block text-sm font-bold text-gray-700 mb-2">Total Price (RWF)</label>
                      <div className="bg-[#FFF8E1] border-2 border-[#F5C518] rounded-xl p-4 text-2xl font-bold text-[#2D2D2D] font-mono flex items-center justify-between">
                        <span className="text-sm text-gray-600 font-sans font-medium">Auto-calculated:</span>
                        <span>RWF {totalPrice}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT SIDE: How to Order */}
                <div className="flex flex-col justify-center">
                  <div className="bg-white rounded-2xl p-0">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-4">Order via WhatsApp</h3>
                    
                    {selectedProduct === 'Fresh Eggs' && (
                      <button 
                        onClick={() => {
                          handleOrder();
                          window.open(`https://wa.me/250793528820?text=${encodeURIComponent(whatsappMessage)}`, '_blank');
                        }}
                        className="bg-[#25D366] text-white w-full rounded-xl py-3 font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#128C7E] transition-colors mb-4"
                      >
                        <WhatsAppIcon /> Send Order
                      </button>
                    )}

                    {selectedProduct === 'Chicken Meat' && (
                      <button 
                        onClick={() => {
                          handleOrder();
                          window.open(`https://wa.me/250795092624?text=${encodeURIComponent(whatsappMessage)}`, '_blank');
                        }}
                        className="bg-[#25D366] text-white w-full rounded-xl py-3 font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#128C7E] transition-colors mb-4"
                      >
                        <WhatsAppIcon /> Send Order
                      </button>
                    )}

                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mt-6 mb-4">Or Call Us Directly</h3>
                    <button 
                      onClick={() => {
                        handleOrder();
                        window.location.href = "tel:+250788227587";
                      }}
                      className="bg-white text-[#1B6B3A] border-2 border-[#1B6B3A] rounded-xl w-full py-3 font-bold text-sm hover:bg-[#1B6B3A] hover:text-white transition flex items-center justify-center gap-2"
                    >
                      <PhoneIcon /> Call Us Directly
                    </button>

                    <div className="bg-[#FFF3E0] border-l-4 border-[#E07B00] rounded-r-xl p-4 text-xs text-gray-600 leading-relaxed mt-6">
                      Click WhatsApp to send your order directly with all details pre-filled. Our team will confirm and arrange delivery to your location!
                    </div>
                  </div>
                </div>

              </div>
              )}
            </div>
          )}

        </div>
      </section>
      {/* ─── LOCATIONS SECTION ─── */}
      <section id="locations" className="bg-[#1B6B3A] py-24 md:py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <span className="text-[#9FE1CB] font-bold text-sm tracking-[0.2em] uppercase">OUR LOCATIONS</span>
            <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">Find Us in Rwanda</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            <div className="bg-white/10 border border-white/15 rounded-[1.5rem] p-8 hover:bg-white/15 transition-all duration-300">
              <span className="bg-[#F5C518]/20 text-[#F5C518] text-[10px] font-bold px-3 py-1.5 rounded-full inline-block mb-6 uppercase tracking-widest">HEADQUARTERS</span>
              <h3 className="text-white font-bold text-xl mb-4">Ngoma, Eastern Province</h3>
              <p className="text-white/55 text-sm leading-relaxed font-medium">
                Our main farm and headquarters. Home of our layer and broiler farm operations.
              </p>
            </div>

            <div className="bg-white/10 border border-white/15 rounded-[1.5rem] p-8 hover:bg-white/15 transition-all duration-300">
              <span className="bg-[#F5C518]/20 text-[#F5C518] text-[10px] font-bold px-3 py-1.5 rounded-full inline-block mb-6 uppercase tracking-widest">EGGS</span>
              <h3 className="text-white font-bold text-xl mb-4">Batsinda, Kigali</h3>
              <p className="text-white/55 text-sm leading-relaxed font-medium">
                Egg kiosk serving Kigali residents with fresh eggs from our farm daily.
              </p>
            </div>

            <div className="bg-white/10 border border-white/15 rounded-[1.5rem] p-8 hover:bg-white/15 transition-all duration-300">
              <span className="bg-[#F5C518]/20 text-[#F5C518] text-[10px] font-bold px-3 py-1.5 rounded-full inline-block mb-6 uppercase tracking-widest">EGGS & MEAT</span>
              <h3 className="text-white font-bold text-xl mb-4">Nyabugogo, Kigali</h3>
              <p className="text-white/55 text-sm leading-relaxed font-medium">
                Our Nyabugogo branch offering fresh eggs and premium chicken meat.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CONTACT SECTION ─── */}
      <section id="contact" className="bg-white py-24 md:py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-[#1B6B3A] rounded-[2.5rem] p-8 md:p-16 flex flex-col lg:flex-row justify-between items-center gap-12 relative overflow-hidden shadow-2xl shadow-green-900/10">
            {/* Decals */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            
            <div className="text-center lg:text-left z-10 max-w-lg">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight leading-tight">Get in Touch with 30 Plus</h2>
              <p className="text-white/65 text-base md:text-lg font-medium leading-relaxed">
                Questions about orders or bulk pricing? We're always happy to help!
              </p>
            </div>

            <div className="text-center lg:text-right z-10 min-w-max">
              <div className="mb-6">
                <a href="tel:+250788227587" className="text-[#F5C518] text-3xl md:text-4xl font-bold tracking-tight hover:opacity-80 transition-opacity drop-shadow-sm">
                  +250 788 227 587
                </a>
                <p className="text-white/50 text-xs font-bold uppercase tracking-widest mt-2 px-1">Primary contact — call or WhatsApp</p>
              </div>
              <a href="https://wa.me/250788227587" target="_blank" className="bg-[#25D366] text-white rounded-full px-8 py-4 font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#128C7E] shadow-xl hover:-translate-y-1 transition-all group active:scale-95">
                <WhatsAppIcon /> <span className="translate-y-[0.5px]">WhatsApp Us</span>
              </a>
            </div>
          </div>
        </div>
      </section>


      {/* Animation Styles */}
      <style jsx>{`
        .animate-in {
          animation-duration: 0.3s;
          animation-timing-function: ease-out;
          animation-fill-mode: forwards;
        }
        @keyframes slideInDown {
          from { opacity: 0; transform: translateY(-10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
