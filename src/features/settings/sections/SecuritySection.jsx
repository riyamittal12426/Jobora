import React, { useRef, useEffect, useState } from 'react';
import { Shield, Lock, Smartphone, MapPin, Clock, Monitor, LogOut, Trash2, Eye, EyeOff, Check, AlertTriangle } from 'lucide-react';
import gsap from 'gsap';
import { useToast } from '../ToastProvider';
import ConfirmModal from '../ConfirmModal';
import { useNavigate } from 'react-router-dom';

const MOCK_DEVICES = [
  { id: 1, name: 'Chrome on Windows', location: 'New Delhi, India', time: '2 minutes ago', icon: Monitor, current: true },
  { id: 2, name: 'Safari on iPhone', location: 'New Delhi, India', time: '1 hour ago', icon: Smartphone, current: false },
  { id: 3, name: 'Firefox on MacOS', location: 'Mumbai, India', time: '3 days ago', icon: Monitor, current: false },
];

const MOCK_ACTIVITY = [
  { id: 1, action: 'Logged in', device: 'Chrome on Windows', location: 'New Delhi', ip: '103.xx.xx.42', time: '2 min ago' },
  { id: 2, action: 'Password changed', device: 'Chrome on Windows', location: 'New Delhi', ip: '103.xx.xx.42', time: '2 days ago' },
  { id: 3, action: 'Logged in', device: 'Safari on iPhone', location: 'New Delhi', ip: '103.xx.xx.55', time: '3 days ago' },
  { id: 4, action: 'Logged in', device: 'Firefox on MacOS', location: 'Mumbai', ip: '49.xx.xx.18', time: '5 days ago' },
];

