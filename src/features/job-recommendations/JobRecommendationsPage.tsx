import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Briefcase, Loader2, RefreshCw, Sparkles,
  Target, BarChart3, Compass, FileSearch, AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InterviewSkeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useJobRecommendations } from '@/hooks/useJobRecommendations';
import { JobCard } from './components/JobCard';
import { JobMatchModal } from './components/JobMatchModal';
import { ApplyReadinessPanel } from './components/ApplyReadinessPanel';
import { SkillGapPanel } from './components/SkillGapPanel';
import { CareerAdvisorPanel } from './components/CareerAdvisorPanel';
import { JobMatchAssistant } from './components/JobMatchAssistant';
import type { JobWithAnalysis } from '@/types/jobs';

type Tab = 'jobs' | 'readiness' | 'skills' | 'advisor' | 'assistant';

const TABS: { id: Tab; label: string; icon: typeof Briefcase }[] = [
  { id: 'jobs', label: 'Recommendations', icon: Briefcase },
  { id: 'readiness', label: 'Apply Readiness', icon: Target },
  { id: 'skills', label: 'Skill Gap', icon: BarChart3 },
  { id: 'advisor', label: 'Career Advisor', icon: Compass },
  { id: 'assistant', label: 'Match Assistant', icon: FileSearch },
];

export default function JobRecommendationsPage() {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState('');
  const [tab, setTab] = useState<Tab>('jobs');
  const [selectedJob, setSelectedJob] = useState<JobWithAnalysis | null>(null);
  const [selectedJobIds, setSelectedJobIds] = useState<string[]>([]);

  const { session, loading, generating, error, generate, toggleSave, isSaved, setError } =
    useJobRecommendations(userEmail);

  const handleSelectJob = (jobId: string) => {
    setSelectedJobIds((prev) =>
      prev.includes(jobId) ? prev.filter((id) => id !== jobId) : [...prev, jobId]
    );
  };

  const handleStartSmartApply = () => {
    if (!session) return;
    const jobsToAutomate = session.jobs
      .filter((item) => selectedJobIds.includes(item.job.jobId))
      .map((item) => ({
        jobId: item.job.jobId,
        title: item.job.title,
        company: item.job.company,
        location: item.job.location,
        employmentType: item.job.employmentType,
        description: item.job.description,
        applyLink: item.job.applyLink,
        salaryMin: item.job.salaryMin,
        salaryMax: item.job.salaryMax,
        salaryCurrency: item.job.salaryCurrency,
        matchScore: item.analysis.matchScore,
        applyReadinessScore: item.analysis.applyReadinessScore || item.analysis.roleFitScore || 50
      }));

    navigate('/automation', { state: { selectedJobs: jobsToAutomate } });
  };

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) {
      navigate('/auth');
      return;
    }
    setUserEmail(JSON.parse(stored).email);
  }, [navigate]);

  const noSession = !loading && !session;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <header className="sticky top-0 z-40 border-b border-gray-800 bg-gray-950/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            <ArrowLeft size={18} /> Dashboard
          </Button>
          <div className="text-center">
            <h1 className="text-lg font-bold font-[font2] text-emerald-200">AI Job Recommendations</h1>
            <p className="text-xs text-gray-500">Powered by JSearch + Groq AI</p>
          </div>
          <Button
            size="sm"
            onClick={() => generate()}
            disabled={generating}
          >
            {generating ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            {generating ? 'Analyzing...' : 'Refresh'}
          </Button>
        </div>

        {session && (
          <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-6 pb-3 scrollbar-hide">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  tab === t.id ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <t.icon size={14} /> {t.label}
              </button>
            ))}
          </div>
        )}
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {(error) && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-950/20 p-4 text-sm text-red-300">
            <AlertCircle size={18} /> {error}
            <button onClick={() => setError(null)} className="ml-auto text-xs underline">Dismiss</button>
          </div>
        )}

        {loading && <InterviewSkeleton />}

        {noSession && !generating && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 text-center">
            <Briefcase size={56} className="mx-auto mb-6 text-emerald-400 opacity-60" />
            <h2 className="text-2xl font-bold font-[font2] mb-3">Discover Your Perfect Roles</h2>
            <p className="text-gray-400 max-w-lg mx-auto mb-8">
              We'll fetch real jobs from JSearch, analyze each one against your resume with Groq AI, and rank them by match score.
            </p>
            <Button size="lg" onClick={() => generate()} disabled={generating}>
              {generating ? <><Loader2 className="animate-spin" size={18} /> Generating...</> : <><Sparkles size={18} /> Generate AI Recommendations</>}
            </Button>
            <p className="mt-4 text-xs text-gray-600">Requires completed resume analysis · Takes 1-2 minutes</p>
          </motion.div>
        )}

        {generating && !session && (
          <div className="py-20 text-center space-y-4">
            <Loader2 size={48} className="mx-auto animate-spin text-emerald-400" />
            <p className="text-lg text-emerald-200">Fetching jobs & running AI match analysis...</p>
            <p className="text-sm text-gray-500">JSearch → Groq recruiter analysis → ranked results</p>
          </div>
        )}

        {session && tab === 'jobs' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="success">{session.jobs.length} Jobs Found</Badge>
                <Badge variant="default">Avg Match: {session.analytics.averageMatchScore}%</Badge>
                <Badge variant="outline">Market Alignment: {session.analytics.marketAlignmentScore}%</Badge>
              </div>
            </div>

            {selectedJobIds.length > 0 && (
              <div className="flex flex-wrap justify-between items-center bg-indigo-950/40 border border-indigo-500/30 p-4 rounded-xl gap-3">
                <div className="text-sm">
                  <span className="font-bold text-indigo-200">{selectedJobIds.length}</span> jobs selected for automation
                </div>
                <div className="flex gap-2.5">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedJobIds([])}
                  >
                    Clear Selection
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleStartSmartApply}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                  >
                    <Sparkles size={14} className="mr-1" /> Start Smart Apply
                  </Button>
                </div>
              </div>
            )}

            <div className="grid gap-6">
              {session.jobs.map((item) => (
                <JobCard
                  key={item.job.jobId}
                  item={item}
                  saved={isSaved(item.job.jobId)}
                  onSave={() => toggleSave(item.job.jobId, item.job, item.analysis)}
                  onAnalyze={() => setSelectedJob(item)}
                  selected={selectedJobIds.includes(item.job.jobId)}
                  onSelect={() => handleSelectJob(item.job.jobId)}
                />
              ))}
            </div>
          </div>
        )}

        {session && tab === 'readiness' && <ApplyReadinessPanel data={session.applyReadinessDashboard} />}
        {session && tab === 'skills' && <SkillGapPanel data={session.skillGapIntelligence} />}
        {session && tab === 'advisor' && <CareerAdvisorPanel data={session.careerAdvisor} />}
        {session && tab === 'assistant' && <JobMatchAssistant userEmail={userEmail} />}
      </main>

      <JobMatchModal item={selectedJob} onClose={() => setSelectedJob(null)} />
    </div>
  );
}
