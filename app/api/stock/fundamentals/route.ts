import { NextRequest, NextResponse } from 'next/server';
import { getFundamentals } from '@/lib/yahoo';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');

  if (!symbol) {
    return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
  }

  try {
    const fundamentals = await getFundamentals(symbol);
    return NextResponse.json(fundamentals);
  } catch (error) {
    console.error('Fundamentals error:', error);
    return NextResponse.json(
      { error: `Failed to fetch fundamentals for ${symbol}` },
      { status: 500 }
    );
  }
}
