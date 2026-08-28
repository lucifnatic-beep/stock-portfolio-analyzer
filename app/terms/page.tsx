import React from 'react';
import Link from 'next/link';
import { FileText, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TermsPage() {
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
          <FileText className="h-5 w-5 text-indigo-400" />
          <h1 className="text-xl font-bold">Terms of Service — StockPulse AI</h1>
        </div>
      </div>

      <div className="space-y-6 text-xs sm:text-sm text-muted-foreground leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">1. Acceptance of Terms</h2>
          <p>
            By accessing or using StockPulse AI, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the application.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">2. Non-Fiduciary & Non-Advisory Nature</h2>
          <p>
            StockPulse AI is an analytical research and personal portfolio aggregation tool. All stock metrics, target prices, consensus ratings, and AI scores are generated automatically from market feeds and mathematical models. We are not a registered broker-dealer or investment advisor.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">3. User Responsibility & Risk Disclosure</h2>
          <p>
            Investing in stocks, equities, ETFs, and options involves significant financial risk, including the possible loss of principal capital. You are solely responsible for all investment decisions and trade executions made through your independent brokerage accounts.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">4. Intellectual Property</h2>
          <p>
            The software, UI design, analytics algorithms, and branding of StockPulse AI are proprietary and protected by copyright and intellectual property laws.
          </p>
        </section>
      </div>
    </div>
  );
}
