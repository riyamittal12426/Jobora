import { Info, HelpCircle } from 'lucide-react';

interface WhyThisScoreProps {
  explanation: string;
}

export function WhyThisScore({ explanation }: WhyThisScoreProps) {
  return (
    <div className="rounded-xl border border-indigo-500/20 bg-indigo-950/15 p-4.5 shadow-md relative overflow-hidden">
      <div className="flex items-start gap-3.5">
        <div className="mt-0.5 rounded-lg p-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shrink-0">
          <HelpCircle size={18} />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-indigo-200 font-[font2]">
            Why this Success Score?
          </h4>
          <p className="text-xs text-indigo-100/85 leading-relaxed">
            {explanation}
          </p>
        </div>
      </div>
    </div>
  );
}
