'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Bell, Plus, Trash2, ArrowUp, ArrowDown, Check, Search, Sparkles } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectItem } from '@/components/ui/select';
import { db } from '@/lib/db';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useAppStore } from '@/stores/app-store';
import { useTranslation } from '@/lib/i18n';
import type { AlertDirection, SearchResult } from '@/types';

const POPULAR_ALERTS_SUGGESTIONS = [
  { symbol: 'NVDA', name: 'NVIDIA Corporation', defaultPrice: 130.0 },
  { symbol: 'AAPL', name: 'Apple Inc.', defaultPrice: 235.0 },
  { symbol: 'MSFT', name: 'Microsoft Corporation', defaultPrice: 430.0 },
  { symbol: 'ASML', name: 'ASML Holding N.V.', defaultPrice: 790.0 },
  { symbol: 'SAP.DE', name: 'SAP SE', defaultPrice: 215.0 },
  { symbol: 'TSLA', name: 'Tesla Inc.', defaultPrice: 220.0 },
];

export function PriceAlertManager() {
  const { locale, baseCurrency } = useAppStore();
  const t = useTranslation(locale);
  const alerts = useLiveQuery(() => db.priceAlerts.toArray()) || [];
  const positions = useLiveQuery(() => db.positions.toArray()) || [];

  const [symbol, setSymbol] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [targetPrice, setTargetPrice] = useState('');
  const [direction, setDirection] = useState<AlertDirection>('above');
  const [showForm, setShowForm] = useState(false);

  // Live stock search
  const searchStocks = useCallback(async (q: string) => {
    if (q.length < 1) { setSearchResults([]); return; }
    try {
      const res = await fetch(`/api/stock/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setSearchResults(Array.isArray(data) ? data : []);
    } catch {
      setSearchResults([]);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => searchStocks(searchQuery), 250);
    return () => clearTimeout(timer);
  }, [searchQuery, searchStocks]);

  const selectStock = async (sym: string) => {
    setSymbol(sym.toUpperCase());
    setShowSearchDropdown(false);
    setSearchQuery('');
    setSearchResults([]);

    // Fetch current price to suggest default target price (+5% or -5%)
    try {
      const res = await fetch(`/api/stock/quote?symbol=${encodeURIComponent(sym)}`);
      const quote = await res.json();
      if (quote && quote.regularMarketPrice) {
        const price = quote.regularMarketPrice;
        const suggested = direction === 'above' ? (price * 1.05).toFixed(2) : (price * 0.95).toFixed(2);
        setTargetPrice(suggested);
      }
    } catch {}
  };

  // Check alerts periodically
  const checkAlerts = useCallback(async () => {
    const activeAlerts = alerts.filter((a) => a.active && !a.triggered);
    if (activeAlerts.length === 0) return;

    const symbols = [...new Set(activeAlerts.map((a) => a.symbol))];
    try {
      const res = await fetch(`/api/stock/quote?symbols=${encodeURIComponent(symbols.join(','))}`);
      const quotes = await res.json();
      if (!Array.isArray(quotes)) return;

      for (const alert of activeAlerts) {
        const quote = quotes.find((q: { symbol: string }) => q.symbol === alert.symbol);
        if (!quote) continue;

        const price = quote.regularMarketPrice;
        const triggered =
          (alert.direction === 'above' && price >= alert.targetPrice) ||
          (alert.direction === 'below' && price <= alert.targetPrice);

        if (triggered && alert.id) {
          await db.priceAlerts.update(alert.id, {
            triggered: true,
            triggeredAt: new Date().toISOString(),
          });

          // Browser notification
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`Price Triggered: ${alert.symbol}`, {
              body: `${alert.symbol} reached target of ${formatCurrency(alert.targetPrice, 'USD')} (Current: ${formatCurrency(price, 'USD')})`,
              icon: '/favicon.ico',
            });
          }
        }
      }
    } catch (err) {
      console.error('Alert check failed:', err);
    }
  }, [alerts]);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    checkAlerts();
    const interval = setInterval(checkAlerts, 60000);
    return () => clearInterval(interval);
  }, [checkAlerts]);

  const addAlert = async () => {
    if (!symbol || !targetPrice) return;
    await db.priceAlerts.add({
      symbol: symbol.toUpperCase().trim(),
      targetPrice: parseFloat(targetPrice),
      direction,
      active: true,
      triggered: false,
      createdAt: new Date().toISOString(),
    });
    setSymbol('');
    setTargetPrice('');
    setShowForm(false);
  };

  const deleteAlert = async (id: number | undefined) => {
    if (!id) return;
    await db.priceAlerts.delete(id);
  };

  const activeAlerts = alerts.filter((a) => a.active && !a.triggered);
  const triggeredAlerts = alerts.filter((a) => a.triggered);

  return (
    <Card className="border-border/70 shadow-xs">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4 text-emerald-400" />
            Price Alerts
          </CardTitle>
          <div className="flex items-center gap-2">
            <Link href="/alerts" className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold">
              Manage ({alerts.length}) →
            </Link>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs font-semibold gap-1 rounded-lg"
              onClick={() => setShowForm(!showForm)}
            >
              <Plus className="h-3 w-3" />
              <span>Add Alert</span>
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Add alert form with live search */}
        {showForm && (
          <div className="rounded-2xl border border-border/70 p-3.5 mb-4 space-y-3 bg-muted/20">
            {/* Symbol autocomplete input */}
            <div className="relative">
              <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                Stock Symbol
              </label>
              <div className="relative">
                <Input
                  placeholder="Search stock (e.g. NVDA, AAPL, ASML)..."
                  value={symbol}
                  onChange={(e) => {
                    setSymbol(e.target.value.toUpperCase());
                    setSearchQuery(e.target.value);
                    setShowSearchDropdown(true);
                  }}
                  onFocus={() => setShowSearchDropdown(true)}
                  className="h-9 text-xs font-mono rounded-xl pr-8 uppercase"
                />
                <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>

              {/* Live search dropdown */}
              {showSearchDropdown && (
                <div className="absolute top-full left-0 right-0 z-30 mt-1 p-2 rounded-2xl bg-card border border-border/80 shadow-2xl space-y-1 max-h-48 overflow-y-auto">
                  <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-emerald-400" />
                    <span>{searchResults.length > 0 ? 'Search Results' : 'Suggested Stocks'}</span>
                  </div>

                  {(searchResults.length > 0 ? searchResults : (positions.length > 0 ? positions : POPULAR_ALERTS_SUGGESTIONS)).map((item) => (
                    <button
                      key={item.symbol}
                      type="button"
                      onClick={() => selectStock(item.symbol)}
                      className="flex items-center justify-between w-full p-2 rounded-xl hover:bg-muted/60 transition-colors text-left text-xs font-semibold group cursor-pointer"
                    >
                      <span className="font-bold text-foreground font-mono group-hover:text-emerald-400 transition-colors">
                        {item.symbol}
                      </span>
                      <span className="truncate text-muted-foreground text-[11px]">
                        {'name' in item ? item.name : 'shortName' in item ? (item as any).shortName : ''}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Target Price and Direction */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                  Target Price ({baseCurrency})
                </label>
                <Input
                  type="number"
                  placeholder="150.00"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  className="h-9 text-xs font-mono rounded-xl"
                  step="0.01"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                  Trigger Condition
                </label>
                <Select value={direction} onValueChange={(v) => setDirection(v as AlertDirection)}>
                  <SelectItem value="above">↑ Rises Above</SelectItem>
                  <SelectItem value="below">↓ Drops Below</SelectItem>
                </Select>
              </div>
            </div>

            <Button
              size="sm"
              className="w-full h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-xs"
              onClick={addAlert}
              disabled={!symbol || !targetPrice}
            >
              Set Price Alert
            </Button>
          </div>
        )}

        {alerts.length === 0 && !showForm ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            No active price alerts. Click &quot;Add Alert&quot; to monitor target prices.
          </p>
        ) : (
          <div className="space-y-1">
            {activeAlerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-center justify-between rounded-xl px-2.5 py-2 hover:bg-muted/50 transition-colors group"
              >
                <div className="flex items-center gap-2">
                  {alert.direction === 'above' ? (
                    <ArrowUp className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <ArrowDown className="h-3.5 w-3.5 text-red-500" />
                  )}
                  <span className="font-bold text-xs font-mono text-foreground">{alert.symbol}</span>
                  <span className="text-[11px] text-muted-foreground">
                    {alert.direction === 'above' ? '≥' : '≤'} {formatCurrency(alert.targetPrice, 'USD')}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-60 hover:opacity-100 hover:text-red-400 transition-all"
                  onClick={() => deleteAlert(alert.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}

            {triggeredAlerts.length > 0 && (
              <>
                <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-3 mb-1 px-1">
                  Triggered History
                </div>
                {triggeredAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between rounded-xl px-2.5 py-1.5 opacity-60 group"
                  >
                    <div className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="text-xs font-mono font-bold">{alert.symbol}</span>
                      <span className="text-[11px] text-muted-foreground font-mono">
                        {formatCurrency(alert.targetPrice, 'USD')}
                      </span>
                      {alert.triggeredAt && (
                        <span className="text-[10px] text-muted-foreground">
                          {formatDate(alert.triggeredAt)}
                        </span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-60 hover:opacity-100 hover:text-red-400"
                      onClick={() => deleteAlert(alert.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
