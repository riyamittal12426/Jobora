import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Mic2, Briefcase, Terminal, Compass } from 'lucide-react';
import ResumeAnalysisModal from '../components/UserDashboard/ResumeAnalysisModal';
import ShapeBlur from '../components/Landing/ShapeBlur';

const UserDashboard = () => {
  const navigate = useNavigate();
  
  // State for user profile details
  const [user, setUser] = useState(null);
  const [isNewUser, setIsNewUser] = useState(true);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [autoAnalyzeResume, setAutoAnalyzeResume] = useState(false);

  // Lists for Dashboard Tracking
  const [applications, setApplications] = useState(() => JSON.parse(localStorage.getItem('applications')) || []);
  const [events, setEvents] = useState(() => JSON.parse(localStorage.getItem('events')) || []);

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
    source: ''
  });

  // Form State for Calendar Event
  const [eventForm, setEventForm] = useState({
    type: 'Interview',
    relatedApp: '',
    date: '',
    time: ''
  });

  useEffect(() => {
    // Check if user exists in local storage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setIsNewUser(false);

      fetch(`http://localhost:5000/api/users/${parsedUser.email}`)
        .then(res => res.ok ? res.json() : parsedUser)
        .then(data => {
          setUser(data);
          localStorage.setItem('user', JSON.stringify(data));
        })
        .catch(err => console.error('Error fetching user profile:', err));

      // Fetch user's applications from MongoDB backend
      fetch(`http://localhost:5000/api/applications/${parsedUser.email}`)
        .then(res => res.json())
        .then(data => {
          // Map _id to id so frontend mapping isn't broken
          const mappedData = data.map(app => ({ ...app, id: app._id }));
          setApplications(mappedData);
          localStorage.setItem('applications', JSON.stringify(mappedData));
        })
        .catch(err => console.error("Error fetching applications:", err));
    } else {
      // Pre-fill email from signup form
      const signupEmail = localStorage.getItem('signupEmail');
      if (signupEmail) {
        setProfileForm(prev => ({ ...prev, email: signupEmail }));
      }
    }
  }, []);

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
    
    // Switch to FormData so we can send the physical file object properly to the backend
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
      // Create user profile in MongoDB alongside the Resume upload
      const response = await fetch('http://localhost:5000/api/users/profile', {
        method: 'POST',
        body: formData // Let the browser set the multi-part content-type headers boundary automatically
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
      alert("Error connecting to backend database.");
    }
  };

  // Handlers for Add Application
  const handleAppSubmit = async (e) => {
    e.preventDefault();
    const newAppPayload = { ...appForm, userEmail: user.email };
    try {
      // Save application directly to MongoDB
      const response = await fetch('http://localhost:5000/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAppPayload)
      });
      if (response.ok) {
        const savedApp = await response.json();
        savedApp.id = savedApp._id; // Ensure consistent mapping
        const newApps = [...applications, savedApp];
        setApplications(newApps);
        localStorage.setItem('applications', JSON.stringify(newApps));
        setAppForm({ company: '', role: '', status: 'Applied', location: '', locationType: 'Remote', source: '' });
      }
    } catch (err) {
      console.error('Error saving application:', err);
    }
  };

  // Handlers for Calendar Events
  const handleEventSubmit = (e) => {
    e.preventDefault();
    const newEvents = [...events, { ...eventForm, id: Date.now() }];
    setEvents(newEvents);
    localStorage.setItem('events', JSON.stringify(newEvents));
    setEventForm({ type: 'Interview', relatedApp: '', date: '', time: '' });
  };

  // Account Management
  const handleLogout = () => {
    // Usually clear token here
    navigate('/auth');
  };

  const handleDeleteAccount = () => {
    if (window.confirm("Are you sure you want to delete your account? This cannot be undone.")) {
      localStorage.removeItem('user');
      localStorage.removeItem('applications');
      localStorage.removeItem('events');
      navigate('/auth');
    }
  };

  // Calculate Metrics
  const totalApps = applications.length;
  const activeInterviews = applications.filter(a => a.status === 'Interviewing').length;
  const offers = applications.filter(a => a.status === 'Offer').length;
  const rejections = applications.filter(a => a.status === 'Rejected').length;

  if (isNewUser) {
    return (
      <div className="relative min-h-screen bg-black text-white flex items-center justify-center p-6 overflow-hidden">
        {/* ShapeBlur animated background — same as landing page */}
        <div className='fixed inset-0 pointer-events-none z-0'>
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

        <form onSubmit={handleProfileSubmit} className="relative z-10 bg-white/5 backdrop-blur-xl p-8 rounded-2xl shadow-2xl w-full max-w-2xl border border-white/10">
          <h2 className="text-3xl font-bold mb-6 text-violet-400 font-[font2]">Complete Profile Setup</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <input required type="text" name="firstName" placeholder="First Name" onChange={handleProfileChange} className="p-3 bg-white/5 rounded-xl border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all font-[font1]" />
            <input required type="text" name="lastName" placeholder="Last Name" onChange={handleProfileChange} className="p-3 bg-white/5 rounded-xl border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all font-[font1]" />
            <input required type="email" name="email" placeholder="Email" onChange={handleProfileChange} className="p-3 bg-white/5 rounded-xl border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all font-[font1]" />
            <input required type="tel" name="phone" placeholder="Phone Number" onChange={handleProfileChange} className="p-3 bg-white/5 rounded-xl border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all font-[font1]" />
            <input required type="number" name="age" placeholder="Age" onChange={handleProfileChange} className="p-3 bg-white/5 rounded-xl border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all font-[font1]" />
            <input required type="text" name="address" placeholder="Address" onChange={handleProfileChange} className="p-3 bg-white/5 rounded-xl border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all font-[font1]" />
          </div>
          <div className="mb-6">
            <label className="block text-gray-400 mb-2 font-[font1]">Resume Upload</label>
            <input required type="file" name="resume" onChange={handleProfileChange} className="p-3 bg-white/5 rounded-xl w-full border border-white/10 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-violet-600 file:text-white file:font-semibold file:cursor-pointer hover:file:bg-violet-500 transition-all font-[font1]" />
          </div>
          <button type="submit" className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-violet-500/25 font-[font2]">
            Complete Profile
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-black text-white p-6 md:p-12 font-[font1] overflow-hidden">
      {/* ShapeBlur animated background — same as landing page */}
      <div className='fixed inset-0 pointer-events-none z-0'>
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

      {/* All content sits above the background */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 pb-6 border-b border-white/10">
          <div>
            <h1 className="text-4xl font-bold font-[font2]">Welcome back, {user.firstName}!</h1>
            <div className="flex items-center gap-4 mt-2">
              <p className="text-gray-400">{user.email} • Setup Complete</p>
              {user.resume && user.resume !== 'Uploaded' && (
                <a href={user.resume} target="_blank" rel="noopener noreferrer" className="px-3 py-1 bg-violet-600 hover:bg-violet-500 font-bold rounded-lg text-sm transition-all text-white">
                  Show Resume
                </a>
              )}
            </div>
          </div>
          <div className="flex gap-4 mt-4 md:mt-0">
            <button onClick={handleLogout} className="px-4 py-2 bg-white/10 hover:bg-white/15 rounded-xl border border-white/10 transition-all backdrop-blur-sm font-[font2]">Log Out</button>
            <button onClick={handleDeleteAccount} className="px-4 py-2 bg-red-900/30 hover:bg-red-800/40 text-red-300 rounded-xl border border-red-500/20 transition-all backdrop-blur-sm font-[font2]">Delete Account</button>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white/5 backdrop-blur-xl p-6 rounded-2xl text-center border border-white/10 hover:border-violet-500/30 transition-all">
            <p className="text-gray-400 mb-2 font-[font1]">Total Applications</p>
            <p className="text-4xl font-bold text-violet-400 font-[font2]">{totalApps}</p>
          </div>
          <div className="bg-white/5 backdrop-blur-xl p-6 rounded-2xl text-center border border-white/10 hover:border-yellow-500/30 transition-all">
            <p className="text-gray-400 mb-2 font-[font1]">Active Interviews</p>
            <p className="text-4xl font-bold text-yellow-400 font-[font2]">{activeInterviews}</p>
          </div>
          <div className="bg-white/5 backdrop-blur-xl p-6 rounded-2xl text-center border border-white/10 hover:border-green-500/30 transition-all">
            <p className="text-gray-400 mb-2 font-[font1]">Offers</p>
            <p className="text-4xl font-bold text-green-400 font-[font2]">{offers}</p>
          </div>
          <div className="bg-white/5 backdrop-blur-xl p-6 rounded-2xl text-center border border-white/10 hover:border-red-500/30 transition-all">
            <p className="text-gray-400 mb-2 font-[font1]">Rejections</p>
            <p className="text-4xl font-bold text-red-400 font-[font2]">{rejections}</p>
          </div>
        </div>

        {/* AI Resume Analysis Premium Card */}
        <section className="bg-gradient-to-br from-violet-900/40 to-purple-900/20 p-6 md:p-8 rounded-2xl border border-violet-500/30 relative overflow-hidden mb-12 shadow-xl shadow-violet-900/10 backdrop-blur-xl">
          <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
            <Sparkles size={160} />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/20 text-violet-300 text-xs font-bold uppercase tracking-wider mb-4 border border-violet-500/30 font-[font2]">
                <Sparkles size={14} />
                Premium Feature
              </div>
              <h2 className="text-3xl font-bold mb-3 font-[font2] text-white">AI Resume Analysis</h2>
              <p className="text-violet-200/80 max-w-2xl text-lg font-[font1]">
                Unlock the secrets of your resume. Our AI scans for ATS compatibility, technical alignment, structuring weaknesses, and missing skills to guarantee you stand out to elite recruiters.
              </p>
            </div>
            <div>
              <button 
                onClick={() => {
                  setAutoAnalyzeResume(true);
                  setIsAnalysisModalOpen(true);
                }}
                className="bg-violet-600 hover:bg-violet-500 text-white font-bold py-4 px-8 rounded-xl transition-all hover:scale-105 flex items-center gap-3 shadow-lg shadow-violet-500/25 whitespace-nowrap font-[font2]"
              >
                <Sparkles fill="white" size={20} />
                Analyze Resume
              </button>
            </div>
          </div>
        </section>

        {/* AI Career Roadmap Premium Card */}
        <section className="bg-gradient-to-br from-indigo-950/40 via-gray-900/20 to-violet-950/30 p-6 md:p-8 rounded-2xl border border-indigo-500/25 relative overflow-hidden mb-12 shadow-xl shadow-indigo-900/10 backdrop-blur-xl">
          <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
            <Compass size={160} />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-4 border border-indigo-500/30 font-[font2]">
                <Compass size={14} />
                AI Career Coach
              </div>
              <h2 className="text-3xl font-bold mb-3 font-[font2] text-white">AI Career Roadmap</h2>
              <p className="text-indigo-100/70 max-w-2xl text-lg font-[font1]">
                Bridge the skill gap to your dream role. Get a personalized 90-day action plan featuring hand-picked courses, practice labs, simulated score growth trackers, and a dedicated AI Career Coach.
              </p>
            </div>
            <div>
              <button
                onClick={() => navigate('/roadmap')}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 px-8 rounded-xl transition-all hover:scale-105 flex items-center gap-3 shadow-lg shadow-indigo-500/25 whitespace-nowrap font-[font2]"
              >
                <Compass size={20} />
                View Career Roadmap
              </button>
            </div>
          </div>
        </section>

        {/* AI Mock Interview Premium Card */}
        <section className="bg-gradient-to-br from-emerald-950/40 via-gray-900/20 to-cyan-950/30 p-6 md:p-8 rounded-2xl border border-emerald-500/25 relative overflow-hidden mb-12 shadow-xl shadow-emerald-900/10 backdrop-blur-xl">
          <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
            <Mic2 size={160} />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-4 border border-emerald-500/30 font-[font2]">
                <Mic2 size={14} />
                AI Interview Simulator
              </div>
              <h2 className="text-3xl font-bold mb-3 font-[font2] text-white">AI Mock Interview</h2>
              <p className="text-emerald-100/70 max-w-2xl text-lg font-[font1]">
                Practice with a senior FAANG-style interviewer. Questions are generated from your resume — your skills, projects, and achievements — with detailed scoring and a personalized learning roadmap.
              </p>
            </div>
            <div>
              <button
                onClick={() => navigate('/mock-interview')}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 px-8 rounded-xl transition-all hover:scale-105 flex items-center gap-3 shadow-lg shadow-emerald-500/25 whitespace-nowrap font-[font2]"
              >
                <Mic2 size={20} />
                Start Interview
              </button>
            </div>
          </div>
        </section>

        {/* AI Job Recommendations Premium Card */}
        <section className="bg-gradient-to-br from-cyan-950/40 via-gray-900/20 to-blue-950/30 p-6 md:p-8 rounded-2xl border border-cyan-500/25 relative overflow-hidden mb-12 shadow-xl shadow-cyan-900/10 backdrop-blur-xl">
          <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
            <Briefcase size={160} />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-bold uppercase tracking-wider mb-4 border border-cyan-500/30 font-[font2]">
                <Briefcase size={14} />
                AI Career Coach
              </div>
              <h2 className="text-3xl font-bold mb-3 font-[font2] text-white">AI Job Recommendations</h2>
              <p className="text-cyan-100/70 max-w-2xl text-lg font-[font1]">
                Real jobs from JSearch, ranked by AI match score. Get apply readiness scores, skill gap intelligence, career advisor insights, and recruiter-style feedback for every opportunity.
              </p>
            </div>
            <div>
              <button
                onClick={() => navigate('/job-recommendations')}
                className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-4 px-8 rounded-xl transition-all hover:scale-105 flex items-center gap-3 shadow-lg shadow-cyan-500/25 whitespace-nowrap font-[font2]"
              >
                <Briefcase size={20} />
                View Recommendations
              </button>
            </div>
          </div>
        </section>

        {/* AI Application Autofill Assistant Premium Card */}
        <section className="bg-gradient-to-br from-purple-950/40 via-gray-900/20 to-indigo-950/30 p-6 md:p-8 rounded-2xl border border-purple-500/25 relative overflow-hidden mb-12 shadow-xl shadow-purple-900/10 backdrop-blur-xl">
          <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
            <Sparkles size={160} />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold uppercase tracking-wider mb-4 border border-purple-500/30 font-[font2]">
                <Sparkles size={14} />
                AI Auto-Fill Assistant
              </div>
              <h2 className="text-3xl font-bold mb-3 font-[font2] text-white">AI Application Autofill Assistant</h2>
              <p className="text-purple-100/70 max-w-2xl text-lg font-[font1]">
                Draft custom application screening answers, map portal form fields, generate professional cover letters, and inspect recruiter review predictions in a sandbox environment before submission.
              </p>
            </div>
            <div>
              <button
                onClick={() => navigate('/prepare-application')}
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 px-8 rounded-xl transition-all hover:scale-105 flex items-center gap-3 shadow-lg shadow-purple-500/25 whitespace-nowrap font-[font2]"
              >
                <Sparkles size={20} />
                Launch Assistant
              </button>
            </div>
          </div>
        </section>

        {/* AI-Powered Job Application Automation Center Card */}
        <section className="bg-gradient-to-br from-violet-950/40 via-gray-900/20 to-fuchsia-950/30 p-6 md:p-8 rounded-2xl border border-violet-500/25 relative overflow-hidden mb-12 shadow-xl shadow-violet-900/10 backdrop-blur-xl">
          <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
            <Terminal size={160} />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/20 text-violet-300 text-xs font-bold uppercase tracking-wider mb-4 border border-violet-500/30 font-[font2]">
                <Terminal size={14} />
                AI Application Automation
              </div>
              <h2 className="text-3xl font-bold mb-3 font-[font2] text-white">Application Automation Center</h2>
              <p className="text-violet-100/70 max-w-2xl text-lg font-[font1]">
                Auto-apply to Greenhouse, Lever, Wellfound, YC Jobs, and standard career portals. Features human approval safeguards, live form filling, and real-time execution tracing.
              </p>
            </div>
            <div>
              <button
                onClick={() => navigate('/automation')}
                className="bg-violet-600 hover:bg-violet-500 text-white font-bold py-4 px-8 rounded-xl transition-all hover:scale-105 flex items-center gap-3 shadow-lg shadow-violet-500/25 whitespace-nowrap font-[font2]"
              >
                <Terminal size={20} />
                Open Automation Center
              </button>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Column */}
          <div className="space-y-12">
            {/* Recent Activity */}
            <section className="bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-white/10">
              <h2 className="text-2xl font-bold mb-6 font-[font2]">Recent Activity</h2>
              {applications.length === 0 && events.length === 0 ? (
                <p className="text-gray-500 font-[font1]">No activity yet. Add an application to get started!</p>
              ) : (
                <ul className="space-y-4">
                  {applications.slice(-3).reverse().map(app => (
                    <li key={app.id} className="p-4 bg-white/5 rounded-xl border border-white/10 flex justify-between items-center hover:border-violet-500/20 transition-all">
                      <div>
                        <h3 className="font-bold font-[font2]">{app.role} at {app.company}</h3>
                        <p className="text-sm text-gray-400 font-[font1]">{app.locationType} • {app.source}</p>
                      </div>
                      <span className="px-3 py-1 bg-violet-900/30 text-violet-300 rounded-full text-xs border border-violet-800/50 font-[font2]">{app.status}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Calendar / Reminders */}
            <section className="bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-white/10">
              <h2 className="text-2xl font-bold mb-6 font-[font2]">Calendar & Reminders</h2>
              <form onSubmit={handleEventSubmit} className="mb-6 grid grid-cols-2 gap-4">
                <select name="type" value={eventForm.type} onChange={(e) => setEventForm({...eventForm, type: e.target.value})} className="p-2 bg-white/5 rounded-xl border border-white/10 col-span-2 md:col-span-1 text-white focus:outline-none focus:border-violet-500/50 transition-all font-[font1]">
                  <option className="bg-gray-900">Interview</option>
                  <option className="bg-gray-900">Follow-up</option>
                  <option className="bg-gray-900">Assessment</option>
                  <option className="bg-gray-900">Deadline</option>
                </select>
                <input type="text" placeholder="Related Application (Company)" value={eventForm.relatedApp} onChange={(e) => setEventForm({...eventForm, relatedApp: e.target.value})} required className="p-2 bg-white/5 rounded-xl border border-white/10 col-span-2 md:col-span-1 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50 transition-all font-[font1]" />
                <input type="date" value={eventForm.date} onChange={(e) => setEventForm({...eventForm, date: e.target.value})} required className="p-2 bg-white/5 rounded-xl border border-white/10 text-white focus:outline-none focus:border-violet-500/50 transition-all font-[font1]" />
                <input type="time" value={eventForm.time} onChange={(e) => setEventForm({...eventForm, time: e.target.value})} required className="p-2 bg-white/5 rounded-xl border border-white/10 text-white focus:outline-none focus:border-violet-500/50 transition-all font-[font1]" />
                <button type="submit" className="col-span-2 mt-2 bg-violet-600 hover:bg-violet-500 py-2 rounded-xl font-bold transition-all hover:shadow-lg hover:shadow-violet-500/20 font-[font2]">Add Reminder</button>
              </form>
              
              <div className="space-y-3 mt-6">
                {events.slice(-5).reverse().map(ev => (
                  <div key={ev.id} className="p-3 bg-white/5 rounded-xl border border-white/10 flex justify-between items-center hover:border-violet-500/20 transition-all">
                    <div>
                      <p className="font-bold text-violet-300 font-[font2]">{ev.type}</p>
                      <p className="text-sm font-[font1]">{ev.relatedApp}</p>
                    </div>
                    <div className="text-right text-gray-400 text-sm font-[font1]">
                      <p>{ev.date}</p>
                      <p>{ev.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right Column - Add Application */}
          <div>
            <section className="bg-white/5 backdrop-blur-xl p-6 md:p-8 rounded-2xl border border-white/10 sticky top-6">
              <h2 className="text-3xl font-bold mb-6 font-[font2] text-violet-400">Add Application</h2>
              <form onSubmit={handleAppSubmit} className="space-y-5">
                <div>
                  <label className="block text-gray-400 mb-1 text-sm font-[font1]">Company</label>
                  <input required type="text" value={appForm.company} onChange={(e) => setAppForm({...appForm, company: e.target.value})} className="w-full p-3 bg-white/5 rounded-xl border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all font-[font1]" placeholder="e.g. Google" />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1 text-sm font-[font1]">Role</label>
                  <input required type="text" value={appForm.role} onChange={(e) => setAppForm({...appForm, role: e.target.value})} className="w-full p-3 bg-white/5 rounded-xl border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all font-[font1]" placeholder="e.g. Frontend Engineer" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 mb-1 text-sm font-[font1]">Status</label>
                    <select value={appForm.status} onChange={(e) => setAppForm({...appForm, status: e.target.value})} className="w-full p-3 bg-white/5 rounded-xl border border-white/10 text-white focus:outline-none focus:border-violet-500/50 transition-all font-[font1]">
                      <option className="bg-gray-900">Applied</option>
                      <option className="bg-gray-900">Interviewing</option>
                      <option className="bg-gray-900">Offer</option>
                      <option className="bg-gray-900">Rejected</option>
                      <option className="bg-gray-900">Ghosted</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-1 text-sm font-[font1]">Location Type</label>
                    <select value={appForm.locationType} onChange={(e) => setAppForm({...appForm, locationType: e.target.value})} className="w-full p-3 bg-white/5 rounded-xl border border-white/10 text-white focus:outline-none focus:border-violet-500/50 transition-all font-[font1]">
                      <option className="bg-gray-900">Remote</option>
                      <option className="bg-gray-900">On-site</option>
                      <option className="bg-gray-900">Hybrid</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-gray-400 mb-1 text-sm font-[font1]">Location</label>
                  <input type="text" value={appForm.location} onChange={(e) => setAppForm({...appForm, location: e.target.value})} className="w-full p-3 bg-white/5 rounded-xl border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all font-[font1]" placeholder="e.g. New York, NY" />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1 text-sm font-[font1]">Source</label>
                  <input type="text" value={appForm.source} onChange={(e) => setAppForm({...appForm, source: e.target.value})} className="w-full p-3 bg-white/5 rounded-xl border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all font-[font1]" placeholder="e.g. LinkedIn, Referral" />
                </div>
                <button type="submit" className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-3 mt-4 rounded-xl transition-all text-lg hover:shadow-lg hover:shadow-violet-500/25 font-[font2]">
                  Track Application
                </button>
              </form>
            </section>
          </div>
        </div>
      </div>
      <ResumeAnalysisModal
        isOpen={isAnalysisModalOpen}
        onClose={() => {
          setIsAnalysisModalOpen(false);
          setAutoAnalyzeResume(false);
        }}
        user={user}
        autoAnalyze={autoAnalyzeResume}
      />
    </div>
  );
};

export default UserDashboard;