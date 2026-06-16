import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RefreshCw, Compass, Sparkles, Loader2, Target, 
  ShieldCheck, Activity, BrainCircuit, AlertTriangle 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { roadmapApi } from '../../services/roadmapApi';
import type { CareerRoadmap } from '../../services/roadmapApi';
import DashboardSection from './components/DashboardSection';
import TimelineSection from './components/TimelineSection';
import SimulatorSection from './components/SimulatorSection';
import MentorSection from './components/MentorSection';
import CareerProjectionSection from './components/CareerProjectionSection';
import DashboardLayout from '@/components/UserDashboard/DashboardLayout';

type SubTab = 'dashboard' | 'timeline' | 'simulator' | 'mentor' | 'projection';

const TABS: { id: SubTab; label: string; icon: any }[] = [
  { id: 'dashboard', label: 'Progress Hub', icon: Activity },
  { id: 'timeline', label: 'Timeline Goals', icon: Target },
  { id: 'simulator', label: 'AI Simulator', icon: ShieldCheck },
  { id: 'mentor', label: 'Coach Mentor', icon: BrainCircuit },
  { id: 'projection', label: 'Career Outlook', icon: Compass }
];

export default function CareerRoadmapPage() {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState<string>('');
  const [roadmap, setRoadmap] = useState<CareerRoadmap | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [generating, setGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Creation States
  const [targetRole, setTargetRole] = useState<string>('Software Engineer');
  const [activeTab, setActiveTab] = useState<SubTab>('dashboard');
  
  // Loading animations index
  const [loadingMsgIdx, setLoadingMsgIdx] = useState<number>(0);
  const [loadingTaskId, setLoadingTaskId] = useState<string | null>(null);

  const generationMessages = [
    "Analyzing your current resume skills...",
    "Inspecting missing skill gaps against market demand...",
    "Querying Tavily search engine for official documentation...",
    "Fetching free courses & practice labs references...",
    "Building your interactive AI Match simulator...",
    "Invoking Coach Groq to write study plans..."
  ];

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) {
      navigate('/auth');
      return;
    }
    const email = JSON.parse(stored).email;
    setUserEmail(email);
    fetchRoadmap(email);
  }, [navigate]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (generating) {
      interval = setInterval(() => {
        setLoadingMsgIdx(prev => (prev + 1 < generationMessages.length ? prev + 1 : prev));
      }, 3500);
    }
    return () => clearInterval(interval);
  }, [generating]);

  const fetchRoadmap = async (email: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await roadmapApi.getRoadmap(email);
      setRoadmap(data);
    } catch (err: any) {
      console.log('No existing roadmap found:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!userEmail) return;
    setGenerating(true);
    setError(null);
    setLoadingMsgIdx(0);
    try {
      const data = await roadmapApi.generateRoadmap(userEmail, targetRole);
      setRoadmap(data);
      setActiveTab('dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to generate career roadmap. Please ensure Resume Analysis is completed.');
    } finally {
      setGenerating(false);
    }
  };

  const handleToggleTask = async (taskId: string, completed: boolean) => {
    if (!userEmail) return;
    setLoadingTaskId(taskId);
    try {
      let updated: CareerRoadmap;
      if (completed) {
        updated = await roadmapApi.completeTask(userEmail, taskId);
      } else {
        updated = await roadmapApi.uncompleteTask(userEmail, taskId);
      }
      setRoadmap(updated);
    } catch (err: any) {
      console.error('Task toggling failed:', err);
    } finally {
      setLoadingTaskId(null);
    }
  };

  const progress = roadmap?.currentProgress || 0;

  return (
    <DashboardLayout
      currentPage="roadmap"
      pageTitle="AI Career Roadmap"
      pageSubtitle="Bridge skill gaps with customized study plans, mock simulators, and AI mentoring."
    >
      <div className="w-full flex flex-col gap-6">
        
        {/* Navigation Tabs Bar inside Dashboard panel */}
        {roadmap && !generating && (
          <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-white/5">
            {TABS.map((t) => {
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-2 whitespace-nowrap rounded-2xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-[#7c3aed] text-white shadow-md font-extrabold' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5 border border-white/10'
                  }`}
                >
                  <t.icon size={13} /> {t.label}
                </button>
              );
            })}
            
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="ml-auto flex items-center gap-1.5 px-4 py-2.5 bg-[#7c3aed] hover:bg-[#6d28d9] disabled:bg-[#7c3aed]/30 text-white rounded-2xl text-xs font-bold cursor-pointer transition-all active:scale-95 shadow-lg"
            >
              {generating ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
              <span>{generating ? 'Re-generating...' : 'Re-generate'}</span>
            </button>
          </div>
        )}

        {/* Dynamic Errors Container */}
        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-950/20 p-4 text-sm text-red-300">
            <AlertTriangle size={18} className="shrink-0" />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto text-xs underline cursor-pointer">Dismiss</button>
          </div>
        )}

        {/* Global Loading Spinner */}
        {loading && !generating && (
          <div className="py-20 text-center space-y-4 bg-[#181926]/60 border border-white/10 p-8 rounded-[32px] max-w-xl mx-auto backdrop-blur-md">
            <Loader2 size={40} className="mx-auto animate-spin text-purple-400" />
            <p className="text-xs font-semibold text-gray-400">Checking for existing career roadmaps...</p>
          </div>
        )}

        {/* Initial Setup/Selection State */}
        {!loading && !roadmap && !generating && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }} 
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-xl mx-auto py-12 px-8 bg-[#181926]/60 border border-white/10 rounded-[32px] shadow-xl text-center space-y-6 backdrop-blur-md"
          >
            <div className="w-16 h-16 mx-auto bg-purple-600/15 border border-purple-500/20 rounded-full flex items-center justify-center text-purple-400 shadow-md">
              <Compass size={32} />
            </div>
            
            <div>
              <h2 className="text-2xl font-bold font-[font2] text-white">Unlock Your AI Career Roadmap</h2>
              <p className="text-xs text-gray-400 max-w-md mx-auto mt-2 leading-relaxed font-semibold">
                Choose your target career path. We'll analyze your resume against market indicators to generate a step-by-step path detailing free resources, practice labs, certifications, and mock interview preparations.
              </p>
            </div>

            <div className="space-y-2 max-w-md mx-auto text-left">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Target Role</label>
              <select 
                value={targetRole} 
                onChange={(e) => setTargetRole(e.target.value)}
                className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#7c3aed]"
              >
                <option className="bg-[#13141f]" value="Software Engineer">Software Engineer</option>
                <option className="bg-[#13141f]" value="DevOps Engineer">DevOps Engineer</option>
                <option className="bg-[#13141f]" value="Cloud Engineer">Cloud Engineer</option>
                <option className="bg-[#13141f]" value="Data Analyst">Data Analyst</option>
                <option className="bg-[#13141f]" value="Product Manager">Product Manager</option>
                <option className="bg-[#13141f]" value="Security Specialist">Security Specialist</option>
              </select>
            </div>

            <Button 
              size="lg" 
              onClick={handleGenerate}
              className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-extrabold py-3.5 px-8 rounded-2xl transition-all shadow-lg hover:scale-105 border border-[#7c3aed]/20"
            >
              <Sparkles size={18} className="mr-1.5" /> Generate Personalized Roadmap
            </Button>
            <p className="text-[10px] text-gray-500 font-bold">Requires a completed resume analysis. Takes ~30 seconds.</p>
          </motion.div>
        )}

        {/* Roadmap Generation Processing Screen */}
        {generating && (
          <div className="py-20 text-center max-w-xl mx-auto space-y-6 bg-[#181926]/60 border border-white/10 p-8 rounded-[32px] backdrop-blur-md">
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <div className="w-full h-full border-4 border-white/10 rounded-full"></div>
              <div className="w-full h-full border-4 border-purple-500 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
              <div className="absolute">
                <Sparkles className="text-purple-400 animate-pulse" size={24} />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold font-[font2] text-white">AI Coach is building your path</h3>
              <AnimatePresence mode="wait">
                <motion.p 
                  key={loadingMsgIdx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-[11px] text-purple-400 font-mono font-semibold"
                >
                  {generationMessages[loadingMsgIdx]}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Main Dashboard views */}
        {roadmap && !generating && (
          <div className="space-y-6">
            
            {/* Dynamic Status Dashboard Card */}
            <div className="bg-gradient-to-r from-purple-950/20 to-indigo-950/10 border border-white/10 p-5 rounded-3xl flex flex-wrap justify-between items-center gap-4 shadow-md">
              <div className="space-y-1">
                <h2 className="text-xl font-bold font-[font2] text-white">Targeting: {roadmap.targetRole}</h2>
                <div className="flex gap-3 text-xs text-purple-300 font-semibold">
                  <span>Level: <strong>{roadmap.experienceLevel || 'Mid'}</strong></span>
                  <span>•</span>
                  <span>Match Improvement: <strong>+{roadmap.expectedMatchScoreImprovement || 0}%</strong></span>
                </div>
              </div>
              
              {/* Progress */}
              <div className="w-full sm:w-[280px] space-y-1.5 text-xs text-gray-400">
                <div className="flex justify-between font-bold">
                  <span>Learning Progress</span>
                  <span className="text-[#a855f7]">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2 border border-white/5" indicatorClassName="bg-purple-600" />
              </div>
            </div>

            {/* Tab section display switch */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.15 }}
                className="w-full"
              >
                {activeTab === 'dashboard' && <DashboardSection roadmap={roadmap} />}
                {activeTab === 'timeline' && (
                  <TimelineSection 
                    roadmap={roadmap} 
                    onToggleTask={handleToggleTask} 
                    loadingTaskId={loadingTaskId} 
                  />
                )}
                {activeTab === 'simulator' && <SimulatorSection roadmap={roadmap} />}
                {activeTab === 'mentor' && <MentorSection roadmap={roadmap} />}
                {activeTab === 'projection' && <CareerProjectionSection roadmap={roadmap} />}
              </motion.div>
            </AnimatePresence>

          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
