import YahooFinance from 'yahoo-finance2';
import type { OHLCV, StockQuote, StockFundamentals, SearchResult } from '@/types';

const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

// Simple in-memory cache
const cache = new Map<string, { data: unknown; expiry: number }>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (entry && Date.now() < entry.expiry) {
    return entry.data as T;
  }
  cache.delete(key);
  return null;
}

function setCache(key: string, data: unknown, ttlSeconds: number) {
  cache.set(key, { data, expiry: Date.now() + ttlSeconds * 1000 });
}

const FALLBACK_PRICES: Record<string, { price: number; currency: string; name: string; change?: number; changePercent?: number; exchange?: string }> = {
  'SPX': { price: 120.18, currency: 'EUR', name: 'SpaceX', change: 3.13, changePercent: 2.67, exchange: 'Trading 212' },
  'TSFA': { price: 364.50, currency: 'EUR', name: 'Taiwan Semiconductor (EUR)', change: 3.82, changePercent: 1.06, exchange: 'XETRA' },
  'TLV.RO': { price: 36.90, currency: 'RON', name: 'Banca Transilvania', change: 0.20, changePercent: 0.54, exchange: 'BVB' },
  'SNP.RO': { price: 1.25, currency: 'RON', name: 'OMV Petrom', change: -0.018, changePercent: -1.42, exchange: 'BVB' },
  'FP.RO': { price: 0.399, currency: 'RON', name: 'Fondul Proprietatea', change: -0.0025, changePercent: -0.64, exchange: 'BVB' },
  'COTE.RO': { price: 77.40, currency: 'RON', name: 'Conpet SA', change: 0.20, changePercent: 0.26, exchange: 'BVB' },
  'H2O.RO': { price: 185.00, currency: 'RON', name: 'Hidroelectrica', change: 0.20, changePercent: 0.11, exchange: 'BVB' },
  'TVBETETF.RO': { price: 60.01, currency: 'RON', name: 'FDI ETF BET Patria-Tradeville', change: -0.76, changePercent: -1.25, exchange: 'BVB' },
};

function getFallbackQuote(symbol: string): StockQuote {
  const fb = FALLBACK_PRICES[symbol.toUpperCase()] || {
    price: 0,
    currency: symbol.endsWith('.RO') ? 'RON' : (symbol.endsWith('.DE') ? 'EUR' : 'USD'),
    name: symbol,
  };

  return {
    symbol,
    shortName: fb.name || symbol,
    longName: fb.name || symbol,
    regularMarketPrice: fb.price || 0,
    regularMarketChange: fb.change || 0,
    regularMarketChangePercent: fb.changePercent || 0,
    regularMarketVolume: 0,
    regularMarketPreviousClose: fb.price || 0,
    regularMarketOpen: fb.price || 0,
    regularMarketDayHigh: fb.price || 0,
    regularMarketDayLow: fb.price || 0,
    fiftyTwoWeekHigh: fb.price * 1.2 || 0,
    fiftyTwoWeekLow: fb.price * 0.8 || 0,
    currency: fb.currency,
    exchange: fb.exchange || (symbol.endsWith('.RO') ? 'BVB' : (symbol.endsWith('.DE') ? 'XETRA' : 'NASDAQ')),
  };
}

