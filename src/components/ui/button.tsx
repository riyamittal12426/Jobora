import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'secondary' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const variants = {
  default: 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-900/20',
  outline: 'border border-gray-700 bg-transparent hover:bg-gray-800 text-gray-200',
  ghost: 'hover:bg-gray-800 text-gray-300',
  secondary: 'bg-gray-800 text-gray-100 hover:bg-gray-700 border border-gray-700',
  destructive: 'bg-red-900/60 text-red-100 hover:bg-red-800',
};

const sizes = {
  default: 'h-10 px-4 py-2',
  sm: 'h-8 rounded-md px-3 text-xs',
  lg: 'h-12 rounded-xl px-8 text-base',
  icon: 'h-10 w-10',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  )
);
Button.displayName = 'Button';
