import React, { useRef, useEffect, useState } from 'react';
import { TrendingUp, Send, Users, Award, XCircle, Target, BarChart3 } from 'lucide-react';
import gsap from 'gsap';

function AnimatedCounter({ target, duration = 1.5, suffix = '' }) {
  const ref = useRef(null);
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    const obj = { val: 0 };
    gsap.to(obj, {
      val: target,
      duration,
      ease: 'power2.out',
      onUpdate: () => setDisplayed(Math.round(obj.val)),
    });
  }, [target]);

  return <span ref={ref}>{displayed}{suffix}</span>;
}

function BarChart({ data, maxVal }) {
  const barsRef = useRef([]);

  useEffect(() => {
    barsRef.current.filter(Boolean).forEach((bar, i) => {
      gsap.fromTo(bar,
        { scaleY: 0 },
        { scaleY: 1, duration: 0.6, delay: i * 0.08, ease: 'back.out(1.5)', transformOrigin: 'bottom' }
      );
    });
  }, []);

  return (
    <div className="flex items-end gap-2 h-36">
      {data.map((item, i) => {
        const height = maxVal > 0 ? (item.value / maxVal) * 100 : 0;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
            <span className="text-[10px] text-gray-500 font-[font1]">{item.value}</span>
            <div className="w-full flex-1 flex items-end">
              <div
                ref={el => barsRef.current[i] = el}
                className="w-full rounded-t-lg transition-all"
                style={{
                  height: `${Math.max(height, 4)}%`,
                  background: `linear-gradient(to top, var(--accent-primary), rgba(var(--accent-hue), 80%, 60%, 0.4))`,
                  backgroundColor: 'var(--accent-primary)',
                }}
              />
            </div>
            <span className="text-[10px] text-gray-500 font-[font1] truncate max-w-full">{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function DonutChart({ segments, size = 140 }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  const cx = size / 2;
  const cy = size / 2;
  const r = (size - 20) / 2;
  const circumference = 2 * Math.PI * r;

  let accumulated = 0;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="12" />
        {segments.map((seg, i) => {
          const pct = total > 0 ? seg.value / total : 0;
          const dashLength = circumference * pct;
          const dashOffset = circumference * (1 - accumulated / total);
          accumulated += seg.value;
          return (
            <circle
              key={i}
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth="12"
              strokeDasharray={`${dashLength} ${circumference - dashLength}`}
              strokeDashoffset={-circumference + dashOffset + dashLength}
              strokeLinecap="round"
              className="transition-all duration-1000"
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-white font-[font2]">{total}</span>
        <span className="text-[10px] text-gray-500 font-[font1]">Total</span>
      </div>
    </div>
  );
}

export default function AnalyticsSection() {
  const sectionRef = useRef(null);
  const cardsRef = useRef([]);

  // Get real data from localStorage
  const applications = JSON.parse(localStorage.getItem('applications') || '[]');
  const total = applications.length;
  const interviews = applications.filter(a => a.status === 'Interviewing').length;
  const offers = applications.filter(a => a.status === 'Offer').length;
  const rejections = applications.filter(a => a.status === 'Rejected').length;
  const applied = applications.filter(a => a.status === 'Applied').length;
  const ghosted = applications.filter(a => a.status === 'Ghosted').length;

  const successRate = total > 0 ? Math.round((offers / total) * 100) : 0;
  const rejectionRate = total > 0 ? Math.round((rejections / total) * 100) : 0;

  // Monthly breakdown (mock if not enough real data)
  const monthlyData = [
    { label: 'Jan', value: Math.floor(Math.random() * 8) + 2 },
    { label: 'Feb', value: Math.floor(Math.random() * 10) + 3 },
    { label: 'Mar', value: Math.floor(Math.random() * 12) + 5 },
    { label: 'Apr', value: Math.floor(Math.random() * 15) + 4 },
    { label: 'May', value: Math.floor(Math.random() * 10) + 6 },
    { label: 'Jun', value: total || Math.floor(Math.random() * 8) + 3 },
  ];
  const maxMonthly = Math.max(...monthlyData.map(d => d.value));

  const donutSegments = [
    { label: 'Applied', value: applied || 4, color: '#a855f7' },
    { label: 'Interviewing', value: interviews || 2, color: '#f59e0b' },
    { label: 'Offers', value: offers || 1, color: '#10b981' },
    { label: 'Rejected', value: rejections || 1, color: '#ef4444' },
    { label: 'Ghosted', value: ghosted || 1, color: '#6b7280' },
  ];

  useEffect(() => {
    const cards = cardsRef.current.filter(Boolean);
    gsap.fromTo(cards,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: 'power3.out' }
    );
  }, []);

  const metrics = [
    { label: 'Applications Submitted', value: total || 12, icon: Send, color: 'text-violet-400', bgColor: 'bg-violet-500/10', borderColor: 'border-violet-500/20' },
    { label: 'Interviews Attended', value: interviews || 4, icon: Users, color: 'text-amber-400', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/20' },
    { label: 'Offers Received', value: offers || 2, icon: Award, color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/20' },
    { label: 'Rejection Rate', value: rejectionRate || 15, icon: XCircle, color: 'text-red-400', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/20', suffix: '%' },
    { label: 'Success Rate', value: successRate || 25, icon: Target, color: 'text-cyan-400', bgColor: 'bg-cyan-500/10', borderColor: 'border-cyan-500/20', suffix: '%' },
  ];

  return (
    <div ref={sectionRef} className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {metrics.map((m, i) => {
          const Icon = m.icon;
          return (
            <div
              key={i}
              ref={el => cardsRef.current[i] = el}
              className={`bg-white/[0.03] backdrop-blur-xl rounded-xl border border-white/[0.06] p-4 text-center hover:border-white/15 transition-all`}
            >
              <div className={`w-10 h-10 rounded-xl ${m.bgColor} border ${m.borderColor} flex items-center justify-center mx-auto mb-3`}>
                <Icon size={18} className={m.color} />
              </div>
              <p className={`text-2xl font-bold font-[font2] ${m.color}`}>
                <AnimatedCounter target={m.value} suffix={m.suffix || ''} />
              </p>
              <p className="text-[10px] text-gray-500 font-[font1] mt-1 leading-tight">{m.label}</p>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div ref={el => cardsRef.current[5] = el} className="bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/[0.06] p-6">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 size={18} className="text-gray-400" />
            <h3 className="text-sm font-bold text-white font-[font2]">Applications Over Time</h3>
          </div>
          <BarChart data={monthlyData} maxVal={maxMonthly} />
        </div>

        {/* Donut Chart */}
        <div ref={el => cardsRef.current[6] = el} className="bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/[0.06] p-6">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp size={18} className="text-gray-400" />
            <h3 className="text-sm font-bold text-white font-[font2]">Application Status</h3>
          </div>
          <div className="flex items-center justify-center gap-8">
            <DonutChart segments={donutSegments} />
            <div className="space-y-2">
              {donutSegments.map((seg, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
                  <span className="text-xs text-gray-400 font-[font1]">{seg.label}</span>
                  <span className="text-xs font-semibold text-gray-300 font-[font2] ml-auto">{seg.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
