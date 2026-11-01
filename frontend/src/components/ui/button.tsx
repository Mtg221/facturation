import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'accent';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'default',
      size = 'md',
      isLoading = false,
      disabled,
      children,
      type = 'button',
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background cursor-pointer select-none';

    const variants = {
      default:
        'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm shadow-primary/20',
      secondary:
        'bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-sm shadow-secondary/20',
      accent:
        'bg-accent text-accent-foreground hover:bg-accent/90 shadow-sm shadow-accent/20',
      outline:
        'border border-border bg-card text-foreground hover:bg-muted hover:text-foreground',
      ghost:
        'text-muted-foreground hover:bg-muted hover:text-foreground',
      destructive:
        'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm shadow-destructive/20',
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs rounded-md gap-1.5',
      md: 'h-10 px-4 py-2 text-sm rounded-lg gap-2',
      lg: 'h-11 px-6 text-base rounded-lg gap-2.5',
      icon: 'h-9 w-9 rounded-lg p-0',
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-current shrink-0" />}
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';
