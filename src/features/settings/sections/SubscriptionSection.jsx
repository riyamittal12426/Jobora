import React, { useRef, useEffect, useState } from 'react';
import { Crown, Check, Sparkles, Zap, Star, ArrowUpRight, CreditCard, CalendarDays, Shield } from 'lucide-react';
import gsap from 'gsap';
import { useToast } from '../ToastProvider';
import ConfirmModal from '../ConfirmModal';
import { useAuth } from '@/contexts/AuthContext';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: '/forever',
    badge: 'bg-gray-500/20 text-gray-400 border-gray-500/20',
    gradient: 'from-gray-800/30 to-gray-900/20',
    borderHover: 'hover:border-gray-500/30',
    icon: Star,
    features: [
      'Resume Analysis (Limited)',
      '10 Job Matches Per Day',
      'Basic Profile',
      'Application Tracking',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$19',
    period: '/month',
    badge: 'bg-blue-500/20 text-blue-400 border-blue-500/20',
    gradient: 'from-blue-900/30 to-indigo-900/20',
    borderHover: 'hover:border-blue-500/30',
    icon: Zap,
    popular: true,
    features: [
      'Unlimited Resume Analysis',
      'AI Resume Suggestions',
      'Unlimited Job Matches',
      'Interview Preparation',
      'Priority Email Support',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '$49',
    period: '/month',
    badge: 'bg-amber-500/20 text-amber-400 border-amber-500/20',
    gradient: 'from-amber-900/20 to-orange-900/15',
    borderHover: 'hover:border-amber-500/30',
    icon: Crown,
    features: [
      'Everything in Pro',
      'Auto Apply Assistant',
      'AI Career Coach',
      'Priority Support',
      'Custom Resume Templates',
      'Advanced Analytics',
    ],
  },
];

