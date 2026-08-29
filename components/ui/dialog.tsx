'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

const DialogContext = React.createContext<{ onClose: () => void } | null>(null);

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

function Dialog({ open, onOpenChange, children }: DialogProps) {
  // Mobile background scroll locking & Android Back Button handling via History API
  React.useEffect(() => {
    if (!open) return;

    // 1. Lock background scroll firmly on mobile
    const scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';

    // 2. Push history state so Android hardware back button closes the dialog instead of exiting app
    window.history.pushState({ modalOpen: true }, '');

    const handlePopState = () => {
      onOpenChange(false);
    };
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      window.scrollTo(0, scrollY);
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <DialogContext.Provider value={{ onClose: () => onOpenChange(false) }}>
      <div className="fixed inset-0 z-50 flex items-center justify-center overscroll-none">
        {/* Backdrop overlay */}
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-xs animate-in fade-in-0"
          onClick={() => onOpenChange(false)}
        />
        {/* Container */}
        <div className="relative z-10 w-full max-w-lg p-4 flex items-center justify-center pointer-events-none">
          <div className="pointer-events-auto w-full">
            {children}
          </div>
        </div>
      </div>
    </DialogContext.Provider>
  );
}

function DialogContent({
  className,
  children,
  onClose,
  showCloseButton = true,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { onClose?: () => void; showCloseButton?: boolean }) {
  const ctx = React.useContext(DialogContext);
  const handleClose = onClose || ctx?.onClose;

  return (
    <div
      className={cn(
        'relative w-full max-w-lg max-h-[88vh] overflow-y-auto overscroll-contain rounded-2xl border bg-card p-6 shadow-2xl animate-in fade-in-0 zoom-in-95 focus:outline-none',
        className
      )}
      onClick={(e) => e.stopPropagation()}
      {...props}
    >
      {showCloseButton && handleClose && (
        <button
          className="absolute right-3.5 top-3.5 z-20 p-2 rounded-full bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-all active:scale-90 cursor-pointer shadow-xs"
          onClick={handleClose}
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      {children}
    </div>
  );
}

function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col space-y-1.5 text-center sm:text-left pr-6', className)} {...props} />;
}

function DialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn('text-lg font-bold leading-tight tracking-tight text-foreground', className)} {...props} />;
}

function DialogDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-xs text-muted-foreground leading-relaxed', className)} {...props} />;
}

function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-5 pt-3 border-t border-border/40', className)} {...props} />;
}

export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogContext };
