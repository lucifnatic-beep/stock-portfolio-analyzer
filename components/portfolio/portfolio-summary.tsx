'use client';

import React from 'react';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { useAppStore } from '@/stores/app-store';
import { useTranslation } from '@/lib/i18n';
import type { PortfolioSummary as PortfolioSummaryType } from '@/types';

interface Props {
  summary: PortfolioSummaryType;
  currency?: string;
}

export function PortfolioSummary({ summary, currency = 'USD' }: Props) {
  const { locale } = useAppStore();
  const t = useTranslation(locale);

  const hasCash = (summary.cashBalance || 0) > 0;
  const displayTotal = hasCash ? (summary.totalWithCash || summary.totalValue) : summary.totalValue;
  const isPositivePL = summary.totalProfitLoss >= 0;
  const isPositiveDay = summary.dayChange >= 0;

  return (
    <div className="w-full min-w-0 space-y-4">
      {/* Big Hero Value — Robinhood Style */}
      <div className="px-1">
        <p className="text-xs text-muted-foreground font-medium mb-1">
          {hasCash ? 'Total Portfolio Value' : t('portfolio.totalValue')}
        </p>
        <h2 className="text-3xl sm:text-4xl font-bold font-mono tracking-tight text-foreground">
          {formatCurrency(displayTotal, currency)}
        </h2>

        {/* P&L Row */}
        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
          {/* Total P&L */}
          <div className={`flex items-center gap-1 text-sm font-semibold ${isPositivePL ? 'text-emerald-500' : 'text-red-500'}`}>
            {isPositivePL ? (
              <ArrowUpRight className="h-4 w-4" />
            ) : (
              <ArrowDownRight className="h-4 w-4" />
            )}
            <span className="font-mono">{formatCurrency(Math.abs(summary.totalProfitLoss), currency)}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded-md font-bold ${
              isPositivePL
                ? 'bg-emerald-500/15 text-emerald-500'
                : 'bg-red-500/15 text-red-500'
            }`}>
              {isPositivePL ? '+' : ''}{formatPercent(summary.totalProfitLossPercent)}
            </span>
          </div>

          {/* Separator */}
          <span className="text-border text-xs">•</span>

          {/* Day Change */}
          <div className={`flex items-center gap-1 text-xs font-medium ${isPositiveDay ? 'text-emerald-400' : 'text-red-400'}`}>
            <span>Today</span>
            <span className="font-mono font-semibold">
              {isPositiveDay ? '+' : ''}{formatCurrency(summary.dayChange, currency)}
            </span>
            <span className="font-mono">
              ({isPositiveDay ? '+' : ''}{formatPercent(summary.dayChangePercent)})
            </span>
          </div>
        </div>

        {/* Cash sub-line */}
        {hasCash && (
          <p className="text-[11px] text-muted-foreground mt-1.5 font-medium">
            Holdings {formatCurrency(summary.totalValue, currency)} · Cash {formatCurrency(summary.cashBalance || 0, currency)} · {summary.positionCount} positions
          </p>
        )}

        {!hasCash && (
          <p className="text-[11px] text-muted-foreground mt-1.5 font-medium">
            {summary.positionCount} active positions
          </p>
        )}
      </div>
    </div>
  );
}
