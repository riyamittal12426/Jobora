import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Target, Award, Sparkles, TrendingUp, Check } from 'lucide-react';
import type { CareerRoadmap } from '../../../services/roadmapApi';

interface SimulatorSectionProps {
  roadmap: CareerRoadmap;
}

export default function SimulatorSection({ roadmap }: SimulatorSectionProps) {
  const simulation = roadmap.aiImpactSimulation || {};
  const current = simulation.currentMetrics || {
    matchScore: 65,
    interviewProbability: 40,
    offerProbability: 20,
    applicationSuccessScore: 45
  };
  
  const impacts = simulation.impacts || [];
  
  // State for checked skills in simulator
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev => 
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  // Compute simulated scores
  const baseMatch = current.matchScore;
  const baseInterview = current.interviewProbability;
  const baseOffer = current.offerProbability;
  const baseSuccess = current.applicationSuccessScore;

  let simulatedMatch = baseMatch;
  let simulatedInterview = baseInterview;
  let simulatedOffer = baseOffer;
  let simulatedSuccess = baseSuccess;

  // For each selected skill, sum the delta improvements
  selectedSkills.forEach(skillName => {
    const impact = impacts.find(imp => imp.skill.toLowerCase() === skillName.toLowerCase());
    if (impact) {
      const deltaMatch = Math.max(0, impact.newMatchScore - baseMatch);
      const deltaInterview = Math.max(0, impact.newInterviewProbability - baseInterview);
      const deltaOffer = Math.max(0, impact.newOfferProbability - baseOffer);
      const deltaSuccess = Math.max(0, impact.newApplicationSuccessScore - baseSuccess);

      simulatedMatch += deltaMatch;
      simulatedInterview += deltaInterview;
      simulatedOffer += deltaOffer;
      simulatedSuccess += deltaSuccess;
    }
  });

  // Cap scores at 99% for realism
  simulatedMatch = Math.min(99, simulatedMatch);
  simulatedInterview = Math.min(99, simulatedInterview);
  simulatedOffer = Math.min(99, simulatedOffer);
  simulatedSuccess = Math.min(99, simulatedSuccess);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      {/* Left Column: Interactive Checkbox List */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 lg:col-span-1 space-y-6">
        <div>
          <h3 className="text-lg font-bold font-[font2] text-violet-300 flex items-center gap-2">
            <ShieldCheck size={18} /> Impact Simulator
          </h3>
          <p className="text-xs text-gray-400 mt-2 leading-relaxed font-[font1]">
            Select skills or certifications you are planning to master. Watch how they directly simulate improvements on your recruiter match scores and hire rates.
          </p>
        </div>

        {impacts.length === 0 ? (
          <p className="text-xs text-gray-500 italic">No missing skills or simulator targets available.</p>
        ) : (
          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
            {impacts.map((imp, idx) => {
              const isChecked = selectedSkills.includes(imp.skill);
              return (
                <div 
                  key={idx}
                  onClick={() => toggleSkill(imp.skill)}
                  className={`p-3.5 rounded-xl border cursor-pointer select-none transition-all flex items-center justify-between ${
                    isChecked 
                      ? 'bg-violet-600/15 border-violet-500/40 text-white' 
                      : 'bg-gray-900/30 border-white/5 text-gray-400 hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                      isChecked ? 'bg-violet-600 border-violet-500 text-white' : 'border-gray-700'
                    }`}>
                      {isChecked && (
                        <Check size={10} strokeWidth={4} />
                      )}
                    </div>
                    <span className="text-xs font-semibold capitalize truncate max-w-[140px] font-[font1]">{imp.skill}</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400">
                    +{Math.max(0, imp.newMatchScore - baseMatch)}% Match
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {selectedSkills.length > 0 && (
          <button 
            onClick={() => setSelectedSkills([])}
            className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold rounded-lg text-gray-300 transition-all font-[font2]"
          >
            Reset Simulation
          </button>
        )}
      </div>

      {/* Right Column: Visual Dashboard Results */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 lg:col-span-2 space-y-6">
        <h3 className="text-lg font-bold font-[font2] text-indigo-300 flex items-center gap-2">
          <TrendingUp size={18} /> Simulated Outcomes
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          
          {/* Match Score */}
          <div className="p-4 bg-gray-950 border border-white/5 rounded-xl space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-400 font-[font1] flex items-center gap-1.5"><Target size={12}/> Match Score</span>
              <div className="flex items-center gap-1.5 font-bold font-[font2]">
                <span className="text-gray-500 line-through">{baseMatch}%</span>
                <span className="text-emerald-400 text-base">{simulatedMatch}%</span>
              </div>
            </div>
            <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-gray-600 rounded-full" style={{ width: `${baseMatch}%` }} />
              {simulatedMatch > baseMatch && (
                <motion.div 
                  className="h-full bg-emerald-500 rounded-full -mt-2"
                  initial={{ width: 0 }}
                  animate={{ width: `${simulatedMatch}%` }}
                  transition={{ duration: 0.8 }}
                />
              )}
            </div>
          </div>

          {/* Interview Probability */}
          <div className="p-4 bg-gray-950 border border-white/5 rounded-xl space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-400 font-[font1] flex items-center gap-1.5"><Sparkles size={12}/> Interview Probability</span>
              <div className="flex items-center gap-1.5 font-bold font-[font2]">
                <span className="text-gray-500 line-through">{baseInterview}%</span>
                <span className="text-violet-400 text-base">{simulatedInterview}%</span>
              </div>
            </div>
            <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-gray-600 rounded-full" style={{ width: `${baseInterview}%` }} />
              {simulatedInterview > baseInterview && (
                <motion.div 
                  className="h-full bg-violet-500 rounded-full -mt-2"
                  initial={{ width: 0 }}
                  animate={{ width: `${simulatedInterview}%` }}
                  transition={{ duration: 0.8 }}
                />
              )}
            </div>
          </div>

          {/* Offer Probability */}
          <div className="p-4 bg-gray-950 border border-white/5 rounded-xl space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-400 font-[font1] flex items-center gap-1.5"><Award size={12}/> Offer Probability</span>
              <div className="flex items-center gap-1.5 font-bold font-[font2]">
                <span className="text-gray-500 line-through">{baseOffer}%</span>
                <span className="text-indigo-400 text-base">{simulatedOffer}%</span>
              </div>
            </div>
            <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-gray-600 rounded-full" style={{ width: `${baseOffer}%` }} />
              {simulatedOffer > baseOffer && (
                <motion.div 
                  className="h-full bg-indigo-500 rounded-full -mt-2"
                  initial={{ width: 0 }}
                  animate={{ width: `${simulatedOffer}%` }}
                  transition={{ duration: 0.8 }}
                />
              )}
            </div>
          </div>

          {/* Application Success Score */}
          <div className="p-4 bg-gray-950 border border-white/5 rounded-xl space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-400 font-[font1] flex items-center gap-1.5"><ShieldCheck size={12}/> Success Predictor</span>
              <div className="flex items-center gap-1.5 font-bold font-[font2]">
                <span className="text-gray-500 line-through">{baseSuccess}%</span>
                <span className="text-fuchsia-400 text-base">{simulatedSuccess}%</span>
              </div>
            </div>
            <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-gray-600 rounded-full" style={{ width: `${baseSuccess}%` }} />
              {simulatedSuccess > baseSuccess && (
                <motion.div 
                  className="h-full bg-fuchsia-500 rounded-full -mt-2"
                  initial={{ width: 0 }}
                  animate={{ width: `${simulatedSuccess}%` }}
                  transition={{ duration: 0.8 }}
                />
              )}
            </div>
          </div>

        </div>

        {selectedSkills.length > 0 ? (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300 font-[font1] flex items-center gap-2">
            <Sparkles size={14} className="shrink-0" />
            <span>
              By mastering <strong>{selectedSkills.join(', ')}</strong>, you are projected to increase your application success prediction score by <strong>{simulatedSuccess - baseSuccess}%</strong> and align with target job roles!
            </span>
          </div>
        ) : (
          <div className="p-4 bg-white/5 border border-white/5 rounded-xl text-xs text-gray-400 font-[font1] italic text-center">
            No simulated options checked. Click skills in the panel to project score growth.
          </div>
        )}
      </div>

    </div>
  );
}
