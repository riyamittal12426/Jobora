import { motion } from 'framer-motion';
import { UserCheck, ShieldAlert, Sparkles, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface RecruiterSimulationCardProps {
  interestLevel: string;
  feedback: string;
  advantages: string[];
  disadvantages: string[];
  shortlistProbability: number;
}

export function RecruiterSimulationCard({
  interestLevel,
  feedback,
  advantages,
  disadvantages,
  shortlistProbability,
}: RecruiterSimulationCardProps) {
  const getInterestColor = (level: string) => {
    const l = level.toLowerCase();
    if (l.includes('exceptional') || l.includes('high') || l.includes('very')) return 'success';
    if (l.includes('medium') || l.includes('average')) return 'warning';
    return 'danger';
  };

  const isShortlisted = shortlistProbability >= 65;

  return (
    <Card className="border-gray-800 bg-[#121212]/90 shadow-xl relative overflow-hidden">
      {/* Visual background badge */}
      <div className="absolute -right-8 -bottom-8 opacity-5 text-gray-500 scale-150 pointer-events-none">
        <UserCheck size={180} />
      </div>

      <CardHeader className="pb-3 border-b border-gray-800/60">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg p-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <UserCheck size={18} />
            </div>
            <div>
              <CardTitle className="text-base text-gray-100">Recruiter Evaluation Simulation</CardTitle>
              <p className="text-xs text-gray-500">How a Senior Recruiter views your profile</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge variant={getInterestColor(interestLevel)}>
              Interest: {interestLevel}
            </Badge>
            <Badge variant={isShortlisted ? 'success' : 'warning'}>
              Verdict: {isShortlisted ? 'Likely Shortlisted' : 'Unlikely Shortlisted'}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-5 space-y-4">
        {/* Recruiter direct comments */}
        <div className="rounded-xl bg-gray-950/60 border border-gray-800 p-4 relative">
          <span className="absolute -top-2.5 left-4 px-2 bg-gray-900 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
            Recruiter's Screening Notes
          </span>
          <p className="text-sm text-gray-300 italic leading-relaxed pt-1">
            "{feedback}"
          </p>
        </div>

        {/* Breakdown of advantages and disadvantages */}
        <div className="grid gap-4 sm:grid-cols-2 pt-2">
          {/* Advantages */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={12} /> Key Resume Advantages
            </h4>
            <ul className="space-y-1.5">
              {advantages.map((adv, i) => (
                <motion.li
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  key={i}
                  className="flex items-start gap-2 text-xs text-gray-300"
                >
                  <Star size={12} className="text-emerald-400 mt-0.5 shrink-0" />
                  <span>{adv}</span>
                </motion.li>
              ))}
              {advantages.length === 0 && (
                <li className="text-xs text-gray-500 italic">No particular advantages highlighted.</li>
              )}
            </ul>
          </div>

          {/* Disadvantages */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert size={12} /> Screening Disadvantages
            </h4>
            <ul className="space-y-1.5">
              {disadvantages.map((dis, i) => (
                <motion.li
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  key={i}
                  className="flex items-start gap-2 text-xs text-gray-300"
                >
                  <ShieldAlert size={12} className="text-rose-400 mt-0.5 shrink-0" />
                  <span>{dis}</span>
                </motion.li>
              ))}
              {disadvantages.length === 0 && (
                <li className="text-xs text-gray-500 italic">No screen disadvantages highlighted.</li>
              )}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
