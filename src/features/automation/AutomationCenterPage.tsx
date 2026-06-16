import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sparkles, Terminal, Play, ClipboardList, Clock, RefreshCw, XCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAutomation } from './useAutomation';
import AutomationLogViewer from './AutomationLogViewer';
import JobApprovalCard from './JobApprovalCard';
import SubmittedApplicationCard from './SubmittedApplicationCard';
import AutomationReviewModal from './AutomationReviewModal';
import CaptchaResolutionCard from './CaptchaResolutionCard';
import { automationApi } from '@/services/automationApi';
import DashboardLayout from '@/components/UserDashboard/DashboardLayout';
import type { SubmittedApplication } from '@/types/automation';

export default function AutomationCenterPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Get user details from localStorage
  const [user, setUser] = useState<any>(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  // Load selected jobs from router state or localStorage
  const [selectedQueue, setSelectedQueue] = useState<any[]>(() => {
    if (location.state?.selectedJobs) {
      localStorage.setItem('selected_jobs_automation', JSON.stringify(location.state.selectedJobs));
      return location.state.selectedJobs;
    }
    const stored = localStorage.getItem('selected_jobs_automation');
    return stored ? JSON.parse(stored) : [];
  });

  const userEmail = user?.email || '';
  const {
    runs,
    activeRun,
    logs,
    loading: runLoading,
    error: runError,
    startRun,
    approveJob,
    resumeJob,
    skipJob,
    retryJob,
    cancelRun,
    updateJobDetails,
    selectRun,
    clearActiveRun
  } = useAutomation(userEmail);

  const [activeTab, setActiveTab] = useState<'queue' | 'live' | 'submissions'>('queue');
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [submissions, setSubmissions] = useState<SubmittedApplication[]>([]);
  const [subLoading, setSubLoading] = useState(false);

  // Fetch submissions list
  const fetchSubmissions = async () => {
    if (!userEmail) return;
    setSubLoading(true);
    try {
      const data = await automationApi.getSubmittedApplications(userEmail);
      setSubmissions(data);
    } catch (err) {
      console.error('Failed to fetch submissions:', err);
    } finally {
      setSubLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'submissions') {
      fetchSubmissions();
    }
  }, [activeTab, userEmail]);

  // Navigate to live dashboard once run starts
  const handleStartSmartApply = async (jobsToSubmit: any[]) => {
    try {
      const run = await startRun(jobsToSubmit);
      localStorage.removeItem('selected_jobs_automation');
      setSelectedQueue([]);
      setActiveTab('live');
    } catch (err) {
      console.error('Failed to start apply:', err);
    }
  };

  const handleClearQueue = () => {
    localStorage.removeItem('selected_jobs_automation');
    setSelectedQueue([]);
  };

  const getStatusBadgeClass = (status: string) => {
    const s = status.toLowerCase();
    switch (s) {
      case 'completed':
        return 'bg-green-500/10 border-green-500/30 text-green-400';
      case 'running':
      case 'starting':
      case 'pending':
        return 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 animate-pulse';
      case 'paused':
        return 'bg-amber-500/10 border-amber-500/30 text-amber-400';
      case 'cancelled':
        return 'bg-zinc-500/10 border-zinc-500/30 text-zinc-400';
      case 'partially_completed':
        return 'bg-green-500/10 border-green-500/30 text-emerald-400';
      case 'failed':
      default:
        return 'bg-red-500/10 border-red-500/30 text-red-400';
    }
  };

  const getJobStatusIcon = (status: string) => {
    const s = status.toLowerCase();
    switch (s) {
      case 'submitted':
        return <span className="text-green-400">✓ Submitted</span>;
      case 'failed':
        return <span className="text-red-400">✗ Failed</span>;
      case 'skipped':
        return <span className="text-zinc-500">skipped</span>;
      case 'awaiting_approval':
      case 'review_required':
        return <span className="text-amber-400 animate-pulse">👁 Review Draft</span>;
      case 'captcha_detected':
      case 'captcha_required':
        return <span className="text-amber-500 font-bold animate-bounce">⚠ CAPTCHA</span>;
      case 'queued':
      case 'pending':
        return <span className="text-zinc-500">queued</span>;
      default:
        return <span className="text-cyan-400 capitalize">{s.replace(/_/g, ' ')}</span>;
    }
  };

  const jobAwaitingApproval = activeRun?.jobs.find(
    j => j.status === 'awaiting_approval' || j.status === 'captcha_detected' || j.status === 'REVIEW_REQUIRED' || j.status === 'CAPTCHA_REQUIRED'
  );
  const awaitingJobIndex = activeRun?.jobs.findIndex(
    j => j.status === 'awaiting_approval' || j.status === 'captcha_detected' || j.status === 'REVIEW_REQUIRED' || j.status === 'CAPTCHA_REQUIRED'
  );

  return (
    <DashboardLayout
      currentPage="automation"
      pageTitle="Application Automation Center"
      pageSubtitle="Autonomous form filling and browser automation with smart human approval gates."
    >
      <div className="w-full flex flex-col gap-6">
        
        {/* Sub Navigation Tabs inside Dashboard shell */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-white/5">
          <div className="flex bg-white/5 border border-white/10 p-1 rounded-2xl shrink-0">
            <button
              onClick={() => setActiveTab('queue')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'queue' ? 'bg-[#7c3aed] text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              <ClipboardList size={14} />
              <span>Queue Builder ({selectedQueue.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('live')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'live' ? 'bg-[#7c3aed] text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Terminal size={14} />
              <span>Live Run {activeRun ? '• Active' : ''}</span>
            </button>
            <button
              onClick={() => setActiveTab('submissions')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'submissions' ? 'bg-[#7c3aed] text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Clock size={14} />
              <span>Submissions</span>
            </button>
          </div>
        </div>

        {/* Tab content area */}
        <div className="space-y-6">
          
          {/* TAB 1: QUEUE BUILDER */}
          {activeTab === 'queue' && (
            <div className="space-y-6">
              {selectedQueue.length === 0 ? (
                <div className="bg-[#181926]/60 border border-white/10 rounded-[32px] p-12 text-center flex flex-col items-center justify-center gap-4 max-w-xl mx-auto backdrop-blur-md">
                  <ClipboardList size={48} className="text-gray-500 opacity-60" />
                  <h3 className="text-xl font-bold font-[font2] text-white">No Jobs in Queue</h3>
                  <p className="text-gray-400 text-xs max-w-xs leading-relaxed font-semibold">
                    You haven't selected any jobs for smart automation yet. Navigate to your job recommendations list to start queuing.
                  </p>
                  <button
                    onClick={() => navigate('/job-recommendations')}
                    className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-extrabold py-3.5 px-6 rounded-2xl transition-all shadow-lg flex items-center gap-2 text-xs font-[font2] mt-2 cursor-pointer border border-[#7c3aed]/20"
                  >
                    <span>Browse Recommendations</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Summary & actions */}
                  <div className="flex justify-between items-center bg-[#181926]/60 border border-white/10 p-5 rounded-2xl backdrop-blur-md">
                    <div>
                      <h3 className="font-bold text-white text-base font-[font2]">Queue Ready</h3>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Confirm details for the {selectedQueue.length} queued application packages below.
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={handleClearQueue}
                        className="px-4 py-2 border border-red-500/20 bg-red-950/20 hover:bg-red-900/30 text-red-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        Clear Queue
                      </button>
                      <button
                        onClick={() => setIsReviewOpen(true)}
                        className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-extrabold py-2.5 px-5 rounded-xl transition-all shadow-lg text-xs flex items-center gap-1.5 font-[font2] cursor-pointer border border-[#7c3aed]/20"
                      >
                        <Play size={12} fill="white" />
                        <span>Start Application Setup</span>
                      </button>
                    </div>
                  </div>

                  {/* Queue Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {selectedQueue.map((job, idx) => (
                      <div key={idx} className="bg-[#181926]/60 border border-white/10 rounded-3xl p-5 hover:border-violet-500/30 transition-all flex flex-col justify-between h-48 backdrop-blur-md">
                        <div>
                          <div className="flex justify-between items-start">
                            <h4 className="font-bold text-white text-base font-[font2] leading-tight truncate max-w-[80%]">
                              {job.title}
                            </h4>
                            <span className="text-[10px] uppercase font-bold text-purple-400 bg-purple-600/10 px-2 py-0.5 rounded border border-purple-500/20 shrink-0">
                              {job.platform || 'generic'}
                            </span>
                          </div>
                          <p className="text-gray-400 text-xs font-semibold mt-1.5">{job.company} • {job.location || 'Remote'}</p>
                        </div>
                        <div className="flex justify-between items-center pt-4 border-t border-white/5">
                          <span className="text-xs text-gray-500 font-semibold">
                            Fit Score: <strong className="text-white font-[font2]">{job.matchScore || 75}%</strong>
                          </span>
                          <button
                            onClick={() => navigate('/prepare-application', { state: { selectedJob: job } })}
                            className="text-xs text-[#a855f7] hover:text-[#c084fc] font-bold transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <span>Inspect Sandbox Draft</span>
                            <ArrowRight size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: LIVE AUTOMATION RUN */}
          {activeTab === 'live' && (
            <div className="space-y-6">
              {!activeRun ? (
                <div className="space-y-6">
                  <div className="bg-[#181926]/60 border border-white/10 rounded-[32px] p-8 text-center max-w-xl mx-auto flex flex-col items-center justify-center gap-3 backdrop-blur-md">
                    <Terminal size={40} className="text-gray-500 opacity-60" />
                    <h3 className="text-lg font-bold font-[font2] text-white">No Active Automation Session</h3>
                    <p className="text-gray-400 text-xs leading-relaxed max-w-sm font-semibold">
                      There are no automation sessions currently running. You can launch one from the Queue Builder tab or inspect history records below.
                    </p>
                  </div>

                  {runs.length > 0 && (
                    <div className="bg-[#181926]/60 border border-white/10 rounded-[28px] p-6 backdrop-blur-md shadow-lg">
                      <h3 className="font-bold text-xs uppercase tracking-wider text-gray-400 font-[font2] mb-4">Previous Run Records</h3>
                      <div className="space-y-3">
                        {runs.slice(0, 5).map((run) => (
                          <div key={run._id} className="bg-white/5 border border-white/5 p-4 rounded-2xl flex items-center justify-between hover:border-white/10 transition-all">
                            <div>
                              <p className="text-xs text-gray-500 font-mono">RUN ID: {run._id.slice(-8)}</p>
                              <p className="text-sm font-bold text-white mt-0.5">
                                {run.progress.completed} submitted / {run.progress.total} jobs in run
                              </p>
                              <p className="text-[10px] text-gray-500 mt-0.5">
                                Created on {new Date(run.createdAt).toLocaleString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getStatusBadgeClass(run.status)}`}>
                                {run.status}
                              </span>
                              <button
                                onClick={() => selectRun(run)}
                                className="text-xs bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 transition-all font-bold cursor-pointer"
                              >
                                Open Run
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Left (spans 2 Cols): Active Dashboard Panel */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Status & Cancel Row */}
                    <div className="bg-[#181926]/60 border border-white/10 p-5 rounded-2xl flex justify-between items-center backdrop-blur-md">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${getStatusBadgeClass(activeRun.status)}`}>
                            {activeRun.status}
                          </span>
                          <span className="text-xs text-gray-500 font-mono">ID: {activeRun._id.slice(-8)}</span>
                        </div>
                        <p className="text-gray-400 text-xs mt-1 font-semibold">
                          Completed: {activeRun.progress.completed} • Failed: {activeRun.progress.failed} • Skipped: {activeRun.progress.skipped} (Total: {activeRun.progress.total})
                        </p>
                      </div>
                      
                      <div className="flex gap-2">
                        {['running', 'paused'].includes(activeRun.status) && (
                          <button
                            onClick={() => cancelRun(activeRun._id)}
                            className="px-4 py-2 border border-red-500/20 bg-red-950/20 hover:bg-red-900/30 text-red-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <XCircle size={14} />
                            <span>Cancel Run</span>
                          </button>
                        )}
                        <button
                          onClick={clearActiveRun}
                          className="px-4 py-2 border border-white/10 hover:bg-white/5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        >
                          Exit Session
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="bg-[#181926]/60 border border-white/10 p-5 rounded-2xl space-y-2 backdrop-blur-md">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-gray-400 uppercase tracking-wider">Automation Progress Rate</span>
                        <span className="text-[#a855f7] font-[font2]">
                          {Math.round(
                            ((activeRun.progress.completed + activeRun.progress.skipped) / activeRun.progress.total) * 100
                          )}% Complete
                        </span>
                      </div>
                      <div className="w-full bg-white/5 h-3 rounded-full overflow-hidden border border-white/5">
                        <div
                          style={{
                            width: `${((activeRun.progress.completed + activeRun.progress.skipped) / activeRun.progress.total) * 100}%`
                          }}
                          className="bg-[#7c3aed] h-full rounded-full transition-all duration-500"
                        />
                      </div>
                    </div>

                    {/* Interactive review card for current job */}
                    {jobAwaitingApproval && awaitingJobIndex !== undefined && awaitingJobIndex !== -1 ? (
                      jobAwaitingApproval.status === 'CAPTCHA_REQUIRED' || jobAwaitingApproval.status === 'captcha_detected' ? (
                        <CaptchaResolutionCard
                          runId={activeRun._id}
                          jobIndex={awaitingJobIndex}
                          jobEntry={jobAwaitingApproval}
                          onResume={resumeJob}
                          onSkip={skipJob}
                        />
                      ) : (
                        <JobApprovalCard
                          runId={activeRun._id}
                          jobIndex={awaitingJobIndex}
                          jobEntry={jobAwaitingApproval}
                          onApprove={approveJob}
                          onSkip={skipJob}
                          onUpdate={updateJobDetails}
                        />
                      )
                    ) : (
                      <div className="bg-[#181926]/60 border border-white/10 p-10 rounded-3xl text-center flex flex-col items-center justify-center gap-3 backdrop-blur-md">
                        <CheckCircle2 size={36} className="text-green-400 opacity-60" />
                        <h4 className="font-bold text-white text-base font-[font2]">No Pending Approvals</h4>
                        <p className="text-gray-400 text-xs leading-relaxed max-w-sm font-semibold">
                          {activeRun.status === 'completed'
                            ? 'All application forms successfully processed and submitted!'
                            : activeRun.status === 'running'
                            ? 'Waiting for Playwright browser execution context to reach the review step...'
                            : 'Orchestrator process is paused or cancelled.'}
                        </p>
                      </div>
                    )}

                    {/* Logs Stream console */}
                    <AutomationLogViewer logs={logs} heightClass="h-72" />

                  </div>

                  {/* Right Col: Jobs Queue List */}
                  <div className="bg-[#181926]/60 border border-white/10 p-5 rounded-3xl space-y-4 h-fit backdrop-blur-md">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-gray-400 font-[font2]">Session Queue list</h3>
                    <div className="space-y-3">
                      {activeRun.jobs.map((job, idx) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-xl border transition-all ${
                            idx === activeRun.progress.currentIndex
                              ? 'bg-violet-950/20 border-violet-500/40 shadow shadow-violet-500/5'
                              : 'bg-white/5 border-white/5'
                          }`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div className="truncate flex-1">
                              <h4 className={`text-xs font-bold truncate ${
                                idx === activeRun.progress.currentIndex ? 'text-[#a855f7]' : 'text-gray-300'
                              }`}>
                                {job.jobInfo.title}
                              </h4>
                              <p className="text-[10px] text-gray-500 truncate mt-0.5 font-semibold">{job.jobInfo.company}</p>
                            </div>
                            <span className="text-[10px] font-mono shrink-0 select-none">
                              {getJobStatusIcon(job.status)}
                            </span>
                          </div>

                          {job.status === 'failed' && (
                            <button
                              onClick={() => retryJob(activeRun._id, idx)}
                              className="mt-2 text-[10px] text-[#a855f7] hover:text-[#c084fc] font-bold flex items-center gap-1 transition-all cursor-pointer"
                            >
                              <RefreshCw size={10} />
                              <span>Retry Automation</span>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}
            </div>
          )}

          {/* TAB 3: SUBMISSIONS HISTORY */}
          {activeTab === 'submissions' && (
            <div className="space-y-6">
              {subLoading ? (
                <div className="h-60 flex flex-col items-center justify-center gap-3">
                  <RefreshCw className="animate-spin text-purple-400" size={32} />
                  <p className="text-gray-400 text-xs font-semibold">Fetching past automation submissions records...</p>
                </div>
              ) : submissions.length === 0 ? (
                <div className="bg-[#181926]/60 border border-white/10 rounded-[32px] p-12 text-center flex flex-col items-center justify-center gap-4 max-w-xl mx-auto backdrop-blur-md">
                  <Clock size={48} className="text-gray-500 opacity-60" />
                  <h3 className="text-xl font-bold font-[font2] text-white">No Submissions Recorded</h3>
                  <p className="text-gray-400 text-xs max-w-xs leading-relaxed font-semibold">
                    You haven't completed any automated job applications yet. Go through a run setup to capture AI intelligence cards.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex justify-between items-center bg-[#181926]/60 border border-white/10 p-5 rounded-2xl backdrop-blur-md">
                    <div>
                      <h3 className="font-bold text-white text-base font-[font2]">Submissions Record</h3>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Track AI-predicted shortlisting rates, key strengths alignment, and next action roadmaps.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {submissions.map((sub) => (
                      <SubmittedApplicationCard
                        key={sub._id}
                        application={sub}
                        onRefresh={fetchSubmissions}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

      </div>

      <AutomationReviewModal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        selectedJobs={selectedQueue}
        userEmail={userEmail}
        onConfirm={handleStartSmartApply}
      />
    </DashboardLayout>
  );
}
