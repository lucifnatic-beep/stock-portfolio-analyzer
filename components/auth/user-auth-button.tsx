'use client';

import React, { useState, useEffect } from 'react';
import { auth, onAuthStateChanged, type User } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { AuthModal } from '@/components/auth/auth-modal';
import { User as UserIcon, Cloud, CloudOff } from 'lucide-react';

export function UserAuthButton() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setModalOpen(true)}
        className="h-8 px-2 sm:px-2.5 text-xs font-semibold gap-1.5 rounded-lg border border-border/50 hover:bg-muted cursor-pointer transition-all"
        title={currentUser ? `Account: ${currentUser.email}` : 'Sign in to sync portfolio'}
      >
        {currentUser ? (
          <>
            {currentUser.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt={currentUser.displayName || 'User'}
                className="h-5 w-5 rounded-full border border-emerald-500/50"
              />
            ) : (
              <div className="h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-[10px] border border-emerald-500/30">
                {currentUser.email ? currentUser.email[0].toUpperCase() : 'U'}
              </div>
            )}
            <span className="hidden sm:inline max-w-[100px] truncate text-[11px]">
              {currentUser.displayName?.split(' ')[0] || currentUser.email?.split('@')[0]}
            </span>
            <Cloud className="h-3 w-3 text-emerald-400 shrink-0" />
          </>
        ) : (
          <>
            <UserIcon className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="hidden sm:inline text-[11px]">Sign In</span>
          </>
        )}
      </Button>

      <AuthModal open={modalOpen} onOpenChange={setModalOpen} />
    </>
  );
}
