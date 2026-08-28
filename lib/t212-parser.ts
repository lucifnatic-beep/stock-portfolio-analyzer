import type { Position } from '@/types';

export interface T212ParsedPosition {
  symbol: string;
  name: string;
  isin: string;
  shares: number;
  avgPrice: number;
  currency: string;
  buyDate: string;
  totalCost: number;
}

export function parseT212CSV(csvText: string): T212ParsedPosition[] {
  const lines = csvText.trim().split('\n');
  const transactions: Array<{
    action: string;
    time: string;
    isin: string;
    ticker: string;
    name: string;
    shares: number;
    price: number;
    currency: string;
    exchangeRate: number;
    total: number;
    totalCurrency: string;
  }> = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.toLowerCase().startsWith('action,')) continue;

    // Parse CSV line respecting quotes
    const tokens: string[] = [];
    let cur = '';
    let inQuote = false;

    for (let j = 0; j < line.length; j++) {
      const c = line[j];
      if (c === '"') {
        inQuote = !inQuote;
      } else if (c === ',' && !inQuote) {
        tokens.push(cur.trim());
        cur = '';
      } else {
        cur += c;
      }
    }
    tokens.push(cur.trim());

    if (tokens.length >= 8) {
      const action = tokens[0].replace(/^"|"$/g, '');
      const time = tokens[1].replace(/^"|"$/g, '');
      const isin = tokens[2].replace(/^"|"$/g, '');
      const ticker = tokens[3].replace(/^"|"$/g, '');
      const name = tokens[4].replace(/^"|"$/g, '');
      const shares = parseFloat(tokens[6].replace(/^"|"$/g, '')) || 0;
      const price = parseFloat(tokens[7].replace(/^"|"$/g, '')) || 0;
      const currency = tokens[8].replace(/^"|"$/g, '') || 'USD';
      const exchangeRate = parseFloat(tokens[9]?.replace(/^"|"$/g, '')) || 1;
      const total = parseFloat(tokens[12]?.replace(/^"|"$/g, '')) || 0;
      const totalCurrency = tokens[13]?.replace(/^"|"$/g, '') || '';

      transactions.push({
        action,
        time,
        isin,
        ticker,
        name,
        shares,
        price,
        currency,
        exchangeRate,
        total,
        totalCurrency,
      });
    }
  }

  // Ticker to Yahoo Finance symbol mapping
  function mapYahooSymbol(ticker: string, isin: string, currency: string): string {
    const cleanTicker = ticker.trim().toUpperCase();
    const cleanIsin = isin.trim().toUpperCase();

    if (cleanIsin === 'LU1681048630' || cleanTicker === 'GLUX') return 'GLUX.DE';
    if (cleanIsin === 'US67066G1040' && currency === 'EUR') return 'NVD.DE';
    if (cleanIsin === 'US67066G1040' && currency === 'USD') return 'NVDA';
    if (cleanIsin === 'US20825C1045' && currency === 'EUR') return 'YCP.DE';
    if (cleanIsin === 'US20825C1045' && currency === 'USD') return 'COP';
    if (cleanIsin === 'US8740391003') return 'TSM';

    return cleanTicker;
  }

  // Calculate open positions
  const positionsMap: Record<string, {
    ticker: string;
    isin: string;
    name: string;
    shares: number;
    totalCost: number;
    currency: string;
    buyDate: string;
  }> = {};

  for (const t of transactions) {
    const yahooSymbol = mapYahooSymbol(t.ticker, t.isin, t.currency);
    const key = `${yahooSymbol}_${t.currency}`;

    if (!positionsMap[key]) {
      positionsMap[key] = {
        ticker: yahooSymbol,
        isin: t.isin,
        name: t.name,
        shares: 0,
        totalCost: 0,
        currency: t.currency,
        buyDate: t.time.split(' ')[0],
      };
    }

    const isBuy = t.action.toLowerCase().includes('buy');
    const isSell = t.action.toLowerCase().includes('sell');

    if (isBuy) {
      positionsMap[key].shares += t.shares;
      positionsMap[key].totalCost += t.shares * t.price;
      positionsMap[key].buyDate = t.time.split(' ')[0];
    } else if (isSell) {
      const prevShares = positionsMap[key].shares;
      positionsMap[key].shares -= t.shares;
      if (prevShares > 0) {
        const avgCost = positionsMap[key].totalCost / prevShares;
        positionsMap[key].totalCost -= t.shares * avgCost;
      }
    }
  }

  const openPositions: T212ParsedPosition[] = [];

  for (const pos of Object.values(positionsMap)) {
    if (pos.shares > 0.000001) {
      const avgPrice = pos.totalCost / pos.shares;
      openPositions.push({
        symbol: pos.ticker,
        name: pos.name,
        isin: pos.isin,
        shares: Number(pos.shares.toFixed(8)),
        avgPrice: Number(avgPrice.toFixed(4)),
        currency: pos.currency,
        buyDate: pos.buyDate,
        totalCost: Number(pos.totalCost.toFixed(2)),
      });
    }
  }

  return openPositions;
}
