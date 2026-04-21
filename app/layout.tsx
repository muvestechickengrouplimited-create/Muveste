import React from 'react';
import type { Metadata } from 'next';
import { Inter, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '../components/ui/Toast';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const font = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400','500','700'], variable: '--font-jakarta' })
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' });

export const metadata: Metadata = {
  title: '30 Plus | Fresh chicken meat & Egg Delivery in Kigali, Rwanda',
  description: 'Rwanda\'s premier poultry farm management.',
  metadataBase: new URL('https://30plus.rw'),
  alternates: {
    canonical: 'https://30plus.rw',
  },
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
    shortcut: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${font.variable} ${mono.variable}`}>
      {/* Suppress hydration warning safely for standard Next.js setups */}
      <body className="antialiased min-h-screen flex flex-col font-sans" suppressHydrationWarning>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
