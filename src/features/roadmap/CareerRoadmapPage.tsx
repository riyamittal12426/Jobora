import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, RefreshCw, Compass, Sparkles, Loader2, Target, 
  Award, ShieldCheck, Activity, BrainCircuit, AlertTriangle 
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

import type { CareerRoadmap } from '../../services/roadmapApi';
import { roadmapApi } from '../../services/roadmapApi';

import DashboardSection from './components/DashboardSection';
import TimelineSection from './components/TimelineSection';
import SimulatorSection from './components/SimulatorSection';
import MentorSection from './components/MentorSection';
import CareerProjectionSection from './components/CareerProjectionSection';

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
      // Not a hard error, user just needs to select a role and generate one!
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
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 border-b border-gray-800 bg-gray-950/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard')} className="hover:bg-white/5 hover:text-white transition-all text-gray-300">
            <ArrowLeft size={18} /> Dashboard
          </Button>
          <div className="text-center">
            <h1 className="text-lg font-bold font-[font2] text-violet-300">AI Career Roadmap</h1>
            <p className="text-xs text-gray-500">Your Personal Career Advisor</p>
          </div>
          {roadmap && (
            <Button
              size="sm"
              onClick={() => handleGenerate()}
              disabled={generating}
              className="bg-violet-600 hover:bg-violet-500 text-white font-bold"
            >
              {generating ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              <span>{generating ? 'Re-generating...' : 'Re-generate'}</span>
            </Button>
          )}
          {!roadmap && <div className="w-[100px]" />} {/* Spacer matching width */}
        </div>

        {/* Navigation Tabs Bar */}
        {roadmap && !generating && (
          <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-6 pb-3 scrollbar-hide">
            {TABS.map((t) => {
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    isActive 
                      ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30 font-[font2]' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <t.icon size={14} /> {t.label}
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        
        {/* Dynamic Errors Container */}
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-950/20 p-4 text-sm text-red-300">
            <AlertTriangle size={18} className="shrink-0" />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto text-xs underline">Dismiss</button>
          </div>
        )}

        {/* Global Loading Spinner for Initial checks */}
        {loading && !generating && (
          <div className="py-24 text-center space-y-4">
            <Loader2 size={48} className="mx-auto animate-spin text-violet-400" />
            <p className="text-sm text-gray-500">Checking for existing career roadmaps...</p>
          </div>
        )}

        {/* Initial Setup/Selection State if no Roadmap is cached */}
        {!loading && !roadmap && !generating && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }} 
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto py-12 px-6 bg-white/5 border border-white/10 rounded-2xl p-8 shadow-xl text-center space-y-6"
          >
            <div className="w-16 h-16 mx-auto bg-violet-600/10 border border-violet-500/20 rounded-full flex items-center justify-center text-violet-400">
              <Compass size={32} />
            </div>
            
            <div>
              <h2 className="text-2xl font-bold font-[font2] text-white">Unlock Your AI Career Roadmap</h2>
              <p className="text-sm text-gray-400 max-w-md mx-auto mt-2 leading-relaxed">
                Choose your target career path. We'll analyze your resume against market indicators to generate a step-by-step path detailing free resources, practice labs, certifications, and mock interview preparations.
              </p>
            </div>

            {/* Target Role selection dropdown */}
            <div className="space-y-2 max-w-md mx-auto text-left">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">Target Role</label>
              <select 
                value={targetRole} 
                onChange={(e) => setTargetRole(e.target.value)}
                className="w-full p-3.5 bg-gray-950 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-violet-500/50 transition-all font-[font1]"
              >
                <option value="Software Engineer">Software Engineer</option>
                <option value="DevOps Engineer">DevOps Engineer</option>
                <option value="Cloud Engineer">Cloud Engineer</option>
                <option value="Data Analyst">Data Analyst</option>
                <option value="Product Manager">Product Manager</option>
                <option value="Security Specialist">Security Specialist</option>
              </select>
            </div>

            <Button 
              size="lg" 
              onClick={handleGenerate}
              className="bg-violet-600 hover:bg-violet-500 text-white font-bold py-6 px-10 rounded-xl transition-all shadow-lg shadow-violet-500/20 w-full max-w-md mx-auto font-[font2]"
            >
              <Sparkles size={18} className="mr-1.5" /> Generate Personalized Roadmap
            </Button>
            <p className="text-[10px] text-gray-500">Requires a completed resume analysis. Takes ~30 seconds.</p>
          </motion.div>
        )}

        {/* Roadmap Generation Processing Screen */}
        {generating && (
          <div className="py-24 text-center max-w-md mx-auto space-y-6">
            <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
              <div className="w-full h-full border-4 border-gray-800 rounded-full"></div>
              <div className="w-full h-full border-4 border-violet-500 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
              <div className="absolute">
                <Sparkles className="text-violet-400 animate-pulse" size={24} />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold font-[font2] text-violet-200">Coach is building your path</h3>
              <AnimatePresence mode="wait">
                <motion.p 
                  key={loadingMsgIdx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-xs text-violet-400 font-mono"
                >
                  {generationMessages[loadingMsgIdx]}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Main Dashboard views */}
        {roadmap && !generating && (
          <div className="space-y-8">
            
            {/* Dynamic Status Dashboard Card */}
            <div className="bg-gradient-to-r from-violet-950/30 to-indigo-950/20 border border-violet-500/20 p-5 rounded-2xl flex flex-wrap justify-between items-center gap-4">
              <div className="space-y-1">
                <h2 className="text-xl font-bold font-[font2] text-white">Targeting: {roadmap.targetRole}</h2>
                <div className="flex gap-3 text-xs text-violet-300">
                  <span>Level: <strong>{roadmap.experienceLevel || 'Mid'}</strong></span>
                  <span>•</span>
                  <span>Match Improvement: <strong>+{roadmap.expectedMatchScoreImprovement || 0}%</strong></span>
                </div>
              </div>
              
              {/* Top Mini-Progress indicator */}
              <div className="w-full sm:w-[280px] space-y-1.5 text-xs text-gray-400">
                <div className="flex justify-between font-semibold">
                  <span>Learning Progress</span>
                  <span className="text-violet-400">{progress}%</span>
                </div>
                <Progress value={progress} indicatorClassName="from-violet-500 to-indigo-500" />
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

      </main>
    </div>
  );
}
