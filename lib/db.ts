import Dexie, { type EntityTable } from 'dexie';
import type { Position, WatchlistItem, PriceAlert, Broker, DividendRecord } from '@/types';

const db = new Dexie('StockPortfolioAnalyzer') as Dexie & {
  positions: EntityTable<Position, 'id'>;
  watchlist: EntityTable<WatchlistItem, 'id'>;
  priceAlerts: EntityTable<PriceAlert, 'id'>;
  brokers: EntityTable<Broker, 'id'>;
  dividends: EntityTable<DividendRecord, 'id'>;
};

db.version(1).stores({
  positions: '++id, symbol, buyDate, exchange, currency, createdAt',
  watchlist: '++id, symbol, addedAt',
  priceAlerts: '++id, symbol, active, triggered, createdAt',
});

db.version(2).stores({
  positions: '++id, symbol, buyDate, exchange, currency, broker, createdAt',
  watchlist: '++id, symbol, addedAt',
  priceAlerts: '++id, symbol, active, triggered, createdAt',
  brokers: 'id, name, color, cash',
  dividends: '++id, symbol, broker, date',
});

export { db };
