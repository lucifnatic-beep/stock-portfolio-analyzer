'use client';

import React, { useState, useEffect } from 'react';
import {
  auth,
  googleProvider,
  facebookProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  firebaseSignOut,
  onAuthStateChanged,
  type User,
} from '@/lib/firebase';
import { syncCloudToLocal, syncLocalToCloud } from '@/lib/sync-service';
import { TrendingUp, Mail, Lock, CheckCircle2, AlertCircle, LogOut, ShieldCheck, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthModal({ open, onOpenChange }: Props) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        syncCloudToLocal(user.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  if (!open) return null;

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await signInWithPopup(auth, googleProvider);
      if (res.user) {
        await syncCloudToLocal(res.user.uid);
        setSuccess('Welcome! Portfolio synced.');
        setTimeout(() => { onOpenChange(false); setSuccess(null); }, 1200);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google.');
    } finally {
      setLoading(false);
    }
  };

  const handleFacebookSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await signInWithPopup(auth, facebookProvider);
      if (res.user) {
        await syncCloudToLocal(res.user.uid);
        setSuccess('Welcome! Portfolio synced.');
        setTimeout(() => { onOpenChange(false); setSuccess(null); }, 1200);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Facebook.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    try {
      setLoading(true);
      setError(null);
      if (isSignUp) {
        const res = await createUserWithEmailAndPassword(auth, email.trim(), password);
        if (res.user) {
          await syncLocalToCloud();
          setSuccess('Account created!');
          setTimeout(() => { onOpenChange(false); setSuccess(null); }, 1200);
        }
      } else {
        const res = await signInWithEmailAndPassword(auth, email.trim(), password);
        if (res.user) {
          await syncCloudToLocal(res.user.uid);
          setSuccess('Welcome back!');
          setTimeout(() => { onOpenChange(false); setSuccess(null); }, 1200);
        }
      }
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        setError('Invalid email or password.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('An account already exists with this email.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else {
        setError(err.message || 'Authentication error.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setLoading(true);
      await firebaseSignOut(auth);
      setCurrentUser(null);
      onOpenChange(false);
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Signed-in view
  if (currentUser) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col">
        {/* Close button */}
        <div className="flex justify-end p-4">
          <button
            onClick={() => onOpenChange(false)}
            className="p-2 rounded-full bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-all active:scale-90"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-12 max-w-sm mx-auto w-full">
          {/* Avatar */}
          {currentUser.photoURL ? (
            <img
              src={currentUser.photoURL}
              alt={currentUser.displayName || 'User'}
              className="h-16 w-16 rounded-full border-2 border-emerald-500/40 mb-4"
            />
          ) : (
            <div className="h-16 w-16 rounded-full bg-emerald-600/20 text-emerald-400 font-bold flex items-center justify-center border-2 border-emerald-500/30 text-xl mb-4">
              {currentUser.email ? currentUser.email[0].toUpperCase() : 'U'}
            </div>
          )}

          <h2 className="text-xl font-bold text-foreground">
            {currentUser.displayName || 'StockPulse Investor'}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">{currentUser.email}</p>

          <div className="flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-xs font-semibold text-emerald-400">Cloud Synced</span>
          </div>

          {success && (
            <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2 w-full">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <div className="w-full space-y-3 mt-8">
            <Button
              variant="outline"
              className="w-full h-12 text-sm font-semibold gap-2"
              onClick={async () => {
                setLoading(true);
                await syncLocalToCloud();
                setLoading(false);
                setSuccess('Cloud backup updated!');
                setTimeout(() => setSuccess(null), 2000);
              }}
              disabled={loading}
            >
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              Backup to Cloud
            </Button>

            <Button
              variant="ghost"
              className="w-full h-12 text-sm font-semibold gap-2 text-red-400 hover:text-red-300 hover:bg-red-500/10"
              onClick={handleSignOut}
              disabled={loading}
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Sign-in/Sign-up view — Full screen Robinhood-style onboarding
  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col overflow-y-auto">
      {/* Skip button */}
      <div className="flex justify-end p-4 shrink-0">
        <button
          onClick={() => onOpenChange(false)}
          className="text-xs text-muted-foreground hover:text-foreground font-semibold px-3 py-1.5 rounded-full border border-border/50 hover:bg-muted/50 transition-all active:scale-95"
        >
          Skip for now
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-12 max-w-sm mx-auto w-full">
        {/* Logo & Welcome */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-indigo-500/10 to-purple-500/10 border border-emerald-500/30 mb-4">
            <TrendingUp className="h-8 w-8 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {isSignUp ? 'Create Account' : 'Welcome to StockPulse'}
          </h1>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            Track your portfolio, discover opportunities, and sync across all your devices.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2 w-full mb-4">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2 w-full mb-4">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Social Logins */}
        <div className="w-full space-y-3 mb-6">
          <Button
            type="button"
            variant="outline"
            className="w-full h-12 text-sm font-bold gap-3 bg-background hover:bg-muted border-border/70 cursor-pointer shadow-sm active:scale-[0.98]"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            Continue with Google
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full h-12 text-sm font-bold gap-3 bg-[#1877F2]/5 hover:bg-[#1877F2]/15 text-[#1877F2] border-[#1877F2]/25 cursor-pointer shadow-sm active:scale-[0.98]"
            onClick={handleFacebookSignIn}
            disabled={loading}
          >
            <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            Continue with Facebook
          </Button>
        </div>

        {/* Divider */}
        <div className="relative flex items-center justify-center w-full mb-6">
          <div className="border-t border-border/50 w-full" />
          <span className="absolute bg-background px-3 text-[11px] text-muted-foreground uppercase font-bold tracking-wider">
            Or with email
          </span>
        </div>

        {/* Email Form */}
        <form onSubmit={handleEmailAuth} className="w-full space-y-3">
          <div className="relative">
            <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="pl-10 h-12 text-sm rounded-xl"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="pl-10 h-12 text-sm rounded-xl"
            />
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-md rounded-xl active:scale-[0.98]"
            disabled={loading}
          >
            {loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}
          </Button>
        </form>

        <div className="text-center mt-4">
          <button
            type="button"
            onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
            className="text-sm text-emerald-500 hover:underline font-semibold cursor-pointer"
          >
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </div>

        {/* Trust badge */}
        <div className="mt-8 flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <Sparkles className="h-3 w-3" />
          <span>Your data stays local-first. Cloud sync is optional & encrypted.</span>
        </div>
      </div>
    </div>
  );
}
