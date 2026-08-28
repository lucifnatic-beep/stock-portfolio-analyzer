'use client';

import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Wallet, Building2, Globe, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { db } from '@/lib/db';
import { useAppStore } from '@/stores/app-store';
import { formatCurrency } from '@/lib/utils';
import { DEFAULT_BROKERS, type Broker } from '@/types';

export function BrokerTabs() {
  const { activeBroker, setActiveBroker, baseCurrency } = useAppStore();
  const customBrokers = useLiveQuery(() => db.brokers.toArray()) || [];

  // Merge default + custom
  const brokersMap = new Map<string, Broker>();
  DEFAULT_BROKERS.forEach((b) => brokersMap.set(b.id, { ...b }));
  customBrokers.forEach((b) => brokersMap.set(b.id, { ...b }));
  const allBrokers = Array.from(brokersMap.values());

  const [addOpen, setAddOpen] = useState(false);
  const [newBrokerName, setNewBrokerName] = useState('');
  const [newBrokerCash, setNewBrokerCash] = useState('0');

  const [editCashOpen, setEditCashOpen] = useState(false);
  const [editCashValue, setEditCashValue] = useState('');

  const currentBroker = allBrokers.find((b) => b.id === activeBroker);

  const handleAddBroker = async () => {
    if (!newBrokerName.trim()) return;
    const id = newBrokerName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    await db.brokers.put({
      id,
      name: newBrokerName.trim(),
      color: '#8b5cf6',
      cash: parseFloat(newBrokerCash) || 0,
      cashCurrency: 'RON',
    });
    setNewBrokerName('');
    setNewBrokerCash('0');
    setAddOpen(false);
    setActiveBroker(id);
  };

  const handleUpdateCash = async () => {
    if (!currentBroker || currentBroker.id === 'all') return;
    const val = parseFloat(editCashValue) || 0;
    await db.brokers.put({
      ...currentBroker,
      cash: val,
    });
    setEditCashOpen(false);
  };

  return (
    <div className="space-y-3 w-full min-w-0">
      <div className="flex items-center justify-between flex-wrap gap-2 w-full min-w-0">
        {/* Scrollable Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-muted/70 rounded-xl border overflow-x-auto w-full max-w-full no-scrollbar">
          {allBrokers.map((broker) => {
            const isActive = activeBroker === broker.id;
            return (
              <button
                key={broker.id}
                onClick={() => setActiveBroker(broker.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/40'
                }`}
              >
                {broker.id === 'all' ? (
                  <Globe className="h-3.5 w-3.5 text-indigo-500" />
                ) : (
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: broker.color || '#3b82f6' }}
                  />
                )}
                <span>{broker.name}</span>
                {broker.cash && broker.cash > 0 ? (
                  <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4 bg-muted">
                    {formatCurrency(broker.cash, broker.cashCurrency || 'RON')} cash
                  </Badge>
                ) : null}
              </button>
            );
          })}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAddOpen(true)}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Broker</span>
          </Button>
        </div>

        {/* Cash Balance Display & Quick Edit for Active Broker */}
        {activeBroker !== 'all' && currentBroker && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-card rounded-lg border text-xs">
            <Wallet className="h-3.5 w-3.5 text-amber-500" />
            <span className="text-muted-foreground">Available Cash ({currentBroker.name}):</span>
            <span className="font-bold text-foreground font-mono">
              {formatCurrency(currentBroker.cash || 0, currentBroker.cashCurrency || baseCurrency)}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 text-muted-foreground hover:text-foreground ml-1"
              onClick={() => {
                setEditCashValue((currentBroker.cash || 0).toString());
                setEditCashOpen(true);
              }}
              title="Edit cash balance"
            >
              <Edit2 className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      {/* Dialog: Add New Broker */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-sm" onClose={() => setAddOpen(false)}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-500" />
              Add Broker / Portfolio
            </DialogTitle>
            <DialogDescription>
              Create a separate tab for a new brokerage account (e.g., Charles Schwab, Interactive Brokers, XTB).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                Broker / Account Name
              </label>
              <Input
                placeholder="e.g., Charles Schwab, IBKR, Fidelity"
                value={newBrokerName}
                onChange={(e) => setNewBrokerName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                Initial Cash Balance ({baseCurrency})
              </label>
              <Input
                type="number"
                step="any"
                placeholder="0"
                value={newBrokerCash}
                onChange={(e) => setNewBrokerCash(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddBroker} disabled={!newBrokerName.trim()}>
              Save Broker
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Edit Cash */}
      <Dialog open={editCashOpen} onOpenChange={setEditCashOpen}>
        <DialogContent className="max-w-sm" onClose={() => setEditCashOpen(false)}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-amber-500" />
              Cash Balance — {currentBroker?.name}
            </DialogTitle>
            <DialogDescription>
              Update uninvested cash balance for this brokerage account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                Cash Balance ({currentBroker?.cashCurrency || baseCurrency})
              </label>
              <Input
                type="number"
                step="any"
                value={editCashValue}
                onChange={(e) => setEditCashValue(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditCashOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateCash}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
