'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, LineSeries, type IChartApi, type Time } from 'lightweight-charts';
import { useTheme } from 'next-themes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppStore } from '@/stores/app-store';
import { useTranslation } from '@/lib/i18n';
import type { OHLCV } from '@/types';

interface Props {
  stockData: OHLCV[];
  benchmarkData: OHLCV[];
  symbol: string;
  benchmarkSymbol?: string;
}

export function ComparisonChart({ stockData, benchmarkData, symbol, benchmarkSymbol = 'SPY' }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const { locale } = useAppStore();
  const t = useTranslation(locale);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = theme === 'dark';

  useEffect(() => {
    if (!containerRef.current || !stockData.length || !benchmarkData.length || !mounted) return;

    const container = containerRef.current;
    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: isDark ? '#1a1a2e' : '#ffffff' },
        textColor: isDark ? '#a0aec0' : '#4a5568',
      },
      grid: {
        vertLines: { color: isDark ? '#2d3748' : '#edf2f7' },
        horzLines: { color: isDark ? '#2d3748' : '#edf2f7' },
      },
      width: container.clientWidth,
      height: 250,
      rightPriceScale: {
        borderColor: isDark ? '#2d3748' : '#edf2f7',
      },
      timeScale: {
        borderColor: isDark ? '#2d3748' : '#edf2f7',
        timeVisible: false,
      },
    });

    // Normalize to percentage change
    const normalize = (data: OHLCV[]) => {
      if (!data.length) return [];
      const basePrice = data[0].close;
      return data.map((d) => ({
        time: d.time as Time,
        value: ((d.close - basePrice) / basePrice) * 100,
      }));
    };

    const stockSeries = chart.addSeries(LineSeries, {
      color: '#3b82f6',
      lineWidth: 2,
      priceLineVisible: false,
      title: symbol,
    });
    stockSeries.setData(normalize(stockData));

    const benchmarkSeries = chart.addSeries(LineSeries, {
      color: '#f59e0b',
      lineWidth: 2,
      lineStyle: 2,
      priceLineVisible: false,
      title: benchmarkSymbol,
    });
    benchmarkSeries.setData(normalize(benchmarkData));

    chart.timeScale().fitContent();

    const handleResize = () => chart.applyOptions({ width: container.clientWidth });
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [stockData, benchmarkData, mounted, isDark, symbol, benchmarkSymbol]);

  if (!mounted) return <div className="h-[250px] animate-pulse bg-muted rounded-lg" />;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{t('analysis.comparison')}</CardTitle>
        <div className="flex gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="h-2 w-4 rounded bg-blue-500" />
            <span>{symbol}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-4 rounded bg-amber-500" style={{ opacity: 0.7 }} />
            <span>{benchmarkSymbol} (S&P 500)</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-2">
        <div ref={containerRef} />
      </CardContent>
    </Card>
  );
}
