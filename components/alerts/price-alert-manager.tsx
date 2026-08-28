'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Bell, Plus, Trash2, ArrowUp, ArrowDown, Check } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectItem } from '@/components/ui/select';
import { db } from '@/lib/db';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useAppStore } from '@/stores/app-store';
import { useTranslation } from '@/lib/i18n';
import type { AlertDirection } from '@/types';

export function PriceAlertManager() {
  const { locale } = useAppStore();
  const t = useTranslation(locale);
  const alerts = useLiveQuery(() => db.priceAlerts.toArray()) || [];
  const [symbol, setSymbol] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [direction, setDirection] = useState<AlertDirection>('above');
  const [showForm, setShowForm] = useState(false);

  // Check alerts periodically
  const checkAlerts = useCallback(async () => {
    const activeAlerts = alerts.filter((a) => a.active && !a.triggered);
    if (activeAlerts.length === 0) return;

    const symbols = [...new Set(activeAlerts.map((a) => a.symbol))];
    try {
      const res = await fetch(`/api/stock/quote?symbols=${encodeURIComponent(symbols.join(','))}`);
      const quotes = await res.json();
      if (!Array.isArray(quotes)) return;

      for (const alert of activeAlerts) {
        const quote = quotes.find((q: { symbol: string }) => q.symbol === alert.symbol);
        if (!quote) continue;

        const price = quote.regularMarketPrice;
        const triggered =
          (alert.direction === 'above' && price >= alert.targetPrice) ||
          (alert.direction === 'below' && price <= alert.targetPrice);

        if (triggered && alert.id) {
          await db.priceAlerts.update(alert.id, {
            triggered: true,
            triggeredAt: new Date().toISOString(),
          });

          // Browser notification
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`Price Alert: ${alert.symbol}`, {
              body: `${alert.symbol} is now ${alert.direction} ${formatCurrency(alert.targetPrice, 'USD')} (Current: ${formatCurrency(price, 'USD')})`,
              icon: '/favicon.ico',
            });
          }
        }
      }
    } catch (err) {
      console.error('Alert check failed:', err);
    }
  }, [alerts]);

  useEffect(() => {
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    checkAlerts();
    const interval = setInterval(checkAlerts, 60000);
    return () => clearInterval(interval);
  }, [checkAlerts]);

  const addAlert = async () => {
    if (!symbol || !targetPrice) return;
    await db.priceAlerts.add({
      symbol: symbol.toUpperCase(),
      targetPrice: parseFloat(targetPrice),
      direction,
      active: true,
      triggered: false,
      createdAt: new Date().toISOString(),
    });
    setSymbol('');
    setTargetPrice('');
    setShowForm(false);
  };

  const deleteAlert = async (id: number | undefined) => {
    if (!id) return;
    await db.priceAlerts.delete(id);
  };

  const activeAlerts = alerts.filter((a) => a.active && !a.triggered);
  const triggeredAlerts = alerts.filter((a) => a.triggered);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4 text-orange-500" />
            {t('alerts.title')}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Link href="/alerts" className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold">
              Manage ({alerts.length}) →
            </Link>
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setShowForm(!showForm)}>
              <Plus className="h-3 w-3 mr-1" />
              {t('alerts.addAlert')}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Add alert form */}
        {showForm && (
          <div className="rounded-md border p-3 mb-4 space-y-2">
            <div className="grid grid-cols-3 gap-2">
              <Input
                placeholder="Symbol"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                className="h-8 text-sm"
              />
              <Input
                type="number"
                placeholder={t('alerts.targetPrice')}
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                className="h-8 text-sm"
                step="0.01"
              />
              <Select value={direction} onValueChange={(v) => setDirection(v as AlertDirection)}>
                <SelectItem value="above">↑ {t('alerts.above')}</SelectItem>
                <SelectItem value="below">↓ {t('alerts.below')}</SelectItem>
              </Select>
            </div>
            <Button size="sm" className="w-full h-7" onClick={addAlert}>
              {t('common.save')}
            </Button>
          </div>
        )}

        {alerts.length === 0 && !showForm ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {t('alerts.noAlerts')}
          </p>
        ) : (
          <div className="space-y-1">
            {activeAlerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-muted/50 group"
              >
                <div className="flex items-center gap-2">
                  {alert.direction === 'above' ? (
                    <ArrowUp className="h-3 w-3 text-emerald-500" />
                  ) : (
                    <ArrowDown className="h-3 w-3 text-red-500" />
                  )}
                  <span className="font-semibold text-sm">{alert.symbol}</span>
                  <span className="text-xs text-muted-foreground">
                    {t(`alerts.${alert.direction}`)} {formatCurrency(alert.targetPrice, 'USD')}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100"
                  onClick={() => deleteAlert(alert.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}

            {triggeredAlerts.length > 0 && (
              <>
                <div className="text-xs text-muted-foreground mt-3 mb-1 font-medium">
                  {t('alerts.triggered')}
                </div>
                {triggeredAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between rounded-md px-2 py-1.5 opacity-60 group"
                  >
                    <div className="flex items-center gap-2">
                      <Check className="h-3 w-3 text-emerald-500" />
                      <span className="text-sm">{alert.symbol}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatCurrency(alert.targetPrice, 'USD')}
                      </span>
                      {alert.triggeredAt && (
                        <span className="text-xs text-muted-foreground">
                          {formatDate(alert.triggeredAt)}
                        </span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100"
                      onClick={() => deleteAlert(alert.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
