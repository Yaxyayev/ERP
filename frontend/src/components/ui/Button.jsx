import React from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

export function Button({
  className,
  variant = 'default',
  size = 'default',
  isLoading = false,
  disabled,
  children,
  ...props
}) {
  const variants = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs font-medium',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 font-medium',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-xs font-medium',
    outline: 'border border-border/80 bg-card hover:bg-muted text-foreground font-medium',
    ghost: 'hover:bg-muted text-foreground',
    link: 'text-primary underline-offset-4 hover:underline'
  };

  const sizes = {
    default: 'h-9 rounded-xl px-4 py-2 text-xs sm:text-sm',
    sm: 'h-8 rounded-lg px-2.5 text-xs',
    lg: 'h-11 rounded-xl px-6 text-sm',
    icon: 'h-8 w-8 rounded-lg p-0 flex items-center justify-center'
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
      {children}
    </button>
  );
}
