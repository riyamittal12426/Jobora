import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, FileText, Mail, Sparkles, Loader2, Copy, Check,
  ExternalLink, ArrowRight, AlertCircle, BarChart3, Target,
  ChevronDown, ChevronUp, MessageSquare, Briefcase, TrendingUp
} from 'lucide-react';
import DashboardLayout from '@/components/UserDashboard/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';

type ActiveTab = 'resume' | 'cover' | 'answers' | 'match';

interface TailoredExperience {
  company: string;
  role: string;
  originalBullets: string[];
  tailoredBullets: string[];
  relevanceScore: number;
}

interface ApplicationKitData {
  tailoredResume: {
    tailoredSummary: string;
    tailoredExperience: TailoredExperience[];
    keywordsInjected: string[];
    atsScoreBefore: number;
    atsScoreAfter: number;
  };
  coverLetter: string;
  screeningAnswers: Array<{
    question: string;
    answer: string;
    confidenceScore: number;
    fieldKey: string;
  }>;
  matchAnalysis: {
    matchScore: number;
    hiringProbability: string;
    interviewProbability: string;
    strengthsMatched: string[];
    missingSkills: string[];
    interviewPrepTips: string[];
    applyRecommendation: string;
    recruiterFeedback: string;
  } | null;
  jobInfo: {
    title: string;
    company: string;
    location: string;
    applyLink: string;
  };
}

