import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground shadow',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        destructive: 'border-rose-500/20 bg-rose-500/10 text-rose-400 dark:text-rose-300 font-mono',
        success: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400 dark:text-emerald-300 font-mono',
        danger: 'border-rose-500/20 bg-rose-500/10 text-rose-400 dark:text-rose-300 font-mono',
        warning: 'border-amber-500/20 bg-amber-500/10 text-amber-400 dark:text-amber-300 font-mono',
        info: 'border-sky-500/20 bg-sky-500/10 text-sky-400 dark:text-sky-300 font-mono',
        outline: 'text-foreground border-border bg-background/50',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
