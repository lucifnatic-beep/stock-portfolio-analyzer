'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Flame, Star, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/app-store';
import { useTranslation } from '@/lib/i18n';

export function BottomNav() {
  const pathname = usePathname();
  const { locale } = useAppStore();
  const t = useTranslation(locale);

  const items = [
    { href: '/', icon: LayoutDashboard, label: 'Portfolio' },
    { href: '/hot-picks', icon: Flame, label: 'HOT Picks', badge: 'AI' },
    { href: '/#watchlist', icon: Star, label: 'Watchlist' },
    { href: '/#alerts', icon: Bell, label: 'Alerts' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-lg border-t border-border/60 lg:hidden px-2 py-1.5 shadow-lg">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {items.map((item) => {
          const isActive = pathname === item.href || (item.href.startsWith('/#') && pathname === '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all relative',
                isActive ? 'text-orange-500 font-bold' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <div className="relative">
                <item.icon className={cn('h-5 w-5', isActive && 'text-orange-500')} />
                {item.badge && (
                  <span className="absolute -top-1 -right-2 px-1 py-0.2 rounded-full bg-orange-500 text-[8px] text-white font-bold animate-pulse">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] tracking-tight mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