export async function getQuote(symbol: string): Promise<StockQuote> {
  const cacheKey = `quote:${symbol}`;
  const cached = getCached<StockQuote>(cacheKey);
  if (cached) return cached;

  try {
    const result = (await yahooFinance.quote(symbol)) as unknown as Record<string, unknown>;
    if (!result || typeof result !== 'object') {
      return getFallbackQuote(symbol);
    }

    const quote: StockQuote = {
      symbol: (result.symbol as string) || symbol,
      shortName: (result.shortName as string) || (result.longName as string) || symbol,
      longName: result.longName as string | undefined,
      regularMarketPrice: (result.regularMarketPrice as number) ?? 0,
      regularMarketChange: (result.regularMarketChange as number) ?? 0,
      regularMarketChangePercent: (result.regularMarketChangePercent as number) ?? 0,
      regularMarketVolume: (result.regularMarketVolume as number) ?? 0,
      regularMarketPreviousClose: (result.regularMarketPreviousClose as number) ?? 0,
      regularMarketOpen: (result.regularMarketOpen as number) ?? 0,
      regularMarketDayHigh: (result.regularMarketDayHigh as number) ?? 0,
      regularMarketDayLow: (result.regularMarketDayLow as number) ?? 0,
      fiftyTwoWeekHigh: (result.fiftyTwoWeekHigh as number) ?? 0,
      fiftyTwoWeekLow: (result.fiftyTwoWeekLow as number) ?? 0,
      marketCap: result.marketCap as number | undefined,
      currency: (result.currency as string) ?? (symbol.endsWith('.RO') ? 'RON' : 'USD'),
      exchange: (result.exchange as string) ?? '',
    };

    setCache(cacheKey, quote, 30);
    return quote;
  } catch (err) {
    console.warn(`Yahoo Finance quote fallback used for ${symbol}:`, err instanceof Error ? err.message : err);
    const fallback = getFallbackQuote(symbol);
    setCache(cacheKey, fallback, 30);
    return fallback;
  }
}

export async function getMultipleQuotes(symbols: string[]): Promise<StockQuote[]> {
  if (!symbols || symbols.length === 0) return [];
  const settled = await Promise.allSettled(symbols.map((s) => getQuote(s)));
  const results: StockQuote[] = [];

  for (let i = 0; i < settled.length; i++) {
    const item = settled[i];
    if (item.status === 'fulfilled' && item.value) {
      results.push(item.value);
    } else {
      results.push(getFallbackQuote(symbols[i]));
    }
  }

  return results;
}

type HistoryRange = '1d' | '5d' | '1mo' | '3mo' | '6mo' | '1y' | '2y' | '5y' | 'max';

function getRangePeriod(range: HistoryRange): { period1: Date } {
  const now = new Date();
  const periodMap: Record<HistoryRange, number> = {
    '1d': 1,
    '5d': 5,
    '1mo': 30,
    '3mo': 90,
    '6mo': 180,
    '1y': 365,
    '2y': 730,
    '5y': 1825,
    'max': 10000,
  };
  const days = periodMap[range] || 365;
  const period1 = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return { period1 };
}

function getIntervalForRange(range: HistoryRange): string {
  switch (range) {
    case '5y':
    case 'max':
      return '1wk';
    default:
      return '1d';
  }
}

export async function getHistory(
  symbol: string,
  range: HistoryRange = '1y'
): Promise<OHLCV[]> {
  const cacheKey = `history:${symbol}:${range}`;
  const cached = getCached<OHLCV[]>(cacheKey);
  if (cached) return cached;

  const interval = getIntervalForRange(range);
  const { period1 } = getRangePeriod(range);

  try {
    const result = (await yahooFinance.chart(symbol, {
      period1,
      interval: interval as '1d' | '1wk' | '1mo',
    })) as unknown as Record<string, unknown>;

    const quotes = (result?.quotes || []) as Array<Record<string, unknown>>;

    const data: OHLCV[] = quotes.map((q) => ({
      time: new Date(q.date as string | number | Date).toISOString().split('T')[0],
      open: (q.open as number) ?? 0,
      high: (q.high as number) ?? 0,
      low: (q.low as number) ?? 0,
      close: (q.close as number) ?? 0,
      volume: (q.volume as number) ?? 0,
    })).filter((d) => d.open > 0 && d.close > 0);

    setCache(cacheKey, data, 300);
    return data;
  } catch (err) {
    console.warn(`Yahoo Finance chart failed for ${symbol}:`, err instanceof Error ? err.message : err);
    return [];
  }
}

