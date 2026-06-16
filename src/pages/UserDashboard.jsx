import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  PenTool,
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
  BookOpen,
  User,
  Bell,
  Calendar,
  Settings,
  Sparkles,
  MessageSquare,
  Compass,
  Terminal,
  Mic2,
  Briefcase,
  ChevronDown,
  RefreshCw,
  X,
  LogOut,
  Trash2,
  HelpCircle,
  Code,
  ArrowUpRight,
  ClipboardList
} from 'lucide-react';
import DashboardLayout from '../components/UserDashboard/DashboardLayout';
import { API_BASE_URL } from '@/services/apiConfig';

const UserDashboard = () => {
  const navigate = useNavigate();
  
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

  // Interactive Chart state (default Wednesday - index 3)
  const [hoveredBar, setHoveredBar] = useState(3);

  // Default Demo Seeding Values
  const defaultDemoApps = [
    { id: 'demo-1', company: 'Google', role: 'Software Engineer', status: 'Interviewing', location: 'Mountain View, CA', locationType: 'On-site', source: 'Referral', progress: 45, interviewer: 'Michael Andrew', remaining: '8h 45min' },
    { id: 'demo-2', company: 'Figma', role: 'Product Designer', status: 'Offer', location: 'San Francisco, CA', locationType: 'Hybrid', source: 'LinkedIn', progress: 75, interviewer: 'Natalia Varnan', remaining: '18h 12min' }
  ];

  const defaultDemoEvents = [
    { id: 'demo-ev-1', type: 'Interview', relatedApp: 'Google (Technical)', date: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0], time: '10:30 AM', status: 'In progress' },
    { id: 'demo-ev-2', type: 'Follow-up', relatedApp: 'Figma (Portfolio Review)', date: new Date(new Date().setDate(new Date().getDate() + 4)).toISOString().split('T')[0], time: '12:45 PM', status: 'Completed' },
    { id: 'demo-ev-3', type: 'Assessment', relatedApp: 'OpenAI (Coding Test)', date: new Date(new Date().setDate(new Date().getDate() + 9)).toISOString().split('T')[0], time: '11:00 AM', status: 'Upcoming' }
  ];

  // Lists for Dashboard Tracking
  const [applications, setApplications] = useState(() => {
    try {
      const stored = localStorage.getItem('applications');
      const parsed = stored ? JSON.parse(stored) : [];
      return parsed.length > 0 ? parsed : defaultDemoApps;
    } catch (e) {
      console.error('Failed to parse applications:', e);
      return defaultDemoApps;
    }
  });

  const [events, setEvents] = useState(() => {
    try {
      const stored = localStorage.getItem('events');
      const parsed = stored ? JSON.parse(stored) : [];
      return parsed.length > 0 ? parsed : defaultDemoEvents;
    } catch (e) {
      console.error('Failed to parse events:', e);
      return defaultDemoEvents;
    }
  });

  // Calendar states
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedCalendarDay, setSelectedCalendarDay] = useState(17);

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
    // Check if user exists in local storage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setIsNewUser(false);

        const token = localStorage.getItem('token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

        fetch(`${API_BASE_URL}/api/users/${parsedUser.email}`, { headers })
          .then(res => res.ok ? res.json() : parsedUser)
          .then(data => {
            setUser(data);
            localStorage.setItem('user', JSON.stringify(data));
          })
          .catch(err => console.error('Error fetching user profile:', err));

        // Fetch user's applications from MongoDB backend
        fetch(`${API_BASE_URL}/api/applications/${parsedUser.email}`, { headers })
          .then(res => res.json())
          .then(data => {
            if (data && data.length > 0) {
              const mappedData = data.map(app => ({ 
                ...app, 
                id: app._id,
                progress: app.status === 'Offer' ? 100 : app.status === 'Interviewing' ? 60 : app.status === 'Rejected' ? 0 : 25,
                interviewer: app.interviewer || 'Hiring Manager',
                remaining: app.remaining || '8h 45min'
              }));
              setApplications(mappedData);
              localStorage.setItem('applications', JSON.stringify(mappedData));
            }
          })
          .catch(err => console.error("Error fetching applications:", err));
      } catch (err) {
        console.error('Error parsing stored user:', err);
      }
    } else {
      // Pre-fill email from signup form
      const signupEmail = localStorage.getItem('signupEmail');
      if (signupEmail) {
        setProfileForm(prev => ({ ...prev, email: signupEmail }));
      }
    }
  }, []);

  // Quick Seed Demo Data Handler
  const handleLoadDemoData = () => {
    const demoUser = {
      firstName: 'Taylor',
      lastName: 'Swift',
      email: 'taylor@jobtracker.ai',
      phone: '555-0199',
      age: '28',
      address: 'New York, NY',
      resume: 'Uploaded'
    };
    localStorage.setItem('user', JSON.stringify(demoUser));
    localStorage.setItem('applications', JSON.stringify(defaultDemoApps));
    localStorage.setItem('events', JSON.stringify(defaultDemoEvents));
    setUser(demoUser);
    setApplications(defaultDemoApps);
    setEvents(defaultDemoEvents);
    setIsNewUser(false);
  };

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
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
      });
      if (response.ok) {
        const savedUser = await response.json();
        setUser(savedUser);
        setIsNewUser(false);
        localStorage.setItem('user', JSON.stringify(savedUser));
        localStorage.removeItem('signupEmail');
      } else {
        const errorData = await response.json();
        alert(`Failed to save profile: ${errorData.message}`);
      }
    } catch (err) {
      console.error(err);
      const localUser = {
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
        email: profileForm.email,
        phone: profileForm.phone,
        age: profileForm.age,
        address: profileForm.address,
        resume: profileForm.resume ? 'Uploaded' : null
      };
      setUser(localUser);
      setIsNewUser(false);
      localStorage.setItem('user', JSON.stringify(localUser));
      localStorage.removeItem('signupEmail');
    }
  };

  // Handlers for Add Application
  const handleAppSubmit = async (e) => {
    e.preventDefault();
    const progressVal = appForm.status === 'Offer' ? 100 : appForm.status === 'Interviewing' ? 60 : appForm.status === 'Rejected' ? 0 : 25;
    const newAppPayload = { 
      ...appForm, 
      userEmail: user?.email || 'demo@jobtracker.ai',
      progress: progressVal,
      interviewer: appForm.interviewer || 'Michael Andrew',
      remaining: appForm.remaining || '8h 45min'
    };
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/applications`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(newAppPayload)
      });
      if (response.ok) {
        const savedApp = await response.json();
        savedApp.id = savedApp._id;
        const newApps = [...applications, { ...savedApp, progress: progressVal, interviewer: savedApp.interviewer || 'Michael Andrew', remaining: savedApp.remaining || '8h 45min' }];
        setApplications(newApps);
        localStorage.setItem('applications', JSON.stringify(newApps));
      } else {
        throw new Error('Fallback');
      }
    } catch (err) {
      const localApp = {
        ...appForm,
        id: 'local-' + Date.now(),
        progress: progressVal
      };
      const newApps = [...applications, localApp];
      setApplications(newApps);
      localStorage.setItem('applications', JSON.stringify(newApps));
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
    localStorage.setItem('events', JSON.stringify(newEvents));
    setEventForm({ type: 'Interview', relatedApp: '', date: '', time: '', status: 'Upcoming' });
    setIsAddTaskModalOpen(false);
  };

  const deleteApplication = (id) => {
    if (window.confirm("Remove this application?")) {
      const filtered = applications.filter(a => a.id !== id && a._id !== id);
      setApplications(filtered);
      localStorage.setItem('applications', JSON.stringify(filtered));
    }
  };

  const deleteEvent = (id) => {
    if (window.confirm("Remove this reminder?")) {
      const filtered = events.filter(e => e.id !== id);
      setEvents(filtered);
      localStorage.setItem('events', JSON.stringify(filtered));
    }
  };

  // Chart Custom Seeding / Mock Data
  const chartData = [
    { day: 'Su', val: 40, label: '4h 00min', date: '2 Jan 2026' },
    { day: 'Mo', val: 65, label: '6h 30min', date: '3 Jan 2026' },
    { day: 'Tu', val: 30, label: '3h 00min', date: '4 Jan 2026' },
    { day: 'We', val: 85, label: '6h 45min', date: '5 Jan 2026', highlighted: true },
    { day: 'Th', val: 55, label: '5h 15min', date: '6 Jan 2026' },
    { day: 'Fr', val: 45, label: '4h 30min', date: '7 Jan 2026' },
    { day: 'Sa', val: 25, label: '2h 15min', date: '8 Jan 2026' }
  ];

  // Calendar Helper functions
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayIndex = getFirstDayOfMonth(year, month);

  // Generate Calendar cells
  const calendarCells = [];
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth);
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    calendarCells.push({ dayNum: daysInPrevMonth - i, isCurrentMonth: false });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarCells.push({ dayNum: i, isCurrentMonth: true });
  }
  const remainingCells = 42 - calendarCells.length;
  for (let i = 1; i <= remainingCells; i++) {
    calendarCells.push({ dayNum: i, isCurrentMonth: false });
  }

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
  if (isNewUser) {
    return (
      <div className="relative min-h-screen bg-black text-white flex items-center justify-center p-6 md:p-12 font-[font1] overflow-hidden">
        <div className="absolute top-[-200px] left-[-200px] w-[600px] h-[600px] rounded-full bg-[#7c3aed]/10 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 bg-[#0c0d14]/85 p-8 md:p-10 rounded-[32px] shadow-2xl w-full max-w-2xl border border-white/10 text-white backdrop-blur-2xl">
          <div className="flex justify-between items-center mb-8">
            <div>
              <span className="text-sm font-semibold tracking-wider text-[#7c3aed] uppercase font-[font2]">Step 1 of 2</span>
              <h2 className="text-3xl font-extrabold tracking-tight mt-1 font-[font2] text-white">Complete Profile Setup</h2>
            </div>
            <button 
              onClick={handleLoadDemoData}
              className="flex items-center gap-2 bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold py-2.5 px-4 rounded-2xl shadow-md transition-all hover:scale-105 active:scale-95 font-[font2] border border-[#7c3aed]/20 text-xs cursor-pointer"
            >
              <Sparkles size={14} className="text-white" />
              ✨ Load Demo Account
            </button>
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
      <div className="flex flex-col lg:flex-row gap-6 md:gap-8">
        
        {/* Left Column (Opportunities, Charts, Active Trackers) */}
        <div className="flex-[2] flex flex-col gap-6">
          
          {/* Row 1: Featured Opportunities */}
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
              {/* Card 1 */}
              <div className="bg-[#181926]/60 rounded-3xl border border-white/10 p-4 shadow-lg hover:border-[#7c3aed]/30 transition-all flex flex-col justify-between group">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#ff7e40]/10 flex items-center justify-center text-[#ff7e40]">
                      <PenTool className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm tracking-tight text-white font-[font2]">Product Designer</h4>
                      <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Figma Inc.</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-5 pt-3 border-t border-white/5">
                  <div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block font-[font2]">Match</span>
                    <span className="text-xs font-extrabold text-white mt-0.5 flex items-center gap-1">
                      ⭐ 9.8 <span className="text-[10px] text-gray-400 font-normal">Score</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block font-[font2]">Type</span>
                    <span className="text-xs font-bold text-white mt-0.5 truncate block">Full-time / Hybrid</span>
                  </div>
                </div>
              </div>

              {/* Card 2 */}
              <div className="bg-[#181926]/60 rounded-3xl border border-white/10 p-4 shadow-lg hover:border-[#7c3aed]/30 transition-all flex flex-col justify-between group">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#10b981]/10 flex items-center justify-center text-[#10b981]">
                      <Code className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm tracking-tight text-white font-[font2]">Frontend Engineer</h4>
                      <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Vercel Co.</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-5 pt-3 border-t border-white/5">
                  <div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block font-[font2]">Match</span>
                    <span className="text-xs font-extrabold text-white mt-0.5 flex items-center gap-1">
                      ⭐ 9.6 <span className="text-[10px] text-gray-400 font-normal">Score</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block font-[font2]">Type</span>
                    <span className="text-xs font-bold text-white mt-0.5 truncate block">Contract / Remote</span>
                  </div>
                </div>
              </div>

              {/* Card 3 */}
              <div className="bg-[#181926]/60 rounded-3xl border border-white/10 p-4 shadow-lg hover:border-[#7c3aed]/30 transition-all flex flex-col justify-between group">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#6366f1]/10 flex items-center justify-center text-[#6366f1]">
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm tracking-tight text-white font-[font2]">AI Research Dev</h4>
                      <p className="text-[10px] text-gray-400 font-semibold mt-0.5">OpenAI Corp.</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-5 pt-3 border-t border-white/5">
                  <div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block font-[font2]">Match</span>
                    <span className="text-xs font-extrabold text-white mt-0.5 flex items-center gap-1">
                      ⭐ 9.2 <span className="text-[10px] text-gray-400 font-normal">Score</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block font-[font2]">Type</span>
                    <span className="text-xs font-bold text-white mt-0.5 truncate block">Full-time / Local</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Row 2: Hours Activity and Daily Schedule */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Chart */}
            <div className="bg-[#181926]/60 rounded-[28px] border border-white/10 p-5 shadow-lg flex flex-col justify-between min-h-[300px] backdrop-blur-md">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-extrabold text-base tracking-tight text-white font-[font2]">Hours Activity</h3>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="w-5 h-5 rounded-full bg-[#10b981]/15 flex items-center justify-center">
                      <ArrowUpRight className="w-3.5 h-3.5 text-[#10b981]" />
                    </span>
                    <span className="text-xs font-bold text-[#10b981]">+3% Increase <span className="text-gray-400 font-medium">than last week</span></span>
                  </div>
                </div>

                <div className="relative">
                  <button className="flex items-center gap-1 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl shadow-sm text-xs font-bold text-gray-300 cursor-pointer animate-none">
                    <span>Weekly</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Custom SVG interactive chart */}
              <div className="relative h-[160px] flex items-end justify-between px-2 mt-4">
                {hoveredBar !== null && (
                  <div 
                    className="absolute bg-[#13141f] text-white p-2.5 rounded-2xl shadow-2xl border border-white/10 z-20 pointer-events-none transition-all duration-200"
                    style={{
                      left: `${(hoveredBar * (100 / 7)) + 1}%`,
                      bottom: `${chartData[hoveredBar].val + 10}px`,
                      transform: 'translateX(-38%)',
                    }}
                  >
                    <div className="flex items-center gap-1 text-[11px] font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#a855f7]"></span>
                      <span>{chartData[hoveredBar].label}</span>
                    </div>
                    <p className="text-[9px] opacity-60 text-center font-semibold mt-0.5">{chartData[hoveredBar].date}</p>
                    <div className="w-2.5 h-2.5 bg-[#13141f] border-r border-b border-white/10 absolute bottom-[-6px] left-1/2 -translate-x-1/2 rotate-45 z-10" />
                  </div>
                )}

                {chartData.map((d, i) => (
                  <div 
                    key={d.day} 
                    className="flex flex-col items-center gap-2 flex-1 group cursor-pointer"
                    onMouseEnter={() => setHoveredBar(i)}
                  >
                    <div className="relative w-2 md:w-3.5 h-[120px] bg-white/5 rounded-full flex items-end">
                      <div 
                        className={`w-full rounded-full transition-all duration-300 ${
                          d.highlighted || hoveredBar === i
                            ? 'bg-[#a855f7]' 
                            : 'bg-[#7c3aed]/30'
                        }`}
                        style={{ height: `${d.val}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 group-hover:text-white transition-colors">{d.day}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Daily schedule */}
            <div className="bg-[#181926]/60 rounded-[28px] border border-white/10 p-5 shadow-lg flex flex-col justify-between backdrop-blur-md">
              <div>
                <h3 className="font-extrabold text-base tracking-tight text-white font-[font2]">Daily Schedule</h3>
                <p className="text-gray-400 text-xs font-semibold mt-0.5">Complete your daily mock coaching tracks</p>
              </div>

              <div className="flex flex-col gap-3 mt-4">
                <div className="flex items-center justify-between p-2.5 hover:bg-white/5 rounded-2xl transition-colors cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#ff7e40]/10 flex items-center justify-center text-[#ff7e40] font-bold shrink-0">
                      <Mic2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-white font-[font2] group-hover:text-[#7c3aed]">Design System practice</h4>
                      <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Lecture - Class</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                </div>

                <div className="flex items-center justify-between p-2.5 hover:bg-white/5 rounded-2xl transition-colors cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#6366f1]/10 flex items-center justify-center text-[#6366f1] font-bold shrink-0">
                      <Terminal className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-white font-[font2] group-hover:text-[#7c3aed]">Typography test</h4>
                      <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Group - Test</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                </div>

                <div className="flex items-center justify-between p-2.5 hover:bg-white/5 rounded-2xl transition-colors cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#10b981]/10 flex items-center justify-center text-[#10b981] font-bold shrink-0">
                      <Compass className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-white font-[font2] group-hover:text-[#7c3aed]">Color Style guide</h4>
                      <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Group - Test</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                </div>

                <div className="flex items-center justify-between p-2.5 hover:bg-white/5 rounded-2xl transition-colors cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#f59e0b]/10 flex items-center justify-center text-[#f59e0b] font-bold shrink-0">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-white font-[font2] group-hover:text-[#7c3aed]">Visual Design evaluation</h4>
                      <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Lecture - Test</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </div>
          </section>

          {/* Row 3: Active Course Tracker */}
          <section className="bg-[#181926]/60 rounded-[28px] border border-white/10 p-6 shadow-lg backdrop-blur-md">
            <div className="flex justify-between items-center mb-5">
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-lg tracking-tight text-white font-[font2]">Course You're Taking</h3>
                <div className="relative">
                  <button 
                    onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                    className="flex items-center gap-1 px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-gray-300 cursor-pointer animate-none"
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
            <div className="flex flex-col gap-4">
              {filteredApps.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400 font-semibold text-xs">No tracked applications match the filters.</p>
                  <button 
                    onClick={() => setIsAddAppModalOpen(true)}
                    className="text-xs text-[#7c3aed] font-bold hover:underline mt-1.5 cursor-pointer block mx-auto"
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
                    <div className="flex items-center gap-4 w-full md:w-auto">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg text-white shadow-sm shrink-0 ${
                        app.status === 'Offer' ? 'bg-[#10b981]' : app.status === 'Interviewing' ? 'bg-[#7c3aed]' : app.status === 'Rejected' ? 'bg-red-500' : 'bg-gray-500'
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

                    <div className="flex items-center gap-6 justify-between md:justify-end w-full md:w-auto">
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

        {/* Right Column (Premium, Calendar, Assignments) */}
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
              <h3 className="text-xl font-extrabold tracking-tight mt-2 font-[font2] leading-tight text-white">Go Premium</h3>
              <p className="text-[11px] text-gray-400 font-semibold mt-1 leading-normal">
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

          {/* Calendar */}
          <div className="bg-[#181926]/60 rounded-[28px] border border-white/10 p-5 shadow-lg backdrop-blur-md">
            <div className="flex justify-between items-center mb-4">
              <button 
                onClick={handlePrevMonth}
                className="p-1 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
              </button>

              <h4 className="font-extrabold text-xs tracking-tight text-white font-[font2] select-none">
                {months[month]}, {year}
              </h4>

              <button 
                onClick={handleNextMonth}
                className="p-1 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-all cursor-pointer"
              >
                <ChevronRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            <div className="grid grid-cols-7 text-center text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-2">
              <span>S</span>
              <span>M</span>
              <span>T</span>
              <span>W</span>
              <span>T</span>
              <span>F</span>
              <span>S</span>
            </div>

            <div className="grid grid-cols-7 gap-y-1.5 text-center text-xs font-semibold text-white">
              {calendarCells.map((cell, idx) => {
                const isCurrentDay = cell.isCurrentMonth && cell.dayNum === selectedCalendarDay;
                return (
                  <div key={idx} className="flex justify-center items-center py-1">
                    <button
                      onClick={() => {
                        if (cell.isCurrentMonth) setSelectedCalendarDay(cell.dayNum);
                      }}
                      className={`w-7 h-7 flex items-center justify-center rounded-full text-[11px] font-extrabold transition-all cursor-pointer ${
                        !cell.isCurrentMonth 
                          ? 'text-gray-600' 
                          : isCurrentDay
                            ? 'bg-[#7c3aed] text-white shadow-md font-extrabold scale-105'
                            : 'hover:bg-white/5 text-gray-300 hover:text-white'
                      }`}
                    >
                      {cell.dayNum}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Assignments */}
          <div className="bg-[#181926]/60 rounded-[28px] border border-white/10 p-5 shadow-lg backdrop-blur-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-extrabold text-base tracking-tight text-white font-[font2]">Assignments</h3>
              <button 
                onClick={() => setIsAddTaskModalOpen(true)}
                className="w-7 h-7 rounded-full bg-[#7c3aed] hover:bg-[#6d28d9] text-white flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <Plus className="w-4.5 h-4.5 stroke-[3]" />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {events.length === 0 ? (
                <p className="text-center text-xs text-gray-400 font-semibold py-4">No tasks listed.</p>
              ) : (
                events.map((ev) => (
                  <div 
                    key={ev.id}
                    className="flex items-center justify-between p-2.5 bg-white/5 rounded-2xl border border-white/5 hover:border-[#7c3aed]/20 transition-all gap-2 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        ev.type === 'Interview' ? 'bg-[#10b981]/10 text-[#10b981]' : ev.type === 'Follow-up' ? 'bg-[#6366f1]/10 text-[#6366f1]' : 'bg-[#f59e0b]/10 text-[#f59e0b]'
                      }`}>
                        <ClipboardList className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs text-white font-[font2] truncate">{ev.relatedApp}</h4>
                        <p className="text-[9px] text-gray-400 font-bold mt-0.5">{ev.time} • {ev.date}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`text-[9px] font-bold px-2 py-1 rounded-lg ${
                        ev.status === 'Completed'
                          ? 'bg-[#10b981]/15 text-[#10b981]'
                          : ev.status === 'In progress'
                            ? 'bg-[#6366f1]/15 text-[#6366f1]'
                            : 'bg-[#f59e0b]/15 text-[#f59e0b]'
                      }`}>
                        {ev.status || 'Upcoming'}
                      </span>
                      
                      <button 
                        onClick={() => deleteEvent(ev.id)}
                        className="p-0.5 hover:text-red-400 rounded text-gray-500 hover:bg-white/5 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
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
                <input required type="text" placeholder="e.g. Google" value={appForm.company} onChange={(e) => setAppForm({...appForm, company: e.target.value})} className="w-full p-3 bg-white/5 rounded-xl border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed]/30 transition-all font-[font1]" />
              </div>
              
              <div>
                <label className="block text-xs font-bold uppercase text-gray-400 mb-1 tracking-wider font-[font2]">Job Role</label>
                <input required type="text" placeholder="e.g. Software Engineer" value={appForm.role} onChange={(e) => setAppForm({...appForm, role: e.target.value})} className="w-full p-3 bg-white/5 rounded-xl border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed]/30 transition-all font-[font1]" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-400 mb-1 tracking-wider font-[font2]">Status</label>
                  <select value={appForm.status} onChange={(e) => setAppForm({...appForm, status: e.target.value})} className="w-full p-3 bg-white/5 rounded-xl border border-white/10 text-white focus:outline-none focus:border-[#7c3aed] transition-all font-[font1]">
                    <option className="bg-[#13141f]">Applied</option>
                    <option className="bg-[#13141f]">Interviewing</option>
                    <option className="bg-[#13141f]">Offer</option>
                    <option className="bg-[#13141f]">Rejected</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-400 mb-1 tracking-wider font-[font2]">Location Type</label>
                  <select value={appForm.locationType} onChange={(e) => setAppForm({...appForm, locationType: e.target.value})} className="w-full p-3 bg-white/5 rounded-xl border border-white/10 text-white focus:outline-none focus:border-[#7c3aed] transition-all font-[font1]">
                    <option className="bg-[#13141f]">Remote</option>
                    <option className="bg-[#13141f]">On-site</option>
                    <option className="bg-[#13141f]">Hybrid</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-400 mb-1 tracking-wider font-[font2]">Interviewer / Contact</label>
                <input type="text" placeholder="e.g. Michael Andrew" value={appForm.interviewer} onChange={(e) => setAppForm({...appForm, interviewer: e.target.value})} className="w-full p-3 bg-white/5 rounded-xl border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed]/30 transition-all font-[font1]" />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-400 mb-1 tracking-wider font-[font2]">Remaining Stage Time</label>
                <input type="text" placeholder="e.g. 8h 45min" value={appForm.remaining} onChange={(e) => setAppForm({...appForm, remaining: e.target.value})} className="w-full p-3 bg-white/5 rounded-xl border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed]/30 transition-all font-[font1]" />
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
                <select value={eventForm.type} onChange={(e) => setEventForm({...eventForm, type: e.target.value})} className="w-full p-3 bg-white/5 rounded-xl border border-white/10 text-white focus:outline-none focus:border-[#7c3aed] transition-all font-[font1]">
                  <option className="bg-[#13141f]">Interview</option>
                  <option className="bg-[#13141f]">Follow-up</option>
                  <option className="bg-[#13141f]">Assessment</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-400 mb-1 tracking-wider font-[font2]">Description / Topic</label>
                <input required type="text" placeholder="e.g. Google Coding Review" value={eventForm.relatedApp} onChange={(e) => setEventForm({...eventForm, relatedApp: e.target.value})} className="w-full p-3 bg-white/5 rounded-xl border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed]/30 transition-all font-[font1]" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-400 mb-1 tracking-wider font-[font2]">Date</label>
                  <input required type="date" value={eventForm.date} onChange={(e) => setEventForm({...eventForm, date: e.target.value})} className="w-full p-3 bg-white/5 rounded-xl border border-white/10 text-gray-400 focus:outline-none focus:border-[#7c3aed] transition-all font-[font1]" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-400 mb-1 tracking-wider font-[font2]">Time</label>
                  <input required type="time" value={eventForm.time} onChange={(e) => setEventForm({...eventForm, time: e.target.value})} className="w-full p-3 bg-white/5 rounded-xl border border-white/10 text-gray-400 focus:outline-none focus:border-[#7c3aed] transition-all font-[font1]" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-400 mb-1 tracking-wider font-[font2]">Status</label>
                <select value={eventForm.status} onChange={(e) => setEventForm({...eventForm, status: e.target.value})} className="w-full p-3 bg-white/5 rounded-xl border border-white/10 text-white focus:outline-none focus:border-[#7c3aed] transition-all font-[font1]">
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