import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MessageSquare } from 'lucide-react';

export const ConversationItem = ({ session, isActive, onClick }) => {
  const isOnline = true; // Mock online status based on some logic if needed
  const unreadCount = 0; // Derived from session data if available
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ scale: 1.01 }}
      onClick={onClick}
      className={`relative p-4 cursor-pointer transition-all border-b border-slate-100 flex gap-3
        ${isActive ? 'bg-indigo-50/70' : 'hover:bg-slate-50'}
      `}
    >
      {isActive && (
        <motion.div 
          layoutId="activeIndicator"
          className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#4F46E5] to-[#BFA15F]" 
        />
      )}
      
      <div className="relative shrink-0">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm
          ${isActive ? 'bg-gradient-to-br from-[#4F46E5] to-[#7C3AED]' : 'bg-slate-300'}`}
        >
          {session.customerName?.charAt(0).toUpperCase()}
        </div>
        {isOnline && (
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-0.5">
          <h4 className={`text-sm truncate pr-2 ${isActive ? 'font-bold text-slate-900' : 'font-semibold text-slate-800'}`}>
            {session.customerName}
          </h4>
          <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
            {new Date(session.lastActivityAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <div className="flex justify-between items-center gap-2">
          <p className={`text-xs truncate ${unreadCount > 0 ? 'font-semibold text-slate-800' : 'text-slate-500'}`}>
            {session.lastMessage || 'Connected from website...'}
          </p>
          {unreadCount > 0 && (
            <span className="shrink-0 bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
              {unreadCount}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export const EmptyListState = () => (
  <div className="flex flex-col items-center justify-center h-full p-6 text-center">
    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
      <MessageSquare size={24} className="text-slate-400" />
    </div>
    <h3 className="text-sm font-semibold text-slate-700 mb-1">No conversations found</h3>
    <p className="text-xs text-slate-500">Try changing your filters or search query.</p>
  </div>
);

export const ConversationList = ({ sessions, activeSessionId, onSelectSession }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState('All');

  const tabs = ['All', 'Unread', 'Mine', 'Unassigned', 'Resolved'];

  const filteredSessions = sessions.filter(s => {
    if (searchQuery && !s.customerName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    
    if (filterTab === 'Resolved') {
      return s.status === 'resolved';
    }
    
    // For all other tabs, show only active sessions
    if (s.status !== 'active') return false;
    
    if (filterTab === 'Unassigned') {
      return s.agentId === null;
    }
    
    return true;
  });

  return (
    <div className="w-full h-full flex flex-col bg-white border-r border-slate-200 relative z-10">
      {/* Header */}
      <div className="p-3.5 sm:p-4 border-b border-slate-200 shrink-0">
        <div className="flex justify-between items-center mb-3 sm:mb-4">
          <h2 className="text-sm sm:text-base font-bold text-slate-800 tracking-tight flex items-center gap-2">
            {filterTab === 'Resolved' ? 'Resolved Chats' : 'Active Conversations'}
            <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full font-bold">
              {filteredSessions.length}
            </span>
          </h2>
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search messages or users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] text-slate-800 transition-all placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden px-3 py-2 border-b border-slate-100 shrink-0 gap-1">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setFilterTab(tab)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap transition-colors cursor-pointer
              ${filterTab === tab 
                ? 'bg-slate-800 text-white shadow-sm' 
                : 'text-slate-500 hover:bg-slate-100'
              }
            `}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
        <AnimatePresence>
          {filteredSessions.length > 0 ? (
            filteredSessions.map((session) => (
              <ConversationItem
                key={session.id}
                session={session}
                isActive={activeSessionId === session.id}
                onClick={() => onSelectSession(session.id)}
              />
            ))
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <EmptyListState />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
