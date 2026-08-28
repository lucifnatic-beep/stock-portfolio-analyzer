'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, Star, Bell } from 'lucide-react';
import Link from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CandlestickChart } from '@/components/charts/candlestick-chart';
import { TechnicalSummary } from '@/components/analysis/technical-summary';
import { FundamentalCard } from '@/components/analysis/fundamental-card';
import { MacroAnalystCard } from '@/components/analysis/macro-analyst-card';
import { ComparisonChart } from '@/components/analysis/comparison-chart';
import { useAppStore } from '@/stores/app-store';
import { useTranslation } from '@/lib/i18n';
import { formatCurrency, formatPercent, formatLargeNumber, getChangeColor } from '@/lib/utils';
import { generateSignalSummary } from '@/lib/indicators';
import { db } from '@/lib/db';
import type { OHLCV, StockQuote, StockFundamentals } from '@/types';

export default function StockPage() {
  const params = useParams();
  const symbol = (params.symbol as string)?.toUpperCase() || '';
  const { timeframe, locale } = useAppStore();
  const t = useTranslation(locale);

  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [history, setHistory] = useState<OHLCV[]>([]);
  const [fundamentals, setFundamentals] = useState<StockFundamentals | null>(null);
  const [benchmarkHistory, setBenchmarkHistory] = useState<OHLCV[]>([]);
  const [loading, setLoading] = useState(true);

  const watchlist = useLiveQuery(() => db.watchlist.toArray()) || [];
  const isInWatchlist = watchlist.some((w) => w.symbol === symbol);

  // Fetch all data
  useEffect(() => {
    if (!symbol) return;

    async function fetchData() {
      setLoading(true);
      try {
        const [quoteRes, historyRes, fundamentalsRes, benchmarkRes] = await Promise.all([
          fetch(`/api/stock/quote?symbol=${symbol}`),
          fetch(`/api/stock/history?symbol=${symbol}&range=${timeframe}`),
          fetch(`/api/stock/fundamentals?symbol=${symbol}`),
          fetch(`/api/stock/history?symbol=SPY&range=${timeframe}`),
        ]);

        const [quoteData, historyData, fundamentalsData, benchmarkData] = await Promise.all([
          quoteRes.json(),
          historyRes.json(),
          fundamentalsRes.json(),
          benchmarkRes.json(),
        ]);

        if (quoteData && !quoteData.error) setQuote(quoteData);
        if (Array.isArray(historyData)) setHistory(historyData);
        if (fundamentalsData && !fundamentalsData.error) setFundamentals(fundamentalsData);
        if (Array.isArray(benchmarkData)) setBenchmarkHistory(benchmarkData);
      } catch (err) {
        console.error('Failed to fetch stock data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [symbol, timeframe]);

  const toggleWatchlist = async () => {
    if (isInWatchlist) {
      const item = watchlist.find((w) => w.symbol === symbol);
      if (item?.id) await db.watchlist.delete(item.id);
    } else {
      await db.watchlist.add({ symbol, addedAt: new Date().toISOString() });
    }
  };

  const signals = history.length > 50 ? generateSignalSummary(history) : null;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse bg-muted rounded" />
        <div className="h-[400px] animate-pulse bg-muted rounded-lg" />
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 h-64 animate-pulse bg-muted rounded-lg" />
          <div className="h-64 animate-pulse bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{symbol}</h1>
              {quote && (
                <Badge variant="outline" className="text-xs">
                  {quote.exchange}
                </Badge>
              )}
            </div>
            {quote && (
              <div className="flex items-center gap-3 mt-1">
                <span className="text-3xl font-bold">
                  {formatCurrency(quote.regularMarketPrice, quote.currency)}
                </span>
                <div className={`flex items-center gap-1 ${getChangeColor(quote.regularMarketChange)}`}>
                  <span className="text-lg font-semibold">
                    {formatCurrency(Math.abs(quote.regularMarketChange), quote.currency)}
                  </span>
                  <span className="text-sm">
                    ({formatPercent(quote.regularMarketChangePercent)})
                  </span>
                </div>
              </div>
            )}
            {quote && (
              <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                <span>{quote.shortName}</span>
                <span>Vol: {formatLargeNumber(quote.regularMarketVolume)}</span>
                <span>52W: {formatCurrency(quote.fiftyTwoWeekLow, quote.currency)} - {formatCurrency(quote.fiftyTwoWeekHigh, quote.currency)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant={isInWatchlist ? 'default' : 'outline'}
            size="sm"
            onClick={toggleWatchlist}
            className="gap-1"
          >
            <Star className={`h-4 w-4 ${isInWatchlist ? 'fill-current' : ''}`} />
            {isInWatchlist ? t('watchlist.remove') : t('watchlist.add')}
          </Button>
        </div>
      </div>

      {/* Chart + 3 Pillars of Analysis */}
      <div className="space-y-6">
        {/* Main interactive candlestick chart */}
        {history.length > 0 && (
          <div className="rounded-xl border bg-card/60 p-4 shadow-xs">
            <CandlestickChart data={history} symbol={symbol} />
          </div>
        )}

        {/* 3 Pillars Section Header */}
        <div className="border-b border-border/40 pb-2">
          <h2 className="text-lg font-bold tracking-tight text-foreground">
            3-Pillar Investment Analysis: Technical, Fundamental & Macro
          </h2>
          <p className="text-xs text-muted-foreground">
            Multi-factor evaluation model combining price action, financial health, and global catalysts.
          </p>
        </div>

        {/* 3 Pillars Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Pillar 1: Technical Analysis */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
              <span>📐 Pillar 1: Technical Signals</span>
            </div>
            {signals ? (
              <TechnicalSummary signals={signals} />
            ) : (
              <div className="p-6 rounded-xl border text-center text-xs text-muted-foreground">
                Calculating technical indicators...
              </div>
            )}
          </div>

          {/* Pillar 2: Fundamental Health & Valuation */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400">
              <span>💼 Pillar 2: Financial Health & Ratios</span>
            </div>
            {fundamentals ? (
              <FundamentalCard fundamentals={fundamentals} />
            ) : (
              <div className="p-6 rounded-xl border text-center text-xs text-muted-foreground">
                Loading financial fundamentals...
              </div>
            )}
          </div>

          {/* Pillar 3: Macro Trends, Analyst Targets & Catalysts */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
              <span>🌐 Pillar 3: Macro & Analyst Consensus</span>
            </div>
            <MacroAnalystCard symbol={symbol} quote={quote} fundamentals={fundamentals} />
          </div>
        </div>

        {/* Comparison chart with S&P 500 benchmark */}
        {history.length > 0 && benchmarkHistory.length > 0 && (
          <div className="rounded-xl border bg-card/60 p-4 shadow-xs">
            <h3 className="text-sm font-semibold mb-3 text-foreground">
              Benchmark Relative Performance vs S&P 500 (SPY)
            </h3>
            <ComparisonChart
              stockData={history}
              benchmarkData={benchmarkHistory}
              symbol={symbol}
              benchmarkSymbol="SPY"
            />
          </div>
        )}
      </div>
    </div>
  );
}
