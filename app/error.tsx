'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App-level runtime error caught by boundary:', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
      <div className="p-4 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20">
        <AlertTriangle className="h-10 w-10" />
      </div>
      <div className="space-y-2 max-w-md">
        <h2 className="text-xl font-bold tracking-tight">A apărut o problemă la încărcare</h2>
        <p className="text-sm text-muted-foreground">
          Aplicația a întâmpinat o eroare temporară de conexiune sau de date. Poți reîncărca modulul în siguranță fără a pierde datele salvate.
        </p>
      </div>
      <div className="flex items-center gap-3 pt-2">
        <Button onClick={() => reset()} className="gap-2" variant="default">
          <RefreshCw className="h-4 w-4" />
          Reîncearcă acum
        </Button>
        <Link href="/">
          <Button variant="outline" className="gap-2">
            <Home className="h-4 w-4" />
            Pagina Principală
          </Button>
        </Link>
      </div>
    </div>
  );
}
