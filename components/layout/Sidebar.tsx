'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';
import { cn } from '../../lib/utils';
import { UserRole } from '../../types';

interface NavItem {
  name: string;
  href: string;
  roles: UserRole[];
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    name: 'Admin',
    href: '/admin',
    roles: ['admin'],
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    name: 'Finance',
    href: '/finance',
    roles: ['finance', 'admin'],
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    name: 'Broiler Farm',
    href: '/broiler-farm',
    roles: ['broiler_farm', 'admin'],
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
      </svg>
    ),
  },
  {
    name: 'Butchery — Kibungo',
    href: '/butcher-kibungo',
    roles: ['butcher_kibungo', 'admin'],
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 15.536c-1.171 1.952-3.07 1.952-4.242 0-1.172-1.953-1.172-5.119 0-7.072 1.171-1.952 3.07-1.952 4.242 0M8 10.5h4m-4 3h4m9-1.5a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    name: 'Butchery — Rwamagana',
    href: '/butcher-rwamagana',
    roles: ['butcher_rwamagana', 'admin'],
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 15.536c-1.171 1.952-3.07 1.952-4.242 0-1.172-1.953-1.172-5.119 0-7.072 1.171-1.952 3.07-1.952 4.242 0M8 10.5h4m-4 3h4m9-1.5a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    name: 'Butchery — Nyabugogo',
    href: '/butcher-nyabugogo',
    roles: ['butcher_nyabugogo', 'admin'],
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 15.536c-1.171 1.952-3.07 1.952-4.242 0-1.172-1.953-1.172-5.119 0-7.072 1.171-1.952 3.07-1.952 4.242 0M8 10.5h4m-4 3h4m9-1.5a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    name: 'Passwords',
    href: '/admin/change-password',
    roles: ['admin'],
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  // If there's no user, we shouldn't render the sidebar links securely, 
  // but Layout handles the actual protection.
  if (!user) {
    return (
      <aside className="fixed top-0 left-0 h-full z-40 w-[240px] bg-[#228B22] text-white">
        <div className="flex h-16 items-center px-6 border-b border-[#1A6E1A]">
          <h1 className="text-xl font-bold tracking-tight text-white">
            Mu<span className="text-[#F5C518]">veste</span>
          </h1>
        </div>
      </aside>
    );
  }

  const filteredNavItems = navItems.filter((item) =>
    item.roles.includes(user.role)
  );

  return (
    <>
      {/* Hamburger button (mobile only): */}
      <button
        onClick={() => setOpen(!open)}
        className="md:hidden fixed top-4 left-4 
                   z-50 w-10 h-10 bg-[#228B22] 
                   rounded-xl flex items-center 
                   justify-center"
      >
        {open ? (
          <span className="text-white text-xl">✕</span>
        ) : (
          <span className="text-white text-xl">☰</span>
        )}
      </button>

      {/* Overlay when sidebar open: */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="md:hidden fixed inset-0 
                     bg-black/50 z-30"
        />
      )}

      {/* Sidebar: */}
      <aside
        className={`
          fixed top-0 left-0 
          h-full z-40
          w-[240px] bg-[#228B22] text-white flex flex-col
          transform transition-transform duration-300
          ${open 
            ? 'translate-x-0' 
            : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className="flex h-16 items-center px-6 border-b border-[#1A6E1A]">
          <h1 className="text-xl font-bold tracking-tight text-white">
            Mu<span className="text-[#F5C518]">veste</span>
          </h1>
        </div>

        <div className="flex-1 overflow-y-auto py-6">
          <nav className="space-y-1 px-4">
            <p className="px-3 mb-4 text-xs font-semibold text-green-300 uppercase tracking-wider">
              Dashboard
            </p>
            {filteredNavItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-[#1A6E1A] text-[#F5C518]'
                      : 'text-gray-100 hover:bg-[#1A6E1A] hover:text-white'
                  )}
                >
                  <span className={cn(
                    'mr-3 flex-shrink-0',
                    isActive ? 'text-[#F5C518]' : 'text-green-300 group-hover:text-white'
                  )}>
                    {item.icon}
                  </span>
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-[#1A6E1A]">
          <div className="flex items-center space-x-3 px-2">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#E07B00] text-white font-bold text-lg">
              {user.email.charAt(0).toUpperCase()}
            </div>
            <div className="truncate">
              <p className="truncate text-sm font-medium text-white">{user.email}</p>
              <p className="truncate text-xs text-green-300">
                {user.role.replace('_', ' ').toUpperCase()}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
