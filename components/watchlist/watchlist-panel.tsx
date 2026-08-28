'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Star, Plus, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { db } from '@/lib/db';
import { formatCurrency, formatPercent, getChangeColor } from '@/lib/utils';
import { useAppStore } from '@/stores/app-store';
import { useTranslation } from '@/lib/i18n';
import type { StockQuote } from '@/types';

export function WatchlistPanel() {
  const { locale } = useAppStore();
  const t = useTranslation(locale);
  const watchlist = useLiveQuery(() => db.watchlist.toArray()) || [];
  const [quotes, setQuotes] = useState<Record<string, StockQuote>>({});
  const [newSymbol, setNewSymbol] = useState('');
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
    const interval = setInterval(fetchQuotes, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [fetchQuotes]);

  const addToWatchlist = async () => {
    if (!newSymbol.trim()) return;
    const symbol = newSymbol.trim().toUpperCase();
    const exists = watchlist.find((w) => w.symbol === symbol);
    if (exists) return;
    await db.watchlist.add({ symbol, addedAt: new Date().toISOString() });
    setNewSymbol('');
  };

  const removeFromWatchlist = async (id: number | undefined) => {
    if (!id) return;
    await db.watchlist.delete(id);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Star className="h-4 w-4 text-amber-500" />
            {t('watchlist.title')}
          </CardTitle>
          <Link href="/watchlist" className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1">
            View All ({watchlist.length}) →
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {/* Add symbol */}
        <div className="flex gap-2 mb-4">
          <Input
            placeholder="AAPL, MSFT..."
            value={newSymbol}
            onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && addToWatchlist()}
            className="h-8 text-sm"
          />
          <Button size="sm" className="h-8" onClick={addToWatchlist}>
            <Plus className="h-3 w-3" />
          </Button>
        </div>

        {watchlist.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {t('watchlist.empty')}
          </p>
        ) : (
          <div className="space-y-1">
            {watchlist.map((item) => {
              const quote = quotes[item.symbol];
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-muted/50 transition-colors group"
                >
                  <Link
                    href={`/stocks/${item.symbol}`}
                    className="flex-1 flex items-center gap-2"
                  >
                    <span className="font-semibold text-sm">{item.symbol}</span>
                    {quote && (
                      <>
                        <span className="text-sm">{formatCurrency(quote.regularMarketPrice, quote.currency)}</span>
                        <span className={`text-xs ${getChangeColor(quote.regularMarketChangePercent)}`}>
                          {quote.regularMarketChangePercent >= 0 ? (
                            <TrendingUp className="h-3 w-3 inline mr-0.5" />
                          ) : (
                            <TrendingDown className="h-3 w-3 inline mr-0.5" />
                          )}
                          {formatPercent(quote.regularMarketChangePercent)}
                        </span>
                      </>
                    )}
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                    onClick={() => removeFromWatchlist(item.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
