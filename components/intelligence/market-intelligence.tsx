'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Target, Compass, Newspaper, Sparkles, ExternalLink, ArrowUpRight, RefreshCw, Globe, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { useAppStore } from '@/stores/app-store';

type Region = 'all' | 'us' | 'eu';

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
  region?: 'us' | 'eu';
}

interface GeopoliticalInsight {
  topic: string;
  region: 'us' | 'eu' | 'global';
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
  region?: 'us' | 'eu';
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
  const [showAllAnalysts, setShowAllAnalysts] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setRefreshing(true);
      const res = await fetch('/api/market/insights');
      const json = await res.json();
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

  const filteredAnalysts = (data.analysts || []).filter((a) => {
    if (activeRegion === 'all') return true;
    return a.region === activeRegion;
  });

  const filteredGeopolitics = (data.geopolitics || []).filter((g) => {
    if (activeRegion === 'all') return true;
    return g.region === activeRegion || g.region === 'global';
  });

  const filteredNews = (data.news || []).filter((n) => {
    if (activeRegion === 'all') return true;
    return n.region === activeRegion;
  });

  const regionTabs = [
    { id: 'all' as Region, label: '🌎 All Markets', icon: Globe },
    { id: 'us' as Region, label: '🇺🇸 US & Tech', icon: MapPin },
    { id: 'eu' as Region, label: '🇪🇺 Europe', icon: MapPin },
  ];

  const displayedAnalysts = showAllAnalysts ? filteredAnalysts : filteredAnalysts.slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3 border-b border-border/40 pb-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-emerald-400" />
            Market Intelligence & Multi-Source Analysis
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Analyst price targets, macro trends, and financial news from Reuters, Bloomberg, and FT.
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
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-emerald-400' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Analyst Consensus Card */}
      <Card className="border-border/70 overflow-hidden shadow-xs">
        <CardHeader className="bg-muted/15 border-b border-border/40 pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-emerald-400" />
              <div>
                <CardTitle className="text-base font-semibold">
                  Analyst Consensus & 12-Month Price Targets
                </CardTitle>
                <CardDescription className="text-xs">
                  Aggregated ratings from Wall Street (TipRanks, FactSet) and European research desks
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="text-[11px] font-mono border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
              {filteredAnalysts.length} stocks covered
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid divide-y divide-border/40 sm:grid-cols-2 sm:divide-y-0 sm:divide-x lg:grid-cols-3">
            {displayedAnalysts.map((a) => (
              <div key={a.symbol} className="p-4 hover:bg-muted/30 transition-colors flex flex-col justify-between gap-3">
                <div>
                  <div className="flex items-center justify-between">
                    <Link href={`/stocks/${a.symbol}`} className="font-bold text-foreground hover:text-emerald-400 transition-colors flex items-center gap-1.5">
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
                      {formatCurrency(a.currentPrice, a.symbol.endsWith('.DE') ? 'EUR' : 'USD')}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Target Price</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {formatCurrency(a.targetPrice, a.symbol.endsWith('.DE') ? 'EUR' : 'USD')}
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

          {/* Expand/Collapse Toggle for Large Portfolios */}
          {filteredAnalysts.length > 6 && (
            <div className="p-3 border-t border-border/40 text-center bg-muted/10">
              <button
                onClick={() => setShowAllAnalysts(!showAllAnalysts)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
              >
                <span>{showAllAnalysts ? 'Show Less' : `See All ${filteredAnalysts.length} Covered Stocks`}</span>
                {showAllAnalysts ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Geopolitics & Macro */}
      <div className="grid gap-4 md:grid-cols-2">
        {filteredGeopolitics.map((g, idx) => (
          <Card key={idx} className="border-border/70 bg-card/60">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-foreground">{g.topic}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  {g.badge}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{g.summary}</p>
              <div className="pt-2 border-t border-border/30 text-[11px] text-muted-foreground">
                <strong className="text-foreground">Strategy: </strong>
                {g.action}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* News Wire */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold flex items-center gap-2">
          <Newspaper className="h-4 w-4 text-emerald-400" />
          Financial News Wire
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredNews.map((n, idx) => (
            <a
              key={idx}
              href={n.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3.5 rounded-xl bg-card border border-border/70 hover:border-emerald-500/40 hover:bg-muted/30 transition-all flex flex-col justify-between group"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span className="font-semibold text-emerald-400">{n.publisher}</span>
                  <span>{n.category || 'General'}</span>
                </div>
                <h4 className="text-xs font-bold text-foreground group-hover:text-emerald-400 transition-colors line-clamp-2">
                  {n.title}
                </h4>
                {n.summary && (
                  <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                    {n.summary}
                  </p>
                )}
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
