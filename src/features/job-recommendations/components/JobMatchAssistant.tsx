import { useState } from 'react';
import { Sparkles, Loader2, FileSearch } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { MatchBadge } from './MatchBadge';
import { jobApi } from '@/services/jobApi';
import type { JobMatchAnalysis } from '@/types/jobs';

interface JobMatchAssistantProps {
  userEmail: string;
}

export function JobMatchAssistant({ userEmail }: JobMatchAssistantProps) {
  const [jd, setJd] = useState('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<JobMatchAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyze = async () => {
    if (!jd.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await jobApi.analyzeJobDescription(userEmail, jd, title || 'Custom Role');
      setAnalysis(res.analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileSearch size={20} className="text-indigo-400" /> AI Job Match Assistant</CardTitle>
          <CardDescription>Paste any job description to instantly get match score, apply readiness, and prep plan.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Job title (optional)"
            className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-2 text-sm text-white"
          />
          <textarea
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            rows={8}
            placeholder="Paste the full job description here..."
            className="w-full resize-none rounded-xl border border-gray-700 bg-gray-950/50 px-4 py-3 text-sm text-gray-100 placeholder:text-gray-600"
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button onClick={analyze} disabled={loading || !jd.trim()}>
            {loading ? <><Loader2 size={16} className="animate-spin" /> Analyzing...</> : <><Sparkles size={16} /> Analyze Match</>}
          </Button>
        </CardContent>
      </Card>

      {analysis && (
        <Card className="border-indigo-500/20">
          <CardContent className="space-y-4 p-6">
            <div className="flex flex-wrap gap-3">
              <MatchBadge score={analysis.matchScore} />
              <Badge variant="default">{analysis.applyRecommendation}</Badge>
              <Badge variant="outline">Interview: {analysis.interviewProbability}</Badge>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><p className="text-xs text-gray-500 mb-1">Apply Readiness</p><Progress value={analysis.applyReadinessScore} /></div>
              <div><p className="text-xs text-gray-500 mb-1">Skill Alignment</p><Progress value={analysis.skillAlignmentScore} indicatorClassName="bg-green-500" /></div>
            </div>
            <p className="text-sm text-gray-300">{analysis.applyRecommendationReason}</p>
            <div>
              <p className="text-xs font-bold text-yellow-400 mb-2">Missing Skills</p>
              <div className="flex flex-wrap gap-2">
                {analysis.missingSkills.map((s) => <Badge key={s} variant="warning">{s}</Badge>)}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-indigo-400 mb-2">Recruiter Feedback</p>
              <p className="text-sm text-gray-300">{analysis.recruiterFeedback}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-purple-400 mb-2">Preparation Plan</p>
              <ul className="text-sm text-gray-300 space-y-1">
                {(analysis.interviewPrepTips || analysis.improvementSuggestions).map((t, i) => <li key={i}>• {t}</li>)}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
