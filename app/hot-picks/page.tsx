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
  Search,
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { db } from '@/lib/db';
import { formatCurrency } from '@/lib/utils';
import { useAppStore } from '@/stores/app-store';
import type { HotPick } from '@/app/api/market/hot-picks/route';
import type { SearchResult } from '@/types';

type CategoryFilter = 'all' | 'new_only' | 'ai_tech' | 'etf_index' | 'european_champions' | 'defense_europe' | 'value_dividend';
type BrokerFilter = 'all' | 't212' | 'ibkr' | 'robinhood' | 'revolut' | 'degiro';
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

  // Interactive Live Search & Screener
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

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
    const interval = setInterval(loadHotPicks, 120000);
    return () => clearInterval(interval);
  }, [loadHotPicks]);

  // Live stock screener search
  const handleSearch = useCallback(async (q: string) => {
    if (q.length < 1) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await fetch(`/api/stock/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setSearchResults(Array.isArray(data) ? data : []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => handleSearch(searchQuery), 250);
    return () => clearTimeout(timer);
  }, [searchQuery, handleSearch]);

  const toggleWatchlist = async (symbol: string) => {
    const item = watchlist.find((w) => w.symbol === symbol);
    if (item?.id) {
      await db.watchlist.delete(item.id);
    } else {
      await db.watchlist.add({ symbol, addedAt: new Date().toISOString() });
    }
  };

  const quickAddToPortfolio = async (pick: HotPick | { symbol: string; currentPrice: number; region?: string; currency?: string; name?: string }) => {
    if (ownedSymbols.has(pick.symbol)) {
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
      currency: pick.currency || 'USD',
      exchange: pick.region === 'eu' ? 'XETRA' : 'NASDAQ',
      broker,
      notes: `Added from Discover Radar`,
      createdAt: new Date().toISOString(),
    });

    setAddedSymbols((prev) => new Set([...prev, pick.symbol]));
  };

  // Filter and sort picks
  const filteredPicks = picks
    .filter((p) => {
      if (activeCategory === 'new_only') return !ownedSymbols.has(p.symbol);
      if (activeCategory !== 'all' && p.category !== activeCategory) return false;
      if (activeRegion !== 'all' && p.region !== activeRegion) return false;
      if (activeBroker !== 'all') {
        const targetBroker = activeBroker === 't212' ? 'trading 212' : activeBroker === 'ibkr' ? 'interactive' : activeBroker;
        if (!p.recommendedBroker.toLowerCase().includes(targetBroker)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'score') return b.score - a.score;
      return b.upsidePercent - a.upsidePercent;
    });

  const categories: { id: CategoryFilter; label: string }[] = [
    { id: 'all', label: 'All Opportunities' },
    { id: 'new_only', label: '🔥 New Only (Not Owned)' },
    { id: 'ai_tech', label: '🚀 AI & Mega Tech' },
    { id: 'etf_index', label: '🏛️ Top ETFs & Index Funds' },
    { id: 'european_champions', label: '💎 European Champions' },
    { id: 'defense_europe', label: '🛡️ Defense & Energy' },
    { id: 'value_dividend', label: '💰 Value & Dividends' },
  ];

  const brokerOptions: { id: BrokerFilter; label: string }[] = [
    { id: 'all', label: 'All Brokers' },
    { id: 't212', label: '📊 Trading 212' },
    { id: 'ibkr', label: '🏦 Interactive Brokers' },
    { id: 'robinhood', label: '⚡ Robinhood' },
    { id: 'revolut', label: '💳 Revolut' },
    { id: 'degiro', label: '📈 Degiro' },
  ];

  const newOpportunitiesCount = picks.filter((p) => !ownedSymbols.has(p.symbol)).length;
  const avgUpside = picks.length > 0 ? (picks.reduce((s, p) => s + p.upsidePercent, 0) / picks.length).toFixed(1) : '0';

  return (
    <div className="space-y-6 pb-24 max-w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/40 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Discover: AI Stock & ETF Radar
            </h1>
            <Badge variant="outline" className="text-[10px] font-bold text-amber-400 border-amber-500/30 bg-amber-500/10">
              US & Europe Screener
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time multi-factor scan: Technical Momentum, Financial Ratios, Analyst Targets, News & Macro Trends.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadHotPicks}
            disabled={refreshing}
            className="text-xs font-semibold gap-1.5 rounded-xl border-border/70 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-emerald-400' : ''}`} />
            <span>{refreshing ? 'Scanning...' : 'Refresh Radar'}</span>
          </Button>
        </div>
      </div>

      {/* Interactive Stock & ETF Screener Search */}
      <div className="p-4 rounded-3xl bg-card border border-border/80 shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-foreground">Live Global Stock & ETF Screener</h3>
          </div>
          <span className="text-[10px] text-muted-foreground font-mono">NASDAQ · NYSE · XETRA · LSE</span>
        </div>

        <div className="relative">
          <Input
            placeholder="Search ANY stock or ETF to analyze (e.g. AAPL, NVDA, SPY, VWCE.DE, ASML, PG)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 text-xs font-mono rounded-2xl pl-10 pr-4"
          />
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>

        {/* Live Search Screener Results */}
        {searchResults.length > 0 && (
          <div className="grid gap-2 sm:grid-cols-2 pt-2 border-t border-border/40 max-h-60 overflow-y-auto pr-1">
            {searchResults.map((r) => (
              <div
                key={r.symbol}
                className="flex items-center justify-between p-2.5 rounded-2xl bg-muted/40 hover:bg-muted/70 transition-colors border border-border/40"
              >
                <Link href={`/stocks/${r.symbol}`} className="flex-1 min-w-0 pr-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs font-mono text-emerald-400">{r.symbol}</span>
                    <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-muted text-muted-foreground">
                      {'exchangeDisplay' in r ? (r as any).exchangeDisplay : r.exchange}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">{r.shortName}</p>
                </Link>

                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-[11px] rounded-lg"
                    onClick={() => toggleWatchlist(r.symbol)}
                  >
                    <Star className={`h-3 w-3 ${watchlistSymbols.has(r.symbol) ? 'text-amber-400 fill-current' : ''}`} />
                  </Button>
                  <Link href={`/stocks/${r.symbol}`}>
                    <Button size="sm" className="h-7 px-2.5 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg">
                      Analyze →
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-card border border-border/70 shadow-xs">
          <p className="text-[11px] font-semibold text-muted-foreground">New Opportunities</p>
          <p className="text-xl font-bold text-foreground font-mono mt-0.5">{newOpportunitiesCount} stocks</p>
          <span className="text-[10px] text-emerald-400 font-medium">Ready to buy</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-card border border-border/70 shadow-xs">
          <p className="text-[11px] font-semibold text-muted-foreground">Avg Analyst Upside</p>
          <p className="text-xl font-bold text-emerald-400 font-mono mt-0.5">+{avgUpside}%</p>
          <span className="text-[10px] text-muted-foreground">Above current market</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-card border border-border/70 shadow-xs">
          <p className="text-[11px] font-semibold text-muted-foreground">Top AI Opportunity</p>
          <p className="text-xl font-bold text-foreground font-mono mt-0.5">{picks[0]?.symbol || 'NVDA'}</p>
          <span className="text-[10px] text-indigo-400 font-medium">Score {picks[0]?.score || 95}/100</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-card border border-border/70 shadow-xs">
          <p className="text-[11px] font-semibold text-muted-foreground">Scanned Universe</p>
          <p className="text-xl font-bold text-foreground font-mono mt-0.5">{picks.length} Curated</p>
          <span className="text-[10px] text-muted-foreground">US & European Leaders</span>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveCategory(c.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer active:scale-95 ${
              activeCategory === c.id
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {filteredPicks.map((pick) => {
          const isOwned = ownedSymbols.has(pick.symbol.toUpperCase());
          const inWatchlist = watchlistSymbols.has(pick.symbol);
          const justAdded = addedSymbols.has(pick.symbol);

          return (
            <div
              key={pick.symbol}
              className="p-5 rounded-3xl bg-card border border-border/80 shadow-md space-y-4 hover:border-emerald-500/40 transition-all"
            >
              {/* Card Top */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <Link href={`/stocks/${pick.symbol}`} className="hover:underline">
                      <span className="text-base font-extrabold text-foreground font-mono">{pick.symbol}</span>
                    </Link>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      Score {pick.score}
                    </span>
                    {isOwned && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400">
                        Owned
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{pick.name}</p>
                </div>

                <div className="text-right">
                  <p className="text-sm font-extrabold text-foreground font-mono">
                    {formatCurrency(pick.currentPrice, pick.currency)}
                  </p>
                  <p className="text-[11px] font-bold text-emerald-400 font-mono">
                    +{pick.upsidePercent.toFixed(1)}% Target
                  </p>
                </div>
              </div>

              {/* Catalyst snippet */}
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {pick.catalyst}
              </p>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-border/40">
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs font-semibold gap-1 rounded-xl"
                    onClick={() => toggleWatchlist(pick.symbol)}
                  >
                    <Star className={`h-3.5 w-3.5 ${inWatchlist ? 'text-amber-400 fill-current' : ''}`} />
                    <span>{inWatchlist ? 'Watching' : 'Watch'}</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs font-semibold rounded-xl"
                    onClick={() => quickAddToPortfolio(pick)}
                    disabled={isOwned || justAdded}
                  >
                    {isOwned || justAdded ? 'In Portfolio' : '+ Add Position'}
                  </Button>
                </div>

                <Link href={`/stocks/${pick.symbol}`}>
                  <Button size="sm" className="h-8 px-3 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-xs">
                    Analysis →
                  </Button>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