export default function ApplicationKitPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const stateJob = location.state?.job;
  const { user, dbUser, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<ActiveTab>('resume');
  const [kitData, setKitData] = useState<ApplicationKitData | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Manual job input
  const [jobTitle, setJobTitle] = useState('');
  const [jobCompany, setJobCompany] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [jobApplyLink, setJobApplyLink] = useState('');

  // Expanded experience index for before/after toggle
  const [expandedExp, setExpandedExp] = useState<number | null>(null);

  useEffect(() => {
    if (stateJob && dbUser && !kitData && !generating) {
      handleGenerate(stateJob);
    }
  }, [stateJob, dbUser]);

  const handleGenerate = async (job?: any) => {
    if (!dbUser) return;
    setGenerating(true);
    setError(null);
    setKitData(null);

    const jobPayload = job || {
      title: jobTitle,
      company: jobCompany,
      description: jobDescription,
      applyLink: jobApplyLink,
    };

    if (!jobPayload.description && !jobPayload.jobDescription) {
      setError('Please provide a job description to generate the kit.');
      setGenerating(false);
      return;
    }

    try {
      const token = await user.getIdToken();
      const res = await fetch('http://localhost:5000/api/builder/application-kit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userEmail: dbUser.email, job: jobPayload }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to generate application kit.');
      }

      const data = await res.json();
      setKitData(data);
      setActiveTab('resume');
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const CopyButton = ({ text, id }: { text: string; id: string }) => (
    <button
      onClick={() => handleCopy(text, id)}
      className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors text-gray-300 cursor-pointer"
    >
      {copiedId === id ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
      {copiedId === id ? 'Copied!' : 'Copy'}
    </button>
  );

  const tabs = [
    { id: 'resume' as ActiveTab, label: 'Tailored Resume', icon: FileText },
    { id: 'cover' as ActiveTab, label: 'Cover Letter', icon: Mail },
    { id: 'answers' as ActiveTab, label: 'Screening Answers', icon: MessageSquare },
    { id: 'match' as ActiveTab, label: 'Match Analysis', icon: BarChart3 },
  ];

  return (
    <DashboardLayout
      currentPage="application-kit"
      pageTitle="Smart Application Kit"
      pageSubtitle="Generate a tailored resume, cover letter, and screening answers for any job in seconds."
    >
      <div className="w-full flex flex-col gap-6">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-950/20 p-4 text-sm text-red-300"
          >
            <AlertCircle size={18} /> <span className="flex-1">{error}</span>
            <button onClick={() => setError(null)} className="text-xs underline hover:text-white cursor-pointer">Dismiss</button>
          </motion.div>
        )}

        {/* Job Input Form (when no kit generated yet) */}
        {!kitData && !generating && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-[#181926]/60 backdrop-blur-xl rounded-[28px] border border-white/10 p-8 shadow-lg"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#7c3aed] to-[#a855f7] flex items-center justify-center shadow-lg shadow-purple-900/30">
                <Package size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white font-[font2]">Generate Application Kit</h2>
                <p className="text-xs text-gray-400">Paste a job description below to get your tailored application package.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1.5">Job Title</label>
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="e.g. Senior Frontend Engineer"
                    className="w-full p-3.5 bg-white/5 rounded-2xl border border-white/10 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed]/30 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1.5">Company</label>
                  <input
                    type="text"
                    value={jobCompany}
                    onChange={(e) => setJobCompany(e.target.value)}
                    placeholder="e.g. Google"
                    className="w-full p-3.5 bg-white/5 rounded-2xl border border-white/10 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed]/30 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1.5">Job Description *</label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the full job description here..."
                  rows={8}
                  className="w-full p-4 bg-white/5 rounded-2xl border border-white/10 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed]/30 transition-all leading-relaxed resize-none"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1.5">Apply Link (optional)</label>
                <input
                  type="url"
                  value={jobApplyLink}
                  onChange={(e) => setJobApplyLink(e.target.value)}
                  placeholder="https://..."
                  className="w-full p-3.5 bg-white/5 rounded-2xl border border-white/10 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed]/30 transition-all"
                />
              </div>

              <button
                onClick={() => handleGenerate()}
                disabled={!jobDescription.trim()}
                className="w-full py-4 bg-gradient-to-r from-[#7c3aed] to-[#a855f7] hover:from-[#6d28d9] hover:to-[#9333ea] text-white font-bold rounded-2xl transition-all shadow-lg shadow-purple-900/30 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm cursor-pointer"
              >
                <Sparkles size={18} /> Generate Full Application Kit
              </button>
            </div>
          </motion.div>
        )}

        {/* Loading State */}
        {generating && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="py-24 text-center bg-[#181926]/60 border border-white/10 rounded-[28px] p-8 backdrop-blur-md"
          >
            <Loader2 size={48} className="animate-spin text-[#a855f7] mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white font-[font2]">Building Your Application Kit...</h3>
            <p className="text-xs text-gray-400 max-w-md mx-auto mt-2">
              AI is tailoring your resume bullets, drafting a cover letter, generating screening answers, and analyzing your match score. This may take 15-30 seconds.
            </p>
          </motion.div>
        )}

        {/* Kit Results */}
        {kitData && !generating && (
          <>
            {/* Job Info Header */}
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-[#181926]/60 backdrop-blur-xl rounded-[28px] border border-white/10 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#7c3aed] to-[#a855f7] flex items-center justify-center shadow-lg">
                  <Briefcase size={22} className="text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white font-[font2]">
                    {kitData.jobInfo.title || 'Target Role'}
                  </h2>
                  <p className="text-xs text-gray-400">
                    {kitData.jobInfo.company} {kitData.jobInfo.location && `· ${kitData.jobInfo.location}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                {kitData.matchAnalysis && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
                    <Target size={14} className="text-[#a855f7]" />
                    <span className="text-sm font-bold text-white">{kitData.matchAnalysis.matchScore}%</span>
                    <span className="text-[10px] text-gray-400 uppercase font-bold">Match</span>
                  </div>
                )}
                {kitData.tailoredResume && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                    <TrendingUp size={14} className="text-emerald-400" />
                    <span className="text-sm font-bold text-emerald-300">
                      {kitData.tailoredResume.atsScoreBefore}% → {kitData.tailoredResume.atsScoreAfter}%
                    </span>
                    <span className="text-[10px] text-gray-400 uppercase font-bold">ATS</span>
                  </div>
                )}
                {kitData.jobInfo.applyLink && (
                  <a
                    href={kitData.jobInfo.applyLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-[#7c3aed] hover:bg-[#6d28d9] rounded-xl text-xs font-bold text-white transition-all shadow-lg shadow-purple-900/20"
                  >
                    Apply Now <ExternalLink size={12} />
                  </a>
                )}
                <button
                  onClick={() => { setKitData(null); setJobDescription(''); setJobTitle(''); setJobCompany(''); setJobApplyLink(''); }}
                  className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-gray-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                >
                  New Kit
                </button>
              </div>
            </motion.div>

            {/* Tabs */}
            <div className="flex border-b border-white/10 gap-1 pb-1 overflow-x-auto scrollbar-hide">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                    activeTab === tab.id
                      ? 'text-[#a855f7] border-b-2 border-[#a855f7]'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <tab.icon size={14} /> {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              {/* TAB: TAILORED RESUME */}
              {activeTab === 'resume' && kitData.tailoredResume && (
                <motion.div key="resume" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
                  {/* Tailored Summary */}
                  <div className="bg-[#181926]/60 border border-white/10 rounded-2xl p-6">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-sm font-bold text-white font-[font2]">Tailored Professional Summary</h3>
                      <CopyButton text={kitData.tailoredResume.tailoredSummary} id="summary" />
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed">{kitData.tailoredResume.tailoredSummary}</p>
                  </div>

                  {/* ATS Keywords */}
                  <div className="bg-[#181926]/60 border border-white/10 rounded-2xl p-6">
                    <h3 className="text-sm font-bold text-white font-[font2] mb-3">ATS Keywords Injected</h3>
                    <div className="flex flex-wrap gap-2">
                      {(kitData.tailoredResume.keywordsInjected || []).map((kw, i) => (
                        <span key={i} className="px-3 py-1.5 bg-[#7c3aed]/15 border border-[#7c3aed]/30 text-[#c4b5fd] text-[11px] font-bold rounded-lg">{kw}</span>
                      ))}
                    </div>
                  </div>

                  {/* Experience Before/After */}
                  {(kitData.tailoredResume.tailoredExperience || []).map((exp, idx) => (
                    <div key={idx} className="bg-[#181926]/60 border border-white/10 rounded-2xl p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="text-sm font-bold text-white">{exp.role}</h4>
                          <p className="text-xs text-gray-400">{exp.company}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${exp.relevanceScore >= 75 ? 'bg-emerald-500/15 text-emerald-400' : exp.relevanceScore >= 50 ? 'bg-yellow-500/15 text-yellow-400' : 'bg-gray-500/15 text-gray-400'}`}>
                            {exp.relevanceScore}% Relevant
                          </span>
                          <CopyButton text={exp.tailoredBullets.map(b => `• ${b}`).join('\n')} id={`exp-${idx}`} />
                        </div>
                      </div>

                      {/* Tailored bullets */}
                      <div className="space-y-2 mb-3">
                        {exp.tailoredBullets.map((bullet, bIdx) => (
                          <div key={bIdx} className="flex items-start gap-2 text-xs text-gray-200 leading-relaxed">
                            <ArrowRight size={12} className="text-[#a855f7] mt-0.5 shrink-0" />
                            <span>{bullet}</span>
                          </div>
                        ))}
                      </div>

                      {/* Toggle original */}
                      <button
                        onClick={() => setExpandedExp(expandedExp === idx ? null : idx)}
                        className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-gray-300 font-bold uppercase tracking-wider cursor-pointer"
                      >
                        {expandedExp === idx ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        {expandedExp === idx ? 'Hide' : 'Show'} Original Bullets
                      </button>
                      <AnimatePresence>
                        {expandedExp === idx && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-3 pl-4 border-l-2 border-white/10 space-y-1.5 overflow-hidden">
                            {exp.originalBullets.map((bullet, bIdx) => (
                              <p key={bIdx} className="text-[11px] text-gray-500 leading-relaxed">• {bullet}</p>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </motion.div>
              )}

              {/* TAB: COVER LETTER */}
              {activeTab === 'cover' && (
                <motion.div key="cover" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <div className="bg-[#181926]/60 border border-white/10 rounded-2xl p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-sm font-bold text-white font-[font2]">Custom Cover Letter</h3>
                      <CopyButton text={kitData.coverLetter} id="cover-letter" />
                    </div>
                    <div className="bg-white/[0.02] border border-white/5 rounded-xl p-6 text-sm text-gray-300 leading-[1.8] whitespace-pre-line font-sans">
                      {kitData.coverLetter}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB: SCREENING ANSWERS */}
              {activeTab === 'answers' && (
                <motion.div key="answers" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                  {kitData.screeningAnswers.length > 0 ? kitData.screeningAnswers.map((qa, idx) => (
                    <div key={idx} className="bg-[#181926]/60 border border-white/10 rounded-2xl p-6">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="text-sm font-bold text-white font-[font2] leading-snug flex-1 mr-4">
                          {idx + 1}. {qa.question}
                        </h4>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${qa.confidenceScore >= 85 ? 'bg-emerald-500/15 text-emerald-400' : qa.confidenceScore >= 70 ? 'bg-yellow-500/15 text-yellow-400' : 'bg-red-500/15 text-red-400'}`}>
                            {qa.confidenceScore}%
                          </span>
                          <CopyButton text={qa.answer} id={`qa-${idx}`} />
                        </div>
                      </div>
                      <p className="text-xs text-gray-300 leading-relaxed">{qa.answer}</p>
                    </div>
                  )) : (
                    <div className="text-center py-12 text-gray-500 text-xs font-semibold">No screening answers were generated.</div>
                  )}
                </motion.div>
              )}

              {/* TAB: MATCH ANALYSIS */}
              {activeTab === 'match' && kitData.matchAnalysis && (
                <motion.div key="match" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-[#181926]/60 border border-white/10 rounded-2xl p-6 text-center">
                      <p className="text-4xl font-black text-[#a855f7] font-[font2]">{kitData.matchAnalysis.matchScore}%</p>
                      <p className="text-[10px] text-gray-400 uppercase font-bold mt-1">Overall Match</p>
                    </div>
                    <div className="bg-[#181926]/60 border border-white/10 rounded-2xl p-6 text-center">
                      <p className={`text-2xl font-black font-[font2] ${kitData.matchAnalysis.hiringProbability === 'High' ? 'text-emerald-400' : kitData.matchAnalysis.hiringProbability === 'Medium' ? 'text-yellow-400' : 'text-red-400'}`}>
                        {kitData.matchAnalysis.hiringProbability}
                      </p>
                      <p className="text-[10px] text-gray-400 uppercase font-bold mt-1">Hiring Probability</p>
                    </div>
                    <div className="bg-[#181926]/60 border border-white/10 rounded-2xl p-6 text-center">
                      <p className="text-xl font-bold text-white font-[font2]">{kitData.matchAnalysis.applyRecommendation}</p>
                      <p className="text-[10px] text-gray-400 uppercase font-bold mt-1">Recommendation</p>
                    </div>
                  </div>

                  <div className="bg-[#181926]/60 border border-white/10 rounded-2xl p-6">
                    <h3 className="text-sm font-bold text-white font-[font2] mb-3">Recruiter Feedback</h3>
                    <p className="text-xs text-gray-300 leading-relaxed">{kitData.matchAnalysis.recruiterFeedback}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-[#181926]/60 border border-white/10 rounded-2xl p-6">
                      <h3 className="text-sm font-bold text-emerald-400 font-[font2] mb-3">Strengths Matched</h3>
                      <div className="space-y-2">
                        {(kitData.matchAnalysis.strengthsMatched || []).map((s, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs text-gray-300">
                            <Check size={12} className="text-emerald-400 mt-0.5 shrink-0" /> {s}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-[#181926]/60 border border-white/10 rounded-2xl p-6">
                      <h3 className="text-sm font-bold text-amber-400 font-[font2] mb-3">Missing Skills</h3>
                      <div className="space-y-2">
                        {(kitData.matchAnalysis.missingSkills || []).map((s, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs text-gray-300">
                            <AlertCircle size={12} className="text-amber-400 mt-0.5 shrink-0" /> {s}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {(kitData.matchAnalysis.interviewPrepTips || []).length > 0 && (
                    <div className="bg-[#181926]/60 border border-white/10 rounded-2xl p-6">
                      <h3 className="text-sm font-bold text-white font-[font2] mb-3">Interview Prep Tips</h3>
                      <div className="space-y-2">
                        {kitData.matchAnalysis.interviewPrepTips.map((tip, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs text-gray-300">
                            <Sparkles size={12} className="text-[#a855f7] mt-0.5 shrink-0" /> {tip}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
