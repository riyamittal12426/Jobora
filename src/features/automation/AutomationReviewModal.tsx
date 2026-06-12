import React, { useState, useEffect } from 'react';
import { Sparkles, X, User as UserIcon, FileText, CheckCircle2, ShieldCheck, Mail, Phone, Link2, RefreshCw } from 'lucide-react';
import { autofillApi } from '@/services/autofillApi';
import type { CandidateProfile, PreparedApplication } from '@/types/autofill';

interface AutomationReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedJobs: any[];
  userEmail: string;
  onConfirm: (jobsToSubmit: any[]) => void;
}

export default function AutomationReviewModal({
  isOpen,
  onClose,
  selectedJobs,
  userEmail,
  onConfirm
}: AutomationReviewModalProps) {
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [drafts, setDrafts] = useState<PreparedApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [safetyChecked, setSafetyChecked] = useState(false);

  useEffect(() => {
    if (isOpen && userEmail) {
      setLoading(true);
      // Fetch Candidate Profile and Prepared Applications history
      Promise.all([
        autofillApi.getCandidateProfile(userEmail),
        autofillApi.getApplicationHistory(userEmail)
      ])
        .then(([profileData, historyData]) => {
          setProfile(profileData);
          // Filter history to find drafts matching selectedJob IDs
          const selectedJobIds = selectedJobs.map(j => j.jobId || j.id);
          const matchedDrafts = historyData.filter(d => selectedJobIds.includes(d.jobId));
          setDrafts(matchedDrafts);
        })
        .catch(err => console.error('Error loading review details:', err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, selectedJobs, userEmail]);

  if (!isOpen) return null;

  const handleStartAutomation = () => {
    if (!safetyChecked) return;
    
    // We map selected jobs to include prepared application ids if they exist
    const jobsWithDrafts = selectedJobs.map(job => {
      const jobId = job.jobId || job.id;
      const matchedDraft = drafts.find(d => d.jobId === jobId);
      return {
        jobId,
        matchScore: job.matchScore || matchedDraft?.recruiterReview?.matchScore || 50,
        applyReadinessScore: job.applyReadinessScore || job.readinessScore || 50,
        jobInfo: {
          title: job.title || matchedDraft?.jobInfo?.title || 'Unknown Role',
          company: job.company || matchedDraft?.jobInfo?.company || 'Unknown Company',
          location: job.location || matchedDraft?.jobInfo?.location || 'Remote',
          employmentType: job.employmentType || matchedDraft?.jobInfo?.employmentType || 'Full-time',
          description: job.description || matchedDraft?.jobInfo?.description || '',
          applyLink: job.applyLink || matchedDraft?.jobInfo?.applyLink || '',
          salaryMin: job.salaryMin || matchedDraft?.jobInfo?.salaryMin || null,
          salaryMax: job.salaryMax || matchedDraft?.jobInfo?.salaryMax || null,
          salaryCurrency: job.salaryCurrency || matchedDraft?.jobInfo?.salaryCurrency || 'USD'
        },
        preparedApplicationId: matchedDraft?._id || null
      };
    });

    onConfirm(jobsWithDrafts);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-white font-[font1]">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Sparkles className="text-violet-400" size={20} />
            <h2 className="text-xl font-bold font-[font2]">Review Automation Packages</h2>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-all">
            <X size={20} />
          </button>
        </div>

        {/* Modal Scroll Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {loading ? (
            <div className="h-60 flex flex-col items-center justify-center gap-3">
              <RefreshCw className="animate-spin text-violet-400" size={32} />
              <p className="text-zinc-400 text-sm">Aggregating candidate profile & custom application packages...</p>
            </div>
          ) : (
            <>
              {/* 1. Candidate Info Card */}
              <div className="bg-white/5 border border-white/10 p-5 rounded-xl">
                <h3 className="text-sm font-bold text-violet-300 font-[font2] mb-3 flex items-center gap-2">
                  <UserIcon size={14} /> 1. CANDIDATE PROFILE SUMMARY
                </h3>
                {profile ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-6 text-xs text-zinc-300">
                    <div>
                      <span className="text-zinc-500 block">Full Name</span>
                      <span className="text-white font-semibold">{profile.name || 'Not provided'}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block flex items-center gap-1"><Mail size={10} /> Email Address</span>
                      <span className="text-white font-semibold">{profile.email || userEmail}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block flex items-center gap-1"><Phone size={10} /> Phone Number</span>
                      <span className="text-white font-semibold">{profile.phone || 'Not provided'}</span>
                    </div>
                    {profile.linkedinUrl && (
                      <div className="sm:col-span-2 md:col-span-1">
                        <span className="text-zinc-500 block flex items-center gap-1"><Link2 size={10} /> LinkedIn</span>
                        <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:underline break-all">
                          {profile.linkedinUrl}
                        </a>
                      </div>
                    )}
                    {profile.githubUrl && (
                      <div className="sm:col-span-2 md:col-span-1">
                        <span className="text-zinc-500 block flex items-center gap-1"><Link2 size={10} /> GitHub</span>
                        <a href={profile.githubUrl} target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:underline break-all">
                          {profile.githubUrl}
                        </a>
                      </div>
                    )}
                    {profile.resumeUrl && (
                      <div className="sm:col-span-2 md:col-span-1">
                        <span className="text-zinc-500 block flex items-center gap-1"><FileText size={10} /> Uploaded Resume</span>
                        <a href={profile.resumeUrl} target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:underline break-all">
                          View PDF Resume Document
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-zinc-500 text-xs italic">No candidate profile configured yet.</p>
                )}
              </div>

              {/* 2. Job Packages List */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-violet-300 font-[font2] flex items-center gap-2">
                  <CheckCircle2 size={14} /> 2. SELECTED APPLICATIONS DRAFTS ({selectedJobs.length})
                </h3>
                
                <div className="space-y-3">
                  {selectedJobs.map((job, idx) => {
                    const jobId = job.jobId || job.id;
                    const draft = drafts.find(d => d.jobId === jobId);
                    return (
                      <div key={idx} className="bg-zinc-950/40 border border-white/5 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <h4 className="text-sm font-bold text-white font-[font2]">{job.title}</h4>
                          <p className="text-xs text-zinc-500 mt-0.5">{job.company} • {job.location || 'Remote'}</p>
                          
                          {draft ? (
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-[11px]">
                              <span className="text-green-400 font-semibold flex items-center gap-1">
                                ✓ AI Package Prepared
                              </span>
                              <span className="text-zinc-400">•</span>
                              <span className="text-zinc-300">
                                {draft.answers?.length || 0} screening answers
                              </span>
                              <span className="text-zinc-400">•</span>
                              <span className="text-zinc-300">
                                Cover letter generated
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-zinc-500">
                              <span className="text-amber-400/90 font-semibold">
                                ⚠ No prepared sandbox draft
                              </span>
                              <span>•</span>
                              <span>Default profile data will be auto-filled directly</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-3 shrink-0 self-end md:self-auto">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            job.matchScore >= 80 || draft?.recruiterReview?.matchScore >= 80
                              ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                              : 'bg-zinc-800 text-zinc-400'
                          }`}>
                            Score: {job.matchScore || draft?.recruiterReview?.matchScore || 50}%
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] bg-violet-600/10 border border-violet-500/20 text-violet-300 capitalize font-semibold">
                            {job.platform || 'generic'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. Safety Checkbox Gate */}
              <div className="bg-violet-900/10 border border-violet-500/20 p-4 rounded-xl flex items-start gap-3">
                <input
                  type="checkbox"
                  id="safety-checkbox"
                  checked={safetyChecked}
                  onChange={(e) => setSafetyChecked(e.target.checked)}
                  className="mt-0.5 cursor-pointer rounded border-zinc-700 bg-zinc-800 text-violet-600 focus:ring-violet-500"
                />
                <label htmlFor="safety-checkbox" className="text-xs text-violet-200 leading-relaxed cursor-pointer select-none">
                  <span className="font-bold flex items-center gap-1 text-white mb-0.5">
                    <ShieldCheck size={14} className="text-violet-400" /> HUMAN APPROVAL MODE CONFIRMATION
                  </span>
                  I approve the candidate data and prepared answer packages. I understand the system will run Chromium sessions in the backend to fill forms, upload resumes, and capture pre-submission screenshots. Every application will pause at the review screen and require my explicit approval before final submission.
                </label>
              </div>
            </>
          )}

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-white/10 bg-white/[0.02] flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-white/10 hover:bg-white/5 rounded-xl font-bold text-sm transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleStartAutomation}
            disabled={!safetyChecked || loading}
            className="bg-violet-600 hover:bg-violet-500 text-white font-bold px-6 py-2 rounded-xl transition-all shadow-lg hover:shadow-violet-500/25 disabled:opacity-40 disabled:cursor-not-allowed text-sm flex items-center gap-1.5 font-[font2]"
          >
            <Sparkles size={16} />
            <span>Start Smart Apply</span>
          </button>
        </div>

      </div>
    </div>
  );
}
