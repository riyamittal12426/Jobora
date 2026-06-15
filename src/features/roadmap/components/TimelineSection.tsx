import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lock, CheckCircle2, ChevronDown, ChevronUp, Clock, BarChart, 
  BookOpen, Video, Terminal, FileCode, CheckSquare, ShieldAlert,
  ArrowUpRight, ExternalLink, Loader2
} from 'lucide-react';
import type { CareerRoadmap, RoadmapTask } from '../../../services/roadmapApi';

interface TimelineSectionProps {
  roadmap: CareerRoadmap;
  onToggleTask: (taskId: string, completed: boolean) => Promise<void>;
  loadingTaskId: string | null;
}

type PhaseKey = 'immediate' | 'shortTerm' | 'midTerm' | 'longTerm';

export default function TimelineSection({ roadmap, onToggleTask, loadingTaskId }: TimelineSectionProps) {
  const [activeTab, setActiveTab] = useState<PhaseKey>('immediate');
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [resourceTab, setResourceTab] = useState<string>('docs');

  const progress = roadmap.currentProgress || 0;
  const plans = roadmap.roadmap?.plans || roadmap.plans || {};
  
  // Phase mapping details
  const phaseMetadata = {
    immediate: { title: 'Immediate Actions', duration: '7 Days', dbKey: 'immediate' as PhaseKey, locked: false },
    shortTerm: { title: 'Short-Term Goals', duration: '30 Days', dbKey: 'shortTerm' as PhaseKey, locked: false },
    midTerm: { title: 'Mid-Term Goals', duration: '60 Days', dbKey: 'midTerm' as PhaseKey, locked: progress < 50 },
    longTerm: { title: 'Long-Term Goals', duration: '90+ Days', dbKey: 'longTerm' as PhaseKey, locked: progress < 50 },
  };

  const selectedPhase = phaseMetadata[activeTab];
  const phaseData = plans[selectedPhase.dbKey];
  const tasks: RoadmapTask[] = phaseData?.tasks || [];

  const handleToggleClick = async (e: React.MouseEvent, taskId: string, currentlyCompleted: boolean) => {
    e.stopPropagation(); // Avoid expanding the task accordion when checking the box
    await onToggleTask(taskId, !currentlyCompleted);
  };

  const getDifficultyBadge = (difficulty?: string) => {
    const diff = (difficulty || 'Beginner').toLowerCase();
    if (diff === 'advanced') return 'bg-red-950/40 text-red-400 border border-red-500/20';
    if (diff === 'intermediate') return 'bg-yellow-950/40 text-yellow-400 border border-yellow-500/20';
    return 'bg-blue-950/40 text-blue-400 border border-blue-500/20';
  };

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="flex gap-2 p-1.5 bg-gray-950 border border-white/5 rounded-xl overflow-x-auto scrollbar-hide">
        {(Object.keys(phaseMetadata) as PhaseKey[]).map((tabKey) => {
          const meta = phaseMetadata[tabKey];
          const isActive = activeTab === tabKey;
          return (
            <button
              key={tabKey}
              onClick={() => setActiveTab(tabKey)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                isActive 
                  ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {meta.locked && <Lock size={12} className="text-gray-500" />}
              <span>{meta.title}</span>
              <span className="text-xs opacity-60">({meta.duration})</span>
            </button>
          );
        })}
      </div>

      {/* Main Panel Content */}
      <div className="relative min-h-[350px] bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden p-6">
        
        {/* Lock Overlay screen if current progress < 50% for stage 3 or 4 */}
        {selectedPhase.locked ? (
          <div className="absolute inset-0 z-30 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center animate-fadeIn">
            <div className="w-16 h-16 bg-gray-900 border border-gray-700/60 rounded-full flex items-center justify-center text-yellow-500/90 shadow-xl mb-4">
              <Lock size={28} className="animate-pulse" />
            </div>
            <h3 className="text-2xl font-bold font-[font2] text-white">Stage Lock Enforced</h3>
            <p className="text-sm text-gray-400 max-w-md mt-2 leading-relaxed">
              This phase of the learning path is currently locked. Complete at least <strong className="text-yellow-400">50% of your initial roadmap</strong> to unlock the {selectedPhase.title} ({selectedPhase.duration}) milestone.
            </p>
            <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl flex items-center gap-3 text-left max-w-sm">
              <ShieldAlert className="text-yellow-500 shrink-0" size={18} />
              <div className="text-xs text-yellow-300">
                Current Learning Progress: <strong className="text-white">{progress}%</strong>
              </div>
            </div>
          </div>
        ) : null}

        {/* Task Accordion List */}
        {tasks.length === 0 ? (
          <div className="py-12 text-center text-gray-500 font-medium italic">
            No actions defined for this phase of the roadmap.
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => {
              const isCompleted = roadmap.completedTasks?.includes(task.id);
              const isExpanded = expandedTask === task.id;
              const isPending = loadingTaskId === task.id;

              return (
                <div 
                  key={task.id} 
                  className={`border border-white/5 rounded-xl transition-all duration-300 ${
                    isCompleted 
                      ? 'bg-emerald-950/5 border-emerald-500/10' 
                      : isExpanded ? 'bg-white/5 border-white/10 shadow-lg' : 'bg-gray-900/30 hover:bg-white/5'
                  }`}
                >
                  {/* Task Accordion Header */}
                  <div 
                    onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                    className="flex items-center justify-between p-4 cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      {/* Interactive checkbox */}
                      <button
                        onClick={(e) => handleToggleClick(e, task.id, isCompleted)}
                        disabled={isPending}
                        className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 transition-all ${
                          isCompleted 
                            ? 'bg-emerald-600 border-emerald-500 text-white' 
                            : 'border-gray-700 hover:border-violet-500 text-transparent'
                        }`}
                      >
                        {isPending ? (
                          <Loader2 size={12} className="animate-spin text-white" />
                        ) : isCompleted ? (
                          <CheckCircle2 size={14} className="stroke-[3px]" />
                        ) : (
                          <CheckSquare size={14} />
                        )}
                      </button>

                      <div className="min-w-0 flex-1">
                        <span className={`block font-bold text-sm sm:text-base font-[font2] truncate ${
                          isCompleted ? 'text-gray-400 line-through' : 'text-white'
                        }`}>
                          {task.title}
                        </span>
                        {task.skill && (
                          <span className="inline-block px-2 py-0.5 mt-1 text-[10px] uppercase font-bold text-indigo-400 bg-indigo-500/10 rounded border border-indigo-500/25">
                            {task.skill}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {task.difficulty && (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getDifficultyBadge(task.difficulty)}`}>
                          {task.difficulty}
                        </span>
                      )}
                      {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                    </div>
                  </div>

                  {/* Task Accordion Details Panel */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-t border-white/5"
                      >
                        <div className="p-5 space-y-6">
                          {/* Task Description */}
                          <p className="text-sm text-gray-300 leading-relaxed font-[font1]">
                            {task.description}
                          </p>

                          {/* Action Stats Band */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-gray-950 border border-white/5 rounded-xl text-center">
                            <div>
                              <span className="block text-[10px] uppercase font-bold text-gray-500">Duration</span>
                              <span className="text-sm font-semibold text-gray-200 flex items-center justify-center gap-1 mt-0.5"><Clock size={12}/> {task.estimatedTime || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="block text-[10px] uppercase font-bold text-gray-500">Match Increase</span>
                              <span className="text-sm font-semibold text-emerald-400 mt-0.5">+{task.matchScoreImprovement || 0}%</span>
                            </div>
                            <div>
                              <span className="block text-[10px] uppercase font-bold text-gray-500">Interview Ready</span>
                              <span className="text-sm font-semibold text-violet-400 mt-0.5">+{task.interviewReadinessImprovement || 0} pts</span>
                            </div>
                            <div>
                              <span className="block text-[10px] uppercase font-bold text-gray-500">Salary Impact</span>
                              <span className="text-sm font-semibold text-indigo-400 mt-0.5">{task.salaryImpact || 'N/A'}</span>
                            </div>
                          </div>

                          {/* Learning Objectives */}
                          {task.learningObjectives && task.learningObjectives.length > 0 && (
                            <div>
                              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2.5">Key Learning Objectives</h4>
                              <ul className="space-y-2">
                                {task.learningObjectives.map((obj, i) => (
                                  <li key={i} className="flex gap-2.5 text-xs text-gray-300 items-start leading-relaxed">
                                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-1.5 shrink-0" />
                                    <span>{obj}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Learning Resources Recommendation Engine Dashboard */}
                          {task.resources && (
                            <div className="pt-4 border-t border-white/5 space-y-4">
                              <div className="flex flex-wrap gap-1 border-b border-white/5 pb-2">
                                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 mr-3 mt-1.5">Resource Center:</span>
                                {[
                                  { id: 'docs', label: 'Docs', icon: BookOpen, list: task.resources.officialDocumentation },
                                  { id: 'courses', label: 'Courses', icon: Video, list: task.resources.freeCourses },
                                  { id: 'youtube', label: 'YouTube', icon: Video, list: task.resources.youtubeTutorials },
                                  { id: 'labs', label: 'Labs', icon: Terminal, list: task.resources.practiceLabs },
                                  { id: 'projects', label: 'Projects', icon: FileCode, list: task.resources.projects },
                                  { id: 'certs', label: 'Certs', icon: BookOpen, list: task.resources.certifications },
                                  { id: 'interview', label: 'Interview', icon: BookOpen, list: task.resources.interviewPrep }
                                ].map((cat) => {
                                  const count = cat.list?.length || 0;
                                  return (
                                    <button
                                      key={cat.id}
                                      onClick={() => setResourceTab(cat.id)}
                                      className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${
                                        resourceTab === cat.id 
                                          ? 'bg-indigo-600/25 text-indigo-300 border border-indigo-500/30' 
                                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                                      }`}
                                    >
                                      {cat.label} ({count})
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Resource links listing */}
                              <div className="min-h-[60px]">
                                {(() => {
                                  let currentList = [];
                                  if (resourceTab === 'docs') currentList = task.resources.officialDocumentation;
                                  else if (resourceTab === 'courses') currentList = task.resources.freeCourses;
                                  else if (resourceTab === 'youtube') currentList = task.resources.youtubeTutorials;
                                  else if (resourceTab === 'labs') currentList = task.resources.practiceLabs;
                                  else if (resourceTab === 'projects') currentList = task.resources.projects;
                                  else if (resourceTab === 'certs') currentList = task.resources.certifications;
                                  else if (resourceTab === 'interview') currentList = task.resources.interviewPrep;

                                  if (!currentList || currentList.length === 0) {
                                    return <p className="text-xs text-gray-500 italic">No custom resources located for this category.</p>;
                                  }

                                  return (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      {currentList.map((link, lidx) => (
                                        <a 
                                          key={lidx}
                                          href={link.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="p-3.5 bg-gray-950/60 border border-white/5 rounded-xl flex flex-col justify-between hover:border-indigo-500/40 hover:bg-gray-950 transition-all group"
                                        >
                                          <div className="min-w-0">
                                            <span className="text-xs font-bold text-indigo-300 group-hover:text-indigo-200 transition-colors flex items-center gap-1 truncate capitalize">
                                              {link.title} <ArrowUpRight size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </span>
                                            {link.snippet && (
                                              <p className="text-[11px] text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                                                {link.snippet}
                                              </p>
                                            )}
                                          </div>
                                          <span className="text-[9px] text-gray-500 mt-2.5 truncate font-mono select-all flex items-center gap-1">
                                            <ExternalLink size={8} /> {link.url}
                                          </span>
                                        </a>
                                      ))}
                                    </div>
                                  );
                                })()}
                              </div>

                            </div>
                          )}

                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
