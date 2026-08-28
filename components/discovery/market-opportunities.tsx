'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Globe,
  Sparkles,
  ArrowUpRight,
  Star,
  ExternalLink,
  Target,
  BarChart3,
  TrendingUp,
  ShieldCheck,
  Building2,
  CheckCircle,
  Plus,
  Compass,
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { db } from '@/lib/db';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { useAppStore } from '@/stores/app-store';
import type { HotPick } from '@/app/api/market/hot-picks/route';

type RegionTab = 'all' | 'us' | 'eu';

export function MarketOpportunities() {
  const { baseCurrency } = useAppStore();
  const [picks, setPicks] = useState<HotPick[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeRegion, setActiveRegion] = useState<RegionTab>('all');
  const [filterNewOnly, setFilterNewOnly] = useState(false);

  // Watchlist & User owned stocks
  const watchlist = useLiveQuery(() => db.watchlist.toArray()) || [];
  const watchlistSymbols = useMemo(() => new Set(watchlist.map((w) => w.symbol.toUpperCase())), [watchlist]);

  const userPositions = useLiveQuery(() => db.positions.toArray()) || [];
  const ownedSymbols = useMemo(() => new Set(userPositions.map((p) => p.symbol.toUpperCase())), [userPositions]);

  useEffect(() => {
    async function loadOpportunities() {
      try {
        setLoading(true);
        const res = await fetch('/api/market/hot-picks');
        const data = await res.json();
        if (Array.isArray(data)) {
          setPicks(data);
        }
      } catch (err) {
        console.error('Failed to load market opportunities:', err);
      } finally {
        setLoading(false);
      }
    }
    loadOpportunities();
  }, []);

  const toggleWatchlist = async (symbol: string) => {
    const sym = symbol.toUpperCase();
    const existing = watchlist.find((w) => w.symbol.toUpperCase() === sym);
    if (existing && existing.id) {
      await db.watchlist.delete(existing.id);
    } else {
      await db.watchlist.add({ symbol: sym, addedAt: new Date().toISOString() });
    }
  };

  const filteredPicks = useMemo(() => {
    return picks.filter((item) => {
      if (activeRegion !== 'all' && item.region !== activeRegion) return false;
      if (filterNewOnly && ownedSymbols.has(item.symbol.toUpperCase())) return false;
      return true;
    });
  }, [picks, activeRegion, filterNewOnly, ownedSymbols]);

  const regionCounts = useMemo(() => {
    return {
      all: picks.length,
      us: picks.filter((p) => p.region === 'us').length,
      eu: picks.filter((p) => p.region === 'eu').length,
    };
  }, [picks]);

  return (
    <Card className="w-full min-w-0 border-border/80 shadow-xs overflow-hidden">
      <CardHeader className="p-4 sm:p-5 border-b border-border/40 bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Compass className="h-4 w-4" />
              </div>
              <CardTitle className="text-base sm:text-lg font-bold">
                Market Discovery: Top US & European Leaders
              </CardTitle>
              <Badge variant="secondary" className="text-[10px] bg-indigo-500/20 text-indigo-400 border-indigo-500/30 font-mono font-semibold">
                AI Scored
              </Badge>
            </div>
            <CardDescription className="text-xs text-muted-foreground">
              Discover top high-conviction US & Western/Central European opportunities with key figures, consensus price targets, and catalysts.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterNewOnly(!filterNewOnly)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer select-none ${
                filterNewOnly
                  ? 'bg-orange-500/20 text-orange-400 border-orange-500/40 shadow-xs'
                  : 'bg-muted/40 text-muted-foreground border-border/50 hover:text-foreground'
              }`}
            >
              🔥 {filterNewOnly ? 'New Only Active' : 'Filter: Not Owned'}
            </button>
            <Link href="/hot-picks">
              <Button size="sm" variant="outline" className="h-8 text-xs font-bold text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/10">
                Full Radar →
              </Button>
            </Link>
          </div>
        </div>

        {/* Region Filter Tabs */}
        <div className="flex items-center gap-1.5 pt-3 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveRegion('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeRegion === 'all'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            🌎 All Opportunities ({regionCounts.all})
          </button>
          <button
            onClick={() => setActiveRegion('us')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeRegion === 'us'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            🇺🇸 Top US & Mega Tech ({regionCounts.us})
          </button>
          <button
            onClick={() => setActiveRegion('eu')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeRegion === 'eu'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            🇪🇺 Top European Champions ({regionCounts.eu})
          </button>
        </div>
      </CardHeader>

      <CardContent className="p-3 sm:p-4">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-44 rounded-xl bg-muted/40 animate-pulse border border-border/30" />
            ))}
          </div>
        ) : filteredPicks.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground text-xs">
            No opportunities matching your filter.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredPicks.slice(0, 6).map((item) => {
              const isOwned = ownedSymbols.has(item.symbol.toUpperCase());
              const isWatching = watchlistSymbols.has(item.symbol.toUpperCase());

              return (
                <div
                  key={item.symbol}
                  className="p-3.5 rounded-xl bg-muted/20 hover:bg-muted/40 border border-border/50 transition-all flex flex-col justify-between gap-3 group"
                >
                  {/* Top Bar: Symbol, Name, Badges */}
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <Link
                            href={`/stocks/${item.symbol}`}
                            className="font-bold text-sm text-foreground hover:text-indigo-400 transition-colors flex items-center gap-1"
                          >
                            <span>{item.symbol}</span>
                            <ExternalLink className="h-3 w-3 text-muted-foreground opacity-50 group-hover:opacity-100" />
                          </Link>
                          {isOwned && (
                            <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                              Owned
                            </Badge>
                          )}
                        </div>
                        <span className="text-[11px] text-muted-foreground block truncate max-w-[170px]">
                          {item.name}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] font-mono uppercase text-muted-foreground block">AI Score</span>
                        <span className="font-bold text-xs px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-400 border border-indigo-500/25">
                          {item.score}/100
                        </span>
                      </div>
                    </div>

                    {/* Price & Upside Box */}
                    <div className="grid grid-cols-3 gap-1.5 p-2 rounded-lg bg-muted/50 border border-border/40 text-xs font-mono">
                      <div>
                        <span className="text-[9px] text-muted-foreground block uppercase">Price</span>
                        <span className="font-semibold text-foreground">
                          {formatCurrency(item.currentPrice, item.currency)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-muted-foreground block uppercase">12M Target</span>
                        <span className="text-muted-foreground">
                          {formatCurrency(item.targetPrice, item.currency)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-muted-foreground block uppercase">Upside</span>
                        <span className="text-emerald-400 font-bold flex items-center">
                          <ArrowUpRight className="h-3 w-3 inline" />
                          +{item.upsidePercent.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    {/* Catalyst */}
                    <p className="text-[11px] text-muted-foreground line-clamp-2 pt-0.5">
                      💡 {item.catalyst}
                    </p>
                  </div>

                  {/* Action Bar */}
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/30 text-[11px]">
                    <span className="text-[10px] text-muted-foreground truncate">
                      Via <strong className="text-foreground">{item.recommendedBroker}</strong>
                    </span>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleWatchlist(item.symbol)}
                        className={`h-7 px-2 text-[10px] font-semibold gap-1 ${
                          isWatching ? 'text-amber-400 bg-amber-500/10' : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <Star className={`h-3 w-3 ${isWatching ? 'fill-amber-400 text-amber-400' : ''}`} />
                        {isWatching ? 'Watching' : 'Watch'}
                      </Button>

                      <Link href={`/stocks/${item.symbol}`}>
                        <Button size="sm" variant="secondary" className="h-7 px-2.5 text-[10px] font-bold text-foreground">
                          Details →
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
