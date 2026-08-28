'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Sparkles, Mail, Lock, CheckCircle2, AlertCircle, LogOut, ShieldCheck } from 'lucide-react';

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

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await signInWithPopup(auth, googleProvider);
      if (res.user) {
        await syncCloudToLocal(res.user.uid);
        setSuccess('Successfully signed in with Google!');
        setTimeout(() => {
          onOpenChange(false);
          setSuccess(null);
        }, 1200);
      }
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      setError(err.message || 'Failed to sign in with Google. Please try again.');
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
        setSuccess('Successfully signed in with Facebook!');
        setTimeout(() => {
          onOpenChange(false);
          setSuccess(null);
        }, 1200);
      }
    } catch (err: any) {
      console.error('Facebook sign-in error:', err);
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
          setSuccess('Account created and portfolio synced!');
          setTimeout(() => {
            onOpenChange(false);
            setSuccess(null);
          }, 1200);
        }
      } else {
        const res = await signInWithEmailAndPassword(auth, email.trim(), password);
        if (res.user) {
          await syncCloudToLocal(res.user.uid);
          setSuccess('Welcome back!');
          setTimeout(() => {
            onOpenChange(false);
            setSuccess(null);
          }, 1200);
        }
      }
    } catch (err: any) {
      console.error('Email auth error:', err);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-6 bg-card border-border/80 shadow-2xl rounded-2xl">
        <DialogHeader className="space-y-2 text-center pb-2">
          <div className="mx-auto p-3 rounded-2xl bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-transparent border border-indigo-500/30 w-fit">
            <Sparkles className="h-6 w-6 text-indigo-400" />
          </div>
          <DialogTitle className="text-xl font-bold tracking-tight">
            {currentUser ? 'Your StockPulse Account' : isSignUp ? 'Create StockPulse Account' : 'Welcome to StockPulse AI'}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {currentUser
              ? 'Your portfolio, watchlists, and price alerts are backed up in the cloud.'
              : 'Sign in to sync your portfolio across all your Android devices in real time.'}
          </DialogDescription>
        </DialogHeader>

        {currentUser ? (
          <div className="space-y-4 pt-2">
            <div className="p-4 rounded-xl bg-muted/40 border border-border/50 flex items-center gap-3">
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName || 'User'}
                  className="h-10 w-10 rounded-full border border-indigo-500/40"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-indigo-600/30 text-indigo-400 font-bold flex items-center justify-center border border-indigo-500/30 text-sm">
                  {currentUser.email ? currentUser.email[0].toUpperCase() : 'U'}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <span className="font-bold text-sm text-foreground block truncate">
                  {currentUser.displayName || 'StockPulse Investor'}
                </span>
                <span className="text-xs text-muted-foreground block truncate">
                  {currentUser.email}
                </span>
              </div>
              <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px] shrink-0 font-mono">
                Cloud Synced
              </Badge>
            </div>

            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full text-xs font-semibold gap-2 border-border/60 hover:bg-muted"
                onClick={async () => {
                  setLoading(true);
                  await syncLocalToCloud();
                  setLoading(false);
                  setSuccess('Cloud backup updated!');
                  setTimeout(() => setSuccess(null), 2000);
                }}
                disabled={loading}
              >
                <ShieldCheck className="h-4 w-4 text-indigo-400" />
                <span>Backup Current Portfolio to Cloud Now</span>
              </Button>

              <Button
                variant="destructive"
                className="w-full text-xs font-semibold gap-2"
                onClick={handleSignOut}
                disabled={loading}
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 pt-1">
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {/* Social Logins */}
            <div className="space-y-2">
              {/* Google Button */}
              <Button
                type="button"
                variant="outline"
                className="w-full h-10 text-xs font-bold gap-2.5 bg-background hover:bg-muted border-border/70 cursor-pointer shadow-xs"
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </Button>

              {/* Facebook Button */}
              <Button
                type="button"
                variant="outline"
                className="w-full h-10 text-xs font-bold gap-2.5 bg-[#1877F2]/10 hover:bg-[#1877F2]/20 text-[#1877F2] border-[#1877F2]/30 cursor-pointer shadow-xs"
                onClick={handleFacebookSignIn}
                disabled={loading}
              >
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span>Continue with Facebook</span>
              </Button>
            </div>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-3">
              <div className="border-t border-border/50 w-full" />
              <span className="bg-card px-2 text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                Or with email
              </span>
              <div className="border-t border-border/50 w-full" />
            </div>

            {/* Email Form */}
            <form onSubmit={handleEmailAuth} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted-foreground">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-9 h-9 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted-foreground">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-9 h-9 text-xs"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-9 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer shadow-md mt-1"
                disabled={loading}
              >
                {loading ? 'Processing...' : isSignUp ? 'Create Account & Sync' : 'Sign In'}
              </Button>
            </form>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError(null);
                }}
                className="text-xs text-indigo-400 hover:underline font-semibold cursor-pointer"
              >
                {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
