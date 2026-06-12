import React, { useRef, useEffect } from 'react';
import { Bell, Mail, Calendar, Briefcase, Sparkles, Megaphone } from 'lucide-react';
import gsap from 'gsap';
import { useSettings } from '../SettingsContext';
import { useToast } from '../ToastProvider';

const NOTIFICATION_OPTIONS = [
  {
    key: 'email',
    icon: Mail,
    label: 'Email Notifications',
    description: 'Receive important updates and alerts via email',
  },
  {
    key: 'interviewReminders',
    icon: Calendar,
    label: 'Interview Reminders',
    description: 'Get reminded about upcoming interviews and deadlines',
  },
  {
    key: 'applicationUpdates',
    icon: Briefcase,
    label: 'Application Updates',
    description: 'Notifications when your application status changes',
  },
  {
    key: 'aiSuggestions',
    icon: Sparkles,
    label: 'AI Suggestions',
    description: 'Personalized job matches and resume improvement tips',
  },
  {
    key: 'marketingEmails',
    icon: Megaphone,
    label: 'Marketing Emails',
    description: 'Product updates, tips, and promotional content',
  },
];

export default function NotificationSection() {
  const { settings, updateNotification } = useSettings();
  const toast = useToast();
  const sectionRef = useRef(null);
  const cardsRef = useRef([]);

  useEffect(() => {
    const cards = cardsRef.current.filter(Boolean);
    gsap.fromTo(cards,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, stagger: 0.08, ease: 'power3.out' }
    );
  }, []);

  const handleToggle = (key) => {
    const newValue = !settings.notifications[key];
    updateNotification(key, newValue);
    const option = NOTIFICATION_OPTIONS.find(o => o.key === key);
    toast.success(
      `${option?.label} ${newValue ? 'enabled' : 'disabled'}`,
      'Notifications'
    );
  };

  return (
    <div ref={sectionRef} className="space-y-6">
      <div ref={el => cardsRef.current[0] = el} className="bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/[0.06] p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
            <Bell size={20} className="text-gray-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white font-[font2]">Notification Preferences</h3>
            <p className="text-xs text-gray-500 font-[font1]">Choose what notifications you want to receive</p>
          </div>
        </div>

        <div className="space-y-1">
          {NOTIFICATION_OPTIONS.map((option, i) => {
            const Icon = option.icon;
            const isEnabled = settings.notifications[option.key];
            return (
              <div
                key={option.key}
                ref={el => cardsRef.current[i + 1] = el}
                className="flex items-center justify-between p-4 rounded-xl hover:bg-white/[0.02] transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all
                    ${isEnabled
                      ? 'bg-[var(--accent-bg)] border-[var(--accent-border)]'
                      : 'bg-white/[0.02] border-white/[0.06]'
                    }
                  `}>
                    <Icon size={18} className={isEnabled ? 'text-[var(--accent-primary)]' : 'text-gray-500'} style={isEnabled ? { color: 'var(--accent-primary)' } : {}} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white font-[font2]">{option.label}</p>
                    <p className="text-xs text-gray-500 font-[font1]">{option.description}</p>
                  </div>
                </div>

                {/* Toggle */}
                <button
                  onClick={() => handleToggle(option.key)}
                  className={`relative w-11 h-6 rounded-full transition-all duration-300 flex-shrink-0 ${isEnabled ? '' : 'bg-white/10'}`}
                  style={isEnabled ? { backgroundColor: 'var(--accent-primary)' } : {}}
                  aria-label={`Toggle ${option.label}`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300
                    ${isEnabled ? 'left-[22px]' : 'left-0.5'}`}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
