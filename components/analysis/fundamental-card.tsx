'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatLargeNumber, formatPercent, formatNumber } from '@/lib/utils';
import { useAppStore } from '@/stores/app-store';
import { useTranslation } from '@/lib/i18n';
import type { StockFundamentals } from '@/types';

interface Props {
  fundamentals: StockFundamentals;
}

export function FundamentalCard({ fundamentals }: Props) {
  const { locale } = useAppStore();
  const t = useTranslation(locale);

  const metrics = [
    { label: 'Market Cap', value: fundamentals.marketCap ? formatLargeNumber(fundamentals.marketCap) : 'N/A' },
    { label: 'P/E (Trailing)', value: fundamentals.trailingPE ? formatNumber(fundamentals.trailingPE) : 'N/A' },
    { label: 'P/E (Forward)', value: fundamentals.forwardPE ? formatNumber(fundamentals.forwardPE) : 'N/A' },
    { label: 'PEG Ratio', value: fundamentals.pegRatio ? formatNumber(fundamentals.pegRatio) : 'N/A' },
    { label: 'EPS (TTM)', value: fundamentals.trailingEps ? formatNumber(fundamentals.trailingEps) : 'N/A' },
    { label: 'EPS (FWD)', value: fundamentals.forwardEps ? formatNumber(fundamentals.forwardEps) : 'N/A' },
    { label: 'P/B Ratio', value: fundamentals.priceToBook ? formatNumber(fundamentals.priceToBook) : 'N/A' },
    { label: 'Revenue Growth', value: fundamentals.revenueGrowth ? formatPercent(fundamentals.revenueGrowth * 100) : 'N/A' },
    { label: 'Earnings Growth', value: fundamentals.earningsGrowth ? formatPercent(fundamentals.earningsGrowth * 100) : 'N/A' },
    { label: 'Profit Margin', value: fundamentals.profitMargin ? formatPercent(fundamentals.profitMargin * 100) : 'N/A' },
    { label: 'Operating Margin', value: fundamentals.operatingMargin ? formatPercent(fundamentals.operatingMargin * 100) : 'N/A' },
    { label: 'ROE', value: fundamentals.returnOnEquity ? formatPercent(fundamentals.returnOnEquity * 100) : 'N/A' },
    { label: 'D/E Ratio', value: fundamentals.debtToEquity ? formatNumber(fundamentals.debtToEquity) : 'N/A' },
    { label: 'Dividend Yield', value: fundamentals.dividendYield ? formatPercent(fundamentals.dividendYield * 100) : 'N/A' },
    { label: 'Beta', value: fundamentals.beta ? formatNumber(fundamentals.beta) : 'N/A' },
    { label: 'Target Price', value: fundamentals.targetMeanPrice ? `$${formatNumber(fundamentals.targetMeanPrice)}` : 'N/A' },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{t('analysis.fundamental')}</CardTitle>
          {fundamentals.recommendationKey && (
            <Badge variant="outline" className="text-xs uppercase">
              {fundamentals.recommendationKey}
            </Badge>
          )}
        </div>
        {(fundamentals.sector || fundamentals.industry) && (
          <p className="text-xs text-muted-foreground">
            {fundamentals.sector}{fundamentals.industry ? ` • ${fundamentals.industry}` : ''}
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2">
          {metrics.map((metric) => (
            <div key={metric.label} className="flex justify-between py-1 border-b last:border-0">
              <span className="text-xs text-muted-foreground">{metric.label}</span>
              <span className="text-xs font-medium">{metric.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
