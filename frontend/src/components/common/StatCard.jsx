import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { cn } from '../../lib/utils';

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconBg,
  className,
  onClick
}) {
  return (
    <Card
      onClick={onClick}
      className={cn(
        'border border-hairline bg-card text-card-foreground shadow-notion-card transition-all rounded-lg',
        onClick && 'cursor-pointer hover:border-hairline-strong hover:bg-surface/50',
        className
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
        <CardTitle className="text-xs font-medium text-steel">
          {title}
        </CardTitle>
        {Icon && (
          <div className={cn(
            "h-8 w-8 rounded-full flex items-center justify-center shrink-0 border transition-transform",
            iconBg || "bg-surface border-hairline text-steel"
          )}>
            <Icon className="h-4 w-4" />
          </div>
        )}
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="text-xl sm:text-2xl font-bold tracking-tight text-charcoal dark:text-foreground">{value}</div>
        {subtitle && (
          <p className="text-[11px] text-steel mt-0.5 leading-normal">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}
