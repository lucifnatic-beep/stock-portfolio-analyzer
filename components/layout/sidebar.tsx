'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Flame, Star, Bell, FileDown, FileUp, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/stores/app-store';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { db } from '@/lib/db';

const navItems = [
  { href: '/', icon: LayoutDashboard, labelKey: 'nav.dashboard' },
  { href: '/hot-picks', icon: Flame, labelKey: 'nav.hotPicks' },
  { href: '/#watchlist', icon: Star, labelKey: 'nav.watchlist' },
  { href: '/#alerts', icon: Bell, labelKey: 'nav.alerts' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar, locale } = useAppStore();
  const t = useTranslation(locale);

  const handleExport = async () => {
    const positions = await db.positions.toArray();
    const watchlist = await db.watchlist.toArray();
    const alerts = await db.priceAlerts.toArray();
    const brokers = await db.brokers.toArray();
    const data = { positions, watchlist, alerts, brokers, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `portfolio-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.csv';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (data.positions) {
          await db.positions.clear();
          await db.positions.bulkAdd(data.positions);
        }
        if (data.watchlist) {
          await db.watchlist.clear();
          await db.watchlist.bulkAdd(data.watchlist);
        }
        if (data.brokers) {
          await db.brokers.clear();
          await db.brokers.bulkAdd(data.brokers);
        }
        window.location.reload();
      } catch (err) {
        alert('Error importing file.');
      }
    };
    input.click();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {sidebarOpen && (
        <div
          onClick={toggleSidebar}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-14 z-50 h-[calc(100vh-3.5rem)] border-r bg-card/95 backdrop-blur transition-all duration-300 flex flex-col justify-between',
          sidebarOpen
            ? 'w-64 translate-x-0 shadow-2xl lg:w-56 lg:shadow-none'
            : '-translate-x-full lg:translate-x-0 lg:w-16'
        )}
      >
        <nav className="flex flex-col gap-1.5 p-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  if (window.innerWidth < 1024) toggleSidebar();
                }}
                title={!sidebarOpen ? t(item.labelKey) : undefined}
              >
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full transition-all text-xs font-medium',
                    sidebarOpen ? 'justify-start gap-2.5 px-3' : 'lg:justify-center lg:px-0 lg:h-10 lg:w-10 lg:mx-auto'
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0 text-indigo-400" />
                  <span>{t(item.labelKey)}</span>
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* Footer controls & Collapse Toggle */}
        <div className="p-3 border-t border-border/40 space-y-1">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'w-full text-xs text-muted-foreground hover:text-foreground',
              sidebarOpen ? 'justify-start gap-2 px-3' : 'lg:justify-center lg:px-0 lg:h-8 lg:w-8 lg:mx-auto'
            )}
            onClick={handleExport}
            title={!sidebarOpen ? t('common.exportJSON') : undefined}
          >
            <FileDown className="h-4 w-4 shrink-0" />
            <span>{t('common.exportJSON')}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'w-full text-xs text-muted-foreground hover:text-foreground',
              sidebarOpen ? 'justify-start gap-2 px-3' : 'lg:justify-center lg:px-0 lg:h-8 lg:w-8 lg:mx-auto'
            )}
            onClick={handleImport}
            title={!sidebarOpen ? t('common.importJSON') : undefined}
          >
            <FileUp className="h-4 w-4 shrink-0" />
            <span>{t('common.importJSON')}</span>
          </Button>

          {/* Toggle Collapse Button - desktop only */}
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'hidden lg:flex w-full text-xs text-muted-foreground hover:text-foreground mt-2 border border-border/40',
              sidebarOpen ? 'justify-between px-3' : 'justify-center px-0 h-8 w-8 mx-auto'
            )}
            onClick={toggleSidebar}
            title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {sidebarOpen ? (
              <>
                <span>Collapse</span>
                <PanelLeftClose className="h-4 w-4" />
              </>
            ) : (
              <PanelLeftOpen className="h-4 w-4 text-indigo-400" />
            )}
          </Button>
        </div>
      </aside>
    </>
  );
}
