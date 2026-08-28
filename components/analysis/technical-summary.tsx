'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/stores/app-store';
import { useTranslation } from '@/lib/i18n';
import type { SignalSummary, SignalStrength } from '@/lib/indicators';

interface Props {
  signals: SignalSummary;
}

const signalConfig: Record<SignalStrength, { label: string; color: string; bg: string; icon: typeof TrendingUp }> = {
  strong_buy: { label: 'Strong Buy', color: 'text-emerald-400', bg: 'bg-emerald-500/20', icon: TrendingUp },
  buy: { label: 'Buy', color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: TrendingUp },
  neutral: { label: 'Neutral', color: 'text-yellow-500', bg: 'bg-yellow-500/10', icon: Minus },
  sell: { label: 'Sell', color: 'text-red-500', bg: 'bg-red-500/10', icon: TrendingDown },
  strong_sell: { label: 'Strong Sell', color: 'text-red-400', bg: 'bg-red-500/20', icon: TrendingDown },
};

export function TechnicalSummary({ signals }: Props) {
  const { locale } = useAppStore();
  const t = useTranslation(locale);
  const overall = signalConfig[signals.overall];
  const OverallIcon = overall.icon;

  const indicators = [
    { name: 'RSI (14)', signal: signals.rsi.signal, detail: `Value: ${signals.rsi.value.toFixed(1)}` },
    { name: 'MACD', signal: signals.macd.signal, detail: `Hist: ${signals.macd.histogram.toFixed(4)}` },
    { name: 'SMA (20)', signal: signals.sma20.signal, detail: `SMA: ${signals.sma20.sma.toFixed(2)}` },
    { name: 'SMA (50)', signal: signals.sma50.signal, detail: `SMA: ${signals.sma50.sma.toFixed(2)}` },
    { name: 'Bollinger', signal: signals.bollinger.signal, detail: signals.bollinger.position },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{t('analysis.technical')}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Overall signal */}
        <div className={`rounded-lg p-4 mb-4 ${overall.bg} flex items-center gap-3`}>
          <OverallIcon className={`h-8 w-8 ${overall.color}`} />
          <div>
            <p className="text-sm text-muted-foreground">{t('analysis.signal')}</p>
            <p className={`text-xl font-bold ${overall.color}`}>{overall.label}</p>
          </div>
        </div>

        {/* Individual indicators */}
        <div className="space-y-2">
          {indicators.map((ind) => {
            const config = signalConfig[ind.signal];
            return (
              <div key={ind.name} className="flex items-center justify-between py-1.5 border-b last:border-0">
                <span className="text-sm font-medium">{ind.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{ind.detail}</span>
                  <Badge variant="outline" className={`text-xs ${config.color}`}>
                    {config.label}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
