'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Star, Plus, Trash2, TrendingUp, TrendingDown, Search, ExternalLink } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { db } from '@/lib/db';
import { formatCurrency, formatPercent, getChangeColor } from '@/lib/utils';
import { useAppStore } from '@/stores/app-store';
import { useTranslation } from '@/lib/i18n';
import type { StockQuote, SearchResult } from '@/types';

export default function WatchlistPage() {
  const { locale, baseCurrency } = useAppStore();
  const t = useTranslation(locale);
  const watchlist = useLiveQuery(() => db.watchlist.toArray()) || [];
  const [quotes, setQuotes] = useState<Record<string, StockQuote>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchQuotes = useCallback(async () => {
    if (watchlist.length === 0) return;
    setLoading(true);
    try {
      const symbols = watchlist.map((w) => w.symbol).join(',');
      const res = await fetch(`/api/stock/quote?symbols=${encodeURIComponent(symbols)}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        const quotesMap: Record<string, StockQuote> = {};
        data.forEach((q: StockQuote) => { quotesMap[q.symbol] = q; });
        setQuotes(quotesMap);
      }
    } catch (err) {
      console.error('Failed to fetch watchlist quotes:', err);
    } finally {
      setLoading(false);
    }
  }, [watchlist]);

  useEffect(() => {
    fetchQuotes();
    const interval = setInterval(fetchQuotes, 30000);
    return () => clearInterval(interval);
  }, [fetchQuotes]);

  // Live search for adding stocks
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(`/api/stock/search?q=${encodeURIComponent(searchQuery.trim())}`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setSearchResults(data);
        }
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const addSymbol = async (symbol: string) => {
    const sym = symbol.toUpperCase().trim();
    const exists = watchlist.some((w) => w.symbol === sym);
    if (!exists) {
      await db.watchlist.add({ symbol: sym, addedAt: new Date().toISOString() });
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  const removeSymbol = async (id?: number) => {
    if (!id) return;
    await db.watchlist.delete(id);
  };

  return (
    <div className="space-y-6 pb-16 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/40 pb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <Star className="h-6 w-6 fill-amber-500/20" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t('watchlist.title')}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {watchlist.length} stocks tracked · Real-time market monitoring
            </p>
          </div>
        </div>
      </div>

      {/* Add to Watchlist Search Box */}
      <div className="relative">
        <div className="flex items-center gap-2 p-2 rounded-2xl bg-card border border-border/70 shadow-xs">
          <Search className="h-4 w-4 ml-2 text-muted-foreground shrink-0" />
          <Input
            placeholder="Search to add stock (e.g. Apple, Nvidia, ASML, Rheinmetall)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-0 shadow-none focus-visible:ring-0 text-sm h-9"
          />
          {searchQuery && (
            <Button
              size="sm"
              variant="ghost"
              className="text-xs h-7"
              onClick={() => { setSearchQuery(''); setSearchResults([]); }}
            >
              Clear
            </Button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-30 mt-1.5 p-2 rounded-2xl bg-card border border-border/80 shadow-2xl space-y-1 max-h-64 overflow-y-auto">
            {searchResults.map((res) => {
              const alreadyIn = watchlist.some((w) => w.symbol === res.symbol);
              return (
                <div
                  key={res.symbol}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-muted/60 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="font-bold text-sm text-foreground font-mono">{res.symbol}</span>
                    <span className="truncate text-xs text-muted-foreground">{res.shortName || res.longName}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                      {res.exchangeDisplay || res.exchange}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant={alreadyIn ? 'outline' : 'default'}
                    className={`h-7 text-xs font-semibold gap-1 ${alreadyIn ? 'opacity-50' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}
                    onClick={() => !alreadyIn && addSymbol(res.symbol)}
                    disabled={alreadyIn}
                  >
                    {alreadyIn ? 'Tracking' : '+ Add'}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Watchlist Cards Grid */}
      {watchlist.length === 0 ? (
        <Card className="border-dashed border-border/70 p-8 text-center">
          <div className="inline-flex items-center justify-center p-3 rounded-full bg-amber-500/10 text-amber-400 mb-3">
            <Star className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-foreground">Your Watchlist is Empty</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            Search for any US or European stock above to start tracking real-time prices and market moves.
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {watchlist.map((item) => {
            const quote = quotes[item.symbol];
            const isPositive = quote ? quote.regularMarketChangePercent >= 0 : true;

            return (
              <div
                key={item.id}
                className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-card border border-border/70 hover:border-emerald-500/30 transition-all group shadow-xs"
              >
                <Link
                  href={`/stocks/${item.symbol}`}
                  className="flex-1 flex items-center justify-between gap-4 min-w-0 pr-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base text-foreground font-mono group-hover:text-emerald-400 transition-colors">
                        {item.symbol}
                      </span>
                      {quote && quote.exchange && (
                        <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0">
                          {quote.exchange}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {quote?.shortName || item.symbol}
                    </p>
                  </div>

                  {quote && (
                    <div className="text-right">
                      <p className="text-base font-bold font-mono text-foreground">
                        {formatCurrency(quote.regularMarketPrice, quote.currency)}
                      </p>
                      <div className={`flex items-center justify-end gap-1 text-xs font-semibold ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                        {isPositive ? (
                          <TrendingUp className="h-3.5 w-3.5" />
                        ) : (
                          <TrendingDown className="h-3.5 w-3.5" />
                        )}
                        <span className="font-mono">
                          {isPositive ? '+' : ''}{formatPercent(quote.regularMarketChangePercent)}
                        </span>
                      </div>
                    </div>
                  )}
                </Link>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full opacity-60 hover:opacity-100 hover:bg-red-500/10 hover:text-red-400 transition-all shrink-0"
                  onClick={() => removeSymbol(item.id)}
                  title="Remove from watchlist"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
