import React from 'react';
import { cn, formatThousands, parseThousands } from '../../lib/utils';

export const Input = React.forwardRef(
  ({ className, type = 'text', label, error, helperText, formatSpaces, onChange, value, ...props }, ref) => {
    const handleChange = (e) => {
      if (!onChange) return;
      if (formatSpaces) {
        const raw = e.target.value.replace(/[^\d.,]/g, '').replace(',', '.');
        onChange({
          ...e,
          target: {
            ...e.target,
            value: raw,
            name: props.name
          }
        });
      } else {
        onChange(e);
      }
    };

    const displayValue = formatSpaces ? formatThousands(value) : value;

    return (
      <div className="w-full space-y-1">
        {label && (
          <label className="text-xs font-medium text-foreground block">
            {label}
          </label>
        )}
        <input
          type={formatSpaces ? 'text' : type}
          value={displayValue !== undefined ? displayValue : ''}
          onChange={handleChange}
          className={cn(
            'flex h-[36px] w-full rounded-md border border-hairline hover:border-hairline-strong bg-background px-3 py-1.5 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors focus-visible:outline-none focus-visible:border-[#5645d4] focus-visible:ring-1 focus-visible:ring-[#5645d4] disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-destructive focus-visible:border-destructive focus-visible:ring-destructive',
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
