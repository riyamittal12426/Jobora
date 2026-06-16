import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Briefcase, Loader2, RefreshCw, Sparkles,
  Target, BarChart3, Compass, FileSearch, AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InterviewSkeleton } from '@/components/ui/skeleton';
import { useJobRecommendations } from '@/hooks/useJobRecommendations';
import { JobCard } from './components/JobCard';
import { JobMatchModal } from './components/JobMatchModal';
import { ApplyReadinessPanel } from './components/ApplyReadinessPanel';
import { SkillGapPanel } from './components/SkillGapPanel';
import { CareerAdvisorPanel } from './components/CareerAdvisorPanel';
import { JobMatchAssistant } from './components/JobMatchAssistant';
import DashboardLayout from '@/components/UserDashboard/DashboardLayout';
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
    <DashboardLayout
      currentPage="jobs"
      pageTitle="AI Job Recommendations"
      pageSubtitle="Discover your perfect job matches ranked by AI recruitment scoring, powered by JSearch + Groq AI."
    >
      <div className="w-full flex flex-col gap-6">
        {/* Navigation tabs inside header */}
        {session && (
          <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-white/5">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 whitespace-nowrap rounded-2xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                  tab === t.id 
                    ? 'bg-[#7c3aed] text-white shadow-md font-extrabold' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border border-white/10'
                }`}
              >
                <t.icon size={13} /> {t.label}
              </button>
            ))}
            
            <button
              onClick={() => generate()}
              disabled={generating}
              className="ml-auto flex items-center gap-1.5 px-4 py-2.5 bg-[#7c3aed] hover:bg-[#6d28d9] disabled:bg-[#7c3aed]/30 text-white rounded-2xl text-xs font-bold cursor-pointer transition-all active:scale-95 shadow-lg"
            >
              {generating ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
              <span>{generating ? 'Analyzing...' : 'Refresh Matches'}</span>
            </button>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-950/20 p-4 text-sm text-red-300">
            <AlertCircle size={18} /> {error}
            <button onClick={() => setError(null)} className="ml-auto text-xs underline cursor-pointer">Dismiss</button>
          </div>
        )}

        {loading && <InterviewSkeleton />}

        {noSession && !generating && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 text-center bg-[#181926]/60 border border-white/10 p-8 rounded-[32px] backdrop-blur-md max-w-xl mx-auto">
            <Briefcase size={56} className="mx-auto mb-6 text-[#a855f7] opacity-80" />
            <h2 className="text-2xl font-bold font-[font2] text-white mb-3">Discover Your Perfect Roles</h2>
            <p className="text-gray-400 max-w-md mx-auto mb-8 text-xs font-medium leading-relaxed">
              We'll fetch real jobs from JSearch, analyze each one against your resume with Groq AI, and rank them by match score.
            </p>
            <Button size="lg" className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-extrabold px-8 py-3.5 rounded-2xl shadow-lg hover:scale-105 transition-transform" onClick={() => generate()} disabled={generating}>
              {generating ? <><Loader2 className="animate-spin mr-1.5" size={18} /> Generating...</> : <><Sparkles size={18} className="mr-1.5" /> Generate AI Recommendations</>}
            </Button>
            <p className="mt-4 text-[10px] text-gray-500 font-bold">Requires completed resume analysis • Takes 1-2 minutes</p>
          </motion.div>
        )}

        {generating && !session && (
          <div className="py-20 text-center space-y-4 bg-[#181926]/60 border border-white/10 p-8 rounded-[32px] backdrop-blur-md max-w-xl mx-auto">
            <Loader2 size={48} className="mx-auto animate-spin text-[#a855f7]" />
            <p className="text-lg text-[#a855f7] font-bold">Fetching jobs & running AI match analysis...</p>
            <p className="text-xs text-gray-400">JSearch → Groq recruiter analysis → ranked results</p>
          </div>
        )}

        {session && tab === 'jobs' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[10px] font-bold px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{session.jobs.length} Jobs Found</span>
              <span className="text-[10px] font-bold px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">Avg Match: {session.analytics.averageMatchScore}%</span>
              <span className="text-[10px] font-bold px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">Market Alignment: {session.analytics.marketAlignmentScore}%</span>
            </div>

            {selectedJobIds.length > 0 && (
              <div className="flex flex-wrap justify-between items-center bg-[#7c3aed]/10 border border-[#7c3aed]/30 p-4 rounded-3xl gap-3">
                <div className="text-xs text-gray-300 font-semibold">
                  <span className="font-extrabold text-[#a855f7]">{selectedJobIds.length}</span> jobs selected for automation
                </div>
                <div className="flex gap-2.5">
                  <button
                    onClick={() => setSelectedJobIds([])}
                    className="text-xs font-bold text-gray-400 hover:text-white px-3 py-1.5 hover:bg-white/5 rounded-xl cursor-pointer"
                  >
                    Clear Selection
                  </button>
                  <button
                    onClick={handleStartSmartApply}
                    className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-extrabold text-xs px-4 py-2 rounded-xl transition-all hover:scale-105 cursor-pointer border border-[#7c3aed]/20"
                  >
                    <Sparkles size={13} className="mr-1 inline-block" /> Start Smart Apply
                  </button>
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
      </div>

      <JobMatchModal item={selectedJob} onClose={() => setSelectedJob(null)} />
    </DashboardLayout>
  );
}
