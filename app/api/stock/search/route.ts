import { NextRequest, NextResponse } from 'next/server';
import { searchStocks } from '@/lib/yahoo';

// Common typo corrections & colloquial names
const TYPO_MAP: Record<string, string> = {
  'aple': 'apple', 'appl': 'apple', 'appple': 'apple',
  'nvidea': 'nvidia', 'nvida': 'nvidia', 'nviida': 'nvidia',
  'microsft': 'microsoft', 'mircosoft': 'microsoft', 'microsof': 'microsoft',
  'gogle': 'google', 'googl': 'google', 'gooogle': 'google',
  'tesle': 'tesla', 'tlsa': 'tesla', 'teslla': 'tesla',
  'amazn': 'amazon', 'amzon': 'amazon', 'amazone': 'amazon',
  'meta': 'meta platforms', 'facebok': 'meta platforms',
  'paltanir': 'palantir', 'palantier': 'palantir', 'palntr': 'palantir',
  'asml': 'asml', 'aml': 'asml',
  'sap': 'sap', 'rheinmetal': 'rheinmetall', 'rhinemetall': 'rheinmetall',
  'novo': 'novo nordisk', 'novonordisk': 'novo nordisk',
  'ferari': 'ferrari', 'ferarri': 'ferrari',
  'rokketlab': 'rocketlab', 'rocketlb': 'rocketlab',
  'protect and gamble': 'pg', 'protect & gamble': 'pg', 'proctor and gamble': 'pg',
  'proctor & gamble': 'pg', 'procter and gamble': 'pg', 'procter & gamble': 'pg',
  'proctor': 'pg', 'procter': 'pg', 'gamble': 'pg', 'p&g': 'pg',
  'coca cola': 'ko', 'cocacola': 'ko', 'coke': 'ko',
  'pepsi': 'pep', 'pepsico': 'pep',
  'mcdonalds': 'mcd', 'mcdonald': 'mcd',
  'johnson and johnson': 'jnj', 'johnson & johnson': 'jnj', 'j&j': 'jnj',
  'visa': 'v', 'mastercard': 'ma', 'jpmorgan': 'jpm', 'jp morgan': 'jpm',
  'berkshire': 'brk-b', 'buffet': 'brk-b', 'buffett': 'brk-b',
  'broadcom': 'avgo', 'qualcomm': 'qcom', 'intel': 'intc',
};

// Exchange display name mapping
const EXCHANGE_DISPLAY: Record<string, string> = {
  'NMS': 'NASDAQ', 'NGM': 'NASDAQ', 'NCM': 'NASDAQ',
  'NYQ': 'NYSE', 'NYS': 'NYSE', 'PCX': 'NYSE ARCA',
  'GER': 'XETRA', 'FRA': 'Frankfurt',
  'LSE': 'London', 'LON': 'London', 'IOB': 'London IOB',
  'PAR': 'Euronext Paris', 'AMS': 'Euronext Amsterdam', 'BRU': 'Euronext Brussels', 'LIS': 'Euronext Lisbon',
  'MIL': 'Borsa Italiana', 'MCE': 'Madrid',
  'CPH': 'Copenhagen', 'STO': 'Stockholm', 'HEL': 'Helsinki', 'OSL': 'Oslo',
  'VIE': 'Vienna', 'SWX': 'SIX Swiss',
  'TLV': 'Tel Aviv', 'JPX': 'Tokyo', 'HKG': 'Hong Kong',
  'TSE': 'Toronto', 'ASX': 'ASX Sydney',
};

function correctTypo(query: string): string | null {
  const lower = query.toLowerCase().trim();
  return TYPO_MAP[lower] || null;
}

function mapExchange(rawExchange: string): string {
  return EXCHANGE_DISPLAY[rawExchange] || rawExchange;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query || query.length < 1) {
    return NextResponse.json([]);
  }

  try {
    let results = await searchStocks(query);

    // If no results, try typo correction
    if (results.length === 0) {
      const corrected = correctTypo(query);
      if (corrected) {
        results = await searchStocks(corrected);
      }
    }

    // Map exchange names to human-readable
    const enhanced = results.map(r => ({
      ...r,
      exchangeDisplay: mapExchange(r.exchange),
    }));

    return NextResponse.json(enhanced);
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}
