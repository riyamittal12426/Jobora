import { Trophy, Target, TrendingUp, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CircularScore } from '@/features/mock-interview/components/CircularScore';
import { Badge } from '@/components/ui/badge';
import type { ApplyReadinessDashboard } from '@/types/jobs';

interface ApplyReadinessPanelProps {
  data: ApplyReadinessDashboard;
}

export function ApplyReadinessPanel({ data }: ApplyReadinessPanelProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="flex justify-center p-6">
          <CircularScore score={data.overallMarketReadiness} label="Market Readiness" colorClass="text-emerald-400" strokeColor="text-emerald-500" />
        </Card>
        <Card className="flex justify-center p-6">
          <CircularScore score={data.averageRecommendationScore} label="Avg. Score" colorClass="text-indigo-400" strokeColor="text-indigo-500" />
        </Card>
        <Card className="flex justify-center p-6">
          <CircularScore score={data.estimatedInterviewSuccessRate} label="Interview Success" colorClass="text-blue-400" strokeColor="text-blue-500" />
        </Card>
        <Card className="p-6 text-center">
          <Zap className="mx-auto mb-2 text-yellow-400" size={28} />
          <p className="text-3xl font-bold text-white">{data.applyNowCount}</p>
          <p className="text-xs text-gray-400 mt-1">Apply Now Opportunities</p>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base text-green-400"><TrendingUp size={18} /> Strongest Category</CardTitle></CardHeader>
          <CardContent><p className="text-lg font-semibold">{data.strongestCategory}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base text-red-400"><Target size={18} /> Weakest Category</CardTitle></CardHeader>
          <CardContent><p className="text-lg font-semibold">{data.weakestCategory}</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Trophy size={18} className="text-yellow-400" /> Top Opportunities — Apply Now</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.topOpportunities.map((opp, i) => (
            <div key={i} className="flex items-center justify-between rounded-xl border border-gray-800 p-4">
              <div>
                <p className="font-medium text-white">{opp.title}</p>
                <p className="text-sm text-gray-400">{opp.company}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="success">{opp.matchScore}%</Badge>
                <Badge variant="default">{opp.applyRecommendation}</Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
