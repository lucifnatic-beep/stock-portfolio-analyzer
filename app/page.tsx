'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { calculatePositionPL, calculatePortfolioSummary, calculateAllocation, getFXRate, DEFAULT_FX_RATES } from '@/lib/portfolio-utils';
import { PortfolioSummary } from '@/components/portfolio/portfolio-summary';
import { HoldingsTable } from '@/components/portfolio/holdings-table';
import { AddPositionDialog } from '@/components/portfolio/add-position-dialog';
import { T212ImportDialog } from '@/components/portfolio/t212-import-dialog';
import { CSVImportDialog } from '@/components/portfolio/csv-import-dialog';
import { BrokerTabs } from '@/components/portfolio/broker-tabs';
import { AllocationChart } from '@/components/portfolio/allocation-chart';
import { WatchlistPanel } from '@/components/watchlist/watchlist-panel';
import { PriceAlertManager } from '@/components/alerts/price-alert-manager';
import { MarketOpportunities } from '@/components/discovery/market-opportunities';
import { MarketIntelligence } from '@/components/intelligence/market-intelligence';
import { useAppStore } from '@/stores/app-store';
import { useTranslation } from '@/lib/i18n';
import { deduplicateAndSeedPortfolio } from '@/lib/seed';
import { DEFAULT_BROKERS, type PositionWithQuote, type StockQuote, type Broker } from '@/types';

