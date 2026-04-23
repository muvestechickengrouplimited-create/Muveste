'use client';

import React from 'react';
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
    name: 'Egg Farm',
    href: '/egg-farm',
    roles: ['egg_farm', 'admin'],
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
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
    name: 'Egg Kiosk',
    href: '/egg-kiosk',
    roles: ['egg_kiosk', 'admin'],
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    name: 'Butchery',
    href: '/butcher',
    roles: ['butcher', 'admin'],
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 15.536c-1.171 1.952-3.07 1.952-4.242 0-1.172-1.953-1.172-5.119 0-7.072 1.171-1.952 3.07-1.952 4.242 0M8 10.5h4m-4 3h4m9-1.5a9 9 0 11-18 0 9 9 0 0118 0z" />
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

  // If there's no user, we shouldn't render the sidebar links securely, 
  // but Layout handles the actual protection.
  if (!user) {
    return (
      <div className="flex h-full w-64 flex-col bg-[#1B6B3A] text-white">
        <div className="flex h-16 items-center px-6 border-b border-[#15542d]">
          <h1 className="text-xl font-bold tracking-tight text-white">
            30<span className="text-[#F5C518]">Plus</span>
          </h1>
        </div>
      </div>
    );
  }

  const filteredNavItems = navItems.filter((item) =>
    item.roles.includes(user.role)
  );

  return (
    <div className="flex h-full w-64 flex-col bg-[#1B6B3A] text-white">
      <div className="flex h-16 items-center px-6 border-b border-[#15542d]">
        <h1 className="text-xl font-bold tracking-tight text-white">
          30<span className="text-[#F5C518]">Plus</span>
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
                className={cn(
                  'group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  // Yellow active state for text and icon, darker green for active background
                  isActive
                    ? 'bg-[#15542d] text-[#F5C518]'
                    : 'text-gray-100 hover:bg-[#15542d] hover:text-white'
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

      <div className="p-4 border-t border-[#15542d]">
        <div className="flex items-center space-x-3 px-2">
          {/* Avatar uses Accent Orange */}
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
    </div>
  );
}
