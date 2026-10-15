import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Phone, MapPin, Monitor, Clock, Tag, Briefcase, Plus, ExternalLink, MessageCircle, CheckCircle2 } from 'lucide-react';

const ActionModal = ({ isOpen, onClose, title, children }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
          <motion.div 
            initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
            onClick={onClose} 
          />
          <motion.div 
            initial={{opacity:0, scale:0.95, y:20}} 
            animate={{opacity:1, scale:1, y:0}} 
            exit={{opacity:0, scale:0.95, y:20}} 
            className="relative w-full max-w-md max-h-[90dvh] flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200"
          >
            <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50 shrink-0">
              <h3 className="font-bold text-slate-800 text-sm sm:text-base">{title}</h3>
              <button onClick={onClose} className="p-1.5 hover:bg-slate-200 rounded-md text-slate-500 transition-colors cursor-pointer">
                <X size={18}/>
              </button>
            </div>
            <div className="p-4 sm:p-6 overflow-y-auto">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export const CustomerInfoPanel = ({ session, onClose, isMobile }) => {
  const [modalState, setModalState] = useState(null); // 'lead', 'link', 'tag', null
  const [activeTags, setActiveTags] = useState(session?.tags || []);

  const handleAddTag = (t) => {
    if (!activeTags.includes(t)) {
      setActiveTags([...activeTags, t]);
    }
    setModalState(null);
  };

  if (!session) return null;

  return (
    <>
      <div
        className={`w-full xl:w-[320px] shrink-0 bg-white border-l border-slate-200 flex flex-col h-full z-20 shadow-xl xl:shadow-none`}
      >
        {/* Header */}
        <div className="p-3.5 sm:p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 shrink-0">
          <h3 className="font-bold text-slate-800 text-sm">Customer Details</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors cursor-pointer" aria-label="Close panel">
            <X size={18} />
          </button>
        </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 p-4 space-y-6">
            
            {/* Avatar & Name */}
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg mb-3">
                {session.customerName?.charAt(0).toUpperCase()}
              </div>
              <h2 className="text-lg font-bold text-slate-900">{session.customerName}</h2>
              <div className="flex items-center gap-1.5 text-xs text-green-600 font-medium mt-1">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                Online on Login Page
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-3">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Contact</h4>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Mail size={16} className="text-slate-400 shrink-0" />
                <span className="truncate">{session.customerEmail || 'No email provided'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Phone size={16} className="text-slate-400 shrink-0" />
                <span>{session.customerPhone || 'No phone provided'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <MapPin size={16} className="text-slate-400 shrink-0" />
                <span>{session.customerLocation || session.ipLocation || 'Verified Customer IP'}</span>
              </div>
            </div>

            {/* CRM Actions */}
            <div className="space-y-2">
              <button 
                onClick={() => setModalState('lead')} 
                className="w-full flex items-center justify-center gap-2 bg-indigo-50 text-indigo-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-100 transition-colors border border-indigo-100"
              >
                <Briefcase size={16} />
                Create New Lead
              </button>
              <button 
                onClick={() => setModalState('link')}
                className="w-full flex items-center justify-center gap-2 border border-slate-200 text-slate-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors shadow-sm"
              >
                <ExternalLink size={16} />
                Link to PNR
              </button>
            </div>

            {/* Tags */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tags</h4>
                <button 
                  onClick={() => setModalState('tag')}
                  className="text-indigo-600 hover:bg-indigo-50 p-1 rounded-md transition-colors text-xs font-semibold flex items-center gap-1"
                >
                  <Plus size={14} /> Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {activeTags.map(tag => (
                  <span key={tag} className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-md border shadow-sm ${tag === 'VIP' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                    <Tag size={10} /> {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Session Data */}
            <div className="space-y-3">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Session Info</h4>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Clock size={16} className="text-slate-400 shrink-0" />
                <span>Started {new Date(session.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Monitor size={16} className="text-slate-400 shrink-0" />
                <span>Chrome on Windows 11</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <MessageCircle size={16} className="text-slate-400 shrink-0" />
                <span>3 past conversations</span>
              </div>
            </div>

            {/* Private Notes Summary */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-amber-400"></div>
              <h4 className="text-[11px] font-bold text-amber-800 uppercase tracking-wider mb-1">Pinned Note</h4>
              <p className="text-xs text-amber-900/80 leading-relaxed">
                Customer asked about corporate rates last week. Transferred to sales.
              </p>
            </div>
            
          </div>
        </div>

      {/* Modals */}
      <ActionModal isOpen={modalState === 'lead'} onClose={() => setModalState(null)} title="Create New Lead">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">A new lead will be created for <strong>{session.customerName}</strong> in the Lead Lifecycle module.</p>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Lead Name</label>
              <input type="text" defaultValue={session.customerName} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Email Address</label>
              <input type="email" defaultValue={session.customerEmail} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
            </div>
          </div>
          <button onClick={() => setModalState(null)} className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-600/20 mt-4 flex justify-center gap-2 items-center">
            <CheckCircle2 size={18} /> Confirm Creation
          </button>
        </div>
      </ActionModal>

      <ActionModal isOpen={modalState === 'link'} onClose={() => setModalState(null)} title="Link to PNR">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Enter a PNR or Booking Reference to link this conversation to a specific booking.</p>
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">PNR (6 Characters)</label>
            <input type="text" placeholder="e.g. ABCDEF" maxLength={6} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono tracking-widest" />
          </div>
          <button onClick={() => setModalState(null)} className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors shadow-sm mt-4">
            Search & Link
          </button>
        </div>
      </ActionModal>

      <ActionModal isOpen={modalState === 'tag'} onClose={() => setModalState(null)} title="Add Tag">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Select a tag to organize this conversation.</p>
          <div className="grid grid-cols-2 gap-2">
            {['Urgent', 'Refund', 'Corporate', 'General Inquiry', 'Complaint', 'VIP'].map(t => (
              <button key={t} onClick={() => handleAddTag(t)} className="p-2 border border-slate-200 rounded-lg text-sm text-slate-700 font-medium hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-colors text-left">
                {t}
              </button>
            ))}
          </div>
        </div>
      </ActionModal>
    </>
  );
};
