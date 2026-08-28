import { db } from '@/lib/db';
import { DEFAULT_BROKERS } from '@/types';

let isSeedingInProgress = false;
let hasSeededThisSession = false;

export async function deduplicateAndSeedPortfolio(force: boolean = false) {
  if ((hasSeededThisSession && !force) || isSeedingInProgress) {
    return;
  }

  isSeedingInProgress = true;

  try {
    await db.transaction('rw', [db.brokers, db.positions, db.watchlist], async () => {
      // 1. Initialize brokers with cash
      const bcrBroker = await db.brokers.get('bcr');
      if (bcrBroker) {
        if (!bcrBroker.cash || bcrBroker.cash === 0) {
          await db.brokers.update('bcr', { cash: 1126.94 });
        }
      } else {
        await db.brokers.put({
          id: 'bcr',
          name: 'BCR Broker',
          color: '#f59e0b',
          cash: 1126.94,
          cashCurrency: 'RON',
        });
      }

      for (const b of DEFAULT_BROKERS) {
        if (b.id !== 'all' && b.id !== 'bcr') {
          const existingBroker = await db.brokers.get(b.id);
          if (!existingBroker) {
            await db.brokers.put({
              id: b.id,
              name: b.name,
              color: b.color,
              cash: b.cash || 0,
              cashCurrency: b.cashCurrency || 'RON',
            });
          }
        }
      }

      // 2. Fix any legacy positions where broker is undefined/empty
      const allPositions = await db.positions.toArray();
      for (const p of allPositions) {
        if (!p.id) continue;
        if (!p.broker) {
          if (p.symbol.endsWith('.RO')) {
            if (p.symbol === 'TVBETETF.RO') {
              await db.positions.update(p.id, { broker: 'investimental' });
            } else {
              await db.positions.update(p.id, { broker: 'bcr' });
            }
          } else {
            await db.positions.update(p.id, { broker: 't212' });
          }
        }
      }

      // 3. Update BCR positions with latest live confirmed shares
      const bcrUpdates: Record<string, { shares: number; buyPrice: number }> = {
        'TLV.RO': { shares: 304, buyPrice: 22.6834 },
        'SNP.RO': { shares: 7419, buyPrice: 1.2428 },
        'FP.RO': { shares: 4538, buyPrice: 0.3989 },
        'COTE.RO': { shares: 29, buyPrice: 83.9448 },
        'H2O.RO': { shares: 9, buyPrice: 125.7111 },
      };

      const existingBcr = await db.positions.where('broker').equals('bcr').toArray();
      for (const pos of existingBcr) {
        if (pos.id && bcrUpdates[pos.symbol]) {
          const update = bcrUpdates[pos.symbol];
          if (pos.shares !== update.shares || pos.buyPrice !== update.buyPrice) {
            await db.positions.update(pos.id, {
              shares: update.shares,
              buyPrice: update.buyPrice,
            });
          }
        }
      }

      // 4. DEDUPLICATION CLEANUP: Clean any duplicate positions in IndexedDB
      const refreshedPositions = await db.positions.toArray();
      const seenKeys = new Map<string, number>();

      for (const p of refreshedPositions) {
        if (!p.id) continue;
        const b = p.broker || (p.symbol.endsWith('.RO') ? (p.symbol === 'TVBETETF.RO' ? 'investimental' : 'bcr') : 't212');
        const key = `${p.symbol.toUpperCase()}_${b.toLowerCase()}`;
        if (seenKeys.has(key)) {
          await db.positions.delete(p.id);
        } else {
          seenKeys.set(key, p.id);
        }
      }

      // 5. Ensure canonical positions exist for all 3 brokers
      const currentPositions = await db.positions.toArray();
      const existingKeySet = new Set(
        currentPositions.map((p) => `${p.symbol.toUpperCase()}_${(p.broker || 't212').toLowerCase()}`)
      );

      // Trading 212 Positions
      const t212Positions = [
        { symbol: 'NVD.DE', shares: 10.747367, buyPrice: 93.10, currency: 'EUR', exchange: 'XETRA', broker: 't212', notes: 'Nvidia (XETRA)', buyDate: '2025-04-16' },
        { symbol: 'TTWO', shares: 7.20184968, buyPrice: 241.5062, currency: 'USD', exchange: 'NASDAQ', broker: 't212', notes: 'Take-Two Interactive', buyDate: '2026-06-26' },
        { symbol: 'SPX', shares: 7.91113524, buyPrice: 120.96, currency: 'EUR', exchange: '', broker: 't212', notes: 'SpaceX', buyDate: '2026-08-27' },
        { symbol: 'YCP.DE', shares: 7.66260294, buyPrice: 77.1778, currency: 'EUR', exchange: 'XETRA', broker: 't212', notes: 'ConocoPhillips (XETRA)', buyDate: '2025-10-13' },
        { symbol: 'GILD', shares: 6.44237798, buyPrice: 112.08, currency: 'USD', exchange: 'NASDAQ', broker: 't212', notes: 'Gilead Sciences', buyDate: '2025-10-03' },
        { symbol: 'GLUX.DE', shares: 2.8617639, buyPrice: 174.7195, currency: 'EUR', exchange: 'XETRA', broker: 't212', notes: 'Amundi Global Luxury', buyDate: '2025-04-14' },
        { symbol: 'TSM', shares: 1.54258033, buyPrice: 218.45, currency: 'USD', exchange: 'NYSE', broker: 't212', notes: 'Taiwan Semiconductor', buyDate: '2025-10-13' },
        { symbol: 'UHS', shares: 2.74185109, buyPrice: 211.53, currency: 'USD', exchange: 'NYSE', broker: 't212', notes: 'Universal Health Services', buyDate: '2026-02-04' },
        { symbol: 'TSN', shares: 8.04582811, buyPrice: 60.50, currency: 'USD', exchange: 'NYSE', broker: 't212', notes: 'Tyson Foods', buyDate: '2026-01-15' },
        { symbol: 'UTI', shares: 14.52410079, buyPrice: 31.727, currency: 'USD', exchange: 'NYSE', broker: 't212', notes: 'Universal Technical Institute', buyDate: '2025-10-03' },
        { symbol: 'NVDA', shares: 0.21268067, buyPrice: 189.1615, currency: 'USD', exchange: 'NASDAQ', broker: 't212', notes: 'Nvidia Spend & Invest', buyDate: '2026-02-18' },
      ];

      // BCR Broker Positions (BVB)
      const bcrPositions = [
        { symbol: 'TLV.RO', shares: 304, buyPrice: 22.6834, currency: 'RON', exchange: 'BVB', broker: 'bcr', notes: 'Banca Transilvania', buyDate: '2024-01-31' },
        { symbol: 'SNP.RO', shares: 7419, buyPrice: 1.2428, currency: 'RON', exchange: 'BVB', broker: 'bcr', notes: 'OMV Petrom', buyDate: '2024-01-31' },
        { symbol: 'FP.RO', shares: 4538, buyPrice: 0.3989, currency: 'RON', exchange: 'BVB', broker: 'bcr', notes: 'Fondul Proprietatea', buyDate: '2024-01-31' },
        { symbol: 'COTE.RO', shares: 29, buyPrice: 83.9448, currency: 'RON', exchange: 'BVB', broker: 'bcr', notes: 'Conpet SA', buyDate: '2024-01-31' },
        { symbol: 'H2O.RO', shares: 9, buyPrice: 125.7111, currency: 'RON', exchange: 'BVB', broker: 'bcr', notes: 'Hidroelectrica', buyDate: '2024-01-31' },
      ];

      // Investimental Positions
      const investimentalPositions = [
        {
          symbol: 'TVBETETF.RO',
          shares: 69,
          buyPrice: 27.9921,
          currency: 'RON',
          exchange: 'BVB',
          broker: 'investimental',
          notes: 'FDI ETF BET Patria-Tradeville',
          buyDate: '2025-02-19',
        },
      ];

      const allDefaults = [...t212Positions, ...bcrPositions, ...investimentalPositions];

      for (const p of allDefaults) {
        const key = `${p.symbol.toUpperCase()}_${p.broker.toLowerCase()}`;
        if (!existingKeySet.has(key)) {
          await db.positions.add({
            ...p,
            createdAt: new Date().toISOString(),
          });
          existingKeySet.add(key);
        }
      }

      // Watchlist
      const allSymbols = ['TVBETETF.RO', 'TLV.RO', 'SNP.RO', 'FP.RO', 'H2O.RO', 'COTE.RO', 'NVDA', 'NVD.DE', 'TTWO', 'GILD', 'UHS', 'TSN', 'UTI', 'TSM', 'GLUX.DE'];
      for (const s of allSymbols) {
        const exists = await db.watchlist.where('symbol').equals(s).first();
        if (!exists) {
          await db.watchlist.add({
            symbol: s,
            addedAt: new Date().toISOString(),
          });
        }
      }
    });

    hasSeededThisSession = true;
  } catch (err) {
    console.error('Portfolio seeding transaction error:', err);
  } finally {
    isSeedingInProgress = false;
  }
}
