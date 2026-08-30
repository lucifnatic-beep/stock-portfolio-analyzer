'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ShieldCheck,
  TrendingUp,
  PieChart,
  Bell,
  CheckCircle2,
  ArrowRight,
  ChevronDown,
  Lock,
  Globe,
  Zap,
  BarChart3,
  Cpu,
  Layers,
  Building2,
  Check,
  X,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';

export default function WaitlistPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [ticketNumber, setTicketNumber] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [waitlistCount, setWaitlistCount] = useState(386);

  // Interactive Live App Simulator State
  const [selectedBroker, setSelectedBroker] = useState<'t212' | 'revolut' | 'ibkr' | 'robinhood'>('t212');
  const [showAiModal, setShowAiModal] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    // Fetch live waitlist counter
    fetch('/api/waitlist')
      .then((res) => res.json())
      .then((data) => {
        if (data?.totalCount) setWaitlistCount(data.totalCount);
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;

    setLoading(true);
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data?.ticketNumber) {
        setTicketNumber(data.ticketNumber);
        setWaitlistCount((prev) => prev + 1);
      } else {
        setTicketNumber(387);
      }
      setSubmitted(true);
    } catch {
      setTicketNumber(387);
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  const simulatorData = {
    t212: {
      name: 'Trading 212 Portfolio',
      value: '$24,850.40',
      pnl: '+$4,120.20 (+19.8%)',
      holdings: [
        { sym: 'NVDA', name: 'NVIDIA Corp', shares: '24 sh', val: '$8,450.00', pnl: '+42.5%', color: '#10B981' },
        { sym: 'ASML', name: 'ASML Holding NV', shares: '8 sh', val: '$6,280.40', pnl: '+18.2%', color: '#3B82F6' },
        { sym: 'VWCE', name: 'Vanguard FTSE All-World', shares: '45 sh', val: '$5,920.00', pnl: '+8.4%', color: '#8B5CF6' },
        { sym: 'MSFT', name: 'Microsoft Corp', shares: '10 sh', val: '$4,200.00', pnl: '+14.1%', color: '#F97316' },
      ],
      aiHighlight: 'High AI semiconductor exposure (59.2%). Strong structural secular tailwinds with 0% commission routing.',
    },
    revolut: {
      name: 'Revolut Trading Account',
      value: '$12,480.00',
      pnl: '+$1,840.50 (+17.3%)',
      holdings: [
        { sym: 'AAPL', name: 'Apple Inc', shares: '30 sh', val: '$6,750.00', pnl: '+15.4%', color: '#06B6D4' },
        { sym: 'PLTR', name: 'Palantir Technologies', shares: '120 sh', val: '$3,840.00', pnl: '+32.8%', color: '#10B981' },
        { sym: 'RHM', name: 'Rheinmetall AG', shares: '4 sh', val: '$1,890.00', pnl: '+24.1%', color: '#EC4899' },
      ],
      aiHighlight: 'Palantir enterprise AIP momentum offsetting consumer hardware deceleration. Defense sector hedge active.',
    },
    ibkr: {
      name: 'Interactive Brokers (Pro DMA)',
      value: '$48,920.00',
      pnl: '+$8,750.00 (+21.7%)',
      holdings: [
        { sym: 'SPY', name: 'SPDR S&P 500 ETF', shares: '60 sh', val: '$32,400.00', pnl: '+14.2%', color: '#3B82F6' },
        { sym: 'TSM', name: 'Taiwan Semiconductor', shares: '55 sh', val: '$9,350.00', pnl: '+28.6%', color: '#10B981' },
        { sym: 'MC.PA', name: 'LVMH Moët Hennessy', shares: '10 sh', val: '$7,170.00', pnl: '-2.1%', color: '#FBBF24' },
      ],
      aiHighlight: 'Core anchor ETF foundation with high beta foundry leverage. Direct smart order routing active.',
    },
    robinhood: {
      name: 'Robinhood US Equities',
      value: '$18,340.00',
      pnl: '+$3,210.00 (+21.2%)',
      holdings: [
        { sym: 'AMZN', name: 'Amazon.com Inc', shares: '40 sh', val: '$7,680.00', pnl: '+22.5%', color: '#F97316' },
        { sym: 'GOOGL', name: 'Alphabet Inc Class A', shares: '35 sh', val: '$5,950.00', pnl: '+16.8%', color: '#3B82F6' },
        { sym: 'RKLB', name: 'Rocket Lab USA', shares: '600 sh', val: '$4,710.00', pnl: '+41.2%', color: '#10B981' },
      ],
      aiHighlight: 'Hyperscaler cloud earnings re-acceleration paired with space economy satellite launch contracts.',
    },
  };

  const activeSim = simulatorData[selectedBroker];

  const faqs = [
    {
      q: 'How does StockPulse AI connect to my brokers?',
      a: 'We strictly utilize official, secure, read-only API tokens (e.g. Trading 212 Public API) and standard OAuth integrations. StockPulse AI never has access to your trading passwords, cannot place orders, and cannot withdraw funds.',
    },
    {
      q: 'Is StockPulse AI regulated as a financial advisor?',
      a: 'No. StockPulse AI is an advanced mathematical analytics and portfolio intelligence software tool. All AI insights, intrinsic valuations, and risk metrics are provided strictly for educational and informational tracking purposes.',
    },
    {
      q: 'Which countries and exchanges are supported?',
      a: 'We fully support US markets (NYSE, NASDAQ) and Western European exchanges (XETRA Germany, Euronext Paris/Amsterdam, London Stock Exchange), covering over 3,500+ global stocks and UCITS ETFs.',
    },
    {
      q: 'What do I get by joining the Early Access Waitlist?',
      a: 'Waitlist members receive priority invitation to the Private Beta, an exclusive VIP ticket number, and 3 full months of StockPulse Pro tier completely free of charge upon public launch.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100 font-sans selection:bg-emerald-500 selection:text-black relative overflow-x-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-gradient-to-b from-emerald-500/15 via-teal-500/5 to-transparent blur-[140px] pointer-events-none -z-10" />
      <div className="absolute top-[800px] right-0 w-[500px] h-[500px] bg-blue-500/10 blur-[160px] pointer-events-none -z-10" />

      {/* Sticky Header */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-[#09090B]/80 border-b border-zinc-800/60">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/25 rounded-xl shadow-lg shadow-emerald-500/10">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-white flex items-center gap-1.5">
                StockPulse <span className="text-emerald-400 text-xs px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20">AI</span>
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#simulator" className="hover:text-white transition-colors">Live Preview</a>
            <a href="#comparison" className="hover:text-white transition-colors">Comparison</a>
            <a href="#security" className="hover:text-white transition-colors">Security</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs font-bold text-zinc-400 hover:text-white px-3.5 py-2 rounded-xl transition-colors hidden sm:block"
            >
              Open Web App →
            </Link>
            <a
              href="#waitlist-form"
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs tracking-wide transition-all active:scale-95 shadow-md shadow-emerald-500/20"
            >
              Get Early Access
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-16 pb-20 px-6 max-w-6xl mx-auto flex flex-col items-center text-center">
        {/* Live Social Proof Badge */}
        <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-zinc-900/90 border border-zinc-800 text-xs font-medium text-zinc-300 mb-8 shadow-inner animate-in fade-in slide-in-from-top-4">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span><strong>{waitlistCount} investors</strong> from US & Europe on the VIP waitlist</span>
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white max-w-5xl leading-[1.1] mb-6">
          All your stock portfolios in one place. <br />
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
            Understood with Institutional AI.
          </span>
        </h1>

        <p className="text-zinc-400 text-base sm:text-xl max-w-3xl mb-10 leading-relaxed">
          Stop juggling messy spreadsheets across <strong>Trading 212, Revolut, Interactive Brokers, and Robinhood</strong>. Get instant multi-broker aggregation, real-time news impact analysis, and 3 Pillars of Valuation.
        </p>

        {/* Waitlist Form */}
        <div id="waitlist-form" className="w-full max-w-md mb-8">
          {submitted ? (
            <div className="p-6 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex flex-col items-center text-center gap-2 animate-in fade-in zoom-in-95 shadow-2xl shadow-emerald-500/10">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mb-1">
                <Check className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">You're on the VIP Waitlist!</h3>
              <p className="text-sm text-emerald-400 font-mono font-bold">VIP Pass #{ticketNumber}</p>
              <p className="text-xs text-zinc-400 mt-1">
                We've reserved your 3-month free Pro license. Check your inbox soon for your private beta invitation.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2.5 p-1.5 bg-zinc-900/90 border border-zinc-800 rounded-2xl shadow-2xl">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your personal or work email..."
                className="flex-1 px-4 py-3.5 bg-transparent text-white placeholder:text-zinc-500 text-sm focus:outline-none"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 whitespace-nowrap shadow-lg shadow-emerald-500/20"
              >
                {loading ? 'Securing Spot...' : <>Join Waitlist <ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>
          )}

          <div className="flex items-center justify-center gap-6 mt-4 text-xs text-zinc-500 font-medium">
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-400" /> 100% Read-Only API</span>
            <span className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-emerald-400" /> 256-Bit TLS Security</span>
            <span className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Free 3-Month Pro Pass</span>
          </div>
        </div>
      </section>

      {/* Interactive App Simulator Widget */}
      <section id="simulator" className="py-12 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider mb-3">
            Interactive Product Preview
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Experience the Multi-Broker Dashboard</h2>
          <p className="text-zinc-400 text-sm max-w-xl mx-auto mt-2">
            Switch between brokers to see how StockPulse AI instantly unifies and analyzes holdings.
          </p>
        </div>

        {/* Simulator Device Frame */}
        <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6 md:p-8 shadow-2xl relative overflow-hidden">
          {/* Top Broker Selector Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-6 border-b border-zinc-800/80">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Active Account:</span>
              <div className="flex items-center gap-2">
                {[
                  { id: 't212', label: 'Trading 212', icon: '🌐' },
                  { id: 'revolut', label: 'Revolut', icon: '💳' },
                  { id: 'ibkr', label: 'Interactive Brokers', icon: '🏛️' },
                  { id: 'robinhood', label: 'Robinhood', icon: '🇺🇸' },
                ].map((b) => {
                  const isSel = selectedBroker === b.id;
                  return (
                    <button
                      key={b.id}
                      onClick={() => setSelectedBroker(b.id as any)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                        isSel
                          ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
                          : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-zinc-800'
                      }`}
                    >
                      <span>{b.icon}</span>
                      <span>{b.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> LIVE STREAMING
            </div>
          </div>

          {/* Simulator Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-6">
            {/* Left Col: Balance & Holdings */}
            <div className="lg:col-span-2 space-y-4">
              <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{activeSim.name}</div>
                  <div className="text-3xl font-black text-white font-mono mt-1">{activeSim.value}</div>
                </div>
                <div className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono font-extrabold text-sm w-fit">
                  {activeSim.pnl}
                </div>
              </div>

              {/* Holdings Table */}
              <div className="rounded-2xl bg-zinc-900/40 border border-zinc-800/80 overflow-hidden">
                <div className="px-5 py-3 border-b border-zinc-800 text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  Aggregated Holdings ({activeSim.holdings.length})
                </div>
                <div className="divide-y divide-zinc-800/60">
                  {activeSim.holdings.map((h) => (
                    <div key={h.sym} className="px-5 py-3.5 flex items-center justify-between hover:bg-zinc-800/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700/60 flex items-center justify-center font-black text-xs text-white">
                          {h.sym.slice(0, 3)}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-white">{h.sym}</div>
                          <div className="text-xs text-zinc-400">{h.name} · {h.shares}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold font-mono text-sm text-white">{h.val}</div>
                        <div className="text-xs font-bold font-mono text-emerald-400">{h.pnl}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Col: AI Financial Analyst Highlight */}
            <div className="space-y-4">
              <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-950/60 via-zinc-900 to-zinc-900 border border-emerald-500/30 flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-3">
                    <Sparkles className="w-4 h-4" /> AI Analyst Real-Time Thesis
                  </div>
                  <h4 className="text-base font-bold text-white mb-2">Automated Macro & Portfolio Scan</h4>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {activeSim.aiHighlight}
                  </p>
                </div>

                <div className="pt-6 border-t border-zinc-800/80 mt-6">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-zinc-400">Institutional AI Score:</span>
                    <span className="font-bold text-emerald-400 font-mono">92/100 (Strong Buy)</span>
                  </div>
                  <button
                    onClick={() => setShowAiModal(true)}
                    className="w-full py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                  >
                    ⚡ View 3 Pillars Valuation
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal for 3 Pillars Preview */}
        {showAiModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-lg w-full space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <Sparkles className="w-4 h-4" /> 3 Pillars of Valuation Model
                </div>
                <button onClick={() => setShowAiModal(false)} className="text-zinc-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                  <span className="text-purple-400 font-bold">PILLAR 1: Valuation & Multiples</span>
                  <p className="text-zinc-400 mt-1">DCF Intrinsic Fair Value calculated at $148.50 with 24.8x forward P/E margin expansion.</p>
                </div>
                <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                  <span className="text-orange-400 font-bold">PILLAR 2: Wall Street Consensus</span>
                  <p className="text-zinc-400 mt-1">38 Wall Street analysts rating Overweight with 92% price target upside conviction.</p>
                </div>
                <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                  <span className="text-emerald-400 font-bold">PILLAR 3: Technical Signals</span>
                  <p className="text-zinc-400 mt-1">RSI at 54.2 with Golden Cross on 50/200 Day Moving Averages.</p>
                </div>
              </div>
              <button
                onClick={() => setShowAiModal(false)}
                className="w-full py-2.5 bg-emerald-500 text-black font-bold rounded-xl text-xs"
              >
                Close Preview
              </button>
            </div>
          </div>
        )}
      </section>

      {/* 3 Core Value Pillars */}
      <section id="features" className="py-20 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Why Smart Investors Choose StockPulse AI</h2>
          <p className="text-zinc-400 text-sm sm:text-base max-w-xl mx-auto mt-3">
            Built for modern compounders in the US & Western Europe who demand institutional clarity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-8 rounded-3xl bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700 transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-6">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Multi-Broker Centralization</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Connect Trading 212, Revolut, Interactive Brokers, and Robinhood. Eliminate manual spreadsheets with automated portfolio balance aggregation.
              </p>
            </div>
            <div className="mt-8 pt-4 border-t border-zinc-800/60 text-xs font-mono text-blue-400 font-bold">
              ✓ 0% Comm / Fractional Sync
            </div>
          </div>

          <div className="p-8 rounded-3xl bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700 transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">AI Financial Analyst</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                On-demand intrinsic valuation reports, Bull/Bear scenarios, and DCF fair value estimates powered by Gemini 2.0 and quantitative models.
              </p>
            </div>
            <div className="mt-8 pt-4 border-t border-zinc-800/60 text-xs font-mono text-emerald-400 font-bold">
              ✓ Intrinsic DCF & Multiples
            </div>
          </div>

          <div className="p-8 rounded-3xl bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700 transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 mb-6">
                <Bell className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">News Grounding & Macro Radar</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Real-time financial news wire verifying Bloomberg, Reuters, and WSJ feeds, contextualizing exactly how macroeconomic shifts impact your holdings.
              </p>
            </div>
            <div className="mt-8 pt-4 border-t border-zinc-800/60 text-xs font-mono text-orange-400 font-bold">
              ✓ Sentiment & Sector Impact
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Matrix */}
      <section id="comparison" className="py-16 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">How StockPulse AI Compares</h2>
          <p className="text-zinc-400 text-sm max-w-xl mx-auto mt-2">
            Institutional capabilities at a fraction of the complexity.
          </p>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-950 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-900/80 border-b border-zinc-800 text-xs uppercase font-bold text-zinc-400">
                <tr>
                  <th className="py-4 px-6">Capability</th>
                  <th className="py-4 px-6 text-emerald-400 font-black">StockPulse AI</th>
                  <th className="py-4 px-6">Excel Spreadsheets</th>
                  <th className="py-4 px-6">Yahoo Finance</th>
                  <th className="py-4 px-6">Bloomberg Terminal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                <tr>
                  <td className="py-4 px-6 font-bold text-white">Multi-Broker Auto Sync</td>
                  <td className="py-4 px-6 text-emerald-400 font-bold">✓ Automated</td>
                  <td className="py-4 px-6 text-zinc-500">✗ 100% Manual</td>
                  <td className="py-4 px-6 text-zinc-500">✗ Limited</td>
                  <td className="py-4 px-6 text-zinc-400">✓ Complex API</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-bold text-white">AI Intrinsic Valuation</td>
                  <td className="py-4 px-6 text-emerald-400 font-bold">✓ Instant 3 Pillars</td>
                  <td className="py-4 px-6 text-zinc-500">✗ Custom Formulas</td>
                  <td className="py-4 px-6 text-zinc-500">✗ None</td>
                  <td className="py-4 px-6 text-zinc-400">✓ Professional</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-bold text-white">News Grounding on Portfolio</td>
                  <td className="py-4 px-6 text-emerald-400 font-bold">✓ Specific Impact</td>
                  <td className="py-4 px-6 text-zinc-500">✗ None</td>
                  <td className="py-4 px-6 text-zinc-500">✗ Generic Feed</td>
                  <td className="py-4 px-6 text-zinc-400">✓ Full Access</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-bold text-white">Monthly Subscription Cost</td>
                  <td className="py-4 px-6 text-emerald-400 font-bold">Free / $4.99 Pro</td>
                  <td className="py-4 px-6 text-zinc-400">Free ($$ Time Lost)</td>
                  <td className="py-4 px-6 text-zinc-400">Free / $25+ Plus</td>
                  <td className="py-4 px-6 text-red-400 font-mono font-bold">$2,000+ / mo</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Security & Regulatory Standards */}
      <section id="security" className="py-16 px-6 max-w-5xl mx-auto">
        <div className="p-8 sm:p-12 rounded-3xl bg-zinc-900/50 border border-zinc-800 flex flex-col md:flex-row items-center gap-8">
          <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
            <ShieldCheck className="w-12 h-12" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white mb-2">Institutional-Grade Security & Zero-Selling Privacy</h3>
            <p className="text-sm text-zinc-400 leading-relaxed mb-4">
              We never sell your financial transactions or portfolio balances to third parties or advertising networks. All API connections strictly mandate read-only authorization scopes, ensuring your capital remains 100% safe.
            </p>
            <div className="flex flex-wrap gap-4 text-xs font-mono text-zinc-300">
              <span className="px-3 py-1 rounded-lg bg-zinc-800 border border-zinc-700">🔒 TLS 1.3 Transport Encryption</span>
              <span className="px-3 py-1 rounded-lg bg-zinc-800 border border-zinc-700">🛡️ Local Sandbox Isolation</span>
              <span className="px-3 py-1 rounded-lg bg-zinc-800 border border-zinc-700">📜 GDPR & Non-Advisory Compliant</span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section id="faq" className="py-16 px-6 max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold text-white">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-3">
          {faqs.map((f, i) => {
            const isOpen = openFaq === i;
            return (
              <div key={i} className="rounded-2xl bg-zinc-900/60 border border-zinc-800/80 overflow-hidden">
                <button
                  onClick={() => setOpenFaq(isOpen ? null : i)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left font-bold text-sm text-white hover:text-emerald-400 transition-colors"
                >
                  <span>{f.q}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180 text-emerald-400' : 'text-zinc-500'}`} />
                </button>
                {isOpen && (
                  <div className="px-6 pb-4 text-xs text-zinc-400 leading-relaxed border-t border-zinc-800/40 pt-3">
                    {f.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="py-20 px-6 max-w-4xl mx-auto text-center">
        <div className="p-10 sm:p-14 rounded-3xl bg-gradient-to-b from-emerald-950/40 via-zinc-900 to-zinc-900 border border-emerald-500/30 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] pointer-events-none" />
          <h2 className="text-3xl sm:text-5xl font-black text-white mb-4">
            Claim Your Free VIP Pass Today
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base max-w-xl mx-auto mb-8">
            Join the private beta. Get 3 months of StockPulse Pro tier free upon launch in the US and Europe.
          </p>
          <a
            href="#waitlist-form"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-sm tracking-wide transition-all active:scale-95 shadow-xl shadow-emerald-500/25"
          >
            Join the VIP Waitlist <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-12 px-6 max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <span className="font-bold text-zinc-400">StockPulse AI</span>
          <span>© 2026. All rights reserved.</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/terms" className="hover:text-zinc-300 transition-colors">Terms of Service</Link>
          <Link href="/privacy" className="hover:text-zinc-300 transition-colors">Privacy Policy</Link>
          <a href="#security" className="hover:text-zinc-300 transition-colors">Security</a>
        </div>
      </footer>
    </div>
  );
}
