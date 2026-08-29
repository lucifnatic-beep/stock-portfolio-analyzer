'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Globe, Download, Upload, Shield, FileText, Sparkles, Trash2, User, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { PriceAlertManager } from '@/components/alerts/price-alert-manager';
import { UserAuthButton } from '@/components/auth/user-auth-button';
import { useAppStore } from '@/stores/app-store';
import { db } from '@/lib/db';

export default function AlertsAndProfilePage() {
  const { baseCurrency, setBaseCurrency } = useAppStore();
  const [confirmDemoOpen, setConfirmDemoOpen] = useState(false);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  const handleExport = async () => {
    const positions = await db.positions.toArray();
    const watchlist = await db.watchlist.toArray();
    const alerts = await db.priceAlerts.toArray();
    const brokers = await db.brokers.toArray();

    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      positions,
      watchlist,
      alerts,
      brokers,
    };

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
        if (data.alerts) {
          await db.priceAlerts.clear();
          await db.priceAlerts.bulkAdd(data.alerts);
        }
        if (data.brokers) {
          await db.brokers.clear();
          await db.brokers.bulkAdd(data.brokers);
        }
        window.location.reload();
      } catch {
        alert('Error importing file.');
      }
    };
    input.click();
  };

  const handleLoadDemo = async () => {
    setConfirmDemoOpen(false);
    const { seedSamplePortfolio } = await import('@/lib/seed');
    await seedSamplePortfolio();
  };

  const handleClearData = async () => {
    setConfirmClearOpen(false);
    await db.positions.clear();
    await db.watchlist.clear();
    await db.priceAlerts.clear();
    window.location.reload();
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
      <PriceAlertManager />

      {/* Data Management & Backups */}
      <Card className="border-border/70 shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4 text-emerald-400" />
            Data Management & Backups
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            StockPulse AI is local-first. Your holdings are stored securely inside your phone. You can export a snapshot backup or restore on any device.
          </p>

          <div className="flex items-center gap-2.5 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              className="text-xs font-semibold gap-2 rounded-xl"
              onClick={handleExport}
            >
              <Download className="h-4 w-4 text-emerald-400" />
              Backup Portfolio (JSON)
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="text-xs font-semibold gap-2 rounded-xl"
              onClick={handleImport}
            >
              <Upload className="h-4 w-4 text-indigo-400" />
              Restore Backup
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-amber-400/80 hover:text-amber-300 hover:bg-amber-500/10 gap-1.5 rounded-xl"
              onClick={() => setConfirmDemoOpen(true)}
            >
              <Sparkles className="h-4 w-4" />
              Demo Portfolio
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-red-400/80 hover:text-red-300 hover:bg-red-500/10 gap-1.5 ml-auto rounded-xl"
              onClick={() => setConfirmClearOpen(true)}
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

      {/* Dialog: Confirm Demo Portfolio */}
      <Dialog open={confirmDemoOpen} onOpenChange={setConfirmDemoOpen}>
        <DialogContent className="max-w-sm p-6" onClose={() => setConfirmDemoOpen(false)}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-5 w-5 text-amber-400" />
              Load Demo Portfolio?
            </DialogTitle>
            <DialogDescription>
              This will populate your portfolio with starter US & European blue-chip stocks (NVDA, AAPL, ASML, SAP, etc.) for testing.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDemoOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button onClick={handleLoadDemo} className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold">
              Load Demo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Confirm Clear Data */}
      <Dialog open={confirmClearOpen} onOpenChange={setConfirmClearOpen}>
        <DialogContent className="max-w-sm p-6" onClose={() => setConfirmClearOpen(false)}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base text-red-400">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              Clear All Data?
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete all local positions, watchlists, and price alerts? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmClearOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button onClick={handleClearData} className="text-xs bg-red-600 hover:bg-red-500 text-white font-bold">
              Yes, Delete All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
