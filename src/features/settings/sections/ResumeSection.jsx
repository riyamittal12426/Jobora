import React, { useRef, useEffect, useState, useCallback } from 'react';
import { FileText, Upload, Download, Trash2, Star, StarOff, Clock, BarChart3, Plus } from 'lucide-react';
import gsap from 'gsap';
import { useToast } from '../ToastProvider';
import ConfirmModal from '../ConfirmModal';

const MOCK_RESUMES = [
  { id: 1, name: 'Software_Engineer_Resume_v3.pdf', uploadDate: '2026-06-10', atsScore: 87, isDefault: true, size: '245 KB' },
  { id: 2, name: 'Frontend_Developer_Resume.pdf', uploadDate: '2026-06-05', atsScore: 72, isDefault: false, size: '198 KB' },
  { id: 3, name: 'General_Resume_2026.pdf', uploadDate: '2026-05-20', atsScore: 65, isDefault: false, size: '312 KB' },
];

function AtsScoreRing({ score, size = 48 }) {
  const circumference = 2 * Math.PI * 18;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 44 44" className="-rotate-90">
        <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
        <circle
          cx="22" cy="22" r="18" fill="none" stroke={color} strokeWidth="3"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold font-[font2]" style={{ color }}>{score}</span>
      </div>
    </div>
  );
}

export default function ResumeSection() {
  const toast = useToast();
  const sectionRef = useRef(null);
  const cardsRef = useRef([]);
  const fileInputRef = useRef(null);
  const [resumes, setResumes] = useState(() => {
    try {
      const stored = localStorage.getItem('jobora-resumes');
      return stored ? JSON.parse(stored) : MOCK_RESUMES;
    } catch { return MOCK_RESUMES; }
  });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    const cards = cardsRef.current.filter(Boolean);
    gsap.fromTo(cards,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: 'power3.out' }
    );
  }, []);

  const saveResumes = (updated) => {
    setResumes(updated);
    localStorage.setItem('jobora-resumes', JSON.stringify(updated));
  };

  const handleSetDefault = (id) => {
    const updated = resumes.map(r => ({ ...r, isDefault: r.id === id }));
    saveResumes(updated);
    toast.success('Default resume updated!');
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    const updated = resumes.filter(r => r.id !== deleteTarget);
    // If deleted was default, set first remaining as default
    if (updated.length > 0 && !updated.some(r => r.isDefault)) {
      updated[0].isDefault = true;
    }
    saveResumes(updated);
    setDeleteTarget(null);
    toast.success('Resume deleted.');
  };

  const handleUpload = (file) => {
    if (!file) return;
    if (!file.name.endsWith('.pdf') && !file.name.endsWith('.docx') && !file.name.endsWith('.doc')) {
      toast.error('Please upload a PDF or Word document.');
      return;
    }
    const newResume = {
      id: Date.now(),
      name: file.name,
      uploadDate: new Date().toISOString().split('T')[0],
      atsScore: Math.floor(Math.random() * 30) + 60, // Mock score
      isDefault: resumes.length === 0,
      size: `${(file.size / 1024).toFixed(0)} KB`,
    };
    saveResumes([newResume, ...resumes]);
    toast.success(`${file.name} uploaded successfully!`, 'Resume');
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    handleUpload(e.dataTransfer.files[0]);
  }, [resumes]);

  return (
    <div ref={sectionRef} className="space-y-6">
      {/* Upload Zone */}
      <div
        ref={el => cardsRef.current[0] = el}
        className={`bg-white/[0.03] backdrop-blur-xl rounded-2xl border-2 border-dashed p-8 text-center transition-all cursor-pointer
          ${dragOver ? 'border-[var(--accent-primary)] bg-[var(--accent-bg)] scale-[1.01]' : 'border-white/10 hover:border-white/20'}
        `}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
          <Upload size={28} className="text-gray-400" />
        </div>
        <p className="text-sm font-semibold text-white mb-1 font-[font2]">Upload Resume</p>
        <p className="text-xs text-gray-500 font-[font1]">Drag & drop or click to browse. PDF, DOC, DOCX supported.</p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          className="hidden"
          onChange={(e) => handleUpload(e.target.files[0])}
        />
      </div>

      {/* Resume Cards */}
      <div className="space-y-3">
        <h3 ref={el => cardsRef.current[1] = el} className="text-lg font-bold text-white font-[font2] flex items-center gap-2">
          <FileText size={20} className="text-gray-400" />
          Your Resumes
          <span className="text-xs text-gray-500 font-[font1] font-normal ml-1">({resumes.length})</span>
        </h3>

        {resumes.length === 0 ? (
          <div className="text-center py-12 text-gray-600 font-[font1] text-sm">
            No resumes uploaded yet. Upload your first resume above.
          </div>
        ) : (
          resumes.map((resume, i) => (
            <div
              key={resume.id}
              ref={el => cardsRef.current[i + 2] = el}
              className={`bg-white/[0.03] backdrop-blur-xl rounded-xl border p-4 transition-all hover:border-white/15 group
                ${resume.isDefault ? 'border-[var(--accent-border)]' : 'border-white/[0.06]'}
              `}
            >
              <div className="flex items-center gap-4">
                {/* File icon */}
                <div className={`w-11 h-11 rounded-xl border flex items-center justify-center flex-shrink-0
                  ${resume.isDefault ? 'bg-[var(--accent-bg)] border-[var(--accent-border)]' : 'bg-white/[0.03] border-white/[0.06]'}
                `}>
                  <FileText size={20} className={resume.isDefault ? 'text-[var(--accent-primary)]' : 'text-gray-500'} style={resume.isDefault ? { color: 'var(--accent-primary)' } : {}} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-white font-[font2] truncate">{resume.name}</p>
                    {resume.isDefault && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--accent-bg)] border border-[var(--accent-border)] font-bold font-[font2] flex-shrink-0"
                        style={{ color: 'var(--accent-primary)' }}>
                        Default
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 font-[font1]">
                    <span className="flex items-center gap-1"><Clock size={10} />{resume.uploadDate}</span>
                    <span>{resume.size}</span>
                  </div>
                </div>

                {/* ATS Score */}
                <div className="flex-shrink-0 hidden sm:block">
                  <AtsScoreRing score={resume.atsScore} />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => handleSetDefault(resume.id)}
                    title={resume.isDefault ? 'Default resume' : 'Set as default'}
                    className={`p-2 rounded-lg transition-all ${resume.isDefault
                      ? 'text-amber-400 bg-amber-500/10'
                      : 'text-gray-500 hover:text-amber-400 hover:bg-amber-500/10'
                    }`}
                  >
                    {resume.isDefault ? <Star size={16} fill="currentColor" /> : <StarOff size={16} />}
                  </button>
                  <button
                    onClick={() => toast.info('Download started')}
                    title="Download"
                    className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-all"
                  >
                    <Download size={16} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(resume.id)}
                    title="Delete"
                    className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Resume?"
        message="This resume will be permanently removed. If it was your default resume, another one will be set as default."
        confirmText="Delete"
        cancelText="Keep"
        variant="danger"
      />
    </div>
  );
}
