'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Compass, Star, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const pathname = usePathname();

  const items = [
    { href: '/', icon: LayoutDashboard, label: 'Portfolio' },
    { href: '/hot-picks', icon: Compass, label: 'Discover' },
    { href: '/watchlist', icon: Star, label: 'Watchlist' },
    { href: '/alerts', icon: User, label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card/98 backdrop-blur-xl border-t border-border/50 lg:hidden pb-[max(env(safe-area-inset-bottom,0px),0.375rem)] shadow-[0_-1px_3px_rgba(0,0,0,0.1)]">
      <div className="flex items-center justify-around max-w-md mx-auto pt-1.5">
        {items.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center py-1 px-4 rounded-2xl transition-all relative select-none min-w-[64px]',
                isActive
                  ? 'text-emerald-500'
                  : 'text-muted-foreground active:text-foreground active:scale-95'
              )}
            >
              <div className="relative">
                <item.icon
                  className={cn(
                    'h-[22px] w-[22px] transition-all',
                    isActive && 'text-emerald-500 stroke-[2.5px]'
                  )}
                />
                {/* Active indicator dot */}
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-emerald-500" />
                )}
              </div>
              <span className={cn(
                'text-[10px] mt-1 tracking-tight transition-all',
                isActive ? 'font-bold text-emerald-500' : 'font-medium'
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
