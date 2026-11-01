import React from 'react';
import { cn } from '../../utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'info' | 'outline';
  dot?: boolean;
}

export function Badge({
  className,
  variant = 'default',
  dot = false,
  children,
  ...props
}: BadgeProps) {
  const variants = {
    default: 'bg-muted text-foreground border-border/80',
    secondary: 'bg-secondary/15 text-secondary border-secondary/20',
    success: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/25',
    warning: 'bg-amber-500/15 text-amber-800 dark:text-amber-400 border-amber-500/25',
    destructive: 'bg-destructive/15 text-destructive border-destructive/25',
    info: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/25',
    outline: 'border-border text-muted-foreground bg-transparent',
  };

  const dotColors = {
    default: 'bg-muted-foreground',
    secondary: 'bg-secondary',
    success: 'bg-emerald-600',
    warning: 'bg-amber-500',
    destructive: 'bg-destructive',
    info: 'bg-blue-600',
    outline: 'bg-slate-400',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors',
        variants[variant],
        className,
      )}
      {...props}
    >
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', dotColors[variant])} />}
      {children}
    </span>
  );
}
