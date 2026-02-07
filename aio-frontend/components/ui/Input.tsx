import { InputHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-railway-gray mb-2">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={clsx(
            // Base styles
            'w-full px-4 py-3 rounded-lg',
            'bg-railway-dark border border-railway-border',
            'text-railway-white placeholder-railway-muted',
            // Focus styles
            'focus:outline-none focus:border-primary-500/50 focus:bg-railway-elevated',
            'focus:ring-2 focus:ring-primary-500/20',
            // Hover styles
            'hover:border-railway-border-hover',
            // Transition
            'transition-all duration-200',
            // Error state
            error && 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20',
            // Disabled state
            props.disabled && 'opacity-50 cursor-not-allowed',
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-2 text-sm text-red-400">{error}</p>
        )}
        {hint && !error && (
          <p className="mt-2 text-sm text-railway-muted">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

interface TextAreaProps extends InputHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  rows?: number;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, hint, className, rows = 4, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-railway-gray mb-2">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          rows={rows}
          className={clsx(
            // Base styles
            'w-full px-4 py-3 rounded-lg resize-none',
            'bg-railway-dark border border-railway-border',
            'text-railway-white placeholder-railway-muted',
            // Focus styles
            'focus:outline-none focus:border-primary-500/50 focus:bg-railway-elevated',
            'focus:ring-2 focus:ring-primary-500/20',
            // Hover styles
            'hover:border-railway-border-hover',
            // Transition
            'transition-all duration-200',
            // Error state
            error && 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20',
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-2 text-sm text-red-400">{error}</p>
        )}
        {hint && !error && (
          <p className="mt-2 text-sm text-railway-muted">{hint}</p>
        )}
      </div>
    );
  }
);

TextArea.displayName = 'TextArea';

interface SelectProps extends InputHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-railway-gray mb-2">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={clsx(
            // Base styles
            'w-full px-4 py-3 rounded-lg appearance-none',
            'bg-railway-dark border border-railway-border',
            'text-railway-white',
            // Focus styles
            'focus:outline-none focus:border-primary-500/50 focus:bg-railway-elevated',
            'focus:ring-2 focus:ring-primary-500/20',
            // Hover styles
            'hover:border-railway-border-hover',
            // Transition
            'transition-all duration-200',
            // Arrow
            'bg-[url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%23737373\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'/%3E%3C/svg%3E")]',
            'bg-[length:1.25rem] bg-[right_0.75rem_center] bg-no-repeat pr-10',
            // Error state
            error && 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20',
            className
          )}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="mt-2 text-sm text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
