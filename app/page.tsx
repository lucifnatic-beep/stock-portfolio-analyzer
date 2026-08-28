'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { calculatePositionPL, calculatePortfolioSummary, calculateAllocation, DEFAULT_FX_RATES } from '@/lib/portfolio-utils';
import { PortfolioSummary } from '@/components/portfolio/portfolio-summary';
import { HoldingsTable } from '@/components/portfolio/holdings-table';
import { AddPositionDialog } from '@/components/portfolio/add-position-dialog';
import { T212ImportDialog } from '@/components/portfolio/t212-import-dialog';
import { BCRImportDialog } from '@/components/portfolio/bcr-import-dialog';
import { BrokerTabs } from '@/components/portfolio/broker-tabs';
import { AllocationChart } from '@/components/portfolio/allocation-chart';
import { WatchlistPanel } from '@/components/watchlist/watchlist-panel';
import { PriceAlertManager } from '@/components/alerts/price-alert-manager';
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
  const [positionsWithQuotes, setPositionsWithQuotes] = useState<PositionWithQuote[]>([]);
  const [fxRates, setFxRates] = useState<Record<string, number>>(DEFAULT_FX_RATES);
  const [loading, setLoading] = useState(false);

  // Auto seed and deduplicate (runs safely once per session)
  useEffect(() => {
    deduplicateAndSeedPortfolio();
  }, []);

  // Filter positions by activeBroker
  const filteredPositions = allDbPositions.filter((pos) => {
    if (activeBroker === 'all') return true;
    return pos.broker === activeBroker;
  });

  // Fetch FX rates
  useEffect(() => {
    async function fetchFX() {
      try {
        const res = await fetch('/api/fx');
        const data = await res.json();
        if (data && typeof data === 'object') {
          setFxRates(data);
        }
      } catch (err) {
        console.error('Failed to fetch FX rates:', err);
      }
    }
    fetchFX();
    const interval = setInterval(fetchFX, 120000);
    return () => clearInterval(interval);
  }, []);

  const fetchQuotes = useCallback(async () => {
    if (filteredPositions.length === 0) {
      setPositionsWithQuotes([]);
      return;
    }

    setLoading(true);
    try {
      const uniqueSymbols = [...new Set(filteredPositions.map((p) => p.symbol))];
      const res = await fetch(
        `/api/stock/quote?symbols=${encodeURIComponent(uniqueSymbols.join(','))}`
      );
      const quotes: StockQuote[] = await res.json();

      const quotesMap: Record<string, StockQuote> = {};
      if (Array.isArray(quotes)) {
        quotes.forEach((q) => { quotesMap[q.symbol] = q; });
      }

      const enriched = filteredPositions.map((pos) => {
        const quote = quotesMap[pos.symbol];
        if (!quote || !quote.regularMarketPrice) {
          // Fallback for private or unlisted assets
          return calculatePositionPL(
            pos,
            pos.buyPrice,
            0,
            0,
            pos.notes || pos.symbol,
            baseCurrency,
            fxRates
          );
        }
        return calculatePositionPL(
          pos,
          quote.regularMarketPrice,
          quote.regularMarketChange,
          quote.regularMarketChangePercent,
          quote.shortName,
          baseCurrency,
          fxRates
        );
      });

      setPositionsWithQuotes(enriched);
    } catch (err) {
      console.error('Failed to fetch quotes:', err);
    } finally {
      setLoading(false);
    }
  }, [filteredPositions, baseCurrency, fxRates]);

  useEffect(() => {
    fetchQuotes();
    const interval = setInterval(fetchQuotes, 60000);
    return () => clearInterval(interval);
  }, [fetchQuotes]);

  // Calculate Cash for the active view
  const brokersMap = new Map<string, Broker>();
  DEFAULT_BROKERS.forEach((b) => brokersMap.set(b.id, { ...b }));
  customBrokers.forEach((b) => brokersMap.set(b.id, { ...b }));
  const allBrokers = Array.from(brokersMap.values());

  let totalCash = 0;
  if (activeBroker === 'all') {
    totalCash = allBrokers.filter(b => b.id !== 'all').reduce((sum, b) => sum + (b.cash || 0), 0);
  } else {
    const b = allBrokers.find(b => b.id === activeBroker);
    totalCash = b?.cash || 0;
  }

  const instantPositions = filteredPositions.map((pos) => {
    return calculatePositionPL(
      pos,
      pos.buyPrice,
      0,
      0,
      pos.notes || pos.symbol,
      baseCurrency,
      fxRates
    );
  });

  const effectivePositions = positionsWithQuotes.length > 0 ? positionsWithQuotes : instantPositions;

  const rawSummary = calculatePortfolioSummary(effectivePositions);
  const summary = {
    ...rawSummary,
    cashBalance: totalCash,
    totalWithCash: rawSummary.totalValue + totalCash,
  };
  const allocation = calculateAllocation(effectivePositions);

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t('portfolio.title')}</h1>
          <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
            <span>{filteredPositions.length} active positions</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block" />
              Live synced
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <T212ImportDialog onImportSuccess={fetchQuotes} />
          <BCRImportDialog onImportSuccess={fetchQuotes} />
          <AddPositionDialog />
        </div>
      </div>

      {/* Broker Navigation Tabs & Cash Display */}
      <BrokerTabs />

      {/* Summary cards */}
      <PortfolioSummary summary={summary} currency={baseCurrency} />

      {/* Main content grid: Positions + Sidebar */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Holdings table - takes 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          <HoldingsTable positions={effectivePositions} />
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
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

      {/* Market Intelligence: Analyst Consensus, When to Buy, Geopolitics & News */}
      <MarketIntelligence />
    </div>
  );
}
