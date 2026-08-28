import { NextRequest, NextResponse } from 'next/server';
import { getHistory } from '@/lib/yahoo';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');
  const range = searchParams.get('range') || '1y';

  if (!symbol) {
    return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
  }

  try {
    const history = await getHistory(symbol, range as '1d' | '5d' | '1mo' | '3mo' | '6mo' | '1y' | '2y' | '5y' | 'max');
    return NextResponse.json(history);
  } catch (error) {
    console.error('History error:', error);
    return NextResponse.json(
      { error: `Failed to fetch history for ${symbol}` },
      { status: 500 }
    );
  }
}
