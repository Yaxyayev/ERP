import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { cn } from '../../lib/utils';

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  className,
  onClick
}) {
  return (
    <Card
      onClick={onClick}
      className={cn(
        'border border-border bg-card text-card-foreground shadow-sm transition-all',
        onClick && 'cursor-pointer hover:border-zinc-400 dark:hover:border-zinc-700',
        className
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
        <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="text-2xl font-bold tracking-tight text-foreground">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1 leading-normal">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}
