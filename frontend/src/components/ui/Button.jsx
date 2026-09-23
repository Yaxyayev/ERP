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
    // Notion primary: Signature purple rectangle (#5645d4)
    default: 'bg-[#5645d4] hover:bg-[#4534b3] text-white active:bg-[#3a2a99] shadow-xs font-medium',
    primary: 'bg-[#5645d4] hover:bg-[#4534b3] text-white active:bg-[#3a2a99] shadow-xs font-medium',
    // Notion dark button: #000000 / #1a1a1a
    dark: 'bg-[#1a1a1a] dark:bg-white text-white dark:text-[#1a1a1a] hover:bg-black dark:hover:bg-[#eaeaea] font-medium',
    // Notion secondary: Outlined with hairline-strong border
    secondary: 'bg-transparent border border-hairline hover:border-hairline-strong text-foreground hover:bg-surface font-medium',
    outline: 'bg-transparent border border-hairline hover:border-hairline-strong text-foreground hover:bg-surface font-medium',
    destructive: 'bg-[#e03131] text-white hover:bg-[#c92a2a] active:bg-[#b02525] shadow-xs font-medium',
    ghost: 'hover:bg-surface text-foreground font-medium',
    link: 'text-[#0075de] hover:underline underline-offset-4 font-medium'
  };

  const sizes = {
    default: 'h-[36px] rounded-md px-3.5 py-1.5 text-xs sm:text-sm',
    sm: 'h-[30px] rounded-md px-2.5 text-xs',
    lg: 'h-[42px] rounded-md px-5 text-sm',
    icon: 'h-[32px] w-[32px] rounded-md p-0 flex items-center justify-center'
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5645d4]/40 disabled:pointer-events-none disabled:opacity-40 select-none cursor-pointer',
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
