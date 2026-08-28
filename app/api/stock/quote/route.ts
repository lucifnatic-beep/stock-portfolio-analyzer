import { NextRequest, NextResponse } from 'next/server';
import { getQuote, getMultipleQuotes } from '@/lib/yahoo';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');
  const symbols = searchParams.get('symbols');

  try {
    if (symbols) {
      const symbolList = symbols.split(',').map(s => s.trim()).filter(Boolean);
      const quotes = await getMultipleQuotes(symbolList);
      return NextResponse.json(quotes);
    }

    if (!symbol) {
      return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
    }

    const quote = await getQuote(symbol);
    return NextResponse.json(quote);
  } catch (error) {
    console.error('Quote error:', error);
    if (symbols) {
      const symbolList = symbols.split(',').map(s => s.trim()).filter(Boolean);
      const fallbackQuotes = await getMultipleQuotes(symbolList);
      return NextResponse.json(fallbackQuotes);
    }
    return NextResponse.json(
      { error: `Failed to fetch quote for ${symbol || symbols}` },
      { status: 500 }
    );
  }
}
