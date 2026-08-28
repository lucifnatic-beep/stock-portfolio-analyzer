import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

let cachedRates: { rates: Record<string, number>; timestamp: number } | null = null;

export async function GET() {
  if (cachedRates && Date.now() - cachedRates.timestamp < 60000) {
    return NextResponse.json(cachedRates.rates);
  }

  try {
    const [usdron, eurron, eurusd] = await Promise.all([
      yahooFinance.quote('USDRON=X') as Promise<any>,
      yahooFinance.quote('EURRON=X') as Promise<any>,
      yahooFinance.quote('EURUSD=X') as Promise<any>,
    ]);

    const USDRON = usdron?.regularMarketPrice || 4.51;
    const EURRON = eurron?.regularMarketPrice || 5.25;
    const EURUSD = eurusd?.regularMarketPrice || 1.16;

    const rates: Record<string, number> = {
      'USD_RON': USDRON,
      'EUR_RON': EURRON,
      'EUR_USD': EURUSD,
      'USD_EUR': 1 / EURUSD,
      'RON_USD': 1 / USDRON,
      'RON_EUR': 1 / EURRON,
      'USD_USD': 1,
      'EUR_EUR': 1,
      'RON_RON': 1,
    };

    cachedRates = { rates, timestamp: Date.now() };
    return NextResponse.json(rates);
  } catch (error) {
    console.error('FX fetch error:', error);
    // Fallback static rates
    return NextResponse.json({
      'USD_RON': 4.51,
      'EUR_RON': 5.25,
      'EUR_USD': 1.16,
      'USD_EUR': 0.86,
      'RON_USD': 0.22,
      'RON_EUR': 0.19,
      'USD_USD': 1,
      'EUR_EUR': 1,
      'RON_RON': 1,
    });
  }
}
