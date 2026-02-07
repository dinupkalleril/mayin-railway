import { ReactNode } from 'react';
import { clsx } from 'clsx';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  gradient?: boolean;
}

export function Card({ children, className, hover = false, glow = false, gradient = false }: CardProps) {
  return (
    <div
      className={clsx(
        // Base Railway-style card
        'bg-railway-card rounded-xl border border-railway-border',
        // Subtle gradient overlay
        'bg-gradient-to-b from-white/[0.02] to-transparent',
        // Inner shadow for depth
        'shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)]',
        // Hover effects
        hover && [
          'transition-all duration-300 ease-out cursor-pointer',
          'hover:border-railway-border-hover',
          'hover:shadow-[0_4px_20px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.05)]',
          'hover:translate-y-[-2px]',
        ],
        // Glow effect (purple accent)
        glow && 'shadow-[0_0_40px_rgba(168,85,247,0.15)]',
        // Gradient border effect
        gradient && 'gradient-border',
        className
      )}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return (
    <div className={clsx(
      'px-6 py-4 border-b border-railway-border',
      className
    )}>
      {children}
    </div>
  );
}

interface CardContentProps {
  children: ReactNode;
  className?: string;
}

export function CardContent({ children, className }: CardContentProps) {
  return (
    <div className={clsx('p-6', className)}>
      {children}
    </div>
  );
}

interface CardTitleProps {
  children: ReactNode;
  className?: string;
}

export function CardTitle({ children, className }: CardTitleProps) {
  return (
    <h2 className={clsx(
      'text-lg font-semibold text-railway-white',
      className
    )}>
      {children}
    </h2>
  );
}

interface CardDescriptionProps {
  children: ReactNode;
  className?: string;
}

export function CardDescription({ children, className }: CardDescriptionProps) {
  return (
    <p className={clsx(
      'text-sm text-railway-gray mt-1',
      className
    )}>
      {children}
    </p>
  );
}

interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

export function CardFooter({ children, className }: CardFooterProps) {
  return (
    <div className={clsx(
      'px-6 py-4 border-t border-railway-border bg-railway-dark/50',
      className
    )}>
      {children}
    </div>
  );
}
