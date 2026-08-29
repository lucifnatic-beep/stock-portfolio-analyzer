import { NextResponse } from 'next/server';
import { getMultipleQuotes } from '@/lib/yahoo';

export const dynamic = 'force-dynamic';

export interface ETFDefinition {
  symbol: string;
  name: string;
  category: 'broad_market' | 'tech_ai' | 'dividends' | 'europe' | 'semiconductors' | 'commodities';
  categoryLabel: string;
  expenseRatio: string;
  benchmark: string;
  domicile: 'US' | 'EU (UCITS)';
}

export const TOP_ETFS: ETFDefinition[] = [
  {
    symbol: 'SPY',
    name: 'SPDR S&P 500 ETF Trust',
    category: 'broad_market',
    categoryLabel: '🇺🇸 US Large Cap (S&P 500)',
    expenseRatio: '0.09%',
    benchmark: 'S&P 500 Index',
    domicile: 'US',
  },
  {
    symbol: 'VOO',
    name: 'Vanguard S&P 500 ETF',
    category: 'broad_market',
    categoryLabel: '🇺🇸 US Large Cap (S&P 500)',
    expenseRatio: '0.03%',
    benchmark: 'S&P 500 Index',
    domicile: 'US',
  },
  {
    symbol: 'QQQ',
    name: 'Invesco QQQ Trust (Nasdaq 100)',
    category: 'tech_ai',
    categoryLabel: '🚀 Tech & Innovation (Nasdaq 100)',
    expenseRatio: '0.20%',
    benchmark: 'Nasdaq-100 Index',
    domicile: 'US',
  },
  {
    symbol: 'VWCE.DE',
    name: 'Vanguard FTSE All-World UCITS ETF',
    category: 'broad_market',
    categoryLabel: '🌍 Global All-World (UCITS)',
    expenseRatio: '0.22%',
    benchmark: 'FTSE All-World Index',
    domicile: 'EU (UCITS)',
  },
  {
    symbol: 'CSPX.L',
    name: 'iShares Core S&P 500 UCITS ETF',
    category: 'broad_market',
    categoryLabel: '🏛️ S&P 500 UCITS Accumulating',
    expenseRatio: '0.07%',
    benchmark: 'S&P 500 Net TR',
    domicile: 'EU (UCITS)',
  },
  {
    symbol: 'SMH',
    name: 'VanEck Semiconductor ETF',
    category: 'semiconductors',
    categoryLabel: '⚡ Semiconductor Giants (NVDA, TSM, ASML)',
    expenseRatio: '0.35%',
    benchmark: 'MVIS US Listed Semiconductor 25',
    domicile: 'US',
  },
  {
    symbol: 'SCHD',
    name: 'Schwab U.S. Dividend Equity ETF',
    category: 'dividends',
    categoryLabel: '💰 High Dividend & Cash Flow',
    expenseRatio: '0.06%',
    benchmark: 'Dow Jones U.S. Dividend 100',
    domicile: 'US',
  },
  {
    symbol: 'MEUD.PA',
    name: 'Lyxor Core STOXX Europe 600',
    category: 'europe',
    categoryLabel: '💎 Top 600 European Champions',
    expenseRatio: '0.07%',
    benchmark: 'STOXX Europe 600',
    domicile: 'EU (UCITS)',
  },
];

export async function GET() {
  try {
    const symbols = TOP_ETFS.map((e) => e.symbol);
    const quotes = await getMultipleQuotes(symbols);

    const quotesMap = new Map(quotes.map((q) => [q.symbol.toUpperCase(), q]));

    const enriched = TOP_ETFS.map((etf) => {
      const q = quotesMap.get(etf.symbol.toUpperCase());
      return {
        ...etf,
        currentPrice: q?.regularMarketPrice || 0,
        change: q?.regularMarketChange || 0,
        changePercent: q?.regularMarketChangePercent || 0,
        currency: q?.currency || (etf.domicile.includes('EU') ? 'EUR' : 'USD'),
        fiftyTwoWeekHigh: q?.fiftyTwoWeekHigh || 0,
        fiftyTwoWeekLow: q?.fiftyTwoWeekLow || 0,
      };
    });

    return NextResponse.json(enriched);
  } catch (error) {
    console.error('ETF Catalog API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ETF catalog' },
      { status: 500 }
    );
  }
}
