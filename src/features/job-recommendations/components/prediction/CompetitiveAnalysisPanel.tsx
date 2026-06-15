import { Users, BarChart3, Medal, Trophy } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface CompetitiveAnalysisPanelProps {
  competitionLevel: string;
  estimatedRanking: string; // e.g. "Top 10%", "Top 25%"
  applicationStrategy: string;
}

export function CompetitiveAnalysisPanel({
  competitionLevel,
  estimatedRanking,
  applicationStrategy,
}: CompetitiveAnalysisPanelProps) {
  // Convert "Top 10%" to a numeric value for positioning, default 25 if fails
  const rankPercent = parseInt(estimatedRanking.replace(/[^0-9]/g, '')) || 25;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <div className="rounded-lg p-1.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
          <Users size={16} />
        </div>
        <div>
          <h3 className="text-base font-bold text-gray-200 font-[font2]">Competitive Market Analysis</h3>
          <p className="text-xs text-gray-500">Estimates of how you rank against overall applicant pools</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Metric Cards */}
        <Card className="border-gray-800 bg-[#121212]/50 shadow-md">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="rounded-xl p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Trophy size={22} />
            </div>
            <div>
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Estimated Rank</span>
              <span className="text-2xl font-black font-[font2] tracking-tight text-white block mt-0.5">
                {estimatedRanking}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-800 bg-[#121212]/50 shadow-md">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="rounded-xl p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <BarChart3 size={22} />
            </div>
            <div>
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Competition Level</span>
              <span className="text-2xl font-black font-[font2] tracking-tight text-white block mt-0.5">
                {competitionLevel}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visual Rank Distribution Slider / Bar */}
      <div className="rounded-xl border border-gray-800 bg-[#121212]/40 p-5 space-y-4">
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
          <Medal size={13} className="text-indigo-400" /> Applicant Pool Distribution
        </h4>

        <div className="relative pt-4 pb-2">
          {/* Scale line */}
          <div className="h-2 w-full rounded-full bg-gray-800 relative">
            {/* Visual zones */}
            <div className="absolute top-0 bottom-0 left-0 w-[15%] rounded-l-full bg-gradient-to-r from-emerald-600 to-emerald-500 opacity-60" />
            <div className="absolute top-0 bottom-0 left-[15%] w-[25%] bg-indigo-500 opacity-40" />
            <div className="absolute top-0 bottom-0 left-[40%] w-[35%] bg-amber-500 opacity-30" />
            <div className="absolute top-0 bottom-0 left-[75%] w-[25%] rounded-r-full bg-rose-500 opacity-20" />
          </div>

          {/* Marker representing the user */}
          <div
            className="absolute top-1 transform -translate-x-1/2 flex flex-col items-center group cursor-default"
            style={{ left: `${100 - rankPercent}%` }}
          >
            <div className="h-4 w-4 rounded-full border-2 border-[#000] bg-indigo-400 shadow-lg shadow-indigo-500/50" />
            <span className="mt-1.5 rounded bg-indigo-600 px-1.5 py-0.5 text-[9px] font-bold text-white shadow">
              You (Top {rankPercent}%)
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex justify-between items-center text-[9px] font-bold text-gray-500 uppercase tracking-wider px-1">
          <span>Average (Bottom 50%)</span>
          <span>Strong Match (Top 25%)</span>
          <span>Exceptional (Top 10%)</span>
        </div>
      </div>

      {/* Application Strategy */}
      <div className="rounded-xl border border-indigo-500/20 bg-indigo-950/10 p-4.5">
        <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider block mb-1.5">
          Strategic Application Recommendation
        </h4>
        <p className="text-xs text-gray-300 leading-relaxed">
          {applicationStrategy}
        </p>
      </div>
    </div>
  );
}
