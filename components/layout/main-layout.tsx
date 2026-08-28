'use client';

import React from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { BottomNav } from '@/components/layout/bottom-nav';
import { useAppStore } from '@/stores/app-store';
import { cn } from '@/lib/utils';

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { sidebarOpen } = useAppStore();

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)]">
      <Sidebar />
      <main
        className={cn(
          'flex-1 p-3 sm:p-4 lg:p-6 pb-24 lg:pb-6 transition-all duration-300 min-w-0',
          sidebarOpen ? 'lg:ml-56' : 'lg:ml-16'
        )}
      >
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
