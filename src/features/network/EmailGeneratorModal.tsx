import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Copy, Check, Loader2, Send } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const EMAIL_TYPES = [
  'Cold Recruiter Outreach',
  'Referral Request',
  'Post-Interview Follow-Up',
  'Offer Negotiation',
  'Networking Chat Request'
];

const EmailGeneratorModal = ({ isOpen, onClose, prefillContact = null }) => {
  const { user } = useAuth();
  
  const [emailType, setEmailType] = useState(EMAIL_TYPES[0]);
  const [recipientName, setRecipientName] = useState(prefillContact?.name || '');
  const [company, setCompany] = useState(prefillContact?.company || '');
  const [jobTitle, setJobTitle] = useState('');
  const [additionalContext, setAdditionalContext] = useState(prefillContact?.notes || '');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSubject, setGeneratedSubject] = useState('');
  const [generatedBody, setGeneratedBody] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      const token = await user.getIdToken();
      const res = await fetch(`http://localhost:5000/api/builder/email-outreach`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          type: emailType,
          context: {
            recipientName,
            company,
            jobTitle,
            additionalContext
          }
        })
      });

      if (res.ok) {
        const data = await res.json();
        setGeneratedSubject(data.subject);
        setGeneratedBody(data.body);
      } else {
        const err = await res.json();
        alert(err.message || 'Error generating email.');
      }
    } catch (e) {
      console.error(e);
      alert('Network error.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`Subject: ${generatedSubject}\n\n${generatedBody}`);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleMailTo = () => {
    const mailtoUrl = `mailto:${prefillContact?.email || ''}?subject=${encodeURIComponent(generatedSubject)}&body=${encodeURIComponent(generatedBody)}`;
    window.location.href = mailtoUrl;
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
        className="relative bg-[#13141f] border border-gray-800 rounded-[24px] shadow-2xl w-full max-w-5xl h-[85vh] flex overflow-hidden"
      >
        {/* Left Side: Inputs */}
        <div className="w-2/5 p-6 flex flex-col gap-5 border-r border-gray-800 bg-[#0c0d14] overflow-y-auto custom-scrollbar">
          <div className="flex justify-between items-center mb-2 shrink-0">
            <h2 className="text-xl font-bold text-white font-[font2] flex items-center gap-2">
              <Sparkles className="text-pink-500 w-5 h-5" /> Draft Email
            </h2>
          </div>
          
          <div className="shrink-0">
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Email Goal</label>
            <select value={emailType} onChange={e => setEmailType(e.target.value)} className="w-full bg-black/50 border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-pink-500 transition-colors appearance-none cursor-pointer">
              {EMAIL_TYPES.map(type => <option key={type} value={type} className="bg-gray-900">{type}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4 shrink-0">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Recipient Name</label>
              <input type="text" value={recipientName} onChange={e => setRecipientName(e.target.value)} placeholder="e.g. John Doe" className="w-full bg-black/50 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-pink-500 transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Company</label>
              <input type="text" value={company} onChange={e => setCompany(e.target.value)} placeholder="e.g. Google" className="w-full bg-black/50 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-pink-500 transition-colors" />
            </div>
          </div>

          <div className="shrink-0">
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Target Job Title (Optional)</label>
            <input type="text" value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="e.g. Frontend Developer" className="w-full bg-black/50 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-pink-500 transition-colors" />
          </div>

          <div className="flex-1 flex flex-col min-h-[120px]">
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Context / Notes</label>
            <textarea 
              value={additionalContext} 
              onChange={e => setAdditionalContext(e.target.value)} 
              placeholder="e.g. Met at the AI summit last week, or 'I applied online 3 days ago'" 
              className="flex-1 w-full bg-black/50 border border-gray-800 rounded-xl p-4 text-sm text-gray-300 focus:border-pink-500 outline-none resize-none custom-scrollbar"
            />
          </div>

          <button 
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full py-3.5 mt-2 bg-pink-600 hover:bg-pink-500 disabled:opacity-50 disabled:hover:bg-pink-600 rounded-xl text-white font-bold text-sm shadow-lg shadow-pink-900/20 transition-all flex justify-center items-center gap-2 shrink-0"
          >
            {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            {isGenerating ? 'Drafting...' : 'Generate Email'}
          </button>
        </div>

        {/* Right Side: Output */}
        <div className="w-3/5 p-6 flex flex-col relative bg-[#1a1b26]">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white p-2 bg-black/20 rounded-full transition-colors"><X size={18} /></button>
          
          <div className="flex justify-between items-center mb-6 pr-10">
            <h3 className="font-bold text-white text-lg">Generated Draft</h3>
            {generatedBody && (
              <div className="flex gap-2">
                <button onClick={handleCopy} className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-white transition-colors bg-white/5 px-3 py-2 rounded-lg border border-white/5">
                  {isCopied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  {isCopied ? 'Copied' : 'Copy Full'}
                </button>
                <button onClick={handleMailTo} className="flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors px-4 py-2 rounded-lg shadow-lg shadow-blue-900/20">
                  <Send size={14} /> Open in Email App
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 flex flex-col gap-4">
            {generatedBody ? (
              <>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Subject</label>
                  <input 
                    type="text" 
                    value={generatedSubject}
                    onChange={e => setGeneratedSubject(e.target.value)}
                    className="w-full bg-[#13141f] border border-gray-800 rounded-xl px-4 py-3 text-sm font-semibold text-white focus:outline-none focus:border-pink-500 transition-colors" 
                  />
                </div>
                <div className="flex-1 flex flex-col min-h-0">
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Body</label>
                  <textarea 
                    value={generatedBody}
                    onChange={e => setGeneratedBody(e.target.value)}
                    className="flex-1 w-full bg-[#13141f] border border-gray-800 rounded-xl p-4 text-[15px] leading-relaxed text-gray-300 focus:outline-none focus:border-pink-500 transition-colors resize-none custom-scrollbar font-sans"
                  />
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-4 bg-[#13141f] border border-gray-800/50 rounded-2xl border-dashed">
                <div className="w-16 h-16 rounded-full bg-gray-800/50 flex items-center justify-center">
                  <Mail className="w-8 h-8 opacity-50" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-400">Your AI-generated email will appear here.</p>
                  <p className="text-xs text-gray-600 mt-1 max-w-[250px]">Fill out the context on the left and click Generate to create a tailored outreach draft.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default EmailGeneratorModal;
