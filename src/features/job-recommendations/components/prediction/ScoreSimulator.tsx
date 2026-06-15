import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, CheckSquare, Square, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ScoreSimulatorProps {
  currentScore: number;
  missingSkills: string[];
  onSimulate: (modifications: { type: string; value: string | number }[]) => Promise<any>;
}

interface ModificationOption {
  id: string;
  label: string;
  impact: number;
  type: 'addSkill' | 'improveAts' | 'addCert' | 'addProject';
  value: string | number;
}

export function ScoreSimulator({
  currentScore,
  missingSkills,
  onSimulate,
}: ScoreSimulatorProps) {
  const [selectedMods, setSelectedMods] = useState<string[]>([]);
  const [liveScore, setLiveScore] = useState<number | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate options based on missing skills and generic improvements
  const baseOptions: ModificationOption[] = [
    ...missingSkills.map((skill, idx) => ({
      id: `skill-${idx}`,
      label: `Learn and add: ${skill}`,
      impact: Math.min(10, Math.floor(Math.random() * 5) + 6), // 6-10% increase
      type: 'addSkill' as const,
      value: skill,
    })),
    {
      id: 'improve-ats',
      label: 'Optimize Resume ATS layout & headers',
      impact: 5,
      type: 'improveAts' as const,
      value: 5,
    },
    {
      id: 'add-certification',
      label: 'Add a professional Cloud/Stack Certification',
      impact: 7,
      type: 'addCert' as const,
      value: 6,
    },
    {
      id: 'add-project',
      label: 'Add project showing deployment & architecture metrics',
      impact: 8,
      type: 'addProject' as const,
      value: 8,
    },
  ];

  const handleToggle = (id: string) => {
    setSelectedMods((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
    // Clear live score when options change to remind them to validate or just show immediate heuristic
    setLiveScore(null);
  };

  // Immediate heuristic score calculation (adds options up to max 98%)
  const calculateHeuristicScore = () => {
    const selectedOptions = baseOptions.filter((opt) => selectedMods.includes(opt.id));
    const totalImpact = selectedOptions.reduce((acc, opt) => acc + opt.impact, 0);
    return Math.min(98, currentScore + totalImpact);
  };

  const heuristicScore = calculateHeuristicScore();

  const handleRunLiveSimulation = async () => {
    setSimulating(true);
    setError(null);
    try {
      const selectedOptions = baseOptions.filter((opt) => selectedMods.includes(opt.id));
      const modsToSend = selectedOptions.map((opt) => ({
        type: opt.type,
        value: opt.value,
      }));

      if (modsToSend.length === 0) {
        setLiveScore(currentScore);
        setSimulating(false);
        return;
      }

      const result = await onSimulate(modsToSend);
      if (result && result.applicationSuccessScore !== undefined) {
        setLiveScore(result.applicationSuccessScore);
      } else {
        throw new Error('Invalid simulation result structure from API');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to query Groq for live simulation. Showing estimates.');
    } finally {
      setSimulating(false);
    }
  };

  const activeScore = liveScore !== null ? liveScore : heuristicScore;
  const isDiff = activeScore !== currentScore;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <div className="rounded-lg p-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <Sparkles size={16} />
        </div>
        <div>
          <h3 className="text-base font-bold text-gray-200 font-[font2]">Success Score Simulator</h3>
          <p className="text-xs text-gray-500">Add hypothetical modifications to view your projected chances increase</p>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-5 items-stretch">
        {/* Left Options panel */}
        <div className="sm:col-span-3 space-y-2 border border-gray-800 bg-[#121212]/40 rounded-xl p-4">
          <h4 className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2.5">
            Select Improvements
          </h4>

          <div className="space-y-2">
            {baseOptions.map((opt) => {
              const isChecked = selectedMods.includes(opt.id);
              return (
                <button
                  key={opt.id}
                  onClick={() => handleToggle(opt.id)}
                  className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors ${
                    isChecked
                      ? 'border-indigo-500/30 bg-indigo-950/10 text-white'
                      : 'border-gray-800 bg-gray-900/10 text-gray-400 hover:border-gray-700 hover:text-white'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {isChecked ? (
                      <CheckSquare size={15} className="text-indigo-400" />
                    ) : (
                      <Square size={15} className="text-gray-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold leading-tight">{opt.label}</p>
                    <span className="text-[9px] font-bold text-emerald-400 mt-1 block">
                      Projected Impact: +{opt.impact}%
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Output Panel */}
        <div className="sm:col-span-2 flex flex-col items-center justify-center border border-gray-800 bg-[#121212]/60 rounded-xl p-6 text-center space-y-4">
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
            Simulated Success Rate
          </span>

          <div className="flex items-center justify-center gap-3">
            {/* Original Score */}
            <div className="flex flex-col items-center">
              <span className="text-xs text-gray-500">Original</span>
              <span className="text-2xl font-bold text-gray-400">{currentScore}%</span>
            </div>

            {/* Arrow */}
            <span className="text-lg font-bold text-gray-600">→</span>

            {/* Simulated Score */}
            <div className="flex flex-col items-center">
              <span className="text-xs text-indigo-400 font-bold">Simulated</span>
              <AnimatePresence mode="wait">
                <motion.span
                  key={activeScore}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className={`text-4xl font-black font-[font2] tracking-tight ${
                    isDiff ? 'text-emerald-400' : 'text-gray-300'
                  }`}
                >
                  {activeScore}%
                </motion.span>
              </AnimatePresence>
            </div>
          </div>

          <div className="w-full space-y-2">
            <Button
              size="sm"
              className="w-full bg-indigo-600 hover:bg-indigo-500 font-bold text-white text-xs gap-1.5"
              onClick={handleRunLiveSimulation}
              disabled={simulating || selectedMods.length === 0}
            >
              {simulating ? (
                <>
                  <RefreshCw size={12} className="animate-spin" /> Validating...
                </>
              ) : (
                <>
                  <Sparkles size={12} /> Run Groq AI Validation
                </>
              )}
            </Button>
            
            {liveScore === null && selectedMods.length > 0 && (
              <p className="text-[10px] text-gray-500 italic">
                *Currently showing heuristic estimates. Click validation to verify with Groq AI.
              </p>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-1.5 text-[10px] text-amber-400">
              <AlertCircle size={10} /> <span>{error}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
