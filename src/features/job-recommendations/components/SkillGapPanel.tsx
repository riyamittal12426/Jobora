import { Flame, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { SkillGapIntelligence } from '@/types/jobs';

interface SkillGapPanelProps {
  data: SkillGapIntelligence;
}

export function SkillGapPanel({ data }: SkillGapPanelProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5 text-center">
          <p className="text-3xl font-bold text-indigo-400">{data.marketAlignmentScore}%</p>
          <p className="text-xs text-gray-400 mt-1">Market Alignment</p>
        </Card>
        <Card className="p-5 text-center">
          <p className="text-3xl font-bold text-emerald-400">{data.averageMatchScore}%</p>
          <p className="text-xs text-gray-400 mt-1">Average Match</p>
        </Card>
        <Card className="p-5 text-center">
          <p className="text-3xl font-bold text-purple-400">{data.rankedSkills.length}</p>
          <p className="text-xs text-gray-400 mt-1">Skills to Learn</p>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Flame size={18} className="text-orange-400" /> Skill Demand Heatmap</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.rankedSkills.map((skill, i) => (
            <div key={skill.skill} className="rounded-xl border border-gray-800 p-4">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-gray-500">#{i + 1}</span>
                  <span className="font-semibold text-white capitalize">{skill.skill}</span>
                  <Badge variant={i === 0 ? 'danger' : i < 3 ? 'warning' : 'outline'}>
                    {skill.demandPercentage}% demand
                  </Badge>
                </div>
                <Badge variant="outline">{skill.difficulty}</Badge>
              </div>
              <Progress value={skill.demandPercentage} className="mb-2" />
              <div className="grid gap-2 text-xs text-gray-400 sm:grid-cols-3">
                <span>⏱ {skill.estimatedLearningTime}</span>
                <span>📈 +{skill.projectedMatchIncrease}% match boost</span>
                <span className="flex items-center gap-1"><BookOpen size={12} />{skill.resources}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Top Matching Roles</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {data.topMatchingRoles.map((r) => (
            <Badge key={r.role} variant="default">{r.role} — {r.averageMatch}%</Badge>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
