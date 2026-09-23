import React from 'react';
import { cn } from '../../lib/utils';

export const Select = React.forwardRef(
  ({ className, label, error, helperText, children, ...props }, ref) => {
    return (
      <div className="w-full space-y-1">
        {label && (
          <label className="text-xs font-medium text-foreground block">
            {label}
          </label>
        )}
        <select
          className={cn(
            'flex h-[36px] w-full rounded-md border border-hairline hover:border-hairline-strong bg-background px-3 py-1.5 text-xs sm:text-sm text-foreground transition-colors focus-visible:outline-none focus-visible:border-[#5645d4] focus-visible:ring-1 focus-visible:ring-[#5645d4] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer',
            error && 'border-destructive focus-visible:border-destructive focus-visible:ring-destructive',
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </select>
        {helperText && !error && (
          <p className="text-[11px] text-muted-foreground">{helperText}</p>
        )}
        {error && <p className="text-[11px] font-medium text-destructive">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
