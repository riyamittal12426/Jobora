import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Copy, Check, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE_URL } from '../../services/apiConfig';

const CoverLetterModal = ({ isOpen, onClose, profile }) => {
  const { user } = useAuth();
  const [jobDescription, setJobDescription] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  const handleGenerate = async () => {
    if (!jobDescription) return alert('Please paste a job description.');
    try {
      setIsGenerating(true);
      const token = await user.getIdToken();
      const res = await fetch(`${API_BASE_URL}/api/builder/cover-letter`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          profile,
          jobDescription,
          companyName,
          jobTitle
        })
      });

      if (res.ok) {
        const data = await res.json();
        setCoverLetter(data.coverLetter);
      } else {
        const err = await res.json();
        alert(err.message || 'Error generating cover letter.');
      }
    } catch (e) {
      console.error(e);
      alert('Network error.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(coverLetter);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative bg-[#13141f] border border-gray-800 rounded-[24px] shadow-2xl w-full max-w-4xl h-[80vh] flex overflow-hidden"
      >
        {/* Left Side: Inputs */}
        <div className="w-1/2 p-6 flex flex-col gap-4 border-r border-gray-800 bg-[#0c0d14]">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-bold text-white font-[font2] flex items-center gap-2">
              <Sparkles className="text-indigo-500 w-5 h-5" /> Cover Letter
            </h2>
          </div>
          
          <p className="text-xs text-gray-400">
            Paste the job description below. The AI will use only your <strong>active/visible</strong> resume bullet points to write a highly targeted cover letter.
          </p>

          <div className="grid grid-cols-2 gap-3 mt-2">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Target Role</label>
              <input type="text" value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="e.g. Frontend Engineer" className="w-full bg-black/50 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Company</label>
              <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="e.g. Acme Corp" className="w-full bg-black/50 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none" />
            </div>
          </div>

          <div className="flex-1 flex flex-col min-h-0 mt-2">
            <label className="block text-xs font-semibold text-gray-400 mb-1">Job Description *</label>
            <textarea 
              value={jobDescription} 
              onChange={e => setJobDescription(e.target.value)} 
              placeholder="Paste the full job description here..." 
              className="flex-1 w-full bg-black/50 border border-gray-800 rounded-lg p-3 text-sm text-gray-300 focus:border-indigo-500 outline-none resize-none custom-scrollbar"
            />
          </div>

          <button 
            onClick={handleGenerate}
            disabled={isGenerating || !jobDescription}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 rounded-xl text-white font-bold text-sm shadow-lg shadow-indigo-900/20 transition-all flex justify-center items-center gap-2"
          >
            {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            {isGenerating ? 'Drafting Letter...' : 'Generate Magic Letter'}
          </button>
        </div>

        {/* Right Side: Output */}
        <div className="w-1/2 p-6 flex flex-col relative bg-[#1a1b26]">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white p-2 bg-black/20 rounded-full transition-colors"><X size={18} /></button>
          
          <div className="flex justify-between items-center mb-4 pr-10">
            <h3 className="font-bold text-white">Generated Letter</h3>
            {coverLetter && (
              <button onClick={handleCopy} className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-white transition-colors bg-white/5 px-3 py-1.5 rounded-lg">
                {isCopied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                {isCopied ? 'Copied' : 'Copy'}
              </button>
            )}
          </div>

          <div className="flex-1 bg-white/[0.03] border border-white/5 rounded-xl p-4 overflow-y-auto custom-scrollbar">
            {coverLetter ? (
              <textarea 
                value={coverLetter}
                onChange={e => setCoverLetter(e.target.value)}
                className="w-full h-full bg-transparent text-gray-300 text-sm leading-relaxed resize-none outline-none font-sans"
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-3">
                <FileText className="w-12 h-12 opacity-20" />
                <p className="text-sm">Your AI-generated cover letter will appear here.</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default CoverLetterModal;
