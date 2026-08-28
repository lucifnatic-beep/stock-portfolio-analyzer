import type { Position, PositionWithQuote, PortfolioSummary } from '@/types';

export const DEFAULT_FX_RATES: Record<string, number> = {
  'USD_RON': 4.51,
  'RON_USD': 0.2217,
  'EUR_RON': 5.25,
  'RON_EUR': 0.1904,
  'GBP_RON': 6.04,
  'RON_GBP': 0.1655,
  'EUR_USD': 1.16,
  'USD_EUR': 0.862,
  'GBP_USD': 1.34,
  'USD_GBP': 0.746,
  'EUR_GBP': 0.865,
  'GBP_EUR': 1.155,
  'USD_USD': 1,
  'EUR_EUR': 1,
  'GBP_GBP': 1,
  'RON_RON': 1,
};

export function getFXRate(fromCurrency: string = 'USD', toCurrency: string = 'USD', rates: Record<string, number> = {}): number {
  const from = (fromCurrency || 'USD').toUpperCase();
  const to = (toCurrency || 'USD').toUpperCase();
  if (from === to) return 1;

  const mergedRates = { ...DEFAULT_FX_RATES, ...rates };
  const directKey = `${from}_${to}`;
  if (mergedRates[directKey] && mergedRates[directKey] > 0) return mergedRates[directKey];

  const reverseKey = `${to}_${from}`;
  if (mergedRates[reverseKey] && mergedRates[reverseKey] > 0) return 1 / mergedRates[reverseKey];

  // Derive via USD
  const toUSD = from === 'USD' ? 1 : mergedRates[`${from}_USD`] || (1 / (mergedRates[`USD_${from}`] || 1));
  const fromUSDToTarget = to === 'USD' ? 1 : mergedRates[`USD_${to}`] || (1 / (mergedRates[`${to}_USD`] || 1));
  return toUSD * fromUSDToTarget;
}

export function calculatePositionPL(
  position: Position,
  currentPrice: number,
  dayChange: number,
  dayChangePercent: number,
  shortName: string,
  baseCurrency: string = 'RON',
  fxRates: Record<string, number> = {}
): PositionWithQuote {
  const totalCost = position.shares * position.buyPrice;
  const marketValue = position.shares * currentPrice;
  const profitLoss = marketValue - totalCost;
  const profitLossPercent = totalCost > 0 ? (profitLoss / totalCost) * 100 : 0;

  const fxRate = getFXRate(position.currency, baseCurrency, fxRates);

  const convertedBuyPrice = position.buyPrice * fxRate;
  const convertedCurrentPrice = currentPrice * fxRate;
  const convertedMarketValue = marketValue * fxRate;
  const convertedTotalCost = totalCost * fxRate;
  const convertedProfitLoss = profitLoss * fxRate;
  const convertedDayChange = (dayChange * position.shares) * fxRate;

  return {
    ...position,
    currentPrice,
    marketValue,
    totalCost,
    profitLoss,
    profitLossPercent,
    dayChange: dayChange * position.shares,
    dayChangePercent,
    shortName,
    convertedBuyPrice,
    convertedCurrentPrice,
    convertedMarketValue,
    convertedTotalCost,
    convertedProfitLoss,
    convertedDayChange,
    baseCurrency,
  };
}

export function calculatePortfolioSummary(
  positions: PositionWithQuote[]
): PortfolioSummary {
  const totalValue = positions.reduce((sum, p) => sum + p.convertedMarketValue, 0);
  const totalCost = positions.reduce((sum, p) => sum + p.convertedTotalCost, 0);
  const totalProfitLoss = totalValue - totalCost;
  const totalProfitLossPercent = totalCost > 0 ? (totalProfitLoss / totalCost) * 100 : 0;
  const dayChange = positions.reduce((sum, p) => sum + p.convertedDayChange, 0);
  const dayChangePercent = totalValue > 0 ? (dayChange / (totalValue - dayChange)) * 100 : 0;

  return {
    totalValue,
    totalCost,
    totalProfitLoss,
    totalProfitLossPercent,
    dayChange,
    dayChangePercent,
    positionCount: positions.length,
  };
}

export function calculateAllocation(
  positions: PositionWithQuote[]
): { symbol: string; name: string; value: number; percent: number; color: string }[] {
  const totalValue = positions.reduce((sum, p) => sum + p.convertedMarketValue, 0);
  const colors = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
    '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
    '#14b8a6', '#e11d48', '#0ea5e9', '#a855f7', '#22c55e',
  ];

  return positions
    .map((p, i) => ({
      symbol: p.symbol,
      name: p.shortName || p.symbol,
      value: p.convertedMarketValue,
      percent: totalValue > 0 ? (p.convertedMarketValue / totalValue) * 100 : 0,
      color: colors[i % colors.length],
    }))
    .sort((a, b) => b.value - a.value);
}
