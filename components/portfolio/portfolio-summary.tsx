'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Wallet, BarChart3, Coins } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency, formatPercent, getChangeBgColor } from '@/lib/utils';
import { useAppStore } from '@/stores/app-store';
import { useTranslation } from '@/lib/i18n';
import type { PortfolioSummary as PortfolioSummaryType } from '@/types';

interface Props {
  summary: PortfolioSummaryType;
  currency?: string;
}

export function PortfolioSummary({ summary, currency = 'RON' }: Props) {
  const { locale } = useAppStore();
  const t = useTranslation(locale);

  const hasCash = (summary.cashBalance || 0) > 0;
  const displayTotal = hasCash ? (summary.totalWithCash || summary.totalValue) : summary.totalValue;

  const cards = [
    {
      title: hasCash ? 'Total Value (with Cash)' : t('portfolio.totalValue'),
      value: formatCurrency(displayTotal, currency),
      subtitle: hasCash ? `Holdings: ${formatCurrency(summary.totalValue, currency)}` : undefined,
      icon: Wallet,
      color: 'text-blue-500',
    },
    ...(hasCash
      ? [
          {
            title: 'Available Cash',
            value: formatCurrency(summary.cashBalance || 0, currency),
            subtitle: 'Uninvested',
            icon: Coins,
            color: 'text-amber-500',
          },
        ]
      : []),
    {
      title: t('portfolio.totalPL'),
      value: formatCurrency(summary.totalProfitLoss, currency),
      subtitle: formatPercent(summary.totalProfitLossPercent),
      icon: summary.totalProfitLoss >= 0 ? TrendingUp : TrendingDown,
      color: summary.totalProfitLoss >= 0 ? 'text-emerald-500' : 'text-red-500',
    },
    {
      title: t('portfolio.dayChange'),
      value: formatCurrency(summary.dayChange, currency),
      subtitle: formatPercent(summary.dayChangePercent),
      icon: summary.dayChange >= 0 ? TrendingUp : TrendingDown,
      color: summary.dayChange >= 0 ? 'text-emerald-500' : 'text-red-500',
    },
    ...(!hasCash
      ? [
          {
            title: t('portfolio.positions'),
            value: summary.positionCount.toString(),
            icon: BarChart3,
            color: 'text-violet-500',
          },
        ]
      : []),
  ];

  return (
    <div className={`grid gap-4 sm:grid-cols-2 ${cards.length === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
      {cards.map((card) => (
        <Card key={card.title}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{card.title}</p>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
            <div className="mt-2">
              <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
              {card.subtitle && (
                <p className="text-xs text-muted-foreground mt-1">
                  {card.subtitle}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
