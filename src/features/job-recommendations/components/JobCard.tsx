import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Building2, DollarSign, ExternalLink, Bookmark, BookmarkCheck,
  ChevronDown, ChevronUp, Sparkles, Target, AlertTriangle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MatchBadge } from './MatchBadge';
import type { JobWithAnalysis } from '@/types/jobs';

interface JobCardProps {
  item: JobWithAnalysis;
  saved: boolean;
  onSave: () => void;
  onAnalyze: () => void;
  selected?: boolean;
  onSelect?: () => void;
}

export function JobCard({ item, saved, onSave, onAnalyze, selected, onSelect }: JobCardProps) {
  const [expanded, setExpanded] = useState(false);
  const { job, analysis } = item;

  const salary =
    job.salaryMin || job.salaryMax
      ? `${job.salaryMin ? `$${job.salaryMin.toLocaleString()}` : ''}${job.salaryMin && job.salaryMax ? ' – ' : ''}${job.salaryMax ? `$${job.salaryMax.toLocaleString()}` : ''}`
      : 'Salary not listed';

  const applyVariant =
    analysis.applyRecommendation === 'Apply Now' ? 'success'
    : analysis.applyRecommendation === 'Apply Soon' ? 'default'
    : analysis.applyRecommendation === 'Upskill First' ? 'warning' : 'danger';

  return (
    <motion.div layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="overflow-hidden border-gray-800 hover:border-indigo-500/30 transition-colors">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {onSelect && (
                <input
                  type="checkbox"
                  checked={selected || false}
                  onChange={onSelect}
                  className="mt-1.5 h-4.5 w-4.5 cursor-pointer rounded border-gray-700 bg-gray-800 text-indigo-600 focus:ring-indigo-500"
                />
              )}
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg text-white truncate">{job.title}</CardTitle>
                <p className="mt-1 flex items-center gap-2 text-sm text-gray-400">
                  <Building2 size={14} /> {job.company}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <MatchBadge score={analysis.matchScore} />
              <Badge variant={applyVariant}>{analysis.applyRecommendation}</Badge>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1"><MapPin size={12} />{job.location}</span>
            <span>{job.employmentType}</span>
            <span className="flex items-center gap-1"><DollarSign size={12} />{salary}</span>
            <span>Hiring: {analysis.hiringProbability}</span>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-sm text-indigo-200/80 line-clamp-2">{analysis.whyRecommended}</p>

          <div className="flex flex-wrap gap-2">
            {analysis.strengthsMatched.slice(0, 4).map((s) => (
              <Badge key={s} variant="success" className="text-xs">{s}</Badge>
            ))}
            {analysis.missingSkills.slice(0, 3).map((s) => (
              <Badge key={s} variant="warning" className="text-xs">{s}</Badge>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {expanded ? 'Less' : 'Full Analysis'}
            </Button>
            <Button size="sm" variant="outline" onClick={onAnalyze}>
              <Sparkles size={14} /> Deep Match
            </Button>
            <Button size="sm" variant="ghost" onClick={onSave}>
              {saved ? <BookmarkCheck size={14} className="text-indigo-400" /> : <Bookmark size={14} />}
              {saved ? 'Saved' : 'Save'}
            </Button>
            {job.applyLink && (
              <a
                href={job.applyLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-8 items-center gap-2 rounded-lg bg-indigo-600 px-3 text-xs font-semibold text-white hover:bg-indigo-500"
              >
                <ExternalLink size={14} /> Apply
              </a>
            )}
          </div>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-4 overflow-hidden border-t border-gray-800 pt-4"
              >
                <div className="grid gap-3 sm:grid-cols-3 text-center">
                  <div className="rounded-lg bg-gray-950/50 p-3">
                    <p className="text-xs text-gray-500">Role Fit</p>
                    <p className="text-lg font-bold text-indigo-400">{analysis.roleFitScore}%</p>
                  </div>
                  <div className="rounded-lg bg-gray-950/50 p-3">
                    <p className="text-xs text-gray-500">Skills</p>
                    <p className="text-lg font-bold text-green-400">{analysis.skillAlignmentScore}%</p>
                  </div>
                  <div className="rounded-lg bg-gray-950/50 p-3">
                    <p className="text-xs text-gray-500">Experience</p>
                    <p className="text-lg font-bold text-blue-400">{analysis.experienceAlignmentScore}%</p>
                  </div>
                </div>
                <div>
                  <p className="mb-1 flex items-center gap-1 text-xs font-bold text-gray-400"><Target size={12} /> Recruiter Feedback</p>
                  <p className="text-sm text-gray-300">{analysis.recruiterFeedback}</p>
                </div>
                <div>
                  <p className="mb-1 flex items-center gap-1 text-xs font-bold text-yellow-400"><AlertTriangle size={12} /> Skill Gap</p>
                  <p className="text-sm text-gray-300">{analysis.skillGapAnalysis}</p>
                </div>
                <p className="text-xs text-gray-500">
                  Interview: {analysis.interviewDifficultyPrediction} · Readiness: {analysis.applyReadinessScore}% · {analysis.applyRecommendationReason}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}
