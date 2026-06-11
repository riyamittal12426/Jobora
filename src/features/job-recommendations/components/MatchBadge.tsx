import { Badge } from '@/components/ui/badge';
import { getMatchBadgeVariant } from '@/types/jobs';
import { cn } from '@/lib/utils';

interface MatchBadgeProps {
  score: number;
  label?: string;
  className?: string;
}

export function MatchBadge({ score, label, className }: MatchBadgeProps) {
  const variant = getMatchBadgeVariant(score);
  return (
    <Badge variant={variant} className={cn('text-sm font-bold px-3 py-1', className)}>
      {label ?? `${Math.round(score)}% Match`}
    </Badge>
  );
}