export default function SubscriptionSection() {
  const toast = useToast();
  const { dbUser, loading } = useAuth();
  const sectionRef = useRef(null);
  const cardsRef = useRef([]);
  const [currentPlan, setCurrentPlan] = useState('free');
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    if (loading || !dbUser) return;
    try {
      const stored = localStorage.getItem(`jobora-plan_${dbUser.email}`);
      if (stored) {
        setCurrentPlan(stored);
      } else {
        const oldStored = localStorage.getItem('jobora-plan');
        if (oldStored) {
          setCurrentPlan(oldStored);
          localStorage.setItem(`jobora-plan_${dbUser.email}`, oldStored);
        } else {
          setCurrentPlan('free');
          localStorage.setItem(`jobora-plan_${dbUser.email}`, 'free');
        }
      }
    } catch {
      setCurrentPlan('free');
    }
  }, [dbUser, loading]);

  useEffect(() => {
    const cards = cardsRef.current.filter(Boolean);
    gsap.fromTo(cards,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: 'power3.out' }
    );
  }, []);

  const handleUpgrade = (planId) => {
    if (planId === currentPlan) return;
    setCurrentPlan(planId);
    if (dbUser?.email) {
      localStorage.setItem(`jobora-plan_${dbUser.email}`, planId);
    }
    toast.success(`Upgraded to ${PLANS.find(p => p.id === planId)?.name} plan!`, 'Plan Updated');
  };

  const handleCancelSub = () => {
    setCurrentPlan('free');
    if (dbUser?.email) {
      localStorage.setItem(`jobora-plan_${dbUser.email}`, 'free');
    }
    toast.info('Subscription cancelled. You are now on the Free plan.');
  };

  const activePlan = PLANS.find(p => p.id === currentPlan) || PLANS[0];

  return (
    <div ref={sectionRef} className="space-y-6">
      {/* Current Plan Overview */}
      <div ref={el => cardsRef.current[0] = el} className="relative bg-gradient-to-br from-[var(--accent-bg)] to-transparent backdrop-blur-xl rounded-2xl border border-[var(--accent-border)] p-6 overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <Crown size={120} />
        </div>
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-bold text-white font-[font2]">Current Plan</h3>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border font-[font2] ${activePlan.badge}`}>
                  <activePlan.icon size={12} />
                  {activePlan.name}
                </span>
              </div>
              <p className="text-sm text-gray-400 font-[font1]">
                {currentPlan === 'free'
                  ? 'Upgrade to unlock premium features and accelerate your job search.'
                  : 'You have access to premium features. Thank you for subscribing!'}
              </p>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold text-white font-[font2]">{activePlan.price}</span>
              <span className="text-gray-500 text-sm font-[font1]">{activePlan.period}</span>
            </div>
          </div>

          {/* Plan Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <div className="flex items-center gap-2 mb-1">
                <Shield size={14} className="text-gray-500" />
                <span className="text-xs text-gray-500 font-[font1] uppercase tracking-wider">Status</span>
              </div>
              <p className="text-sm font-semibold text-emerald-400 font-[font2]">Active</p>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <div className="flex items-center gap-2 mb-1">
                <CalendarDays size={14} className="text-gray-500" />
                <span className="text-xs text-gray-500 font-[font1] uppercase tracking-wider">Renewal</span>
              </div>
              <p className="text-sm font-semibold text-white font-[font2]">{currentPlan === 'free' ? '—' : 'Jul 12, 2026'}</p>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <div className="flex items-center gap-2 mb-1">
                <CreditCard size={14} className="text-gray-500" />
                <span className="text-xs text-gray-500 font-[font1] uppercase tracking-wider">Billing</span>
              </div>
              <p className="text-sm font-semibold text-white font-[font2]">{currentPlan === 'free' ? '—' : '•••• 4242'}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            {currentPlan !== 'premium' && (
              <button
                onClick={() => handleUpgrade('premium')}
                className="px-5 py-2.5 rounded-xl text-white font-semibold text-sm transition-all hover:shadow-lg flex items-center gap-2 font-[font2]"
                style={{ backgroundColor: 'var(--accent-primary)', boxShadow: `0 8px 24px var(--accent-glow)` }}
              >
                <Sparkles size={16} /> Upgrade Plan
              </button>
            )}
            {currentPlan !== 'free' && (
              <>
                <button className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-semibold text-sm transition-all flex items-center gap-2 font-[font2]">
                  <CreditCard size={16} /> Manage Billing
                </button>
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="px-5 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-semibold text-sm transition-all font-[font2]"
                >
                  Cancel Subscription
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Plan Comparison Cards */}
      <div>
        <h3 ref={el => cardsRef.current[1] = el} className="text-lg font-bold text-white mb-4 font-[font2]">Compare Plans</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLANS.map((plan, i) => {
            const isActive = currentPlan === plan.id;
            const Icon = plan.icon;
            return (
              <div
                key={plan.id}
                ref={el => cardsRef.current[i + 2] = el}
                className={`relative group rounded-2xl border p-6 transition-all duration-300 ${plan.borderHover}
                  ${isActive
                    ? 'border-[var(--accent-border)] bg-[var(--accent-bg)]'
                    : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]'
                  }
                  ${plan.popular ? 'ring-1 ring-[var(--accent-primary)]/20' : ''}
                `}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider font-[font2]"
                    style={{ backgroundColor: 'var(--accent-primary)', color: 'white' }}>
                    Most Popular
                  </div>
                )}

                <div className="flex items-center gap-2 mb-4">
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${plan.badge}`}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm font-[font2]">{plan.name}</h4>
                    {isActive && <span className="text-[10px] text-emerald-400 font-[font2]">Current Plan</span>}
                  </div>
                </div>

                <div className="flex items-baseline gap-1 mb-5">
                  <span className="text-3xl font-bold text-white font-[font2]">{plan.price}</span>
                  <span className="text-gray-500 text-sm font-[font1]">{plan.period}</span>
                </div>

                <ul className="space-y-2.5 mb-6">
                  {plan.features.map((feat, fi) => (
                    <li key={fi} className="flex items-start gap-2 text-sm text-gray-400 font-[font1]">
                      <Check size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                      {feat}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={isActive}
                  className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 font-[font2]
                    ${isActive
                      ? 'bg-white/5 text-gray-500 cursor-default border border-white/5'
                      : 'text-white hover:shadow-lg border border-transparent'
                    }
                  `}
                  style={!isActive ? { backgroundColor: 'var(--accent-primary)', boxShadow: `0 4px 16px var(--accent-glow)` } : {}}
                >
                  {isActive ? 'Current Plan' : <>Upgrade <ArrowUpRight size={14} /></>}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <ConfirmModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancelSub}
        title="Cancel Subscription?"
        message="You will lose access to all premium features at the end of your billing cycle. This action cannot be undone."
        confirmText="Cancel Subscription"
        cancelText="Keep Plan"
        variant="danger"
      />
    </div>
  );
}
