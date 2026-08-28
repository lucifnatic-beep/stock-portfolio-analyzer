import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

let cachedRates: { rates: Record<string, number>; timestamp: number } | null = null;

export async function GET() {
  if (cachedRates && Date.now() - cachedRates.timestamp < 60000) {
    return NextResponse.json(cachedRates.rates);
  }

  try {
    const [usdron, eurron, eurusd, gbpusd, gbpron] = await Promise.all([
      yahooFinance.quote('USDRON=X').catch(() => null) as Promise<any>,
      yahooFinance.quote('EURRON=X').catch(() => null) as Promise<any>,
      yahooFinance.quote('EURUSD=X').catch(() => null) as Promise<any>,
      yahooFinance.quote('GBPUSD=X').catch(() => null) as Promise<any>,
      yahooFinance.quote('GBPRON=X').catch(() => null) as Promise<any>,
    ]);

    const USDRON = usdron?.regularMarketPrice || 4.51;
    const EURRON = eurron?.regularMarketPrice || 5.25;
    const EURUSD = eurusd?.regularMarketPrice || 1.16;
    const GBPUSD = gbpusd?.regularMarketPrice || 1.34;
    const GBPRON = gbpron?.regularMarketPrice || (GBPUSD * USDRON) || 6.04;
    const EURGBP = EURUSD / GBPUSD;

    const rates: Record<string, number> = {
      // Direct pairs
      'USD_RON': USDRON,
      'RON_USD': 1 / USDRON,
      'EUR_RON': EURRON,
      'RON_EUR': 1 / EURRON,
      'GBP_RON': GBPRON,
      'RON_GBP': 1 / GBPRON,

      'EUR_USD': EURUSD,
      'USD_EUR': 1 / EURUSD,
      'GBP_USD': GBPUSD,
      'USD_GBP': 1 / GBPUSD,

      'EUR_GBP': EURGBP,
      'GBP_EUR': 1 / EURGBP,

      // Identity pairs
      'USD_USD': 1,
      'EUR_EUR': 1,
      'GBP_GBP': 1,
      'RON_RON': 1,
    };

    cachedRates = { rates, timestamp: Date.now() };
    return NextResponse.json(rates);
  } catch (error) {
    console.error('FX fetch error:', error);
    // Fallback static rates
    return NextResponse.json({
      'USD_RON': 4.51,
      'RON_USD': 0.22,
      'EUR_RON': 5.25,
      'RON_EUR': 0.19,
      'GBP_RON': 6.04,
      'RON_GBP': 0.165,
      'EUR_USD': 1.16,
      'USD_EUR': 0.86,
      'GBP_USD': 1.34,
      'USD_GBP': 0.75,
      'EUR_GBP': 0.87,
      'GBP_EUR': 1.15,
      'USD_USD': 1,
      'EUR_EUR': 1,
      'GBP_GBP': 1,
      'RON_RON': 1,
    });
  }
}
