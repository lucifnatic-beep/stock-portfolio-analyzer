'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Globe,
  Download,
  Upload,
  Shield,
  FileText,
  Sparkles,
  Trash2,
  User,
  AlertTriangle,
  Moon,
  Sun,
  Laptop,
  Zap,
  Activity,
  LogOut,
  LogIn,
  CheckCircle2,
  Sliders,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { PriceAlertManager } from '@/components/alerts/price-alert-manager';
import { AuthModal } from '@/components/auth/auth-modal';
import { useAppStore } from '@/stores/app-store';
import { db } from '@/lib/db';
import { auth, onAuthStateChanged, signOut, type User as FirebaseUser } from '@/lib/firebase';
import { useTheme } from 'next-themes';

export default function ProfileAndPreferencesPage() {
  const { baseCurrency, setBaseCurrency } = useAppStore();
  const { theme, setTheme } = useTheme();
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [localEmail, setLocalEmail] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [confirmDemoOpen, setConfirmDemoOpen] = useState(false);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState('30');
  const [hapticsEnabled, setHapticsEnabled] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    const stored = localStorage.getItem('stockpulse_local_user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setLocalEmail(parsed.email || null);
      } catch {}
    }
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await signOut(auth);
    localStorage.removeItem('stockpulse_local_user');
    setLocalEmail(null);
    setCurrentUser(null);
  };

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
        alert('Error importing backup JSON file.');
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

  const userDisplayName = currentUser?.displayName || currentUser?.email || localEmail || 'Guest Investor';
  const userInitial = userDisplayName ? userDisplayName[0].toUpperCase() : 'G';
  const isUserLoggedIn = Boolean(currentUser || localEmail);

  return (
    <div className="space-y-6 pb-24 max-w-3xl mx-auto">
      {/* Auth Modal */}
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />

      {/* Profile Header */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-card via-card to-muted/40 border border-border/80 shadow-md">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3.5">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-indigo-500/20 to-purple-500/10 border-2 border-emerald-500/40 text-emerald-400 font-extrabold text-xl flex items-center justify-center shadow-md shadow-emerald-500/10">
              {userInitial}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                  {userDisplayName}
                </h1>
                {isUserLoggedIn ? (
                  <Badge variant="outline" className="text-[10px] font-bold px-1.5 py-0 border-emerald-500/40 text-emerald-400 bg-emerald-500/10">
                    Active
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-[10px] font-mono">
                    Local Device
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {currentUser?.email || (localEmail ? `Local Account: ${localEmail}` : 'StockPulse AI v1.0.0 · Local-First')}
              </p>
            </div>
          </div>

          <div>
            {isUserLoggedIn ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="h-8 text-xs font-semibold gap-1.5 rounded-xl border-border/70 hover:text-red-400 hover:border-red-500/40 cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out</span>
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => setAuthModalOpen(true)}
                className="h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-xs gap-1.5 cursor-pointer"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Sign In / Sync</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Preferences Grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Display Currency */}
        <Card className="border-border/70 shadow-xs">
          <CardHeader className="pb-2.5">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Globe className="h-4 w-4 text-emerald-400" />
              Display Currency
            </CardTitle>
            <CardDescription className="text-xs">
              Converts US & EU stocks using live ECB FX rates.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-muted/60 rounded-2xl border border-border/50">
              {(['USD', 'EUR', 'GBP'] as const).map((curr) => (
                <button
                  key={curr}
                  type="button"
                  onClick={() => setBaseCurrency(curr)}
                  className={`py-2 rounded-xl font-bold text-xs transition-all cursor-pointer select-none active:scale-95 ${
                    baseCurrency === curr
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-muted-foreground hover:text-foreground hover:bg-background/40'
                  }`}
                >
                  {curr}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Theme Appearance */}
        <Card className="border-border/70 shadow-xs">
          <CardHeader className="pb-2.5">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Moon className="h-4 w-4 text-indigo-400" />
              Theme Appearance
            </CardTitle>
            <CardDescription className="text-xs">
              Dark, Light or System Mode.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-muted/60 rounded-2xl border border-border/50">
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`py-2 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-background text-foreground shadow-xs border border-border/60'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Moon className="h-3.5 w-3.5" />
                <span>Dark</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`py-2 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  theme === 'light'
                    ? 'bg-background text-foreground shadow-xs border border-border/60'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Sun className="h-3.5 w-3.5" />
                <span>Light</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('system')}
                className={`py-2 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  theme === 'system'
                    ? 'bg-background text-foreground shadow-xs border border-border/60'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Laptop className="h-3.5 w-3.5" />
                <span>System</span>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Market Feeds & Engine Settings */}
      <Card className="border-border/70 shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald-400" />
            Market Engine & Live Feeds
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between py-1 border-b border-border/40">
            <div>
              <p className="text-xs font-semibold text-foreground">Quote Refresh Interval</p>
              <p className="text-[11px] text-muted-foreground">Background price sync frequency for NASDAQ & European markets</p>
            </div>
            <div className="flex gap-1 bg-muted/60 p-1 rounded-xl border border-border/50 text-xs">
              {['15s', '30s', '60s'].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setRefreshInterval(val)}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                    refreshInterval === val
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-xs font-semibold text-foreground">Tactile Animations</p>
              <p className="text-[11px] text-muted-foreground">Smooth button presses and chart micro-interactions</p>
            </div>
            <button
              type="button"
              onClick={() => setHapticsEnabled(!hapticsEnabled)}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                hapticsEnabled ? 'bg-emerald-500' : 'bg-muted border border-border'
              }`}
            >
              <span
                className={`block h-4 w-4 rounded-full bg-white transition-transform ${
                  hapticsEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Price Alerts Section */}
      <PriceAlertManager />

      {/* Data Management & Backups */}
      <Card className="border-border/70 shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Shield className="h-4 w-4 text-emerald-400" />
            Data Management & Backups
          </CardTitle>
          <CardDescription className="text-xs">
            StockPulse AI is local-first. Your holdings and watchlists are stored securely inside your device.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              className="text-xs font-semibold gap-2 rounded-xl border-border/70"
              onClick={handleExport}
            >
              <Download className="h-4 w-4 text-emerald-400" />
              Backup Portfolio (JSON)
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="text-xs font-semibold gap-2 rounded-xl border-border/70"
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
        <span className="font-mono">StockPulse AI v1.0.0</span>
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
              Populate portfolio with US & European blue-chips (NVDA, AAPL, ASML, SAP, SPY, VWCE) for testing.
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
              Are you sure you want to delete all local positions, watchlists, and price alerts?
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
