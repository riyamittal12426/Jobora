import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileSearch, UserCheck, ShieldAlert, Users, Sparkles, Calendar,
  TrendingUp, Award, DollarSign, Target, CheckCircle2
} from 'lucide-react';
import { CircularScore } from './CircularScore';
import { ScoreCard } from './ScoreCard';
import { RecruiterSimulationCard } from './RecruiterSimulationCard';
import { HiringManagerCard } from './HiringManagerCard';
import { RiskAnalysisPanel } from './RiskAnalysisPanel';
import { CompetitiveAnalysisPanel } from './CompetitiveAnalysisPanel';
import { ScoreSimulator } from './ScoreSimulator';
import { ActionPlanTimeline } from './ActionPlanTimeline';
import { WhyThisScore } from './WhyThisScore';
import { Badge } from '@/components/ui/badge';
import type { SuccessPredictionData } from '@/types/prediction';
import type { JobListing } from '@/types/jobs';

interface PredictionDashboardProps {
  prediction: SuccessPredictionData;
  job: JobListing;
  onSimulate: (modifications: { type: string; value: string | number }[]) => Promise<any>;
}

type PredictorTab = 'overview' | 'recruiter' | 'risks' | 'competition' | 'simulator' | 'roadmap';

export function PredictionDashboard({
  prediction,
  job,
  onSimulate,
}: PredictionDashboardProps) {
  const [activeTab, setActiveTab] = useState<PredictorTab>('overview');

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: TrendingUp },
    { id: 'recruiter' as const, label: 'Recruiter Sim', icon: UserCheck },
    { id: 'risks' as const, label: 'Risks', icon: ShieldAlert },
    { id: 'competition' as const, label: 'Competition', icon: Users },
    { id: 'simulator' as const, label: 'Simulator', icon: Sparkles },
    { id: 'roadmap' as const, label: 'Action Plan', icon: Calendar },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="grid gap-6 md:grid-cols-3 items-center border border-gray-800 bg-gray-950/40 rounded-2xl p-6 shadow-xl backdrop-blur-md">
        {/* Overall circular score */}
        <div className="flex justify-center md:col-span-1">
          <CircularScore score={prediction.applicationSuccessScore} size={170} />
        </div>

        {/* Header stats & description */}
        <div className="md:col-span-2 space-y-4 text-center md:text-left">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Application Verdict
              </span>
              <Badge
                variant={
                  prediction.applicationRecommendation === 'Apply Now'
                    ? 'success'
                    : prediction.applicationRecommendation === 'Apply Soon'
                    ? 'default'
                    : prediction.applicationRecommendation === 'Upskill First'
                    ? 'warning'
                    : 'danger'
                }
              >
                {prediction.applicationRecommendation}
              </Badge>
            </div>
            <h2 className="text-xl font-bold font-[font2] text-white">
              Success Prediction Breakdown
            </h2>
            <p className="text-xs text-gray-400">
              Analysis based on your current resume score, skills, and target job description
            </p>
          </div>

          <div className="border-t border-gray-800/80 pt-3">
            <WhyThisScore explanation={prediction.whyThisScore} />
          </div>
        </div>
      </div>

      {/* Stats Cards grid */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <ScoreCard
          icon={UserCheck}
          label="Interview Prob."
          value={prediction.interviewProbability}
          percentage={prediction.interviewProbability}
          variant="indigo"
        />
        <ScoreCard
          icon={Award}
          label="Offer Prob."
          value={prediction.offerProbability}
          percentage={prediction.offerProbability}
          variant="emerald"
        />
        <ScoreCard
          icon={Target}
          label="Shortlist Prob."
          value={prediction.shortlistProbability}
          percentage={prediction.shortlistProbability}
          variant="amber"
        />
        <ScoreCard
          icon={CheckCircle2}
          label="ATS Compatibility"
          value={prediction.atsCompatibility}
          percentage={prediction.atsCompatibility}
          variant="emerald"
        />
      </div>

      {/* Tabs navigation */}
      <div className="flex gap-1.5 border-b border-gray-800 pb-px overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4.5 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all shrink-0 ${
                isActive
                  ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                  : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-800'
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content panel */}
      <div className="border border-gray-800/60 bg-[#101010]/30 rounded-2xl p-6 shadow-lg">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Strengths and Weaknesses */}
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="rounded-xl border border-emerald-500/15 bg-emerald-950/5 p-4.5 space-y-3">
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp size={14} /> Profile Strengths
                </h4>
                <ul className="space-y-2 text-xs text-gray-300">
                  {prediction.strengths.map((str, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-emerald-400 font-black mt-0.5">•</span>
                      <span>{str}</span>
                    </li>
                  ))}
                  {prediction.strengths.length === 0 && (
                    <li className="text-gray-500 italic">No significant strengths reported.</li>
                  )}
                </ul>
              </div>

              <div className="rounded-xl border border-rose-500/15 bg-rose-950/5 p-4.5 space-y-3">
                <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert size={14} /> Areas to Improve
                </h4>
                <ul className="space-y-2 text-xs text-gray-300">
                  {prediction.weaknesses.map((weak, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-rose-400 font-black mt-0.5">•</span>
                      <span>{weak}</span>
                    </li>
                  ))}
                  {prediction.weaknesses.length === 0 && (
                    <li className="text-gray-500 italic">No particular weaknesses reported.</li>
                  )}
                </ul>
              </div>
            </div>

            {/* Score Breakdown Section */}
            <div className="rounded-xl border border-gray-800 bg-gray-900/10 p-5 space-y-4">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Score Composition Analysis
              </h4>

              <div className="grid gap-4 sm:grid-cols-5 text-center">
                <div className="rounded-lg bg-gray-950/60 border border-gray-800/60 p-3">
                  <span className="text-[10px] text-gray-500 font-bold uppercase block">Role Fit</span>
                  <span className="text-lg font-bold text-indigo-400 block mt-1">{prediction.roleFitScore}%</span>
                </div>
                <div className="rounded-lg bg-gray-950/60 border border-gray-800/60 p-3">
                  <span className="text-[10px] text-gray-500 font-bold uppercase block">Technical</span>
                  <span className="text-lg font-bold text-emerald-400 block mt-1">{prediction.technicalFitScore}%</span>
                </div>
                <div className="rounded-lg bg-gray-950/60 border border-gray-800/60 p-3">
                  <span className="text-[10px] text-gray-500 font-bold uppercase block">Experience</span>
                  <span className="text-lg font-bold text-amber-400 block mt-1">{prediction.experienceFitScore}%</span>
                </div>
                <div className="rounded-lg bg-gray-950/60 border border-gray-800/60 p-3">
                  <span className="text-[10px] text-gray-500 font-bold uppercase block">Culture</span>
                  <span className="text-lg font-bold text-purple-400 block mt-1">{prediction.cultureFitScore}%</span>
                </div>
                <div className="rounded-lg bg-gray-950/60 border border-gray-800/60 p-3">
                  <span className="text-[10px] text-gray-500 font-bold uppercase block">Salary Fit</span>
                  <span className="text-lg font-bold text-rose-400 block mt-1">{prediction.salaryFitScore}%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'recruiter' && (
          <div className="grid gap-6 md:grid-cols-2">
            <RecruiterSimulationCard
              interestLevel={prediction.recruiterInterestLevel}
              feedback={prediction.recruiterFeedback}
              advantages={prediction.resumeAdvantages || []}
              disadvantages={prediction.resumeDisadvantages || []}
              shortlistProbability={prediction.shortlistProbability}
            />

            <HiringManagerCard
              feedback={prediction.hiringManagerFeedback}
              recommendation={prediction.applicationRecommendation}
              roleFit={prediction.roleFitScore}
              technicalFit={prediction.technicalFitScore}
              experienceFit={prediction.experienceFitScore}
            />
          </div>
        )}

        {activeTab === 'risks' && (
          <RiskAnalysisPanel risks={prediction.riskFactors || []} />
        )}

        {activeTab === 'competition' && (
          <CompetitiveAnalysisPanel
            competitionLevel={prediction.competitionLevel}
            estimatedRanking={prediction.estimatedApplicantRanking}
            applicationStrategy={prediction.applicationStrategy}
          />
        )}

        {activeTab === 'simulator' && (
          <ScoreSimulator
            currentScore={prediction.applicationSuccessScore}
            missingSkills={prediction.missingSkills || []}
            onSimulate={onSimulate}
          />
        )}

        {activeTab === 'roadmap' && (
          <ActionPlanTimeline actionPlan={prediction.actionPlan} />
        )}
      </div>
    </div>
  );
}
