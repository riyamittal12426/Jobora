import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Settings, Palette, CreditCard, Bell, Shield, FileText, BarChart3
} from 'lucide-react';
import ProfileSection from './sections/ProfileSection';
import AppearanceSection from './sections/AppearanceSection';
import SubscriptionSection from './sections/SubscriptionSection';
import SecuritySection from './sections/SecuritySection';
import NotificationSection from './sections/NotificationSection';
import ResumeSection from './sections/ResumeSection';
import AnalyticsSection from './sections/AnalyticsSection';
import AutoApplySection from './sections/AutoApplySection';
import DashboardLayout from '@/components/UserDashboard/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import axiosInstance from '@/services/axiosInstance';

const NAV_TABS = [
  { id: 'profile', label: 'Profile Information', icon: User },
  { id: 'autoapply', label: 'Auto-Apply Settings', icon: Settings },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'subscription', label: 'Subscription & Billing', icon: CreditCard },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'resumes', label: 'Resume Management', icon: FileText },
  { id: 'analytics', label: 'Activity & Analytics', icon: BarChart3 },
];

const SECTION_COMPONENTS = {
  profile: ProfileSection,
  autoapply: AutoApplySection,
  appearance: AppearanceSection,
  subscription: SubscriptionSection,
  notifications: NotificationSection,
  security: SecuritySection,
  resumes: ResumeSection,
  analytics: AnalyticsSection,
};

export default function ProfileSettingsPage() {
  const navigate = useNavigate();
  const { dbUser, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const sidebarRef = useRef(null);
  const contentRef = useRef(null);

  const [applications, setApplications] = useState([]);
  const [avatar, setAvatar] = useState(null);

  useEffect(() => {
    if (loading || !dbUser) return;
    const fetchData = async () => {
      try {
        const response = await axiosInstance.get(`/api/applications/${dbUser.email}`);
        if (response.data) {
          setApplications(response.data);
        }
      } catch (err) {
        console.error(err);
      }

      try {
        const stored = localStorage.getItem(`jobora-profile_${dbUser.email}`);
        if (stored) {
          setAvatar(JSON.parse(stored).avatar);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, [dbUser, loading]);

  const stats = {
    sent: applications.length,
    interviews: applications.filter(a => a.status === 'Interviewing').length,
    resumeScore: 87,
    matchScore: 92,
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  const ActiveComponent = SECTION_COMPONENTS[activeTab] || ProfileSection;
  const displayName = dbUser ? [dbUser.firstName, dbUser.lastName].filter(Boolean).join(' ') || dbUser.displayName || dbUser.email : 'User';
  const displayEmail = dbUser ? dbUser.email : 'user@email.com';

  return (
    <DashboardLayout
      currentPage="settings"
      pageTitle="Account Settings"
      pageSubtitle="Configure your candidate profile snapshot, check stats, manage resumes, and adjust notifications."
    >
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 w-full">
        {/* Settings Sidebar */}
        <aside ref={sidebarRef} className="w-full lg:w-[240px] flex-shrink-0">
          <div className="space-y-4">
            {/* Mini Profile Card */}
            <div className="bg-[#181926]/60 backdrop-blur-md rounded-[24px] border border-white/10 p-5 shadow-lg">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white/10 mb-3 bg-white/5">
                  {avatar ? (
                    <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-white/5">
                      <User size={28} className="text-gray-400" />
                    </div>
                  )}
                </div>
                <h2 className="text-sm font-bold text-white font-[font2] truncate max-w-full">{displayName}</h2>
                <p className="text-[10px] text-gray-500 font-[font1] truncate max-w-full mt-0.5">{displayEmail}</p>
              </div>

              {/* Mini Stats */}
              <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-white/5">
                <div className="text-center">
                  <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">Sent</span>
                  <p className="text-xs font-bold text-white mt-0.5">{stats.sent}</p>
                </div>
                <div className="text-center">
                  <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">Interviews</span>
                  <p className="text-xs font-bold text-white mt-0.5">{stats.interviews}</p>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="bg-[#181926]/60 backdrop-blur-md rounded-[24px] border border-white/10 p-2 shadow-lg">
              {NAV_TABS.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition-all text-left mb-0.5 last:mb-0 cursor-pointer
                      ${isActive
                        ? 'bg-[#7c3aed] text-white font-semibold'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }
                    `}
                  >
                    <Icon size={14} className={isActive ? 'text-white' : 'text-gray-400'} />
                    <span className="font-[font2]">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Content Area */}
        <main ref={contentRef} className="flex-1 min-w-0 bg-[#181926]/60 border border-white/10 rounded-[28px] p-6 shadow-lg backdrop-blur-md">
          {/* Section Title */}
          <div className="mb-6 border-b border-white/5 pb-4">
            <h2 className="text-xl font-bold text-white font-[font2]">
              {NAV_TABS.find(t => t.id === activeTab)?.label}
            </h2>
            <p className="text-xs text-gray-400 font-[font1] mt-1">
              {activeTab === 'profile' && 'Manage your personal and professional information'}
              {activeTab === 'autoapply' && 'Set strict criteria to automatically skip unsuited jobs'}
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
    </DashboardLayout>
  );
}
