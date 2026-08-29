import { db } from '@/lib/db';
import { DEFAULT_BROKERS } from '@/types';

let isSeedingInProgress = false;

async function cleanLegacyData() {
  try {
    // Remove all .RO positions (old Romanian stocks)
    const allPositions = await db.positions.toArray();
    const roPositionIds = allPositions
      .filter(p => p.symbol.endsWith('.RO') || p.broker === 'bcr' || p.broker === 'investimental')
      .map(p => p.id)
      .filter((id): id is number => id !== undefined);
    
    if (roPositionIds.length > 0) {
      await db.positions.bulkDelete(roPositionIds);
      console.log(`Cleaned ${roPositionIds.length} legacy Romanian positions`);
    }

    // Remove old brokers
    await db.brokers.where('id').anyOf(['bcr', 'investimental']).delete();
  } catch (err) {
    console.error('Legacy data cleanup error:', err);
  }
}

export async function initDefaultBrokers() {
  if (isSeedingInProgress) return;
  isSeedingInProgress = true;
  await cleanLegacyData();

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
              cashCurrency: b.id === 'degiro' ? 'EUR' : 'USD',
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
      // Demo Positions: US & European Giants
      const demoPositions = [
        { symbol: 'NVDA', shares: 10, buyPrice: 118.50, currency: 'USD', exchange: 'NASDAQ', broker: 't212', notes: 'NVIDIA Corp (AI GPU leader)', buyDate: '2025-01-15' },
        { symbol: 'MSFT', shares: 5, buyPrice: 420.00, currency: 'USD', exchange: 'NASDAQ', broker: 't212', notes: 'Microsoft Corp (Cloud & Copilot)', buyDate: '2025-02-01' },
        { symbol: 'ASML', shares: 2, buyPrice: 850.00, currency: 'USD', exchange: 'NASDAQ', broker: 'ibkr', notes: 'ASML Holding (EUV Lithography)', buyDate: '2025-01-20' },
        { symbol: 'PLTR', shares: 25, buyPrice: 58.00, currency: 'USD', exchange: 'NASDAQ', broker: 'revolut', notes: 'Palantir AIP Enterprise', buyDate: '2025-02-10' },
        { symbol: 'SAP.DE', shares: 6, buyPrice: 215.00, currency: 'EUR', exchange: 'XETRA', broker: 'degiro', notes: 'SAP SE Cloud ERP', buyDate: '2025-02-15' },
      ];

      for (const p of demoPositions) {
        await db.positions.add({
          ...p,
          createdAt: new Date().toISOString(),
        });
      }

      const watchlistSymbols = ['NVDA', 'MSFT', 'ASML', 'PLTR', 'RHM.DE', 'NVO', 'AAPL', 'AMZN'];
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
