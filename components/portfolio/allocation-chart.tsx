'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { PieChart as PieIcon, Layers, Building2, Globe } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { useAppStore } from '@/stores/app-store';
import { useTranslation } from '@/lib/i18n';

interface AllocationData {
  symbol: string;
  name: string;
  value: number;
  percent: number;
  color: string;
}

interface Props {
  data: AllocationData[];
  currency?: string;
}

export function AllocationChart({ data, currency = 'USD' }: Props) {
  const { locale, baseCurrency } = useAppStore();
  const t = useTranslation(locale);
  const [viewMode, setViewMode] = useState<'assets' | 'markets'>('assets');
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const totalPortfolioValue = useMemo(() => {
    return data.reduce((acc, curr) => acc + curr.value, 0);
  }, [data]);

  // Market classification: US, Europe, UK
  const marketData = useMemo(() => {
    let usTotal = 0;
    let euTotal = 0;
    let ukTotal = 0;

    data.forEach((item) => {
      const sym = item.symbol.toUpperCase();
      if (sym.endsWith('.DE') || sym.endsWith('.PA') || sym.endsWith('.AS') || sym.endsWith('.MI')) {
        euTotal += item.value;
      } else if (sym.endsWith('.L') || sym.endsWith('.CO')) {
        ukTotal += item.value;
      } else {
        usTotal += item.value;
      }
    });

    const list: AllocationData[] = [];
    if (usTotal > 0) {
      list.push({
        symbol: 'US & Global',
        name: 'US Tech & Global Markets',
        value: usTotal,
        percent: totalPortfolioValue > 0 ? (usTotal / totalPortfolioValue) * 100 : 0,
        color: '#3b82f6',
      });
    }
    if (euTotal > 0) {
      list.push({
        symbol: 'Western Europe',
        name: 'XETRA, Euronext & Continental EU',
        value: euTotal,
        percent: totalPortfolioValue > 0 ? (euTotal / totalPortfolioValue) * 100 : 0,
        color: '#8b5cf6',
      });
    }
    if (ukTotal > 0) {
      list.push({
        symbol: 'UK & Nordic',
        name: 'LSE & Nordic Exchanges',
        value: ukTotal,
        percent: totalPortfolioValue > 0 ? (ukTotal / totalPortfolioValue) * 100 : 0,
        color: '#10b981',
      });
    }

    return list.sort((a, b) => b.value - a.value);
  }, [data, totalPortfolioValue]);

  const activeDataset = viewMode === 'assets' ? data : marketData;

  if (data.length === 0) return null;

  return (
    <Card className="overflow-hidden w-full min-w-0 shadow-xs border-border/70">
      <CardHeader className="pb-2.5 flex flex-row items-center justify-between flex-wrap gap-2 border-b border-border/40 bg-muted/15">
        <div className="flex items-center gap-2">
          <PieIcon className="h-4 w-4 text-indigo-400" />
          <CardTitle className="text-sm sm:text-base font-semibold">{t('portfolio.allocation')}</CardTitle>
        </div>

        {/* View Toggle */}
        <div className="flex items-center bg-muted/70 p-0.5 rounded-lg border text-[11px]">
          <button
            onClick={() => setViewMode('assets')}
            className={`px-2 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${
              viewMode === 'assets'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Holdings
          </button>
          <button
            onClick={() => setViewMode('markets')}
            className={`px-2 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${
              viewMode === 'markets'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Markets
          </button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-3">
        {/* Donut Chart */}
        <div className="h-48 w-full relative flex items-center justify-center">
          {!mounted ? (
            <div className="h-36 w-36 rounded-full border-4 border-muted animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={190}>
              <PieChart>
                <Pie
                  data={activeDataset}
                  cx="50%"
                  cy="50%"
                  innerRadius={54}
                  outerRadius={80}
                  paddingAngle={2.5}
                  dataKey="value"
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  {activeDataset.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      stroke="transparent"
                      className="transition-all duration-200 cursor-pointer"
                      opacity={activeIndex === null || activeIndex === index ? 1 : 0.4}
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const item = payload[0].payload as AllocationData;
                    return (
                      <div className="rounded-lg border bg-popover text-popover-foreground px-3 py-2 shadow-lg text-xs z-50">
                        <p className="font-bold flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                          {item.symbol}
                        </p>
                        <p className="text-muted-foreground text-[11px] truncate max-w-[150px]">{item.name}</p>
                        <div className="mt-1 flex items-center justify-between gap-3 pt-1 border-t border-border/50">
                          <span className="font-semibold">{formatCurrency(item.value, baseCurrency)}</span>
                          <span className="text-emerald-400 font-bold">+{item.percent.toFixed(1)}%</span>
                        </div>
                      </div>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}

          {/* Center stats */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
            <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-semibold">TOTAL</span>
            <span className="text-xs sm:text-sm font-bold font-mono text-foreground">
              {formatCurrency(totalPortfolioValue, baseCurrency)}
            </span>
          </div>
        </div>

        {/* Clean, Ranked Allocation List */}
        <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
          {activeDataset.map((item, index) => {
            const isHovered = activeIndex === index;
            return (
              <div
                key={item.symbol}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
                className={`p-2 rounded-lg transition-colors text-xs flex flex-col gap-1 cursor-pointer ${
                  isHovered ? 'bg-muted/80' : 'hover:bg-muted/40'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-semibold text-foreground shrink-0">{item.symbol}</span>
                    <span className="text-muted-foreground truncate text-[11px]">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-muted-foreground text-[11px]">{formatCurrency(item.value, baseCurrency)}</span>
                    <span className="font-bold text-foreground text-right w-11">{item.percent.toFixed(1)}%</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-muted-foreground/15 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.max(item.percent, 1.5)}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
