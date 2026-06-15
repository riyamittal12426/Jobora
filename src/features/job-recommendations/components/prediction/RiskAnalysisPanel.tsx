import { AlertTriangle, AlertCircle, Info, Ban } from 'lucide-react';
import type { RiskFactor } from '@/types/prediction';

interface RiskAnalysisPanelProps {
  risks: RiskFactor[];
}

export function RiskAnalysisPanel({ risks }: RiskAnalysisPanelProps) {
  const getSeverityStyles = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high':
        return {
          border: 'border-red-500/30',
          bg: 'bg-red-950/10',
          icon: AlertCircle,
          iconColor: 'text-red-400',
          badge: 'bg-red-500/10 text-red-400 border-red-500/20',
        };
      case 'medium':
        return {
          border: 'border-amber-500/30',
          bg: 'bg-amber-950/10',
          icon: AlertTriangle,
          iconColor: 'text-amber-400',
          badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        };
      default:
        return {
          border: 'border-blue-500/30',
          bg: 'bg-blue-950/10',
          icon: Info,
          iconColor: 'text-blue-400',
          badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        };
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="rounded-lg p-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <AlertTriangle size={16} />
        </div>
        <div>
          <h3 className="text-base font-bold text-gray-200 font-[font2]">Hiring Risk Analysis</h3>
          <p className="text-xs text-gray-500">Elements identified that could negatively affect interview screening</p>
        </div>
      </div>

      <div className="grid gap-3.5">
        {risks.map((risk, index) => {
          const styles = getSeverityStyles(risk.severity);
          const Icon = styles.icon;

          return (
            <div
              key={index}
              className={`flex items-start gap-4 rounded-xl border p-4.5 backdrop-blur-sm shadow-sm transition-all hover:translate-x-1 ${styles.border} ${styles.bg}`}
            >
              <div className={`mt-0.5 rounded-lg p-2 bg-gray-950/50 border border-gray-800 shrink-0`}>
                <Icon size={18} className={styles.iconColor} />
              </div>
              
              <div className="flex-1 space-y-1 min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-white leading-tight">
                    {risk.factor}
                  </h4>
                  <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${styles.badge}`}>
                    {risk.severity} Risk
                  </span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  {risk.description}
                </p>
              </div>
            </div>
          );
        })}

        {risks.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-gray-800 bg-gray-900/10 py-10 text-center">
            <div className="rounded-full p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 mb-3">
              <Ban size={24} />
            </div>
            <h4 className="text-sm font-bold text-gray-300">No Risk Factors Detected</h4>
            <p className="text-xs text-gray-500 mt-1 max-w-xs px-4">
              Your profile currently matches the core requirements and keywords for this role exceptionally well!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
