import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, Mail, Link, MapPin, Building2, Calendar, MoreVertical, Edit2, Trash2, X, Search, Sparkles } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE_URL } from '../../services/apiConfig';
import EmailGeneratorModal from './EmailGeneratorModal';
import NetworkingCopilotModal from './NetworkingCopilotModal';

const STATUS_OPTIONS = ['To Contact', 'Contacted', 'In Discussion', 'Referral Granted', 'Cold'];

const STATUS_COLORS = {
  'To Contact': 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  'Contacted': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'In Discussion': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  'Referral Granted': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'Cold': 'bg-red-500/20 text-red-400 border-red-500/30'
};

const NetworkCRMPage = () => {
  const { user } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [selectedContactForEmail, setSelectedContactForEmail] = useState(null);
  
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    company: '',
    email: '',
    linkedinUrl: '',
    status: 'To Contact',
    notes: ''
  });

  useEffect(() => {
    fetchContacts();
  }, [user]);

  const fetchContacts = async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${API_BASE_URL}/api/network/${user.email}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setContacts(data);
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (contact = null) => {
    if (contact) {
      setEditingContact(contact);
      setFormData({
        name: contact.name,
        role: contact.role,
        company: contact.company,
        email: contact.email || '',
        linkedinUrl: contact.linkedinUrl || '',
        status: contact.status,
        notes: contact.notes || ''
      });
    } else {
      setEditingContact(null);
      setFormData({
        name: '',
        role: '',
        company: '',
        email: '',
        linkedinUrl: '',
        status: 'To Contact',
        notes: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = await user.getIdToken();
      const url = editingContact 
        ? `${API_BASE_URL}/api/network/${editingContact._id}`
        : `${API_BASE_URL}/api/network`;
      const method = editingContact ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ ...formData, userEmail: user.email })
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchContacts();
      }
    } catch (error) {
      console.error('Error saving contact:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this contact?')) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${API_BASE_URL}/api/network/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchContacts();
    } catch (error) {
      console.error('Error deleting contact:', error);
    }
  };

  // Group contacts by status
  const groupedContacts = STATUS_OPTIONS.reduce((acc, status) => {
    acc[status] = contacts.filter(c => c.status === status);
    return acc;
  }, {});

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <div className="bg-[#0c0d14]/50 border border-white/5 p-6 rounded-[24px] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-[font2] text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-[#7c3aed]" /> Network CRM
          </h1>
          <p className="text-gray-400 text-sm mt-1">Manage your networking contacts, recruiters, and referral pipeline.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => {
              setSelectedContactForEmail(null);
              setIsEmailModalOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-pink-500/10 text-pink-500 hover:bg-pink-500/20 border border-pink-500/20 transition-colors rounded-xl font-semibold text-sm shrink-0"
          >
            <Sparkles size={16} /> Draft Email
          </button>
          <button 
            onClick={() => setIsCopilotOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#a855f7]/10 text-[#a855f7] hover:bg-[#a855f7]/20 border border-[#a855f7]/20 transition-colors rounded-xl font-semibold text-sm shrink-0"
          >
            <Sparkles size={16} /> AI Copilot
          </button>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#7c3aed] hover:bg-[#6d28d9] transition-colors rounded-xl font-semibold text-white text-sm shrink-0 shadow-lg shadow-purple-900/20"
          >
            <Plus size={16} /> Add Contact
          </button>
        </div>
      </div>

      {/* Board Layout */}
      {isLoading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-[#7c3aed]/30 border-t-[#7c3aed] rounded-full animate-spin"></div></div>
      ) : contacts.length === 0 ? (
        <div className="text-center py-20 bg-white/5 border border-white/10 rounded-3xl">
          <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white font-[font2]">No contacts yet</h2>
          <p className="text-gray-400 mt-2 text-sm max-w-sm mx-auto">Start building your network by adding recruiters, hiring managers, or peers.</p>
          <button onClick={() => handleOpenModal()} className="mt-6 px-6 py-2 bg-white/10 hover:bg-white/20 transition-colors rounded-xl text-sm font-semibold">Add First Contact</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 overflow-x-auto pb-4">
          {STATUS_OPTIONS.map(status => (
            <div key={status} className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 min-w-[280px]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm text-gray-300">{status}</h3>
                <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-gray-400 font-medium">{groupedContacts[status].length}</span>
              </div>
              
              <div className="flex flex-col gap-3">
                {groupedContacts[status].map(contact => (
                  <motion.div 
                    layoutId={contact._id}
                    key={contact._id} 
                    className="bg-[#13141f] border border-gray-800 hover:border-gray-700 rounded-xl p-4 transition-all group relative cursor-pointer"
                    onClick={() => handleOpenModal(contact)}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-white text-[15px] truncate">{contact.name}</h4>
                        <p className="text-xs text-indigo-400 font-medium truncate mt-0.5">{contact.role}</p>
                      </div>
                      <div className="relative shrink-0">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDelete(contact._id); }}
                          className="p-1.5 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity rounded-md hover:bg-red-500/10"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-400">
                      <Building2 size={12} className="shrink-0" />
                      <span className="truncate">{contact.company}</span>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-800 flex items-center justify-between">
                      <div className="flex gap-2">
                        {contact.linkedinUrl && (
                          <a href={contact.linkedinUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="text-gray-500 hover:text-blue-400 transition-colors">
                            <Link size={14} />
                          </a>
                        )}
                        {contact.email && (
                          <button 
                            onClick={e => {
                              e.stopPropagation();
                              setSelectedContactForEmail(contact);
                              setIsEmailModalOpen(true);
                            }} 
                            className="text-gray-500 hover:text-pink-400 transition-colors"
                          >
                            <Mail size={14} />
                          </button>
                        )}
                      </div>
                      <span className={`text-[10px] px-2 py-1 rounded-md border font-semibold ${STATUS_COLORS[contact.status]}`}>
                        {contact.status}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative bg-[#13141f] border border-gray-800 rounded-[24px] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-gray-800 flex justify-between items-center">
                <h2 className="text-xl font-bold text-white font-[font2]">{editingContact ? 'Edit Contact' : 'New Contact'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 overflow-y-auto max-h-[60vh]">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5">Name *</label>
                    <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-black/50 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors" placeholder="e.g. Jane Doe" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5">Role *</label>
                    <input required type="text" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full bg-black/50 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors" placeholder="e.g. Sr. Recruiter" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">Company *</label>
                  <input required type="text" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} className="w-full bg-black/50 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors" placeholder="e.g. Google" />
                </div>

                {/* LinkedIn Search Shortcut */}
                {(formData.name || formData.company) && (
                  <div className="flex justify-start">
                    <a 
                      href={`https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(`${formData.name} ${formData.company}`.trim())}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0a66c2]/10 text-[#4c9bea] hover:bg-[#0a66c2]/20 text-xs font-semibold transition-colors border border-[#0a66c2]/20"
                    >
                      <Search size={12} /> Find on LinkedIn
                    </a>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5">Email</label>
                    <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-black/50 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors" placeholder="jane@google.com" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5">LinkedIn URL</label>
                    <input type="url" value={formData.linkedinUrl} onChange={e => setFormData({...formData, linkedinUrl: e.target.value})} className="w-full bg-black/50 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors" placeholder="https://linkedin.com/in/jane" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">Pipeline Status</label>
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full bg-black/50 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors appearance-none">
                    {STATUS_OPTIONS.map(status => <option key={status} value={status} className="bg-gray-900">{status}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">Notes</label>
                  <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full bg-black/50 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors min-h-[80px]" placeholder="Met at AI conference..." />
                </div>
                
                <div className="mt-4 flex justify-end gap-3 pt-4 border-t border-gray-800">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-400 hover:text-white hover:bg-white/5 transition-colors">Cancel</button>
                  <button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#7c3aed] hover:bg-[#6d28d9] transition-colors shadow-lg shadow-purple-900/20">
                    {editingContact ? 'Save Changes' : 'Add Contact'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Email Generator Modal */}
      <AnimatePresence>
        {isEmailModalOpen && (
          <EmailGeneratorModal 
            isOpen={isEmailModalOpen} 
            onClose={() => setIsEmailModalOpen(false)} 
            prefillContact={selectedContactForEmail}
          />
        )}
      </AnimatePresence>

      {/* Networking Copilot Modal */}
      <AnimatePresence>
        {isCopilotOpen && (
          <NetworkingCopilotModal
            isOpen={isCopilotOpen}
            onClose={() => setIsCopilotOpen(false)}
            onAddContact={(contact) => {
              setFormData({ ...contact, email: '', linkedinUrl: '', notes: '' });
              setEditingContact(null);
              setIsModalOpen(true);
              setIsCopilotOpen(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default NetworkCRMPage;
