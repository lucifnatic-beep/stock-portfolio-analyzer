'use client';

import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Wallet, Building2, Globe, Edit2, Check, Search } from 'lucide-react';
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
  const positions = useLiveQuery(() => db.positions.toArray()) || [];

  // All known brokers catalogue
  const allCatalogBrokers = useMemo(() => {
    const map = new Map<string, Broker>();
    DEFAULT_BROKERS.forEach((b) => map.set(b.id, { ...b }));
    customBrokers.forEach((b) => map.set(b.id, { ...b }));
    return Array.from(map.values());
  }, [customBrokers]);

  // Which brokers are actually in use? (Only show All + brokers with holdings or cash)
  const activeBrokersList = useMemo(() => {
    const usedBrokerIds = new Set(positions.map((p) => p.broker || 't212'));
    
    // Always include 'all'
    const result: Broker[] = [{ id: 'all', name: 'All Portfolios', color: '#6366f1' }];

    allCatalogBrokers.forEach((b) => {
      if (b.id === 'all') return;
      const hasPositions = usedBrokerIds.has(b.id);
      const hasCash = (b.cash || 0) > 0;
      if (hasPositions || hasCash) {
        result.push(b);
      }
    });

    // If active broker is not in list (e.g. selected via dropdown), ensure it's shown
    if (activeBroker !== 'all' && !result.some((b) => b.id === activeBroker)) {
      const b = allCatalogBrokers.find((x) => x.id === activeBroker);
      if (b) result.push(b);
    }

    return result;
  }, [positions, allCatalogBrokers, activeBroker]);

  const [addOpen, setAddOpen] = useState(false);
  const [brokerSearch, setBrokerSearch] = useState('');
  const [newBrokerName, setNewBrokerName] = useState('');
  const [newBrokerCash, setNewBrokerCash] = useState('0');

  const [editCashOpen, setEditCashOpen] = useState(false);
  const [editCashValue, setEditCashValue] = useState('');

  const currentBroker = allCatalogBrokers.find((b) => b.id === activeBroker);

  const handleSelectCatalogBroker = async (b: Broker) => {
    await db.brokers.put({
      id: b.id,
      name: b.name,
      color: b.color || '#3b82f6',
      cash: 0,
      cashCurrency: b.cashCurrency || baseCurrency,
    });
    setActiveBroker(b.id);
    setAddOpen(false);
    setBrokerSearch('');
  };

  const handleAddCustomBroker = async () => {
    if (!newBrokerName.trim()) return;
    const id = newBrokerName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    await db.brokers.put({
      id,
      name: newBrokerName.trim(),
      color: '#8b5cf6',
      cash: parseFloat(newBrokerCash) || 0,
      cashCurrency: baseCurrency,
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

  const filteredCatalog = allCatalogBrokers.filter((b) => {
    if (b.id === 'all') return false;
    if (!brokerSearch.trim()) return true;
    return b.name.toLowerCase().includes(brokerSearch.toLowerCase());
  });

  return (
    <div className="space-y-3 w-full min-w-0">
      <div className="flex items-center justify-between flex-wrap gap-2 w-full min-w-0">
        {/* Scrollable Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-muted/60 rounded-2xl border border-border/50 overflow-x-auto w-full max-w-full no-scrollbar">
          {activeBrokersList.map((broker) => {
            const isActive = activeBroker === broker.id;
            return (
              <button
                key={broker.id}
                onClick={() => setActiveBroker(broker.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer select-none active:scale-95 ${
                  isActive
                    ? 'bg-background text-foreground shadow-xs border border-border/60'
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/40'
                }`}
              >
                {broker.id === 'all' ? (
                  <Globe className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: broker.color || '#10b981' }}
                  />
                )}
                <span>{broker.name}</span>
                {broker.cash && broker.cash > 0 ? (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-muted font-mono">
                    {formatCurrency(broker.cash, broker.cashCurrency || baseCurrency)}
                  </Badge>
                ) : null}
              </button>
            );
          })}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAddOpen(true)}
            className="h-7 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1.5 rounded-lg shrink-0 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 text-emerald-400" />
            <span>Add Broker</span>
          </Button>
        </div>

        {/* Cash Balance Display & Quick Edit for Active Broker */}
        {activeBroker !== 'all' && currentBroker && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-card rounded-xl border border-border/60 text-xs">
            <Wallet className="h-3.5 w-3.5 text-emerald-400" />
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

      {/* Dialog: Add / Select Broker */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md p-6" onClose={() => setAddOpen(false)}>
          <DialogHeader className="space-y-1">
            <DialogTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-5 w-5 text-emerald-400" />
              Add Broker Portfolio
            </DialogTitle>
            <DialogDescription>
              Select a supported US / European broker or create a custom portfolio.
            </DialogDescription>
          </DialogHeader>

          {/* Search catalog */}
          <div className="space-y-3 py-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search brokers (e.g. Robinhood, Schwab, Trade Republic)..."
                value={brokerSearch}
                onChange={(e) => setBrokerSearch(e.target.value)}
                className="pl-9 h-9 text-xs rounded-xl"
              />
            </div>

            {/* Catalog Grid */}
            <div className="max-h-52 overflow-y-auto space-y-1 pr-1">
              {filteredCatalog.map((b) => (
                <button
                  key={b.id}
                  onClick={() => handleSelectCatalogBroker(b)}
                  className="flex items-center justify-between w-full p-2.5 rounded-xl hover:bg-muted/60 transition-colors text-left text-xs font-semibold group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: b.color || '#10b981' }}
                    />
                    <span className="text-foreground group-hover:text-emerald-400 transition-colors">{b.name}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground px-2 py-0.5 rounded-md bg-muted font-mono">
                    {b.cashCurrency || 'USD'}
                  </span>
                </button>
              ))}
            </div>

            {/* Custom broker entry */}
            <div className="pt-3 border-t border-border/40 space-y-2">
              <p className="text-[11px] font-semibold text-muted-foreground">Or create custom portfolio name:</p>
              <div className="flex gap-2">
                <Input
                  placeholder="Custom Broker Name"
                  value={newBrokerName}
                  onChange={(e) => setNewBrokerName(e.target.value)}
                  className="h-9 text-xs rounded-xl flex-1"
                />
                <Button
                  size="sm"
                  onClick={handleAddCustomBroker}
                  disabled={!newBrokerName.trim()}
                  className="h-9 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl"
                >
                  Add
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Edit Cash */}
      <Dialog open={editCashOpen} onOpenChange={setEditCashOpen}>
        <DialogContent className="max-w-sm p-6" onClose={() => setEditCashOpen(false)}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Wallet className="h-5 w-5 text-emerald-400" />
              Cash Balance — {currentBroker?.name}
            </DialogTitle>
            <DialogDescription>
              Update uninvested cash balance for this broker account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Cash Balance ({currentBroker?.cashCurrency || baseCurrency})
              </label>
              <Input
                type="number"
                step="any"
                value={editCashValue}
                onChange={(e) => setEditCashValue(e.target.value)}
                className="h-10 text-sm font-mono rounded-xl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditCashOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button onClick={handleUpdateCash} className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold">
              Save Balance
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
