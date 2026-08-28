'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

function Select({ value, onValueChange, children, className }: SelectProps) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const options = React.Children.toArray(children).filter(
    (child): child is React.ReactElement<SelectItemProps> =>
      React.isValidElement(child)
  );

  const selectedLabel = options.find(
    (opt) => opt.props.value === value
  )?.props.children || value;

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        onClick={() => setOpen(!open)}
        type="button"
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover p-1 shadow-md">
          {options.map((opt) => (
            <button
              key={opt.props.value}
              className={cn(
                'relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground',
                value === opt.props.value && 'bg-accent text-accent-foreground'
              )}
              onClick={() => {
                onValueChange(opt.props.value);
                setOpen(false);
              }}
            >
              {opt.props.children}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface SelectItemProps {
  value: string;
  children: React.ReactNode;
}

function SelectItem({ children }: SelectItemProps) {
  return <>{children}</>;
}

export { Select, SelectItem };
