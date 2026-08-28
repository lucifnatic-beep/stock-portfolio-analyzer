'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Target, Compass, Newspaper, Sparkles, ExternalLink, ArrowUpRight, ShieldCheck, RefreshCw, Globe, MapPin } from 'lucide-react';
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
}

interface NewsItem {
  title: string;
  publisher: string;
  link: string;
  publishedAt: string;
  sentiment: 'positive' | 'neutral' | 'negative';
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

  const loadData = useCallback(async () => {
    try {
      setRefreshing(true);
      const res = await fetch('/api/market/insights');
      const json = await res.json();

      // Enrich with regions
      if (json.analysts) {
        json.analysts = json.analysts.map((a: AnalystInsight) => ({
          ...a,
          region: a.symbol.endsWith('.RO') ? 'ro' : (a.symbol.endsWith('.DE') ? 'eu' : 'us'),
        }));
      }

      if (json.geopolitics) {
        json.geopolitics = [
          {
            topic: 'Politica Monetară & Dobânzi (BNR & Guvern)',
            region: 'ro',
            regionLabel: '🇷🇴 România / BVB',
            impact: 'Pozitiv pentru Lichiditate',
            summary: 'Reducerea treptată a inflației și a ratei de dobândă BNR stimulează fluxul de capital către acțiunile listate la BVB și companiile bancare (TLV).',
            action: 'Oportunitate de acumulare pe corecții tehnice la bănci (TLV) și indici (ETF BET).',
            badge: '🟢 FAVORABIL BVB',
          },
          {
            topic: 'Sectorul Energetic & Resurse Strategice (Neptun Deep & H2O)',
            region: 'ro',
            regionLabel: '🇷🇴 România / BVB',
            impact: 'Dividende Mari & Independență Energetică',
            summary: 'Proiectul de gaze offshore Neptun Deep avansează pentru OMV Petrom (SNP), iar Hidroelectrica (H2O) continuă să fie lider regional pe energie verde cu randamente de dividend atractive.',
            action: 'Păstrare pe termen lung cu reinvestirea dividendelor.',
            badge: '🟢 DIVIDEND RIDICAT',
          },
          {
            topic: 'Cursa Globală AI & Infrastructură Tehnologică (Nvidia & TSMC)',
            region: 'us',
            regionLabel: '🇺🇸 SUA & Global Tech',
            impact: 'Monopol Tehnologic & Cerere Record',
            summary: 'Giganții Microsoft, Google, Amazon și Meta investesc sute de miliarde în centre de date. Nvidia și TSMC rămân pilonii centrali ai acestei revoluții.',
            action: 'Cumpără pe suporturile EMA 50 / RSI < 40.',
            badge: '🚀 CREȘTERE RAPIDĂ',
          },
          {
            topic: 'Rezerva Federală SUA (Fed) & Ciclul de Relaxare Monetară',
            region: 'us',
            regionLabel: '🇺🇸 SUA & Global Tech',
            impact: 'Evaluări Ridicate pe Acțiuni de Creștere',
            summary: 'Scăderea dobânzilor în SUA ieftinește creditarea și susține multiplii de evaluare pentru sectorul tech, gaming (Take-Two) și healthcare.',
            action: 'Menține expunerea pe liderii de piață din SUA.',
            badge: '🟢 FAVORABIL SUA',
          },
          {
            topic: 'Piața Europeană de Lux & Energie (Amundi Luxury & ConocoPhillips)',
            region: 'eu',
            regionLabel: '🇪🇺 Europa & Global',
            impact: 'Revenire a Consumului & Reziliență',
            summary: 'Sectorul european de lux beneficiază de revenirea cererii globale, iar companiile energetice globale oferă fluxuri masive de numerar și răscumpărări de acțiuni.',
            action: 'Diversificare echilibrată între EUR și USD.',
            badge: '💎 REZILIENȚĂ UE',
          },
        ];
      }

      if (json.news) {
        json.news = json.news.map((n: NewsItem) => {
          let reg: 'ro' | 'us' | 'eu' = 'us';
          const t = n.title.toLowerCase();
          if (t.includes('bvb') || t.includes('romania') || t.includes('petrom') || t.includes('transilvania') || t.includes('hidroelectrica') || t.includes('neptun')) {
            reg = 'ro';
          } else if (t.includes('europa') || t.includes('lux') || t.includes('germany') || t.includes('ecb') || t.includes('bce')) {
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
    const interval = setInterval(loadData, 180000); // 3 min auto refresh
    return () => clearInterval(interval);
  }, [loadData]);

  if (loading && !data) {
    return (
      <div className="p-8 text-center text-muted-foreground animate-pulse">
        Se încarcă analizele de la brokerii de top și factorii geopolitici...
      </div>
    );
  }

  if (!data) return null;

  // Filter by region
  const filteredAnalysts = data.analysts.filter((a) => {
    if (activeRegion === 'all') return true;
    return a.region === activeRegion;
  });

  const filteredGeopolitics = data.geopolitics.filter((g) => {
    if (activeRegion === 'all') return true;
    return g.region === activeRegion || g.region === 'global';
  });

  const filteredNews = data.news.filter((n) => {
    if (activeRegion === 'all') return true;
    return n.region === activeRegion;
  });

  const regionTabs = [
    { id: 'all' as Region, label: 'Toate Regiunile', icon: Globe },
    { id: 'ro' as Region, label: '🇷🇴 România (BVB)', icon: MapPin },
    { id: 'us' as Region, label: '🇺🇸 SUA & Tech', icon: MapPin },
    { id: 'eu' as Region, label: '🇪🇺 Europa & Global', icon: MapPin },
  ];

  return (
    <div className="space-y-6">
      {/* Header with Region Tabs & Manual Refresh */}
      <div className="flex items-center justify-between flex-wrap gap-3 border-b border-border/40 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-400" />
            Market Intelligence: Recomandări Brokeri, Politică & Știri
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Analiză automată a deciziilor de cumpărare / vânzare și impactul geopolitic regional
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Region Tabs */}
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/50 text-xs">
            {regionTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveRegion(tab.id)}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                  activeRegion === tab.id
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={refreshing}
            className="h-8 gap-1.5 text-xs"
            title="Actualizează datele acum"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-indigo-400' : ''}`} />
            <span>Actualizează</span>
          </Button>
        </div>
      </div>

      {/* 1. Top Analyst Price Targets & Buy Recommendations */}
      <Card className="border-border/70 overflow-hidden shadow-sm">
        <CardHeader className="bg-muted/15 border-b border-border/40 pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-indigo-400" />
              <div>
                <CardTitle className="text-base font-semibold">
                  Ce zic Brokerii de Top & Prețuri Țintă (Wall Street & BVB)
                </CardTitle>
                <CardDescription className="text-xs">
                  Consensul marilor case de analiză (Goldman Sachs, Morgan Stanley, BT Capital, Wood & Co)
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="text-xs font-mono bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
              {filteredAnalysts.length} active analizate
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid divide-y md:divide-y-0 md:grid-cols-2 lg:grid-cols-3 md:divide-x divide-border/40">
            {filteredAnalysts.map((item) => {
              const isStrongBuy = item.verdict === 'STRONG_BUY';
              const isBuy = item.verdict === 'BUY';

              return (
                <div key={item.symbol} className="p-4 hover:bg-muted/30 transition-colors flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <Link
                        href={`/stocks/${item.symbol}`}
                        className="font-bold text-sm text-foreground hover:text-indigo-400 flex items-center gap-1"
                      >
                        {item.symbol}
                        <ExternalLink className="h-3 w-3 text-muted-foreground" />
                      </Link>
                      <Badge
                        variant={isStrongBuy ? 'success' : isBuy ? 'info' : 'warning'}
                        className="text-[10px] font-bold px-2 py-0.5"
                      >
                        {isStrongBuy ? 'CUMPĂRĂ PUTERNIC' : isBuy ? 'CUMPĂRĂ' : 'MENȚINE'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{item.name}</p>
                  </div>

                  <div className="space-y-1.5 bg-card/60 p-2.5 rounded-lg border border-border/50">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Preț Țintă Mediu:</span>
                      <span className="font-bold font-mono text-foreground">
                        {formatCurrency(item.targetPrice, item.symbol.endsWith('.RO') ? 'RON' : 'USD')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Potențial Creștere (Upside):</span>
                      <span className="font-bold font-mono text-emerald-400 flex items-center">
                        <ArrowUpRight className="h-3.5 w-3.5 mr-0.5" />
                        +{item.upsidePercent.toFixed(1)}%
                      </span>
                    </div>
                    <div className="text-[10px] text-muted-foreground/80 flex items-center justify-between pt-1 border-t border-border/30">
                      <span>Opinie: {item.recommendation}</span>
                      <span>{item.analystCount} analiști</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 2. Geopolitical, Macro & Market Timing Intelligence by Region */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-border/70 shadow-sm">
          <CardHeader className="pb-3 border-b border-border/40 bg-muted/15">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Compass className="h-5 w-5 text-amber-400" />
              Analiză Politică & Factori Macroeconomici
            </CardTitle>
            <CardDescription className="text-xs">
              Impactul deciziilor guvernamentale, dobânzilor și reglementărilor
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {filteredGeopolitics.map((g, idx) => (
              <div key={idx} className="p-3.5 rounded-lg border border-border/50 bg-card/50 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold text-muted-foreground">{g.regionLabel}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground border">
                    {g.badge}
                  </span>
                </div>
                <h4 className="font-semibold text-xs text-foreground">{g.topic}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {g.summary}
                </p>
                <div className="pt-1.5 border-t border-border/30 flex items-start gap-1.5 text-xs text-indigo-300 font-medium">
                  <ShieldCheck className="h-3.5 w-3.5 text-indigo-400 shrink-0 mt-0.5" />
                  <span><strong>Strategie:</strong> {g.action}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* 3. Live News Feed with Sentiment */}
        <Card className="border-border/70 shadow-sm flex flex-col justify-between">
          <CardHeader className="pb-3 border-b border-border/40 bg-muted/15">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Newspaper className="h-5 w-5 text-sky-400" />
              Știri de Piață & Evenimente în Timp Real
            </CardTitle>
            <CardDescription className="text-xs">
              Cele mai recente știri financiare filtrate pe regiunea selectată
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-3 flex-1">
            {filteredNews.length === 0 ? (
              <p className="text-xs text-muted-foreground p-4 text-center">
                Nu există știri recente pentru regiunea selectată în acest moment.
              </p>
            ) : (
              filteredNews.map((item, idx) => (
                <a
                  key={idx}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-lg border border-border/40 bg-card/40 hover:bg-muted/40 transition-colors block group space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono text-muted-foreground">{item.publisher}</span>
                    <Badge
                      variant={item.sentiment === 'positive' ? 'success' : item.sentiment === 'negative' ? 'danger' : 'outline'}
                      className="text-[9px] px-1 py-0 h-3.5"
                    >
                      {item.sentiment === 'positive' ? 'POZITIV' : item.sentiment === 'negative' ? 'ATENȚIE' : 'NEUTRU'}
                    </Badge>
                  </div>
                  <h5 className="text-xs font-semibold text-foreground group-hover:text-sky-400 transition-colors leading-snug line-clamp-2">
                    {item.title}
                  </h5>
                </a>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
