import { NextRequest, NextResponse } from 'next/server';

// In-memory / temporary buffer of waitlist emails for demo & export
interface WaitlistEntry {
  email: string;
  ticketNumber: number;
  joinedAt: string;
  country?: string;
  source?: string;
}

const waitlistDB: WaitlistEntry[] = [
  { email: 'alex.miller@finance.io', ticketNumber: 379, joinedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString() },
  { email: 'sophie.dupont@invest.eu', ticketNumber: 380, joinedAt: new Date(Date.now() - 1000 * 60 * 12).toISOString() },
  { email: 'marcus.weber@tech-investor.de', ticketNumber: 381, joinedAt: new Date(Date.now() - 1000 * 60 * 8).toISOString() },
  { email: 'david.clark@nyse-trader.com', ticketNumber: 382, joinedAt: new Date(Date.now() - 1000 * 60 * 3).toISOString() },
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = body.email?.trim().toLowerCase();
    const country = body.country || 'Global';
    const source = body.source || 'landing_page';

    if (!email || !email.includes('@') || email.length < 5) {
      return NextResponse.json({ error: 'Please provide a valid email address.' }, { status: 400 });
    }

    // Check if already registered
    const existing = waitlistDB.find((e) => e.email === email);
    if (existing) {
      return NextResponse.json({
        success: true,
        ticketNumber: existing.ticketNumber,
        alreadyRegistered: true,
        message: `You're already on the VIP waitlist! Your ticket number is #${existing.ticketNumber}.`,
      });
    }

    const ticketNumber = waitlistDB.length + 383;
    const newEntry: WaitlistEntry = {
      email,
      ticketNumber,
      joinedAt: new Date().toISOString(),
      country,
      source,
    };

    waitlistDB.push(newEntry);

    return NextResponse.json({
      success: true,
      ticketNumber,
      totalWaitlist: waitlistDB.length + 382,
      message: `Welcome to StockPulse AI Early Access! You are VIP #${ticketNumber}.`,
    });
  } catch (err) {
    console.error('Waitlist API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    totalCount: waitlistDB.length + 382,
    recentJoins: waitlistDB.slice(-5).reverse(),
  });
}
