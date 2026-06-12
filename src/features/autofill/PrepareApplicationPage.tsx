import React, { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Sparkles, User, Briefcase, FileText, CheckCircle,
  AlertCircle, Loader2, RefreshCw, Send, Plus, Trash2, ShieldAlert,
  ExternalLink, Layers, History, Award, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { autofillApi } from '@/services/autofillApi';
import type {
  CandidateProfile,
  PreparedApplication,
  AutofillAnswer,
  DetectedFormField
} from '@/types/autofill';
import type { JobListing } from '@/types/jobs';

export default function PrepareApplicationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const stateJob = location.state?.job as JobListing | undefined;

  const [userEmail, setUserEmail] = useState('');
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [application, setApplication] = useState<PreparedApplication | null>(null);
  const [history, setHistory] = useState<PreparedApplication[]>([]);
  const [activeTab, setActiveTab] = useState<'profile' | 'qa' | 'cover' | 'preview' | 'recruiter'>('qa');

  // Loading and error states
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingApp, setLoadingApp] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [extractingProfile, setExtractingProfile] = useState(false);
  const [generatingApp, setGeneratingApp] = useState(false);
  const [regeneratingItem, setRegeneratingItem] = useState<string | null>(null);
  const [scanningUrl, setScanningUrl] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  // Form detector URL input
  const [detectUrl, setDetectUrl] = useState('');
  const [detectedFields, setDetectedFields] = useState<DetectedFormField[]>([]);
  const [detectedPortal, setDetectedPortal] = useState('standard');

  // Load User Email
  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) {
      navigate('/auth');
      return;
    }
    const email = JSON.parse(stored).email;
    setUserEmail(email);
  }, [navigate]);

  // Load History
  const loadHistory = useCallback(async (email: string) => {
    setLoadingHistory(true);
    try {
      const data = await autofillApi.getApplicationHistory(email);
      setHistory(data);
    } catch (err) {
      console.error('Failed to load history', err);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  // Load Candidate Profile
  const loadProfile = useCallback(async (email: string) => {
    setLoadingProfile(true);
    try {
      const data = await autofillApi.getCandidateProfile(email);
      setProfile(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoadingProfile(false);
    }
  }, []);

  // Trigger loading when email is ready
  useEffect(() => {
    if (!userEmail) return;
    loadProfile(userEmail);
    loadHistory(userEmail);
  }, [userEmail, loadProfile, loadHistory]);

  // Handle automatic generation if navigated from JobMatchModal
  useEffect(() => {
    if (!userEmail || !stateJob) return;

    const autoGenerate = async () => {
      setGeneratingApp(true);
      setError(null);
      try {
        const prepared = await autofillApi.prepareApplication(userEmail, stateJob);
        setApplication(prepared);
        setActiveTab('qa');
        loadHistory(userEmail);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to prepare application');
      } finally {
        setGeneratingApp(false);
      }
    };

    autoGenerate();
  }, [userEmail, stateJob, loadHistory]);

  // Select an application from history
  const handleSelectApp = async (id: string) => {
    setLoadingApp(true);
    setError(null);
    try {
      const data = await autofillApi.getApplication(id);
      setApplication(data);
      setActiveTab('qa');
    } catch (err) {
      setError('Failed to load application');
    } finally {
      setLoadingApp(false);
    }
  };

  // AI Extract Profile from Resume
  const handleExtractProfile = async () => {
    if (!userEmail) return;
    setExtractingProfile(true);
    setError(null);
    try {
      const data = await autofillApi.extractProfileFromResume(userEmail);
      setProfile(data);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Extraction failed');
    } finally {
      setExtractingProfile(false);
    }
  };

  // Update Profile
  const handleUpdateProfile = async (updated: CandidateProfile) => {
    if (!userEmail) return;
    setSaveStatus('saving');
    try {
      const data = await autofillApi.updateCandidateProfile(userEmail, updated);
      setProfile(data);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      setSaveStatus('error');
    }
  };

  // Update Application Answer in State and DB
  const handleAnswerChange = (index: number, val: string) => {
    if (!application) return;
    const updatedAnswers = [...application.answers];
    updatedAnswers[index].answer = val;
    setApplication({ ...application, answers: updatedAnswers });
  };

  const handleSaveAnswers = async () => {
    if (!application) return;
    setSaveStatus('saving');
    try {
      const data = await autofillApi.updateApplication(application._id, {
        answers: application.answers,
        coverLetter: application.coverLetter,
        status: application.status
      });
      setApplication(data);
      loadHistory(userEmail);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      setSaveStatus('error');
    }
  };

  // Cover Letter Text Change
  const handleCoverLetterChange = (val: string) => {
    if (!application) return;
    setApplication({ ...application, coverLetter: val });
  };

  // Trigger AI Regeneration
  const handleRegenerate = async (type: 'answer' | 'cover_letter', fieldKey?: string) => {
    if (!application) return;
    const targetKey = type === 'answer' ? (fieldKey || 'regen') : 'cover';
    setRegeneratingItem(targetKey);
    setError(null);
    try {
      const data = await autofillApi.regenerateContent(application._id, type, { fieldKey });
      setApplication(data);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Regeneration failed');
    } finally {
      setRegeneratingItem(null);
    }
  };

  // Scan URL with Playwright
  const handleDetectFields = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detectUrl.trim()) return;
    setScanningUrl(true);
    try {
      const res = await autofillApi.detectFields(detectUrl);
      setDetectedFields(res.fields);
      setDetectedPortal(res.portal);
      setActiveTab('preview');
    } catch (err) {
      setError('Failed to scan URL');
    } finally {
      setScanningUrl(false);
    }
  };

  // Helper: map profile snapshot properties to mock Greenhouse form preview fields
  const getMappedValue = (fieldKey: string) => {
    if (!application) return '';
    const prof = application.candidateProfileSnapshot;
    const lowercaseKey = fieldKey.toLowerCase();

    if (lowercaseKey.includes('first') && lowercaseKey.includes('name')) return prof.name.split(' ')[0] || '';
    if (lowercaseKey.includes('last') && lowercaseKey.includes('name')) return prof.name.split(' ').slice(1).join(' ') || '';
    if (lowercaseKey.includes('name')) return prof.name;
    if (lowercaseKey.includes('email')) return prof.email;
    if (lowercaseKey.includes('phone')) return prof.phone;
    if (lowercaseKey.includes('linkedin')) return prof.linkedinUrl;
    if (lowercaseKey.includes('github')) return prof.githubUrl;
    if (lowercaseKey.includes('portfolio') || lowercaseKey.includes('website')) return prof.portfolioUrl;

    // Check custom screening questions
    const matchingAns = application.answers.find(a =>
      lowercaseKey.includes(a.fieldKey) ||
      a.fieldKey.includes(lowercaseKey) ||
      a.question.toLowerCase().includes(lowercaseKey)
    );
    if (matchingAns) return matchingAns.answer;

    return '';
  };

  return (
    <div className="min-h-screen bg-[#060608] text-gray-200 font-[font1] relative overflow-x-hidden">
      {/* Premium Glassmorphic Header */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-gray-950/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" className="text-gray-400 hover:text-white" onClick={() => navigate('/job-recommendations')}>
              <ArrowLeft size={18} /> Recommendations
            </Button>
            <div className="h-6 w-px bg-white/10 hidden sm:block"></div>
            <div>
              <h1 className="text-lg font-bold text-violet-300 font-[font2] flex items-center gap-2">
                <Sparkles size={16} className="text-violet-400 animate-pulse" />
                AI Application Autofill Assistant
              </h1>
              <p className="text-xs text-gray-500">Simplify-style Form Mapping & Screening Answer Sandbox</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {saveStatus === 'saving' && (
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Loader2 size={12} className="animate-spin" /> Saving changes...
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="text-xs text-emerald-400 flex items-center gap-1">
                <Check size={12} /> Autosaved
              </span>
            )}
            {application && (
              <Button
                size="sm"
                onClick={handleSaveAnswers}
                className="bg-emerald-600 hover:bg-emerald-500 font-bold"
              >
                <CheckCircle size={16} className="mr-1.5" /> Save Application
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Error Notification */}
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-950/20 p-4 text-sm text-red-300">
            <AlertCircle size={18} className="flex-shrink-0" />
            <span className="flex-1">{error}</span>
            <button onClick={() => setError(null)} className="text-xs underline hover:text-white">Dismiss</button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT SIDEBAR: Active Job & History (4 Cols) */}
          <aside className="lg:col-span-4 space-y-6">
            {/* Active Job Information */}
            {application ? (
              <Card className="bg-white/5 border-white/5 backdrop-blur-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 text-white/5 pointer-events-none">
                  <Briefcase size={96} />
                </div>
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-violet-500/20 text-violet-300 border border-violet-500/30">Target Role</Badge>
                    <Badge variant={application.status === 'Draft' ? 'outline' : 'success'}>
                      {application.status}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl font-bold font-[font2] text-white mt-3">
                    {application.jobInfo.title}
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    {application.jobInfo.company} · {application.jobInfo.location || 'Remote'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-xs text-gray-500 line-clamp-3">
                    {application.jobInfo.description}
                  </p>
                  {application.jobInfo.applyLink && (
                    <a
                      href={application.jobInfo.applyLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-indigo-600/30 border border-indigo-500/20 py-2.5 text-xs font-semibold text-white hover:bg-indigo-600/50 transition-all"
                    >
                      View Original Job <ExternalLink size={12} />
                    </a>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-white/5 border-white/5 p-6 text-center text-gray-500">
                <Briefcase size={32} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm">No target job selected. Choose from history or prepare from recommendations.</p>
              </Card>
            )}

            {/* Playwright Portal Scanner */}
            <Card className="bg-white/5 border-white/5 backdrop-blur-xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-md font-bold font-[font2] text-white flex items-center gap-2">
                  <Layers size={16} className="text-indigo-400" />
                  Form Scanner (Playwright)
                </CardTitle>
                <CardDescription className="text-xs text-gray-400">
                  Enter a Greenhouse/Lever link to map custom application portal fields automatically.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleDetectFields} className="space-y-3">
                  <input
                    type="url"
                    placeholder="https://boards.greenhouse.io/..."
                    value={detectUrl}
                    onChange={(e) => setDetectUrl(e.target.value)}
                    className="w-full p-2.5 bg-white/5 rounded-xl border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={scanningUrl || !detectUrl}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-xs font-bold font-[font2]"
                  >
                    {scanningUrl ? (
                      <><Loader2 size={12} className="animate-spin mr-1.5" /> Launching Crawler...</>
                    ) : (
                      <><Sparkles size={12} className="mr-1.5" /> Detect Form Fields</>
                    )}
                  </Button>
                </form>

                {detectedFields.length > 0 && (
                  <div className="mt-4 border-t border-white/5 pt-3">
                    <span className="text-xs text-gray-400 block mb-2 font-medium">
                      Detected Fields ({detectedFields.length}) - Portal: <span className="text-violet-300 font-bold uppercase">{detectedPortal}</span>
                    </span>
                    <div className="max-h-36 overflow-y-auto space-y-1.5 scrollbar-hide pr-1">
                      {detectedFields.map((f, i) => (
                        <div key={i} className="flex justify-between items-center bg-white/5 border border-white/5 px-2 py-1.5 rounded-lg text-[10px]">
                          <span className="text-gray-300 truncate max-w-[150px] font-medium">{f.label || f.name}</span>
                          <Badge variant={f.required ? 'warning' : 'outline'} className="scale-90 select-none">
                            {f.type} {f.required && '*'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Application Preparation History */}
            <Card className="bg-white/5 border-white/5 backdrop-blur-xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-md font-bold font-[font2] text-white flex items-center gap-2">
                  <History size={16} className="text-emerald-400" />
                  Application Sandbox History
                </CardTitle>
                <CardDescription className="text-xs text-gray-400">
                  Select previously prepared drafts to review or update.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {loadingHistory ? (
                  <div className="py-8 text-center">
                    <Loader2 size={24} className="animate-spin text-emerald-400 mx-auto" />
                  </div>
                ) : history.length === 0 ? (
                  <div className="py-6 text-center text-xs text-gray-500">
                    No application packages stored yet.
                  </div>
                ) : (
                  <div className="max-h-64 overflow-y-auto divide-y divide-white/5 pr-1">
                    {history.map((appItem) => (
                      <button
                        key={appItem._id}
                        onClick={() => handleSelectApp(appItem._id)}
                        className={`w-full text-left p-4 hover:bg-white/5 flex flex-col gap-1 transition-colors ${
                          application?._id === appItem._id ? 'bg-white/5 border-l-2 border-emerald-500' : ''
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <span className="text-xs font-bold text-white truncate max-w-[170px] font-[font2]">
                            {appItem.jobInfo.title}
                          </span>
                          <span className="text-[10px] text-gray-500 font-medium font-[font1]">
                            {new Date(appItem.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-400 font-medium">
                          {appItem.jobInfo.company}
                        </span>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Badge variant="outline" className="scale-75 origin-left select-none">
                            {appItem.answers.length} Answers
                          </Badge>
                          <Badge variant={appItem.recruiterReview.interviewProbability === 'High' ? 'success' : 'outline'} className="scale-75 origin-left select-none">
                            {appItem.recruiterReview.interviewProbability} Prob.
                          </Badge>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </aside>

          {/* RIGHT WORKSPACE: Tabs Content (8 Cols) */}
          <main className="lg:col-span-8 space-y-6">
            {/* Nav Tabs */}
            <div className="flex border-b border-white/5 overflow-x-auto gap-2 pb-1 scrollbar-hide">
              <button
                onClick={() => setActiveTab('qa')}
                className={`pb-3 px-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'qa' ? 'border-violet-500 text-violet-300 font-bold' : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <Sparkles size={14} /> Screening Answers
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className={`pb-3 px-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'profile' ? 'border-violet-500 text-violet-300 font-bold' : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <User size={14} /> Candidate Profile
              </button>
              <button
                onClick={() => setActiveTab('cover')}
                className={`pb-3 px-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'cover' ? 'border-violet-500 text-violet-300 font-bold' : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <FileText size={14} /> Cover Letter
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                className={`pb-3 px-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'preview' ? 'border-violet-500 text-violet-300 font-bold' : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <Layers size={14} /> Mock Form Preview
              </button>
              <button
                onClick={() => setActiveTab('recruiter')}
                className={`pb-3 px-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'recruiter' ? 'border-violet-500 text-violet-300 font-bold' : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <Award size={14} /> Recruiter Predictions
              </button>
            </div>

            {/* Tab Contents */}
            <div className="min-h-[500px]">
              {generatingApp && (
                <div className="py-24 text-center space-y-4 bg-white/5 border border-white/5 rounded-2xl p-8">
                  <Loader2 size={40} className="animate-spin text-violet-400 mx-auto" />
                  <h3 className="text-lg font-bold text-violet-200 font-[font2]">Analyzing Application Requirements...</h3>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto">
                    Groq is evaluating target skills, framing professional screening answers from your resume snapshot, and writing a cover letter.
                  </p>
                </div>
              )}

              {!generatingApp && loadingApp && (
                <div className="py-24 text-center bg-white/5 border border-white/5 rounded-2xl p-8">
                  <Loader2 size={30} className="animate-spin text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">Loading saved application draft...</p>
                </div>
              )}

              {/* TAB 1: SCREENING ANSWERS */}
              {!generatingApp && !loadingApp && activeTab === 'qa' && (
                <div className="space-y-6">
                  {application ? (
                    <>
                      <div className="flex justify-between items-center bg-violet-950/20 border border-violet-500/20 p-4 rounded-xl text-xs text-violet-200">
                        <span className="font-medium">
                          These answers are drafted by Groq based on your extracted Candidate Profile. Double-check and customize them.
                        </span>
                        <Button
                          size="sm"
                          onClick={handleSaveAnswers}
                          className="bg-violet-600 hover:bg-violet-500 font-bold text-[10px] py-1 h-7"
                        >
                          Save Draft
                        </Button>
                      </div>

                      <div className="space-y-6">
                        {application.answers.map((item, idx) => (
                          <Card key={idx} className="bg-white/5 border-white/5">
                            <CardHeader className="pb-2">
                              <div className="flex justify-between items-start gap-4">
                                <h3 className="text-sm font-bold text-white font-[font2]">
                                  {idx + 1}. {item.question}
                                </h3>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-gray-500">Confidence</span>
                                  <Badge className={
                                    item.confidenceScore >= 85 ? 'bg-emerald-500/20 text-emerald-300' :
                                    item.confidenceScore >= 70 ? 'bg-yellow-500/20 text-yellow-300' :
                                    'bg-red-500/20 text-red-300'
                                  }>
                                    {item.confidenceScore}%
                                  </Badge>
                                </div>
                              </div>
                              <p className="text-[10px] text-gray-400 italic">
                                Field Key Mapping: <span className="font-semibold text-indigo-300">{item.fieldKey}</span>
                              </p>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <textarea
                                value={item.answer}
                                onChange={(e) => handleAnswerChange(idx, e.target.value)}
                                rows={4}
                                className="w-full p-3 bg-gray-900/60 rounded-xl border border-white/10 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-violet-500"
                              />

                              <div className="flex justify-between items-center gap-4 text-[10px] text-gray-500">
                                <div className="flex items-center gap-1.5 flex-1 max-w-[80%]">
                                  <CheckCircle size={12} className="text-emerald-400 flex-shrink-0" />
                                  <span className="truncate">{item.explanation}</span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={regeneratingItem !== null}
                                  onClick={() => handleRegenerate('answer', item.fieldKey)}
                                  className="text-violet-400 hover:text-violet-300 text-[10px] h-6 px-2 flex items-center gap-1"
                                >
                                  {regeneratingItem === item.fieldKey ? (
                                    <><Loader2 size={10} className="animate-spin" /> Regenerating...</>
                                  ) : (
                                    <><RefreshCw size={10} /> Regenerate</>
                                  )}
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="py-20 text-center bg-white/5 border border-white/5 rounded-2xl text-gray-500">
                      <Sparkles size={40} className="mx-auto mb-4 text-violet-400 opacity-40 animate-pulse" />
                      <h3 className="text-md font-bold text-white font-[font2] mb-1">Prepare Application Package</h3>
                      <p className="text-xs max-w-xs mx-auto mb-6">
                        No active application package loaded. Select a recommended job to prepare a custom application draft.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: CANDIDATE PROFILE EDITOR */}
              {!generatingApp && !loadingApp && activeTab === 'profile' && (
                <div className="space-y-6">
                  {profile ? (
                    <Card className="bg-white/5 border-white/5">
                      <CardHeader className="pb-4 border-b border-white/5 flex flex-row items-center justify-between">
                        <div>
                          <CardTitle className="text-lg font-bold font-[font2] text-white">Extracted Candidate Profile</CardTitle>
                          <CardDescription className="text-xs text-gray-400">
                            Verify and maintain the profile used to populate applications and screening forms.
                          </CardDescription>
                        </div>
                        <Button
                          size="sm"
                          disabled={extractingProfile}
                          onClick={handleExtractProfile}
                          className="bg-indigo-600 hover:bg-indigo-500 font-bold text-xs"
                        >
                          {extractingProfile ? (
                            <><Loader2 size={12} className="animate-spin mr-1" /> Parsing Resume...</>
                          ) : (
                            <><Sparkles size={12} className="mr-1" /> Re-parse Resume</>
                          )}
                        </Button>
                      </CardHeader>
                      <CardContent className="space-y-6 pt-6">
                        {/* Profile Basic Info */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-gray-400 mb-1 text-[10px] uppercase font-bold tracking-wider">Full Name</label>
                            <input
                              type="text"
                              value={profile.name}
                              onChange={(e) => handleUpdateProfile({ ...profile, name: e.target.value })}
                              className="w-full p-2.5 bg-gray-900/60 rounded-xl border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="block text-gray-400 mb-1 text-[10px] uppercase font-bold tracking-wider">Email Address</label>
                            <input
                              type="email"
                              value={profile.email}
                              onChange={(e) => handleUpdateProfile({ ...profile, email: e.target.value })}
                              className="w-full p-2.5 bg-gray-900/60 rounded-xl border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="block text-gray-400 mb-1 text-[10px] uppercase font-bold tracking-wider">Phone Number</label>
                            <input
                              type="text"
                              value={profile.phone}
                              onChange={(e) => handleUpdateProfile({ ...profile, phone: e.target.value })}
                              className="w-full p-2.5 bg-gray-900/60 rounded-xl border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                        </div>

                        {/* Social Links */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-gray-400 mb-1 text-[10px] uppercase font-bold tracking-wider">LinkedIn URL</label>
                            <input
                              type="url"
                              value={profile.linkedinUrl}
                              onChange={(e) => handleUpdateProfile({ ...profile, linkedinUrl: e.target.value })}
                              placeholder="https://linkedin.com/in/..."
                              className="w-full p-2.5 bg-gray-900/60 rounded-xl border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="block text-gray-400 mb-1 text-[10px] uppercase font-bold tracking-wider">GitHub URL</label>
                            <input
                              type="url"
                              value={profile.githubUrl}
                              onChange={(e) => handleUpdateProfile({ ...profile, githubUrl: e.target.value })}
                              placeholder="https://github.com/..."
                              className="w-full p-2.5 bg-gray-900/60 rounded-xl border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="block text-gray-400 mb-1 text-[10px] uppercase font-bold tracking-wider">Portfolio/Website URL</label>
                            <input
                              type="url"
                              value={profile.portfolioUrl}
                              onChange={(e) => handleUpdateProfile({ ...profile, portfolioUrl: e.target.value })}
                              placeholder="https://yoursite.com"
                              className="w-full p-2.5 bg-gray-900/60 rounded-xl border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                        </div>

                        {/* Skills */}
                        <div>
                          <label className="block text-gray-400 mb-1 text-[10px] uppercase font-bold tracking-wider">Skills (Comma-separated)</label>
                          <input
                            type="text"
                            value={profile.skills.join(', ')}
                            onChange={(e) => handleUpdateProfile({
                              ...profile,
                              skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                            })}
                            className="w-full p-2.5 bg-gray-900/60 rounded-xl border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500"
                          />
                        </div>

                        {/* Experience Timeline */}
                        <div>
                          <span className="block text-gray-300 mb-3 text-xs uppercase font-bold tracking-wider border-b border-white/5 pb-2">
                            Work Experience
                          </span>
                          <div className="space-y-4">
                            {profile.experience.map((exp, expIdx) => (
                              <div key={expIdx} className="bg-gray-900/30 border border-white/5 p-4 rounded-xl space-y-3 relative">
                                <button
                                  onClick={() => {
                                    const updatedExp = profile.experience.filter((_, idx) => idx !== expIdx);
                                    handleUpdateProfile({ ...profile, experience: updatedExp });
                                  }}
                                  className="absolute top-4 right-4 text-gray-500 hover:text-red-400 transition-colors"
                                >
                                  <Trash2 size={14} />
                                </button>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <input
                                    type="text"
                                    placeholder="Company"
                                    value={exp.company}
                                    onChange={(e) => {
                                      const updatedExp = [...profile.experience];
                                      updatedExp[expIdx].company = e.target.value;
                                      handleUpdateProfile({ ...profile, experience: updatedExp });
                                    }}
                                    className="p-2 bg-gray-900/60 rounded-lg border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500"
                                  />
                                  <input
                                    type="text"
                                    placeholder="Role/Title"
                                    value={exp.role}
                                    onChange={(e) => {
                                      const updatedExp = [...profile.experience];
                                      updatedExp[expIdx].role = e.target.value;
                                      handleUpdateProfile({ ...profile, experience: updatedExp });
                                    }}
                                    className="p-2 bg-gray-900/60 rounded-lg border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500"
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <input
                                    type="text"
                                    placeholder="Start Date (e.g. 2021-09)"
                                    value={exp.startDate}
                                    onChange={(e) => {
                                      const updatedExp = [...profile.experience];
                                      updatedExp[expIdx].startDate = e.target.value;
                                      handleUpdateProfile({ ...profile, experience: updatedExp });
                                    }}
                                    className="p-2 bg-gray-900/60 rounded-lg border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500"
                                  />
                                  <input
                                    type="text"
                                    placeholder="End Date (e.g. Present)"
                                    value={exp.endDate}
                                    onChange={(e) => {
                                      const updatedExp = [...profile.experience];
                                      updatedExp[expIdx].endDate = e.target.value;
                                      handleUpdateProfile({ ...profile, experience: updatedExp });
                                    }}
                                    className="p-2 bg-gray-900/60 rounded-lg border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500"
                                  />
                                </div>
                                <textarea
                                  placeholder="Role description"
                                  value={exp.description}
                                  onChange={(e) => {
                                    const updatedExp = [...profile.experience];
                                    updatedExp[expIdx].description = e.target.value;
                                    handleUpdateProfile({ ...profile, experience: updatedExp });
                                  }}
                                  rows={2}
                                  className="w-full p-2.5 bg-gray-900/60 rounded-lg border border-white/10 text-xs text-gray-200 focus:outline-none focus:border-indigo-500"
                                />
                              </div>
                            ))}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newExp = [...profile.experience, { company: '', role: '', description: '', startDate: '', endDate: '' }];
                                handleUpdateProfile({ ...profile, experience: newExp });
                              }}
                              className="text-xs flex items-center gap-1.5"
                            >
                              <Plus size={12} /> Add Experience Record
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="py-20 text-center bg-white/5 rounded-2xl">
                      <Loader2 size={30} className="animate-spin text-gray-400 mx-auto" />
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: COVER LETTER */}
              {!generatingApp && !loadingApp && activeTab === 'cover' && (
                <div className="space-y-6">
                  {application ? (
                    <Card className="bg-white/5 border-white/5">
                      <CardHeader className="pb-4 border-b border-white/5 flex flex-row justify-between items-center">
                        <div>
                          <CardTitle className="text-lg font-bold font-[font2] text-white">Generated Cover Letter</CardTitle>
                          <CardDescription className="text-xs text-gray-400">
                            A customized letter highlighting relevant resume points matching this role.
                          </CardDescription>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={regeneratingItem === 'cover'}
                          onClick={() => handleRegenerate('cover_letter')}
                          className="text-xs"
                        >
                          {regeneratingItem === 'cover' ? (
                            <><Loader2 size={12} className="animate-spin mr-1.5" /> Rewriting...</>
                          ) : (
                            <><RefreshCw size={12} className="mr-1.5" /> Regenerate</>
                          )}
                        </Button>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <textarea
                          value={application.coverLetter}
                          onChange={(e) => handleCoverLetterChange(e.target.value)}
                          rows={18}
                          className="w-full p-4 bg-gray-900/50 rounded-xl border border-white/10 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-violet-500 font-mono leading-relaxed"
                        />
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="py-20 text-center bg-white/5 rounded-2xl text-gray-500">
                      Select a job listing to prepare application cover letters.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: MOCK FORM PORTAL PREVIEW */}
              {!generatingApp && !loadingApp && activeTab === 'preview' && (
                <div className="space-y-6">
                  {application ? (
                    <div className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-xl">
                      {/* Fake Portal Bar */}
                      <div className="bg-gray-900/80 border-b border-white/5 px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1.5">
                            <span className="w-3 h-3 rounded-full bg-red-500/80"></span>
                            <span className="w-3 h-3 rounded-full bg-yellow-500/80"></span>
                            <span className="w-3 h-3 rounded-full bg-green-500/80"></span>
                          </div>
                          <span className="text-xs text-gray-500 font-mono ml-3 truncate max-w-sm">
                            https://application-portal.com/careers/jobs/apply
                          </span>
                        </div>
                        <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase text-[10px] tracking-wide select-none">
                          <Sparkles size={10} className="mr-1" /> Mapped & Filled
                        </Badge>
                      </div>

                      {/* Fake Form Content (Lever/Greenhouse Style) */}
                      <div className="p-6 md:p-8 space-y-6 max-w-2xl mx-auto">
                        <div className="border-b border-white/5 pb-4 mb-6">
                          <h2 className="text-xl font-bold font-[font2] text-white">Apply for this Position</h2>
                          <p className="text-xs text-gray-500 mt-1">
                            Review how the Form Mapping Engine fills the required elements on external application boards.
                          </p>
                        </div>

                        {/* Standard/Detected Fields rendering */}
                        <div className="space-y-5">
                          {/* Resume Upload Area */}
                          <div className="space-y-2 relative border border-dashed border-white/10 rounded-xl p-4 bg-gray-900/20 flex flex-col items-center">
                            <div className="absolute top-3 right-3 text-emerald-400 flex items-center gap-1 text-[10px]">
                              <Sparkles size={10} /> Auto-Attached
                            </div>
                            <FileText size={24} className="text-indigo-400 mb-1" />
                            <span className="text-xs font-semibold text-white">
                              {application.candidateProfileSnapshot.name.replace(/\s+/g, '_')}_Resume.pdf
                            </span>
                            <span className="text-[10px] text-gray-500">
                              Attached from system files ({application.candidateProfileSnapshot.resumeUrl ? 'Cloud Storage' : 'Linked'})
                            </span>
                          </div>

                          {/* Full Name */}
                          <div className="space-y-1 relative">
                            <div className="absolute top-9 right-3 text-emerald-400 flex items-center gap-1 text-[9px] select-none pointer-events-none">
                              <Sparkles size={10} /> Mapped
                            </div>
                            <label className="block text-xs text-gray-300 font-semibold">
                              Full Name <span className="text-red-400">*</span>
                            </label>
                            <input
                              type="text"
                              readOnly
                              value={getMappedValue('name')}
                              className="w-full p-3 bg-gray-900/40 rounded-xl border border-white/5 text-xs text-gray-300 focus:outline-none cursor-default font-medium"
                            />
                          </div>

                          {/* Email & Phone grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1 relative">
                              <div className="absolute top-9 right-3 text-emerald-400 flex items-center gap-1 text-[9px] select-none pointer-events-none">
                                <Sparkles size={10} /> Mapped
                              </div>
                              <label className="block text-xs text-gray-300 font-semibold">
                                Email Address <span className="text-red-400">*</span>
                              </label>
                              <input
                                type="text"
                                readOnly
                                value={getMappedValue('email')}
                                className="w-full p-3 bg-gray-900/40 rounded-xl border border-white/5 text-xs text-gray-300 focus:outline-none cursor-default font-medium"
                              />
                            </div>
                            <div className="space-y-1 relative">
                              <div className="absolute top-9 right-3 text-emerald-400 flex items-center gap-1 text-[9px] select-none pointer-events-none">
                                <Sparkles size={10} /> Mapped
                              </div>
                              <label className="block text-xs text-gray-300 font-semibold">
                                Phone Number <span className="text-red-400">*</span>
                              </label>
                              <input
                                type="text"
                                readOnly
                                value={getMappedValue('phone')}
                                className="w-full p-3 bg-gray-900/40 rounded-xl border border-white/5 text-xs text-gray-300 focus:outline-none cursor-default font-medium"
                              />
                            </div>
                          </div>

                          {/* Social links */}
                          <div className="space-y-1 relative">
                            <div className="absolute top-9 right-3 text-emerald-400 flex items-center gap-1 text-[9px] select-none pointer-events-none">
                              <Sparkles size={10} /> Mapped
                            </div>
                            <label className="block text-xs text-gray-300 font-semibold">LinkedIn Profile URL</label>
                            <input
                              type="text"
                              readOnly
                              value={getMappedValue('linkedin')}
                              className="w-full p-3 bg-gray-900/40 rounded-xl border border-white/5 text-xs text-gray-300 focus:outline-none cursor-default font-medium"
                            />
                          </div>

                          <div className="space-y-1 relative">
                            <div className="absolute top-9 right-3 text-emerald-400 flex items-center gap-1 text-[9px] select-none pointer-events-none">
                              <Sparkles size={10} /> Mapped
                            </div>
                            <label className="block text-xs text-gray-300 font-semibold">GitHub Profile URL</label>
                            <input
                              type="text"
                              readOnly
                              value={getMappedValue('github')}
                              className="w-full p-3 bg-gray-900/40 rounded-xl border border-white/5 text-xs text-gray-300 focus:outline-none cursor-default font-medium"
                            />
                          </div>

                          {/* Custom Generated Answers */}
                          {application.answers.map((item, index) => (
                            <div key={index} className="space-y-1 relative">
                              <div className="absolute top-9 right-3 text-emerald-400 flex items-center gap-1 text-[9px] select-none pointer-events-none">
                                <Sparkles size={10} /> AI Generated
                              </div>
                              <label className="block text-xs text-gray-300 font-semibold">
                                {item.question}
                              </label>
                              <textarea
                                readOnly
                                rows={3}
                                value={item.answer}
                                className="w-full p-3 bg-gray-900/40 rounded-xl border border-white/5 text-xs text-gray-300 focus:outline-none cursor-default leading-relaxed"
                              />
                            </div>
                          ))}
                        </div>

                        {/* Submit Button Placeholder */}
                        <div className="pt-6 border-t border-white/5 mt-8 flex justify-center">
                          <Button
                            disabled
                            className="bg-indigo-600/35 border border-indigo-500/25 text-white/50 text-xs px-8 cursor-not-allowed font-[font2]"
                          >
                            Submit Application (Mock Mode Only)
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-20 text-center bg-white/5 rounded-2xl text-gray-500">
                      No active application mock setup. Select a job recommendation.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: RECRUITER AI REVIEW */}
              {!generatingApp && !loadingApp && activeTab === 'recruiter' && (
                <div className="space-y-6">
                  {application ? (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                      {/* Left Block: Match Analytics (5 Cols) */}
                      <Card className="md:col-span-5 bg-white/5 border-white/5 flex flex-col justify-between">
                        <CardHeader className="pb-3 border-b border-white/5">
                          <CardTitle className="text-md font-bold font-[font2] text-white">Recruiter Alignment</CardTitle>
                          <CardDescription className="text-xs text-gray-400">
                            Groq AI estimation of overall profile alignment.
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="py-8 space-y-6 flex-1 flex flex-col justify-center">
                          {/* Round Score display */}
                          <div className="text-center">
                            <span className="text-[10px] text-gray-500 font-medium block uppercase tracking-wider mb-1">
                              Predicted Match Score
                            </span>
                            <div className="inline-flex items-center justify-center p-1 rounded-full bg-violet-950/20 border border-violet-500/20 w-28 h-28">
                              <span className="text-3xl font-extrabold text-white font-[font2]">
                                {application.recruiterReview.matchScore}%
                              </span>
                            </div>
                          </div>

                          {/* Probability Indicator */}
                          <div className="text-center">
                            <span className="text-[10px] text-gray-500 font-medium block uppercase tracking-wider mb-2">
                              Interview Probability
                            </span>
                            <Badge className={`px-4 py-1.5 text-xs font-bold font-[font2] border select-none ${
                              application.recruiterReview.interviewProbability === 'High' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                              application.recruiterReview.interviewProbability === 'Medium' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40' :
                              'bg-red-500/20 text-red-300 border-red-500/40'
                            }`}>
                              {application.recruiterReview.interviewProbability} Probability
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Right Block: Feedback Analysis (7 Cols) */}
                      <div className="md:col-span-7 space-y-6">
                        {/* Predicted Reaction */}
                        <Card className="bg-white/5 border-white/5">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-xs text-gray-400 uppercase font-bold tracking-wider">
                              Predicted Recruiter Reaction
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-xs text-gray-200 leading-relaxed">
                              {application.recruiterReview.predictedReaction}
                            </p>
                          </CardContent>
                        </Card>

                        {/* Strengths & Red Flags */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Key Strengths */}
                          <Card className="bg-white/5 border-white/5">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider flex items-center gap-1">
                                <CheckCircle size={10} /> Key Strengths
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                              <ul className="space-y-1.5 text-[10px] text-gray-300">
                                {application.recruiterReview.keyStrengths.map((str, idx) => (
                                  <li key={idx} className="flex items-start gap-1.5">
                                    <span className="text-emerald-400 font-bold">•</span>
                                    <span>{str}</span>
                                  </li>
                                ))}
                                {application.recruiterReview.keyStrengths.length === 0 && (
                                  <li className="text-gray-500 italic">No key strengths highlighted.</li>
                                )}
                              </ul>
                            </CardContent>
                          </Card>

                          {/* Red Flags */}
                          <Card className="bg-white/5 border-white/5">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-[10px] text-yellow-400 uppercase font-bold tracking-wider flex items-center gap-1">
                                <ShieldAlert size={10} /> Red Flags / Skill Gaps
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                              <ul className="space-y-1.5 text-[10px] text-gray-300">
                                {application.recruiterReview.potentialRedFlags.map((flag, idx) => (
                                  <li key={idx} className="flex items-start gap-1.5">
                                    <span className="text-yellow-400 font-bold">•</span>
                                    <span>{flag}</span>
                                  </li>
                                ))}
                                {application.recruiterReview.potentialRedFlags.length === 0 && (
                                  <li className="text-gray-500 italic">No red flags flagged.</li>
                                )}
                              </ul>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-20 text-center bg-white/5 rounded-2xl text-gray-500">
                      Select a job listing to prepare recruiter review predictions.
                    </div>
                  )}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
