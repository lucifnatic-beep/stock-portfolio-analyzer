'use client';

import React, { useState } from 'react';
import { UploadCloud, FileSpreadsheet, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { parseT212CSV, type T212ParsedPosition } from '@/lib/t212-parser';
import { db } from '@/lib/db';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { useAppStore } from '@/stores/app-store';
import { useTranslation } from '@/lib/i18n';

export function T212ImportDialog({ onImportSuccess }: { onImportSuccess?: () => void }) {
  const { locale } = useAppStore();
  const t = useTranslation(locale);
  const [open, setOpen] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [parsedPositions, setParsedPositions] = useState<T212ParsedPosition[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleParse = (text: string) => {
    setCsvText(text);
    setError(null);
    if (!text.trim()) {
      setParsedPositions([]);
      return;
    }
    try {
      const positions = parseT212CSV(text);
      if (positions.length === 0) {
        setError('Nu s-au găsit tranzacții sau poziții deschise valide.');
      } else {
        setParsedPositions(positions);
      }
    } catch (e: any) {
      setError('Format CSV invalid: ' + e.message);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      handleParse(text);
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = async () => {
    if (parsedPositions.length === 0) return;

    try {
      // Remove existing T212 positions to avoid duplication without deleting other brokers
      const existing = await db.positions.where('broker').equals('t212').toArray();
      for (const pos of existing) {
        if (pos.id) await db.positions.delete(pos.id);
      }

      for (const pos of parsedPositions) {
        await db.positions.add({
          symbol: pos.symbol,
          shares: pos.shares,
          buyPrice: pos.avgPrice,
          buyDate: pos.buyDate,
          currency: pos.currency,
          exchange: '',
          broker: 't212',
          notes: `Importat din Trading 212 (${pos.name})`,
          createdAt: new Date().toISOString(),
        });
      }

      // Also add to watchlist
      for (const pos of parsedPositions) {
        const exists = await db.watchlist.where('symbol').equals(pos.symbol).first();
        if (!exists) {
          await db.watchlist.add({
            symbol: pos.symbol,
            addedAt: new Date().toISOString(),
          });
        }
      }

      setSuccess(true);
      setTimeout(() => {
        setOpen(false);
        setSuccess(false);
        setParsedPositions([]);
        setCsvText('');
        if (onImportSuccess) onImportSuccess();
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      setError('Eroare la salvare: ' + err.message);
    }
  };

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)} className="gap-2">
        <FileSpreadsheet className="h-4 w-4 text-blue-500" />
        {t('portfolio.importT212')}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" onClose={() => setOpen(false)}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-blue-500" />
              {t('portfolio.importT212')}
            </DialogTitle>
            <DialogDescription>
              {t('portfolio.importT212Desc')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            {/* File Upload Button */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <label className="flex-1 w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                <UploadCloud className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium">{t('portfolio.uploadCSV')} (.csv)</span>
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>
            </div>

            {/* Paste CSV textarea */}
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                {t('portfolio.pasteCSV')}
              </label>
              <textarea
                rows={4}
                className="w-full rounded-md border bg-transparent p-2 text-xs font-mono outline-none focus:ring-1 focus:ring-ring"
                placeholder="Action,Time (UTC),ISIN,Ticker,Name,..."
                value={csvText}
                onChange={(e) => handleParse(e.target.value)}
              />
            </div>

            {/* Error message */}
            {error && (
              <div className="flex items-center gap-2 text-xs text-red-500 bg-red-500/10 p-2.5 rounded-md">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Success message */}
            {success && (
              <div className="flex items-center gap-2 text-xs text-emerald-500 bg-emerald-500/10 p-2.5 rounded-md">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{t('portfolio.importSuccess')}</span>
              </div>
            )}

            {/* Preview of parsed positions */}
            {parsedPositions.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t('portfolio.previewPositions')} ({parsedPositions.length})
                  </h4>
                  <Badge variant="outline" className="text-xs">
                    {parsedPositions.reduce((sum, p) => sum + p.totalCost, 0).toFixed(2)} Total Investit
                  </Badge>
                </div>

                <div className="max-h-56 overflow-y-auto border rounded-md">
                  <table className="w-full text-xs">
                    <thead className="bg-muted text-muted-foreground sticky top-0">
                      <tr>
                        <th className="py-2 px-3 text-left">Simbol</th>
                        <th className="py-2 px-3 text-left">Nume</th>
                        <th className="py-2 px-3 text-right">Acțiuni</th>
                        <th className="py-2 px-3 text-right">Preț Mediu</th>
                        <th className="py-2 px-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {parsedPositions.map((pos) => (
                        <tr key={pos.symbol} className="hover:bg-muted/40">
                          <td className="py-1.5 px-3 font-semibold text-foreground">{pos.symbol}</td>
                          <td className="py-1.5 px-3 text-muted-foreground truncate max-w-[150px]">{pos.name}</td>
                          <td className="py-1.5 px-3 text-right font-mono">{formatNumber(pos.shares, 4)}</td>
                          <td className="py-1.5 px-3 text-right">{formatCurrency(pos.avgPrice, pos.currency)}</td>
                          <td className="py-1.5 px-3 text-right font-medium">{formatCurrency(pos.totalCost, pos.currency)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleConfirmImport}
              disabled={parsedPositions.length === 0 || success}
              className="gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              {t('common.confirm')} ({parsedPositions.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
