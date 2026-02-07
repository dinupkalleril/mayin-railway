import { ReactNode, ButtonHTMLAttributes } from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  loading?: boolean;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  disabled,
  loading,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        // Base styles
        'relative inline-flex items-center justify-center font-medium rounded-lg',
        'transition-all duration-200 ease-out',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-railway-black',
        // Size variants
        {
          'px-3 py-1.5 text-xs gap-1.5': size === 'sm',
          'px-4 py-2.5 text-sm gap-2': size === 'md',
          'px-6 py-3 text-base gap-2.5': size === 'lg',
        },
        // Variant styles - Railway inspired
        {
          // Primary - White button (Railway's main CTA style)
          'bg-white text-railway-black hover:bg-neutral-200 active:bg-neutral-300 shadow-sm hover:shadow-md':
            variant === 'primary',
          // Secondary - Subtle dark button
          'bg-railway-elevated text-railway-white border border-railway-border hover:bg-railway-hover hover:border-railway-border-hover':
            variant === 'secondary',
          // Outline - Border only
          'bg-transparent text-railway-gray border border-railway-border hover:text-railway-white hover:border-railway-border-hover hover:bg-railway-elevated/50':
            variant === 'outline',
          // Ghost - No background
          'bg-transparent text-railway-gray hover:text-railway-white hover:bg-railway-elevated':
            variant === 'ghost',
          // Danger - Red destructive action
          'bg-red-600 text-white hover:bg-red-500 shadow-sm shadow-red-900/20':
            variant === 'danger',
          // Accent - Purple gradient (Railway's accent style)
          'bg-primary-600 text-white hover:bg-primary-500 shadow-lg shadow-primary-900/30':
            variant === 'accent',
        },
        // Disabled state
        {
          'opacity-50 cursor-not-allowed pointer-events-none': disabled || loading,
        },
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin h-4 w-4 mr-2"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
