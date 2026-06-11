import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, AlertCircle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InterviewSkeleton } from '@/components/ui/skeleton';
import { SetupScreen } from './components/SetupScreen';
import { InterviewSession } from './components/InterviewSession';
import { ResultsDashboard } from './components/ResultsDashboard';
import { InterviewHistoryPanel } from './components/InterviewHistoryPanel';
import { interviewApi } from '@/services/interviewApi';
import type {
  FinalInterviewReport,
  InterviewHistoryItem,
  InterviewQuestion,
  InterviewSettings,
  ResumeAnalysisData,
} from '@/types/interview';

type Phase = 'loading' | 'no-resume' | 'setup' | 'generating' | 'interview' | 'finalizing' | 'results';

const defaultSettings: InterviewSettings = {
  questionCount: 10,
  difficulty: 'Medium',
  interviewType: 'Mixed',
  targetRole: 'Software Engineer',
};

export default function MockInterviewPage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>('loading');
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [resumeData, setResumeData] = useState<ResumeAnalysisData | null>(null);
  const [settings, setSettings] = useState<InterviewSettings>(defaultSettings);
  const [interviewId, setInterviewId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<InterviewQuestion | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [finalReport, setFinalReport] = useState<FinalInterviewReport | null>(null);
  const [history, setHistory] = useState<InterviewHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const loadHistory = useCallback(async (email: string) => {
    setHistoryLoading(true);
    try {
      const items = await interviewApi.getHistory(email);
      setHistory(items);
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) {
      navigate('/auth');
      return;
    }
    const user = JSON.parse(stored);
    setUserEmail(user.email);

    interviewApi
      .getResumeAnalysis(user.email)
      .then((data) => {
        setResumeData(data);
        setPhase('setup');
        loadHistory(user.email);
      })
      .catch(() => setPhase('no-resume'));
  }, [navigate, loadHistory]);

  const handleStart = async () => {
    setError(null);
    setPhase('generating');
    try {
      const session = await interviewApi.startInterview(userEmail, settings);
      setInterviewId(session.interviewId);
      setCurrentQuestion(session.question);
      setCurrentIndex(session.currentIndex);
      setTotalQuestions(session.totalQuestions);
      setPhase('interview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start interview');
      setPhase('setup');
    }
  };

  const handleSubmitAnswer = async (answer: string) => {
    if (!interviewId) return;
    setSubmitting(true);
    setError(null);
    try {
      const response = await interviewApi.submitAnswer(interviewId, answer);
      if (response.completed && response.finalReport) {
        setFinalReport(response.finalReport);
        setPhase('results');
        loadHistory(userEmail);
      } else if (response.question) {
        setCurrentQuestion(response.question);
        setCurrentIndex(response.currentIndex ?? currentIndex + 1);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit answer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = () => {
    setInterviewId(null);
    setCurrentQuestion(null);
    setCurrentIndex(0);
    setFinalReport(null);
    setError(null);
    setPhase('setup');
  };

  const handleViewHistory = async (id: string) => {
    try {
      const interview = await interviewApi.getInterview(id);
      if (interview.finalReport) {
        setFinalReport(interview.finalReport);
        setSettings(interview.settings);
        setPhase('results');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load interview');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            <ArrowLeft size={18} /> Dashboard
          </Button>
          <h1 className="text-lg font-bold font-[font2] text-indigo-200">AI Mock Interview</h1>
          <div className="w-24" />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-950/20 p-4 text-sm text-red-300"
          >
            <AlertCircle size={18} /> {error}
          </motion.div>
        )}

        {phase === 'loading' && <InterviewSkeleton />}

        {phase === 'no-resume' && (
          <div className="mx-auto max-w-lg py-20 text-center">
            <FileText size={48} className="mx-auto mb-4 text-indigo-400" />
            <h2 className="text-2xl font-bold font-[font2]">Analyze Your Resume First</h2>
            <p className="mt-3 text-gray-400">
              The mock interview generates personalized questions from your resume analysis. Complete resume analysis on the dashboard first.
            </p>
            <Button className="mt-8" onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
          </div>
        )}

        {(phase === 'setup' || phase === 'generating') && resumeData && (
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <SetupScreen
                resumeData={resumeData}
                settings={settings}
                onChange={setSettings}
                onStart={handleStart}
                loading={phase === 'generating'}
              />
              {phase === 'generating' && (
                <div className="mt-6 flex items-center justify-center gap-3 text-indigo-300">
                  <Loader2 className="animate-spin" size={20} />
                  Groq AI is crafting resume-specific questions...
                </div>
              )}
            </div>
            <InterviewHistoryPanel history={history} loading={historyLoading} onSelect={handleViewHistory} />
          </div>
        )}

        {phase === 'interview' && currentQuestion && (
          <InterviewSession
            question={currentQuestion}
            currentIndex={currentIndex}
            totalQuestions={totalQuestions}
            settings={settings}
            onSubmit={handleSubmitAnswer}
            submitting={submitting}
          />
        )}

        {phase === 'results' && finalReport && (
          <ResultsDashboard
            report={finalReport}
            settings={settings}
            onRetry={handleRetry}
            onBack={handleRetry}
          />
        )}
      </div>
    </div>
  );
}