export default function SecuritySection() {
  const toast = useToast();
  const navigate = useNavigate();
  const sectionRef = useRef(null);
  const cardsRef = useRef([]);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [twoFaEnabled, setTwoFaEnabled] = useState(false);
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [passwordStrength, setPasswordStrength] = useState(0);

  useEffect(() => {
    const cards = cardsRef.current.filter(Boolean);
    gsap.fromTo(cards,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: 'power3.out' }
    );
  }, []);

  const calcStrength = (pass) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const handlePasswordChange = (field, value) => {
    setPasswordForm(prev => ({ ...prev, [field]: value }));
    if (field === 'new') setPasswordStrength(calcStrength(value));
  };

  const handleChangePassword = () => {
    if (!passwordForm.current) return toast.error('Please enter your current password.');
    if (passwordForm.new.length < 8) return toast.error('New password must be at least 8 characters.');
    if (passwordForm.new !== passwordForm.confirm) return toast.error('Passwords do not match.');
    setPasswordForm({ current: '', new: '', confirm: '' });
    setPasswordStrength(0);
    toast.success('Password updated successfully!', 'Security');
  };

  const handleDeleteAccount = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('applications');
    localStorage.removeItem('events');
    localStorage.removeItem('jobora-profile');
    localStorage.removeItem('jobora-settings');
    localStorage.removeItem('jobora-plan');
    navigate('/auth');
  };

  const handleLogoutAll = () => {
    toast.success('Logged out from all other devices.', 'Security');
  };

  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-emerald-500'];
  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong'];

  const PasswordInput = ({ label, value, show, onToggle, field, placeholder }) => (
    <div>
      <label className="block text-xs text-gray-500 mb-1.5 font-[font1] uppercase tracking-wider">{label}</label>
      <div className="relative">
        <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => handlePasswordChange(field, e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-600 focus:border-[var(--accent-primary)]/50 focus:ring-1 focus:ring-[var(--accent-primary)]/30 focus:outline-none transition-all font-[font1]"
        />
        <button onClick={onToggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );

  return (
    <div ref={sectionRef} className="space-y-6">
      {/* Change Password */}
      <div ref={el => cardsRef.current[0] = el} className="bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/[0.06] p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
            <Lock size={20} className="text-gray-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white font-[font2]">Change Password</h3>
            <p className="text-xs text-gray-500 font-[font1]">Update your password regularly for security</p>
          </div>
        </div>

        <div className="space-y-4 max-w-lg">
          <PasswordInput label="Current Password" value={passwordForm.current} show={showCurrentPass}
            onToggle={() => setShowCurrentPass(!showCurrentPass)} field="current" placeholder="Enter current password" />
          <PasswordInput label="New Password" value={passwordForm.new} show={showNewPass}
            onToggle={() => setShowNewPass(!showNewPass)} field="new" placeholder="Enter new password" />

          {/* Password Strength */}
          {passwordForm.new && (
            <div className="space-y-1.5">
              <div className="flex gap-1">
                {[0, 1, 2, 3].map(i => (
                  <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i < passwordStrength ? strengthColors[passwordStrength - 1] : 'bg-white/10'}`} />
                ))}
              </div>
              <p className={`text-xs font-[font1] ${passwordStrength <= 1 ? 'text-red-400' : passwordStrength === 2 ? 'text-yellow-400' : 'text-emerald-400'}`}>
                {strengthLabels[passwordStrength - 1] || 'Too short'}
              </p>
            </div>
          )}

          <PasswordInput label="Confirm New Password" value={passwordForm.confirm} show={showConfirmPass}
            onToggle={() => setShowConfirmPass(!showConfirmPass)} field="confirm" placeholder="Confirm new password" />

          {passwordForm.confirm && passwordForm.new !== passwordForm.confirm && (
            <p className="text-red-400 text-xs font-[font1]">Passwords do not match</p>
          )}

          <button
            onClick={handleChangePassword}
            className="px-5 py-2.5 rounded-xl text-white font-semibold text-sm transition-all hover:shadow-lg font-[font2]"
            style={{ backgroundColor: 'var(--accent-primary)', boxShadow: `0 4px 16px var(--accent-glow)` }}
          >
            Update Password
          </button>
        </div>
      </div>

      {/* Two-Factor Authentication */}
      <div ref={el => cardsRef.current[1] = el} className="bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/[0.06] p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
              <Shield size={20} className="text-gray-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-[font2]">Two-Factor Authentication</h3>
              <p className="text-xs text-gray-500 font-[font1]">Add an extra layer of security to your account</p>
            </div>
          </div>
          {/* Toggle */}
          <button
            onClick={() => {
              setTwoFaEnabled(!twoFaEnabled);
              toast.success(twoFaEnabled ? '2FA disabled' : '2FA enabled', 'Security');
            }}
            className={`relative w-12 h-6 rounded-full transition-all duration-300 ${twoFaEnabled ? '' : 'bg-white/10'}`}
            style={twoFaEnabled ? { backgroundColor: 'var(--accent-primary)' } : {}}
          >
            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300
              ${twoFaEnabled ? 'left-[26px]' : 'left-0.5'}`}
            />
          </button>
        </div>
        {twoFaEnabled && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <div className="flex items-center gap-2">
              <Check size={14} className="text-emerald-400" />
              <span className="text-sm text-emerald-400 font-[font1]">Two-factor authentication is enabled</span>
            </div>
          </div>
        )}
      </div>

      {/* Active Devices */}
      <div ref={el => cardsRef.current[2] = el} className="bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/[0.06] p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
            <Monitor size={20} className="text-gray-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white font-[font2]">Active Devices</h3>
            <p className="text-xs text-gray-500 font-[font1]">Manage devices that are signed in to your account</p>
          </div>
        </div>

        <div className="space-y-3">
          {MOCK_DEVICES.map(device => {
            const DevIcon = device.icon;
            return (
              <div key={device.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-white/10 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                    <DevIcon size={18} className="text-gray-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white font-[font2]">{device.name}</span>
                      {device.current && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 font-[font2]">This Device</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500 font-[font1]">
                      <span className="flex items-center gap-1"><MapPin size={10} />{device.location}</span>
                      <span className="flex items-center gap-1"><Clock size={10} />{device.time}</span>
                    </div>
                  </div>
                </div>
                {!device.current && (
                  <button
                    onClick={() => toast.info(`Revoked access for ${device.name}`)}
                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/20 text-xs text-gray-400 hover:text-red-400 transition-all font-[font2]"
                  >
                    Revoke
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Login Activity */}
      <div ref={el => cardsRef.current[3] = el} className="bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/[0.06] p-6">
        <h3 className="text-lg font-bold text-white mb-4 font-[font2]">Login Activity</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left py-2 pr-4 text-xs text-gray-500 font-[font1] uppercase tracking-wider">Action</th>
                <th className="text-left py-2 pr-4 text-xs text-gray-500 font-[font1] uppercase tracking-wider">Device</th>
                <th className="text-left py-2 pr-4 text-xs text-gray-500 font-[font1] uppercase tracking-wider hidden sm:table-cell">Location</th>
                <th className="text-left py-2 pr-4 text-xs text-gray-500 font-[font1] uppercase tracking-wider hidden md:table-cell">IP</th>
                <th className="text-left py-2 text-xs text-gray-500 font-[font1] uppercase tracking-wider">Time</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_ACTIVITY.map(act => (
                <tr key={act.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                  <td className="py-2.5 pr-4 text-white font-[font2] text-xs">{act.action}</td>
                  <td className="py-2.5 pr-4 text-gray-400 font-[font1] text-xs">{act.device}</td>
                  <td className="py-2.5 pr-4 text-gray-500 font-[font1] text-xs hidden sm:table-cell">{act.location}</td>
                  <td className="py-2.5 pr-4 text-gray-600 font-mono text-xs hidden md:table-cell">{act.ip}</td>
                  <td className="py-2.5 text-gray-500 font-[font1] text-xs">{act.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Danger Zone */}
      <div ref={el => cardsRef.current[4] = el} className="bg-red-500/[0.03] backdrop-blur-xl rounded-2xl border border-red-500/10 p-6">
        <h3 className="text-lg font-bold text-red-400 mb-4 font-[font2] flex items-center gap-2">
          <AlertTriangle size={20} /> Danger Zone
        </h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setShowLogoutModal(true)}
            className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-semibold text-sm transition-all flex items-center gap-2 font-[font2]"
          >
            <LogOut size={16} /> Logout From All Devices
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-5 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-semibold text-sm transition-all flex items-center gap-2 font-[font2]"
          >
            <Trash2 size={16} /> Delete Account
          </button>
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteAccount}
        title="Delete Account?"
        message="This will permanently delete your account, all your data, applications, and resumes. This action cannot be undone."
        confirmText="Delete Forever"
        cancelText="Keep Account"
        variant="danger"
      />

      <ConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogoutAll}
        title="Logout From All Devices?"
        message="This will end all active sessions except your current one. Other devices will need to sign in again."
        confirmText="Logout All"
        cancelText="Cancel"
        variant="warning"
      />
    </div>
  );
}
