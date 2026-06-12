import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Settings, Palette, CreditCard, Bell, Shield, FileText, BarChart3,
  ChevronLeft, Send, Calendar, Sparkles, Target, Menu, X
} from 'lucide-react';
import gsap from 'gsap';

import ProfileSection from './sections/ProfileSection';
import AppearanceSection from './sections/AppearanceSection';
import SubscriptionSection from './sections/SubscriptionSection';
import SecuritySection from './sections/SecuritySection';
import NotificationSection from './sections/NotificationSection';
import ResumeSection from './sections/ResumeSection';
import AnalyticsSection from './sections/AnalyticsSection';

const NAV_TABS = [
  { id: 'profile', label: 'Profile Information', icon: User },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'subscription', label: 'Subscription & Billing', icon: CreditCard },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'resumes', label: 'Resume Management', icon: FileText },
  { id: 'analytics', label: 'Activity & Analytics', icon: BarChart3 },
];

const SECTION_COMPONENTS = {
  profile: ProfileSection,
  appearance: AppearanceSection,
  subscription: SubscriptionSection,
  notifications: NotificationSection,
  security: SecuritySection,
  resumes: ResumeSection,
  analytics: AnalyticsSection,
};

export default function ProfileSettingsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const sidebarRef = useRef(null);
  const contentRef = useRef(null);
  const headerRef = useRef(null);

  // Get user data
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const profile = JSON.parse(localStorage.getItem('jobora-profile') || '{}');
  const applications = JSON.parse(localStorage.getItem('applications') || '[]');

  const stats = {
    sent: applications.length,
    interviews: applications.filter(a => a.status === 'Interviewing').length,
    resumeScore: 87,
    matchScore: 92,
  };

  useEffect(() => {
    // Entrance animations
    if (headerRef.current) {
      gsap.fromTo(headerRef.current, { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out' });
    }
    if (sidebarRef.current) {
      gsap.fromTo(sidebarRef.current, { x: -30, opacity: 0 }, { x: 0, opacity: 1, duration: 0.6, ease: 'power3.out', delay: 0.1 });
    }
    if (contentRef.current) {
      gsap.fromTo(contentRef.current, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out', delay: 0.2 });
    }
  }, []);

  // Animate content on tab change
  useEffect(() => {
    if (contentRef.current) {
      gsap.fromTo(contentRef.current,
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }
      );
    }
  }, [activeTab]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  const ActiveComponent = SECTION_COMPONENTS[activeTab] || ProfileSection;
  const displayName = profile.fullName || [user.firstName, user.lastName].filter(Boolean).join(' ') || 'User';
  const displayEmail = profile.email || user.email || 'user@email.com';

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white font-[font1]">
      {/* Header */}
      <header ref={headerRef} className="sticky top-0 z-50 backdrop-blur-xl bg-[#0a0a0b]/80 border-b border-white/[0.06]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 rounded-xl hover:bg-white/5 transition-all text-gray-400 hover:text-white"
              aria-label="Back to dashboard"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--accent-primary)' }}>
                <span className="text-white font-bold text-sm font-[font2]">J</span>
              </div>
              <div>
                <h1 className="text-sm font-bold text-white font-[font2]">Settings</h1>
                <p className="text-[10px] text-gray-500">Manage your JOBORA account</p>
              </div>
            </div>
          </div>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl hover:bg-white/5 transition-all text-gray-400"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Sidebar */}
          <aside
            ref={sidebarRef}
            className={`lg:w-[280px] flex-shrink-0 lg:block
              ${mobileMenuOpen ? 'block' : 'hidden'}
            `}
          >
            <div className="lg:sticky lg:top-20 space-y-4">
              {/* Profile Card */}
              <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/[0.06] p-5">
                <div className="flex flex-col items-center text-center">
                  {/* Avatar */}
                  <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-white/10 mb-3 bg-white/5">
                    {profile.avatar ? (
                      <img src={profile.avatar} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-white/5 to-white/[0.02]">
                        <User size={32} className="text-gray-600" />
                      </div>
                    )}
                  </div>
                  <h2 className="text-base font-bold text-white font-[font2] truncate max-w-full">{displayName}</h2>
                  <p className="text-xs text-gray-500 font-[font1] truncate max-w-full">{displayEmail}</p>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-2 mt-5">
                  <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.04] text-center">
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                      <Send size={10} className="text-gray-500" />
                      <span className="text-[10px] text-gray-500 font-[font1]">Sent</span>
                    </div>
                    <p className="text-sm font-bold text-white font-[font2]">{stats.sent}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.04] text-center">
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                      <Calendar size={10} className="text-gray-500" />
                      <span className="text-[10px] text-gray-500 font-[font1]">Interviews</span>
                    </div>
                    <p className="text-sm font-bold text-white font-[font2]">{stats.interviews}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.04] text-center">
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                      <Sparkles size={10} className="text-gray-500" />
                      <span className="text-[10px] text-gray-500 font-[font1]">Resume</span>
                    </div>
                    <p className="text-sm font-bold text-emerald-400 font-[font2]">{stats.resumeScore}%</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.04] text-center">
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                      <Target size={10} className="text-gray-500" />
                      <span className="text-[10px] text-gray-500 font-[font1]">AI Match</span>
                    </div>
                    <p className="text-sm font-bold text-cyan-400 font-[font2]">{stats.matchScore}%</p>
                  </div>
                </div>
              </div>

              {/* Navigation Tabs */}
              <nav className="bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/[0.06] p-2">
                {NAV_TABS.map(tab => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all text-left mb-0.5 last:mb-0
                        ${isActive
                          ? 'bg-[var(--accent-bg)] text-white font-semibold'
                          : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
                        }
                      `}
                      style={isActive ? { borderLeft: `2px solid var(--accent-primary)` } : { borderLeft: '2px solid transparent' }}
                    >
                      <Icon size={16} className={isActive ? '' : 'text-gray-500'} style={isActive ? { color: 'var(--accent-primary)' } : {}} />
                      <span className="font-[font2] text-[13px]">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Content Area */}
          <main ref={contentRef} className="flex-1 min-w-0">
            {/* Section Title */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white font-[font2]">
                {NAV_TABS.find(t => t.id === activeTab)?.label}
              </h2>
              <p className="text-sm text-gray-500 font-[font1] mt-1">
                {activeTab === 'profile' && 'Manage your personal and professional information'}
                {activeTab === 'appearance' && 'Customize the look and feel of your dashboard'}
                {activeTab === 'subscription' && 'Manage your subscription plan and billing'}
                {activeTab === 'notifications' && 'Choose what notifications you receive'}
                {activeTab === 'security' && 'Protect your account with advanced security options'}
                {activeTab === 'resumes' && 'Upload, manage, and track your resume versions'}
                {activeTab === 'analytics' && 'Track your job search progress and performance'}
              </p>
            </div>

            <ActiveComponent />
          </main>
        </div>
      </div>
    </div>
  );
}