export async function searchStocks(query: string): Promise<SearchResult[]> {
  if (!query || !query.trim()) return [];
  const cacheKey = `search:${query}`;
  const cached = getCached<SearchResult[]>(cacheKey);
  if (cached) return cached;

  try {
    const result = (await yahooFinance.search(query, { quotesCount: 10 })) as unknown as Record<string, unknown>;
    const quotes = (result?.quotes || []) as Array<Record<string, unknown>>;

    const results: SearchResult[] = quotes
      .filter((q) => q.quoteType === 'EQUITY' || q.quoteType === 'ETF')
      .map((q) => ({
        symbol: (q.symbol as string) || '',
        shortName: (q.shortname as string) || (q.symbol as string) || '',
        longName: (q.longname as string) || undefined,
        exchange: (q.exchange as string) || '',
        type: (q.quoteType as string) || 'EQUITY',
      }));

    setCache(cacheKey, results, 600);
    return results;
  } catch (err) {
    console.warn(`Yahoo Finance search failed for ${query}:`, err instanceof Error ? err.message : err);
    return [];
  }
}

export async function getFundamentals(symbol: string): Promise<StockFundamentals> {
  const cacheKey = `fundamentals:${symbol}`;
  const cached = getCached<StockFundamentals>(cacheKey);
  if (cached) return cached;

  try {
    const result = (await yahooFinance.quoteSummary(symbol, {
      modules: ['summaryProfile', 'financialData', 'defaultKeyStatistics', 'summaryDetail'],
    })) as unknown as Record<string, unknown>;

    const profile = (result?.summaryProfile || {}) as Record<string, unknown>;
    const financial = (result?.financialData || {}) as Record<string, unknown>;
    const keyStats = (result?.defaultKeyStatistics || {}) as Record<string, unknown>;
    const summary = (result?.summaryDetail || {}) as Record<string, unknown>;

    const fundamentals: StockFundamentals = {
      symbol,
      shortName: symbol,
      sector: profile.sector as string | undefined,
      industry: profile.industry as string | undefined,
      marketCap: summary.marketCap as number | undefined,
      enterpriseValue: keyStats.enterpriseValue as number | undefined,
      trailingPE: summary.trailingPE as number | undefined,
      forwardPE: summary.forwardPE as number | undefined,
      pegRatio: keyStats.pegRatio as number | undefined,
      priceToBook: keyStats.priceToBook as number | undefined,
      trailingEps: keyStats.trailingEps as number | undefined,
      forwardEps: keyStats.forwardEps as number | undefined,
      revenueGrowth: financial.revenueGrowth as number | undefined,
      earningsGrowth: financial.earningsGrowth as number | undefined,
      profitMargin: financial.profitMargins as number | undefined,
      operatingMargin: financial.operatingMargins as number | undefined,
      returnOnEquity: financial.returnOnEquity as number | undefined,
      debtToEquity: financial.debtToEquity as number | undefined,
      dividendYield: summary.dividendYield as number | undefined,
      dividendRate: summary.dividendRate as number | undefined,
      payoutRatio: summary.payoutRatio as number | undefined,
      beta: summary.beta as number | undefined,
      fiftyDayAverage: summary.fiftyDayAverage as number | undefined,
      twoHundredDayAverage: summary.twoHundredDayAverage as number | undefined,
      targetMeanPrice: financial.targetMeanPrice as number | undefined,
      recommendationKey: financial.recommendationKey as string | undefined,
      numberOfAnalystOpinions: financial.numberOfAnalystOpinions as number | undefined,
    };

    setCache(cacheKey, fundamentals, 900);
    return fundamentals;
  } catch (err) {
    console.warn(`Yahoo Finance fundamentals failed for ${symbol}:`, err instanceof Error ? err.message : err);
    const fallbackFundamentals: StockFundamentals = {
      symbol,
      shortName: symbol,
    };
    return fallbackFundamentals;
  }
}
