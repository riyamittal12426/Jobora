import React, { useRef, useEffect } from 'react';
import { Sun, Moon, Check, Palette, Monitor } from 'lucide-react';
import gsap from 'gsap';
import { useSettings, ACCENT_COLORS } from '../SettingsContext';
import { useToast } from '../ToastProvider';

const ACCENT_KEYS = Object.keys(ACCENT_COLORS);

export default function AppearanceSection() {
  const { settings, setThemeMode, setAccentColor, currentAccent } = useSettings();
  const toast = useToast();
  const sectionRef = useRef(null);
  const cardsRef = useRef([]);
  const previewRef = useRef(null);

  useEffect(() => {
    const cards = cardsRef.current.filter(Boolean);
    gsap.fromTo(cards,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: 'power3.out' }
    );
  }, []);

  const handleThemeChange = (mode) => {
    setThemeMode(mode);
    // Animate preview card
    if (previewRef.current) {
      gsap.fromTo(previewRef.current, { scale: 0.97, opacity: 0.5 }, { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(1.5)' });
    }
    toast.success(`Switched to ${mode} mode`, 'Theme Updated');
  };

  const handleAccentChange = (color) => {
    setAccentColor(color);
    if (previewRef.current) {
      gsap.fromTo(previewRef.current, { scale: 0.97, opacity: 0.5 }, { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(1.5)' });
    }
    toast.success(`Accent color set to ${ACCENT_COLORS[color].name}`, 'Theme Updated');
  };

  const isDark = settings.themeMode === 'dark';

  return (
    <div ref={sectionRef} className="space-y-6">
      {/* Theme Mode */}
      <div ref={el => cardsRef.current[0] = el} className="bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/[0.06] p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
            <Monitor size={20} className="text-gray-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white font-[font2]">Theme Mode</h3>
            <p className="text-xs text-gray-500 font-[font1]">Choose your preferred appearance</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Light Mode Card */}
          <button
            onClick={() => handleThemeChange('light')}
            className={`relative p-5 rounded-xl border-2 transition-all text-left group
              ${!isDark
                ? 'border-[var(--accent-primary)] bg-[var(--accent-bg)]'
                : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
              }
            `}
          >
            {!isDark && (
              <div className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--accent-primary)' }}>
                <Check size={14} className="text-white" />
              </div>
            )}
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-3">
              <Sun size={24} className="text-amber-400" />
            </div>
            <p className="font-semibold text-white text-sm font-[font2]">Light Mode</p>
            <p className="text-xs text-gray-500 mt-1 font-[font1]">Bright and clean interface</p>
          </button>

          {/* Dark Mode Card */}
          <button
            onClick={() => handleThemeChange('dark')}
            className={`relative p-5 rounded-xl border-2 transition-all text-left group
              ${isDark
                ? 'border-[var(--accent-primary)] bg-[var(--accent-bg)]'
                : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
              }
            `}
          >
            {isDark && (
              <div className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--accent-primary)' }}>
                <Check size={14} className="text-white" />
              </div>
            )}
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-3">
              <Moon size={24} className="text-indigo-400" />
            </div>
            <p className="font-semibold text-white text-sm font-[font2]">Dark Mode</p>
            <p className="text-xs text-gray-500 mt-1 font-[font1]">Easy on the eyes</p>
          </button>
        </div>
      </div>

      {/* Accent Color */}
      <div ref={el => cardsRef.current[1] = el} className="bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/[0.06] p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
            <Palette size={20} className="text-gray-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white font-[font2]">Accent Color</h3>
            <p className="text-xs text-gray-500 font-[font1]">Personalize your dashboard colors</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          {ACCENT_KEYS.map(key => {
            const color = ACCENT_COLORS[key];
            const isActive = settings.accentColor === key;
            return (
              <button
                key={key}
                onClick={() => handleAccentChange(key)}
                className={`group relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all min-w-[90px]
                  ${isActive
                    ? 'border-white/30 bg-white/5'
                    : 'border-white/5 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]'
                  }
                `}
              >
                <div
                  className={`w-10 h-10 rounded-full transition-all flex items-center justify-center
                    ${isActive ? 'ring-2 ring-offset-2 ring-offset-gray-900 scale-110' : 'group-hover:scale-105'}
                  `}
                  style={{
                    backgroundColor: color.primary,
                    ringColor: color.primary,
                  }}
                >
                  {isActive && <Check size={18} className="text-white" />}
                </div>
                <span className="text-xs text-gray-400 font-[font2]">{color.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Preview */}
      <div ref={el => cardsRef.current[2] = el} className="bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/[0.06] p-6">
        <h3 className="text-lg font-bold text-white mb-4 font-[font2]">Live Preview</h3>
        <div ref={previewRef} className="rounded-xl border border-white/10 overflow-hidden">
          {/* Preview header */}
          <div className="px-5 py-3 border-b border-white/[0.06] flex items-center justify-between"
            style={{ backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.05)' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: currentAccent.primary }}>
                <span className="text-white font-bold text-xs font-[font2]">J</span>
              </div>
              <span className="text-sm font-semibold text-white font-[font2]">JOBORA</span>
            </div>
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
              <div className="w-3 h-3 rounded-full bg-green-500/60" />
            </div>
          </div>

          {/* Preview body */}
          <div className="p-5 space-y-3" style={{ backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.03)' }}>
            <div className="flex gap-3">
              <div className="h-2.5 rounded-full w-20" style={{ backgroundColor: currentAccent.primary }} />
              <div className="h-2.5 rounded-full w-32 bg-white/10" />
            </div>
            <div className="flex gap-3">
              <div className="h-2.5 rounded-full w-40 bg-white/10" />
              <div className="h-2.5 rounded-full w-16" style={{ backgroundColor: `${currentAccent.primary}60` }} />
            </div>
            <div className="flex gap-2 mt-4">
              <div className="px-4 py-2 rounded-lg text-xs text-white font-semibold font-[font2]"
                style={{ backgroundColor: currentAccent.primary }}>
                Primary Button
              </div>
              <div className="px-4 py-2 rounded-lg text-xs font-semibold border font-[font2]"
                style={{ borderColor: currentAccent.border, color: currentAccent.primary }}>
                Secondary
              </div>
            </div>
            <div className="mt-3 p-3 rounded-lg border" style={{ backgroundColor: currentAccent.bg, borderColor: currentAccent.border }}>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: currentAccent.primary }} />
                <span className="text-xs font-[font1]" style={{ color: currentAccent.primary }}>
                  Active accent: {currentAccent.name}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
