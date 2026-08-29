import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface SyncRequestBody {
  broker: 't212' | 'robinhood';
  apiKey?: string;
  environment?: 'live' | 'demo';
}

export async function POST(request: NextRequest) {
  try {
    const body: SyncRequestBody = await request.json();

    if (body.broker === 't212') {
      if (!body.apiKey) {
        return NextResponse.json(
          { error: 'Trading 212 API Key is required' },
          { status: 400 }
        );
      }

      const baseUrl =
        body.environment === 'demo'
          ? 'https://demo.trading212.com/api/v0'
          : 'https://live.trading212.com/api/v0';

      const [accountRes, positionsRes] = await Promise.allSettled([
        fetch(`${baseUrl}/equity/account/cash`, {
          headers: { Authorization: body.apiKey.trim() },
        }),
        fetch(`${baseUrl}/equity/positions`, {
          headers: { Authorization: body.apiKey.trim() },
        }),
      ]);

      let cash = 0;
      let freeCash = 0;
      let positions = [];

      if (accountRes.status === 'fulfilled' && accountRes.value.ok) {
        const cashData = await accountRes.value.json();
        freeCash = cashData.free || 0;
        cash = cashData.total || 0;
      }

      if (positionsRes.status === 'fulfilled' && positionsRes.value.ok) {
        const rawPositions = await positionsRes.value.json();
        if (Array.isArray(rawPositions)) {
          positions = rawPositions.map((p: any) => ({
            symbol: (p.ticker || '').replace('_US_EQ', '').replace('_EQ', ''),
            shares: p.quantity || 0,
            avgCost: p.averagePrice || 0,
            currentPrice: p.currentPrice || p.averagePrice || 0,
            ppl: p.ppl || 0,
            broker: 't212',
          }));
        }
      } else {
        return NextResponse.json(
          { error: 'Invalid Trading 212 API Key or endpoint unavailable' },
          { status: 401 }
        );
      }

      return NextResponse.json({
        success: true,
        broker: 't212',
        freeCash,
        totalCash: cash,
        positionsCount: positions.length,
        positions,
        syncedAt: new Date().toISOString(),
      });
    }

    return NextResponse.json(
      { error: 'Unsupported broker provider' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Broker Sync Error:', error);
    return NextResponse.json(
      { error: 'Internal broker synchronization failure' },
      { status: 500 }
    );
  }
}
