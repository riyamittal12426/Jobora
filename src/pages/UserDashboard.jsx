import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import ResumeAnalysisModal from '../components/UserDashboard/ResumeAnalysisModal';

const UserDashboard = () => {
  const navigate = useNavigate();
  
  // State for user profile details
  const [user, setUser] = useState(null);
  const [isNewUser, setIsNewUser] = useState(true);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);

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
      <div className="min-h-screen bg-[#111] text-white flex items-center justify-center p-6">
        <form onSubmit={handleProfileSubmit} className="bg-gray-900 p-8 rounded-lg shadow-xl w-full max-w-2xl">
          <h2 className="text-3xl font-bold mb-6 text-blue-400">Complete Profile Setup</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <input required type="text" name="firstName" placeholder="First Name" onChange={handleProfileChange} className="p-3 bg-gray-800 rounded border border-gray-700" />
            <input required type="text" name="lastName" placeholder="Last Name" onChange={handleProfileChange} className="p-3 bg-gray-800 rounded border border-gray-700" />
            <input required type="email" name="email" placeholder="Email" onChange={handleProfileChange} className="p-3 bg-gray-800 rounded border border-gray-700" />
            <input required type="tel" name="phone" placeholder="Phone Number" onChange={handleProfileChange} className="p-3 bg-gray-800 rounded border border-gray-700" />
            <input required type="number" name="age" placeholder="Age" onChange={handleProfileChange} className="p-3 bg-gray-800 rounded border border-gray-700" />
            <input required type="text" name="address" placeholder="Address" onChange={handleProfileChange} className="p-3 bg-gray-800 rounded border border-gray-700" />
          </div>
          <div className="mb-6">
            <label className="block text-gray-400 mb-2">Resume Upload</label>
            <input required type="file" name="resume" onChange={handleProfileChange} className="p-3 bg-gray-800 rounded w-full border border-gray-700" />
          </div>
          <button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded transition-colors">
            Complete Profile
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111] text-white p-6 md:p-12 font-[font1]">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 pb-6 border-b border-gray-800 relative z-10">
        <div>
          <h1 className="text-4xl font-bold font-[font2]">Welcome back, {user.firstName}!</h1>
          <div className="flex items-center gap-4 mt-2">
            <p className="text-gray-400">{user.email} • Setup Complete</p>
            {user.resume && user.resume !== 'Uploaded' && (
              <a href={user.resume} target="_blank" rel="noopener noreferrer" className="px-3 py-1 bg-blue-600 hover:bg-blue-500 font-bold rounded text-sm transition-colors text-white">
                Show Resume
              </a>
            )}
          </div>
        </div>
        <div className="flex gap-4 mt-4 md:mt-0">
          <button onClick={handleLogout} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded transition-colors">Log Out</button>
          <button onClick={handleDeleteAccount} className="px-4 py-2 bg-red-900/50 hover:bg-red-800 text-red-200 rounded transition-colors">Delete Account</button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
        <div className="bg-gray-900 p-6 rounded-lg text-center border border-gray-800">
          <p className="text-gray-400 mb-2">Total Applications</p>
          <p className="text-4xl font-bold text-blue-400">{totalApps}</p>
        </div>
        <div className="bg-gray-900 p-6 rounded-lg text-center border border-gray-800">
          <p className="text-gray-400 mb-2">Active Interviews</p>
          <p className="text-4xl font-bold text-yellow-400">{activeInterviews}</p>
        </div>
        <div className="bg-gray-900 p-6 rounded-lg text-center border border-gray-800">
          <p className="text-gray-400 mb-2">Offers</p>
          <p className="text-4xl font-bold text-green-400">{offers}</p>
        </div>
        <div className="bg-gray-900 p-6 rounded-lg text-center border border-gray-800">
          <p className="text-gray-400 mb-2">Rejections</p>
          <p className="text-4xl font-bold text-red-400">{rejections}</p>
        </div>
      </div>

      {/* AI Resume Analysis Premium Card */}
      <section className="bg-gradient-to-br from-indigo-900/40 to-purple-900/20 p-6 md:p-8 rounded-2xl border border-indigo-500/30 relative overflow-hidden mb-12 shadow-xl shadow-indigo-900/10">
        <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
          <Sparkles size={160} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-4 border border-indigo-500/30">
              <Sparkles size={14} />
              Premium Feature
            </div>
            <h2 className="text-3xl font-bold mb-3 font-[font2] text-white">AI Resume Analysis</h2>
            <p className="text-indigo-200/80 max-w-2xl text-lg">
              Unlock the secrets of your resume. Our AI scans for ATS compatibility, technical alignment, structuring weaknesses, and missing skills to guarantee you stand out to elite recruiters.
            </p>
          </div>
          <div>
            <button 
              onClick={() => setIsAnalysisModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 px-8 rounded-xl transition-all hover:scale-105 flex items-center gap-3 shadow-lg shadow-indigo-500/25 whitespace-nowrap"
            >
              <Sparkles fill="white" size={20} />
              Analyze Resume
            </button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left Column */}
        <div className="space-y-12">
          {/* Recent Activity */}
          <section className="bg-gray-900 p-6 rounded-lg border border-gray-800">
            <h2 className="text-2xl font-bold mb-6 font-[font2]">Recent Activity</h2>
            {applications.length === 0 && events.length === 0 ? (
              <p className="text-gray-500">No activity yet. Add an application to get started!</p>
            ) : (
              <ul className="space-y-4">
                {applications.slice(-3).reverse().map(app => (
                  <li key={app.id} className="p-4 bg-gray-800 rounded border border-gray-700 flex justify-between items-center">
                    <div>
                      <h3 className="font-bold">{app.role} at {app.company}</h3>
                      <p className="text-sm text-gray-400">{app.locationType} • {app.source}</p>
                    </div>
                    <span className="px-3 py-1 bg-blue-900/30 text-blue-300 rounded-full text-xs border border-blue-800/50">{app.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Calendar / Reminders */}
          <section className="bg-gray-900 p-6 rounded-lg border border-gray-800">
            <h2 className="text-2xl font-bold mb-6 font-[font2]">Calendar & Reminders</h2>
            <form onSubmit={handleEventSubmit} className="mb-6 grid grid-cols-2 gap-4">
              <select name="type" value={eventForm.type} onChange={(e) => setEventForm({...eventForm, type: e.target.value})} className="p-2 bg-gray-800 rounded border border-gray-700 col-span-2 md:col-span-1">
                <option>Interview</option>
                <option>Follow-up</option>
                <option>Assessment</option>
                <option>Deadline</option>
              </select>
              <input type="text" placeholder="Related Application (Company)" value={eventForm.relatedApp} onChange={(e) => setEventForm({...eventForm, relatedApp: e.target.value})} required className="p-2 bg-gray-800 rounded border border-gray-700 col-span-2 md:col-span-1" />
              <input type="date" value={eventForm.date} onChange={(e) => setEventForm({...eventForm, date: e.target.value})} required className="p-2 bg-gray-800 rounded border border-gray-700" />
              <input type="time" value={eventForm.time} onChange={(e) => setEventForm({...eventForm, time: e.target.value})} required className="p-2 bg-gray-800 rounded border border-gray-700" />
              <button type="submit" className="col-span-2 mt-2 bg-indigo-600 hover:bg-indigo-500 py-2 rounded font-bold transition-colors">Add Reminder</button>
            </form>
            
            <div className="space-y-3 mt-6">
              {events.slice(-5).reverse().map(ev => (
                <div key={ev.id} className="p-3 bg-gray-800 rounded border border-gray-700 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-indigo-300">{ev.type}</p>
                    <p className="text-sm">{ev.relatedApp}</p>
                  </div>
                  <div className="text-right text-gray-400 text-sm">
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
          <section className="bg-gray-900 p-6 md:p-8 rounded-lg border border-gray-800 sticky top-6">
            <h2 className="text-3xl font-bold mb-6 font-[font2] text-blue-400">Add Application</h2>
            <form onSubmit={handleAppSubmit} className="space-y-5">
              <div>
                <label className="block text-gray-400 mb-1 text-sm">Company</label>
                <input required type="text" value={appForm.company} onChange={(e) => setAppForm({...appForm, company: e.target.value})} className="w-full p-3 bg-gray-800 rounded border border-gray-700" placeholder="e.g. Google" />
              </div>
              <div>
                <label className="block text-gray-400 mb-1 text-sm">Role</label>
                <input required type="text" value={appForm.role} onChange={(e) => setAppForm({...appForm, role: e.target.value})} className="w-full p-3 bg-gray-800 rounded border border-gray-700" placeholder="e.g. Frontend Engineer" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 mb-1 text-sm">Status</label>
                  <select value={appForm.status} onChange={(e) => setAppForm({...appForm, status: e.target.value})} className="w-full p-3 bg-gray-800 rounded border border-gray-700">
                    <option>Applied</option>
                    <option>Interviewing</option>
                    <option>Offer</option>
                    <option>Rejected</option>
                    <option>Ghosted</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 mb-1 text-sm">Location Type</label>
                  <select value={appForm.locationType} onChange={(e) => setAppForm({...appForm, locationType: e.target.value})} className="w-full p-3 bg-gray-800 rounded border border-gray-700">
                    <option>Remote</option>
                    <option>On-site</option>
                    <option>Hybrid</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-gray-400 mb-1 text-sm">Location</label>
                <input type="text" value={appForm.location} onChange={(e) => setAppForm({...appForm, location: e.target.value})} className="w-full p-3 bg-gray-800 rounded border border-gray-700" placeholder="e.g. New York, NY" />
              </div>
              <div>
                <label className="block text-gray-400 mb-1 text-sm">Source</label>
                <input type="text" value={appForm.source} onChange={(e) => setAppForm({...appForm, source: e.target.value})} className="w-full p-3 bg-gray-800 rounded border border-gray-700" placeholder="e.g. LinkedIn, Referral" />
              </div>
              <button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 mt-4 rounded transition-colors text-lg">
                Track Application
              </button>
            </form>
          </section>
        </div>
      </div>
      <ResumeAnalysisModal isOpen={isAnalysisModalOpen} onClose={() => setIsAnalysisModalOpen(false)} user={user} />
    </div>
  );
};

export default UserDashboard;