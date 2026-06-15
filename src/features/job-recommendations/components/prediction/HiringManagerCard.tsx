import { Briefcase, MessageSquare, ShieldAlert, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface HiringManagerCardProps {
  feedback: string;
  recommendation: string;
  roleFit: number;
  technicalFit: number;
  experienceFit: number;
}

export function HiringManagerCard({
  feedback,
  recommendation,
  roleFit,
  technicalFit,
  experienceFit,
}: HiringManagerCardProps) {
  const getRecommendationVariant = (rec: string) => {
    const r = rec.toLowerCase();
    if (r.includes('apply now') || r.includes('recommend') || r.includes('hire')) return 'success';
    if (r.includes('upskill') || r.includes('soon')) return 'warning';
    return 'danger';
  };

  const scores = [
    { label: 'Role Fit', value: roleFit, color: 'text-indigo-400' },
    { label: 'Technical Fit', value: technicalFit, color: 'text-emerald-400' },
    { label: 'Experience Fit', value: experienceFit, color: 'text-amber-400' },
  ];

  return (
    <Card className="border-gray-800 bg-[#121212]/90 shadow-xl relative overflow-hidden">
      <div className="absolute -right-8 -bottom-8 opacity-5 text-gray-500 scale-150 pointer-events-none">
        <Briefcase size={180} />
      </div>

      <CardHeader className="pb-3 border-b border-gray-800/60">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg p-2 bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Briefcase size={18} />
            </div>
            <div>
              <CardTitle className="text-base text-gray-100">Hiring Manager Review</CardTitle>
              <p className="text-xs text-gray-500">Internal team interview alignment notes</p>
            </div>
          </div>
          <Badge variant={getRecommendationVariant(recommendation)}>
            Rec: {recommendation}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-5 space-y-4">
        {/* HM internal review comments */}
        <div className="rounded-xl bg-gray-950/60 border border-gray-800 p-4 relative">
          <span className="absolute -top-2.5 left-4 px-2 bg-gray-900 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
            Hiring Team Internal Assessment
          </span>
          <p className="text-sm text-gray-300 italic leading-relaxed pt-1">
            "{feedback}"
          </p>
        </div>

        {/* Sub-scores breakdown */}
        <div className="grid gap-3 grid-cols-3 pt-2">
          {scores.map((score, i) => (
            <div key={i} className="rounded-lg bg-gray-950/50 border border-gray-800/40 p-3 text-center">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">
                {score.label}
              </span>
              <span className={`text-xl font-black font-[font2] tracking-tight ${score.color} block mt-1`}>
                {score.value}%
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
