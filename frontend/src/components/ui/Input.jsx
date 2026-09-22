import React from 'react';
import { cn } from '../../lib/utils';

export const Input = React.forwardRef(
  ({ className, type, label, error, helperText, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="text-xs font-semibold text-foreground/80 block">
            {label}
          </label>
        )}
        <input
          type={type}
          className={cn(
            'flex h-9 w-full rounded-xl border-0 bg-muted/40 px-3 py-1.5 text-xs sm:text-sm text-foreground ring-1 ring-border/80 placeholder:text-muted-foreground/60 focus:bg-card focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-150',
            error && 'ring-2 ring-destructive focus:ring-destructive',
            className
          )}
          ref={ref}
          {...props}
        />
        {helperText && !error && (
          <p className="text-[11px] text-muted-foreground">{helperText}</p>
        )}
        {error && <p className="text-[11px] font-medium text-destructive">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
