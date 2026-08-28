// Stock & Market Types
export interface OHLCV {
  time: string; // YYYY-MM-DD
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface StockQuote {
  symbol: string;
  shortName: string;
  longName?: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  regularMarketVolume: number;
  regularMarketPreviousClose: number;
  regularMarketOpen: number;
  regularMarketDayHigh: number;
  regularMarketDayLow: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  marketCap?: number;
  currency: string;
  exchange: string;
}

export interface StockFundamentals {
  symbol: string;
  shortName: string;
  sector?: string;
  industry?: string;
  marketCap?: number;
  enterpriseValue?: number;
  trailingPE?: number;
  forwardPE?: number;
  pegRatio?: number;
  priceToBook?: number;
  trailingEps?: number;
  forwardEps?: number;
  revenueGrowth?: number;
  earningsGrowth?: number;
  profitMargin?: number;
  operatingMargin?: number;
  returnOnEquity?: number;
  debtToEquity?: number;
  dividendYield?: number;
  dividendRate?: number;
  payoutRatio?: number;
  beta?: number;
  fiftyDayAverage?: number;
  twoHundredDayAverage?: number;
  targetMeanPrice?: number;
  recommendationKey?: string;
  numberOfAnalystOpinions?: number;
}

export interface SearchResult {
  symbol: string;
  shortName: string;
  longName?: string;
  exchange: string;
  type: string;
}

// Broker Definition
export interface Broker {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  cash?: number;
  cashCurrency?: string;
}

export const DEFAULT_BROKERS: Broker[] = [
  { id: 'all', name: 'All Portfolios', color: '#6366f1' },
  { id: 't212', name: 'Trading 212', color: '#3b82f6', cash: 0, cashCurrency: 'USD' },
  { id: 'bcr', name: 'BCR Broker', color: '#f59e0b', cash: 1126.94, cashCurrency: 'USD' },
  { id: 'investimental', name: 'Investimental', color: '#10b981', cash: 0, cashCurrency: 'USD' },
];

// Portfolio Types
export interface Position {
  id?: number;
  symbol: string;
  shares: number;
  buyPrice: number;
  buyDate: string;
  currency: string;
  exchange: string;
  broker?: string; // 't212' | 'bcr' | 'investimental' | custom
  notes?: string;
  createdAt: string;
}

export interface PositionWithQuote extends Position {
  currentPrice: number;
  marketValue: number;
  totalCost: number;
  profitLoss: number;
  profitLossPercent: number;
  dayChange: number;
  dayChangePercent: number;
  shortName: string;
  convertedBuyPrice: number;
  convertedCurrentPrice: number;
  convertedMarketValue: number;
  convertedTotalCost: number;
  convertedProfitLoss: number;
  convertedDayChange: number;
  baseCurrency: string;
}

export interface PortfolioSummary {
  totalValue: number;
  totalCost: number;
  totalProfitLoss: number;
  totalProfitLossPercent: number;
  dayChange: number;
  dayChangePercent: number;
  positionCount: number;
  cashBalance?: number;
  totalWithCash?: number;
}

export interface DividendRecord {
  id?: number;
  symbol: string;
  broker: string;
  grossAmount: number;
  netAmount: number;
  tax: number;
  currency: string;
  date: string;
  notes?: string;
}

// Watchlist Types
export interface WatchlistItem {
  id?: number;
  symbol: string;
  addedAt: string;
}

// Price Alert Types
export type AlertDirection = 'above' | 'below';

export interface PriceAlert {
  id?: number;
  symbol: string;
  targetPrice: number;
  direction: AlertDirection;
  active: boolean;
  triggered: boolean;
  triggeredAt?: string;
  createdAt: string;
}

// Indicator Types
export interface IndicatorData {
  time: string;
  value: number;
}

export interface BollingerBandsData {
  time: string;
  upper: number;
  middle: number;
  lower: number;
}

export interface MACDData {
  time: string;
  macd: number;
  signal: number;
  histogram: number;
}

export type Timeframe = '1d' | '5d' | '1mo' | '3mo' | '6mo' | '1y' | '2y' | '5y' | 'max';

export type IndicatorType = 'sma20' | 'sma50' | 'ema12' | 'ema26' | 'bollinger' | 'rsi' | 'macd' | 'volume';

export type ChartType = 'candlestick' | 'line';

// i18n Types
export type Locale = 'ro' | 'en';

export interface Translation {
  [key: string]: string | Translation;
}

// Exchange mapping for Yahoo Finance suffixes
export const EXCHANGE_SUFFIXES: Record<string, string> = {
  'NYSE': '',
  'NASDAQ': '',
  'XETRA': '.DE',
  'BVB': '.RO',
  'BORSA_ITALIANA': '.MI',
  'EURONEXT_AMSTERDAM': '.AS',
  'EURONEXT_PARIS': '.PA',
};

export const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP', 'RON'] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];
