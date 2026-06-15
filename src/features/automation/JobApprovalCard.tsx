import React, { useState, useEffect } from 'react';
import { Sparkles, Eye, Check, X, Save, FileText, Image as ImageIcon, CheckCircle, RefreshCw } from 'lucide-react';
import { automationApi } from '@/services/automationApi';
import type { JobAutomationEntry, DetectedField, GeneratedAnswer } from '@/types/automation';
import { API_BASE_URL } from '@/services/apiConfig';

interface JobApprovalCardProps {
  runId: string;
  jobIndex: number;
  jobEntry: JobAutomationEntry;
  onApprove: (runId: string, jobIndex: number) => Promise<void>;
  onSkip: (runId: string, jobIndex: number) => Promise<void>;
  onUpdate: (
    runId: string,
    jobIndex: number,
    data: { detectedFields: DetectedField[]; generatedAnswers: GeneratedAnswer[] }
  ) => Promise<void>;
}

export default function JobApprovalCard({
  runId,
  jobIndex,
  jobEntry,
  onApprove,
  onSkip,
  onUpdate
}: JobApprovalCardProps) {
  const [activeTab, setActiveTab] = useState<'fields' | 'answers' | 'screenshot'>('fields');
  const [rightPanelTab, setRightPanelTab] = useState<'screenshot' | 'video'>('screenshot');
  const [fields, setFields] = useState<DetectedField[]>([]);
  const [answers, setAnswers] = useState<GeneratedAnswer[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const [screenshotError, setScreenshotError] = useState(false);
  const [screenshotTime, setScreenshotTime] = useState(Date.now());

  // Initialize local states from jobEntry
  useEffect(() => {
    if (jobEntry) {
      setFields(JSON.parse(JSON.stringify(jobEntry.detectedFields || [])));
      setAnswers(JSON.parse(JSON.stringify(jobEntry.generatedAnswers || [])));
      if (jobEntry.videoPath) {
        setRightPanelTab('video');
      } else {
        setRightPanelTab('screenshot');
      }
    }
  }, [jobEntry]);

  const handleFieldChange = (index: number, val: string) => {
    const updated = [...fields];
    updated[index].mappedValue = val;
    setFields(updated);
  };

  const handleAnswerChange = (index: number, val: string) => {
    const updated = [...answers];
    updated[index].answer = val;
    setAnswers(updated);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await onUpdate(runId, jobIndex, {
        detectedFields: fields,
        generatedAnswers: answers
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save job edits:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleApproveSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Save any pending edits first
      await onUpdate(runId, jobIndex, {
        detectedFields: fields,
        generatedAnswers: answers
      });
      await onApprove(runId, jobIndex);
    } catch (err) {
      console.error('Failed to approve job:', err);
    } finally {
      setIsSubmitting(false);
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

  const nonCustomFields = fields.filter(f => !f.isCustomQuestion && f.mappedKey !== 'resume' && f.mappedKey !== 'cover_letter');

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-violet-500/20 rounded-2xl overflow-hidden shadow-xl hover:shadow-violet-500/5 transition-all flex flex-col md:flex-row max-w-6xl w-full mx-auto my-6">
      
      {/* Left side: Form Info & Edit Interface */}
      <div className="flex-1 p-6 flex flex-col justify-between border-r border-white/10 md:max-w-2xl">
        <div>
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <span className={`inline-block px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider mb-2 ${
                jobEntry.status === 'captcha_detected' || jobEntry.status === 'CAPTCHA_REQUIRED'
                  ? 'bg-red-500/10 border-red-500/30 text-red-400 animate-pulse'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              }`}>
                {jobEntry.status === 'captcha_detected' || jobEntry.status === 'CAPTCHA_REQUIRED'
                  ? 'CAPTCHA Detected'
                  : jobEntry.status === 'REVIEW_REQUIRED' || jobEntry.status === 'awaiting_approval'
                  ? 'Awaiting Approval'
                  : 'Ready for Review'}
              </span>
              <h3 className="text-2xl font-bold font-[font2] text-white leading-tight">
                {jobEntry.jobInfo.title}
              </h3>
              <p className="text-zinc-400 text-sm mt-1">
                {jobEntry.jobInfo.company} • {jobEntry.jobInfo.location || 'Remote'}
              </p>
            </div>
            <div className="bg-violet-600/20 px-3 py-1 rounded border border-violet-500/30 text-right shrink-0">
              <span className="block text-[10px] text-violet-300 font-bold uppercase tracking-wider">Portal Type</span>
              <span className="text-white text-xs font-semibold capitalize">{jobEntry.platform}</span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-white/10 mb-6">
            <button
              onClick={() => setActiveTab('fields')}
              className={`flex items-center gap-2 pb-3 px-1 border-b-2 text-sm font-semibold transition-all ${
                activeTab === 'fields'
                  ? 'border-violet-500 text-violet-400'
                  : 'border-transparent text-zinc-400 hover:text-white'
              }`}
            >
              <FileText size={16} />
              <span>Form Fields ({nonCustomFields.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('answers')}
              className={`flex items-center gap-2 pb-3 px-6 border-b-2 text-sm font-semibold transition-all ${
                activeTab === 'answers'
                  ? 'border-violet-500 text-violet-400'
                  : 'border-transparent text-zinc-400 hover:text-white'
              }`}
            >
              <Sparkles size={16} />
              <span>Custom Answers ({answers.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('screenshot')}
              className={`flex items-center gap-2 pb-3 px-1 border-b-2 text-sm font-semibold transition-all md:hidden ${
                activeTab === 'screenshot'
                  ? 'border-violet-500 text-violet-400'
                  : 'border-transparent text-zinc-400 hover:text-white'
              }`}
            >
              <ImageIcon size={16} />
              <span>Screenshot</span>
            </button>
          </div>

          {/* Tab Contents */}
          <div className="min-h-80 max-h-[420px] overflow-y-auto pr-2 custom-scrollbar">
            {activeTab === 'fields' && (
              <div className="space-y-4">
                {nonCustomFields.length === 0 ? (
                  <p className="text-zinc-500 text-sm">No generic form fields detected.</p>
                ) : (
                  nonCustomFields.map((field, idx) => {
                    const originalIdx = fields.findIndex(f => f.label === field.label);
                    return (
                      <div key={idx} className="bg-white/[0.02] border border-white/5 p-4 rounded-xl">
                        <div className="flex justify-between items-center mb-1.5">
                          <label className="text-zinc-300 text-xs font-bold tracking-wide flex items-center gap-1">
                            {field.label} {field.required && <span className="text-red-500">*</span>}
                          </label>
                          <span className="text-[10px] text-zinc-500 font-mono capitalize">
                            {field.type} • {field.mappedKey || 'unmapped'}
                          </span>
                        </div>
                        <input
                          type="text"
                          value={field.mappedValue || ''}
                          onChange={(e) => handleFieldChange(originalIdx, e.target.value)}
                          className="w-full p-2.5 bg-zinc-950/40 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-violet-500/50 transition-all"
                        />
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {activeTab === 'answers' && (
              <div className="space-y-5">
                {answers.length === 0 ? (
                  <p className="text-zinc-500 text-sm">No custom screening questions detected.</p>
                ) : (
                  answers.map((answer, idx) => (
                    <div key={idx} className="bg-white/[0.02] border border-white/5 p-4 rounded-xl">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-zinc-200 text-xs font-bold leading-relaxed max-w-[80%]">
                          {answer.question}
                        </h4>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          answer.confidenceScore >= 80
                            ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                            : answer.confidenceScore >= 60
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          {answer.confidenceScore}% match
                        </span>
                      </div>
                      <textarea
                        rows={4}
                        value={answer.answer}
                        onChange={(e) => handleAnswerChange(idx, e.target.value)}
                        className="w-full p-2.5 bg-zinc-950/40 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-violet-500/50 transition-all resize-none leading-relaxed"
                      />
                      {answer.explanation && (
                        <p className="text-[10px] text-zinc-500 mt-1.5 italic">
                          AI note: {answer.explanation}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'screenshot' && (
              <div className="flex flex-col items-center">
                <div className="relative border border-white/10 rounded-xl overflow-hidden bg-black/50 w-full flex items-center justify-center">
                  {!screenshotError ? (
                    <img
                      src={`${automationApi.getScreenshotUrl(runId, jobIndex)}?t=${screenshotTime}`}
                      alt="Filled Form Pre-submission"
                      onError={() => setScreenshotError(true)}
                      className="w-full h-auto object-contain max-h-96"
                    />
                  ) : (
                    <div className="h-60 flex flex-col items-center justify-center text-zinc-500 text-sm gap-2">
                      <ImageIcon size={32} className="opacity-20" />
                      <p>Screenshot not available yet</p>
                      <button onClick={refreshScreenshot} className="text-xs text-violet-400 hover:underline flex items-center gap-1">
                        <RefreshCw size={12} /> Retry
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Panel */}
        <div className="mt-6 pt-4 border-t border-white/10 flex flex-col gap-3">
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={isSaving || isSubmitting || isSkipping}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border font-bold text-sm transition-all ${
                saveSuccess
                  ? 'bg-green-600/20 border-green-500/40 text-green-300'
                  : 'bg-white/5 hover:bg-white/10 border-white/10 text-white disabled:opacity-50'
              }`}
            >
              {isSaving ? (
                <RefreshCw className="animate-spin" size={16} />
              ) : saveSuccess ? (
                <CheckCircle size={16} />
              ) : (
                <Save size={16} />
              )}
              <span>{saveSuccess ? 'Changes Saved!' : 'Save Draft Edits'}</span>
            </button>
            
            <button
              onClick={handleSkip}
              disabled={isSaving || isSubmitting || isSkipping}
              className="flex-1 py-3 rounded-xl border border-red-500/20 bg-red-950/20 hover:bg-red-900/30 text-red-300 font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSkipping ? <RefreshCw className="animate-spin" size={16} /> : <X size={16} />}
              <span>Skip Job</span>
            </button>
          </div>

          <button
            onClick={handleApproveSubmit}
            disabled={isSaving || isSubmitting || isSkipping}
            className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg hover:shadow-violet-500/25 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
          >
            {isSubmitting ? (
              <RefreshCw className="animate-spin" size={18} />
            ) : (
              <Check size={18} />
            )}
            <span>
              {jobEntry.status === 'captcha_detected' || jobEntry.status === 'CAPTCHA_REQUIRED'
                ? (isSubmitting ? 'Resuming Autofill...' : 'I Solved CAPTCHA — Resume Autofill')
                : (isSubmitting ? 'Submitting Application...' : 'Approve & Submit Application')
              }
            </span>
          </button>
        </div>
      </div>

      {/* Right side: Desktop Form Screenshot Preview / Video */}
      <div className="hidden md:flex flex-col w-96 bg-zinc-950/50 border-l border-white/5">
        <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between text-zinc-400 text-xs">
          <span className="font-semibold flex items-center gap-1.5">
            <Eye size={12} /> {rightPanelTab === 'screenshot' ? 'Live Form Screenshot' : 'Automation Playback'}
          </span>
          <div className="flex items-center gap-2">
            {jobEntry.videoPath && (
              <div className="flex bg-white/5 p-0.5 rounded border border-white/10 shrink-0">
                <button
                  onClick={() => setRightPanelTab('screenshot')}
                  className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                    rightPanelTab === 'screenshot' ? 'bg-violet-600 text-white' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Screenshot
                </button>
                <button
                  onClick={() => setRightPanelTab('video')}
                  className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                    rightPanelTab === 'video' ? 'bg-violet-600 text-white' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Video
                </button>
              </div>
            )}
            <button onClick={refreshScreenshot} className="text-zinc-500 hover:text-white transition-all shrink-0">
              <RefreshCw size={12} />
            </button>
          </div>
        </div>
        <div className="p-4 flex-1 flex items-center justify-center overflow-y-auto max-h-[580px] custom-scrollbar">
          {rightPanelTab === 'screenshot' ? (
            !screenshotError ? (
              <div className="relative group rounded-xl overflow-hidden border border-white/10 bg-black">
                <img
                  src={`${automationApi.getScreenshotUrl(runId, jobIndex)}?t=${screenshotTime}`}
                  alt="Filled Form Pre-submission"
                  onError={() => setScreenshotError(true)}
                  className="w-full h-auto shadow-2xl transition-all hover:scale-105 duration-300"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all pointer-events-none">
                  <span className="text-[10px] text-white font-bold uppercase bg-black/80 px-2 py-1 rounded border border-white/20">
                    Pre-submission form draft
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-zinc-600 text-center text-xs flex flex-col items-center gap-2">
                <ImageIcon size={32} className="opacity-10" />
                <p>Screenshot not loaded</p>
                <button onClick={refreshScreenshot} className="text-violet-400 hover:underline">
                  Reload
                </button>
              </div>
            )
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <video
                src={`${API_BASE_URL}${jobEntry.videoPath}`}
                controls
                autoPlay
                loop
                muted
                className="w-full h-auto rounded-xl border border-white/10 shadow-2xl"
              />
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
