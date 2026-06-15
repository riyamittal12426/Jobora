import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Compass, MessageSquare, Send, Loader2, GitPullRequest, 
  Award, FileText, CheckCircle2, ChevronRight 
} from 'lucide-react';
import type { CareerRoadmap } from '../../../services/roadmapApi';
import { roadmapApi } from '../../../services/roadmapApi';

interface MentorSectionProps {
  roadmap: CareerRoadmap;
}

interface ChatMessage {
  sender: 'user' | 'mentor';
  text: string;
}

export default function MentorSection({ roadmap }: MentorSectionProps) {
  const [activeSubTab, setActiveSubTab] = useState<'goals' | 'projects' | 'resume' | 'qna'>('goals');
  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    { 
      sender: 'mentor', 
      text: `Hello! I am your AI Career Coach. I've curated this roadmap to guide you step-by-step toward your target role of **${roadmap.targetRole}**. What questions do you have about this learning path, or how you should tackle a specific technology?` 
    }
  ]);
  const [loading, setLoading] = useState(false);

  const handleAskMentor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || loading) return;

    const userText = question;
    setQuestion('');
    setChatHistory(prev => [...prev, { sender: 'user', text: userText }]);
    setLoading(true);

    try {
      const response = await roadmapApi.askMentor(roadmap.userEmail, userText);
      setChatHistory(prev => [...prev, { sender: 'mentor', text: response.answer }]);
    } catch (err: any) {
      console.error(err);
      setChatHistory(prev => [...prev, { 
        sender: 'mentor', 
        text: "I encountered an error trying to process that. Please ensure your Groq key is active and try again." 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      
      {/* Left Column: AI Mentor Avatar & Overview */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 lg:col-span-1 flex flex-col justify-between space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-tr from-violet-600 to-indigo-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
              <Compass size={24} className="animate-spin-slow" />
            </div>
            <div>
              <h3 className="font-bold font-[font2] text-white">Coach Groq</h3>
              <p className="text-[10px] uppercase font-bold text-violet-400">FAANG Career Advisor</p>
            </div>
          </div>
          
          <div className="p-4 bg-gray-950/80 border border-white/5 rounded-xl">
            <p className="text-xs text-indigo-200/80 italic leading-relaxed font-[font1]">
              "{roadmap.aiMentorSummary || 'Every technical skill is a step closer to your dream role. Focus on hands-on practice.'}"
            </p>
          </div>
        </div>

        {/* Sidebar Nav buttons */}
        <div className="space-y-2 pt-4 border-t border-white/5">
          {[
            { id: 'goals', label: 'Study Goals', icon: CheckCircle2 },
            { id: 'projects', label: 'Portfolio Projects', icon: GitPullRequest },
            { id: 'resume', label: 'Resume Upgrades', icon: FileText },
            { id: 'qna', label: 'Consult AI Mentor', icon: MessageSquare }
          ].map(sub => (
            <button
              key={sub.id}
              onClick={() => setActiveSubTab(sub.id as any)}
              className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-semibold transition-all ${
                activeSubTab === sub.id 
                  ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <span className="flex items-center gap-2">
                <sub.icon size={14} /> {sub.label}
              </span>
              <ChevronRight size={12} className="opacity-45" />
            </button>
          ))}
        </div>
      </div>

      {/* Right Column: Tabbed Detailed Panels */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 lg:col-span-3 min-h-[400px] flex flex-col">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: Goals and milestones targets */}
          {activeSubTab === 'goals' && (
            <motion.div 
              key="goals"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-6 flex-1"
            >
              <h3 className="text-lg font-bold font-[font2] text-violet-300">Weekly & Monthly Goals</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Weekly Targets */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <Sparkles size={12}/> Weekly Sprints
                  </h4>
                  <ul className="space-y-2.5">
                    {roadmap.interviewPreparationPlan?.weeklyGoals?.map((goal, idx) => (
                      <li key={idx} className="p-3 bg-gray-950/60 border border-white/5 rounded-xl text-xs text-gray-300 leading-relaxed font-[font1] flex items-start gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                        <span>{goal}</span>
                      </li>
                    )) || <p className="text-xs text-gray-500 italic">No weekly goals generated.</p>}
                  </ul>
                </div>

                {/* Monthly Targets */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-violet-400 flex items-center gap-1.5">
                    <Award size={12}/> Monthly Milestones
                  </h4>
                  <ul className="space-y-2.5">
                    {roadmap.interviewPreparationPlan?.monthlyGoals?.map((goal, idx) => (
                      <li key={idx} className="p-3 bg-gray-950/60 border border-white/5 rounded-xl text-xs text-gray-300 leading-relaxed font-[font1] flex items-start gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-1.5 shrink-0" />
                        <span>{goal}</span>
                      </li>
                    )) || <p className="text-xs text-gray-500 italic">No monthly goals generated.</p>}
                  </ul>
                </div>
              </div>

              {/* Interview prep goals */}
              {roadmap.interviewPreparationPlan?.interviewPrepPlan && (
                <div className="pt-4 border-t border-white/5 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400">Interview Prep Workflows</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {roadmap.interviewPreparationPlan.interviewPrepPlan.map((prep, idx) => (
                      <div key={idx} className="p-3 bg-gray-950/40 border border-white/5 rounded-lg text-xs text-gray-400">
                        {prep}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 2: Recommended Projects */}
          {activeSubTab === 'projects' && (
            <motion.div 
              key="projects"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-6 flex-1"
            >
              <h3 className="text-lg font-bold font-[font2] text-indigo-300">Portfolio Builders</h3>
              <p className="text-xs text-gray-400 -mt-2">
                Completing these open-source portfolio ideas will help validate your skills to prospective employers.
              </p>
              
              <div className="space-y-4">
                {roadmap.recommendedProjects?.map((proj, idx) => (
                  <div key={idx} className="p-5 bg-gray-950 border border-white/5 rounded-xl space-y-3">
                    <div className="flex flex-wrap justify-between items-start gap-2">
                      <h4 className="text-sm font-bold font-[font2] text-white capitalize">{proj.title}</h4>
                      <div className="flex flex-wrap gap-1">
                        {proj.skillsCovered?.map((sk, sidx) => (
                          <span key={sidx} className="px-2 py-0.5 text-[9px] uppercase font-bold bg-indigo-950 text-indigo-300 rounded border border-indigo-900">
                            {sk}
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed font-[font1]">{proj.description}</p>
                    {proj.githubIdea && (
                      <div className="p-3 bg-white/5 rounded-lg border border-white/5 text-[11px] text-gray-400 font-mono">
                        <span className="block text-[9px] uppercase font-bold text-indigo-400 mb-1">GitHub Repository Idea:</span>
                        {proj.githubIdea}
                      </div>
                    )}
                  </div>
                )) || <p className="text-xs text-gray-500 italic">No recommended projects available.</p>}
              </div>
            </motion.div>
          )}

          {/* TAB 3: Resume upgrades and certifications */}
          {activeSubTab === 'resume' && (
            <motion.div 
              key="resume"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-6 flex-1"
            >
              <h3 className="text-lg font-bold font-[font2] text-violet-300">Resume Improvements & Certifications</h3>
              
              <div className="space-y-6">
                {/* Resume tips */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-violet-400">ATS Optimization Suggestions</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {roadmap.interviewPreparationPlan?.resumeImprovementSuggestions?.map((tip, idx) => (
                      <div key={idx} className="p-3 bg-gray-950/60 border border-white/5 rounded-xl text-xs text-gray-300 leading-relaxed font-[font1] flex gap-2.5 items-start">
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-1.5 shrink-0" />
                        <span>{tip}</span>
                      </div>
                    )) || <p className="text-xs text-gray-500 italic">No suggestions provided.</p>}
                  </div>
                </div>

                {/* Certifications paths */}
                <div className="space-y-3 pt-4 border-t border-white/5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">Target Certification Badges</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {roadmap.certifications?.map((cert, idx) => (
                      <div key={idx} className="p-4 bg-gray-950 border border-white/5 rounded-xl flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <h5 className="text-xs font-bold text-white font-[font2]">{cert.name}</h5>
                          <p className="text-[10px] text-gray-400">{cert.provider} • {cert.difficulty}</p>
                        </div>
                        <span className="px-2 py-0.5 bg-emerald-950/40 text-emerald-400 border border-emerald-800/30 text-[9px] font-bold rounded">
                          Recommended
                        </span>
                      </div>
                    )) || <p className="text-xs text-gray-500 italic">No certifications listed.</p>}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 4: Q&A Mentor Chat Console */}
          {activeSubTab === 'qna' && (
            <motion.div 
              key="qna"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex flex-col flex-1 h-full"
            >
              <h3 className="text-lg font-bold font-[font2] text-indigo-300 mb-2">Mentor Q&A Console</h3>
              
              {/* Message History display */}
              <div className="flex-1 bg-gray-950/80 border border-white/5 rounded-xl p-4 space-y-4 max-h-[300px] overflow-y-auto pr-1 flex flex-col mb-4">
                {chatHistory.map((msg, idx) => (
                  <div 
                    key={idx}
                    className={`max-w-[85%] rounded-xl p-3 text-xs leading-relaxed ${
                      msg.sender === 'user' 
                        ? 'bg-violet-600 text-white self-end rounded-br-none' 
                        : 'bg-white/5 text-gray-300 self-start rounded-bl-none border border-white/5 whitespace-pre-wrap'
                    }`}
                  >
                    {msg.text}
                  </div>
                ))}
                
                {loading && (
                  <div className="bg-white/5 text-gray-400 border border-white/5 rounded-xl rounded-bl-none p-3 text-xs leading-relaxed self-start flex items-center gap-2">
                    <Loader2 size={12} className="animate-spin text-indigo-400" />
                    Coach is compiling response...
                  </div>
                )}
              </div>

              {/* Chat Input form */}
              <form onSubmit={handleAskMentor} className="flex gap-2">
                <input 
                  type="text"
                  placeholder="Ask Coach Groq how to study a topic or tackle a goal..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="flex-1 p-3 bg-gray-950 border border-white/5 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 transition-all font-[font1]"
                />
                <button 
                  type="submit"
                  disabled={loading || !question.trim()}
                  className="p-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-xl transition-all shadow-md shadow-indigo-600/10 flex items-center justify-center shrink-0"
                >
                  <Send size={16} />
                </button>
              </form>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

    </div>
  );
}
