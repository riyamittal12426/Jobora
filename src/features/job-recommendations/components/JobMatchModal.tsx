import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Target, TrendingUp, BookOpen, MessageSquare, Sparkles, Zap, AlertTriangle, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { MatchBadge } from './MatchBadge';
import { useSuccessPrediction } from '@/hooks/useSuccessPrediction';
import { PredictionDashboard } from './prediction/PredictionDashboard';
import { PredictionSkeleton } from './prediction/PredictionSkeleton';
import { useAuth } from '@/contexts/AuthContext';
import type { JobWithAnalysis } from '@/types/jobs';

interface JobMatchModalProps {
  item: JobWithAnalysis | null;
  onClose: () => void;
}

export function JobMatchModal({ item, onClose }: JobMatchModalProps) {
  const navigate = useNavigate();
  const { dbUser, loading: authLoading } = useAuth();
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (dbUser) {
      setUserEmail(dbUser.email);
    }
  }, [dbUser, authLoading]);

  const {
    prediction,
    predicting,
    loading,
    error: predictionError,
    getPrediction,
    loadCachedPrediction,
    runSimulation,
  } = useSuccessPrediction(userEmail);

  useEffect(() => {
    if (userEmail && item?.job?.jobId) {
      loadCachedPrediction(item.job.jobId);
    }
  }, [userEmail, item?.job?.jobId, loadCachedPrediction]);

  if (!item) return null;
  const { job, analysis } = item;

  const scores = [
    { label: 'Role Fit', value: analysis.roleFitScore },
    { label: 'Skill Alignment', value: analysis.skillAlignmentScore },
    { label: 'Experience', value: analysis.experienceAlignmentScore },
    { label: 'Apply Readiness', value: analysis.applyReadinessScore },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-gray-800 bg-[#111] shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-gray-800 p-6">
            <div>
              <h2 className="text-xl font-bold font-[font2]">{job.title}</h2>
              <p className="text-sm text-gray-400">{job.company} · {job.location}</p>
            </div>
            <div className="flex items-center gap-3">
              <MatchBadge score={analysis.matchScore} />
              <button onClick={onClose} className="rounded-lg p-2 text-gray-400 hover:bg-gray-800 hover:text-white">
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="rounded-xl border border-indigo-500/20 bg-indigo-950/20 p-4">
              <p className="text-sm text-indigo-100">{analysis.whyRecommended}</p>
              <Badge variant="default" className="mt-3">{analysis.applyRecommendation}</Badge>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {scores.map((s) => (
                <div key={s.label}>
                  <div className="mb-1 flex justify-between text-xs text-gray-400">
                    <span>{s.label}</span><span>{s.value}%</span>
                  </div>
                  <Progress value={s.value} />
                </div>
              ))}
            </div>

            {/* Application Success Predictor Section */}
            <div className="border border-gray-800 bg-gray-950/20 rounded-2xl p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg p-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-lg shadow-indigo-500/5">
                    <Zap size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-indigo-200 font-[font2]">Application Success Predictor</h3>
                    <p className="text-[11px] text-gray-500">Shortlist, interview & hire success probability</p>
                  </div>
                </div>

                {!prediction && !predicting && !loading && (
                  <Button
                    size="sm"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3 py-1.5 h-8 text-xs"
                    onClick={() => getPrediction(job)}
                  >
                    <Zap size={12} className="mr-1" /> Run Prediction
                  </Button>
                )}
                {prediction && !predicting && !loading && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => getPrediction(job, true)}
                    className="border-gray-800 hover:bg-gray-800 text-gray-400 px-3 py-1.5 h-8 text-xs"
                  >
                    <RefreshCw size={11} className="mr-1" /> Re-Predict
                  </Button>
                )}
              </div>

              {predictionError && (
                <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-950/20 p-3 text-xs text-red-300">
                  <AlertTriangle size={14} /> {predictionError}
                </div>
              )}

              {(predicting || loading) && (
                <PredictionSkeleton />
              )}

              {prediction && !predicting && !loading && (
                <PredictionDashboard
                  prediction={prediction}
                  job={job}
                  onSimulate={(mods) => runSimulation(job, mods)}
                />
              )}
            </div>

            <section>
              <h3 className="mb-2 flex items-center gap-2 font-bold text-green-400"><TrendingUp size={16} /> Strengths Matched</h3>
              <div className="flex flex-wrap gap-2">
                {analysis.strengthsMatched.map((s) => <Badge key={s} variant="success">{s}</Badge>)}
              </div>
            </section>

            <section>
              <h3 className="mb-2 flex items-center gap-2 font-bold text-yellow-400"><Target size={16} /> Missing Skills</h3>
              <div className="flex flex-wrap gap-2">
                {analysis.missingSkills.map((s) => <Badge key={s} variant="warning">{s}</Badge>)}
              </div>
            </section>

            <section>
              <h3 className="mb-2 flex items-center gap-2 font-bold text-indigo-400"><MessageSquare size={16} /> Recruiter Impression</h3>
              <p className="text-sm text-gray-300">{analysis.recruiterFeedback}</p>
            </section>

            <section>
              <h3 className="mb-2 font-bold text-blue-400">Resume Changes for This Role</h3>
              <ul className="space-y-1 text-sm text-gray-300">
                {(analysis.resumeChangesForRole || analysis.improvementSuggestions).map((tip, i) => (
                  <li key={i}>• {tip}</li>
                ))}
              </ul>
            </section>

            <section>
              <h3 className="mb-2 flex items-center gap-2 font-bold text-purple-400"><BookOpen size={16} /> Interview Prep Tips</h3>
              <ul className="space-y-1 text-sm text-gray-300">
                {(analysis.interviewPrepTips || []).map((tip, i) => <li key={i}>• {tip}</li>)}
              </ul>
            </section>

            {analysis.prioritizedRoadmap && analysis.prioritizedRoadmap.length > 0 && (
              <section>
                <h3 className="mb-2 font-bold text-orange-400">Upskill Roadmap</h3>
                {analysis.prioritizedRoadmap.map((r, i) => (
                  <div key={i} className="mb-2 rounded-lg border border-gray-800 p-3 text-sm">
                    <span className="font-medium text-white">{r.skill}</span>
                    <span className="ml-2 text-gray-500">({r.priority})</span>
                    <p className="text-gray-400">{r.impact}</p>
                    {analysis.estimatedLearningTime && <p className="text-xs text-indigo-300 mt-1">Est. time: {analysis.estimatedLearningTime}</p>}
                  </div>
                ))}
              </section>
            )}
          </div>

          <div className="border-t border-gray-800 p-4 flex gap-3">
            <Button
              onClick={() => {
                navigate('/prepare-application', { state: { job } });
                onClose();
              }}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 py-2.5 text-sm font-semibold text-white"
            >
              <Sparkles size={16} /> Prepare Application
            </Button>
            {job.applyLink && (
              <a
                href={job.applyLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-lg bg-indigo-600/30 border border-indigo-500/20 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-600/50"
              >
                Apply to This Role
              </a>
            )}
            <Button variant="outline" onClick={onClose}>Close</Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
