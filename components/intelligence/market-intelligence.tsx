'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Target, Compass, Newspaper, Sparkles, ExternalLink, ArrowUpRight, RefreshCw, Globe, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { useAppStore } from '@/stores/app-store';

type Region = 'all' | 'ro' | 'us' | 'eu';

interface AnalystInsight {
  symbol: string;
  name: string;
  currentPrice: number;
  targetPrice: number;
  upsidePercent: number;
  recommendation: string;
  analystCount: number;
  verdict: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL';
  source?: string;
  region?: 'ro' | 'us' | 'eu';
}

interface GeopoliticalInsight {
  topic: string;
  region: 'ro' | 'us' | 'eu' | 'global';
  regionLabel: string;
  impact: string;
  summary: string;
  action: string;
  badge: string;
  source?: string;
}

interface NewsItem {
  title: string;
  publisher: string;
  sourceUrl: string;
  publishedAt: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  category?: string;
  summary?: string;
  region?: 'ro' | 'us' | 'eu';
}

interface MarketData {
  analysts: AnalystInsight[];
  geopolitics: GeopoliticalInsight[];
  news: NewsItem[];
}

export function MarketIntelligence() {
  const { baseCurrency } = useAppStore();
  const [data, setData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeRegion, setActiveRegion] = useState<Region>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');

  const loadData = useCallback(async () => {
    try {
      setRefreshing(true);
      const res = await fetch('/api/market/insights');
      const json = await res.json();

      if (json.analysts) {
        json.analysts = json.analysts.map((a: AnalystInsight) => ({
          ...a,
          region: a.symbol.endsWith('.RO') ? 'ro' : (a.symbol.endsWith('.DE') || a.symbol.endsWith('.PA') ? 'eu' : 'us'),
        }));
      }

      if (json.news) {
        json.news = json.news.map((n: NewsItem) => {
          let reg: 'ro' | 'us' | 'eu' = 'us';
          const t = (n.title + ' ' + (n.publisher || '')).toLowerCase();
          if (t.includes('bvb') || t.includes('romania') || t.includes('petrom') || t.includes('transilvania') || t.includes('hidroelectrica') || t.includes('neptun') || t.includes('ziarul')) {
            reg = 'ro';
          } else if (t.includes('europa') || t.includes('european') || t.includes('germany') || t.includes('ecb') || t.includes('financial times') || t.includes('ft.com')) {
            reg = 'eu';
          }
          return { ...n, region: reg };
        });
      }

      setData(json);
    } catch (err) {
      console.error('Failed to load market insights:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 180000);
    return () => clearInterval(interval);
  }, [loadData]);

  if (loading && !data) {
    return (
      <div className="p-8 text-center text-muted-foreground animate-pulse text-xs">
        Loading multi-source intelligence from Reuters, Bloomberg, FT, and Wall Street analysts...
      </div>
    );
  }

  if (!data) return null;

  const filteredAnalysts = data.analysts.filter((a) => {
    if (activeRegion === 'all') return true;
    return a.region === activeRegion;
  });

  const filteredGeopolitics = data.geopolitics.filter((g) => {
    if (activeRegion === 'all') return true;
    return g.region === activeRegion || g.region === 'global';
  });

  const filteredNews = data.news.filter((n) => {
    const matchesRegion = activeRegion === 'all' || n.region === activeRegion;
    const matchesSource = selectedSource === 'all' || n.publisher.toLowerCase().includes(selectedSource.toLowerCase());
    return matchesRegion && matchesSource;
  });

  const sourcesList = ['all', 'Reuters', 'Bloomberg', 'Financial Times', 'CNBC', 'MarketWatch', 'Ziarul Financiar'];

  const regionTabs = [
    { id: 'all' as Region, label: 'Global (All)', icon: Globe },
    { id: 'us' as Region, label: '🇺🇸 US & Tech', icon: MapPin },
    { id: 'eu' as Region, label: '🇪🇺 Europe', icon: MapPin },
    { id: 'ro' as Region, label: '🇷🇴 BVB Romania', icon: MapPin },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3 border-b border-border/40 pb-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-400" />
            Market Intelligence & Multi-Source Analysis
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Analyst targets, macro policies, and financial news aggregated across Reuters, Bloomberg, FT, and BVB.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/50 text-xs">
            {regionTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveRegion(tab.id)}
                className={`px-2.5 sm:px-3 py-1 rounded-lg font-semibold transition-all ${
                  activeRegion === tab.id
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={refreshing}
            className="h-8 gap-1.5 text-xs"
            title="Refresh market data"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-indigo-400' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      <Card className="border-border/70 overflow-hidden shadow-xs">
        <CardHeader className="bg-muted/15 border-b border-border/40 pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-indigo-400" />
              <div>
                <CardTitle className="text-base font-semibold">
                  Analyst Consensus & 12-Month Price Targets
                </CardTitle>
                <CardDescription className="text-xs">
                  Aggregated ratings from Wall Street (FactSet/TipRanks) & BVB Research (Wood & Co, BT Capital, Erste)
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="text-[11px] font-mono border-indigo-500/30 text-indigo-400 bg-indigo-500/10">
              {filteredAnalysts.length} stocks covered
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid divide-y divide-border/40 sm:grid-cols-2 sm:divide-y-0 sm:divide-x lg:grid-cols-3">
            {filteredAnalysts.map((a) => (
              <div key={a.symbol} className="p-4 hover:bg-muted/30 transition-colors flex flex-col justify-between gap-3">
                <div>
                  <div className="flex items-center justify-between">
                    <Link href={`/stocks/${a.symbol}`} className="font-bold text-foreground hover:text-indigo-400 transition-colors flex items-center gap-1.5">
                      <span>{a.symbol}</span>
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                    </Link>
                    <Badge
                      variant={a.verdict === 'STRONG_BUY' ? 'success' : a.verdict === 'BUY' ? 'success' : 'secondary'}
                      className="text-[10px] uppercase font-bold"
                    >
                      {a.verdict.replace('_', ' ')}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{a.name}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-muted/40 p-2.5 rounded-lg border text-xs">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Current Price</span>
                    <span className="font-mono font-semibold text-foreground">
                      {formatCurrency(a.currentPrice, a.symbol.endsWith('.RO') ? 'RON' : a.symbol.endsWith('.DE') ? 'EUR' : 'USD')}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Target Price</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {formatCurrency(a.targetPrice, a.symbol.endsWith('.RO') ? 'RON' : a.symbol.endsWith('.DE') ? 'EUR' : 'USD')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-border/30">
                  <span className="text-[11px] text-muted-foreground truncate max-w-[170px]" title={a.source || a.recommendation}>
                    {a.source ? a.source.split('/')[0].trim() : `${a.analystCount} analysts`}
                  </span>
                  <span className="font-bold text-emerald-400 font-mono flex items-center gap-0.5">
                    <ArrowUpRight className="h-3.5 w-3.5" />
                    +{a.upsidePercent.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 2. Macro & Geopolitical Catalysts (Pillar 3) */}
      <Card className="border-border/70 overflow-hidden shadow-xs">
        <CardHeader className="bg-muted/15 border-b border-border/40 pb-3">
          <div className="flex items-center gap-2">
            <Compass className="h-5 w-5 text-amber-500" />
            <div>
              <CardTitle className="text-base font-semibold">
                Macroeconomic Trends & Geopolitical Catalysts
              </CardTitle>
              <CardDescription className="text-xs">
                Interest rate policies, energy transition, AI compute supercycle, and defense spending
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 grid gap-4 md:grid-cols-2">
          {filteredGeopolitics.map((g, idx) => (
            <div key={idx} className="p-4 rounded-xl border bg-card/50 flex flex-col justify-between gap-2.5">
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-muted border text-muted-foreground">
                    {g.badge}
                  </span>
                  {g.source && (
                    <span className="text-[10px] text-muted-foreground/70 truncate max-w-[160px]">
                      {g.source}
                    </span>
                  )}
                </div>
                <h4 className="font-bold text-sm text-foreground">{g.topic}</h4>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{g.summary}</p>
              </div>

              <div className="pt-2 border-t border-border/40 flex items-center justify-between text-xs">
                <span className="text-[11px] text-indigo-400 font-medium">{g.action}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 3. Multi-Source Financial News Wire */}
      <Card className="border-border/70 overflow-hidden shadow-xs">
        <CardHeader className="bg-muted/15 border-b border-border/40 pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Newspaper className="h-5 w-5 text-emerald-500" />
              <div>
                <CardTitle className="text-base font-semibold">
                  Multi-Source Financial News Wire
                </CardTitle>
                <CardDescription className="text-xs">
                  Real-time updates from Reuters, Bloomberg, Financial Times, CNBC, and Ziarul Financiar
                </CardDescription>
              </div>
            </div>

            {/* Source Filter Chips */}
            <div className="flex items-center gap-1 overflow-x-auto max-w-full py-1">
              {sourcesList.map((src) => (
                <button
                  key={src}
                  onClick={() => setSelectedSource(src)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-semibold whitespace-nowrap transition-colors ${
                    selectedSource === src
                      ? 'bg-emerald-500 text-white'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {src === 'all' ? 'All Sources' : src}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 divide-y divide-border/40">
          {filteredNews.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">
              No news items found for the selected source or region.
            </div>
          ) : (
            filteredNews.map((n, idx) => (
              <a
                key={idx}
                href={n.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="p-3.5 sm:p-4 hover:bg-muted/30 transition-colors flex items-start justify-between gap-3 block group"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-[10px] font-bold bg-muted border-border/60 text-foreground">
                      {n.publisher}
                    </Badge>
                    {n.category && (
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {n.category}
                      </span>
                    )}
                    <span className="text-[10px] text-muted-foreground/60">
                      {new Date(n.publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-semibold text-foreground group-hover:text-emerald-400 transition-colors">
                    {n.title}
                  </h4>
                  {n.summary && (
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {n.summary}
                    </p>
                  )}
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground opacity-40 group-hover:opacity-100 group-hover:text-emerald-400 shrink-0 mt-1 transition-all" />
              </a>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
