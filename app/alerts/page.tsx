'use client';

import React from 'react';
import { Bell, User, ShieldCheck, Download, Upload, Trash2, Sparkles, Shield, FileText, Globe } from 'lucide-react';
import { PriceAlertManager } from '@/components/alerts/price-alert-manager';
import { UserAuthButton } from '@/components/auth/user-auth-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/stores/app-store';
import { useTranslation } from '@/lib/i18n';
import { db } from '@/lib/db';
import Link from 'next/link';

export default function ProfileAndAlertsPage() {
  const { locale, baseCurrency, setBaseCurrency } = useAppStore();
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
        alert('Error importing file.');
      }
    };
    input.click();
  };

  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/40 pb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <User className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Account & Preferences</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manage your profile, price alerts, currency, and local backups.
            </p>
          </div>
        </div>
        <UserAuthButton />
      </div>

      {/* Currency Switcher */}
      <Card className="border-border/70 shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4 text-emerald-400" />
            Display Currency
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-3">
            All positions and portfolio values will be automatically converted using live ECB foreign exchange rates.
          </p>
          <div className="grid grid-cols-3 gap-2 max-w-md">
            {(['USD', 'EUR', 'GBP'] as const).map((curr) => (
              <button
                key={curr}
                type="button"
                onClick={() => setBaseCurrency(curr)}
                className={`py-2 rounded-xl font-bold text-xs transition-all cursor-pointer border ${
                  baseCurrency === curr
                    ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                    : 'bg-muted/50 text-muted-foreground hover:text-foreground border-border/50'
                }`}
              >
                {curr}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Price Alerts Section */}
      <div className="w-full">
        <PriceAlertManager />
      </div>

      {/* Data Backup & Restore */}
      <Card className="border-border/70 shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            Data Management & Backups
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            StockPulse AI is local-first. Your holdings are stored securely inside your phone. You can export a snapshot backup or restore on any device.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              className="text-xs font-semibold gap-2"
              onClick={handleExport}
            >
              <Download className="h-4 w-4 text-emerald-400" />
              Backup Portfolio (JSON)
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="text-xs font-semibold gap-2"
              onClick={handleImport}
            >
              <Upload className="h-4 w-4 text-indigo-400" />
              Restore Backup
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-amber-400/80 hover:text-amber-300 hover:bg-amber-500/10 gap-1.5"
              onClick={async () => {
                if (confirm('Load demo starter portfolio with US & EU stocks?')) {
                  const { seedSamplePortfolio } = await import('@/lib/seed');
                  await seedSamplePortfolio();
                }
              }}
            >
              <Sparkles className="h-4 w-4" />
              Demo Portfolio
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-red-400/80 hover:text-red-300 hover:bg-red-500/10 gap-1.5 ml-auto"
              onClick={async () => {
                if (confirm('Clear all local portfolio data?')) {
                  await db.positions.clear();
                  await db.watchlist.clear();
                  await db.priceAlerts.clear();
                  window.location.reload();
                }
              }}
            >
              <Trash2 className="h-4 w-4" />
              Clear Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Legal & Version */}
      <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t border-border/40 px-1">
        <div className="flex items-center gap-4">
          <Link href="/privacy" className="hover:underline flex items-center gap-1">
            <Shield className="h-3.5 w-3.5" />
            <span>Privacy Policy</span>
          </Link>
          <Link href="/terms" className="hover:underline flex items-center gap-1">
            <FileText className="h-3.5 w-3.5" />
            <span>Terms of Service</span>
          </Link>
        </div>
        <span>StockPulse AI v1.0.0</span>
      </div>
    </div>
  );
}
