import { NextRequest, NextResponse } from 'next/server';
import { getQuote, getFundamentals } from '@/lib/yahoo';
import { analyzeStockWithGemini } from '@/lib/gemini-analyst';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');

  if (!symbol) {
    return NextResponse.json({ error: 'Stock symbol parameter is required' }, { status: 400 });
  }

  try {
    const cleanSymbol = symbol.toUpperCase().trim();
    const [quote, fundamentals] = await Promise.all([
      getQuote(cleanSymbol).catch(() => null),
      getFundamentals(cleanSymbol).catch(() => null),
    ]);

    const analysis = await analyzeStockWithGemini(cleanSymbol, quote, fundamentals);
    return NextResponse.json(analysis);
  } catch (error) {
    console.error('AI Analysis Route Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate AI analysis' },
      { status: 500 }
    );
  }
}
