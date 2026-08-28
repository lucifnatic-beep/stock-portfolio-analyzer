'use client';

import React from 'react';
import Link from 'next/link';
import { Trash2, ExternalLink, ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatPercent, getChangeColor, formatNumber } from '@/lib/utils';
import { db } from '@/lib/db';
import { useAppStore } from '@/stores/app-store';
import { useTranslation } from '@/lib/i18n';
import { DEFAULT_BROKERS, type PositionWithQuote } from '@/types';

interface Props {
  positions: PositionWithQuote[];
}

export function HoldingsTable({ positions }: Props) {
  const { locale, baseCurrency, activeBroker } = useAppStore();
  const t = useTranslation(locale);

  const handleDelete = async (id: number | undefined) => {
    if (!id) return;
    if (confirm('Are you sure you want to remove this position?')) {
      await db.positions.delete(id);
    }
  };

  const getBrokerBadge = (brokerId?: string) => {
    if (!brokerId) return null;
    const b = DEFAULT_BROKERS.find((item) => item.id === brokerId);
    const name = b ? b.name : brokerId.toUpperCase();
    const color = b?.color || '#8b5cf6';
    return (
      <span
        className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border"
        style={{ borderColor: `${color}30`, backgroundColor: `${color}10`, color }}
      >
        {name}
      </span>
    );
  };

  if (positions.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">{t('portfolio.noPositions')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-border/70 shadow-sm">
      <CardHeader className="pb-3 flex flex-row items-center justify-between flex-wrap gap-2 border-b border-border/40 bg-muted/20">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base font-semibold">{t('portfolio.positions')}</CardTitle>
          <Badge variant="outline" className="text-[11px] font-mono">
            {positions.length} holdings
          </Badge>
        </div>
        <span className="text-xs text-muted-foreground">
          Displayed in: <strong className="text-foreground">{baseCurrency}</strong>
        </span>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border/50 text-muted-foreground bg-muted/10 font-medium">
                <th className="text-left py-3 px-3">Asset & Symbol</th>
                {activeBroker === 'all' && (
                  <th className="text-left py-3 px-2">Broker</th>
                )}
                <th className="text-right py-3 px-2">Shares</th>
                <th className="text-right py-3 px-2">Avg Cost</th>
                <th className="text-right py-3 px-2">Current Price</th>
                <th className="text-right py-3 px-2">Market Value</th>
                <th className="text-right py-3 px-3">P&L</th>
                <th className="text-right py-3 px-2">Day Change</th>
                <th className="py-3 px-2 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {positions.map((pos) => {
                const isPositive = pos.profitLoss >= 0;
                const isDayPositive = pos.dayChange >= 0;

                return (
                  <tr
                    key={pos.id || pos.symbol + pos.broker}
                    className="hover:bg-muted/40 transition-colors group"
                  >
                    {/* Symbol & Name */}
                    <td className="py-3 px-3">
                      <Link
                        href={`/stocks/${pos.symbol}`}
                        className="flex items-center gap-1.5 font-bold text-foreground hover:text-indigo-400 transition-colors group-hover:underline"
                      >
                        <span>{pos.symbol}</span>
                        <ExternalLink className="h-3 w-3 text-muted-foreground opacity-50 group-hover:opacity-100" />
                      </Link>
                      <span className="text-[11px] text-muted-foreground block truncate max-w-[150px]">
                        {pos.shortName}
                      </span>
                    </td>

                    {/* Broker Badge */}
                    {activeBroker === 'all' && (
                      <td className="py-3 px-2">
                        {getBrokerBadge(pos.broker)}
                      </td>
                    )}

                    {/* Shares */}
                    <td className="text-right py-3 px-2 font-mono font-medium">
                      {formatNumber(pos.shares, pos.shares < 1 ? 6 : 4)}
                    </td>

                    {/* Avg Cost */}
                    <td className="text-right py-3 px-2 font-mono">
                      <span className="text-muted-foreground block">
                        {formatCurrency(pos.convertedBuyPrice || pos.buyPrice, baseCurrency)}
                      </span>
                      {pos.currency !== baseCurrency && (
                        <span className="text-[10px] text-muted-foreground/60 block">
                          {formatCurrency(pos.buyPrice, pos.currency)}
                        </span>
                      )}
                    </td>

                    {/* Current Price */}
                    <td className="text-right py-3 px-2 font-mono font-semibold">
                      <span className="text-foreground block">
                        {formatCurrency(pos.convertedCurrentPrice || pos.currentPrice, baseCurrency)}
                      </span>
                      {pos.currency !== baseCurrency && (
                        <span className="text-[10px] text-muted-foreground/70 block">
                          {formatCurrency(pos.currentPrice, pos.currency)}
                        </span>
                      )}
                    </td>

                    {/* Market Value */}
                    <td className="text-right py-3 px-2">
                      <span className="font-bold text-foreground block font-mono">
                        {formatCurrency(pos.convertedMarketValue || pos.marketValue, baseCurrency)}
                      </span>
                      {pos.currency !== baseCurrency && (
                        <span className="text-[10px] text-muted-foreground/70 block font-mono">
                          {formatCurrency(pos.marketValue, pos.currency)}
                        </span>
                      )}
                    </td>

                    {/* Profit / Loss with Clean Modern Pill */}
                    <td className="text-right py-3 px-3">
                      <div className="flex flex-col items-end gap-0.5">
                        <span
                          className={`font-bold font-mono text-xs flex items-center gap-0.5 ${
                            isPositive ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {isPositive ? (
                            <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
                          ) : (
                            <ArrowDownRight className="h-3.5 w-3.5 shrink-0" />
                          )}
                          {formatCurrency(Math.abs(pos.convertedProfitLoss || pos.profitLoss), baseCurrency)}
                        </span>
                        <Badge
                          variant={isPositive ? 'success' : 'danger'}
                          className="text-[10px] px-1.5 py-0 h-4"
                        >
                          {formatPercent(pos.profitLossPercent)}
                        </Badge>
                      </div>
                    </td>

                    {/* Day Change */}
                    <td className="text-right py-3 px-2">
                      <span
                        className={`font-mono text-xs ${
                          isDayPositive ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {formatPercent(pos.dayChangePercent)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-2 text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground/60 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        onClick={() => handleDelete(pos.id)}
                        title="Șterge poziția"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
