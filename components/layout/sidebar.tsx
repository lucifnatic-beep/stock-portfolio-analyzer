'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  LayoutDashboard,
  Flame,
  Star,
  Bell,
  Download,
  Upload,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  Trash2,
  Shield,
  FileText,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/stores/app-store';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { db } from '@/lib/db';

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar, locale, baseCurrency, setBaseCurrency } = useAppStore();
  const t = useTranslation(locale);

  const positionsCount = useLiveQuery(() => db.positions.count()) ?? 0;
  const watchlistCount = useLiveQuery(() => db.watchlist.count()) ?? 0;
  const alertsCount = useLiveQuery(() => db.priceAlerts.count()) ?? 0;

  const navItems = [
    {
      href: '/',
      icon: LayoutDashboard,
      label: 'Portfolio',
      badge: positionsCount > 0 ? `${positionsCount}` : undefined,
      color: 'text-indigo-400',
    },
    {
      href: '/hot-picks',
      icon: Flame,
      label: 'Discover',
      badge: 'AI',
      badgeClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      color: 'text-orange-400',
    },
    {
      href: '/watchlist',
      icon: Star,
      label: 'Watchlist',
      badge: watchlistCount > 0 ? `${watchlistCount}` : undefined,
      color: 'text-amber-400',
    },
    {
      href: '/alerts',
      icon: Bell,
      label: 'Price Alerts',
      badge: alertsCount > 0 ? `${alertsCount}` : undefined,
      color: 'text-rose-400',
    },
  ];

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
    a.download = `stockpulse-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
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
        alert('Error importing file. Make sure it\'s a valid StockPulse backup.');
      }
    };
    input.click();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          onClick={toggleSidebar}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-14 z-50 h-[calc(100vh-3.5rem)] border-r bg-card/95 backdrop-blur-md transition-all duration-300 flex flex-col justify-between overflow-y-auto',
          sidebarOpen
            ? 'w-72 translate-x-0 shadow-2xl lg:w-60 lg:shadow-none'
            : '-translate-x-full lg:translate-x-0 lg:w-16'
        )}
      >
        <div className="flex flex-col gap-3 p-3">
          {/* Brand Card */}
          {sidebarOpen && (
            <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/10 via-indigo-500/5 to-transparent border border-emerald-500/20 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs bg-gradient-to-r from-emerald-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                  StockPulse AI
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  PRO
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                Live Portfolio Engine
              </p>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => {
                    if (window.innerWidth < 1024) toggleSidebar();
                  }}
                  title={!sidebarOpen ? item.label : undefined}
                >
                  <div
                    className={cn(
                      'flex items-center justify-between px-3 py-2.5 rounded-xl transition-all text-xs font-semibold select-none cursor-pointer',
                      isActive
                        ? 'bg-emerald-600/15 text-emerald-400 border border-emerald-500/30 shadow-xs'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <item.icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-emerald-400' : item.color)} />
                      {sidebarOpen && <span className="truncate">{item.label}</span>}
                    </div>
                    {sidebarOpen && item.badge && (
                      <Badge
                        variant="secondary"
                        className={cn(
                          'text-[10px] px-1.5 py-0 h-4.5 font-mono font-bold',
                          item.badgeClass || 'bg-muted text-muted-foreground'
                        )}
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* Currency Selector */}
          {sidebarOpen && (
            <div className="space-y-1.5 pt-2 border-t border-border/40">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider px-1">
                Display Currency
              </span>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-muted/50 rounded-xl border border-border/50 text-[11px]">
                {(['USD', 'EUR', 'GBP'] as const).map((curr) => (
                  <button
                    key={curr}
                    type="button"
                    onClick={() => setBaseCurrency(curr)}
                    className={cn(
                      'py-1.5 rounded-lg font-bold transition-all text-center cursor-pointer',
                      baseCurrency === curr
                        ? 'bg-emerald-500 text-white shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {curr}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Data Management */}
          {sidebarOpen && (
            <div className="space-y-1 pt-2 border-t border-border/40">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider px-1">
                Data Management
              </span>

              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs text-muted-foreground hover:text-foreground h-9 justify-start gap-2.5 px-3"
                onClick={handleExport}
              >
                <Download className="h-4 w-4 shrink-0 text-emerald-400" />
                <span>Backup Portfolio</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs text-muted-foreground hover:text-foreground h-9 justify-start gap-2.5 px-3"
                onClick={handleImport}
              >
                <Upload className="h-4 w-4 shrink-0 text-indigo-400" />
                <span>Restore Backup</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs text-amber-400/80 hover:text-amber-300 hover:bg-amber-500/10 justify-start gap-2.5 px-3 h-9"
                onClick={async () => {
                  if (confirm('Load a demo portfolio with sample US & EU positions?')) {
                    const { seedSamplePortfolio } = await import('@/lib/seed');
                    await seedSamplePortfolio();
                  }
                }}
              >
                <Sparkles className="h-4 w-4 shrink-0" />
                <span>Load Demo Portfolio</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs text-rose-400/80 hover:text-rose-300 hover:bg-rose-500/10 justify-start gap-2.5 px-3 h-9"
                onClick={async () => {
                  if (confirm('Clear all local portfolio data? This cannot be undone.')) {
                    await db.positions.clear();
                    await db.watchlist.clear();
                    await db.priceAlerts.clear();
                    window.location.reload();
                  }
                }}
              >
                <Trash2 className="h-4 w-4 shrink-0" />
                <span>Clear All Data</span>
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-border/40 space-y-1 bg-muted/10">
          {sidebarOpen && (
            <div className="space-y-1 mb-2">
              <Link
                href="/privacy"
                onClick={() => { if (window.innerWidth < 1024) toggleSidebar(); }}
                className="flex items-center gap-2.5 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/50 transition-colors"
              >
                <Shield className="h-3.5 w-3.5 shrink-0" />
                <span>Privacy Policy</span>
              </Link>
              <Link
                href="/terms"
                onClick={() => { if (window.innerWidth < 1024) toggleSidebar(); }}
                className="flex items-center gap-2.5 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/50 transition-colors"
              >
                <FileText className="h-3.5 w-3.5 shrink-0" />
                <span>Terms of Service</span>
              </Link>
              <div className="flex items-center gap-2 px-3 py-1.5 text-[10px] text-muted-foreground/60">
                <Info className="h-3 w-3 shrink-0" />
                <span>StockPulse AI v1.0.0</span>
              </div>
            </div>
          )}

          {/* Collapse Toggle — desktop only */}
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'hidden lg:flex w-full text-xs text-muted-foreground hover:text-foreground border border-border/40',
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
              <PanelLeftOpen className="h-4 w-4 text-emerald-400" />
            )}
          </Button>
        </div>
      </aside>
    </>
  );
}
