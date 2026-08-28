'use client';

import React from 'react';
import { Bell } from 'lucide-react';
import { PriceAlertManager } from '@/components/alerts/price-alert-manager';
import { useTranslation } from '@/lib/i18n';
import { useAppStore } from '@/stores/app-store';

export default function AlertsPage() {
  const { locale } = useAppStore();
  const t = useTranslation(locale);

  return (
    <div className="space-y-6 pb-16 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 border-b border-border/40 pb-4">
        <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-500 border border-orange-500/20">
          <Bell className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('alerts.title')}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Set and track target price triggers for your stocks in real-time.
          </p>
        </div>
      </div>

      <div className="w-full">
        <PriceAlertManager />
      </div>
    </div>
  );
}
