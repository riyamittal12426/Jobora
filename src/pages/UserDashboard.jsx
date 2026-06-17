import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PenTool,
  Plus,
  Sparkles,
  Terminal,
  Briefcase,
  ChevronDown,
  X,
  Trash2,
  Code,
  ClipboardList
} from 'lucide-react';
import DashboardLayout from '../components/UserDashboard/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import axiosInstance from '../services/axiosInstance';
import { API_BASE_URL } from '../services/apiConfig';

const UserDashboard = () => {
  const navigate = useNavigate();
  const { user: firebaseUser, dbUser, loading, setDbUser } = useAuth();

  // State for user profile details
  const [user, setUser] = useState(null);
  const [isNewUser, setIsNewUser] = useState(true);

  // Modals state
  const [isAddAppModalOpen, setIsAddAppModalOpen] = useState(false);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);

  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('Active');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);

  // Lists for Dashboard Tracking
  const [applications, setApplications] = useState([]);
  const [events, setEvents] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [automationRuns, setAutomationRuns] = useState([]);
  const [atsScore, setAtsScore] = useState(null);
  const [defaultResumeName, setDefaultResumeName] = useState('No resume uploaded');

  // Form State for Profile Creation
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    age: '',
    address: '',
    resume: null
  });

  // Form State for Add Application
  const [appForm, setAppForm] = useState({
    company: '',
    role: '',
    status: 'Applied',
    location: '',
    locationType: 'Remote',
    source: '',
    progress: 10,
    interviewer: 'Recruiter Scan',
    remaining: '14 Days'
  });

  // Form State for Calendar Event (Tasks/Reminders)
  const [eventForm, setEventForm] = useState({
    type: 'Interview',
    relatedApp: '',
    date: '',
    time: '',
    status: 'Upcoming'
  });

  useEffect(() => {
    if (loading) return;

    if (dbUser) {
      setUser(dbUser);
      // Determine if profile setup is complete
      const isComplete = dbUser.firstName && dbUser.lastName && dbUser.phone && dbUser.age && dbUser.address;
      setIsNewUser(!isComplete);

      if (isComplete) {
        // Fetch user data from backend
        const fetchDashboardData = async () => {
          try {
            // Fetch applications
            const appsResponse = await axiosInstance.get(`/api/applications/${dbUser.email}`);
            if (appsResponse.data && appsResponse.data.length > 0) {
              const mappedData = appsResponse.data.map(app => ({
                ...app,
                id: app._id,
                progress: app.status === 'Offer' ? 100 : app.status === 'Interviewing' ? 60 : app.status === 'Rejected' ? 0 : 25,
                interviewer: app.interviewer || 'Hiring Manager',
                remaining: app.remaining || '8h 45min'
              }));
              setApplications(mappedData);
              localStorage.setItem(`applications_${dbUser.email}`, JSON.stringify(mappedData));
            } else {
              setApplications([]);
            }
          } catch (err) {
            console.error("Error fetching applications:", err);
          }

          // Fetch job recommendations
          try {
            const jobsResponse = await axiosInstance.get(`/api/jobs/recommendations/${dbUser.email}`);
            if (jobsResponse.data && jobsResponse.data.jobs && jobsResponse.data.jobs.length > 0) {
              setRecommendations(jobsResponse.data.jobs);
            } else {
              setRecommendations([]);
            }
          } catch (err) {
            console.error("Error fetching job recommendations:", err);
          }

          // Fetch automation runs
          try {
            const runsResponse = await axiosInstance.get(`/api/automation/runs/${dbUser.email}`);
            if (runsResponse.data && runsResponse.data.length > 0) {
              setAutomationRuns(runsResponse.data);
            } else {
              setAutomationRuns([]);
            }
          } catch (err) {
            console.error("Error fetching automation runs:", err);
          }
        };

        fetchDashboardData();

        // Also fetch reminders from scoped localStorage
        try {
          const stored = localStorage.getItem(`events_${dbUser.email}`);
          setEvents(stored ? JSON.parse(stored) : []);
        } catch (e) {
          console.error('Failed to parse events:', e);
          setEvents([]);
        }

        // Also fetch resumes / ATS score from scoped localStorage
        try {
          const storedResumes = localStorage.getItem(`jobora-resumes_${dbUser.email}`);
          if (storedResumes) {
            const resumes = JSON.parse(storedResumes);
            const defaultResume = resumes.find(r => r.isDefault) || resumes[0];
            if (defaultResume) {
              setAtsScore(defaultResume.atsScore);
              setDefaultResumeName(defaultResume.name);
            }
          } else {
            // Fallback to old key if scoped doesn't exist yet
            const oldStored = localStorage.getItem('jobora-resumes');
            if (oldStored) {
              const resumes = JSON.parse(oldStored);
              const defaultResume = resumes.find(r => r.isDefault) || resumes[0];
              if (defaultResume) {
                setAtsScore(defaultResume.atsScore);
                setDefaultResumeName(defaultResume.name);
                localStorage.setItem(`jobora-resumes_${dbUser.email}`, oldStored);
              }
            }
          }
        } catch (e) {
          console.error("Error updating resume info:", e);
        }
      } else {
        // Prefill form from dbUser / firebaseUser
        setProfileForm(prev => ({
          ...prev,
          firstName: dbUser.firstName || firebaseUser?.displayName?.split(' ')[0] || '',
          lastName: dbUser.lastName || firebaseUser?.displayName?.split(' ').slice(1).join(' ') || '',
          email: dbUser.email || firebaseUser?.email || '',
          phone: dbUser.phone || '',
          age: dbUser.age || '',
          address: dbUser.address || ''
        }));
      }
    } else {
      if (firebaseUser) {
        setProfileForm(prev => ({
          ...prev,
          firstName: firebaseUser.displayName?.split(' ')[0] || '',
          lastName: firebaseUser.displayName?.split(' ').slice(1).join(' ') || '',
          email: firebaseUser.email || ''
        }));
      }
    }
  }, [dbUser, firebaseUser, loading]);

  // Computed dynamic stats from automation runs
  const automationStats = React.useMemo(() => {
    const totalApplied = automationRuns.reduce((sum, run) => sum + (run.appliedCount || 0), 0);
    const totalFormsFilled = automationRuns.reduce((sum, run) => sum + (run.formsFilled || 0), 0);
    const totalTimeSaved = automationRuns.reduce((sum, run) => sum + (run.timeSavedMinutes || 0), 0);
    const successfulRuns = automationRuns.filter(r => r.status === 'completed' || r.status === 'success').length;
    const successRate = automationRuns.length > 0 ? Math.round((successfulRuns / automationRuns.length) * 100) : 0;
    const isRunning = automationRuns.some(r => r.status === 'running' || r.status === 'in_progress');
    return { totalApplied, totalFormsFilled, totalTimeSaved, successRate, isRunning };
  }, [automationRuns]);

  // Handlers for Profile Creation
  const handleProfileChange = (e) => {
    if (e.target.name === 'resume') {
      setProfileForm({ ...profileForm, resume: e.target.files[0] });
    } else {
      setProfileForm({ ...profileForm, [e.target.name]: e.target.value });
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('firstName', profileForm.firstName);
    formData.append('lastName', profileForm.lastName);
    formData.append('email', profileForm.email);
    formData.append('phone', profileForm.phone);
    formData.append('age', profileForm.age);
    formData.append('address', profileForm.address);
    if (profileForm.resume) {
      formData.append('resume', profileForm.resume);
    }

    try {
      const response = await axiosInstance.post('/api/users/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      if (response.status === 200 || response.status === 201) {
        const savedUser = response.data;
        setUser(savedUser);
        setDbUser(savedUser);
        setIsNewUser(false);
      } else {
        alert('Failed to save profile.');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save profile.');
    }
  };

  // Handlers for Add Application
  const handleAppSubmit = async (e) => {
    e.preventDefault();
    const progressVal = appForm.status === 'Offer' ? 100 : appForm.status === 'Interviewing' ? 60 : appForm.status === 'Rejected' ? 0 : 25;
    const newAppPayload = {
      ...appForm,
      userEmail: dbUser?.email || 'demo@jobtracker.ai',
      progress: progressVal,
      interviewer: appForm.interviewer || 'Michael Andrew',
      remaining: appForm.remaining || '8h 45min'
    };
    try {
      const response = await axiosInstance.post('/api/applications', newAppPayload);
      if (response.status === 200 || response.status === 201) {
        const savedApp = response.data;
        savedApp.id = savedApp._id;
        const newApps = [...applications, { ...savedApp, progress: progressVal, interviewer: savedApp.interviewer || 'Michael Andrew', remaining: savedApp.remaining || '8h 45min' }];
        setApplications(newApps);
        localStorage.setItem(`applications_${dbUser.email}`, JSON.stringify(newApps));
      } else {
        throw new Error('Fallback');
      }
    } catch (err) {
      console.error('Error adding application, storing locally:', err);
      const localApp = {
        ...appForm,
        id: 'local-' + Date.now(),
        progress: progressVal
      };
      const newApps = [...applications, localApp];
      setApplications(newApps);
      localStorage.setItem(`applications_${dbUser?.email || 'demo'}`, JSON.stringify(newApps));
    }
    setAppForm({ company: '', role: '', status: 'Applied', location: '', locationType: 'Remote', source: '', progress: 10, interviewer: 'Michael Andrew', remaining: '8h 45min' });
    setIsAddAppModalOpen(false);
  };

  // Handlers for Calendar Events / Tasks
  const handleEventSubmit = (e) => {
    e.preventDefault();
    const newEvent = {
      ...eventForm,
      id: 'local-ev-' + Date.now()
    };
    const newEvents = [...events, newEvent];
    setEvents(newEvents);
    if (dbUser?.email) {
      localStorage.setItem(`events_${dbUser.email}`, JSON.stringify(newEvents));
    }
    setEventForm({ type: 'Interview', relatedApp: '', date: '', time: '', status: 'Upcoming' });
    setIsAddTaskModalOpen(false);
  };

  const deleteApplication = async (id) => {
    if (window.confirm("Remove this application?")) {
      const filtered = applications.filter(a => a.id !== id && a._id !== id);
      setApplications(filtered);
      if (dbUser?.email) {
        localStorage.setItem(`applications_${dbUser.email}`, JSON.stringify(filtered));
      }
      try {
        await axiosInstance.delete(`/api/applications/${id}`);
      } catch (err) {
        console.error("Failed to delete application on backend:", err);
      }
    }
  };

  const deleteEvent = (id) => {
    if (window.confirm("Remove this reminder?")) {
      const filtered = events.filter(e => e.id !== id);
      setEvents(filtered);
      if (dbUser?.email) {
        localStorage.setItem(`events_${dbUser.email}`, JSON.stringify(filtered));
      }
    }
  };

  // ATS score display helpers
  const atsLabel = atsScore !== null
    ? (atsScore >= 80 ? 'Excellent Score' : atsScore >= 60 ? 'Good Score' : 'Needs Improvement')
    : 'No Resume Analyzed';
  const atsColor = atsScore !== null
    ? (atsScore >= 80 ? 'text-emerald-400' : atsScore >= 60 ? 'text-amber-400' : 'text-red-400')
    : 'text-gray-500';

  // Filter Applications based on search & filter state
  const filteredApps = applications.filter(app => {
    const matchesSearch = app.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.role.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeFilter === 'All') return matchesSearch;
    if (activeFilter === 'Active') {
      return matchesSearch && (app.status === 'Applied' || app.status === 'Interviewing');
    }
    return matchesSearch && app.status === activeFilter;
  });

  // Profile setup loader screen (styled matching style system)
  if (loading) {
    return (
      <div className="relative min-h-screen bg-black text-white flex items-center justify-center p-6 font-[font1] overflow-hidden">
        <div className="absolute top-[-200px] left-[-200px] w-[600px] h-[600px] rounded-full bg-[#7c3aed]/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 bg-[#0c0d14]/85 p-8 rounded-[32px] shadow-2xl border border-white/10 text-white backdrop-blur-2xl text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-[#7c3aed] mx-auto mb-4"></div>
          <p className="text-gray-400 font-semibold text-sm font-[font1]">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (isNewUser) {
    return (
      <div className="relative min-h-screen bg-black text-white flex items-center justify-center p-6 md:p-12 font-[font1] overflow-hidden">
        <div className="absolute top-[-200px] left-[-200px] w-[600px] h-[600px] rounded-full bg-[#7c3aed]/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 bg-[#0c0d14]/85 p-8 md:p-10 rounded-[32px] shadow-2xl w-full max-w-2xl border border-white/10 text-white backdrop-blur-2xl">
          <div className="mb-8">
            <span className="text-sm font-semibold tracking-wider text-[#7c3aed] uppercase font-[font2]">Step 1 of 2</span>
            <h2 className="text-3xl font-extrabold tracking-tight mt-1 font-[font2] text-white">Complete Profile Setup</h2>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-400 mb-1.5 tracking-wider font-[font2]">First Name</label>
                <input required type="text" name="firstName" placeholder="Taylor" value={profileForm.firstName} onChange={handleProfileChange} className="w-full p-3.5 bg-white/5 rounded-2xl border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed]/30 transition-all font-[font1]" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-400 mb-1.5 tracking-wider font-[font2]">Last Name</label>
                <input required type="text" name="lastName" placeholder="Swift" value={profileForm.lastName} onChange={handleProfileChange} className="w-full p-3.5 bg-white/5 rounded-2xl border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed]/30 transition-all font-[font1]" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-400 mb-1.5 tracking-wider font-[font2]">Email Address</label>
                <input required type="email" name="email" placeholder="taylor@jobtracker.ai" value={profileForm.email} onChange={handleProfileChange} className="w-full p-3.5 bg-white/5 rounded-2xl border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed]/30 transition-all font-[font1]" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-400 mb-1.5 tracking-wider font-[font2]">Phone Number</label>
                <input required type="tel" name="phone" placeholder="555-0199" value={profileForm.phone} onChange={handleProfileChange} className="w-full p-3.5 bg-white/5 rounded-2xl border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed]/30 transition-all font-[font1]" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-400 mb-1.5 tracking-wider font-[font2]">Age</label>
                <input required type="number" name="age" placeholder="28" value={profileForm.age} onChange={handleProfileChange} className="w-full p-3.5 bg-white/5 rounded-2xl border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed]/30 transition-all font-[font1]" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-400 mb-1.5 tracking-wider font-[font2]">Location / Address</label>
                <input required type="text" name="address" placeholder="New York, NY" value={profileForm.address} onChange={handleProfileChange} className="w-full p-3.5 bg-white/5 rounded-2xl border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed]/30 transition-all font-[font1]" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-gray-400 mb-1.5 tracking-wider font-[font2]">Resume Upload (.pdf, .docx)</label>
              <input required type="file" name="resume" onChange={handleProfileChange} className="p-3 bg-white/5 rounded-2xl w-full border border-white/10 text-white file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:bg-[#7c3aed] file:text-white file:font-semibold file:cursor-pointer hover:file:bg-[#6d28d9] transition-all font-[font1]" />
            </div>

            <button type="submit" className="w-full bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold py-4 rounded-2xl shadow-lg transition-all hover:scale-[1.01] hover:shadow-purple-500/20 active:scale-95 font-[font2]">
              Create Profile & Launch Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout
      currentPage="dashboard"
      pageTitle={`Welcome back, ${user?.firstName || 'Taylor'}`}
      pageSubtitle={`Active Tracking: ${applications.length} Jobs • ${events.length} Reminders`}
    >
      <div className="flex flex-col lg:flex-row gap-6 md:gap-8 relative z-10">

        {/* Left Column (Opportunities, Automation, Tracker) */}
        <div className="flex-[2] flex flex-col gap-6 md:gap-8">

          {/* Row 1: Featured Job Opportunities */}
          <section>
            <div className="flex justify-between items-center mb-3.5">
              <h3 className="font-extrabold text-base tracking-tight text-white font-[font2]">Featured Job Opportunities</h3>
              <button
                onClick={() => navigate('/job-recommendations')}
                className="text-xs font-bold text-gray-400 hover:text-[#7c3aed] transition-colors cursor-pointer"
              >
                View All
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recommendations.length === 0 ? (
                <div className="col-span-3 text-center py-8 bg-[#181926]/60 rounded-3xl border border-white/10">
                  <Briefcase className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                  <p className="text-gray-400 font-semibold text-xs font-[font1]">No job recommendations yet.</p>
                  <button
                    onClick={() => navigate('/job-recommendations')}
                    className="text-xs text-[#7c3aed] font-bold hover:underline mt-1.5 cursor-pointer font-[font2]"
                  >
                    Browse AI Recommendations
                  </button>
                </div>
              ) : (
                recommendations.slice(0, 3).map((job, idx) => {
                  const iconColors = ['#ff7e40', '#10b981', '#a855f7'];
                  const iconBgs = ['bg-[#ff7e40]/10', 'bg-[#10b981]/10', 'bg-[#a855f7]/10'];
                  const IconComponents = [PenTool, Code, Briefcase];
                  const IconComp = IconComponents[idx % 3];
                  return (
                    <div key={job.job_id || job.id || idx} className="bg-[#181926]/60 rounded-3xl border border-white/10 p-4 shadow-lg hover:border-[#7c3aed]/30 transition-all flex flex-col justify-between group">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-2xl ${iconBgs[idx % 3]} flex items-center justify-center`} style={{ color: iconColors[idx % 3] }}>
                            <IconComp className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-sm tracking-tight text-white font-[font2] truncate max-w-[140px]">{job.job_title || job.title || 'Untitled Role'}</h4>
                            <p className="text-[10px] text-gray-400 font-semibold mt-0.5 truncate max-w-[140px]">{job.employer_name || job.company || 'Unknown Company'}</p>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-5 pt-3 border-t border-white/5 font-[font1]">
                        <div>
                          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block font-[font2]">Match</span>
                          <span className="text-xs font-extrabold text-white mt-0.5 flex items-center gap-1">
                            <Sparkles size={12} className="text-[#a855f7]" /> {job.matchScore ? `${job.matchScore}/10` : (job.aiScore ? `${job.aiScore}/10` : 'N/A')} <span className="text-[10px] text-gray-400 font-normal">Score</span>
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block font-[font2]">Type</span>
                          <span className="text-xs font-bold text-white mt-0.5 truncate block">{job.job_employment_type || job.type || job.locationType || 'Full-time'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* Row 2: Automation status and Interviews list */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* AI Auto-Apply Pilot Card */}
            <div className="bg-[#181926]/60 rounded-[28px] border border-white/10 p-5 shadow-lg flex flex-col justify-between min-h-[260px] backdrop-blur-md">
              <div>
                <h3 className="font-extrabold text-base tracking-tight text-white font-[font2]">AI Auto-Apply Pilot</h3>
                <div className="flex items-center gap-2 mt-1.5 font-[font1]">
                  {automationStats.isRunning ? (
                    <>
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                      <span className="text-xs font-bold text-emerald-400">Pilot System Running <span className="text-gray-400 font-medium">• {automationStats.totalApplied} applied</span></span>
                    </>
                  ) : automationRuns.length > 0 ? (
                    <>
                      <span className="w-2.5 h-2.5 rounded-full bg-gray-500 shrink-0"></span>
                      <span className="text-xs font-bold text-gray-400">Pilot Idle <span className="text-gray-500 font-medium">• {automationStats.totalApplied} applied total</span></span>
                    </>
                  ) : (
                    <>
                      <span className="w-2.5 h-2.5 rounded-full bg-gray-600 shrink-0"></span>
                      <span className="text-xs font-bold text-gray-500">No automation runs yet</span>
                    </>
                  )}
                </div>
              </div>

              <div className="my-3 space-y-3 font-[font1]">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400 font-semibold">Autonomous Success Rate</span>
                  <span className="text-white font-extrabold">{automationRuns.length > 0 ? `${automationStats.successRate}%` : '—'}</span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-1.5">
                  <div className="bg-gradient-to-r from-[#7c3aed] to-[#a855f7] h-1.5 rounded-full transition-all" style={{ width: `${automationStats.successRate}%` }} />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 text-center">
                  <div className="bg-white/5 border border-white/5 p-2 rounded-2xl">
                    <span className="text-gray-400 text-[10px] block font-semibold">Forms Filled</span>
                    <span className="text-sm font-extrabold text-white">{automationStats.totalFormsFilled}</span>
                  </div>
                  <div className="bg-white/5 border border-white/5 p-2 rounded-2xl">
                    <span className="text-gray-400 text-[10px] block font-semibold">Saved Time</span>
                    <span className="text-sm font-extrabold text-[#a855f7]">{automationStats.totalTimeSaved > 0 ? `${(automationStats.totalTimeSaved / 60).toFixed(1)} hrs` : '0 hrs'}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate('/automation')}
                className="w-full bg-[#7c3aed]/10 hover:bg-[#7c3aed]/20 border border-[#7c3aed]/20 text-[#a855f7] hover:text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 font-[font2] cursor-pointer"
              >
                <Terminal size={14} />
                <span>{automationRuns.length > 0 ? 'Configure Pilot Run' : 'Start First Run'}</span>
              </button>
            </div>

            {/* Interviews & Reminders Card */}
            <div className="bg-[#181926]/60 rounded-[28px] border border-white/10 p-5 shadow-lg flex flex-col justify-between min-h-[260px] backdrop-blur-md">
              <div>
                <h3 className="font-extrabold text-base tracking-tight text-white font-[font2]">Interviews & Reminders</h3>
                <p className="text-gray-400 text-xs font-semibold mt-0.5 font-[font1]">Your upcoming technical and HR rounds</p>
              </div>

              <div className="flex flex-col gap-2.5 my-3 overflow-y-auto max-h-[140px] pr-1">
                {events.length === 0 ? (
                  <div className="text-center py-6 text-gray-500 text-xs font-semibold font-[font1]">
                    No interviews or events scheduled.
                  </div>
                ) : (
                  events.slice(0, 3).map((ev) => (
                    <div key={ev.id} className="flex items-center justify-between p-2 hover:bg-white/5 rounded-xl transition-all gap-2 group font-[font1]">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          ev.type === 'Interview' ? 'bg-emerald-500/10 text-emerald-400' : ev.type === 'Follow-up' ? 'bg-[#6366f1]/10 text-[#6366f1]' : 'bg-amber-500/10 text-amber-400'
                        }`}>
                          <ClipboardList className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-extrabold text-xs text-white truncate font-[font2]">{ev.relatedApp}</h4>
                          <p className="text-[9px] text-gray-400 font-semibold mt-0.5">{ev.time} • {ev.date}</p>
                        </div>
                      </div>
                      <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded shrink-0 ${
                        ev.status === 'Completed'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : ev.status === 'In progress'
                            ? 'bg-purple-500/10 text-purple-400'
                            : 'bg-amber-500/10 text-amber-400'
                      }`}>
                        {ev.status || 'Upcoming'}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <button
                onClick={() => setIsAddTaskModalOpen(true)}
                className="w-full bg-white/5 hover:bg-white/10 border border-white/5 text-gray-300 hover:text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 font-[font2] cursor-pointer"
              >
                <Plus size={14} />
                <span>Schedule Reminder</span>
              </button>
            </div>
          </section>

          {/* Row 3: Active Job Applications Tracker */}
          <section className="bg-[#181926]/60 rounded-[28px] border border-white/10 p-6 shadow-lg backdrop-blur-md">
            <div className="flex justify-between items-center mb-5">
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-lg tracking-tight text-white font-[font2]">Job Application Tracker</h3>
                <div className="relative">
                  <button
                    onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                    className="flex items-center gap-1 px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-gray-300 cursor-pointer animate-none font-[font1]"
                  >
                    <span>{activeFilter}</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                  {isFilterDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 bg-[#13141f] border border-white/10 rounded-xl shadow-2xl z-30 py-1.5 min-w-[120px]">
                      {['All', 'Active', 'Applied', 'Interviewing', 'Offer', 'Rejected'].map(filterOpt => (
                        <button
                          key={filterOpt}
                          onClick={() => {
                            setActiveFilter(filterOpt);
                            setIsFilterDropdownOpen(false);
                          }}
                          className="w-full text-left px-3.5 py-1.5 text-xs text-gray-300 hover:bg-[#7c3aed]/20 hover:text-white transition-all font-semibold cursor-pointer"
                        >
                          {filterOpt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => setIsAddAppModalOpen(true)}
                className="w-8 h-8 rounded-full bg-[#7c3aed] hover:bg-[#6d28d9] text-white flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <Plus className="w-5 h-5 stroke-[3]" />
              </button>
            </div>

            {/* List */}
            <div className="flex flex-col gap-4 font-[font1]">
              {filteredApps.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400 font-semibold text-xs">No tracked applications match the filters.</p>
                  <button
                    onClick={() => setIsAddAppModalOpen(true)}
                    className="text-xs text-[#7c3aed] font-bold hover:underline mt-1.5 cursor-pointer block mx-auto font-[font2]"
                  >
                    Add new job tracking card
                  </button>
                </div>
              ) : (
                filteredApps.map((app) => (
                  <div
                    key={app.id || app._id}
                    className="flex flex-col md:flex-row items-center justify-between p-4 bg-white/5 rounded-3xl border border-white/5 hover:border-[#7c3aed]/20 transition-all gap-4 group"
                  >
                    <div className="flex items-center gap-4 w-full md:w-auto font-[font1]">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg text-white shadow-sm shrink-0 ${app.status === 'Offer' ? 'bg-[#10b981]' : app.status === 'Interviewing' ? 'bg-[#7c3aed]' : app.status === 'Rejected' ? 'bg-red-500' : 'bg-gray-500'
                        }`}>
                        {app.company.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-white font-[font2]">{app.role}</h4>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400 font-semibold">
                          <span>{app.company}</span>
                          <span>•</span>
                          <span className="text-gray-300 font-bold">{app.interviewer}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 justify-between md:justify-end w-full md:w-auto font-[font1]">
                      <div className="text-left md:text-right">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block font-[font2]">Next Stage</span>
                        <span className="text-xs font-extrabold text-white mt-0.5 block">{app.remaining}</span>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="relative w-12 h-12 flex items-center justify-center">
                          <svg className="w-full h-full transform -rotate-90">
                            <circle
                              cx="24" cy="24" r="19"
                              stroke="rgba(255,255,255,0.05)" strokeWidth="3"
                              fill="transparent"
                            />
                            <circle
                              cx="24" cy="24" r="19"
                              stroke={app.status === 'Offer' ? '#10b981' : '#a855f7'} strokeWidth="3.5"
                              fill="transparent"
                              strokeDasharray={2 * Math.PI * 19}
                              strokeDashoffset={2 * Math.PI * 19 * (1 - (app.progress || 25) / 100)}
                              strokeLinecap="round"
                            />
                          </svg>
                          <span className="absolute text-[10px] font-extrabold text-white font-[font2]">
                            {app.progress || 25}%
                          </span>
                        </div>

                        <button
                          onClick={() => deleteApplication(app.id || app._id)}
                          className="p-1 hover:bg-red-500/20 hover:text-red-400 rounded-lg text-gray-500 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Right Column (Premium & Resume ATS Score) */}
        <div className="flex-[1] flex flex-col gap-6 min-w-full lg:min-w-[320px]">

          {/* Go Premium widget */}
          <div className="bg-[#181926]/60 rounded-[28px] p-5 text-white relative overflow-hidden flex flex-col justify-between min-h-[200px] shadow-lg border border-white/10 backdrop-blur-md">
            <div className="absolute right-0 bottom-0 top-0 w-[150px] pointer-events-none opacity-80 select-none">
              <svg className="w-full h-full" viewBox="0 0 160 200" fill="none">
                <rect x="75" y="140" width="70" height="18" rx="4" fill="#2d3047" />
                <rect x="70" y="156" width="80" height="20" rx="4" fill="#7c3aed" />
                <rect x="80" y="125" width="60" height="16" rx="3" fill="#7c3aed" />
                <circle cx="110" cy="70" r="16" fill="#fbcfe8" />
                <path d="M98 68c0-8 6-14 14-14s14 6 14 14c0 1.5-.2 3-.5 4.5h-27c-.3-1.5-.5-3-.5-4.5z" fill="#ec4899" />
                <path d="M124 68c0 4-4 8-4 8l-2 4h-16l-2-4s-4-4-4-8" fill="#fbcfe8" />
                <path d="M96 90c0-6 4-10 10-10h8c6 0 10 4 10 10l5 30H91l5-30z" fill="#4f46e5" />
                <path d="M90 95l14-6 10 6v14l-10-6-14 6V95z" fill="#ffffff" stroke="#2d3047" strokeWidth="1.5" />
                <circle cx="50" cy="40" r="3" fill="#7c3aed" />
                <polygon points="130,30 135,40 125,40" fill="#a78bfa" />
                <line x1="120" y1="120" x2="140" y2="100" stroke="#7c3aed" strokeWidth="2" strokeDasharray="3 3" />
              </svg>
            </div>

            <div className="relative z-10 flex flex-col gap-1 max-w-[65%]">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-widest leading-none font-[font2]">
                <span className="w-1.5 h-1.5 bg-[#a855f7] rounded-full"></span>
                <span>Premium</span>
              </div>
              <h3 className="text-xl font-extrabold tracking-tight mt-2 font-[font2] leading-tight text-white font-[font2]">Go Premium</h3>
              <p className="text-[11px] text-gray-400 font-semibold mt-1 leading-normal font-[font1]">
                Explore 25k+ courses with lifetime membership
              </p>
            </div>

            <div className="relative z-10 mt-6">
              <button
                onClick={() => navigate('/settings')}
                className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md transition-all hover:scale-105 active:scale-95 font-[font2] cursor-pointer"
              >
                Get Access
              </button>
            </div>
          </div>

          {/* AI Resume Analyzer Score Widget */}
          <div className="bg-[#181926]/60 rounded-[28px] border border-white/10 p-5 shadow-lg flex flex-col justify-between min-h-[220px] backdrop-blur-md">
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-widest leading-none font-[font2] mb-2">
                <span className="w-1.5 h-1.5 bg-[#a855f7] rounded-full"></span>
                <span>ATS Analytics</span>
              </div>
              <h3 className="font-extrabold text-base tracking-tight text-white font-[font2]">Resume ATS Score</h3>
              <p className="text-gray-400 text-xs font-semibold mt-0.5 font-[font1]">Your current resume compatibility rating</p>
            </div>

            <div className="flex items-center gap-4 my-3 font-[font1]">
              <div className="w-14 h-14 rounded-2xl bg-[#7c3aed]/10 border border-[#7c3aed]/20 flex items-center justify-center font-[font2] text-xl font-extrabold text-[#a855f7] shrink-0">
                {atsScore !== null ? atsScore : '—'}
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-white font-[font2]">{atsScore !== null ? 'Ready for Applications' : 'Upload a Resume'}</h4>
                <p className={`text-[10px] font-bold mt-0.5 flex items-center gap-1 ${atsColor}`}>
                  <span>● {atsLabel}</span>
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate('/prepare-application')}
              className="w-full bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 font-[font2] cursor-pointer shadow-md hover:scale-[1.02] active:scale-98"
            >
              <Sparkles size={14} />
              <span>Optimize Resume</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================
          ADD APPLICATION MODAL DIALOG (Dark Theme)
         ======================================================== */}
      {isAddAppModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#13141f] rounded-[28px] border border-white/10 w-full max-w-md p-6 shadow-2xl relative text-white">
            <button
              onClick={() => setIsAddAppModalOpen(false)}
              className="absolute top-4 right-4 p-1 hover:bg-white/5 rounded-full text-gray-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-extrabold tracking-tight mb-5 font-[font2] text-white">Add Tracked Application</h3>

            <form onSubmit={handleAppSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-400 mb-1 tracking-wider font-[font2]">Company Name</label>
                <input required type="text" placeholder="e.g. Google" value={appForm.company} onChange={(e) => setAppForm({ ...appForm, company: e.target.value })} className="w-full p-3 bg-white/5 rounded-xl border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed]/30 transition-all font-[font1]" />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-400 mb-1 tracking-wider font-[font2]">Job Role</label>
                <input required type="text" placeholder="e.g. Software Engineer" value={appForm.role} onChange={(e) => setAppForm({ ...appForm, role: e.target.value })} className="w-full p-3 bg-white/5 rounded-xl border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed]/30 transition-all font-[font1]" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-400 mb-1 tracking-wider font-[font2]">Status</label>
                  <select value={appForm.status} onChange={(e) => setAppForm({ ...appForm, status: e.target.value })} className="w-full p-3 bg-white/5 rounded-xl border border-white/10 text-white focus:outline-none focus:border-[#7c3aed] transition-all font-[font1]">
                    <option className="bg-[#13141f]">Applied</option>
                    <option className="bg-[#13141f]">Interviewing</option>
                    <option className="bg-[#13141f]">Offer</option>
                    <option className="bg-[#13141f]">Rejected</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-400 mb-1 tracking-wider font-[font2]">Location Type</label>
                  <select value={appForm.locationType} onChange={(e) => setAppForm({ ...appForm, locationType: e.target.value })} className="w-full p-3 bg-white/5 rounded-xl border border-white/10 text-white focus:outline-none focus:border-[#7c3aed] transition-all font-[font1]">
                    <option className="bg-[#13141f]">Remote</option>
                    <option className="bg-[#13141f]">On-site</option>
                    <option className="bg-[#13141f]">Hybrid</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-400 mb-1 tracking-wider font-[font2]">Interviewer / Contact</label>
                <input type="text" placeholder="e.g. Michael Andrew" value={appForm.interviewer} onChange={(e) => setAppForm({ ...appForm, interviewer: e.target.value })} className="w-full p-3 bg-white/5 rounded-xl border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed]/30 transition-all font-[font1]" />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-400 mb-1 tracking-wider font-[font2]">Remaining Stage Time</label>
                <input type="text" placeholder="e.g. 8h 45min" value={appForm.remaining} onChange={(e) => setAppForm({ ...appForm, remaining: e.target.value })} className="w-full p-3 bg-white/5 rounded-xl border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed]/30 transition-all font-[font1]" />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddAppModalOpen(false)}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-bold rounded-xl transition-all font-[font2] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold rounded-xl shadow-md transition-all font-[font2] cursor-pointer"
                >
                  Add Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          ADD TASK / ASSIGNMENT MODAL DIALOG (Dark Theme)
         ======================================================== */}
      {isAddTaskModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#13141f] rounded-[28px] border border-white/10 w-full max-w-md p-6 shadow-2xl relative text-white">
            <button
              onClick={() => setIsAddTaskModalOpen(false)}
              className="absolute top-4 right-4 p-1 hover:bg-white/5 rounded-full text-gray-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-extrabold tracking-tight mb-5 font-[font2] text-white">Add Task Reminder</h3>

            <form onSubmit={handleEventSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-400 mb-1 tracking-wider font-[font2]">Event Type</label>
                <select value={eventForm.type} onChange={(e) => setEventForm({ ...eventForm, type: e.target.value })} className="w-full p-3 bg-white/5 rounded-xl border border-white/10 text-white focus:outline-none focus:border-[#7c3aed] transition-all font-[font1]">
                  <option className="bg-[#13141f]">Interview</option>
                  <option className="bg-[#13141f]">Follow-up</option>
                  <option className="bg-[#13141f]">Assessment</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-400 mb-1 tracking-wider font-[font2]">Description / Topic</label>
                <input required type="text" placeholder="e.g. Google Coding Review" value={eventForm.relatedApp} onChange={(e) => setEventForm({ ...eventForm, relatedApp: e.target.value })} className="w-full p-3 bg-white/5 rounded-xl border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed]/30 transition-all font-[font1]" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-400 mb-1 tracking-wider font-[font2]">Date</label>
                  <input required type="date" value={eventForm.date} onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })} className="w-full p-3 bg-white/5 rounded-xl border border-white/10 text-gray-400 focus:outline-none focus:border-[#7c3aed] transition-all font-[font1]" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-400 mb-1 tracking-wider font-[font2]">Time</label>
                  <input required type="time" value={eventForm.time} onChange={(e) => setEventForm({ ...eventForm, time: e.target.value })} className="w-full p-3 bg-white/5 rounded-xl border border-white/10 text-gray-400 focus:outline-none focus:border-[#7c3aed] transition-all font-[font1]" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-400 mb-1 tracking-wider font-[font2]">Status</label>
                <select value={eventForm.status} onChange={(e) => setEventForm({ ...eventForm, status: e.target.value })} className="w-full p-3 bg-white/5 rounded-xl border border-white/10 text-white focus:outline-none focus:border-[#7c3aed] transition-all font-[font1]">
                  <option className="bg-[#13141f]">Upcoming</option>
                  <option className="bg-[#13141f]">In progress</option>
                  <option className="bg-[#13141f]">Completed</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddTaskModalOpen(false)}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-bold rounded-xl transition-all font-[font2] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold rounded-xl shadow-md transition-all font-[font2] cursor-pointer"
                >
                  Add Reminder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default UserDashboard;