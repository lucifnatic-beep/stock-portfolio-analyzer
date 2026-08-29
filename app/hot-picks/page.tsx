'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Flame,
  TrendingUp,
  Sparkles,
  RefreshCw,
  ExternalLink,
  Star,
  Plus,
  ShieldAlert,
  Target,
  BarChart2,
  Landmark,
  Compass,
  Zap,
  Globe,
  Building2,
  CheckCircle2,
  ArrowUpRight,
  HelpCircle,
  Briefcase,
  Layers,
  ArrowRightLeft,
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { db } from '@/lib/db';
import { formatCurrency } from '@/lib/utils';
import { useAppStore } from '@/stores/app-store';
import type { HotPick } from '@/app/api/market/hot-picks/route';

type CategoryFilter = 'all' | 'new_only' | 'ai_tech' | 'space_future' | 'defense_europe' | 'value_dividend';
type BrokerFilter = 'all' | 't212' | 'ibkr' | 'revolut' | 'degiro';
type RegionFilter = 'all' | 'us' | 'eu';

export default function HotPicksPage() {
  const { baseCurrency } = useAppStore();
  const [picks, setPicks] = useState<HotPick[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');
  const [activeBroker, setActiveBroker] = useState<BrokerFilter>('all');
  const [activeRegion, setActiveRegion] = useState<RegionFilter>('all');
  const [sortBy, setSortBy] = useState<'score' | 'upside'>('score');
  const [addedSymbols, setAddedSymbols] = useState<Set<string>>(new Set());

  // Watchlist & User's existing positions
  const watchlist = useLiveQuery(() => db.watchlist.toArray()) || [];
  const watchlistSymbols = new Set(watchlist.map((w) => w.symbol));

  const userPositions = useLiveQuery(() => db.positions.toArray()) || [];
  const ownedSymbols = new Set(userPositions.map((p) => p.symbol.toUpperCase()));

  const loadHotPicks = useCallback(async () => {
    try {
      setRefreshing(true);
      const res = await fetch('/api/market/hot-picks');
      const data = await res.json();
      if (Array.isArray(data)) {
        setPicks(data);
      }
    } catch (err) {
      console.error('Failed to load hot picks:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadHotPicks();
    const interval = setInterval(loadHotPicks, 120000); // 2 min auto refresh
    return () => clearInterval(interval);
  }, [loadHotPicks]);

  const toggleWatchlist = async (symbol: string) => {
    const exists = watchlist.find((w) => w.symbol === symbol);
    if (exists && exists.id) {
      await db.watchlist.delete(exists.id);
    } else {
      await db.watchlist.add({ symbol, addedAt: new Date().toISOString() });
    }
  };

  const quickAddToPortfolio = async (pick: HotPick) => {
    const existing = await db.positions.where('symbol').equals(pick.symbol).first();
    if (existing) {
      alert(`${pick.symbol} is already in your portfolio.`);
      return;
    }

    const defaultShares = pick.currentPrice > 200 ? 2 : 10;
    const broker = 't212';

    await db.positions.add({
      symbol: pick.symbol,
      shares: defaultShares,
      buyPrice: pick.currentPrice,
      buyDate: new Date().toISOString().split('T')[0],
      currency: pick.currency,
      exchange: pick.region === 'eu' ? 'XETRA' : 'NASDAQ',
      broker,
      notes: `Added from Hot Picks Radar (${pick.categoryLabel})`,
      createdAt: new Date().toISOString(),
    });

    setAddedSymbols((prev) => new Set([...prev, pick.symbol]));
  };

  // Filtering & Sorting
  const filteredPicks = picks
    .filter((p) => {
      const isOwned = ownedSymbols.has(p.symbol.toUpperCase());
      if (activeCategory === 'new_only' && isOwned) return false;
      if (activeCategory !== 'all' && activeCategory !== 'new_only' && p.category !== activeCategory) return false;

      if (activeBroker !== 'all' && !p.recommendedBroker.toLowerCase().includes(activeBroker === 't212' ? 'trading 212' : activeBroker === 'ibkr' ? 'interactive' : activeBroker)) return false;

      if (activeRegion !== 'all' && p.region !== activeRegion) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'upside') return b.upsidePercent - a.upsidePercent;
      return b.score - a.score;
    });

  const categories: { id: CategoryFilter; label: string }[] = [
    { id: 'all', label: 'All Opportunities' },
    { id: 'new_only', label: '🔥 New Only (Not Owned)' },
    { id: 'ai_tech', label: '🚀 AI & Tech' },
    { id: 'space_future', label: '🌌 Space & Satellites' },
    { id: 'defense_europe', label: '🛡️ European Defense' },
    { id: 'value_dividend', label: '💎 Value & Dividends' },
  ];

  const brokerOptions: { id: BrokerFilter; label: string }[] = [
    { id: 'all', label: 'All Brokers' },
    { id: 't212', label: '📊 Trading 212' },
    { id: 'ibkr', label: '🏦 Interactive Brokers' },
    { id: 'revolut', label: '💳 Revolut' },
    { id: 'degiro', label: '📈 Degiro' },
  ];

  const topPick = picks[0];
  const newOpportunitiesCount = picks.filter((p) => !ownedSymbols.has(p.symbol.toUpperCase())).length;
  const avgUpside = picks.length > 0 ? picks.reduce((acc, p) => acc + p.upsidePercent, 0) / picks.length : 0;

  return (
    <div className="space-y-8 pb-16">
      {/* Page Hero Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500 border border-orange-500/20">
              <Flame className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                AI Radar: Hot Stocks to Buy
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gradient-to-r from-orange-500/20 to-amber-500/20 text-orange-400 border border-orange-500/30">
                  US & Europe Screener
                </span>
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Real-time multi-factor scan: Technical Analysis, Fundamentals, Analyst Targets, News & Macro
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Live Scan & Update
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadHotPicks}
            disabled={refreshing}
            className="h-8 gap-1.5 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-orange-400' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Strategic Broker Guide Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-sky-500/10 to-emerald-500/10 border border-indigo-500/20 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-indigo-400">
          <HelpCircle className="h-4 w-4" />
          <span>Broker Execution Guide: Where & how to buy at the best price?</span>
        </div>
        <div className="grid md:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-card/60 border border-border/50 space-y-1">
            <span className="font-bold text-foreground flex items-center gap-1.5">
              <span>🌐</span>
              <span>Trading 212</span>
            </span>
            <p className="text-muted-foreground leading-relaxed">
              Benefit from <strong className="text-emerald-400">0% trading commission</strong>, fractional shares, ultra-low FX (0.15%), and easy <strong className="text-foreground">Limit Orders</strong> from your phone for US & EU stocks.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-card/60 border border-border/50 space-y-1">
            <span className="font-bold text-foreground flex items-center gap-1.5">
              <span>🏦</span>
              <span>Interactive Brokers</span>
            </span>
            <p className="text-muted-foreground leading-relaxed">
              Professional-grade platform with access to <strong className="text-emerald-400">global markets</strong>, advanced order types, and competitive margin rates. Ideal for larger portfolios.
            </p>
          </div>
        </div>
      </div>

      {/* Top Stat Highlights */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/70 bg-card/60">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">New Opportunities (Not Owned)</p>
              <p className="text-lg font-bold text-orange-400 mt-1 flex items-center gap-1.5">
                <span>{newOpportunitiesCount} stocks</span>
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Ready to buy
              </p>
            </div>
            <Zap className="h-6 w-6 text-orange-400 opacity-80" />
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/60">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Average Upside Potential</p>
              <p className="text-lg font-bold text-emerald-400 mt-1">
                +{avgUpside.toFixed(1)}%
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Above current market price
              </p>
            </div>
            <TrendingUp className="h-6 w-6 text-emerald-400 opacity-80" />
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/60">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Top Opportunity #1</p>
              <p className="text-lg font-bold text-foreground mt-1">
                {topPick ? topPick.symbol : '---'}
              </p>
              <p className="text-[11px] text-orange-400 font-semibold mt-0.5">
                AI Score: {topPick ? topPick.score : 0}/100 🔥
              </p>
            </div>
            <Target className="h-6 w-6 text-indigo-400 opacity-80" />
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/60">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Total Universe Scanned</p>
              <p className="text-lg font-bold text-foreground mt-1">
                {picks.length} stocks
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                US & Europe
              </p>
            </div>
            <Globe className="h-6 w-6 text-sky-400 opacity-80" />
          </CardContent>
        </Card>
      </div>

      {/* Filter and Control Bar */}
      <div className="space-y-3 bg-muted/30 p-3.5 rounded-2xl border border-border/50">
        {/* Category & Ownership Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeCategory === c.id
                  ? 'bg-foreground text-background shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Broker Filter, Region & Sorting */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-border/30">
          {/* Broker Filter */}
          <div className="flex items-center gap-1 bg-background/80 p-1 rounded-xl border border-border/50 text-xs overflow-x-auto">
            {brokerOptions.map((b) => (
              <button
                key={b.id}
                onClick={() => setActiveBroker(b.id)}
                className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  activeBroker === b.id
                    ? 'bg-muted text-foreground font-bold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1 bg-background/80 p-1 rounded-xl border border-border/50 text-xs">
            <button
              onClick={() => setSortBy('score')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                sortBy === 'score' ? 'bg-muted text-foreground font-bold' : 'text-muted-foreground'
              }`}
            >
              🔥 Opportunity Score
            </button>
            <button
              onClick={() => setSortBy('upside')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                sortBy === 'upside' ? 'bg-muted text-foreground font-bold' : 'text-muted-foreground'
              }`}
            >
              📈 Upside (+%)
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid of Hot Picks */}
      {loading && picks.length === 0 ? (
        <div className="py-20 text-center space-y-3">
          <RefreshCw className="h-8 w-8 animate-spin text-orange-400 mx-auto" />
          <p className="text-sm text-muted-foreground">
            Running multi-factor scanner across all US & European stocks...
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredPicks.map((pick, index) => {
            const inWatchlist = watchlistSymbols.has(pick.symbol);
            const isOwned = ownedSymbols.has(pick.symbol.toUpperCase());
            const isAdded = addedSymbols.has(pick.symbol);

            return (
              <Card
                key={pick.symbol}
                className={`overflow-hidden border transition-all duration-200 shadow-sm flex flex-col justify-between group ${
                  isOwned
                    ? 'border-border/60 bg-card/40 opacity-95'
                    : 'border-orange-500/40 bg-card/80 hover:border-orange-500 hover:shadow-md'
                }`}
              >
                <div>
                  {/* Card Top Banner: Ownership & Broker */}
                  <div className="px-4 py-2 bg-muted/40 border-b border-border/40 flex items-center justify-between text-[11px] gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-foreground flex items-center gap-1">
                        <Building2 className="h-3 w-3 text-indigo-400" />
                        Broker: <span className="text-indigo-300 font-bold">{pick.recommendedBroker}</span>
                      </span>
                    </div>

                    {isOwned ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Already Owned
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[10px] font-bold flex items-center gap-1">
                        🔥 New Opportunity
                      </span>
                    )}
                  </div>

                  {/* Card Main Header */}
                  <div className="p-4 border-b border-border/30 bg-muted/10 flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="flex items-center justify-center h-5 w-5 rounded-full bg-orange-500/10 text-orange-400 font-mono text-[10px] font-bold border border-orange-500/20">
                          #{index + 1}
                        </span>
                        <Link
                          href={`/stocks/${pick.symbol}`}
                          className="text-base font-bold text-foreground hover:text-orange-400 transition-colors flex items-center gap-1"
                        >
                          <span>{pick.symbol}</span>
                          <ExternalLink className="h-3 w-3 opacity-60 group-hover:opacity-100" />
                        </Link>
                        <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0">
                          {pick.categoryLabel}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5 max-w-[220px]">{pick.name}</p>
                    </div>

                    {/* Opportunity Score */}
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-orange-500/15 text-orange-400 border border-orange-500/30 text-xs font-bold font-mono">
                        <Flame className="h-3.5 w-3.5 fill-current" />
                        <span>{pick.score}/100</span>
                      </div>
                      <span className="text-[9px] text-muted-foreground mt-0.5 uppercase tracking-wider font-semibold">
                        AI Score
                      </span>
                    </div>
                  </div>

                  {/* Price & Upside Row */}
                  <div className="p-4 border-b border-border/30 bg-muted/5 grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Current Price</span>
                      <span className="font-bold font-mono text-sm text-foreground">
                        {formatCurrency(pick.currentPrice, pick.currency)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Analyst Target</span>
                      <span className="font-bold font-mono text-sm text-indigo-400">
                        {formatCurrency(pick.targetPrice, pick.currency)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-muted-foreground block text-[10px]">Potential Profit</span>
                      <span className="font-bold font-mono text-sm text-emerald-400 flex items-center justify-end">
                        <ArrowUpRight className="h-3.5 w-3.5" />
                        +{pick.upsidePercent.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Execution Strategy Box (HOW to buy) */}
                  <div className="p-4 border-b border-border/30 bg-orange-500/5 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-orange-400 uppercase tracking-wide flex items-center gap-1">
                        <Zap className="h-3.5 w-3.5" />
                        {pick.orderTypeLabel}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-semibold">
                        Risk: <strong className="text-foreground">{pick.riskLevel}</strong>
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 bg-background/80 p-2.5 rounded-xl border border-orange-500/20 text-[11px]">
                      <div>
                        <span className="text-muted-foreground block text-[9px] uppercase">Recommended Limit</span>
                        <span className="font-bold text-foreground font-mono">{pick.limitPrice}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[9px] uppercase">Stop Loss</span>
                        <span className="font-bold text-rose-400 font-mono">{pick.stopLossPrice}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-muted-foreground block text-[9px] uppercase">Take Profit 1</span>
                        <span className="font-bold text-emerald-400 font-mono">{pick.takeProfit1}</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-muted-foreground leading-relaxed pt-1">
                      <strong className="text-foreground">How to place the order: </strong>
                      {pick.executionSteps}
                    </p>
                  </div>

                  {/* 4 Pillars of Analysis Breakdown */}
                  <div className="p-4 space-y-3 text-xs">
                    {/* Catalyst */}
                    <div className="p-2.5 rounded-xl bg-muted/40 border border-border/40 space-y-0.5">
                      <span className="text-[10px] font-bold text-foreground uppercase tracking-wide flex items-center gap-1">
                        <Sparkles className="h-3 w-3 text-amber-400" />
                        Catalyst & News
                      </span>
                      <p className="text-xs text-muted-foreground leading-relaxed">{pick.catalyst}</p>
                    </div>

                    {/* Technical & Fundamental signals */}
                    <div className="space-y-1.5 pt-1 text-[11px]">
                      <div className="flex items-start gap-2">
                        <BarChart2 className="h-3.5 w-3.5 text-blue-400 shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">
                          <strong className="text-foreground">Technical: </strong>
                          {pick.technicalSignal}
                        </span>
                      </div>

                      <div className="flex items-start gap-2">
                        <Landmark className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">
                          <strong className="text-foreground">Fundamental: </strong>
                          {pick.fundamentalSignal}
                        </span>
                      </div>

                      <div className="flex items-start gap-2">
                        <Compass className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">
                          <strong className="text-foreground">Policy & Macro: </strong>
                          {pick.macroPolicy}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="p-4 border-t border-border/40 bg-muted/15 flex items-center justify-between gap-2">
                  <Button
                    variant={inWatchlist ? 'secondary' : 'outline'}
                    size="sm"
                    className="h-8 gap-1 text-xs"
                    onClick={() => toggleWatchlist(pick.symbol)}
                  >
                    <Star className={`h-3.5 w-3.5 ${inWatchlist ? 'fill-amber-400 text-amber-400' : ''}`} />
                    <span>{inWatchlist ? 'Watching' : 'Watch'}</span>
                  </Button>

                  <Button
                    variant="default"
                    size="sm"
                    className={`h-8 gap-1 text-xs text-white ${
                      isOwned ? 'bg-zinc-700 hover:bg-zinc-600' : 'bg-orange-600 hover:bg-orange-500'
                    }`}
                    onClick={() => quickAddToPortfolio(pick)}
                    disabled={isAdded || isOwned}
                  >
                    {isOwned ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Already Owned</span>
                      </>
                    ) : isAdded ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                        <span>Added</span>
                      </>
                    ) : (
                      <>
                        <Plus className="h-3.5 w-3.5" />
                        <span>+ Buy ({pick.recommendedBroker.split('/')[0].trim()})</span>
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
