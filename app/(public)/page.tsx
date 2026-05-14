'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import emailjs from '@emailjs/browser';

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
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [qty, setQty] = useState(1);
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  
  const checkoutRef = useRef<HTMLDivElement>(null);

  const locations = [
    { id: 'Kibungo',   label: 'Kibungo',   desc: 'Eastern Province' },
    { id: 'Rwamagana', label: 'Rwamagana', desc: 'Eastern Province' },
    { id: 'Nyabugogo', label: 'Nyabugogo', desc: 'Kigali' },
  ];

  const [formData, setFormData] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!selectedLocation) return
    setLoadingPrices(true)
    fetch(`/api/products?location=${selectedLocation}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) setProducts(data.products)
      })
      .catch(() => {})
      .finally(() => setLoadingPrices(false))
  }, [selectedLocation])

  const handleOrderClick = (product: any) => {
    setSelectedProduct(product);
    setQty(1);
    setIsCheckoutOpen(true);
    setTimeout(() => {
      checkoutRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const quantity = qty;
  const unitPrice = selectedProduct?.price ?? 0;
  const totalPrice = quantity * unitPrice;

  const whatsappNumbers: Record<string, string> = {
    Kibungo  : '250785329989',
    Rwamagana: '250785329989',
    Nyabugogo: '250785329989',
  }
  
  const whatsappNumber = selectedLocation ? (whatsappNumbers[selectedLocation] ?? '250785329989') : '250785329989';

  const whatsappMessage = 
    `Hello Muveste!\n` +
    `Branch: ${selectedLocation}\n` +
    `Product: ${selectedProduct?.name}\n` +
    `Quantity: ${quantity} kg\n` +
    `Total: RWF ${totalPrice.toLocaleString()}\n` +
    `Name: ${customerName}\n` +
    `Phone: ${phone}\n` +
    `Location: ${location}`;

  const sendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError('');
    try {
      await emailjs.send(
        process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || 'default_service',
        process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || 'default_template',
        {
          name      : formData.name,     // Expected by {{name}} in EmailJS template
          email     : formData.email,    // Expected by {{email}} in EmailJS template (Reply To)
          message   : formData.message,  // Expected by {{message}} in EmailJS template
          time      : new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }), // Expected by {{time}} in EmailJS template
          from_name : formData.name,     // Fallback
          from_email: formData.email,    // Fallback
          phone     : formData.phone,
          subject   : formData.subject,
          to_name   : 'Muveste Team',
        },
        process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || 'default_public_key'
      );
      setSuccess(true);
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
      setTimeout(() => setSuccess(false), 5000);
    } catch (err: any) {
      console.error('EmailJS submission failed:', err);
      const details = err?.text || err?.message || (typeof err === 'string' ? err : JSON.stringify(err));
      setError(`Failed to send: ${details}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">

      {/* HERO SECTION */}
      <section className="bg-[#228B22] min-h-[92vh] flex items-center relative overflow-hidden px-6 md:px-[60px] py-[60px] md:py-0">
        {/* Decorative elements */}
        <div className="absolute border-[1px] border-[rgba(255,222,26,0.12)] w-[500px] h-[500px] rounded-full top-[-100px] right-[-80px] pointer-events-none" />
        <div className="absolute bg-[rgba(255,222,26,0.05)] border-[1px] border-[rgba(255,222,26,0.08)] w-[340px] h-[340px] rounded-full top-[40px] right-[60px] pointer-events-none" />
        <div className="absolute bg-[rgba(255,222,26,0.15)] w-[60px] h-[60px] rounded-[50%_0_50%_50%] top-[120px] left-[80px] transform rotate-[-30deg] pointer-events-none" />

        <div className="max-w-[1100px] mx-auto w-full grid grid-cols-1 md:grid-cols-2 md:grid-rows-[auto_auto] gap-8 md:gap-y-0 md:gap-x-12 items-center relative z-10">
          {/* WORDS (Badge + Title + Subtitle) */}
          <div className="flex flex-col text-left order-1 md:order-1 md:col-start-1 md:row-start-1">
            <span className="inline-flex items-center gap-2 bg-[rgba(255,222,26,0.12)] border border-[rgba(255,222,26,0.3)] text-[#FFDE1A] text-[11px] md:text-[12px] font-bold px-[18px] py-[8px] rounded-[30px] tracking-widest uppercase w-fit">
              <span className="w-[6px] h-[6px] bg-[#FFDE1A] rounded-full" />
              PREMIUM QUALITY POULTRY
            </span>

            <h1 className="font-['Cormorant_Garamond',serif] text-6xl md:text-[78px] lg:text-[84px] font-bold text-white leading-[1.0] mt-[20px]">
              Where Quality <br />
              Meets <br />
              <span className="text-[#FFDE1A]">Excellence</span>
            </h1>

            <p className="text-[rgba(255,255,255,0.7)] text-[17px] md:text-[18px] leading-[1.8] max-w-[460px] mt-[20px]">
              Experience the finest quality poultry, raised with care and delivered fresh daily from our farm to your table.
            </p>
          </div>

          {/* PHOTO */}
          <div className="flex justify-center items-center py-8 md:py-0 order-2 md:order-2 md:col-start-2 md:row-start-1 md:row-span-2">
            <div className="relative w-[340px] h-[340px] md:w-[480px] md:h-[480px] border border-[rgba(255,222,26,0.18)] rounded-full flex items-center justify-center">
              <div className="w-[295px] h-[295px] md:w-[420px] md:h-[420px] bg-[rgba(255,222,26,0.06)] border border-[rgba(255,222,26,0.1)] rounded-full overflow-hidden relative">
                <Image src="/full.png" alt="Farm Fresh Chicken" fill className="object-cover" />
              </div>
            </div>
          </div>

          {/* CTA BUTTONS */}
          <div className="flex flex-col sm:flex-row gap-[14px] mt-4 md:mt-[40px] w-full sm:w-auto order-3 md:order-3 md:col-start-1 md:row-start-2 md:self-start">
            <a href="#products" className="bg-[#FFDE1A] text-[#133813] rounded-xl px-[32px] py-[16px] text-base font-bold shadow-[0_4px_20px_rgba(255,222,26,0.3)] hover:bg-[#e6c710] hover:-translate-y-[1px] transition-all text-center">
              Order Now
            </a>
            <Link href="/about" className="bg-transparent text-white border-2 border-[rgba(255,255,255,0.25)] rounded-xl px-[32px] py-[16px] text-base font-semibold hover:border-[rgba(255,255,255,0.6)] transition-all text-center">
              Our Story
            </Link>
          </div>
        </div>
      </section>

      {/* PRODUCTS SECTION */}
      <section id="products" className="bg-[#f5f5f0] py-[100px] px-6 md:px-[60px]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <span className="inline-block bg-[rgba(0,100,0,0.08)] border border-[rgba(0,100,0,0.15)] text-[#006400] text-[9px] font-bold px-3 py-1.5 rounded-full tracking-widest uppercase mb-4">OUR PRODUCTS</span>
            <h2 className="font-['Cormorant_Garamond',serif] text-[48px] font-bold text-[#1a1814] leading-tight">Fresh from the Farm</h2>
            <p className="text-[#9a9890] text-[15px] mt-2">Quality you can taste, freshness you can trust.</p>
          </div>

          <div className="mt-[56px]">
            {/* Location selector (show first) */}
            <div className="text-center mb-12">
              <p className="text-sm text-gray-500 mb-4">
                Select your nearest location to see prices
              </p>
              <div className="flex justify-center gap-4 flex-wrap">
                {locations.map(loc => (
                  <button
                    key={loc.id}
                    onClick={() => setSelectedLocation(loc.id)}
                    className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all border-2 ${selectedLocation === loc.id
                        ? 'bg-[#006400] text-white border-[#006400]'
                        : 'bg-white text-[#006400] border-[#006400]/30 hover:border-[#006400]'
                      }`}>
                    📍 {loc.label}
                    <span className="block text-xs font-normal opacity-70">
                      {loc.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {!selectedLocation ? (
              // No location selected
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {['Full Chicken', 'Chicken Cut'].map(name => (
                  <div key={name} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="h-56 bg-[#fafaf8] flex items-center justify-center relative border-b border-gray-100">
                      <Image 
                        src={name === 'Full Chicken' ? "/full.png" : "/cut.png"} 
                        alt={name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="p-6">
                      <h3 className="font-['Cormorant_Garamond'] text-2xl font-bold text-[#1a1814] mb-2">
                        {name}
                      </h3>
                      <p className="text-sm text-gray-400 mb-4">
                        Select a location above to see price
                      </p>
                      <div className="bg-[#f5f5f0] rounded-xl p-4 text-center">
                        <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                          Select location for price
                        </p>
                        <div className="flex gap-3 justify-center mt-3">
                          {locations.map(loc => (
                            <button
                              key={loc.id}
                              onClick={() => {
                                setSelectedLocation(loc.id)
                                document.getElementById('products')?.scrollIntoView({behavior:'smooth'})
                              }}
                              className="text-xs bg-[#006400] text-white px-3 py-1.5 rounded-lg font-semibold">
                              {loc.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Location selected
              <div>
                <div className="flex items-center justify-center gap-3 mb-8">
                  <p className="text-sm text-gray-500">Showing prices for</p>
                  <span className="bg-[#006400] text-white text-sm font-bold px-4 py-1.5 rounded-full">
                    📍 {selectedLocation}
                  </span>
                  <button
                    onClick={() => {
                      setSelectedLocation(null)
                      setProducts([])
                    }}
                    className="text-xs text-gray-400 underline hover:text-gray-600">
                    Change location
                  </button>
                </div>

                {loadingPrices ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {[1,2].map(i => (
                      <div key={i} className="bg-white rounded-2xl border border-gray-100 h-80 animate-pulse"/>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {products.map(product => (
                      <div key={product.id}
                        className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-[#006400]/20 hover:-translate-y-2 transition-all duration-300">
                        
                        {/* Image */}
                        <div className="h-56 bg-[#fafaf8] flex items-center justify-center relative border-b border-gray-100">
                          <div className="absolute top-0 left-0 bg-[#D97706] text-white text-xs font-bold tracking-wide uppercase px-4 py-2 rounded-br-xl z-10">
                            FRESH TODAY
                          </div>
                          <Image
                            src={product.name.includes('Cut') || product.name === 'Chicken Cut' ? "/cut.png" : "/full.png"}
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                        </div>

                        {/* Body */}
                        <div className="p-6">
                          <h3 className="font-['Cormorant_Garamond'] text-2xl font-bold text-[#1a1814] mb-2">
                            {product.name}
                          </h3>
                          <p className="text-sm text-gray-400 mb-4">
                            Fresh from our farm daily
                          </p>
                          <div className="h-px bg-gray-100 mb-4"/>
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-['Cormorant_Garamond'] text-3xl font-bold text-[#006400]">
                                RWF {product.price.toLocaleString()}
                              </p>
                              <p className="text-xs text-gray-400">per kg</p>
                            </div>
                            <button
                              onClick={() => {
                                handleOrderClick(product)
                              }}
                              className="bg-[#FFDE1A] text-black rounded-[10px] px-[24px] py-[10px] text-[14px] font-bold hover:bg-[#e6c710] transition-colors duration-300 shadow-sm">
                              Order Now
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CHECKOUT SECTION */}
      {isCheckoutOpen && (
        <section id="checkout" ref={checkoutRef} className="bg-white py-[80px] px-6 md:px-[60px] scroll-mt-20 relative">
          <button 
            onClick={() => setIsCheckoutOpen(false)} 
            className="absolute top-6 right-6 text-[#9a9890] hover:text-[#1a1814] transition-colors p-2 text-xl font-bold"
            title="Cancel order"
          >
            ✕
          </button>
          
          <div className="max-w-5xl mx-auto">
            <div className="text-center">
              <span className="inline-block bg-[rgba(255,222,26,0.15)] border border-[rgba(255,222,26,0.3)] text-[#b39500] text-[9px] font-bold px-3 py-1.5 rounded-full tracking-widest uppercase mb-4">PLACE YOUR ORDER</span>
              <h2 className="font-['Cormorant_Garamond',serif] text-[40px] font-bold text-[#1a1814] leading-tight">Complete Your Purchase</h2>
              <p className="text-[#9a9890] text-[14px] mt-2">Enter your details and choose how to order.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-[48px] mt-[56px]">
              {/* LEFT - Form */}
              <div className="bg-[#f5f5f0] rounded-[20px] p-[32px]">
                <h3 className="font-['Cormorant_Garamond',serif] text-[20px] text-[#1a1814] font-bold mb-6">Delivery Details</h3>
                
                {selectedLocation && (
                  <div className="bg-[#e8f5e8] rounded-xl p-3 mb-4 flex items-center gap-2">
                    <span className="text-xs font-bold text-[#006400]">
                      📍 {selectedLocation} Branch
                    </span>
                  </div>
                )}
                
                <div className="space-y-5">
                  <div>
                    <label className="block text-[#9a9890] text-[10px] font-semibold uppercase tracking-widest mb-2">Full Name</label>
                    <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} className="w-full bg-white border-[1.5px] border-[#e8e6e0] rounded-[12px] px-4 py-3 text-[14px] text-[#1a1814] placeholder-[#c0beb8] focus:outline-none focus:border-[#FFDE1A] focus:ring-[3px] focus:ring-[rgba(255,222,26,0.15)] transition-all" placeholder="Enter your name" />
                  </div>
                  
                  <div>
                    <label className="block text-[#9a9890] text-[10px] font-semibold uppercase tracking-widest mb-2">Phone Number</label>
                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-white border-[1.5px] border-[#e8e6e0] rounded-[12px] px-4 py-3 text-[14px] text-[#1a1814] placeholder-[#c0beb8] focus:outline-none focus:border-[#FFDE1A] focus:ring-[3px] focus:ring-[rgba(255,222,26,0.15)] transition-all" placeholder="07XX XXX XXX" />
                  </div>

                  <div>
                    <label className="block text-[#9a9890] text-[10px] font-semibold uppercase tracking-widest mb-2">Delivery Location / Address</label>
                    <input type="text" value={location} onChange={e => setLocation(e.target.value)} className="w-full bg-white border-[1.5px] border-[#e8e6e0] rounded-[12px] px-4 py-3 text-[14px] text-[#1a1814] placeholder-[#c0beb8] focus:outline-none focus:border-[#FFDE1A] focus:ring-[3px] focus:ring-[rgba(255,222,26,0.15)] transition-all" placeholder="Enter delivery location" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[#9a9890] text-[10px] font-semibold uppercase tracking-widest mb-2">Product</label>
                      <div className="relative">
                        <select value={selectedProduct?.name || ''} onChange={(e) => {
                          const prod = products.find(p => p.name === e.target.value);
                          if (prod) setSelectedProduct(prod);
                        }} className="w-full bg-white border-[1.5px] border-[#e8e6e0] rounded-[12px] px-4 py-3 text-[14px] text-[#1a1814] focus:outline-none focus:border-[#FFDE1A] focus:ring-[3px] focus:ring-[rgba(255,222,26,0.15)] transition-all appearance-none">
                          {products.map(p => (
                            <option key={p.id} value={p.name}>{p.name}</option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#9a9890]">
                          ▼
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[#9a9890] text-[10px] font-semibold uppercase tracking-widest mb-2">Quantity (kg)</label>
                      <div className="relative">
                        <input type="number" min={1} value={qty || ''} onChange={e => setQty(parseInt(e.target.value) || 0)} className="w-full bg-white border-[1.5px] border-[#e8e6e0] rounded-[12px] px-4 py-3 pr-12 text-[14px] text-[#1a1814] focus:outline-none focus:border-[#FFDE1A] focus:ring-[3px] focus:ring-[rgba(255,222,26,0.15)] transition-all" />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9a9890] text-[13px]">kg</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#FFDE1A] border-[1.5px] border-[rgba(0,0,0,0.06)] rounded-[14px] p-[20px] mt-6">
                    <span className="text-[rgba(0,0,0,0.5)] text-[10px] uppercase tracking-widest block font-bold mb-1">Total Price</span>
                    <div className="font-['Cormorant_Garamond',serif] text-black text-[32px] font-bold">RWF {totalPrice.toLocaleString()}</div>
                    <span className="text-[rgba(0,0,0,0.4)] text-[11px] block mt-1">Price auto-calculated from selection</span>
                  </div>
                </div>
              </div>

              {/* RIGHT - Order Panel */}
              <div className="bg-[#228B22] rounded-[20px] p-[32px] flex flex-col justify-center">
                <h3 className="font-['Cormorant_Garamond',serif] text-[22px] text-white font-bold mb-2">Complete Order</h3>
                <p className="text-[rgba(255,255,255,0.6)] text-[13px] mb-6">Review your order details and choose a payment method.</p>

                <div className="bg-[rgba(255,222,26,0.06)] border border-[rgba(255,222,26,0.25)] rounded-[14px] p-[16px] mb-6">
                  <div className="flex justify-between items-center text-white text-[14px]">
                    <span className="font-semibold">{selectedProduct?.name}</span>
                    <span className="text-[rgba(255,255,255,0.6)]">x {qty} kg</span>
                    <span className="font-bold text-[#FFDE1A]">RWF {totalPrice.toLocaleString()}</span>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`, '_blank');
                    setIsCheckoutOpen(false);
                  }}
                  className="bg-[#25D366] text-white rounded-[14px] w-full py-[16px] text-[14px] font-bold flex justify-center items-center gap-2 mb-3 hover:bg-[#128C7E] transition-colors"
                >
                  <WhatsAppIcon /> Order via WhatsApp
                </button>

                <button 
                  onClick={() => {
                    window.location.href = `tel:+${whatsappNumber}`;
                    setIsCheckoutOpen(false);
                  }}
                  className="bg-[#FFDE1A] text-black rounded-[14px] w-full py-[16px] text-[14px] font-bold flex justify-center items-center gap-2 hover:bg-[#e6c710] transition-colors shadow-sm"
                >
                  <PhoneIcon /> Call to Order
                </button>

                <p className="text-[rgba(255,255,255,0.4)] text-[12px] text-center mt-6">
                  We'll confirm your order within minutes
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* LOCATIONS SECTION */}
      <section id="locations" className="bg-[#228B22] py-[100px] px-6 md:px-[60px]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-[56px]">
            <span className="inline-block bg-[rgba(255,222,26,0.15)] border border-[rgba(255,222,26,0.3)] text-[#FFDE1A] text-[9px] font-bold px-3 py-1.5 rounded-full tracking-widest uppercase mb-4">VISIT US</span>
            <h2 className="font-['Cormorant_Garamond',serif] text-[48px] font-bold text-white leading-tight">Our Locations</h2>
            <p className="text-[rgba(255,255,255,0.6)] text-[15px] mt-2">Find a Muveste broiler farm or butcher meat outlet near you.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[24px]">
            {/* Loc 1 - Zaza */}
            <div className="bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.1)] rounded-[20px] p-[24px] hover:bg-[rgba(255,255,255,0.1)] hover:border-[rgba(255,222,26,0.4)] transition-all duration-300 flex flex-col justify-between h-full">
              <div>
                <div className="bg-[rgba(255,222,26,0.15)] border border-[rgba(255,222,26,0.3)] text-[#FFDE1A] text-[9px] font-bold tracking-widest uppercase px-[12px] py-[6px] rounded-full inline-block mb-[16px]">BROILER FARM</div>
                <div className="w-[48px] h-[48px] rounded-[14px] bg-[rgba(255,222,26,0.12)] border-[0.5px] border-[rgba(255,222,26,0.25)] flex items-center justify-center text-[22px] mb-[16px]">🐓</div>
                <h3 className="font-['Cormorant_Garamond',serif] text-[22px] text-white font-bold leading-tight">Zaza</h3>
                <p className="text-[rgba(255,255,255,0.55)] text-[13px] leading-[1.6] mt-[8px] mb-[16px]">Main broiler production & high-capacity farm breeding</p>
              </div>
              <div>
                <div className="w-full h-[1px] bg-[rgba(255,255,255,0.08)] mb-[16px]" />
                <div className="flex flex-wrap gap-[8px]">
                  <span className="bg-[rgba(255,222,26,0.12)] border border-[rgba(255,222,26,0.25)] text-[#FFDE1A] text-[10px] font-semibold px-[12px] py-[4px] rounded-full">Farm</span>
                  <span className="bg-[rgba(255,222,26,0.12)] border border-[rgba(255,222,26,0.25)] text-[#FFDE1A] text-[10px] font-semibold px-[12px] py-[4px] rounded-full">Broilers</span>
                </div>
              </div>
            </div>

            {/* Loc 2 - Rwamagana */}
            <div className="bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.1)] rounded-[20px] p-[24px] hover:bg-[rgba(255,255,255,0.1)] hover:border-[rgba(255,222,26,0.4)] transition-all duration-300 flex flex-col justify-between h-full">
              <div>
                <div className="bg-[rgba(255,222,26,0.15)] border border-[rgba(255,222,26,0.3)] text-[#FFDE1A] text-[9px] font-bold tracking-widest uppercase px-[12px] py-[6px] rounded-full inline-block mb-[16px]">MEAT OUTLET</div>
                <div className="w-[48px] h-[48px] rounded-[14px] bg-[rgba(255,222,26,0.12)] border-[0.5px] border-[rgba(255,222,26,0.25)] flex items-center justify-center text-[22px] mb-[16px]">🥩</div>
                <h3 className="font-['Cormorant_Garamond',serif] text-[22px] text-white font-bold leading-tight">Rwamagana</h3>
                <p className="text-[rgba(255,255,255,0.55)] text-[13px] leading-[1.6] mt-[8px] mb-[16px]">Fresh chicken meat cuts & full chicken distribution outlet</p>
              </div>
              <div>
                <div className="w-full h-[1px] bg-[rgba(255,255,255,0.08)] mb-[16px]" />
                <div className="flex flex-wrap gap-[8px]">
                  <span className="bg-[rgba(255,222,26,0.12)] border border-[rgba(255,222,26,0.25)] text-[#FFDE1A] text-[10px] font-semibold px-[12px] py-[4px] rounded-full">Butcher</span>
                  <span className="bg-[rgba(255,222,26,0.12)] border border-[rgba(255,222,26,0.25)] text-[#FFDE1A] text-[10px] font-semibold px-[12px] py-[4px] rounded-full">Delivery</span>
                </div>
              </div>
            </div>

            {/* Loc 3 - Nyabugogo */}
            <div className="bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.1)] rounded-[20px] p-[24px] hover:bg-[rgba(255,255,255,0.1)] hover:border-[rgba(255,222,26,0.4)] transition-all duration-300 flex flex-col justify-between h-full">
              <div>
                <div className="bg-[rgba(255,222,26,0.15)] border border-[rgba(255,222,26,0.3)] text-[#FFDE1A] text-[9px] font-bold tracking-widest uppercase px-[12px] py-[6px] rounded-full inline-block mb-[16px]">MEAT OUTLET</div>
                <div className="w-[48px] h-[48px] rounded-[14px] bg-[rgba(255,222,26,0.12)] border-[0.5px] border-[rgba(255,222,26,0.25)] flex items-center justify-center text-[22px] mb-[16px]">🥩</div>
                <h3 className="font-['Cormorant_Garamond',serif] text-[22px] text-white font-bold leading-tight">Nyabugogo, Kigali</h3>
                <p className="text-[rgba(255,255,255,0.55)] text-[13px] leading-[1.6] mt-[8px] mb-[16px]">Kigali branch butcher & fresh processed meat sales hub</p>
              </div>
              <div>
                <div className="w-full h-[1px] bg-[rgba(255,255,255,0.08)] mb-[16px]" />
                <div className="flex flex-wrap gap-[8px]">
                  <span className="bg-[rgba(255,222,26,0.12)] border border-[rgba(255,222,26,0.25)] text-[#FFDE1A] text-[10px] font-semibold px-[12px] py-[4px] rounded-full">Butcher</span>
                  <span className="bg-[rgba(255,222,26,0.12)] border border-[rgba(255,222,26,0.25)] text-[#FFDE1A] text-[10px] font-semibold px-[12px] py-[4px] rounded-full">Kigali Hub</span>
                </div>
              </div>
            </div>

            {/* Loc 4 - Kibungo */}
            <div className="bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.1)] rounded-[20px] p-[24px] hover:bg-[rgba(255,255,255,0.1)] hover:border-[rgba(255,222,26,0.4)] transition-all duration-300 flex flex-col justify-between h-full">
              <div>
                <div className="bg-[rgba(255,222,26,0.15)] border border-[rgba(255,222,26,0.3)] text-[#FFDE1A] text-[9px] font-bold tracking-widest uppercase px-[12px] py-[6px] rounded-full inline-block mb-[16px]">MEAT OUTLET</div>
                <div className="w-[48px] h-[48px] rounded-[14px] bg-[rgba(255,222,26,0.12)] border-[0.5px] border-[rgba(255,222,26,0.25)] flex items-center justify-center text-[22px] mb-[16px]">🥩</div>
                <h3 className="font-['Cormorant_Garamond',serif] text-[22px] text-white font-bold leading-tight">Kibungo</h3>
                <p className="text-[rgba(255,255,255,0.55)] text-[13px] leading-[1.6] mt-[8px] mb-[16px]">Eastern Province regional premium butcher shop</p>
              </div>
              <div>
                <div className="w-full h-[1px] bg-[rgba(255,255,255,0.08)] mb-[16px]" />
                <div className="flex flex-wrap gap-[8px]">
                  <span className="bg-[rgba(255,222,26,0.12)] border border-[rgba(255,222,26,0.25)] text-[#FFDE1A] text-[10px] font-semibold px-[12px] py-[4px] rounded-full">Butcher</span>
                  <span className="bg-[rgba(255,222,26,0.12)] border border-[rgba(255,222,26,0.25)] text-[#FFDE1A] text-[10px] font-semibold px-[12px] py-[4px] rounded-full">Eastern Hub</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT SECTION */}
      <section id="contact" className="bg-[#f5f5f0] py-[80px] px-6 md:px-[60px]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-[56px]">
            <span className="inline-block bg-[rgba(34,139,34,0.1)] border border-[rgba(34,139,34,0.2)] text-[#228B22] text-[9px] font-bold px-3 py-1.5 rounded-full tracking-widest uppercase mb-4">GET IN TOUCH</span>
            <h2 className="font-['Cormorant_Garamond',serif] text-[44px] font-bold text-[#1a1814] leading-tight">Contact Us</h2>
            <p className="text-[#9a9890] text-[14px] mt-2">Have a question or bulk order inquiry? Send us a message.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-[64px]">
            {/* LEFT - Info */}
            <div className="flex flex-col">
              <div className="flex flex-col gap-[16px]">
                <div className="bg-white border-[0.5px] border-[#e8e6e0] rounded-[16px] p-[20px] flex items-center gap-[64px] hover:border-[rgba(34,139,34,0.2)] transition-colors">
                  <div className="w-[52px] h-[52px] rounded-full bg-[#f0faf0] border-[0.5px] border-[rgba(34,139,34,0.12)] flex-shrink-0 flex items-center justify-center text-[20px]">📞</div>
                  <div>
                    <div className="text-[#9a9890] text-[10px] uppercase tracking-widest font-semibold mb-1">MAIN OFFICE</div>
                    <div className="text-[#1a1814] text-[15px] font-bold">+250 785 329 989</div>
                  </div>
                </div>
                
                <div className="bg-white border-[0.5px] border-[#e8e6e0] rounded-[16px] p-[20px] flex items-center gap-[64px] hover:border-[rgba(34,139,34,0.2)] transition-colors">
                  <div className="w-[52px] h-[52px] rounded-full bg-[#f0faf0] border-[0.5px] border-[rgba(34,139,34,0.12)] flex-shrink-0 flex items-center justify-center text-[20px]">🍗</div>
                  <div>
                    <div className="text-[#9a9890] text-[10px] uppercase tracking-widest font-semibold mb-1">CHICKEN MEAT SALES</div>
                    <div className="text-[#1a1814] text-[15px] font-bold">+250 785 329 989</div>
                  </div>
                </div>

                <div className="bg-white border-[0.5px] border-[#e8e6e0] rounded-[16px] p-[20px] flex items-center gap-[64px] hover:border-[rgba(34,139,34,0.2)] transition-colors">
                  <div className="w-[52px] h-[52px] rounded-full bg-[#f0faf0] border-[0.5px] border-[rgba(34,139,34,0.12)] flex-shrink-0 flex items-center justify-center text-[20px]">📍</div>
                  <div>
                    <div className="text-[#9a9890] text-[10px] uppercase tracking-widest font-semibold mb-1">HEADQUARTERS</div>
                    <div className="text-[#1a1814] text-[15px] font-bold">Zaza, Ngoma, Eastern Province</div>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <p className="text-[#9a9890] text-[13px] mb-4">Follow us on</p>
                <div className="flex gap-4">
                  <a href="https://www.facebook.com/profile.php?id=61589672757989&mibextid=rS40aB7S9Ucbxw6v" target="_blank" rel="noopener noreferrer" className="w-[40px] h-[40px] rounded-full border-[0.5px] border-[#e8e6e0] flex items-center justify-center text-[#228B22] hover:bg-[#228B22] hover:border-[#228B22] hover:text-white transition-all bg-white">
                    <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12c0-5.523-4.477-10-10-10z"/></svg>
                  </a>
                  <a href="https://www.instagram.com/muveste8/#" target="_blank" rel="noopener noreferrer" className="w-[40px] h-[40px] rounded-full border-[0.5px] border-[#e8e6e0] flex items-center justify-center text-[#228B22] hover:bg-[#228B22] hover:border-[#228B22] hover:text-white transition-all bg-white">
                    <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd"/></svg>
                  </a>
                  <a href="https://twitter.com/Muvestechicken8" target="_blank" rel="noopener noreferrer" className="w-[40px] h-[40px] rounded-full border-[0.5px] border-[#e8e6e0] flex items-center justify-center text-[#228B22] hover:bg-[#228B22] hover:border-[#228B22] hover:text-white transition-all bg-white">
                    <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  </a>
                </div>
              </div>
            </div>

            {/* RIGHT - Form */}
            <div className="bg-white rounded-[20px] p-[36px] border-[0.5px] border-[#e8e6e0]">
              <h3 className="font-['Cormorant_Garamond',serif] text-[24px] text-[#1a1814] font-bold">Send us a message</h3>
              <p className="text-[#9a9890] text-[13px] mb-6">We'll get back to you as soon as possible.</p>

              <form onSubmit={sendEmail} className="grid grid-cols-2 gap-4">
                <div className="col-span-1">
                  <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Full Name" className="w-full bg-white border-[1.5px] border-[#e8e6e0] rounded-[12px] px-4 py-3 text-[14px] text-[#1a1814] placeholder-[#c0beb8] focus:outline-none focus:border-[#FFDE1A] focus:ring-[3px] focus:ring-[rgba(255,222,26,0.15)] transition-all" />
                </div>
                <div className="col-span-1">
                  <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="Email Address" className="w-full bg-white border-[1.5px] border-[#e8e6e0] rounded-[12px] px-4 py-3 text-[14px] text-[#1a1814] placeholder-[#c0beb8] focus:outline-none focus:border-[#FFDE1A] focus:ring-[3px] focus:ring-[rgba(255,222,26,0.15)] transition-all" />
                </div>
                <div className="col-span-2">
                  <input type="text" required value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} placeholder="Subject" className="w-full bg-white border-[1.5px] border-[#e8e6e0] rounded-[12px] px-4 py-3 text-[14px] text-[#1a1814] placeholder-[#c0beb8] focus:outline-none focus:border-[#FFDE1A] focus:ring-[3px] focus:ring-[rgba(255,222,26,0.15)] transition-all" />
                </div>
                <div className="col-span-2">
                  <textarea required rows={5} value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} placeholder="Your Message" className="w-full bg-white border-[1.5px] border-[#e8e6e0] rounded-[12px] px-4 py-3 text-[14px] text-[#1a1814] placeholder-[#c0beb8] focus:outline-none focus:border-[#FFDE1A] focus:ring-[3px] focus:ring-[rgba(255,222,26,0.15)] transition-all resize-none"></textarea>
                </div>
                
                <div className="col-span-2 mt-2">
                  <button type="submit" disabled={sending} className={`w-full text-white rounded-[12px] py-[16px] text-[14px] font-bold transition-all ${success ? 'bg-[#228B22]' : 'bg-[#228B22] hover:bg-[#FFDE1A] hover:text-black'} ${sending ? 'opacity-70 cursor-wait' : ''}`}>
                    {sending ? 'Sending...' : success ? '✓ Message Sent!' : 'Send Message'}
                  </button>
                  {error && <p className="text-red-500 text-xs mt-2 text-center">{error}</p>}
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
