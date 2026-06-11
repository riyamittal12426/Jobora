import { Compass, Calendar, DollarSign, Building } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { CareerAdvisor } from '@/types/jobs';

interface CareerAdvisorPanelProps {
  data: CareerAdvisor;
}

export function CareerAdvisorPanel({ data }: CareerAdvisorPanelProps) {
  return (
    <div className="space-y-6">
      <Card className="border-indigo-500/20 bg-gradient-to-br from-indigo-950/30 to-gray-900/50">
        <CardContent className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <Compass className="text-indigo-400" size={24} />
            <h2 className="text-xl font-bold font-[font2]">AI Career Advisor</h2>
          </div>
          <p className="text-sm text-indigo-100/80 mb-4">{data.bestCareerPath}</p>
          <div className="mb-2 flex justify-between text-sm">
            <span className="text-gray-400">Market Readiness</span>
            <span className="text-indigo-300">{data.marketReadiness}%</span>
          </div>
          <Progress value={data.marketReadiness} />
          <p className="mt-4 text-sm italic text-gray-400">"{data.recruiterComment}"</p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><DollarSign size={16} /> Expected Salary</CardTitle></CardHeader>
          <CardContent><p className="text-lg font-semibold text-emerald-400">{data.expectedSalaryRange}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Fastest Salary Route</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-gray-300">{data.fastestSalaryRoute}</p></CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base text-green-400">Strongest Skills</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {data.strongestSkills.map((s) => <Badge key={s} variant="success">{s}</Badge>)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base text-red-400">Weakest Areas</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {data.weakestAreas.map((s) => <Badge key={s} variant="danger">{s}</Badge>)}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Building size={16} /> Top Companies to Target</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {data.topCompaniesToTarget.map((c) => <Badge key={c} variant="outline">{c}</Badge>)}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Recommended Roles</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {data.recommendedRoles.map((r) => <Badge key={r} variant="default">{r}</Badge>)}
        </CardContent>
      </Card>

      {[
        { label: '30-Day Roadmap', items: data.roadmap30Days, color: 'text-green-400' },
        { label: '60-Day Roadmap', items: data.roadmap60Days, color: 'text-blue-400' },
        { label: '90-Day Roadmap', items: data.roadmap90Days, color: 'text-purple-400' },
      ].map((roadmap) => (
        <Card key={roadmap.label}>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 text-base ${roadmap.color}`}>
              <Calendar size={16} /> {roadmap.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-300">
              {roadmap.items.map((item, i) => <li key={i}>• {item}</li>)}
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
