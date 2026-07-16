import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Sparkles, Loader2, Copy, Check, Users, Mail, Link, MessageSquare, Lightbulb, Plus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE_URL } from '../../services/apiConfig';

interface NetworkingCopilotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddContact?: (contact: { name: string; role: string; company: string; status: string }) => void;
}

const NetworkingCopilotModal = ({ isOpen, onClose, onAddContact }: NetworkingCopilotModalProps) => {
  const { user } = useAuth();

  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [strategy, setStrategy] = useState<any>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!jobDescription.trim()) return;
    setIsGenerating(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${API_BASE_URL}/api/builder/networking-strategy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userEmail: user.email,
          job: { title: jobTitle, company, description: jobDescription },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setStrategy(data);
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to generate strategy.');
      }
    } catch (e) {
      console.error(e);
      alert('Network error.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const CopyBtn = ({ text, id }: { text: string; id: string }) => (
    <button
      onClick={() => handleCopy(text, id)}
      className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors text-gray-400 cursor-pointer"
    >
      {copiedId === id ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
      {copiedId === id ? 'Copied' : 'Copy'}
    </button>
  );

  if (!isOpen) return null;

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
        {/* Left: Inputs */}
        <div className="w-2/5 p-6 flex flex-col gap-4 border-r border-gray-800 bg-[#0c0d14] overflow-y-auto custom-scrollbar">
          <div className="flex justify-between items-center mb-1">
            <h2 className="text-xl font-bold text-white font-[font2] flex items-center gap-2">
              <Sparkles className="text-[#a855f7] w-5 h-5" /> Networking Copilot
            </h2>
          </div>
          <p className="text-xs text-gray-400 -mt-2">Paste a job description to generate a full networking strategy.</p>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Job Title</label>
            <input type="text" value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="e.g. Senior Engineer"
              className="w-full bg-black/50 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#7c3aed] transition-colors" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Company</label>
            <input type="text" value={company} onChange={e => setCompany(e.target.value)} placeholder="e.g. Google"
              className="w-full bg-black/50 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#7c3aed] transition-colors" />
          </div>

          <div className="flex-1 flex flex-col min-h-[150px]">
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Job Description *</label>
            <textarea
              value={jobDescription} onChange={e => setJobDescription(e.target.value)}
              placeholder="Paste the full JD here..."
              className="flex-1 w-full bg-black/50 border border-gray-800 rounded-xl p-4 text-sm text-gray-300 focus:border-[#7c3aed] outline-none resize-none custom-scrollbar"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !jobDescription.trim()}
            className="w-full py-3.5 mt-2 bg-[#7c3aed] hover:bg-[#6d28d9] disabled:opacity-50 rounded-xl text-white font-bold text-sm shadow-lg shadow-purple-900/20 transition-all flex justify-center items-center gap-2 cursor-pointer"
          >
            {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            {isGenerating ? 'Generating Strategy...' : 'Generate Strategy'}
          </button>
        </div>

        {/* Right: Results */}
        <div className="w-3/5 p-6 flex flex-col relative bg-[#1a1b26] overflow-y-auto custom-scrollbar">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white p-2 bg-black/20 rounded-full transition-colors cursor-pointer z-10"><X size={18} /></button>

          {!strategy ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-4 bg-[#13141f] border border-gray-800/50 rounded-2xl border-dashed">
              <div className="w-16 h-16 rounded-full bg-gray-800/50 flex items-center justify-center">
                <Users className="w-8 h-8 opacity-50" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-400">Your networking strategy will appear here.</p>
                <p className="text-xs text-gray-600 mt-1 max-w-[250px]">Fill in a job description and click Generate to get suggested contacts, messages, and outreach templates.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-5 pr-6">
              <h3 className="font-bold text-white text-lg font-[font2]">Networking Strategy</h3>

              {/* Suggested Contacts */}
              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-5">
                <h4 className="text-xs font-bold text-[#a855f7] uppercase tracking-wider mb-3 flex items-center gap-2"><Users size={14} /> People to Find</h4>
                <div className="space-y-3">
                  {(strategy.suggestedContacts || []).map((c: any, i: number) => (
                    <div key={i} className="flex items-start justify-between bg-white/[0.03] border border-white/5 rounded-lg p-3">
                      <div>
                        <p className="text-sm font-bold text-white">{c.role}</p>
                        <p className="text-[10px] text-gray-400">{c.department} · {c.reason}</p>
                      </div>
                      {onAddContact && (
                        <button
                          onClick={() => onAddContact({ name: '', role: c.role, company: company || 'Company', status: 'To Contact' })}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold bg-[#7c3aed]/15 border border-[#7c3aed]/30 text-[#c4b5fd] rounded-lg hover:bg-[#7c3aed]/25 transition-colors cursor-pointer"
                        >
                          <Plus size={10} /> Add to CRM
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {strategy.linkedinSearchUrl && (
                  <a href={strategy.linkedinSearchUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-3 px-3 py-2 rounded-lg bg-[#0a66c2]/10 text-[#4c9bea] hover:bg-[#0a66c2]/20 text-xs font-semibold transition-colors border border-[#0a66c2]/20">
                    <Link size={12} /> Search on LinkedIn
                  </a>
                )}
              </div>

              {/* LinkedIn Connection Message */}
              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-5">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2"><MessageSquare size={14} /> LinkedIn Connection Request</h4>
                  <CopyBtn text={strategy.connectionMessage || ''} id="linkedin-msg" />
                </div>
                <p className="text-sm text-gray-300 leading-relaxed bg-[#13141f] border border-gray-800 rounded-lg p-3">{strategy.connectionMessage}</p>
                <p className="text-[10px] text-gray-500 mt-1">{(strategy.connectionMessage || '').length}/280 chars</p>
              </div>

              {/* Cold Email */}
              {strategy.coldEmail && (
                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-5">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-xs font-bold text-pink-400 uppercase tracking-wider flex items-center gap-2"><Mail size={14} /> Cold Email</h4>
                    <CopyBtn text={`Subject: ${strategy.coldEmail.subject}\n\n${strategy.coldEmail.body}`} id="cold-email" />
                  </div>
                  <div className="bg-[#13141f] border border-gray-800 rounded-lg p-4 space-y-2">
                    <p className="text-xs text-gray-400 font-bold">Subject: <span className="text-white font-semibold">{strategy.coldEmail.subject}</span></p>
                    <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">{strategy.coldEmail.body}</p>
                  </div>
                </div>
              )}

              {/* Referral Request */}
              {strategy.referralRequest && (
                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-5">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2"><Mail size={14} /> Referral Request</h4>
                    <CopyBtn text={`Subject: ${strategy.referralRequest.subject}\n\n${strategy.referralRequest.body}`} id="referral" />
                  </div>
                  <div className="bg-[#13141f] border border-gray-800 rounded-lg p-4 space-y-2">
                    <p className="text-xs text-gray-400 font-bold">Subject: <span className="text-white font-semibold">{strategy.referralRequest.subject}</span></p>
                    <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">{strategy.referralRequest.body}</p>
                  </div>
                </div>
              )}

              {/* Tips */}
              {(strategy.networkingTips || []).length > 0 && (
                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-5">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-2"><Lightbulb size={14} /> Networking Tips</h4>
                  <div className="space-y-2">
                    {strategy.networkingTips.map((tip: string, i: number) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-gray-300 leading-relaxed">
                        <Sparkles size={12} className="text-amber-400 mt-0.5 shrink-0" /> {tip}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default NetworkingCopilotModal;
