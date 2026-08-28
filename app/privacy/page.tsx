import React from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto py-10 px-4 space-y-8 text-foreground">
      <div className="flex items-center gap-3 border-b border-border/50 pb-4">
        <Link href="/">
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to App</span>
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-indigo-400" />
          <h1 className="text-xl font-bold">Privacy Policy — StockPulse AI</h1>
        </div>
      </div>

      <div className="space-y-6 text-xs sm:text-sm text-muted-foreground leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">1. Introduction & Local-First Privacy</h2>
          <p>
            StockPulse AI (&quot;we&quot;, &quot;our&quot;, or &quot;the App&quot;) is committed to protecting your privacy. The App is designed with a Local-First architecture: your financial portfolios, transactions, and watchlists are stored primarily on your local device via encrypted browser storage (IndexedDB).
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">2. Information We Collect</h2>
          <p>
            - <strong>Account Information (Optional):</strong> If you choose to sign in using Google, Facebook, or Email, we securely authenticate your identity and store your user ID, email, and display name solely to enable cross-device cloud synchronization.
          </p>
          <p>
            - <strong>Portfolio Data:</strong> Tickers, share counts, buy prices, and broker tags that you enter or import remain private to your account.
          </p>
          <p>
            - <strong>Financial Transactions & Keys:</strong> We do NOT collect bank account logins, broker passwords, credit card numbers, or execute trades on your behalf.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">3. How We Use Data</h2>
          <p>
            Data is strictly used to provide real-time market valuations, portfolio profit/loss calculations, technical indicator charts, and AI market screening. We do NOT sell, rent, or monetize your personal or investment data to third-party advertisers.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">4. Financial Disclaimer</h2>
          <p>
            StockPulse AI provides market data, technical analyses, and algorithmic scores for educational and informational purposes only. Nothing within this application constitutes personalized investment, financial, tax, or legal advice.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">5. Data Deletion & Contact</h2>
          <p>
            You can delete all locally stored data at any time via the &quot;Clear / Reset Portfolio&quot; button in the App settings. For inquiries or cloud account removal, contact our support team at support@stockpulse.app.
          </p>
        </section>
      </div>
    </div>
  );
}
