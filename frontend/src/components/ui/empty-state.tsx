import React from 'react';
import { Button } from './button';
import type { ButtonProps } from './button';
import { cn } from '../../utils/cn';

export interface EmptyStateProps {
  icon: React.ElementType;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionVariant?: ButtonProps['variant'];
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionVariant = 'default',
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center rounded-xl border border-dashed border-border bg-card/50',
        className,
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/70 text-muted-foreground ring-8 ring-muted/30">
        <Icon size={26} strokeWidth={1.75} />
      </div>
      <h3 className="mt-4 text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} variant={actionVariant} size="sm" className="mt-5">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
