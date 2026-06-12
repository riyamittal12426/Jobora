import React, { useState } from 'react';
import { Briefcase, Calendar, Award, AlertTriangle, Lightbulb, TrendingUp, CheckCircle, RefreshCw, Send } from 'lucide-react';
import { automationApi } from '@/services/automationApi';
import type { SubmittedApplication, TimelineEvent } from '@/types/automation';

interface SubmittedApplicationCardProps {
  application: SubmittedApplication;
  onRefresh: () => void;
}

export default function SubmittedApplicationCard({ application, onRefresh }: SubmittedApplicationCardProps) {
  const [status, setStatus] = useState(application.status);
  const [notes, setNotes] = useState(application.followUpNotes || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [timelineEvent, setTimelineEvent] = useState('');
  const [isTimelineSaving, setIsTimelineSaving] = useState(false);

  const handleStatusChange = async (newStatus: typeof application.status) => {
    setStatus(newStatus);
    setIsUpdating(true);
    try {
      const updatedTimeline = [...application.timeline];
      updatedTimeline.push({
        date: new Date().toISOString(),
        event: `Status Updated`,
        details: `Application status transitioned to ${newStatus}`
      });
      await automationApi.updateSubmittedApplication(application._id, {
        status: newStatus,
        timeline: updatedTimeline
      });
      onRefresh();
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleNotesBlur = async () => {
    if (notes === application.followUpNotes) return;
    try {
      await automationApi.updateSubmittedApplication(application._id, {
        followUpNotes: notes
      });
    } catch (err) {
      console.error('Failed to save follow-up notes:', err);
    }
  };

  const handleAddTimelineEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!timelineEvent.trim()) return;
    setIsTimelineSaving(true);
    try {
      const updatedTimeline = [...(application.timeline || [])];
      updatedTimeline.push({
        date: new Date().toISOString(),
        event: timelineEvent.trim(),
        details: 'User added update'
      });
      await automationApi.updateSubmittedApplication(application._id, {
        timeline: updatedTimeline
      });
      setTimelineEvent('');
      onRefresh();
    } catch (err) {
      console.error('Failed to add timeline event:', err);
    } finally {
      setIsTimelineSaving(false);
    }
  };

  const formattedDate = new Date(application.submissionDate).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const prediction = application.aiPrediction || {
    interviewProbability: 50,
    shortlistingProbability: 50,
    resumeStrengthAnalysis: 'No prediction analysis available.',
    strongestSellingPoints: [],
    biggestWeaknesses: [],
    suggestedFollowUpActions: [],
    recruiterComment: ''
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'offer':
        return 'bg-green-500/10 border-green-500/30 text-green-400';
      case 'interviewing':
        return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400';
      case 'rejected':
        return 'bg-red-500/10 border-red-500/30 text-red-400';
      case 'withdrawn':
        return 'bg-zinc-500/10 border-zinc-500/30 text-zinc-400';
      case 'submitted':
      default:
        return 'bg-violet-500/10 border-violet-500/30 text-violet-400';
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-xl hover:shadow-violet-500/[0.02] transition-all p-6 max-w-4xl mx-auto my-6 flex flex-col gap-6">
      
      {/* 1. Header & Quick Status */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-violet-600/10 rounded-xl border border-violet-500/25 text-violet-400 shrink-0">
            <Briefcase size={22} />
          </div>
          <div>
            <h3 className="text-xl font-bold font-[font2] text-white leading-tight">
              {application.jobInfo.title}
            </h3>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-400 mt-1">
              <span>{application.jobInfo.company}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar size={12} /> Submitted {formattedDate}
              </span>
              {application.matchScore && (
                <>
                  <span>•</span>
                  <span className="text-violet-300 font-bold uppercase tracking-wider">
                    {application.matchScore}% Match
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch md:self-auto justify-between border-t border-white/5 md:border-t-0 pt-3 md:pt-0">
          <div className="flex items-center gap-1">
            {isUpdating && <RefreshCw size={12} className="animate-spin text-zinc-500" />}
            <span className="text-xs text-zinc-500 mr-2 font-[font2]">TRACK STATUS</span>
          </div>
          <select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value as any)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-bold uppercase tracking-wider cursor-pointer focus:outline-none transition-all ${getStatusColor(
              status
            )}`}
          >
            <option value="submitted" className="bg-zinc-900 text-violet-300">Submitted</option>
            <option value="interviewing" className="bg-zinc-900 text-yellow-300">Interviewing</option>
            <option value="offer" className="bg-zinc-900 text-green-300">Offer Received</option>
            <option value="rejected" className="bg-zinc-900 text-red-300">Rejected</option>
            <option value="withdrawn" className="bg-zinc-900 text-zinc-300">Withdrawn</option>
          </select>
        </div>
      </div>

      {/* 2. AI Recruiter Predictive Intelligence */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Col: Probability Gauges */}
        <div className="bg-zinc-900/50 border border-white/5 p-5 rounded-2xl flex flex-col justify-center items-center text-center gap-4">
          <h4 className="text-zinc-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
            <TrendingUp size={12} className="text-violet-400" /> AI Outcomes Predictor
          </h4>
          
          <div className="flex gap-6 mt-2">
            {/* Interview Chance Dial */}
            <div className="flex flex-col items-center">
              <div className="relative w-20 h-20 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="40" cy="40" r="34" className="stroke-zinc-800" strokeWidth="6" fill="transparent" />
                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    className="stroke-violet-500"
                    strokeWidth="6"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 34}
                    strokeDashoffset={2 * Math.PI * 34 * (1 - prediction.interviewProbability / 100)}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute text-sm font-bold text-white font-[font2]">
                  {prediction.interviewProbability}%
                </span>
              </div>
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-2">Interview Chance</span>
            </div>

            {/* Shortlisting Chance Dial */}
            <div className="flex flex-col items-center">
              <div className="relative w-20 h-20 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="40" cy="40" r="34" className="stroke-zinc-800" strokeWidth="6" fill="transparent" />
                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    className="stroke-cyan-500"
                    strokeWidth="6"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 34}
                    strokeDashoffset={2 * Math.PI * 34 * (1 - prediction.shortlistingProbability / 100)}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute text-sm font-bold text-white font-[font2]">
                  {prediction.shortlistingProbability}%
                </span>
              </div>
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-2">Shortlist Rate</span>
            </div>
          </div>

          {prediction.recruiterComment && (
            <p className="text-[11px] text-zinc-400 mt-2 leading-relaxed italic">
              "{prediction.recruiterComment}"
            </p>
          )}
        </div>

        {/* Right Col (spans 2): Selling points & Weaknesses */}
        <div className="md:col-span-2 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Strengths */}
            <div className="bg-green-500/[0.02] border border-green-500/10 p-4 rounded-xl">
              <h5 className="text-green-400 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Award size={14} /> Strongest Advantages
              </h5>
              <ul className="space-y-1.5">
                {prediction.strongestSellingPoints?.length > 0 ? (
                  prediction.strongestSellingPoints.map((pt: string, i: number) => (
                    <li key={i} className="text-zinc-300 text-xs flex items-start gap-1">
                      <span className="text-green-500 select-none mr-1">•</span>
                      <span>{pt}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-zinc-500 text-xs italic">No strengths analyzed.</li>
                )}
              </ul>
            </div>

            {/* Weaknesses */}
            <div className="bg-red-500/[0.02] border border-red-500/10 p-4 rounded-xl">
              <h5 className="text-red-400 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <AlertTriangle size={14} /> Critical Gaps
              </h5>
              <ul className="space-y-1.5">
                {prediction.biggestWeaknesses?.length > 0 ? (
                  prediction.biggestWeaknesses.map((pt: string, i: number) => (
                    <li key={i} className="text-zinc-300 text-xs flex items-start gap-1">
                      <span className="text-red-400 select-none mr-1">•</span>
                      <span>{pt}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-zinc-500 text-xs italic">No major risks detected.</li>
                )}
              </ul>
            </div>

          </div>

          {/* Follow-up recommendations */}
          <div className="bg-violet-500/[0.02] border border-violet-500/10 p-4 rounded-xl">
            <h5 className="text-violet-300 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Lightbulb size={14} /> AI Action Plan & Follow-up
            </h5>
            <ul className="space-y-1">
              {prediction.suggestedFollowUpActions?.length > 0 ? (
                prediction.suggestedFollowUpActions.map((act: string, i: number) => (
                  <li key={i} className="text-zinc-300 text-xs flex items-start gap-1.5 leading-relaxed">
                    <span className="text-violet-400 font-bold">{i + 1}.</span>
                    <span>{act}</span>
                  </li>
                ))
              ) : (
                <li className="text-zinc-500 text-xs italic">No suggestions provided.</li>
              )}
            </ul>
          </div>

        </div>
      </div>

      {/* 3. Notes & Timeline Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/10">
        
        {/* Follow-up Notes */}
        <div>
          <h4 className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2.5">
            Follow-Up notes
          </h4>
          <textarea
            rows={5}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={handleNotesBlur}
            placeholder="Type recruiters feedback, scheduled interview details, or tracking coordinates here (auto-saves on blur)..."
            className="w-full p-3 bg-zinc-950/40 border border-white/10 rounded-xl text-white text-xs leading-relaxed focus:outline-none focus:border-violet-500/50 transition-all resize-none font-[font1]"
          />
        </div>

        {/* Timeline Log */}
        <div className="flex flex-col justify-between">
          <div>
            <h4 className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2.5">
              Application Timeline
            </h4>
            <div className="space-y-3 max-h-36 overflow-y-auto pr-2 custom-scrollbar">
              {(application.timeline || []).slice().reverse().map((ev: TimelineEvent, idx: number) => {
                const evDate = new Date(ev.date).toLocaleDateString([], {
                  month: 'short',
                  day: 'numeric'
                });
                return (
                  <div key={idx} className="flex gap-2 text-xs">
                    <span className="text-zinc-500 shrink-0 select-none w-10">{evDate}</span>
                    <span className="text-violet-400 shrink-0">•</span>
                    <div>
                      <p className="text-zinc-200 font-semibold">{ev.event}</p>
                      {ev.details && <p className="text-[10px] text-zinc-500">{ev.details}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleAddTimelineEvent} className="flex gap-2 mt-4 pt-3 border-t border-white/5">
            <input
              type="text"
              placeholder="Log timeline event (e.g. Received recruiter email)..."
              value={timelineEvent}
              onChange={(e) => setTimelineEvent(e.target.value)}
              className="flex-1 p-2 bg-zinc-950/40 border border-white/10 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500/50 transition-all"
            />
            <button
              type="submit"
              disabled={isTimelineSaving || !timelineEvent.trim()}
              className="bg-violet-600 hover:bg-violet-500 text-white font-bold p-2.5 rounded-lg transition-all shrink-0 flex items-center justify-center disabled:opacity-50"
            >
              {isTimelineSaving ? <RefreshCw className="animate-spin" size={14} /> : <Send size={14} />}
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}
