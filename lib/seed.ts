import { db } from '@/lib/db';
import { DEFAULT_BROKERS } from '@/types';

let isSeedingInProgress = false;

export async function initDefaultBrokers() {
  if (isSeedingInProgress) return;
  isSeedingInProgress = true;

  try {
    await db.transaction('rw', [db.brokers], async () => {
      for (const b of DEFAULT_BROKERS) {
        if (b.id !== 'all') {
          const existing = await db.brokers.get(b.id);
          if (!existing) {
            await db.brokers.put({
              id: b.id,
              name: b.name,
              color: b.color,
              cash: 0,
              cashCurrency: b.id === 't212' ? 'USD' : 'RON',
            });
          }
        }
      }
    });
  } catch (err) {
    console.error('Broker initialization error:', err);
  } finally {
    isSeedingInProgress = false;
  }
}

// Optional: Explicitly seed sample portfolio if requested by user
export async function seedSamplePortfolio() {
  try {
    await db.transaction('rw', [db.brokers, db.positions, db.watchlist], async () => {
      // Demo Positions
      const demoPositions = [
        { symbol: 'NVDA', shares: 10, buyPrice: 118.50, currency: 'USD', exchange: 'NASDAQ', broker: 't212', notes: 'NVIDIA Corp', buyDate: '2025-01-15' },
        { symbol: 'MSFT', shares: 5, buyPrice: 420.00, currency: 'USD', exchange: 'NASDAQ', broker: 't212', notes: 'Microsoft Corp', buyDate: '2025-02-01' },
        { symbol: 'TLV.RO', shares: 300, buyPrice: 24.50, currency: 'RON', exchange: 'BVB', broker: 'bcr', notes: 'Banca Transilvania', buyDate: '2024-11-20' },
        { symbol: 'SNP.RO', shares: 2000, buyPrice: 0.65, currency: 'RON', exchange: 'BVB', broker: 'bcr', notes: 'OMV Petrom', buyDate: '2024-11-20' },
        { symbol: 'TVBETETF.RO', shares: 50, buyPrice: 28.00, currency: 'RON', exchange: 'BVB', broker: 'investimental', notes: 'ETF BET Romania', buyDate: '2025-01-10' },
      ];

      for (const p of demoPositions) {
        await db.positions.add({
          ...p,
          createdAt: new Date().toISOString(),
        });
      }

      const watchlistSymbols = ['NVDA', 'MSFT', 'ASML', 'TLV.RO', 'SNP.RO', 'PLTR'];
      for (const s of watchlistSymbols) {
        const exists = await db.watchlist.where('symbol').equals(s).first();
        if (!exists) {
          await db.watchlist.add({ symbol: s, addedAt: new Date().toISOString() });
        }
      }
    });
    window.location.reload();
  } catch (err) {
    console.error('Failed to seed demo portfolio:', err);
  }
}

// Alias for backward compatibility
export const deduplicateAndSeedPortfolio = initDefaultBrokers;

