import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CircularScoreProps {
  score: number;
  label: string;
  colorClass?: string;
  strokeColor?: string;
  size?: number;
}

export function CircularScore({
  score,
  label,
  colorClass = 'text-indigo-400',
  strokeColor = 'text-indigo-500',
  size = 96,
}: CircularScoreProps) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="flex flex-col items-center">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg className="h-full w-full -rotate-90 transform">
          <circle cx="50%" cy="50%" r={radius} stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-800" />
          <motion.circle
            cx="50%"
            cy="50%"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - (circumference * score) / 100 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className={strokeColor}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className={cn('text-2xl font-bold font-[font2]', colorClass)}>{Math.round(score)}</span>
        </div>
      </div>
      <span className="mt-2 text-center text-xs font-medium text-gray-400">{label}</span>
    </div>
  );
}
