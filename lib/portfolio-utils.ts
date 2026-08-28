import type { Position, PositionWithQuote, PortfolioSummary } from '@/types';

export const DEFAULT_FX_RATES: Record<string, number> = {
  'USD_RON': 4.51,
  'EUR_RON': 5.25,
  'EUR_USD': 1.16,
  'USD_EUR': 0.86,
  'RON_USD': 0.22,
  'RON_EUR': 0.19,
  'USD_USD': 1,
  'EUR_EUR': 1,
  'RON_RON': 1,
};

export function getFXRate(fromCurrency: string, toCurrency: string, rates: Record<string, number> = {}): number {
  if (fromCurrency === toCurrency) return 1;
  const mergedRates = { ...DEFAULT_FX_RATES, ...rates };
  const key = `${fromCurrency.toUpperCase()}_${toCurrency.toUpperCase()}`;
  if (mergedRates[key]) return mergedRates[key];

  // Derive via USD
  const toUSD = fromCurrency === 'USD' ? 1 : mergedRates[`${fromCurrency}_USD`] || (1 / (mergedRates[`USD_${fromCurrency}`] || 1));
  const fromUSDToTarget = toCurrency === 'USD' ? 1 : mergedRates[`USD_${toCurrency}`] || 1;
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
