import React from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Coins, ShieldAlert, Award, Compass } from 'lucide-react';
import type { CareerRoadmap } from '../../../services/roadmapApi';

interface CareerProjectionSectionProps {
  roadmap: CareerRoadmap;
}

export default function CareerProjectionSection({ roadmap }: CareerProjectionSectionProps) {
  const projection = roadmap.careerProjection || {};
  const possibleRoles = projection.possibleJobRoles || [];
  const salaryRanges = projection.salaryRanges || [];
  const opportunities = projection.careerOpportunities || '';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      
      {/* Left Column: Possible job roles and salaries */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }} 
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-6"
      >
        <div>
          <h3 className="text-lg font-bold font-[font2] text-violet-300 flex items-center gap-2">
            <Briefcase size={18} /> Projected Career Trajectories
          </h3>
          <p className="text-xs text-gray-400 mt-2 font-[font1] leading-relaxed">
            Completing this roadmap unlocks the qualifications required for these specific roles in high-demand markets.
          </p>
        </div>

        {/* Roles listing */}
        <div className="space-y-3">
          {possibleRoles.map((role, idx) => (
            <div key={idx} className="p-4 bg-gray-950 border border-white/5 rounded-xl flex items-center justify-between">
              <span className="text-sm font-bold text-white capitalize font-[font2]">{role}</span>
              <span className="px-2.5 py-1 bg-violet-600/10 border border-violet-500/20 text-violet-400 rounded-lg text-xs font-semibold uppercase">
                Aligned Role
              </span>
            </div>
          ))}
          {possibleRoles.length === 0 && (
            <p className="text-xs text-gray-500 italic">No role projections available.</p>
          )}
        </div>

        {/* Salary Potential band */}
        {roadmap.salaryGrowthPotential && (
          <div className="p-4 bg-gradient-to-br from-indigo-950/30 to-violet-950/10 border border-indigo-500/20 rounded-xl flex items-center gap-4">
            <div className="p-3 bg-indigo-600/20 rounded-xl text-indigo-400">
              <Coins size={24} />
            </div>
            <div>
              <span className="block text-[10px] uppercase font-bold text-gray-400">Expected Salary Band</span>
              <span className="text-base font-extrabold text-white font-[font2]">{roadmap.salaryGrowthPotential}</span>
              <span className="block text-[10px] text-indigo-300 mt-0.5">Based on local market values</span>
            </div>
          </div>
        )}
      </motion.div>

      {/* Right Column: Market opportunities and career growth */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }} 
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-6"
      >
        <div>
          <h3 className="text-lg font-bold font-[font2] text-indigo-300 flex items-center gap-2">
            <Compass size={18} /> Market & Career Outlook
          </h3>
          <p className="text-xs text-gray-400 mt-2 font-[font1] leading-relaxed">
            Recruiter advice and industry statistics for candidates pursuing these pathways.
          </p>
        </div>

        {/* Opportunities narrative */}
        {opportunities && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Target Industry Growth</h4>
            <p className="text-xs text-gray-300 leading-relaxed font-[font1] bg-gray-950/40 p-4 border border-white/5 rounded-xl">
              {opportunities}
            </p>
          </div>
        )}

        {/* Growth potential comments */}
        {roadmap.expectedCareerGrowth && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Growth Recommendations</h4>
            <p className="text-xs text-gray-300 leading-relaxed font-[font1] bg-gray-950/40 p-4 border border-white/5 rounded-xl">
              {roadmap.expectedCareerGrowth}
            </p>
          </div>
        )}
      </motion.div>

    </div>
  );
}
