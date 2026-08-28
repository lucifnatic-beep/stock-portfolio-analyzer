'use client';

import React, { useState } from 'react';
import { Landmark, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { parseBCRReport, type BCRParsedResult } from '@/lib/bcr-parser';
import { db } from '@/lib/db';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { useAppStore } from '@/stores/app-store';

export function BCRImportDialog({ onImportSuccess }: { onImportSuccess?: () => void }) {
  const { setActiveBroker } = useAppStore();
  const [open, setOpen] = useState(false);
  const [reportText, setReportText] = useState('');
  const [parsedResult, setParsedResult] = useState<BCRParsedResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleParse = (text: string) => {
    setReportText(text);
    setError(null);
    if (!text.trim()) {
      setParsedResult(null);
      return;
    }
    try {
      const res = parseBCRReport(text);
      if (res.positions.length === 0) {
        setError('Nu s-au putut identifica poziții din raportul BCR.');
      } else {
        setParsedResult(res);
      }
    } catch (e: any) {
      setError('Eroare la parsare: ' + e.message);
    }
  };

  const handleConfirmImport = async () => {
    if (!parsedResult || parsedResult.positions.length === 0) return;

    try {
      // Remove previous 'bcr' positions to avoid duplication
      const existing = await db.positions.where('broker').equals('bcr').toArray();
      for (const pos of existing) {
        if (pos.id) await db.positions.delete(pos.id);
      }

      // Add new BCR positions
      for (const pos of parsedResult.positions) {
        await db.positions.add({
          symbol: pos.symbol,
          shares: pos.shares,
          buyPrice: pos.buyPrice,
          buyDate: pos.buyDate,
          currency: pos.currency,
          exchange: pos.exchange,
          broker: 'bcr',
          notes: `Importat din BCR Broker (${pos.name})`,
          createdAt: new Date().toISOString(),
        });
      }

      // Update cash in BCR broker record
      await db.brokers.put({
        id: 'bcr',
        name: 'BCR Broker',
        color: '#f59e0b',
        cash: parsedResult.cash,
        cashCurrency: 'RON',
      });

      // Add symbols to watchlist
      for (const pos of parsedResult.positions) {
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
        setParsedResult(null);
        setReportText('');
        setActiveBroker('bcr');
        if (onImportSuccess) onImportSuccess();
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      setError('Eroare la salvare: ' + err.message);
    }
  };

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)} className="gap-2 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10">
        <Landmark className="h-4 w-4" />
        Import BCR Broker
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" onClose={() => setOpen(false)}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Landmark className="h-5 w-5 text-amber-500" />
              Import BCR Broker Report (BVB)
            </DialogTitle>
            <DialogDescription>
              Paste the text extracted from your BCR Broker report to load your BVB holdings and cash balance.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                Paste BCR Broker statement text here
              </label>
              <textarea
                rows={5}
                className="w-full rounded-md border bg-transparent p-2 text-xs font-mono outline-none focus:ring-1 focus:ring-ring"
                placeholder="Paste BCR report text here..."
                value={reportText}
                onChange={(e) => handleParse(e.target.value)}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-xs text-red-500 bg-red-500/10 p-2.5 rounded-md">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 text-xs text-emerald-500 bg-emerald-500/10 p-2.5 rounded-md">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>BCR Broker positions imported successfully!</span>
              </div>
            )}

            {parsedResult && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Detected Holdings ({parsedResult.positions.length})
                  </h4>
                  <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-500 border-amber-500/30">
                    Cash Balance: {formatCurrency(parsedResult.cash, 'USD')}
                  </Badge>
                </div>

                <div className="max-h-56 overflow-y-auto border rounded-md">
                  <table className="w-full text-xs">
                    <thead className="bg-muted text-muted-foreground sticky top-0">
                      <tr>
                        <th className="py-2 px-3 text-left">Symbol</th>
                        <th className="py-2 px-3 text-left">Company</th>
                        <th className="py-2 px-3 text-right">Shares</th>
                        <th className="py-2 px-3 text-right">Est. Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {parsedResult.positions.map((pos) => (
                        <tr key={pos.symbol} className="hover:bg-muted/40">
                          <td className="py-1.5 px-3 font-semibold text-foreground">{pos.symbol}</td>
                          <td className="py-1.5 px-3 text-muted-foreground">{pos.name}</td>
                          <td className="py-1.5 px-3 text-right font-mono font-semibold">{formatNumber(pos.shares, 0)}</td>
                          <td className="py-1.5 px-3 text-right">{formatCurrency(pos.buyPrice, pos.currency)}</td>
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
              Cancel
            </Button>
            <Button
              onClick={handleConfirmImport}
              disabled={!parsedResult || parsedResult.positions.length === 0 || success}
              className="gap-2 bg-amber-500 hover:bg-amber-600 text-white"
            >
              <CheckCircle2 className="h-4 w-4" />
              Confirm Import ({parsedResult?.positions.length || 0} Holdings)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
