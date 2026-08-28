'use client';

import React from 'react';
import { Star, TrendingUp } from 'lucide-react';
import { WatchlistPanel } from '@/components/watchlist/watchlist-panel';
import { useTranslation } from '@/lib/i18n';
import { useAppStore } from '@/stores/app-store';

export default function WatchlistPage() {
  const { locale } = useAppStore();
  const t = useTranslation(locale);

  return (
    <div className="space-y-6 pb-16 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 border-b border-border/40 pb-4">
        <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
          <Star className="h-6 w-6 fill-amber-500/20" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('watchlist.title')}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Monitor potential buy candidates and live market movements.
          </p>
        </div>
      </div>

      <div className="w-full">
        <WatchlistPanel />
      </div>
    </div>
  );
}
