import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import type { LucideIcon } from 'lucide-react';

interface ScoreCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  percentage?: number; // optionally render a progress bar
  className?: string;
  variant?: 'emerald' | 'amber' | 'indigo' | 'rose' | 'default';
}

export function ScoreCard({
  icon: Icon,
  label,
  value,
  percentage,
  className,
  variant = 'default',
}: ScoreCardProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'emerald':
        return 'border-emerald-500/20 bg-emerald-950/10 text-emerald-300 shadow-emerald-950/5 hover:border-emerald-500/40';
      case 'amber':
        return 'border-amber-500/20 bg-amber-950/10 text-amber-300 shadow-amber-950/5 hover:border-amber-500/40';
      case 'indigo':
        return 'border-indigo-500/20 bg-indigo-950/10 text-indigo-300 shadow-indigo-950/5 hover:border-indigo-500/40';
      case 'rose':
        return 'border-rose-500/20 bg-rose-950/10 text-rose-300 shadow-rose-950/5 hover:border-rose-500/40';
      default:
        return 'border-gray-800 bg-gray-900/40 text-gray-200 hover:border-gray-700';
    }
  };

  const getProgressClassName = () => {
    switch (variant) {
      case 'emerald':
        return 'bg-gradient-to-r from-emerald-500 to-teal-400';
      case 'amber':
        return 'bg-gradient-to-r from-amber-500 to-orange-400';
      case 'rose':
        return 'bg-gradient-to-r from-rose-500 to-red-400';
      default:
        return 'bg-gradient-to-r from-indigo-500 to-purple-400';
    }
  };

  return (
    <div
      className={cn(
        'group flex flex-col justify-between rounded-xl border p-4.5 transition-all duration-300 backdrop-blur-sm shadow-md',
        getVariantStyles(),
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold tracking-wide text-gray-400 uppercase">
          {label}
        </span>
        <div className="rounded-lg p-2 bg-gray-950/40 border border-gray-800/60 group-hover:scale-110 transition-transform">
          <Icon size={16} className="text-gray-300" />
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-extrabold font-[font2] tracking-tight text-white">
            {typeof value === 'number' && percentage !== undefined ? `${value}%` : value}
          </span>
        </div>

        {percentage !== undefined && (
          <div className="mt-3">
            <Progress
              value={percentage}
              className="h-1.5 bg-gray-950"
              indicatorClassName={getProgressClassName()}
            />
          </div>
        )}
      </div>
    </div>
  );
}
