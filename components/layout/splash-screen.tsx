'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, Sparkles } from 'lucide-react';

export function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Show splash for 1.2s then fade out
    const timer = setTimeout(() => {
      setFadeOut(true);
      const removeTimer = setTimeout(() => {
        setVisible(false);
      }, 450);
      return () => clearTimeout(removeTimer);
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-[#09090b] flex flex-col items-center justify-between p-8 text-white select-none transition-opacity duration-500 ${
        fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Top spacer */}
      <div className="w-full h-8" />

      {/* Centered Logo & Branding */}
      <div className="flex flex-col items-center text-center space-y-4 my-auto">
        {/* Animated Glowing Icon */}
        <div className="relative flex items-center justify-center">
          <div className="absolute h-24 w-24 rounded-3xl bg-emerald-500/20 blur-xl animate-pulse" />
          <div className="relative flex items-center justify-center h-20 w-20 rounded-3xl bg-gradient-to-br from-emerald-500/25 via-indigo-500/15 to-purple-500/10 border-2 border-emerald-500/40 shadow-2xl shadow-emerald-500/20 animate-in zoom-in-75 duration-500">
            <TrendingUp className="h-10 w-10 text-emerald-400 stroke-[2.5]" />
          </div>
        </div>

        {/* App Title */}
        <div className="space-y-1.5 pt-2">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-emerald-400 bg-clip-text text-transparent">
            StockPulse AI
          </h1>
          <p className="text-xs text-zinc-400 font-medium tracking-wide">
            Portfolio Engine · US & European Markets
          </p>
        </div>

        {/* Live Status Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[11px] font-semibold text-emerald-400 mt-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span>Connecting Live Feeds</span>
        </div>
      </div>

      {/* Bottom Loading Indicator */}
      <div className="w-full max-w-[200px] flex flex-col items-center space-y-2 pb-4">
        <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-emerald-500 via-indigo-500 to-emerald-400 rounded-full animate-[pulse_1s_ease-in-out_infinite] w-full" />
        </div>
        <p className="text-[10px] text-zinc-500 font-mono">v1.0.0 · Local-First Security</p>
      </div>
    </div>
  );
}
