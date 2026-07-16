import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE_URL } from '../../services/apiConfig';
import { Sparkles, Download, Mail, Phone, MapPin, Globe, Code, ChevronDown, ChevronRight, Wand2, FileText, X, Loader2 } from 'lucide-react';
import CoverLetterModal from './CoverLetterModal';

const ResumeBuilderPage = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isParsing, setIsParsing] = useState(false);
  
  // Excluded bullets/skills tracking (so we can toggle them off without losing data)
  const [excludedBullets, setExcludedBullets] = useState(new Set());
  const [excludedSkills, setExcludedSkills] = useState(new Set());
  
  // UI State
  const [expandedSections, setExpandedSections] = useState({ exp: true, proj: true, edu: true, skills: true });
  const [isCoverLetterModalOpen, setIsCoverLetterModalOpen] = useState(false);

  useEffect(() => {
    if (user) fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const token = await user.getIdToken();
      const res = await fetch(`${API_BASE_URL}/api/builder/profile/${user.email}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // If profile doesn't have structured arrays, we initialize empty ones to avoid crashes
        if (!data.experience) data.experience = [];
        if (!data.projects) data.projects = [];
        if (!data.education) data.education = [];
        if (!data.skills) data.skills = [];
        if (!data.personalInfo) data.personalInfo = {};
        setProfile(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleParseAI = async () => {
    if (!window.confirm("This will overwrite your current builder profile using AI. Make sure you've uploaded a resume on the Dashboard first. Continue?")) return;
    try {
      setIsParsing(true);
      const token = await user.getIdToken();
      const res = await fetch(`${API_BASE_URL}/api/builder/parse/${user.email}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      } else {
        const err = await res.json();
        alert(err.message || 'Error parsing resume.');
      }
    } catch (e) {
      console.error(e);
      alert('Network error.');
    } finally {
      setIsParsing(false);
    }
  };

  const toggleBullet = (expIndex, bulletIndex, type = 'exp') => {
    const key = `${type}-${expIndex}-${bulletIndex}`;
    const newExcluded = new Set(excludedBullets);
    if (newExcluded.has(key)) newExcluded.delete(key);
    else newExcluded.add(key);
    setExcludedBullets(newExcluded);
  };

  const toggleSkill = (skill) => {
    const newExcluded = new Set(excludedSkills);
    if (newExcluded.has(skill)) newExcluded.delete(skill);
    else newExcluded.add(skill);
    setExcludedSkills(newExcluded);
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;
  }

  // Generate the active profile for the Cover Letter (only included bullets)
  const activeProfile = profile ? {
    ...profile,
    experience: profile.experience.map((exp, i) => ({
      ...exp,
      bullets: (exp.bullets || []).filter((_, j) => !excludedBullets.has(`exp-${i}-${j}`))
    })),
    projects: profile.projects.map((proj, i) => ({
      ...proj,
      bullets: (proj.bullets || []).filter((_, j) => !excludedBullets.has(`proj-${i}-${j}`))
    })),
    skills: profile.skills.filter(s => !excludedSkills.has(s))
  } : null;

  return (
    <div className="w-full max-w-[1600px] mx-auto flex flex-col lg:flex-row h-[90vh] gap-6 print:h-auto print:block">
      
      {/* ─── LEFT PANE: EDITOR CONTROLS ─── */}
      <div className="w-full lg:w-1/3 flex flex-col bg-[#0c0d14]/80 backdrop-blur-xl border border-white/10 rounded-[32px] overflow-hidden print:hidden shadow-2xl">
        <div className="p-6 border-b border-white/5 shrink-0 bg-[#13141f]">
          <h1 className="text-2xl font-bold font-[font2] text-white flex items-center gap-2">
            <FileText className="text-[#7c3aed]" /> Resume Builder
          </h1>
          <p className="text-sm text-gray-400 mt-2">Tailor your resume for specific jobs. Click bullets to hide/show them in the live preview.</p>
          
          <div className="flex gap-2 mt-4">
            <button 
              onClick={handleParseAI}
              disabled={isParsing}
              className="flex-1 flex items-center justify-center gap-2 bg-[#7c3aed]/10 text-[#7c3aed] hover:bg-[#7c3aed]/20 border border-[#7c3aed]/30 py-2 rounded-xl text-sm font-semibold transition-all"
            >
              {isParsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
              {isParsing ? 'Extracting...' : 'Structure with AI'}
            </button>
            <button 
              onClick={() => setIsCoverLetterModalOpen(true)}
              className="flex-1 flex items-center justify-center gap-2 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/30 py-2 rounded-xl text-sm font-semibold transition-all"
            >
              <Mail className="w-4 h-4" /> Cover Letter
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 custom-scrollbar">
          {(!profile || !profile.personalInfo?.fullName) ? (
            <div className="text-center text-gray-500 p-8">
              <p>No structured data found.</p>
              <p className="text-xs mt-2">Click "Structure with AI" to parse your uploaded PDF.</p>
            </div>
          ) : (
            <>
              {/* Experience Editor */}
              <div className="border border-white/5 rounded-2xl bg-white/[0.02] overflow-hidden">
                <button 
                  onClick={() => setExpandedSections(s => ({...s, exp: !s.exp}))}
                  className="w-full p-4 flex items-center justify-between bg-white/[0.02] hover:bg-white/[0.05]"
                >
                  <span className="font-semibold text-white">Experience</span>
                  {expandedSections.exp ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                {expandedSections.exp && (
                  <div className="p-4 pt-0 flex flex-col gap-4">
                    {profile.experience.map((exp, expIdx) => (
                      <div key={expIdx} className="bg-black/30 rounded-xl p-3 border border-white/5">
                        <div className="text-sm font-bold text-gray-200">{exp.role} @ {exp.company}</div>
                        <div className="flex flex-col gap-2 mt-3">
                          {(exp.bullets || []).map((bullet, bIdx) => {
                            const isExcluded = excludedBullets.has(`exp-${expIdx}-${bIdx}`);
                            return (
                              <div 
                                key={bIdx}
                                onClick={() => toggleBullet(expIdx, bIdx, 'exp')}
                                className={`text-xs p-2 rounded-lg border cursor-pointer transition-all ${isExcluded ? 'bg-gray-900/50 border-gray-800 text-gray-600' : 'bg-indigo-900/20 border-indigo-500/30 text-gray-300'}`}
                              >
                                {bullet}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Projects Editor */}
              <div className="border border-white/5 rounded-2xl bg-white/[0.02] overflow-hidden">
                <button 
                  onClick={() => setExpandedSections(s => ({...s, proj: !s.proj}))}
                  className="w-full p-4 flex items-center justify-between bg-white/[0.02] hover:bg-white/[0.05]"
                >
                  <span className="font-semibold text-white">Projects</span>
                  {expandedSections.proj ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                {expandedSections.proj && (
                  <div className="p-4 pt-0 flex flex-col gap-4">
                    {profile.projects.map((proj, pIdx) => (
                      <div key={pIdx} className="bg-black/30 rounded-xl p-3 border border-white/5">
                        <div className="text-sm font-bold text-gray-200">{proj.title}</div>
                        <div className="flex flex-col gap-2 mt-3">
                          {(proj.bullets || []).map((bullet, bIdx) => {
                            const isExcluded = excludedBullets.has(`proj-${pIdx}-${bIdx}`);
                            return (
                              <div 
                                key={bIdx}
                                onClick={() => toggleBullet(pIdx, bIdx, 'proj')}
                                className={`text-xs p-2 rounded-lg border cursor-pointer transition-all ${isExcluded ? 'bg-gray-900/50 border-gray-800 text-gray-600' : 'bg-emerald-900/20 border-emerald-500/30 text-gray-300'}`}
                              >
                                {bullet}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Skills Editor */}
              <div className="border border-white/5 rounded-2xl bg-white/[0.02] overflow-hidden">
                <button 
                  onClick={() => setExpandedSections(s => ({...s, skills: !s.skills}))}
                  className="w-full p-4 flex items-center justify-between bg-white/[0.02] hover:bg-white/[0.05]"
                >
                  <span className="font-semibold text-white">Skills</span>
                  {expandedSections.skills ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                {expandedSections.skills && (
                  <div className="p-4 pt-0 flex flex-wrap gap-2">
                    {profile.skills.map((skill, sIdx) => {
                      const isExcluded = excludedSkills.has(skill);
                      return (
                        <span 
                          key={sIdx}
                          onClick={() => toggleSkill(skill)}
                          className={`text-xs px-2.5 py-1 rounded-full cursor-pointer border transition-colors ${isExcluded ? 'bg-gray-900 border-gray-800 text-gray-600' : 'bg-white/10 border-white/20 text-white hover:bg-white/20'}`}
                        >
                          {skill}
                        </span>
                      )
                    })}
                  </div>
                )}
              </div>

            </>
          )}
        </div>
      </div>

      {/* ─── RIGHT PANE: LIVE RESUME PREVIEW ─── */}
      <div className="w-full lg:w-2/3 h-full flex flex-col bg-[#1a1b26] rounded-[32px] border border-white/5 overflow-hidden print:w-full print:border-none print:rounded-none">
        <div className="p-4 bg-[#13141f] border-b border-white/5 flex justify-between items-center print:hidden">
          <span className="text-gray-400 font-semibold text-sm">A4 PDF Preview</span>
          <button onClick={handlePrint} className="flex items-center gap-2 bg-[#7c3aed] hover:bg-[#6d28d9] px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors">
            <Download size={16} /> Download PDF
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-gray-900 flex justify-center p-8 print:p-0 print:bg-white">
          
          {/* THE RESUME A4 CONTAINER */}
          {profile && profile.personalInfo && (
            <div className="w-[800px] min-h-[1131px] bg-white text-black p-10 shadow-2xl shrink-0 print:shadow-none print:w-full print:h-auto print:min-h-0 print:m-0 font-sans leading-relaxed">
              
              {/* Header */}
              <div className="border-b-2 border-gray-800 pb-4 mb-5 text-center">
                <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 uppercase">{profile.personalInfo.fullName}</h1>
                <h2 className="text-lg font-medium text-gray-600 mt-1">{profile.personalInfo.jobTitle}</h2>
                <div className="flex flex-wrap justify-center gap-4 mt-3 text-sm text-gray-600">
                  {profile.personalInfo.location && <span className="flex items-center gap-1"><MapPin size={12}/>{profile.personalInfo.location}</span>}
                  {profile.personalInfo.phone && <span className="flex items-center gap-1"><Phone size={12}/>{profile.personalInfo.phone}</span>}
                  {profile.personalInfo.email && <span className="flex items-center gap-1"><Mail size={12}/>{profile.personalInfo.email}</span>}
                  {profile.personalInfo.linkedin && <span className="flex items-center gap-1"><Globe size={12}/>{profile.personalInfo.linkedin.replace('https://www.linkedin.com/in/','')}</span>}
                  {profile.personalInfo.github && <span className="flex items-center gap-1"><Code size={12}/>{profile.personalInfo.github.replace('https://github.com/','')}</span>}
                </div>
              </div>

              {/* Summary */}
              {profile.summary && (
                <div className="mb-5">
                  <p className="text-[13px] text-gray-800 leading-snug">{profile.summary}</p>
                </div>
              )}

              {/* Experience */}
              {profile.experience && profile.experience.length > 0 && (
                <div className="mb-5">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest border-b border-gray-300 pb-1 mb-3">Professional Experience</h3>
                  <div className="flex flex-col gap-4">
                    {profile.experience.map((exp, i) => {
                      const includedBullets = (exp.bullets || []).filter((_, j) => !excludedBullets.has(`exp-${i}-${j}`));
                      if (includedBullets.length === 0 && !exp.description) return null; // Hide completely if all bullets toggled off
                      
                      return (
                        <div key={i}>
                          <div className="flex justify-between items-baseline mb-1">
                            <div>
                              <span className="font-bold text-gray-900 text-[14px]">{exp.role}</span>
                              <span className="mx-2 text-gray-400">|</span>
                              <span className="font-medium text-gray-700 text-[13px]">{exp.company}</span>
                            </div>
                            <span className="text-[12px] text-gray-600 font-medium whitespace-nowrap">{exp.startDate} – {exp.endDate}</span>
                          </div>
                          {includedBullets.length > 0 ? (
                            <ul className="list-disc list-outside ml-4 flex flex-col gap-1 text-[13px] text-gray-800">
                              {includedBullets.map((b, j) => <li key={j} className="pl-1 leading-snug">{b}</li>)}
                            </ul>
                          ) : (
                            <p className="text-[13px] text-gray-800 leading-snug">{exp.description}</p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Projects */}
              {profile.projects && profile.projects.length > 0 && (
                <div className="mb-5">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest border-b border-gray-300 pb-1 mb-3">Selected Projects</h3>
                  <div className="flex flex-col gap-4">
                    {profile.projects.map((proj, i) => {
                      const includedBullets = (proj.bullets || []).filter((_, j) => !excludedBullets.has(`proj-${i}-${j}`));
                      if (includedBullets.length === 0 && !proj.description) return null;
                      
                      return (
                        <div key={i}>
                          <div className="flex justify-between items-baseline mb-1">
                            <span className="font-bold text-gray-900 text-[14px]">{proj.title}</span>
                            {proj.link && <span className="text-[12px] text-blue-600">{proj.link.replace('https://','')}</span>}
                          </div>
                          {includedBullets.length > 0 ? (
                            <ul className="list-disc list-outside ml-4 flex flex-col gap-1 text-[13px] text-gray-800">
                              {includedBullets.map((b, j) => <li key={j} className="pl-1 leading-snug">{b}</li>)}
                            </ul>
                          ) : (
                            <p className="text-[13px] text-gray-800 leading-snug">{proj.description}</p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Education */}
              {profile.education && profile.education.length > 0 && (
                <div className="mb-5">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest border-b border-gray-300 pb-1 mb-3">Education</h3>
                  <div className="flex flex-col gap-2">
                    {profile.education.map((edu, i) => (
                      <div key={i} className="flex justify-between items-baseline">
                        <div>
                          <span className="font-bold text-gray-900 text-[14px]">{edu.school}</span>
                          <span className="mx-2 text-gray-400">|</span>
                          <span className="text-gray-700 text-[13px]">{edu.degree} in {edu.fieldOfStudy}</span>
                        </div>
                        <span className="text-[12px] text-gray-600 font-medium">{edu.startDate} – {edu.endDate}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Skills */}
              {profile.skills && profile.skills.length > 0 && (
                <div className="mb-5">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest border-b border-gray-300 pb-1 mb-3">Technical Skills</h3>
                  <p className="text-[13px] text-gray-800 leading-relaxed">
                    {profile.skills.filter(s => !excludedSkills.has(s)).join(' • ')}
                  </p>
                </div>
              )}

            </div>
          )}
        </div>
      </div>

      {/* Cover Letter Modal */}
      {isCoverLetterModalOpen && (
        <CoverLetterModal 
          isOpen={isCoverLetterModalOpen} 
          onClose={() => setIsCoverLetterModalOpen(false)} 
          profile={activeProfile}
        />
      )}

      {/* Global Print Styles to ensure clean output */}
      <style>{`
        @media print {
          body { background: white !important; -webkit-print-color-adjust: exact; }
          .print\\:hidden { display: none !important; }
          .print\\:block { display: block !important; }
          .print\\:w-full { width: 100% !important; max-width: none !important; }
          .print\\:m-0 { margin: 0 !important; }
          .print\\:p-0 { padding: 0 !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          @page { size: A4; margin: 0mm; }
        }
      `}</style>
    </div>
  );
};

export default ResumeBuilderPage;
