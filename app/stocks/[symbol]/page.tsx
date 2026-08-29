'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Star, TrendingUp, SlidersHorizontal, ChevronDown, ChevronUp, Activity } from 'lucide-react';
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
  const router = useRouter();
  const params = useParams();
  const symbol = (params.symbol as string)?.toUpperCase() || '';
  const { timeframe, setTimeframe, locale } = useAppStore();
  const t = useTranslation(locale);

  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [history, setHistory] = useState<OHLCV[]>([]);
  const [fundamentals, setFundamentals] = useState<StockFundamentals | null>(null);
  const [benchmarkHistory, setBenchmarkHistory] = useState<OHLCV[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdvancedIndicators, setShowAdvancedIndicators] = useState(false);
  const [livePulse, setLivePulse] = useState(false);

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

  // Periodic pulse effect
  useEffect(() => {
    const interval = setInterval(() => {
      setLivePulse(true);
      setTimeout(() => setLivePulse(false), 1000);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

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
      <div className="space-y-4 max-w-5xl mx-auto p-4">
        <div className="h-8 w-48 animate-pulse bg-muted rounded-xl" />
        <div className="h-[340px] animate-pulse bg-muted rounded-2xl" />
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 h-64 animate-pulse bg-muted rounded-2xl" />
          <div className="h-64 animate-pulse bg-muted rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 max-w-5xl mx-auto">
      {/* Top Bar Navigation & Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (window.history.length > 1) {
                router.back();
              } else {
                router.push('/');
              }
            }}
            title="Go back"
            className="h-9 w-9 rounded-xl hover:bg-muted cursor-pointer"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-foreground font-mono">{symbol}</h1>
              {quote && (
                <Badge variant="outline" className="text-xs font-mono">
                  {quote.exchange || 'NASDAQ'}
                </Badge>
              )}
              {/* Live Ticker Pulse */}
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                <span className={`h-1.5 w-1.5 rounded-full bg-emerald-500 ${livePulse ? 'animate-ping' : ''}`} />
                LIVE
              </span>
            </div>

            {quote && (
              <div className="flex items-baseline gap-2.5 mt-0.5">
                <span className="text-2xl sm:text-3xl font-extrabold text-foreground font-mono">
                  {formatCurrency(quote.regularMarketPrice, quote.currency)}
                </span>
                <div className={`flex items-center gap-1 font-mono font-bold text-sm ${getChangeColor(quote.regularMarketChange)}`}>
                  <span>
                    {quote.regularMarketChange >= 0 ? '+' : ''}
                    {formatCurrency(quote.regularMarketChange, quote.currency)}
                  </span>
                  <span>({formatPercent(quote.regularMarketChangePercent)})</span>
                </div>
              </div>
            )}

            {quote && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-sm">
                {quote.shortName || symbol} · Vol: {formatLargeNumber(quote.regularMarketVolume)}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={isInWatchlist ? 'default' : 'outline'}
            size="sm"
            onClick={toggleWatchlist}
            className="h-9 text-xs font-bold gap-1.5 rounded-xl cursor-pointer"
          >
            <Star className={`h-4 w-4 ${isInWatchlist ? 'fill-current text-amber-400' : ''}`} />
            <span>{isInWatchlist ? 'In Watchlist' : 'Add Watchlist'}</span>
          </Button>
        </div>
      </div>

      {/* Main Chart */}
      {history.length > 0 && (
        <div className="rounded-3xl border border-border/80 bg-card p-4 sm:p-5 shadow-md space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Price Chart ({timeframe})
            </h3>
            {/* Timeframe selector */}
            <div className="flex items-center gap-1 p-1 bg-muted/60 rounded-xl border border-border/40 text-[11px] font-bold">
              {(['1D', '1W', '1M', '1Y', 'ALL'] as const).map((tf) => (
                <button
                  key={tf}
                  type="button"
                  onClick={() => setTimeframe(tf as any)}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    timeframe === tf
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          <div className="h-[280px] sm:h-[340px]">
            <CandlestickChart data={history} symbol={symbol} />
          </div>
        </div>
      )}

      {/* Advanced Technical Indicators Accordion */}
      <div className="border border-border/70 rounded-3xl overflow-hidden bg-card shadow-xs">
        <button
          type="button"
          onClick={() => setShowAdvancedIndicators(!showAdvancedIndicators)}
          className="flex items-center justify-between w-full p-4 hover:bg-muted/40 transition-colors text-left cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-emerald-400" />
            <span className="text-sm font-bold text-foreground">Advanced Technical Indicators (RSI, MACD, Bollinger)</span>
          </div>
          {showAdvancedIndicators ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>

        {showAdvancedIndicators && (
          <div className="p-4 pt-0 border-t border-border/40 space-y-3 animate-in fade-in-0">
            {signals ? (
              <TechnicalSummary signals={signals} />
            ) : (
              <p className="text-xs text-muted-foreground text-center py-3">Calculating technical metrics...</p>
            )}
          </div>
        )}
      </div>

      {/* 3 Pillars Grid: Fundamentals & Macro */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Pillar 1: Fundamentals */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider">
            <span>💼 Financial Ratios & Valuation</span>
          </div>
          {fundamentals ? (
            <FundamentalCard fundamentals={fundamentals} />
          ) : (
            <div className="p-6 rounded-2xl border text-center text-xs text-muted-foreground">
              Financial data compiled from SEC & European corporate filings.
            </div>
          )}
        </div>

        {/* Pillar 2: Macro & Analysts */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
            <span>🌐 Institutional Consensus & Global Catalysts</span>
          </div>
          <MacroAnalystCard symbol={symbol} quote={quote} fundamentals={fundamentals} />
        </div>
      </div>

      {/* Benchmark Relative Performance */}
      {history.length > 0 && benchmarkHistory.length > 0 && (
        <div className="rounded-3xl border border-border/80 bg-card p-5 shadow-md">
          <h3 className="text-sm font-bold mb-3 text-foreground">
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
  );
}
