import React from 'react';
import { motion } from 'framer-motion';
import { Target, CheckCircle2, AlertCircle, Award, Sparkles, TrendingUp, Lock } from 'lucide-react';
import type { CareerRoadmap } from '../../../services/roadmapApi';

interface DashboardSectionProps {
  roadmap: CareerRoadmap;
}

export default function DashboardSection({ roadmap }: DashboardSectionProps) {
  const progress = roadmap.currentProgress || 0;
  
  // Calculate completed / total tasks
  const plans = roadmap.plans || {};
  let totalTasks = 0;
  let completedCount = roadmap.completedTasks?.length || 0;
  
  ['immediate', 'shortTerm', 'midTerm', 'longTerm'].forEach(phase => {
    if (plans[phase] && Array.isArray(plans[phase].tasks)) {
      totalTasks += plans[phase].tasks.length;
    }
  });

  return (
    <div className="space-y-8">
      {/* Top Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Card 1: Dynamic Progress Ring */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-between relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
            <Award size={100} className="text-violet-400" />
          </div>
          <h3 className="text-lg font-bold font-[font2] text-violet-300 w-full text-left flex items-center gap-2 mb-4">
            <Award size={18} /> Career Progress
          </h3>
          <div className="relative w-36 h-36 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="72" cy="72" r="62" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-800/80" />
              <motion.circle 
                cx="72" cy="72" r="62" stroke="currentColor" strokeWidth="8" fill="transparent" 
                strokeDasharray="389.5"
                initial={{ strokeDashoffset: 389.5 }}
                animate={{ strokeDashoffset: 389.5 - (389.5 * progress) / 100 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="text-violet-500" 
                strokeLinecap="round" 
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-3xl font-extrabold font-[font2] text-white">{progress}%</span>
              <span className="text-xs text-gray-400 mt-0.5">Completed</span>
            </div>
          </div>
          <div className="mt-4 text-center">
            <p className="text-sm font-semibold text-gray-200">
              {completedCount} of {totalTasks} Tasks Completed
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {progress >= 100 ? "Ready to dominate interview portals!" : "Keep learning to unlock new achievements"}
            </p>
          </div>
        </motion.div>

        {/* Card 2: Current vs Target Skills Matrix */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 lg:col-span-2 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
            <Target size={120} className="text-indigo-400" />
          </div>
          <h3 className="text-lg font-bold font-[font2] text-indigo-300 flex items-center gap-2 mb-4">
            <Target size={18} /> Skill Alignment Matrix
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3 flex items-center gap-1.5">
                <CheckCircle2 size={12} /> Mastered & Certified
              </p>
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-1">
                {roadmap.currentSkills && roadmap.currentSkills.length > 0 ? (
                  roadmap.currentSkills.map((skill, idx) => (
                    <span key={idx} className="px-2.5 py-1 bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 rounded-lg text-xs font-medium capitalize">
                      {skill}
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-gray-500 italic">No skills listed yet.</p>
                )}
              </div>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-yellow-400 mb-3 flex items-center gap-1.5">
                <AlertCircle size={12} /> Required Skill Gaps
              </p>
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-1">
                {roadmap.missingSkills && roadmap.missingSkills.length > 0 ? (
                  roadmap.missingSkills.map((skill, idx) => (
                    <span key={idx} className="px-2.5 py-1 bg-yellow-950/20 border border-yellow-800/30 text-yellow-300 rounded-lg text-xs font-medium capitalize">
                      {skill}
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-emerald-400 italic">Roadmap complete! No gaps left.</p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-gray-400">
            <p>Target Role Alignment: <strong className="text-indigo-300 capitalize">{roadmap.targetRole}</strong></p>
            <p>Estimated Gap Size: <strong className="text-yellow-400">{roadmap.missingSkills?.length || 0} Skills</strong></p>
          </div>
        </motion.div>
      </div>

      {/* Middle Grid: Milestones & Demand Heatmaps */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Milestones (3/5 layout) */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 lg:col-span-3"
        >
          <h3 className="text-lg font-bold font-[font2] text-violet-300 flex items-center gap-2 mb-6">
            <Sparkles size={18} /> Roadmap Milestones
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {roadmap.milestones?.map((milestone, idx) => {
              const isUnlocked = milestone.unlocked;
              return (
                <div 
                  key={idx} 
                  className={`p-4 rounded-xl border transition-all duration-300 flex items-start gap-3 relative overflow-hidden ${
                    isUnlocked 
                      ? "bg-gradient-to-br from-violet-950/30 to-indigo-950/10 border-violet-500/40 shadow-lg shadow-violet-950/20" 
                      : "bg-gray-900/40 border-gray-800/80 opacity-60"
                  }`}
                >
                  <div className={`p-2 rounded-lg ${isUnlocked ? 'bg-violet-600/20 text-violet-400' : 'bg-gray-800 text-gray-500'}`}>
                    <Award size={18} />
                  </div>
                  <div>
                    <h4 className={`text-sm font-bold font-[font2] ${isUnlocked ? 'text-white' : 'text-gray-400'}`}>{milestone.name}</h4>
                    <p className="text-xs text-gray-400 mt-0.5">Unlocks at {milestone.targetPercentage}% progress</p>
                    {isUnlocked && milestone.earnedAt && (
                      <p className="text-[10px] text-violet-400 mt-2">
                        Earned {new Date(milestone.earnedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  {!isUnlocked && (
                    <div className="absolute top-2 right-2 text-gray-600">
                      <Lock size={12} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Skill Demand Trends (2/5 layout) */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 lg:col-span-2 relative overflow-hidden"
        >
          <h3 className="text-lg font-bold font-[font2] text-indigo-300 flex items-center gap-2 mb-4">
            <TrendingUp size={18} /> Skill Gap Market Demand
          </h3>
          <p className="text-xs text-gray-400 mb-4">
            These high-priority missing skills have the highest impact on your employability.
          </p>
          <div className="space-y-4">
            {roadmap.aiImpactSimulation?.impacts?.slice(0, 4).map((item, idx) => {
              // Calculate a simulated growth bar
              const baseScore = roadmap.aiImpactSimulation?.currentMetrics?.matchScore || 70;
              const increase = item.newMatchScore - baseScore;
              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-gray-200 capitalize">{item.skill}</span>
                    <span className="text-indigo-400 font-medium">+{increase}% Match Increase</span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, Math.max(10, increase * 5))}%` }}
                      transition={{ duration: 1.2, delay: idx * 0.15 }}
                      className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                    />
                  </div>
                </div>
              );
            }) || (
              <p className="text-xs text-gray-500 italic">No simulator data available.</p>
            )}
          </div>
        </motion.div>

      </div>
    </div>
  );
}
