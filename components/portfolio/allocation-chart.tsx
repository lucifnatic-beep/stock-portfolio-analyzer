'use client';

import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { PieChart as PieIcon } from 'lucide-react';
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

export function AllocationChart({ data, currency = 'RON' }: Props) {
  const { locale, baseCurrency } = useAppStore();
  const t = useTranslation(locale);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (data.length === 0) return null;

  const totalPortfolioValue = data.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <PieIcon className="h-4 w-4 text-indigo-500" />
          {t('portfolio.allocation')}
        </CardTitle>
        <span className="text-xs text-muted-foreground font-mono">
          {data.length} active
        </span>
      </CardHeader>
      <CardContent className="space-y-4 pt-1">
        {/* Donut Chart */}
        <div className="h-44 relative flex items-center justify-center">
          {!mounted ? (
            <div className="h-36 w-36 rounded-full border-4 border-muted animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={2}
                  dataKey="value"
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      stroke="transparent"
                      className="transition-all duration-200 cursor-pointer"
                      opacity={activeIndex === null || activeIndex === index ? 1 : 0.45}
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const item = payload[0].payload as AllocationData;
                    return (
                      <div className="rounded-lg border bg-popover text-popover-foreground px-3 py-2 shadow-lg text-xs">
                        <p className="font-bold flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                          {item.symbol}
                        </p>
                        <p className="text-muted-foreground text-[11px] truncate max-w-[150px]">{item.name}</p>
                        <div className="mt-1 flex items-center justify-between gap-3 pt-1 border-t border-border/50">
                          <span className="font-semibold">{formatCurrency(item.value, baseCurrency)}</span>
                          <span className="text-emerald-500 font-bold">{item.percent.toFixed(1)}%</span>
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
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Total</span>
            <span className="text-sm font-bold text-foreground">
              {formatCurrency(totalPortfolioValue, baseCurrency)}
            </span>
          </div>
        </div>

        {/* Clean, Ranked Allocation List */}
        <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
          {data.map((item, index) => {
            const isHovered = activeIndex === index;
            return (
              <div
                key={item.symbol}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
                className={`p-2 rounded-lg transition-colors text-xs flex flex-col gap-1 cursor-pointer ${
                  isHovered ? 'bg-muted' : 'hover:bg-muted/50'
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
                    <span className="font-mono text-muted-foreground">{formatCurrency(item.value, baseCurrency)}</span>
                    <span className="font-bold text-foreground text-right w-10">{item.percent.toFixed(1)}%</span>
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
