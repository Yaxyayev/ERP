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
        'border border-hairline bg-card text-card-foreground shadow-notion-card transition-colors rounded-lg',
        onClick && 'cursor-pointer hover:border-hairline-strong hover:bg-surface/50',
        className
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3.5 pb-1">
        <CardTitle className="text-xs font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
      </CardHeader>
      <CardContent className="p-3.5 pt-0">
        <div className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">{value}</div>
        {subtitle && (
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-normal">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}
