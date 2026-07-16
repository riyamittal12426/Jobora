import React, { useState, useEffect, useRef } from 'react';
import { Save, AlertTriangle, Briefcase, Globe, DollarSign, Building } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import axiosInstance from '@/services/axiosInstance';
import { useToast } from '../ToastProvider';
import gsap from 'gsap';

export default function AutoApplySection() {
  const { dbUser, loading: authLoading } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const sectionRef = useRef(null);

  const [dealbreakers, setDealbreakers] = useState({
    minSalary: '',
    remoteOnly: false,
    noVisaSponsorship: false,
    noStaffingAgencies: false
  });

  useEffect(() => {
    if (sectionRef.current) {
      gsap.fromTo(sectionRef.current, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 });
    }
  }, []);

  useEffect(() => {
    if (authLoading || !dbUser) return;
    const fetchProfile = async () => {
      try {
        const res = await axiosInstance.get(`/api/applications/autofill/profile/${dbUser.email}`);
        if (res.data && res.data.dealbreakers) {
          setDealbreakers({
            minSalary: res.data.dealbreakers.minSalary || '',
            remoteOnly: res.data.dealbreakers.remoteOnly || false,
            noVisaSponsorship: res.data.dealbreakers.noVisaSponsorship || false,
            noStaffingAgencies: res.data.dealbreakers.noStaffingAgencies || false
          });
        }
      } catch (err) {
        console.error('Failed to fetch profile dealbreakers:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [dbUser, authLoading]);

  const handleSave = async () => {
    if (!dbUser) return;
    setSaving(true);
    try {
      const payload = {
        dealbreakers: {
          minSalary: dealbreakers.minSalary ? Number(dealbreakers.minSalary) : null,
          remoteOnly: dealbreakers.remoteOnly,
          noVisaSponsorship: dealbreakers.noVisaSponsorship,
          noStaffingAgencies: dealbreakers.noStaffingAgencies
        }
      };
      await axiosInstance.put(`/api/applications/autofill/profile/${dbUser.email}`, payload);
      toast.success('Dealbreakers saved successfully', 'Auto-Apply Settings');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save settings', 'Error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (key) => {
    setDealbreakers(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#7c3aed]"></div>
      </div>
    );
  }

  return (
    <div ref={sectionRef} className="space-y-6">
      <div className="bg-[#181926]/60 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
            <AlertTriangle size={20} className="text-[#a855f7]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white font-[font2]">Auto-Apply Dealbreakers</h3>
            <p className="text-xs text-gray-400 font-[font1]">Strict criteria to skip unsuited jobs immediately</p>
          </div>
        </div>

        <div className="space-y-5 mt-6 font-[font1]">
          
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase text-gray-400 tracking-wider font-[font2] flex items-center gap-2">
              <DollarSign size={14} className="text-emerald-400" /> Minimum Salary (USD)
            </label>
            <input
              type="number"
              value={dealbreakers.minSalary}
              onChange={(e) => setDealbreakers({ ...dealbreakers, minSalary: e.target.value })}
              placeholder="e.g. 100000"
              className="w-full p-3.5 bg-white/5 rounded-2xl border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed]/30 transition-all text-sm"
            />
            <p className="text-[10px] text-gray-500">Auto-apply will skip jobs where the maximum salary is below this amount.</p>
          </div>

          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
            <div className="flex items-start gap-3">
              <Globe size={18} className="text-blue-400 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-white">Remote Only</h4>
                <p className="text-[10px] text-gray-500">Skip jobs that are on-site or hybrid</p>
              </div>
            </div>
            <button 
              onClick={() => handleToggle('remoteOnly')}
              className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${dealbreakers.remoteOnly ? 'bg-[#7c3aed]' : 'bg-gray-600'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${dealbreakers.remoteOnly ? 'left-5' : 'left-1'}`}></div>
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
            <div className="flex items-start gap-3">
              <Globe size={18} className="text-amber-400 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-white">No Visa Sponsorship</h4>
                <p className="text-[10px] text-gray-500">Skip jobs that state they cannot sponsor work visas</p>
              </div>
            </div>
            <button 
              onClick={() => handleToggle('noVisaSponsorship')}
              className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${dealbreakers.noVisaSponsorship ? 'bg-[#7c3aed]' : 'bg-gray-600'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${dealbreakers.noVisaSponsorship ? 'left-5' : 'left-1'}`}></div>
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
            <div className="flex items-start gap-3">
              <Building size={18} className="text-red-400 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-white">No Staffing Agencies</h4>
                <p className="text-[10px] text-gray-500">Skip jobs posted by recruiting/staffing agencies</p>
              </div>
            </div>
            <button 
              onClick={() => handleToggle('noStaffingAgencies')}
              className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${dealbreakers.noStaffingAgencies ? 'bg-[#7c3aed]' : 'bg-gray-600'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${dealbreakers.noStaffingAgencies ? 'left-5' : 'left-1'}`}></div>
            </button>
          </div>

        </div>
      </div>

      <div className="flex justify-end mt-6">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg hover:shadow-purple-500/25 disabled:opacity-50 text-sm flex items-center gap-2 cursor-pointer font-[font2]"
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <Save size={16} />
          )}
          <span>{saving ? 'Saving...' : 'Save Dealbreakers'}</span>
        </button>
      </div>
    </div>
  );
}
