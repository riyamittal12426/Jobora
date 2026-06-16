import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, UploadCloud, FileText, Sparkles, Loader2, 
  CheckCircle, AlertCircle, Target, BarChart, ChevronRight,
  AlertTriangle
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { API_BASE_URL } from '@/services/apiConfig';

const CircularScore = ({ score, label, colorClass, strokeColor }) => (
  <div className="flex flex-col items-center">
    <div className="relative w-24 h-24 flex items-center justify-center">
      <svg className="w-full h-full transform -rotate-90">
        <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-800" />
        <motion.circle 
          cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" 
          strokeDasharray="251.2"
          initial={{ strokeDashoffset: 251.2 }}
          animate={{ strokeDashoffset: 251.2 - (251.2 * score) / 100 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className={strokeColor} 
          strokeLinecap="round" 
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className={cn("text-2xl font-bold font-[font2]", colorClass)}>{score}</span>
      </div>
    </div>
    <span className="text-sm text-gray-400 mt-2 font-medium">{label}</span>
  </div>
);

const ResumeAnalysisModal = ({ isOpen, onClose, user, autoAnalyze = false }) => {
  const [step, setStep] = useState('idle'); // idle, loading, results
  const [file, setFile] = useState(null);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [analysisData, setAnalysisData] = useState(null);
  const [error, setError] = useState(null);

  const hasStoredResume = user?.resume && user.resume !== 'Uploaded' && user.resume.startsWith('http');

  const loadingMessages = [
    "Extracting resume text...",
    "Checking ATS compatibility...",
    "Analyzing technical skills...",
    "Generating recommendations..."
  ];

  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep('idle');
        setFile(null);
        setAnalysisData(null);
        setLoadingMsgIdx(0);
        setError(null);
      }, 300);
    }
  }, [isOpen]);

  const runAnalysis = async (resumeFile = file) => {
    setStep('loading');
    setError(null);
    
    const formData = new FormData();
    if (user?.email) {
      formData.append('userEmail', user.email);
    }
    if (resumeFile) {
      formData.append('resume', resumeFile);
    } else if (hasStoredResume) {
      formData.append('resumeUrl', user.resume);
    } else {
      setError('Please upload a resume to analyze.');
      setStep('idle');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/resume/analyze`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
      });
      const data = await res.json();
      
      if (res.ok) {
        setAnalysisData(data);
        setStep('results');
      } else {
        throw new Error(data.message || 'Failed analysis');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Analysis failed. Please try again.');
      setStep('idle');
    }
  };

  useEffect(() => {
    if (isOpen && autoAnalyze && hasStoredResume && !file && step === 'idle') {
      runAnalysis();
    }
  }, [isOpen, autoAnalyze, hasStoredResume]);

  useEffect(() => {
    let interval;
    if (step === 'loading') {
      interval = setInterval(() => {
        setLoadingMsgIdx(prev => (prev + 1 < loadingMessages.length ? prev + 1 : prev));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleAnalyze = () => runAnalysis();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={cn(
            "bg-[#111] border border-gray-800 rounded-2xl shadow-2xl overflow-hidden relative flex flex-col transition-all duration-500",
            step === 'results' ? "w-full max-w-5xl h-[90vh]" : "w-full max-w-lg"
          )}
        >
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-800 bg-gray-900/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/20 rounded-lg">
                <Sparkles className="text-indigo-400" size={20} />
              </div>
              <h2 className="text-xl font-bold font-[font2] text-white">AI Resume Analysis</h2>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg">
              <X size={20} />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
            
            {/* STEP 1: IDLE / UPLOAD */}
            {step === 'idle' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-medium text-gray-200">Upload your resume for AI review</h3>
                  <p className="text-sm text-gray-400">We support PDF, DOCX (Max 10MB)</p>
                </div>

                {hasStoredResume && !file && (
                  <div className="p-4 bg-indigo-900/10 border border-indigo-500/30 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="text-indigo-400" />
                      <div>
                        <p className="text-sm font-medium text-indigo-100">Resume on ImageKit</p>
                        <p className="text-xs text-indigo-300/70 truncate max-w-[240px]">{user.resume.split('/').pop()}</p>
                      </div>
                    </div>
                    <CheckCircle className="text-indigo-500" size={20} />
                  </div>
                )}

                {error && (
                  <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-xl text-sm text-red-300">
                    {error}
                  </div>
                )}

                <div className="relative border-2 border-dashed border-gray-700 hover:border-indigo-500 transition-colors bg-gray-900/30 rounded-xl p-8 flex flex-col items-center justify-center gap-4 group">
                  <input type="file" onChange={handleFileChange} accept=".pdf,.doc,.docx" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                  <div className="w-12 h-12 bg-gray-800 group-hover:bg-indigo-900/40 rounded-full flex items-center justify-center transition-colors">
                    <UploadCloud className="text-gray-400 group-hover:text-indigo-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-300">
                      {file ? file.name : "Click or drag file to upload"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Replace existing resume temporarily</p>
                  </div>
                </div>

                <button 
                  onClick={handleAnalyze} 
                  disabled={!file && !hasStoredResume}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:text-gray-400 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/20"
                >
                  <Sparkles size={18} />
                  {hasStoredResume && !file ? 'Analyze Saved Resume' : 'Start Analysis'}
                </button>
              </motion.div>
            )}

            {/* STEP 2: LOADING */}
            {step === 'loading' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-12 space-y-6 min-h-[300px]">
                <div className="relative">
                  <div className="w-20 h-20 border-4 border-gray-800 rounded-full"></div>
                  <div className="w-20 h-20 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="text-indigo-400" size={24} />
                  </div>
                </div>
                <div className="text-center space-y-2 h-16">
                  <h3 className="text-lg font-medium text-indigo-100">AI is working its magic</h3>
                  <AnimatePresence mode="wait">
                    <motion.p 
                      key={loadingMsgIdx}
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                      className="text-sm text-indigo-300/70"
                    >
                      {loadingMessages[loadingMsgIdx]}
                    </motion.p>
                  </AnimatePresence>
                </div>
              </motion.div>
            )}

            {/* STEP 3: RESULTS (PREMIUM CSS DASHBOARD) */}
            {step === 'results' && analysisData && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col gap-6">
                
                {/* Summary Banner */}
                <div className="p-5 bg-gradient-to-r from-indigo-900/40 to-blue-900/20 border border-indigo-500/30 rounded-xl flex items-start gap-4">
                  <div className="p-3 bg-indigo-500/20 rounded-lg shrink-0">
                    <Target className="text-indigo-400" size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1 font-[font2]">Recruiter Impression</h3>
                    <p className="text-indigo-200/80 leading-relaxed text-sm">{analysisData.recruiterImpression}</p>
                    <p className="text-sm mt-3 text-indigo-100"><strong>Summary:</strong> {analysisData.resumeSummary}</p>
                  </div>
                </div>

                {/* Parsed Resume Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800 text-center">
                    <p className="text-2xl font-bold text-indigo-400">{analysisData.wordCount ?? '—'}</p>
                    <p className="text-xs text-gray-400 mt-1">Words Parsed</p>
                  </div>
                  <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800 text-center">
                    <p className="text-2xl font-bold text-green-400">{analysisData.foundSkills?.length ?? 0}</p>
                    <p className="text-xs text-gray-400 mt-1">Skills Detected</p>
                  </div>
                  <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800 text-center">
                    <p className="text-2xl font-bold text-blue-400">{analysisData.metricsCount ?? 0}</p>
                    <p className="text-xs text-gray-400 mt-1">Impact Metrics</p>
                  </div>
                  <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800 text-center">
                    <p className="text-2xl font-bold text-purple-400">{analysisData.interviewReadiness ?? '—'}</p>
                    <p className="text-xs text-gray-400 mt-1">Interview Ready</p>
                  </div>
                </div>

                {analysisData.foundSkills?.length > 0 && (
                  <div className="bg-gray-900/30 p-5 rounded-xl border border-gray-800">
                    <h4 className="flex items-center gap-2 font-bold text-indigo-400 mb-4"><Target size={18}/> Skills Found in Your Resume</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysisData.foundSkills.map((skill, i) => (
                        <span key={i} className="px-3 py-1.5 bg-indigo-900/30 border border-indigo-700/50 text-indigo-200 rounded-lg text-xs font-medium capitalize">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Score Indicators */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-900/50 p-6 rounded-xl border border-gray-800 flex justify-center">
                    <CircularScore score={analysisData.overallScore} label="Overall Score" colorClass="text-indigo-400" strokeColor="text-indigo-500" />
                  </div>
                  <div className="bg-gray-900/50 p-6 rounded-xl border border-gray-800 flex justify-center">
                     <CircularScore score={analysisData.atsScore} label="ATS Match" colorClass="text-green-400" strokeColor="text-green-500" />
                  </div>
                  <div className="bg-gray-900/50 p-6 rounded-xl border border-gray-800 flex justify-center">
                     <CircularScore score={analysisData.technicalScore} label="Technical" colorClass="text-blue-400" strokeColor="text-blue-500" />
                  </div>
                  <div className="bg-gray-900/50 p-6 rounded-xl border border-gray-800 flex justify-center">
                     <CircularScore score={analysisData.experienceScore} label="Experience" colorClass="text-purple-400" strokeColor="text-purple-500" />
                  </div>
                </div>

                {/* Main Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
                  {/* Left Col */}
                  <div className="space-y-6">
                    <div className="bg-gray-900/30 p-5 rounded-xl border border-gray-800">
                      <h4 className="flex items-center gap-2 font-bold text-green-400 mb-4"><CheckCircle size={18}/> Strengths</h4>
                      <ul className="space-y-3">
                        {analysisData.strengths?.length > 0 ? analysisData.strengths.map((s, i) => (
                          <li key={i} className="flex gap-3 text-sm text-gray-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 shrink-0"/> {s}
                          </li>
                        )) : (
                          <li className="text-sm text-gray-500">No major strengths detected yet — add technical keywords and metrics.</li>
                        )}
                      </ul>
                    </div>
                    <div className="bg-gray-900/30 p-5 rounded-xl border border-gray-800">
                      <h4 className="flex items-center gap-2 font-bold text-yellow-400 mb-4"><AlertCircle size={18}/> Missing Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {analysisData.missingSkills?.length > 0 ? analysisData.missingSkills.map((m, i) => (
                          <span key={i} className="px-3 py-1.5 bg-yellow-900/20 border border-yellow-700/50 text-yellow-300 rounded-lg text-xs font-medium capitalize">
                            {m}
                          </span>
                        )) : (
                          <span className="text-sm text-gray-500">All common technical keywords were found in your resume.</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Col */}
                  <div className="space-y-6">
                    <div className="bg-gray-900/30 p-5 rounded-xl border border-gray-800">
                      <h4 className="flex items-center gap-2 font-bold text-red-400 mb-4"><AlertTriangle size={18} className="lucide-icon" /> Weaknesses & ATS Issues</h4>
                      <ul className="space-y-3">
                        {[...(analysisData.weaknesses || []), ...(analysisData.atsIssues || [])].length > 0
                          ? [...(analysisData.weaknesses || []), ...(analysisData.atsIssues || [])].map((w, i) => (
                          <li key={i} className="flex gap-3 text-sm text-gray-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0"/> {w}
                          </li>
                        )) : (
                          <li className="text-sm text-gray-500">No structural ATS issues detected in your resume text.</li>
                        )}
                      </ul>
                    </div>

                    <div className="bg-gray-900/30 p-5 rounded-xl border border-gray-800">
                      <h4 className="flex items-center gap-2 font-bold text-blue-400 mb-4"><Sparkles size={18}/> AI Suggestions</h4>
                      <ul className="space-y-3">
                        {analysisData.suggestions?.length > 0 ? analysisData.suggestions.map((s, i) => (
                          <li key={i} className="flex gap-3 text-sm text-gray-300 bg-blue-900/10 p-3 rounded-lg border border-blue-900/30">
                           {s}
                          </li>
                        )) : (
                          <li className="text-sm text-gray-500">Your resume structure looks good — keep metrics and keywords up to date.</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Coming Soon Teaser */}
                <div className="mt-4 p-5 bg-gradient-to-r from-gray-900 to-gray-800 border border-gray-700 border-dashed rounded-xl flex items-center justify-between opacity-70 hover:opacity-100 transition-opacity">
                  <div className="flex items-center gap-3">
                    <BarChart className="text-gray-400" />
                    <div>
                      <h4 className="font-bold text-gray-200">Job Match Analysis</h4>
                      <p className="text-xs text-gray-500">Compare your resume directly against a job description</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 bg-gray-800 text-gray-400 rounded-full border border-gray-600">Coming Soon</span>
                </div>

              </motion.div>
            )}

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};



export default ResumeAnalysisModal;
