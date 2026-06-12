import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sparkles, Terminal, Play, ClipboardList, Clock, RefreshCw, XCircle, ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import ShapeBlur from '@/components/Landing/ShapeBlur';
import { useAutomation } from './useAutomation';
import AutomationLogViewer from './AutomationLogViewer';
import JobApprovalCard from './JobApprovalCard';
import SubmittedApplicationCard from './SubmittedApplicationCard';
import AutomationReviewModal from './AutomationReviewModal';
import CaptchaResolutionCard from './CaptchaResolutionCard';
import { automationApi } from '@/services/automationApi';
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
      // Remove selected queue from localStorage since it is now running
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

  // Find job awaiting approval or captcha (if any) in the active run
  const jobAwaitingApproval = activeRun?.jobs.find(
    j => j.status === 'awaiting_approval' || j.status === 'captcha_detected' || j.status === 'REVIEW_REQUIRED' || j.status === 'CAPTCHA_REQUIRED'
  );
  const awaitingJobIndex = activeRun?.jobs.findIndex(
    j => j.status === 'awaiting_approval' || j.status === 'captcha_detected' || j.status === 'REVIEW_REQUIRED' || j.status === 'CAPTCHA_REQUIRED'
  );

  return (
    <div className="relative min-h-screen bg-black text-white p-6 md:p-12 font-[font1] overflow-hidden">
      {/* ShapeBlur background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <ShapeBlur
          variation={0}
          pixelRatioProp={window.devicePixelRatio || 1}
          shapeSize={0.8}
          roundness={0.5}
          borderSize={0.05}
          circleSize={0.4}
          circleEdge={1.2}
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-zinc-400 hover:text-white"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <h1 className="text-3xl font-bold font-[font2] tracking-tight">Application Automation Center</h1>
              <p className="text-sm text-zinc-400 mt-1">Autonomous browser filling with human approval gates</p>
            </div>
          </div>
          <div className="flex bg-white/5 border border-white/10 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('queue')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'queue' ? 'bg-violet-600 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <ClipboardList size={14} />
              <span>Queue Builder ({selectedQueue.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('live')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'live' ? 'bg-violet-600 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Terminal size={14} />
              <span>Live Run {activeRun ? '• Active' : ''}</span>
            </button>
            <button
              onClick={() => setActiveTab('submissions')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'submissions' ? 'bg-violet-600 text-white' : 'text-zinc-400 hover:text-white'
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
                <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-4 max-w-xl mx-auto">
                  <ClipboardList size={48} className="text-zinc-500 opacity-40" />
                  <h3 className="text-xl font-bold font-[font2]">No Jobs in Queue</h3>
                  <p className="text-zinc-400 text-sm max-w-sm leading-relaxed">
                    You haven't selected any jobs for smart automation yet. Navigate to your job recommendations list to start queuing.
                  </p>
                  <button
                    onClick={() => navigate('/job-recommendations')}
                    className="bg-violet-600 hover:bg-violet-500 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg hover:shadow-violet-500/20 flex items-center gap-2 text-sm font-[font2] mt-2"
                  >
                    <span>Browse Recommendations</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Summary & actions */}
                  <div className="flex justify-between items-center bg-white/5 border border-white/10 p-5 rounded-2xl">
                    <div>
                      <h3 className="font-bold text-white text-lg font-[font2]">Queue Ready</h3>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Confirm details for the {selectedQueue.length} queued application packages below.
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={handleClearQueue}
                        className="px-4 py-2 border border-red-500/20 bg-red-950/10 hover:bg-red-900/20 text-red-300 rounded-xl text-xs font-bold transition-all"
                      >
                        Clear Queue
                      </button>
                      <button
                        onClick={() => setIsReviewOpen(true)}
                        className="bg-violet-600 hover:bg-violet-500 text-white font-bold py-2.5 px-5 rounded-xl transition-all shadow-lg hover:shadow-violet-500/20 text-xs flex items-center gap-1.5 font-[font2]"
                      >
                        <Play size={12} fill="white" />
                        <span>Start Application Setup</span>
                      </button>
                    </div>
                  </div>

                  {/* Queue Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {selectedQueue.map((job, idx) => (
                      <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-violet-500/30 transition-all flex flex-col justify-between h-48">
                        <div>
                          <div className="flex justify-between items-start">
                            <h4 className="font-bold text-white text-lg font-[font2] leading-tight truncate max-w-[80%]">
                              {job.title}
                            </h4>
                            <span className="text-[10px] uppercase font-bold text-violet-400 bg-violet-600/10 px-2 py-0.5 rounded border border-violet-500/20">
                              {job.platform || 'generic'}
                            </span>
                          </div>
                          <p className="text-zinc-400 text-sm mt-1">{job.company} • {job.location || 'Remote'}</p>
                        </div>
                        <div className="flex justify-between items-center pt-4 border-t border-white/5">
                          <span className="text-xs text-zinc-500">
                            Fit Score: <strong className="text-white font-[font2]">{job.matchScore || 75}%</strong>
                          </span>
                          <button
                            onClick={() => navigate('/prepare-application', { state: { selectedJob: job } })}
                            className="text-xs text-violet-400 hover:text-violet-300 font-bold transition-all flex items-center gap-1"
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
                  {/* Select previous run from logs history */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center max-w-xl mx-auto flex flex-col items-center justify-center gap-3">
                    <Terminal size={40} className="text-zinc-500 opacity-40" />
                    <h3 className="text-lg font-bold font-[font2]">No Active Automation Session</h3>
                    <p className="text-zinc-400 text-xs leading-relaxed max-w-sm">
                      There are no automation sessions currently running. You can launch one from the Queue Builder tab or inspect history records below.
                    </p>
                  </div>

                  {runs.length > 0 && (
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                      <h3 className="font-bold text-sm font-[font2] mb-4 uppercase tracking-wider text-zinc-400">Previous Run Records</h3>
                      <div className="space-y-3">
                        {runs.slice(0, 5).map((run) => (
                          <div key={run._id} className="bg-zinc-950/40 border border-white/5 p-4 rounded-xl flex items-center justify-between hover:border-white/10 transition-all">
                            <div>
                              <p className="text-xs text-zinc-500 font-mono">RUN ID: {run._id.slice(-8)}</p>
                              <p className="text-sm font-semibold text-white mt-0.5">
                                {run.progress.completed} submitted / {run.progress.total} jobs in run
                              </p>
                              <p className="text-[10px] text-zinc-600 mt-0.5">
                                Created on {new Date(run.createdAt).toLocaleString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getStatusBadgeClass(run.status)}`}>
                                {run.status}
                              </span>
                              <button
                                onClick={() => selectRun(run)}
                                className="text-xs bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 transition-all font-bold"
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
                    <div className="bg-white/5 border border-white/10 p-5 rounded-2xl flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${getStatusBadgeClass(activeRun.status)}`}>
                            {activeRun.status}
                          </span>
                          <span className="text-xs text-zinc-500 font-mono">ID: {activeRun._id.slice(-8)}</span>
                        </div>
                        <p className="text-zinc-400 text-xs mt-1">
                          Completed: {activeRun.progress.completed} • Failed: {activeRun.progress.failed} • Skipped: {activeRun.progress.skipped} (Total: {activeRun.progress.total})
                        </p>
                      </div>
                      
                      <div className="flex gap-2">
                        {['running', 'paused'].includes(activeRun.status) && (
                          <button
                            onClick={() => cancelRun(activeRun._id)}
                            className="px-4 py-2 border border-red-500/20 bg-red-950/20 hover:bg-red-900/30 text-red-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                          >
                            <XCircle size={14} />
                            <span>Cancel Run</span>
                          </button>
                        )}
                        <button
                          onClick={clearActiveRun}
                          className="px-4 py-2 border border-white/10 hover:bg-white/5 rounded-xl text-xs font-bold transition-all"
                        >
                          Exit Session
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-2">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-zinc-400 uppercase tracking-wider">Automation Progress Rate</span>
                        <span className="text-violet-400 font-[font2]">
                          {Math.round(
                            ((activeRun.progress.completed + activeRun.progress.skipped) / activeRun.progress.total) * 100
                          )}% Complete
                        </span>
                      </div>
                      <div className="w-full bg-zinc-950 h-3 rounded-full overflow-hidden border border-white/5">
                        <div
                          style={{
                            width: `${((activeRun.progress.completed + activeRun.progress.skipped) / activeRun.progress.total) * 100}%`
                          }}
                          className="bg-violet-600 h-full rounded-full transition-all duration-500"
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
                      <div className="bg-white/5 border border-white/10 p-10 rounded-2xl text-center flex flex-col items-center justify-center gap-3">
                        <CheckCircle2 size={36} className="text-green-400 opacity-60" />
                        <h4 className="font-bold text-white text-md font-[font2]">No Pending Approvals</h4>
                        <p className="text-zinc-400 text-xs leading-relaxed max-w-sm">
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
                  <div className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-4 h-fit">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-400 font-[font2]">Session Queue list</h3>
                    <div className="space-y-3">
                      {activeRun.jobs.map((job, idx) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-xl border transition-all ${
                            idx === activeRun.progress.currentIndex
                              ? 'bg-violet-950/20 border-violet-500/40 shadow shadow-violet-500/5'
                              : 'bg-zinc-950/30 border-white/[0.03]'
                          }`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div className="truncate flex-1">
                              <h4 className={`text-xs font-bold truncate ${
                                idx === activeRun.progress.currentIndex ? 'text-violet-300' : 'text-zinc-300'
                              }`}>
                                {job.jobInfo.title}
                              </h4>
                              <p className="text-[10px] text-zinc-500 truncate mt-0.5">{job.jobInfo.company}</p>
                            </div>
                            <span className="text-[10px] font-mono shrink-0 select-none">
                              {getJobStatusIcon(job.status)}
                            </span>
                          </div>

                          {/* Skip/retry helper context button */}
                          {job.status === 'failed' && (
                            <button
                              onClick={() => retryJob(activeRun._id, idx)}
                              className="mt-2 text-[10px] text-violet-400 hover:text-violet-300 font-bold flex items-center gap-1 transition-all"
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
                  <RefreshCw className="animate-spin text-violet-400" size={32} />
                  <p className="text-zinc-400 text-sm">Fetching past automation submissions records...</p>
                </div>
              ) : submissions.length === 0 ? (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-4 max-w-xl mx-auto">
                  <Clock size={48} className="text-zinc-500 opacity-40" />
                  <h3 className="text-xl font-bold font-[font2]">No Submissions Recorded</h3>
                  <p className="text-zinc-400 text-sm max-w-sm leading-relaxed">
                    You haven't completed any automated job applications yet. Go through a run setup to capture AI intelligence cards.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex justify-between items-center bg-white/5 border border-white/10 p-5 rounded-2xl">
                    <div>
                      <h3 className="font-bold text-white text-lg font-[font2]">Submissions Record</h3>
                      <p className="text-xs text-zinc-400 mt-0.5">
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

      {/* Review Modal Gateway */}
      <AutomationReviewModal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        selectedJobs={selectedQueue}
        userEmail={userEmail}
        onConfirm={handleStartSmartApply}
      />
    </div>
  );
}
