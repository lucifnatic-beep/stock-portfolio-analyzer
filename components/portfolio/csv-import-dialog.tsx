'use client';

import React, { useState } from 'react';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { db } from '@/lib/db';
import { useTranslation } from '@/lib/i18n';
import { useAppStore } from '@/stores/app-store';

interface Props {
  onImportSuccess?: () => void;
}

export function CSVImportDialog({ onImportSuccess }: Props) {
  const { locale } = useAppStore();
  const t = useTranslation(locale);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: number; skipped: number; errors: string[] } | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setResult(null);

    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length < 2) {
        setResult({ success: 0, skipped: 0, errors: ['File is empty or missing headers.'] });
        setLoading(false);
        return;
      }

      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/['"]/g, ''));
      const symbolIdx = headers.findIndex((h) => h.includes('symbol') || h.includes('ticker') || h === 'asset');
      const sharesIdx = headers.findIndex((h) => h.includes('share') || h.includes('quantity') || h === 'qty');
      const priceIdx = headers.findIndex((h) => h.includes('price') || h.includes('cost') || h.includes('avg'));
      const currencyIdx = headers.findIndex((h) => h.includes('currency') || h === 'curr');

      let successCount = 0;
      let skippedCount = 0;
      const errors: string[] = [];

      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map((c) => c.trim().replace(/['"]/g, ''));
        if (cols.length < 2) continue;

        const symbol = symbolIdx >= 0 ? cols[symbolIdx]?.toUpperCase() : cols[0]?.toUpperCase();
        const shares = parseFloat(sharesIdx >= 0 ? cols[sharesIdx] : cols[1]) || 0;
        const buyPrice = parseFloat(priceIdx >= 0 ? cols[priceIdx] : cols[2]) || 0;
        const currency = currencyIdx >= 0 && cols[currencyIdx] ? cols[currencyIdx].toUpperCase() : 'USD';

        if (!symbol || shares <= 0) {
          skippedCount++;
          continue;
        }

        const existing = await db.positions.where('symbol').equals(symbol).first();
        if (existing) {
          skippedCount++;
          continue;
        }

        await db.positions.add({
          symbol,
          shares,
          buyPrice: buyPrice > 0 ? buyPrice : 100,
          currency: ['USD', 'EUR', 'GBP'].includes(currency) ? currency : 'USD',
          exchange: 'US/EU',
          broker: 'revolut',
          buyDate: new Date().toISOString().split('T')[0],
          createdAt: new Date().toISOString(),
        });
        successCount++;
      }

      setResult({ success: successCount, skipped: skippedCount, errors });
      if (onImportSuccess) onImportSuccess();
    } catch (err: any) {
      setResult({ success: 0, skipped: 0, errors: [err.message || 'Failed to parse CSV file.'] });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="outline"
        size="sm"
        className="h-8 gap-1.5 text-xs font-semibold border-border/70 hover:bg-muted"
      >
        <Upload className="h-3.5 w-3.5 text-cyan-400" />
        <span>Import CSV</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md p-6">
          <DialogHeader className="space-y-1 pb-2">
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-cyan-400" />
              Import CSV Portfolio (Revolut / IBKR / Degiro)
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Upload your CSV export file. Columns detected automatically: Symbol, Shares, Buy Price, Currency.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="border-2 border-dashed border-border/70 rounded-xl p-6 text-center hover:border-cyan-500/50 transition-colors bg-muted/20">
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-xs font-semibold text-foreground">Select a .CSV file</p>
              <p className="text-[10px] text-muted-foreground mt-1">Revolut, Interactive Brokers, Degiro, or Generic CSV</p>
              <label className="inline-block mt-3 cursor-pointer">
                <span className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-xs">
                  Browse Files
                </span>
                <input type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            {loading && <p className="text-center text-xs text-muted-foreground animate-pulse">Parsing positions...</p>}

            {result && (
              <div className="space-y-2 p-3 rounded-xl bg-muted/40 border border-border/50 text-xs">
                {result.success > 0 && (
                  <p className="text-emerald-400 flex items-center gap-1.5 font-semibold">
                    <CheckCircle2 className="h-4 w-4" />
                    Successfully imported {result.success} positions!
                  </p>
                )}
                {result.skipped > 0 && (
                  <p className="text-muted-foreground">
                    Skipped {result.skipped} rows (duplicates or empty).
                  </p>
                )}
                {result.errors.length > 0 && (
                  <div className="text-rose-400 flex items-start gap-1.5">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <div>
                      {result.errors.map((e, idx) => (
                        <p key={idx}>{e}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
