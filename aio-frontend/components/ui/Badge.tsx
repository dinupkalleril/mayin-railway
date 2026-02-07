import { ReactNode } from 'react';
import { clsx } from 'clsx';

interface BadgeProps {
  children: ReactNode;
  variant?: 'success' | 'error' | 'warning' | 'info' | 'default' | 'accent';
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  className
}: BadgeProps) {
  return (
    <span
      className={clsx(
        // Base styles
        'inline-flex items-center gap-1.5 font-medium rounded-full',
        // Size variants
        {
          'px-2 py-0.5 text-[10px]': size === 'sm',
          'px-2.5 py-1 text-xs': size === 'md',
        },
        // Color variants - Railway dark theme style
        {
          'bg-green-500/10 text-green-400 border border-green-500/20': variant === 'success',
          'bg-red-500/10 text-red-400 border border-red-500/20': variant === 'error',
          'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20': variant === 'warning',
          'bg-blue-500/10 text-blue-400 border border-blue-500/20': variant === 'info',
          'bg-railway-elevated text-railway-gray border border-railway-border': variant === 'default',
          'bg-primary-500/10 text-primary-400 border border-primary-500/20': variant === 'accent',
        },
        className
      )}
    >
      {dot && (
        <span
          className={clsx(
            'w-1.5 h-1.5 rounded-full',
            {
              'bg-green-400 shadow-[0_0_6px_rgba(34,197,94,0.5)]': variant === 'success',
              'bg-red-400 shadow-[0_0_6px_rgba(239,68,68,0.5)]': variant === 'error',
              'bg-yellow-400 shadow-[0_0_6px_rgba(245,158,11,0.5)]': variant === 'warning',
              'bg-blue-400 shadow-[0_0_6px_rgba(59,130,246,0.5)]': variant === 'info',
              'bg-railway-gray': variant === 'default',
              'bg-primary-400 shadow-[0_0_6px_rgba(168,85,247,0.5)]': variant === 'accent',
            }
          )}
        />
      )}
      {children}
    </span>
  );
}

// Status badge with animated dot
interface StatusBadgeProps {
  status: 'online' | 'offline' | 'pending' | 'error';
  children?: ReactNode;
  className?: string;
}

export function StatusBadge({ status, children, className }: StatusBadgeProps) {
  const statusConfig = {
    online: {
      color: 'bg-green-500',
      glow: 'shadow-[0_0_8px_rgba(34,197,94,0.6)]',
      text: 'text-green-400',
      bg: 'bg-green-500/10',
      border: 'border-green-500/20',
      label: 'Online',
    },
    offline: {
      color: 'bg-railway-muted',
      glow: '',
      text: 'text-railway-muted',
      bg: 'bg-railway-elevated',
      border: 'border-railway-border',
      label: 'Offline',
    },
    pending: {
      color: 'bg-yellow-500',
      glow: 'shadow-[0_0_8px_rgba(245,158,11,0.6)]',
      text: 'text-yellow-400',
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/20',
      label: 'Pending',
    },
    error: {
      color: 'bg-red-500',
      glow: 'shadow-[0_0_8px_rgba(239,68,68,0.6)]',
      text: 'text-red-400',
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
      label: 'Error',
    },
  };

  const config = statusConfig[status];

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium',
        config.bg,
        config.text,
        'border',
        config.border,
        className
      )}
    >
      <span className="relative flex h-2 w-2">
        {status === 'online' && (
          <span className={clsx(
            'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
            config.color
          )} />
        )}
        <span className={clsx(
          'relative inline-flex rounded-full h-2 w-2',
          config.color,
          config.glow
        )} />
      </span>
      {children || config.label}
    </span>
  );
}
