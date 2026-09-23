import React from 'react';
import { cn } from '../../lib/utils';

export function Badge({ className, variant = 'default', ...props }) {
  const variants = {
    // Standard Notion Tags
    default: 'bg-surface text-foreground border border-hairline',
    outline: 'bg-transparent text-foreground border border-hairline',
    
    // Notion Database Property Select Pills
    mint: 'notion-tag-mint border-transparent',
    green: 'notion-tag-mint border-transparent',
    success: 'notion-tag-mint border-transparent',

    peach: 'notion-tag-peach border-transparent',
    orange: 'notion-tag-peach border-transparent',
    warning: 'notion-tag-peach border-transparent',

    rose: 'notion-tag-rose border-transparent',
    red: 'notion-tag-rose border-transparent',
    destructive: 'notion-tag-rose border-transparent',

    lavender: 'notion-tag-lavender border-transparent',
    purple: 'notion-tag-lavender border-transparent',

    sky: 'notion-tag-sky border-transparent',
    blue: 'notion-tag-sky border-transparent',

    yellow: 'notion-tag-yellow border-transparent',
    gray: 'notion-tag-gray border-transparent',

    // Signature Notion Purple Pill
    'notion-purple': 'bg-[#5645d4] text-white border-transparent font-medium',
    primary: 'bg-[#5645d4] text-white border-transparent font-medium'
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-[4px] px-2 py-0.5 text-[11px] font-medium transition-colors select-none',
        variants[variant] || variants.default,
        className
      )}
      {...props}
    />
  );
}
