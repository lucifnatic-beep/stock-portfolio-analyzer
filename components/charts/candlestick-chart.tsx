'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, CandlestickSeries, LineSeries, HistogramSeries, type IChartApi, type ISeriesApi, type CandlestickData, type Time } from 'lightweight-charts';
import { useTheme } from 'next-themes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppStore } from '@/stores/app-store';
import { useTranslation } from '@/lib/i18n';
import type { OHLCV, Timeframe, IndicatorType } from '@/types';
import {
  calculateSMA,
  calculateEMA,
  calculateBollingerBands,
  calculateRSI,
  calculateMACD,
} from '@/lib/indicators';

interface Props {
  data: OHLCV[];
  symbol: string;
}

const TIMEFRAMES: { value: Timeframe; label: string }[] = [
  { value: '1d', label: '1D' },
  { value: '5d', label: '5D' },
  { value: '1mo', label: '1M' },
  { value: '3mo', label: '3M' },
  { value: '6mo', label: '6M' },
  { value: '1y', label: '1Y' },
  { value: '2y', label: '2Y' },
  { value: '5y', label: '5Y' },
];

const INDICATORS: { value: IndicatorType; label: string; color: string }[] = [
  { value: 'sma20', label: 'SMA 20', color: '#f59e0b' },
  { value: 'sma50', label: 'SMA 50', color: '#3b82f6' },
  { value: 'ema12', label: 'EMA 12', color: '#8b5cf6' },
  { value: 'ema26', label: 'EMA 26', color: '#ec4899' },
  { value: 'bollinger', label: 'Bollinger', color: '#06b6d4' },
  { value: 'volume', label: 'Volume', color: '#6b7280' },
  { value: 'rsi', label: 'RSI', color: '#f97316' },
  { value: 'macd', label: 'MACD', color: '#10b981' },
];

