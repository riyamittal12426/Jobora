import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, Upload, X, User, Mail, Phone, MapPin, GraduationCap, Calendar, Briefcase, Globe, Plus, Trash2, Save, Edit3, XCircle } from 'lucide-react';
import gsap from 'gsap';
import { useToast } from '../ToastProvider';

const Github = ({ size = 24, className, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const Linkedin = ({ size = 24, className, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const DEFAULT_PROFILE = {
  fullName: '',
  email: '',
  phone: '',
  college: '',
  degree: '',
  graduationYear: '',
  location: '',
  skills: [],
  experienceLevel: 'Entry Level',
  preferredRoles: [],
  linkedinUrl: '',
  githubUrl: '',
  portfolioUrl: '',
  avatar: null,
};

export default function ProfileSection() {
  const toast = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState(() => {
    try {
      const stored = localStorage.getItem('jobora-profile');
      if (stored) return { ...DEFAULT_PROFILE, ...JSON.parse(stored) };
      // Try to populate from existing user data
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return {
        ...DEFAULT_PROFILE,
        fullName: [user.firstName, user.lastName].filter(Boolean).join(' '),
        email: user.email || '',
        phone: user.phone || '',
        location: user.address || '',
      };
    } catch { return DEFAULT_PROFILE; }
  });
  const [editForm, setEditForm] = useState(profile);
  const [newSkill, setNewSkill] = useState('');
  const [newRole, setNewRole] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [errors, setErrors] = useState({});

  const sectionRef = useRef(null);
  const cardsRef = useRef([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (sectionRef.current) {
      const cards = cardsRef.current.filter(Boolean);
      gsap.fromTo(cards,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: 'power3.out' }
      );
    }
  }, []);

  const validate = () => {
    const errs = {};
    if (!editForm.fullName.trim()) errs.fullName = 'Name is required';
    if (!editForm.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email)) errs.email = 'Invalid email';
    if (editForm.phone && !/^[\d\s\-+()]{7,20}$/.test(editForm.phone)) errs.phone = 'Invalid phone';
    if (editForm.linkedinUrl && !editForm.linkedinUrl.includes('linkedin.com')) errs.linkedinUrl = 'Invalid LinkedIn URL';
    if (editForm.githubUrl && !editForm.githubUrl.includes('github.com')) errs.githubUrl = 'Invalid GitHub URL';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) {
      toast.error('Please fix the errors before saving.');
      return;
    }
    setProfile(editForm);
    localStorage.setItem('jobora-profile', JSON.stringify(editForm));
    setIsEditing(false);
    toast.success('Profile updated successfully!', 'Saved');
  };

  const handleCancel = () => {
    setEditForm(profile);
    setErrors({});
    setIsEditing(false);
  };

  const handleEdit = () => {
    setEditForm(profile);
    setIsEditing(true);
  };

  const addSkill = () => {
    if (newSkill.trim() && !editForm.skills.includes(newSkill.trim())) {
      setEditForm(prev => ({ ...prev, skills: [...prev.skills, newSkill.trim()] }));
      setNewSkill('');
    }
  };

  const removeSkill = (skill) => {
    setEditForm(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skill) }));
  };

  const addRole = () => {
    if (newRole.trim() && !editForm.preferredRoles.includes(newRole.trim())) {
      setEditForm(prev => ({ ...prev, preferredRoles: [...prev.preferredRoles, newRole.trim()] }));
      setNewRole('');
    }
  };

  const removeRole = (role) => {
    setEditForm(prev => ({ ...prev, preferredRoles: prev.preferredRoles.filter(r => r !== role) }));
  };

  // Avatar handlers
  const handleAvatarUpload = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const avatarData = e.target.result;
      setEditForm(prev => ({ ...prev, avatar: avatarData }));
      if (!isEditing) {
        const updated = { ...profile, avatar: avatarData };
        setProfile(updated);
        localStorage.setItem('jobora-profile', JSON.stringify(updated));
        toast.success('Profile photo updated!');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setEditForm(prev => ({ ...prev, avatar: null }));
    if (!isEditing) {
      const updated = { ...profile, avatar: null };
      setProfile(updated);
      localStorage.setItem('jobora-profile', JSON.stringify(updated));
      toast.info('Profile photo removed.');
    }
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleAvatarUpload(file);
  }, [isEditing, profile]);

  const currentData = isEditing ? editForm : profile;

  const InputField = ({ icon: Icon, label, name, type = 'text', placeholder, error }) => (
    <div>
      <label className="block text-xs text-gray-500 mb-1.5 font-[font1] uppercase tracking-wider">{label}</label>
      <div className="relative">
        <Icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type={type}
          value={currentData[name] || ''}
          onChange={(e) => {
            setEditForm(prev => ({ ...prev, [name]: e.target.value }));
            if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
          }}
          disabled={!isEditing}
          placeholder={placeholder}
          className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-all font-[font1]
            ${isEditing
              ? 'bg-white/5 border-white/10 text-white placeholder-gray-600 focus:border-[var(--accent-primary)]/50 focus:ring-1 focus:ring-[var(--accent-primary)]/30 focus:outline-none'
              : 'bg-white/[0.02] border-white/5 text-gray-300 cursor-default'
            }
            ${error ? '!border-red-500/50 !ring-1 !ring-red-500/30' : ''}
          `}
        />
      </div>
      {error && <p className="text-red-400 text-xs mt-1 font-[font1]">{error}</p>}
    </div>
  );

  return (
    <div ref={sectionRef} className="space-y-6">
      {/* Profile Photo Section */}
      <div ref={el => cardsRef.current[0] = el} className="bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/[0.06] p-6">
        <h3 className="text-lg font-bold text-white mb-4 font-[font2]">Profile Photo</h3>
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Avatar */}
          <div
            className={`relative w-28 h-28 rounded-2xl overflow-hidden border-2 transition-all flex-shrink-0
              ${dragOver ? 'border-[var(--accent-primary)] bg-[var(--accent-bg)] scale-105' : 'border-white/10 bg-white/5'}
            `}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            {currentData.avatar ? (
              <img src={currentData.avatar} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-white/5 to-white/[0.02]">
                <User size={40} className="text-gray-600" />
              </div>
            )}
            {/* Hover overlay */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
            >
              <Camera size={24} className="text-white" />
            </div>
          </div>

          <div className="flex-1 text-center sm:text-left">
            <p className="text-sm text-gray-400 mb-3 font-[font1]">
              Drag & drop or click to upload. JPG, PNG, or WebP. Max 5MB.
            </p>
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-gray-300 transition-all flex items-center gap-2 font-[font2]"
              >
                <Upload size={14} /> Upload
              </button>
              {currentData.avatar && (
                <button
                  onClick={handleRemoveAvatar}
                  className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-sm text-red-400 transition-all flex items-center gap-2 font-[font2]"
                >
                  <Trash2 size={14} /> Remove
                </button>
              )}
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleAvatarUpload(e.target.files[0])}
          />
        </div>
      </div>

      {/* Personal Information */}
      <div ref={el => cardsRef.current[1] = el} className="bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/[0.06] p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-white font-[font2]">Personal Information</h3>
          {!isEditing && (
            <button
              onClick={handleEdit}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-gray-300 transition-all flex items-center gap-2 font-[font2]"
            >
              <Edit3 size={14} /> Edit Profile
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField icon={User} label="Full Name" name="fullName" placeholder="John Doe" error={errors.fullName} />
          <InputField icon={Mail} label="Email" name="email" type="email" placeholder="john@example.com" error={errors.email} />
          <InputField icon={Phone} label="Phone Number" name="phone" type="tel" placeholder="+1 234 567 890" error={errors.phone} />
          <InputField icon={GraduationCap} label="College / University" name="college" placeholder="MIT" />
          <InputField icon={GraduationCap} label="Degree" name="degree" placeholder="B.S. Computer Science" />
          <InputField icon={Calendar} label="Graduation Year" name="graduationYear" placeholder="2025" />
          <InputField icon={MapPin} label="Location" name="location" placeholder="San Francisco, CA" />
        </div>
      </div>

      {/* Professional Information */}
      <div ref={el => cardsRef.current[2] = el} className="bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/[0.06] p-6">
        <h3 className="text-lg font-bold text-white mb-6 font-[font2]">Professional Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Experience Level */}
          <div>
            <label className="block text-xs text-gray-500 mb-1.5 font-[font1] uppercase tracking-wider">Experience Level</label>
            <select
              value={currentData.experienceLevel}
              onChange={(e) => setEditForm(prev => ({ ...prev, experienceLevel: e.target.value }))}
              disabled={!isEditing}
              className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all font-[font1]
                ${isEditing
                  ? 'bg-white/5 border-white/10 text-white focus:border-[var(--accent-primary)]/50 focus:outline-none'
                  : 'bg-white/[0.02] border-white/5 text-gray-300 cursor-default'
                }
              `}
            >
              {['Entry Level', 'Junior', 'Mid-Level', 'Senior', 'Lead', 'Staff', 'Principal'].map(l => (
                <option key={l} value={l} className="bg-gray-900">{l}</option>
              ))}
            </select>
          </div>
          <InputField icon={Linkedin} label="LinkedIn URL" name="linkedinUrl" placeholder="https://linkedin.com/in/..." error={errors.linkedinUrl} />
          <InputField icon={Github} label="GitHub URL" name="githubUrl" placeholder="https://github.com/..." error={errors.githubUrl} />
          <InputField icon={Globe} label="Portfolio Website" name="portfolioUrl" placeholder="https://portfolio.dev" />
        </div>

        {/* Skills */}
        <div className="mb-6">
          <label className="block text-xs text-gray-500 mb-2 font-[font1] uppercase tracking-wider">Skills</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {currentData.skills.map(skill => (
              <span key={skill} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent-bg)] border border-[var(--accent-border)] text-xs font-semibold text-gray-200 font-[font2]">
                {skill}
                {isEditing && (
                  <button onClick={() => removeSkill(skill)} className="text-gray-400 hover:text-white transition-colors">
                    <X size={12} />
                  </button>
                )}
              </span>
            ))}
            {currentData.skills.length === 0 && <span className="text-gray-600 text-sm font-[font1]">No skills added yet</span>}
          </div>
          {isEditing && (
            <div className="flex gap-2">
              <input
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                placeholder="Add a skill..."
                className="flex-1 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-600 focus:border-[var(--accent-primary)]/50 focus:outline-none font-[font1]"
              />
              <button onClick={addSkill} className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 transition-all">
                <Plus size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Preferred Roles */}
        <div>
          <label className="block text-xs text-gray-500 mb-2 font-[font1] uppercase tracking-wider">Preferred Job Roles</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {currentData.preferredRoles.map(role => (
              <span key={role} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-semibold text-gray-300 font-[font2]">
                {role}
                {isEditing && (
                  <button onClick={() => removeRole(role)} className="text-gray-400 hover:text-white transition-colors">
                    <X size={12} />
                  </button>
                )}
              </span>
            ))}
            {currentData.preferredRoles.length === 0 && <span className="text-gray-600 text-sm font-[font1]">No roles added yet</span>}
          </div>
          {isEditing && (
            <div className="flex gap-2">
              <input
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addRole())}
                placeholder="Add a preferred role..."
                className="flex-1 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-600 focus:border-[var(--accent-primary)]/50 focus:outline-none font-[font1]"
              />
              <button onClick={addRole} className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 transition-all">
                <Plus size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      {isEditing && (
        <div ref={el => cardsRef.current[3] = el} className="flex justify-end gap-3">
          <button
            onClick={handleCancel}
            className="px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-semibold transition-all flex items-center gap-2 font-[font2] text-sm"
          >
            <XCircle size={16} /> Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl text-white font-semibold transition-all flex items-center gap-2 font-[font2] text-sm hover:shadow-lg"
            style={{ backgroundColor: 'var(--accent-primary)', boxShadow: `0 8px 24px var(--accent-glow)` }}
          >
            <Save size={16} /> Save Changes
          </button>
        </div>
      )}
    </div>
  );
}
