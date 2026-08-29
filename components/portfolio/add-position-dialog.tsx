'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Sparkles, TrendingUp } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectItem } from '@/components/ui/select';
import { db } from '@/lib/db';
import { useAppStore } from '@/stores/app-store';
import { useTranslation } from '@/lib/i18n';
import { DEFAULT_BROKERS, type SearchResult, type Broker } from '@/types';

const POPULAR_SUGGESTIONS = [
  { symbol: 'NVDA', name: 'NVIDIA Corporation', exchange: 'NASDAQ' },
  { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', exchange: 'NASDAQ' },
  { symbol: 'ASML', name: 'ASML Holding N.V.', exchange: 'NASDAQ' },
  { symbol: 'SAP.DE', name: 'SAP SE', exchange: 'XETRA' },
  { symbol: 'RHM.DE', name: 'Rheinmetall AG', exchange: 'XETRA' },
  { symbol: 'NVO', name: 'Novo Nordisk A/S', exchange: 'NYSE' },
  { symbol: 'PLTR', name: 'Palantir Technologies', exchange: 'NASDAQ' },
  { symbol: 'TSLA', name: 'Tesla Inc.', exchange: 'NASDAQ' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', exchange: 'NASDAQ' },
];

export function AddPositionDialog() {
  const { locale, baseCurrency, activeBroker } = useAppStore();
  const t = useTranslation(locale);
  const customBrokers = useLiveQuery(() => db.brokers.toArray()) || [];

  const brokersMap = new Map<string, Broker>();
  DEFAULT_BROKERS.filter(b => b.id !== 'all').forEach(b => brokersMap.set(b.id, b));
  customBrokers.forEach(b => brokersMap.set(b.id, b));
  const availableBrokers = Array.from(brokersMap.values());

  const [open, setOpen] = useState(false);
  const [symbol, setSymbol] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [shares, setShares] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [buyDate, setBuyDate] = useState(new Date().toISOString().split('T')[0]);
  const [currency, setCurrency] = useState('USD');
  const [broker, setBroker] = useState(activeBroker === 'all' ? 't212' : activeBroker);
  const [exchange, setExchange] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (activeBroker !== 'all') {
      setBroker(activeBroker);
    }
  }, [activeBroker]);

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

  const selectSearchResult = (item: { symbol: string; exchange?: string; shortName?: string }) => {
    setSymbol(item.symbol);
    setExchange(item.exchange || (item.symbol.endsWith('.DE') ? 'XETRA' : 'NASDAQ'));
    if (item.symbol.endsWith('.DE') || item.symbol.endsWith('.PA')) {
      setCurrency('EUR');
    } else if (item.symbol.endsWith('.L')) {
      setCurrency('GBP');
    } else {
      setCurrency('USD');
    }
    setShowSuggestions(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleSubmit = async () => {
    if (!symbol || !shares || !buyPrice) return;

    await db.positions.add({
      symbol: symbol.toUpperCase().trim(),
      shares: parseFloat(shares),
      buyPrice: parseFloat(buyPrice),
      buyDate,
      currency: currency || 'USD',
      exchange: exchange || (symbol.endsWith('.DE') ? 'XETRA' : 'NASDAQ'),
      broker: broker || 't212',
      notes: notes || undefined,
      createdAt: new Date().toISOString(),
    });

    setOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setSymbol('');
    setShares('');
    setBuyPrice('');
    setBuyDate(new Date().toISOString().split('T')[0]);
    setCurrency('USD');
    setExchange('');
    setNotes('');
    setShowSuggestions(false);
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="h-9 px-3.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md cursor-pointer gap-1.5 active:scale-95"
      >
        <Plus className="h-4 w-4" />
        <span>Add Position</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md p-6" onClose={() => setOpen(false)}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-emerald-400" />
              Add Stock / ETF Position
            </DialogTitle>
            <DialogDescription>
              Record a new holding in your portfolio with US or European exchanges.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3.5 py-2">
            {/* Broker selection */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                Broker Account
              </label>
              <Select value={broker} onValueChange={setBroker}>
                {availableBrokers.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </Select>
            </div>

            {/* Smart Symbol Search */}
            <div className="relative">
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                Stock Symbol / Ticker
              </label>
              <div className="relative">
                <Input
                  value={symbol}
                  onChange={(e) => {
                    setSymbol(e.target.value.toUpperCase());
                    setSearchQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder="e.g. AAPL, NVDA, ASML, SAP.DE, MSFT..."
                  className="h-10 text-sm font-mono rounded-xl pr-8 uppercase"
                />
                <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>

              {/* Suggestions / Search Results Dropdown */}
              {showSuggestions && (
                <div className="absolute top-full left-0 right-0 z-30 mt-1 p-2 rounded-2xl bg-card border border-border/80 shadow-2xl space-y-1 max-h-52 overflow-y-auto">
                  <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-emerald-400" />
                    <span>{searchResults.length > 0 ? 'Search Results' : 'Popular Suggestions'}</span>
                  </div>

                  {(searchResults.length > 0 ? searchResults : POPULAR_SUGGESTIONS).map((item) => (
                    <button
                      key={item.symbol}
                      type="button"
                      onClick={() => selectSearchResult(item)}
                      className="flex items-center justify-between w-full p-2 rounded-xl hover:bg-muted/60 transition-colors text-left text-xs font-semibold group cursor-pointer"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-bold text-foreground font-mono group-hover:text-emerald-400 transition-colors">
                          {item.symbol}
                        </span>
                        <span className="truncate text-muted-foreground text-[11px]">
                          {'name' in item ? item.name : item.shortName}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0">
                        {'exchangeDisplay' in item ? (item as any).exchangeDisplay : item.exchange}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Shares & Buy Price */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Shares / Quantity</label>
                <Input
                  type="number"
                  value={shares}
                  onChange={(e) => setShares(e.target.value)}
                  placeholder="10"
                  min="0"
                  step="any"
                  className="h-10 text-sm font-mono rounded-xl"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Average Buy Price</label>
                <Input
                  type="number"
                  value={buyPrice}
                  onChange={(e) => setBuyPrice(e.target.value)}
                  placeholder="150.00"
                  min="0"
                  step="any"
                  className="h-10 text-sm font-mono rounded-xl"
                />
              </div>
            </div>

            {/* Buy Date & Currency */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Buy Date</label>
                <Input
                  type="date"
                  value={buyDate}
                  onChange={(e) => setBuyDate(e.target.value)}
                  className="h-10 text-xs rounded-xl"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Currency</label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                </Select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Notes (Optional)</label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Long term compounder, DCA..."
                className="h-9 text-xs rounded-xl"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!symbol || !shares || !buyPrice}
              className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
            >
              Save Position
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
