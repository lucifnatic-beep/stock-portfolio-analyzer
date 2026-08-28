import { SMA, EMA, RSI, MACD, BollingerBands } from 'trading-signals';
import type { OHLCV, IndicatorData, BollingerBandsData, MACDData } from '@/types';

export function calculateSMA(data: OHLCV[], period: number): IndicatorData[] {
  const sma = new SMA(period);
  const results: IndicatorData[] = [];

  for (const bar of data) {
    sma.update(bar.close, false);
    if (sma.isStable) {
      const val = sma.getResult();
      if (val !== null) {
        results.push({ time: bar.time, value: Number(val.toFixed(4)) });
      }
    }
  }

  return results;
}

export function calculateEMA(data: OHLCV[], period: number): IndicatorData[] {
  const ema = new EMA(period);
  const results: IndicatorData[] = [];

  for (const bar of data) {
    ema.update(bar.close, false);
    if (ema.isStable) {
      const val = ema.getResult();
      if (val !== null) {
        results.push({ time: bar.time, value: Number(val.toFixed(4)) });
      }
    }
  }

  return results;
}

export function calculateRSI(data: OHLCV[], period: number = 14): IndicatorData[] {
  const rsi = new RSI(period);
  const results: IndicatorData[] = [];

  for (const bar of data) {
    rsi.update(bar.close, false);
    if (rsi.isStable) {
      const val = rsi.getResult();
      if (val !== null) {
        results.push({ time: bar.time, value: Number(val.toFixed(2)) });
      }
    }
  }

  return results;
}

export function calculateMACD(
  data: OHLCV[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): MACDData[] {
  const macd = new MACD(
    new EMA(fastPeriod),
    new EMA(slowPeriod),
    new EMA(signalPeriod),
  );
  const results: MACDData[] = [];

  for (const bar of data) {
    macd.update(bar.close, false);
    if (macd.isStable) {
      const result = macd.getResult();
      if (result) {
        results.push({
          time: bar.time,
          macd: Number(result.macd.toFixed(4)),
          signal: Number(result.signal.toFixed(4)),
          histogram: Number(result.histogram.toFixed(4)),
        });
      }
    }
  }

  return results;
}

export function calculateBollingerBands(
  data: OHLCV[],
  period: number = 20,
  stdDev: number = 2
): BollingerBandsData[] {
  const bb = new BollingerBands(period, stdDev);
  const results: BollingerBandsData[] = [];

  for (const bar of data) {
    bb.update(bar.close, false);
    if (bb.isStable) {
      const result = bb.getResult();
      if (result) {
        results.push({
          time: bar.time,
          upper: Number(result.upper.toFixed(4)),
          middle: Number(result.middle.toFixed(4)),
          lower: Number(result.lower.toFixed(4)),
        });
      }
    }
  }

  return results;
}

export type SignalStrength = 'strong_buy' | 'buy' | 'neutral' | 'sell' | 'strong_sell';

export interface SignalSummary {
  overall: SignalStrength;
  rsi: { value: number; signal: SignalStrength };
  macd: { signal: SignalStrength; histogram: number };
  sma20: { signal: SignalStrength; price: number; sma: number };
  sma50: { signal: SignalStrength; price: number; sma: number };
  bollinger: { signal: SignalStrength; position: string };
}

export function generateSignalSummary(data: OHLCV[]): SignalSummary {
  if (data.length < 50) {
    return {
      overall: 'neutral',
      rsi: { value: 50, signal: 'neutral' },
      macd: { signal: 'neutral', histogram: 0 },
      sma20: { signal: 'neutral', price: 0, sma: 0 },
      sma50: { signal: 'neutral', price: 0, sma: 0 },
      bollinger: { signal: 'neutral', position: 'middle' },
    };
  }

  const currentPrice = data[data.length - 1].close;

  // RSI
  const rsiData = calculateRSI(data);
  const lastRSI = rsiData[rsiData.length - 1]?.value ?? 50;
  let rsiSignal: SignalStrength = 'neutral';
  if (lastRSI < 30) rsiSignal = 'strong_buy';
  else if (lastRSI < 40) rsiSignal = 'buy';
  else if (lastRSI > 70) rsiSignal = 'strong_sell';
  else if (lastRSI > 60) rsiSignal = 'sell';

  // MACD
  const macdData = calculateMACD(data);
  const lastMACD = macdData[macdData.length - 1];
  let macdSignal: SignalStrength = 'neutral';
  if (lastMACD) {
    if (lastMACD.histogram > 0 && lastMACD.macd > 0) macdSignal = 'buy';
    else if (lastMACD.histogram > 0 && lastMACD.macd > lastMACD.signal) macdSignal = 'strong_buy';
    else if (lastMACD.histogram < 0 && lastMACD.macd < 0) macdSignal = 'sell';
    else if (lastMACD.histogram < 0 && lastMACD.macd < lastMACD.signal) macdSignal = 'strong_sell';
  }

  // SMA 20
  const sma20Data = calculateSMA(data, 20);
  const lastSMA20 = sma20Data[sma20Data.length - 1]?.value ?? currentPrice;
  let sma20Signal: SignalStrength = 'neutral';
  if (currentPrice > lastSMA20 * 1.02) sma20Signal = 'buy';
  else if (currentPrice < lastSMA20 * 0.98) sma20Signal = 'sell';

  // SMA 50
  const sma50Data = calculateSMA(data, 50);
  const lastSMA50 = sma50Data[sma50Data.length - 1]?.value ?? currentPrice;
  let sma50Signal: SignalStrength = 'neutral';
  if (currentPrice > lastSMA50 * 1.02) sma50Signal = 'buy';
  else if (currentPrice < lastSMA50 * 0.98) sma50Signal = 'sell';

  // Bollinger Bands
  const bbData = calculateBollingerBands(data);
  const lastBB = bbData[bbData.length - 1];
  let bbSignal: SignalStrength = 'neutral';
  let bbPosition = 'middle';
  if (lastBB) {
    if (currentPrice <= lastBB.lower) { bbSignal = 'strong_buy'; bbPosition = 'below lower'; }
    else if (currentPrice >= lastBB.upper) { bbSignal = 'strong_sell'; bbPosition = 'above upper'; }
    else if (currentPrice < lastBB.middle) { bbSignal = 'buy'; bbPosition = 'lower half'; }
    else { bbSignal = 'sell'; bbPosition = 'upper half'; }
  }

  // Overall
  const signalScores: Record<SignalStrength, number> = {
    strong_buy: 2, buy: 1, neutral: 0, sell: -1, strong_sell: -2,
  };
  const totalScore =
    signalScores[rsiSignal] +
    signalScores[macdSignal] +
    signalScores[sma20Signal] +
    signalScores[sma50Signal] +
    signalScores[bbSignal];

  let overall: SignalStrength = 'neutral';
  if (totalScore >= 4) overall = 'strong_buy';
  else if (totalScore >= 2) overall = 'buy';
  else if (totalScore <= -4) overall = 'strong_sell';
  else if (totalScore <= -2) overall = 'sell';

  return {
    overall,
    rsi: { value: lastRSI, signal: rsiSignal },
    macd: { signal: macdSignal, histogram: lastMACD?.histogram ?? 0 },
    sma20: { signal: sma20Signal, price: currentPrice, sma: lastSMA20 },
    sma50: { signal: sma50Signal, price: currentPrice, sma: lastSMA50 },
    bollinger: { signal: bbSignal, position: bbPosition },
  };
}
