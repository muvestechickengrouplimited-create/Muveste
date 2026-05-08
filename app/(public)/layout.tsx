import React from 'react';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet"/>
      <style dangerouslySetInnerHTML={{__html: `
        ::selection {
          background: rgba(217,119,6,0.25);
          color: #1a1814;
        }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb {
          background: rgba(0,100,0,0.3);
          border-radius: 2px;
        }
      `}} />
      <div className="flex flex-col flex-1 w-full min-h-screen font-['DM_Sans',sans-serif]">
        <Navbar />
        {children}
        <Footer />
      </div>
    </>
  );
}
