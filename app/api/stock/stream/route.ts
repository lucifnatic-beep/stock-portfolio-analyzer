import { NextRequest } from 'next/server';
import { getQuote } from '@/lib/yahoo';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbolsParam = searchParams.get('symbols') || 'AAPL,NVDA,MSFT,SPY';
  const symbols = symbolsParam
    .split(',')
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let isClosed = false;

      const sendQuotes = async () => {
        if (isClosed) return;
        try {
          const quotes = await Promise.all(symbols.map((sym) => getQuote(sym)));
          const payload = `data: ${JSON.stringify({ quotes, timestamp: new Date().toISOString() })}\n\n`;
          controller.enqueue(encoder.encode(payload));
        } catch (err) {
          console.warn('SSE stream quote error:', err);
        }
      };

      // Send immediate first frame
      await sendQuotes();

      // Push updates every 4 seconds
      const interval = setInterval(async () => {
        if (isClosed) {
          clearInterval(interval);
          return;
        }
        await sendQuotes();
      }, 4000);

      request.signal.addEventListener('abort', () => {
        isClosed = true;
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