export function CandlestickChart({ data, symbol }: Props) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const rsiContainerRef = useRef<HTMLDivElement>(null);
  const macdContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const rsiChartRef = useRef<IChartApi | null>(null);
  const macdChartRef = useRef<IChartApi | null>(null);
  const { theme } = useTheme();
  const { timeframe, setTimeframe, activeIndicators, toggleIndicator, locale } = useAppStore();
  const t = useTranslation(locale);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = theme === 'dark';

  const chartColors = {
    background: isDark ? '#1a1a2e' : '#ffffff',
    textColor: isDark ? '#a0aec0' : '#4a5568',
    gridColor: isDark ? '#2d3748' : '#edf2f7',
    upColor: '#10b981',
    downColor: '#ef4444',
    borderUpColor: '#10b981',
    borderDownColor: '#ef4444',
    wickUpColor: '#10b981',
    wickDownColor: '#ef4444',
  };

  // Main chart
  useEffect(() => {
    if (!chartContainerRef.current || !data.length || !mounted) return;

    const container = chartContainerRef.current;
    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: chartColors.background },
        textColor: chartColors.textColor,
      },
      grid: {
        vertLines: { color: chartColors.gridColor },
        horzLines: { color: chartColors.gridColor },
      },
      width: container.clientWidth,
      height: 400,
      crosshair: { mode: 0 },
      rightPriceScale: { borderColor: chartColors.gridColor },
      timeScale: {
        borderColor: chartColors.gridColor,
        timeVisible: false,
      },
    });

    chartRef.current = chart;

    // Candlestick series
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: chartColors.upColor,
      downColor: chartColors.downColor,
      borderUpColor: chartColors.borderUpColor,
      borderDownColor: chartColors.borderDownColor,
      wickUpColor: chartColors.wickUpColor,
      wickDownColor: chartColors.wickDownColor,
    });

    const chartData: CandlestickData<Time>[] = data.map((d) => ({
      time: d.time as Time,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));
    candleSeries.setData(chartData);

    // Volume
    if (activeIndicators.has('volume')) {
      const volumeSeries = chart.addSeries(HistogramSeries, {
        priceFormat: { type: 'volume' },
        priceScaleId: 'volume',
      });
      chart.priceScale('volume').applyOptions({
        scaleMargins: { top: 0.8, bottom: 0 },
      });
      volumeSeries.setData(
        data.map((d) => ({
          time: d.time as Time,
          value: d.volume,
          color: d.close >= d.open ? '#10b98140' : '#ef444440',
        }))
      );
    }

    // SMA 20
    if (activeIndicators.has('sma20')) {
      const smaData = calculateSMA(data, 20);
      const smaSeries = chart.addSeries(LineSeries, {
        color: '#f59e0b',
        lineWidth: 1,
        priceLineVisible: false,
      });
      smaSeries.setData(smaData.map((d) => ({ time: d.time as Time, value: d.value })));
    }

    // SMA 50
    if (activeIndicators.has('sma50')) {
      const smaData = calculateSMA(data, 50);
      const smaSeries = chart.addSeries(LineSeries, {
        color: '#3b82f6',
        lineWidth: 1,
        priceLineVisible: false,
      });
      smaSeries.setData(smaData.map((d) => ({ time: d.time as Time, value: d.value })));
    }

    // EMA 12
    if (activeIndicators.has('ema12')) {
      const emaData = calculateEMA(data, 12);
      const emaSeries = chart.addSeries(LineSeries, {
        color: '#8b5cf6',
        lineWidth: 1,
        priceLineVisible: false,
      });
      emaSeries.setData(emaData.map((d) => ({ time: d.time as Time, value: d.value })));
    }

    // EMA 26
    if (activeIndicators.has('ema26')) {
      const emaData = calculateEMA(data, 26);
      const emaSeries = chart.addSeries(LineSeries, {
        color: '#ec4899',
        lineWidth: 1,
        priceLineVisible: false,
      });
      emaSeries.setData(emaData.map((d) => ({ time: d.time as Time, value: d.value })));
    }

    // Bollinger Bands
    if (activeIndicators.has('bollinger')) {
      const bbData = calculateBollingerBands(data);
      const upperSeries = chart.addSeries(LineSeries, {
        color: '#06b6d4',
        lineWidth: 1,
        lineStyle: 2,
        priceLineVisible: false,
      });
      const middleSeries = chart.addSeries(LineSeries, {
        color: '#06b6d480',
        lineWidth: 1,
        priceLineVisible: false,
      });
      const lowerSeries = chart.addSeries(LineSeries, {
        color: '#06b6d4',
        lineWidth: 1,
        lineStyle: 2,
        priceLineVisible: false,
      });
      upperSeries.setData(bbData.map((d) => ({ time: d.time as Time, value: d.upper })));
      middleSeries.setData(bbData.map((d) => ({ time: d.time as Time, value: d.middle })));
      lowerSeries.setData(bbData.map((d) => ({ time: d.time as Time, value: d.lower })));
    }

    chart.timeScale().fitContent();

    const handleResize = () => {
      chart.applyOptions({ width: container.clientWidth });
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
    };
  }, [data, mounted, isDark, activeIndicators]);

  // RSI chart
  useEffect(() => {
    if (!rsiContainerRef.current || !data.length || !mounted || !activeIndicators.has('rsi')) {
      if (rsiChartRef.current) {
        rsiChartRef.current.remove();
        rsiChartRef.current = null;
      }
      return;
    }

    const container = rsiContainerRef.current;
    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: chartColors.background },
        textColor: chartColors.textColor,
      },
      grid: {
        vertLines: { color: chartColors.gridColor },
        horzLines: { color: chartColors.gridColor },
      },
      width: container.clientWidth,
      height: 150,
      rightPriceScale: { borderColor: chartColors.gridColor },
      timeScale: { borderColor: chartColors.gridColor, timeVisible: false },
    });

    rsiChartRef.current = chart;

    const rsiData = calculateRSI(data);
    const rsiSeries = chart.addSeries(LineSeries, {
      color: '#f97316',
      lineWidth: 2,
      priceLineVisible: false,
    });
    rsiSeries.setData(rsiData.map((d) => ({ time: d.time as Time, value: d.value })));

    // Overbought/Oversold lines
    const ob = chart.addSeries(LineSeries, { color: '#ef444460', lineWidth: 1, lineStyle: 2, priceLineVisible: false });
    const os = chart.addSeries(LineSeries, { color: '#10b98160', lineWidth: 1, lineStyle: 2, priceLineVisible: false });
    const obData = rsiData.map((d) => ({ time: d.time as Time, value: 70 }));
    const osData = rsiData.map((d) => ({ time: d.time as Time, value: 30 }));
    ob.setData(obData);
    os.setData(osData);

    chart.timeScale().fitContent();

    const handleResize = () => chart.applyOptions({ width: container.clientWidth });
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      rsiChartRef.current = null;
    };
  }, [data, mounted, isDark, activeIndicators]);

  // MACD chart
  useEffect(() => {
    if (!macdContainerRef.current || !data.length || !mounted || !activeIndicators.has('macd')) {
      if (macdChartRef.current) {
        macdChartRef.current.remove();
        macdChartRef.current = null;
      }
      return;
    }

    const container = macdContainerRef.current;
    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: chartColors.background },
        textColor: chartColors.textColor,
      },
      grid: {
        vertLines: { color: chartColors.gridColor },
        horzLines: { color: chartColors.gridColor },
      },
      width: container.clientWidth,
      height: 150,
      rightPriceScale: { borderColor: chartColors.gridColor },
      timeScale: { borderColor: chartColors.gridColor, timeVisible: false },
    });

    macdChartRef.current = chart;

    const macdData = calculateMACD(data);

    const macdLine = chart.addSeries(LineSeries, {
      color: '#10b981',
      lineWidth: 2,
      priceLineVisible: false,
    });
    macdLine.setData(macdData.map((d) => ({ time: d.time as Time, value: d.macd })));

    const signalLine = chart.addSeries(LineSeries, {
      color: '#ef4444',
      lineWidth: 1,
      priceLineVisible: false,
    });
    signalLine.setData(macdData.map((d) => ({ time: d.time as Time, value: d.signal })));

    const histogramSeries = chart.addSeries(HistogramSeries, {
      priceLineVisible: false,
    });
    histogramSeries.setData(
      macdData.map((d) => ({
        time: d.time as Time,
        value: d.histogram,
        color: d.histogram >= 0 ? '#10b98180' : '#ef444480',
      }))
    );

    chart.timeScale().fitContent();

    const handleResize = () => chart.applyOptions({ width: container.clientWidth });
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      macdChartRef.current = null;
    };
  }, [data, mounted, isDark, activeIndicators]);

  if (!mounted) return <div className="h-[400px] animate-pulse bg-muted rounded-lg" />;

  return (
    <div className="space-y-2">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-lg">{symbol}</CardTitle>
            {/* Timeframe selector */}
            <div className="flex gap-1">
              {TIMEFRAMES.map((tf) => (
                <Button
                  key={tf.value}
                  variant={timeframe === tf.value ? 'default' : 'ghost'}
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => setTimeframe(tf.value)}
                >
                  {tf.label}
                </Button>
              ))}
            </div>
          </div>
          {/* Indicator toggles */}
          <div className="flex flex-wrap gap-1 mt-2">
            {INDICATORS.map((ind) => (
              <Badge
                key={ind.value}
                variant={activeIndicators.has(ind.value) ? 'default' : 'outline'}
                className="cursor-pointer text-xs"
                style={activeIndicators.has(ind.value) ? { backgroundColor: ind.color } : {}}
                onClick={() => toggleIndicator(ind.value)}
              >
                {ind.label}
              </Badge>
            ))}
          </div>
        </CardHeader>
        <CardContent className="p-2">
          <div ref={chartContainerRef} />
        </CardContent>
      </Card>

      {/* RSI Sub-panel */}
      {activeIndicators.has('rsi') && (
        <Card>
          <CardHeader className="py-2 px-4">
            <CardTitle className="text-sm text-muted-foreground">RSI (14)</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <div ref={rsiContainerRef} />
          </CardContent>
        </Card>
      )}

      {/* MACD Sub-panel */}
      {activeIndicators.has('macd') && (
        <Card>
          <CardHeader className="py-2 px-4">
            <CardTitle className="text-sm text-muted-foreground">MACD (12, 26, 9)</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <div ref={macdContainerRef} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
