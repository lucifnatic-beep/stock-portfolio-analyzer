'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectItem } from '@/components/ui/select';
import { db } from '@/lib/db';
import { useAppStore } from '@/stores/app-store';
import { useTranslation } from '@/lib/i18n';
import { DEFAULT_BROKERS, type SearchResult, type Broker } from '@/types';

export function AddPositionDialog() {
  const { locale, activeBroker } = useAppStore();
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
  const [shares, setShares] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [buyDate, setBuyDate] = useState(new Date().toISOString().split('T')[0]);
  const [currency, setCurrency] = useState('RON');
  const [broker, setBroker] = useState(activeBroker === 'all' ? 'bcr' : activeBroker);
  const [exchange, setExchange] = useState('');
  const [notes, setNotes] = useState('');
  const [showSearch, setShowSearch] = useState(false);

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
    const timer = setTimeout(() => searchStocks(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery, searchStocks]);

  const selectSearchResult = (result: SearchResult) => {
    setSymbol(result.symbol);
    setExchange(result.exchange);
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleSubmit = async () => {
    if (!symbol || !shares || !buyPrice) return;

    await db.positions.add({
      symbol: symbol.toUpperCase(),
      shares: parseFloat(shares),
      buyPrice: parseFloat(buyPrice),
      buyDate,
      currency,
      exchange,
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
    setCurrency('RON');
    setExchange('');
    setNotes('');
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-2">
        <Plus className="h-4 w-4" />
        {t('portfolio.addPosition')}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent onClose={() => setOpen(false)}>
          <DialogHeader>
            <DialogTitle>{t('portfolio.addPosition')}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Broker selection */}
            <div>
              <label className="text-sm font-medium mb-1 block">Broker / Cont</label>
              <Select value={broker} onValueChange={setBroker}>
                {availableBrokers.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </Select>
            </div>

            {/* Symbol with search */}
            <div className="relative">
              <label className="text-sm font-medium mb-1 block">{t('portfolio.symbol')}</label>
              <div className="flex gap-2">
                <Input
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  placeholder="TLV.RO, SNP.RO, AAPL, NVD.DE..."
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowSearch(!showSearch)}
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              {showSearch && (
                <div className="mt-2 rounded-md border bg-card p-2">
                  <Input
                    autoFocus
                    placeholder={t('nav.search')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <div className="max-h-40 overflow-y-auto mt-2">
                    {searchResults.map((r) => (
                      <button
                        key={r.symbol}
                        className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent"
                        onClick={() => selectSearchResult(r)}
                      >
                        <span className="font-semibold">{r.symbol}</span>
                        <span className="truncate text-muted-foreground">{r.shortName}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">{t('portfolio.shares')}</label>
                <Input
                  type="number"
                  value={shares}
                  onChange={(e) => setShares(e.target.value)}
                  placeholder="10"
                  min="0"
                  step="any"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">{t('portfolio.buyPrice')}</label>
                <Input
                  type="number"
                  value={buyPrice}
                  onChange={(e) => setBuyPrice(e.target.value)}
                  placeholder="150.00"
                  min="0"
                  step="any"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">{t('portfolio.buyDate')}</label>
                <Input
                  type="date"
                  value={buyDate}
                  onChange={(e) => setBuyDate(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">{t('portfolio.currency')}</label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectItem value="RON">RON (lei)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">{t('portfolio.notes')}</label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('portfolio.notes')}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSubmit} disabled={!symbol || !shares || !buyPrice}>
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
