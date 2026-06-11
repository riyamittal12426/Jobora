import * as React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'outline';
}

const variants = {
  default: 'bg-indigo-900/40 text-indigo-200 border-indigo-700/50',
  success: 'bg-green-900/30 text-green-300 border-green-700/50',
  warning: 'bg-yellow-900/30 text-yellow-300 border-yellow-700/50',
  danger: 'bg-red-900/30 text-red-300 border-red-700/50',
  outline: 'bg-transparent text-gray-300 border-gray-600',
};

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
