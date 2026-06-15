import { Calendar, Target, CheckCircle, Clock } from 'lucide-react';
import type { ActionPlan } from '@/types/prediction';

interface ActionPlanTimelineProps {
  actionPlan: ActionPlan;
}

export function ActionPlanTimeline({ actionPlan }: ActionPlanTimelineProps) {
  const sections = [
    {
      title: 'Immediate Actions',
      timeline: '1 Week',
      icon: Clock,
      color: 'border-rose-500/20 bg-rose-950/5 text-rose-300 icon-rose-400',
      items: actionPlan.immediate || [],
    },
    {
      title: 'Short-Term Actions',
      timeline: '30 Days',
      icon: Calendar,
      color: 'border-amber-500/20 bg-amber-950/5 text-amber-300 icon-amber-400',
      items: actionPlan.shortTerm || [],
    },
    {
      title: 'Long-Term Actions',
      timeline: '90 Days',
      icon: Target,
      color: 'border-emerald-500/20 bg-emerald-950/5 text-emerald-300 icon-emerald-400',
      items: actionPlan.longTerm || [],
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="rounded-lg p-1.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
          <Calendar size={16} />
        </div>
        <div>
          <h3 className="text-base font-bold text-gray-200 font-[font2]">Personalized Action Plan</h3>
          <p className="text-xs text-gray-500">Step-by-step upskilling roadmap designed to maximize hire probability</p>
        </div>
      </div>

      <div className="relative border-l border-gray-800 ml-4 pl-6 space-y-6 pt-2">
        {sections.map((sec, i) => {
          const Icon = sec.icon;
          return (
            <div key={i} className="relative">
              {/* Timeline dot */}
              <div className="absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#0a0a0a] border border-gray-700">
                <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
              </div>

              <div className={`rounded-xl border p-4 backdrop-blur-sm ${sec.color}`}>
                <div className="flex items-center justify-between gap-3 mb-2.5">
                  <h4 className="text-sm font-bold text-white leading-none">
                    {sec.title}
                  </h4>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    {sec.timeline}
                  </span>
                </div>

                <ul className="space-y-2">
                  {sec.items.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-gray-300">
                      <CheckCircle size={13} className="text-gray-500 mt-0.5 shrink-0" />
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                  {sec.items.length === 0 && (
                    <li className="text-xs text-gray-500 italic">No specific actions recommended for this period.</li>
                  )}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
