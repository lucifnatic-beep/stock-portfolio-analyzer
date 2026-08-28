'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Moon, Sun, Globe, TrendingUp, Menu } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/stores/app-store';
import { useTranslation } from '@/lib/i18n';
import type { SearchResult } from '@/types';

export function Header() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { locale, setLocale, baseCurrency, setBaseCurrency, searchOpen, setSearchOpen, toggleSidebar } = useAppStore();
  const t = useTranslation(locale);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Cmd+K shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(!searchOpen);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchOpen, setSearchOpen]);

  const searchStocks = useCallback(async (q: string) => {
    if (q.length < 1) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/stock/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => searchStocks(query), 300);
    return () => clearTimeout(timer);
  }, [query, searchStocks]);

  const selectStock = (symbol: string) => {
    setSearchOpen(false);
    setQuery('');
    setResults([]);
    router.push(`/stocks/${symbol}`);
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pt-[env(safe-area-inset-top,0px)]">
        <div className="flex h-14 items-center justify-between gap-2 px-3 sm:px-4 lg:px-6 max-w-full">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleSidebar} title="Toggle sidebar" className="h-9 w-9">
              <Menu className="h-5 w-5" />
            </Button>

            <Link href="/" className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-500 shrink-0" />
              <span className="text-base sm:text-lg font-bold tracking-tight text-foreground">StockPulse</span>
            </Link>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Search trigger - compact icon on mobile, input on desktop */}
            <Button
              variant="outline"
              className="hidden sm:flex relative w-48 md:w-60 justify-start text-xs sm:text-sm text-muted-foreground h-9"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="mr-2 h-3.5 w-3.5" />
              {t('nav.search')}
              <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 md:flex">
                Ctrl + K
              </kbd>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="sm:hidden h-9 w-9 text-muted-foreground hover:text-foreground"
              onClick={() => setSearchOpen(true)}
              title="Search stocks"
            >
              <Search className="h-4 w-4" />
            </Button>

            {/* Currency toggle */}
            <div className="flex items-center rounded-lg border bg-muted/50 p-0.5 text-[10px] sm:text-xs">
              {(['USD', 'EUR', 'GBP', 'RON'] as const).map((curr) => (
                <button
                  key={curr}
                  onClick={() => setBaseCurrency(curr)}
                  className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md font-semibold transition-colors ${
                    baseCurrency === curr
                      ? 'bg-background text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {curr}
                </button>
              ))}
            </div>

            {/* Theme toggle */}
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 sm:h-9 sm:w-9"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                title={t('common.darkMode')}
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Search modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSearchOpen(false)} />
          <div className="fixed left-1/2 top-[15%] z-50 w-full max-w-lg -translate-x-1/2">
            <div className="rounded-lg border bg-card shadow-2xl">
              <div className="flex items-center border-b px-3">
                <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                <input
                  autoFocus
                  className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
                  placeholder={t('nav.search')}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && results.length > 0) {
                      selectStock(results[0].symbol);
                    }
                  }}
                />
              </div>
              {(results.length > 0 || loading) && (
                <div className="max-h-80 overflow-y-auto p-2">
                  {loading && (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      {t('common.loading')}
                    </div>
                  )}
                  {results.map((result) => (
                    <button
                      key={result.symbol}
                      className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-accent"
                      onClick={() => selectStock(result.symbol)}
                    >
                      <span className="font-semibold text-foreground">{result.symbol}</span>
                      <span className="truncate text-muted-foreground">{result.shortName}</span>
                      <span className="ml-auto text-xs text-muted-foreground">{result.exchange}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
