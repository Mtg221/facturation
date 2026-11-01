import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from './card';
import { cn } from '../../utils/cn';
import { formatPercent } from '../../utils/format-currency';

export interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  trend?: number;
  iconBg?: string;
  iconColor?: string;
}

export function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  trend,
  iconBg = 'bg-primary/10',
  iconColor = 'text-primary',
}: StatCardProps) {
  return (
    <Card className="p-5 hover:border-primary/30 transition-all duration-200">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
          {sub && <p className="text-xs text-muted-foreground/80">{sub}</p>}
        </div>
        <div className={cn('p-3 rounded-xl shrink-0 transition-transform hover:scale-105', iconBg)}>
          <Icon size={20} className={iconColor} />
        </div>
      </div>
      {trend !== undefined && (
        <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-border/60">
          <span
            className={cn(
              'inline-flex items-center gap-1 text-xs font-semibold px-1.5 py-0.5 rounded',
              trend >= 0
                ? 'text-emerald-700 bg-emerald-500/10 dark:text-emerald-400'
                : 'text-destructive bg-destructive/10',
            )}
          >
            {trend >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
            {formatPercent(trend)}
          </span>
          <span className="text-xs text-muted-foreground">vs mois dernier</span>
        </div>
      )}
    </Card>
  );
}
