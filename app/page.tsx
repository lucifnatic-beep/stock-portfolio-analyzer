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
import { RobinhoodConnectorDialog } from '@/components/portfolio/robinhood-connector-dialog';
import { BrokerTabs } from '@/components/portfolio/broker-tabs';
import { AllocationChart } from '@/components/portfolio/allocation-chart';
import { WatchlistPanel } from '@/components/watchlist/watchlist-panel';
import { PriceAlertManager } from '@/components/alerts/price-alert-manager';
import { MarketOpportunities } from '@/components/discovery/market-opportunities';
import { MarketIntelligence } from '@/components/intelligence/market-intelligence';
import { AuthModal } from '@/components/auth/auth-modal';
import { useAppStore } from '@/stores/app-store';
import { useTranslation } from '@/lib/i18n';
import { deduplicateAndSeedPortfolio } from '@/lib/seed';
import { DEFAULT_BROKERS, type PositionWithQuote, type StockQuote, type Broker } from '@/types';
import { Compass, Plus, MoreHorizontal } from 'lucide-react';

export default function DashboardPage() {
  const { locale, baseCurrency, activeBroker } = useAppStore();
  const t = useTranslation(locale);
  const allDbPositions = useLiveQuery(() => db.positions.toArray()) || [];
  const customBrokers = useLiveQuery(() => db.brokers.toArray()) || [];
  const [quotesMap, setQuotesMap] = useState<Record<string, StockQuote>>({});
  const [fxRates, setFxRates] = useState<Record<string, number>>(DEFAULT_FX_RATES);
  const [loading, setLoading] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showImportTools, setShowImportTools] = useState(false);

  // Auto seed and clean legacy data
  useEffect(() => {
    deduplicateAndSeedPortfolio();
  }, []);

  // Auto-show auth on first launch if no positions
  useEffect(() => {
    const timer = setTimeout(() => {
      if (allDbPositions.length === 0) {
        const hasSeenAuth = sessionStorage.getItem('stockpulse_auth_seen');
        if (!hasSeenAuth) {
          setShowAuth(true);
          sessionStorage.setItem('stockpulse_auth_seen', '1');
        }
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [allDbPositions.length]);

  // Filter by broker
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
      const res = await fetch(`/api/stock/quote?symbols=${encodeURIComponent(uniqueSymbols.join(','))}`);
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

  const effectivePositions = useMemo(() => {
    return filteredPositions.map((pos) => {
      const quote = quotesMap[pos.symbol];
      const currentPrice = (quote && quote.regularMarketPrice) ? quote.regularMarketPrice : pos.buyPrice;
      const dayChange = (quote && quote.regularMarketChange != null) ? quote.regularMarketChange : 0;
      const dayChangePercent = (quote && quote.regularMarketChangePercent != null) ? quote.regularMarketChangePercent : 0;
      const shortName = quote?.shortName || pos.notes || pos.symbol;
      return calculatePositionPL(pos, currentPrice, dayChange, dayChangePercent, shortName, baseCurrency, fxRates);
    });
  }, [filteredPositions, quotesMap, baseCurrency, fxRates]);

  const totalCash = useMemo(() => {
    const brokersMap = new Map<string, Broker>();
    DEFAULT_BROKERS.forEach((b) => brokersMap.set(b.id, { ...b }));
    customBrokers.forEach((b) => brokersMap.set(b.id, { ...b }));
    const allBrokers = Array.from(brokersMap.values());

    if (activeBroker === 'all') {
      return allBrokers
        .filter((b) => b.id !== 'all')
        .reduce((sum, b) => {
          const defaultCurr = b.cashCurrency || 'USD';
          const rate = getFXRate(defaultCurr, baseCurrency, fxRates);
          return sum + (b.cash || 0) * rate;
        }, 0);
    } else {
      const b = allBrokers.find((b) => b.id === activeBroker);
      const defaultCurr = b?.cashCurrency || 'USD';
      const rate = getFXRate(defaultCurr, baseCurrency, fxRates);
      return (b?.cash || 0) * rate;
    }
  }, [customBrokers, activeBroker, baseCurrency, fxRates]);

  const rawSummary = useMemo(() => calculatePortfolioSummary(effectivePositions), [effectivePositions]);

  const summary = useMemo(() => ({
    ...rawSummary,
    cashBalance: totalCash,
    totalWithCash: rawSummary.totalValue + totalCash,
  }), [rawSummary, totalCash]);

  const allocation = useMemo(() => calculateAllocation(effectivePositions), [effectivePositions]);

  return (
    <>
      {/* Auth Modal — Full screen onboarding */}
      <AuthModal open={showAuth} onOpenChange={setShowAuth} />

      <div className="space-y-5 sm:space-y-6 pb-8 w-full max-w-full min-w-0">
        {/* Clean Header — Robinhood style */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{t('portfolio.title')}</h1>
            <p className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5">
              <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                Live
              </span>
              <span>·</span>
              <span>{filteredPositions.length} positions</span>
            </p>
          </div>

          {/* Action buttons — clean, minimal */}
          <div className="flex items-center gap-1.5">
            <AddPositionDialog />
            <button
              onClick={() => setShowImportTools(!showImportTools)}
              className="p-2 rounded-xl bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-all active:scale-95"
              title="Import tools"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Import tools — hidden by default (T212 pattern: progressive disclosure) */}
        {showImportTools && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/30 border border-border/50 animate-in fade-in-0 slide-in-from-top-2 flex-wrap">
            <RobinhoodConnectorDialog onImportSuccess={fetchQuotes} />
            <T212ImportDialog onImportSuccess={fetchQuotes} />
            <CSVImportDialog onImportSuccess={fetchQuotes} />
            <span className="text-[10px] text-muted-foreground ml-auto">Import from Robinhood, Trading 212 or broker CSV</span>
          </div>
        )}

        {/* Broker Tabs */}
        <div className="w-full min-w-0">
          <BrokerTabs />
        </div>

        {/* Big Portfolio Value — Robinhood hero */}
        <div className="w-full min-w-0">
          <PortfolioSummary summary={summary} currency={baseCurrency} />
        </div>

        {/* Main Grid */}
        <div className="grid gap-5 lg:grid-cols-3 w-full min-w-0">
          {/* Holdings */}
          <div className="lg:col-span-2 space-y-5 w-full min-w-0">
            <HoldingsTable positions={effectivePositions} />
          </div>

          {/* Sidebar widgets */}
          <div className="space-y-5 w-full min-w-0">
            <AllocationChart data={allocation} currency={baseCurrency} />
            <WatchlistPanel />
            <PriceAlertManager />
          </div>
        </div>

        {/* Discover Banner — Clean */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-indigo-500/8 to-purple-500/5 border border-emerald-500/20 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                Discover: AI Stock Scanner
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  NEW
                </span>
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Multi-factor analysis: technicals, fundamentals, analyst targets, and macro.
              </p>
            </div>
          </div>
          <Link href="/hot-picks">
            <button className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md hover:shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer active:scale-95">
              <span>Explore</span>
              <span>→</span>
            </button>
          </Link>
        </div>

        {/* Market Discovery */}
        <MarketOpportunities />

        {/* Market Intelligence */}
        <MarketIntelligence />
      </div>
    </>
  );
}