export default function DashboardPage() {
  const { locale, baseCurrency, activeBroker } = useAppStore();
  const t = useTranslation(locale);
  const allDbPositions = useLiveQuery(() => db.positions.toArray()) || [];
  const customBrokers = useLiveQuery(() => db.brokers.toArray()) || [];
  const [quotesMap, setQuotesMap] = useState<Record<string, StockQuote>>({});
  const [fxRates, setFxRates] = useState<Record<string, number>>(DEFAULT_FX_RATES);
  const [loading, setLoading] = useState(false);

  // Auto seed and deduplicate (runs safely once per session)
  useEffect(() => {
    deduplicateAndSeedPortfolio();
  }, []);

  // Filter positions by activeBroker
  const filteredPositions = useMemo(() => {
    return allDbPositions.filter((pos) => {
      if (activeBroker === 'all') return true;
      return pos.broker === activeBroker;
    });
  }, [allDbPositions, activeBroker]);

  // Fetch FX rates
  useEffect(() => {
    async function fetchFX() {
      try {
        const res = await fetch('/api/fx');
        const data = await res.json();
        if (data && typeof data === 'object') {
          setFxRates((prev) => ({ ...prev, ...data }));
        }
      } catch (err) {
        console.error('Failed to fetch FX rates:', err);
      }
    }
    fetchFX();
    const interval = setInterval(fetchFX, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchQuotes = useCallback(async () => {
    if (filteredPositions.length === 0) return;

    setLoading(true);
    try {
      const uniqueSymbols = [...new Set(filteredPositions.map((p) => p.symbol))];
      const res = await fetch(
        `/api/stock/quote?symbols=${encodeURIComponent(uniqueSymbols.join(','))}`
      );
      const quotes: StockQuote[] = await res.json();

      if (Array.isArray(quotes)) {
        const newMap: Record<string, StockQuote> = {};
        quotes.forEach((q) => { if (q && q.symbol) newMap[q.symbol] = q; });
        setQuotesMap((prev) => ({ ...prev, ...newMap }));
      }
    } catch (err) {
      console.error('Failed to fetch quotes:', err);
    } finally {
      setLoading(false);
    }
  }, [filteredPositions]);

  useEffect(() => {
    fetchQuotes();
    const interval = setInterval(fetchQuotes, 60000);
    return () => clearInterval(interval);
  }, [fetchQuotes]);

  // Synchronous Effective Positions calculation (Instant reaction to baseCurrency and fxRates)
  const effectivePositions = useMemo(() => {
    return filteredPositions.map((pos) => {
      const quote = quotesMap[pos.symbol];
      const currentPrice = (quote && quote.regularMarketPrice) ? quote.regularMarketPrice : pos.buyPrice;
      const dayChange = (quote && quote.regularMarketChange != null) ? quote.regularMarketChange : 0;
      const dayChangePercent = (quote && quote.regularMarketChangePercent != null) ? quote.regularMarketChangePercent : 0;
      const shortName = quote?.shortName || pos.notes || pos.symbol;

      return calculatePositionPL(
        pos,
        currentPrice,
        dayChange,
        dayChangePercent,
        shortName,
        baseCurrency,
        fxRates
      );
    });
  }, [filteredPositions, quotesMap, baseCurrency, fxRates]);

  // Calculate Cash converted into baseCurrency
  const totalCash = useMemo(() => {
    const brokersMap = new Map<string, Broker>();
    DEFAULT_BROKERS.forEach((b) => brokersMap.set(b.id, { ...b }));
    customBrokers.forEach((b) => brokersMap.set(b.id, { ...b }));
    const allBrokers = Array.from(brokersMap.values());

    if (activeBroker === 'all') {
      return allBrokers
        .filter((b) => b.id !== 'all')
        .reduce((sum, b) => {
          const defaultCurr = b.id === 't212' ? 'USD' : 'RON';
          const rate = getFXRate(b.cashCurrency || defaultCurr, baseCurrency, fxRates);
          return sum + (b.cash || 0) * rate;
        }, 0);
    } else {
      const b = allBrokers.find((b) => b.id === activeBroker);
      const defaultCurr = b?.id === 't212' ? 'USD' : 'RON';
      const rate = getFXRate(b?.cashCurrency || defaultCurr, baseCurrency, fxRates);
      return (b?.cash || 0) * rate;
    }
  }, [customBrokers, activeBroker, baseCurrency, fxRates]);

  const rawSummary = useMemo(() => {
    return calculatePortfolioSummary(effectivePositions);
  }, [effectivePositions]);

  const summary = useMemo(() => ({
    ...rawSummary,
    cashBalance: totalCash,
    totalWithCash: rawSummary.totalValue + totalCash,
  }), [rawSummary, totalCash]);

  const allocation = useMemo(() => {
    return calculateAllocation(effectivePositions);
  }, [effectivePositions]);

  return (
    <div className="space-y-6 sm:space-y-8 pb-12 w-full max-w-full min-w-0">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t('portfolio.title')}</h1>
          <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
            <span>{filteredPositions.length} active positions</span>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-sm shadow-emerald-500/50"></span>
              </span>
              Live Synced
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <T212ImportDialog onImportSuccess={fetchQuotes} />
          <CSVImportDialog onImportSuccess={fetchQuotes} />
          <AddPositionDialog />
        </div>
      </div>

      {/* Broker Navigation Tabs & Cash Display */}
      <div className="w-full min-w-0">
        <BrokerTabs />
      </div>

      {/* Summary cards */}
      <div className="w-full min-w-0">
        <PortfolioSummary summary={summary} currency={baseCurrency} />
      </div>

      {/* Main content grid: Positions + Sidebar */}
      <div className="grid gap-6 lg:grid-cols-3 w-full min-w-0">
        {/* Holdings table - takes 2 columns */}
        <div className="lg:col-span-2 space-y-6 w-full min-w-0">
          <HoldingsTable positions={effectivePositions} />
        </div>

        {/* Right sidebar */}
        <div className="space-y-6 w-full min-w-0">
          <AllocationChart data={allocation} currency={baseCurrency} />
          <WatchlistPanel />
          <PriceAlertManager />
        </div>
      </div>

      {/* Quick Access to HOT Picks AI Radar */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-500/15 via-amber-500/10 to-indigo-500/10 border border-orange-500/30 flex items-center justify-between flex-wrap gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
            <span className="text-xl">🔥</span>
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              Live Radar: Hot Stocks to Buy
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500 text-white">
                NEW
              </span>
            </h3>
            <p className="text-xs text-muted-foreground">
              AI multi-factor scanner: technical analysis, fundamentals, Wall Street & BVB analyst consensus, news and geopolitics.
            </p>
          </div>
        </div>
        <Link href="/hot-picks">
          <button className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition-all shadow-md hover:shadow-orange-500/25 flex items-center gap-1.5 cursor-pointer">
            <span>Explore Hot Picks</span>
            <span>→</span>
          </button>
        </Link>
      </div>

      {/* Market Discovery: Top US, Top Europe & Top Romania */}
      <MarketOpportunities />

      {/* Market Intelligence: Analyst Consensus, When to Buy, Geopolitics & News */}
      <MarketIntelligence />
    </div>
  );
}
