import React, { useState } from 'react';
import { ShieldAlert, RefreshCw, Play, X, Eye, AlertCircle, HelpCircle } from 'lucide-react';
import { automationApi } from '@/services/automationApi';
import type { JobAutomationEntry } from '@/types/automation';

interface CaptchaResolutionCardProps {
  runId: string;
  jobIndex: number;
  jobEntry: JobAutomationEntry;
  onResume: (runId: string, jobIndex: number) => Promise<void>;
  onSkip: (runId: string, jobIndex: number) => Promise<void>;
}

export default function CaptchaResolutionCard({
  runId,
  jobIndex,
  jobEntry,
  onResume,
  onSkip
}: CaptchaResolutionCardProps) {
  const [isResuming, setIsResuming] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const [screenshotError, setScreenshotError] = useState(false);
  const [screenshotTime, setScreenshotTime] = useState(Date.now());

  const handleResume = async () => {
    setIsResuming(true);
    try {
      await onResume(runId, jobIndex);
    } catch (err) {
      console.error('Failed to resume automation:', err);
    } finally {
      setIsResuming(false);
    }
  };

  const handleSkip = async () => {
    setIsSkipping(true);
    try {
      await onSkip(runId, jobIndex);
    } catch (err) {
      console.error('Failed to skip job:', err);
    } finally {
      setIsSkipping(false);
    }
  };

  const refreshScreenshot = () => {
    setScreenshotError(false);
    setScreenshotTime(Date.now());
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-red-500/20 rounded-2xl overflow-hidden shadow-2xl hover:shadow-red-500/5 transition-all flex flex-col md:flex-row max-w-6xl w-full mx-auto my-6 animate-[pulse_3s_infinite]">
      
      {/* Left side: Instructions & Actions */}
      <div className="flex-1 p-8 flex flex-col justify-between border-r border-white/10 md:max-w-2xl">
        <div>
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3 bg-red-500/10 border border-red-500/30 text-red-400">
                <ShieldAlert size={12} className="animate-bounce" />
                CAPTCHA Solver Required
              </span>
              <h3 className="text-2xl font-bold font-[font2] text-white leading-tight">
                {jobEntry.jobInfo.title}
              </h3>
              <p className="text-zinc-400 text-sm mt-1">
                {jobEntry.jobInfo.company} • {jobEntry.jobInfo.location || 'Remote'}
              </p>
            </div>
            <div className="bg-red-950/20 px-3 py-1 rounded border border-red-500/30 text-right shrink-0">
              <span className="block text-[10px] text-red-300 font-bold uppercase tracking-wider">Status</span>
              <span className="text-white text-xs font-semibold capitalize">Paused</span>
            </div>
          </div>

          {/* Guide / Alert Box */}
          <div className="bg-red-950/30 border border-red-500/20 rounded-xl p-4 mb-6 flex gap-3">
            <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={20} />
            <div className="space-y-1">
              <h4 className="text-red-300 text-sm font-bold">Manual CAPTCHA Solving Process</h4>
              <p className="text-zinc-300 text-xs leading-relaxed">
                A headed Playwright browser is currently running on your desktop. We detected a CAPTCHA challenge (reCAPTCHA, hCaptcha, Cloudflare, etc.) that blocks automatic completion.
              </p>
            </div>
          </div>

          {/* Instruction list */}
          <div className="space-y-4 mb-6">
            <h4 className="text-zinc-200 text-sm font-bold flex items-center gap-2">
              <HelpCircle size={16} className="text-violet-400" />
              How to resolve this:
            </h4>
            <ul className="space-y-3 text-xs text-zinc-300 list-decimal list-inside pl-1">
              <li className="leading-relaxed">
                Locate and click on the <strong className="text-white">headed browser window</strong> that popped up on your screen.
              </li>
              <li className="leading-relaxed">
                Solve the CAPTCHA puzzle manually inside the browser window.
              </li>
              <li className="leading-relaxed">
                Once resolved, either wait for the system to auto-resume (polled every 2.5s) or click <strong className="text-white">"Resume Automation"</strong> below to force resume autofill.
              </li>
            </ul>
          </div>

          {/* Progress Tracker representation */}
          <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl mb-6">
            <div className="flex justify-between items-center text-xs text-zinc-400 mb-2">
              <span>Automation Progress</span>
              <span className="font-mono text-red-400 font-bold">CAPTCHA_REQUIRED</span>
            </div>
            <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
              <div className="bg-red-500 h-1.5 rounded-full" style={{ width: '60%' }}></div>
            </div>
            <div className="flex justify-between text-[10px] text-zinc-500 mt-2">
              <span>Opening Job Portal</span>
              <span>Scanning Fields</span>
              <span className="text-red-400 font-bold">CAPTCHA Alert</span>
              <span>Review Form</span>
            </div>
          </div>
        </div>

        {/* Action Panel */}
        <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleResume}
            disabled={isResuming || isSkipping}
            className="flex-1 bg-violet-600 hover:bg-violet-500 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-lg hover:shadow-violet-500/25 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
          >
            {isResuming ? (
              <RefreshCw className="animate-spin" size={18} />
            ) : (
              <Play size={18} />
            )}
            <span>Resume Automation</span>
          </button>
          
          <button
            onClick={handleSkip}
            disabled={isResuming || isSkipping}
            className="sm:w-32 py-3.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300 font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSkipping ? <RefreshCw className="animate-spin" size={16} /> : <X size={16} />}
            <span>Skip Job</span>
          </button>
        </div>
      </div>

      {/* Right side: Browser Screenshot Preview */}
      <div className="flex flex-col md:w-96 bg-zinc-950/50 border-l border-white/5 max-h-[580px]">
        <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between text-zinc-400 text-xs">
          <span className="font-semibold flex items-center gap-1.5">
            <Eye size={12} /> Live Capture screenshot
          </span>
          <button onClick={refreshScreenshot} className="text-zinc-500 hover:text-white transition-all">
            <RefreshCw size={12} />
          </button>
        </div>
        <div className="p-4 flex-1 flex items-center justify-center overflow-y-auto custom-scrollbar">
          {!screenshotError ? (
            <div className="relative group rounded-xl overflow-hidden border border-white/10 bg-black">
              <img
                src={`${automationApi.getScreenshotUrl(runId, jobIndex)}?t=${screenshotTime}`}
                alt="Verification obstacle screenshot"
                onError={() => setScreenshotError(true)}
                className="w-full h-auto shadow-2xl transition-all hover:scale-105 duration-300"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all pointer-events-none">
                <span className="text-[10px] text-white font-bold uppercase bg-red-950/80 px-2 py-1 rounded border border-red-500/20">
                  Captcha Obstacle Detected
                </span>
              </div>
            </div>
          ) : (
            <div className="text-zinc-600 text-center text-xs flex flex-col items-center gap-2 py-12">
              <ShieldAlert size={32} className="opacity-10 text-red-500" />
              <p>Screenshot not available yet</p>
              <button onClick={refreshScreenshot} className="text-violet-400 hover:underline">
                Reload Screenshot
              </button>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
