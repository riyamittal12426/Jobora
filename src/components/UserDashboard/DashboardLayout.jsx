import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Terminal,
  Mic2,
  Compass,
  Sparkles,
  Settings,
  LogOut,
  ArrowLeft,
  Layers,
  ArrowRight
} from 'lucide-react';
import ShapeBlur from '../Landing/ShapeBlur';
import ResumeAnalysisModal from './ResumeAnalysisModal';
import { useAuth } from '../../contexts/AuthContext';

const DashboardLayout = ({ children, currentPage, pageTitle, pageSubtitle }) => {
  const navigate = useNavigate();
  const { user, dbUser, logOut, userName } = useAuth();
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [autoAnalyzeResume, setAutoAnalyzeResume] = useState(false);

  const handleLogout = async () => {
    await logOut();
    navigate('/auth');
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: () => <Briefcase className="w-5 h-5 opacity-80" /> },
    { id: 'jobs', label: 'Job Matches', path: '/job-recommendations', icon: () => <Briefcase className="w-5 h-5 opacity-80" /> },
    { id: 'automation', label: 'Auto-Apply', path: '/automation', icon: () => <Terminal className="w-5 h-5 opacity-80" /> },
    { id: 'mock-interview', label: 'Mock Interview', path: '/mock-interview', icon: () => <Mic2 className="w-5 h-5 opacity-80" /> },
    { id: 'roadmap', label: 'Roadmaps', path: '/roadmap', icon: () => <Compass className="w-5 h-5 opacity-80" /> },
    { id: 'settings', label: 'Settings', path: '/settings', icon: () => <Settings className="w-5 h-5 opacity-80" /> },
  ];

  const displayUser = dbUser || user;
  const avatarUrl = displayUser?.photoURL || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80";

  return (
    <div className="min-h-screen bg-black text-white relative overflow-x-hidden flex items-center justify-center p-0 md:p-6 lg:p-10 font-[font1]">
      {/* 1) Fixed visual backdrop ShapeBlur for dark theme */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <ShapeBlur
          variation={0}
          pixelRatioProp={window.devicePixelRatio || 1}
          shapeSize={0.8}
          roundness={0.5}
          borderSize={0.05}
          circleSize={0.4}
          circleEdge={1.2}
        />
      </div>

      {/* Main glassmorphism card container */}
      <div className="relative z-10 w-full max-w-[1440px] min-h-[92vh] bg-[#0c0d14]/75 backdrop-blur-2xl rounded-[32px] border border-white/10 shadow-2xl flex flex-col lg:flex-row text-white overflow-hidden">
        
        {/* SIDEBAR NAVIGATION PANEL */}
        <aside className="w-full lg:w-[260px] shrink-0 bg-[#13141f]/90 text-[#9da1b4] flex flex-col justify-between p-6 relative overflow-hidden lg:rounded-l-[32px] border-r border-white/5">
          <div className="relative z-10 flex flex-col gap-8">
            {/* Brand Logo */}
            <div className="flex items-center gap-3 mt-2 cursor-pointer" onClick={() => navigate('/dashboard')}>
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#7c3aed] to-[#c084fc] flex items-center justify-center shadow-lg shadow-purple-950/40">
                <Layers className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold font-[font2] text-white tracking-tight leading-none">JobTracker</h2>
                <span className="text-[10px] text-[#a855f7] font-semibold tracking-widest uppercase font-[font2]">AI Pilot v1.0</span>
              </div>
            </div>

            {/* Sidebar Navigation */}
            <nav className="flex flex-col gap-1.5">
              {navItems.map((item) => {
                const isActive = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => navigate(item.path)}
                    className={`flex items-center justify-between px-4 py-3 rounded-2xl shadow-sm transition-all text-sm font-[font2] cursor-pointer ${
                      isActive 
                        ? 'bg-[#7c3aed] text-white font-semibold' 
                        : 'hover:bg-white/5 hover:text-white text-[#9da1b4]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {item.icon(isActive)}
                      <span>{item.label}</span>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Quick Action "Scan Resume" Purple Card */}
          <div className="relative z-10 bg-gradient-to-br from-[#7c3aed] to-[#a855f7] text-white rounded-3xl p-5 mt-8 relative overflow-hidden flex flex-col gap-3 shadow-lg shadow-purple-900/10 border border-white/10">
            <div className="absolute right-0 bottom-0 opacity-20 pointer-events-none">
              <svg width="120" height="120" viewBox="0 0 100 100" fill="none">
                <circle cx="90" cy="90" r="50" stroke="white" strokeWidth="8"/>
                <circle cx="90" cy="90" r="70" stroke="white" strokeWidth="6" strokeDasharray="5 5"/>
              </svg>
            </div>
            
            <button
              onClick={() => {
                setAutoAnalyzeResume(true);
                setIsAnalysisModalOpen(true);
              }}
              className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md cursor-pointer transition-transform hover:scale-110 duration-200 active:scale-95 group border border-gray-100"
            >
              <ArrowRight className="w-5 h-5 text-[#7c3aed] transform transition-transform group-hover:rotate-45" />
            </button>

            <div>
              <p className="font-extrabold text-base tracking-tight leading-snug font-[font2]">AI Resume Analysis</p>
              <p className="text-[11px] opacity-75 font-semibold mt-0.5 leading-normal">Score ATS compatibility & get recruiter feedback.</p>
            </div>
          </div>
        </aside>

        {/* MAIN PANEL CONTENT BODY */}
        <main className="flex-1 flex flex-col p-4 md:p-8 overflow-y-auto max-h-[100vh]">
          {/* Top row: Page header title / navigation back arrow / avatar */}
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              {currentPage !== 'dashboard' && (
                <button
                  onClick={() => navigate('/dashboard')}
                  className="p-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-gray-300 hover:text-white transition-all cursor-pointer mr-1.5"
                  title="Back to Dashboard"
                >
                  <ArrowLeft size={16} />
                </button>
              )}
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight font-[font2] text-white">
                  {pageTitle || `Welcome back, ${userName || 'Taylor'}`}
                </h1>
                <p className="text-gray-400 text-xs font-semibold mt-1">
                  {pageSubtitle || 'Manage your career pilot & optimize job applications.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 px-3.5 py-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-xs font-semibold text-gray-300 hover:text-white transition-all cursor-pointer font-[font2]"
              >
                <LogOut size={13} />
                Log Out
              </button>

              <div className="relative w-11 h-11 shrink-0 rounded-full border border-white/10 bg-violet-900/20 flex items-center justify-center overflow-hidden cursor-pointer shadow-md group">
                <img 
                  src={avatarUrl} 
                  alt="User profile avatar"
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-[#7c3aed]/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </header>

          {/* Children views */}
          <div className="flex-1 flex flex-col gap-6">
            {children}
          </div>
        </main>
      </div>

      {/* Shared Resume Analysis Modal */}
      <ResumeAnalysisModal
        isOpen={isAnalysisModalOpen}
        onClose={() => {
          setIsAnalysisModalOpen(false);
          setAutoAnalyzeResume(false);
        }}
        user={displayUser}
        autoAnalyze={autoAnalyzeResume}
      />
    </div>
  );
};

export default DashboardLayout;
