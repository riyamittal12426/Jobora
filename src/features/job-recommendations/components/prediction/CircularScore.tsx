import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface CircularScoreProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
}

export function CircularScore({
  score,
  size = 180,
  strokeWidth = 12,
  label = 'Success Score',
}: CircularScoreProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 1000; // 1s
    const stepTime = Math.abs(Math.floor(duration / score));
    
    const timer = setInterval(() => {
      start += 1;
      if (start > score) {
        clearInterval(timer);
      } else {
        setAnimatedScore(start);
      }
    }, stepTime || 10);

    return () => clearInterval(timer);
  }, [score]);

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  // Determine colors based on score
  const getColor = (val: number) => {
    if (val >= 80) return { stroke: 'url(#score-green)', glow: 'rgba(16, 185, 129, 0.25)', text: 'text-emerald-400' };
    if (val >= 60) return { stroke: 'url(#score-yellow)', glow: 'rgba(245, 158, 11, 0.25)', text: 'text-amber-400' };
    return { stroke: 'url(#score-red)', glow: 'rgba(239, 68, 68, 0.25)', text: 'text-rose-400' };
  };

  const colors = getColor(score);

  return (
    <div className="relative flex flex-col items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <defs>
          <linearGradient id="score-green" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <linearGradient id="score-yellow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
          <linearGradient id="score-red" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#dc2626" />
          </linearGradient>
        </defs>

        {/* Track Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="#1e293b"
          strokeWidth={strokeWidth}
        />

        {/* Animated Fill Circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={colors.stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: 'easeOut' }}
          strokeLinecap="round"
          style={{
            filter: `drop-shadow(0 0 8px ${colors.glow})`,
          }}
        />
      </svg>

      {/* Inner Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className={`text-4xl font-extrabold font-[font2] tracking-tight ${colors.text}`}>
          {animatedScore}%
        </span>
        <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 mt-1">
          {label}
        </span>
      </div>
    </div>
  );
}
