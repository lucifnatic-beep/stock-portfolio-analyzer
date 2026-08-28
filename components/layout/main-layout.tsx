'use client';

import React from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { BottomNav } from '@/components/layout/bottom-nav';
import { useAppStore } from '@/stores/app-store';
import { cn } from '@/lib/utils';

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { sidebarOpen } = useAppStore();

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] w-full overflow-x-hidden">
      <Sidebar />
      <main
        className={cn(
          'flex-1 w-full max-w-full px-3 sm:px-4 lg:px-6 py-4 pb-28 lg:pb-8 transition-all duration-300 min-w-0',
          sidebarOpen ? 'lg:ml-56' : 'lg:ml-16'
        )}
      >
        <div className="max-w-7xl mx-auto w-full min-w-0">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
