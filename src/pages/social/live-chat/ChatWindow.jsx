import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MoreVertical, PanelRightClose, PanelRightOpen, ArrowDown, Shield, CheckCircle2, ChevronLeft, Info } from 'lucide-react';
import { Composer } from './Composer';

const MessageBubble = ({ msg, isAgent, isFirstInGroup }) => {
  const isNote = msg.type === 'note'; // Mock note type

  return (
    <div className={`flex flex-col ${isAgent ? 'items-end' : 'items-start'} ${isFirstInGroup ? 'mt-3 sm:mt-4' : 'mt-1'}`}>
      {!isAgent && isFirstInGroup && (
        <div className="text-[11px] font-semibold tracking-wide ml-2 mb-1 text-slate-500">
          {msg.senderName}
        </div>
      )}
      
      <div 
        className={`max-w-[88%] sm:max-w-[80%] px-3.5 sm:px-4 py-2 sm:py-2.5 text-[13.5px] sm:text-[14px] leading-relaxed relative group shadow-sm break-words
          ${isNote 
            ? 'bg-amber-100 border border-amber-200 text-amber-900 rounded-[20px] rounded-br-sm'
            : isAgent 
              ? 'bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] text-white rounded-[20px] rounded-br-sm' 
              : 'bg-white border border-slate-200 text-slate-800 rounded-[20px] rounded-bl-sm'
          }
        `}
      >
        {isNote && (
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-700 mb-1 uppercase tracking-wide">
            <Shield size={12} /> Only visible to team
          </div>
        )}
        
        {msg.type === 'image' && msg.attachment && (
          <img src={msg.attachment} alt="Attachment" className="max-w-full rounded-lg mb-2 shadow-sm border border-slate-200/20" />
        )}
        
        {msg.text && <div className="break-words">{msg.text}</div>}
        
        <div className={`text-[10px] mt-1 text-right font-medium flex justify-end items-center gap-1 
          ${isNote ? 'text-amber-700/70' : isAgent ? 'text-white/70' : 'text-slate-400'}`}
        >
          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          {isAgent && !isNote && (
            <span className={msg.status === 'read' ? 'text-blue-300 font-bold' : 'text-white/50'}>
              ✓✓
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

const ResolveModal = ({ isOpen, onClose, onConfirm }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
        <motion.div 
          initial={{opacity:0, scale:0.95, y:20}} animate={{opacity:1, scale:1, y:0}} exit={{opacity:0, scale:0.95, y:20}} 
          className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200"
        >
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Resolve Conversation?</h3>
            <p className="text-sm text-slate-500 mb-6">Are you sure you want to mark this conversation as resolved? It will be removed from your active list.</p>
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-2.5 rounded-xl font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer">
                Cancel
              </button>
              <button onClick={() => { onConfirm(); onClose(); }} className="flex-1 py-2.5 rounded-xl font-semibold text-white bg-slate-900 hover:bg-slate-800 shadow-sm transition-colors cursor-pointer">
                Yes, Resolve
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

export const ChatWindow = ({ 
  session, 
  messages, 
  typingUsers, 
  handleSend, 
  replyText, 
  setReplyText, 
  handleTyping,
  togglePanel,
  isPanelOpen,
  messagesEndRef,
  onBack,
  onResolve,
  onAction
}) => {
  const [noteMode, setNoteMode] = useState(false);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const scrollContainerRef = useRef(null);

  const handleExportTranscript = () => {
    setShowMenu(false);
    const content = messages.map(m => {
      const time = new Date(m.timestamp).toLocaleString();
      const sender = m.senderType === 'agent' ? 'Agent' : (session.customerName || 'Customer');
      let msgText = m.text;
      if (m.type === 'image') msgText = '[Image Attachment]';
      if (m.type === 'note') msgText = `[Internal Note] ${m.text}`;
      return `[${time}] ${sender}: ${msgText}`;
    }).join('\n');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-transcript-${session.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleTransferChat = () => {
    setShowMenu(false);
    if (onAction) onAction('transfer', session.id);
  };

  const handleBlockUser = () => {
    setShowMenu(false);
    if (onAction) onAction('block', session.id);
  };

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollHeight - scrollTop - clientHeight > 100) {
      setShowScrollDown(true);
    } else {
      setShowScrollDown(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUsers]);

  if (!session) {
    return (
      <div className="flex-1 h-full bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mx-auto mb-4">
            <Shield size={24} className="text-slate-300" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Workspace Ready</h3>
          <p className="text-sm text-slate-500 max-w-[250px] mx-auto">Select a conversation from the left to start replying.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full flex flex-col bg-slate-50 min-w-0 relative">
      
      {/* Header */}
      <div className="h-16 sm:h-[72px] shrink-0 bg-white border-b border-slate-200 px-3 sm:px-6 flex justify-between items-center z-10 shadow-sm">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {onBack && (
            <button 
              onClick={onBack}
              className="md:hidden p-2 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors active:scale-95 shrink-0 cursor-pointer"
              aria-label="Back to conversations"
              title="Back"
            >
              <ChevronLeft size={22} />
            </button>
          )}

          <div className="relative shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] rounded-full flex items-center justify-center text-white text-sm sm:text-base font-bold shadow-sm">
              {session.customerName?.charAt(0).toUpperCase()}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 border-2 border-white rounded-full" />
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate flex items-center gap-1.5 sm:gap-2">
              <span className="truncate">{session.customerName}</span>
              <span className="hidden sm:inline-block px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-md text-[10px] text-slate-500 font-medium shrink-0">
                {session.customerEmail || 'Guest'}
              </span>
            </h2>
            <p className="text-[11px] sm:text-xs text-green-600 font-medium flex items-center gap-1.5 mt-0.5 truncate">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shrink-0" /> Online on Website
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <button 
            onClick={() => setShowResolveModal(true)}
            className="hidden sm:flex px-3.5 py-1.5 sm:px-4 sm:py-2 bg-slate-900 text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-slate-800 transition-colors gap-1.5 sm:gap-2 items-center cursor-pointer shadow-sm"
          >
            <CheckCircle2 size={16} /> Resolve
          </button>
          
          <div className="w-px h-6 bg-slate-200 mx-0.5 hidden sm:block"></div>
          
          {/* Customer Details Toggle - Accessible across all device screens */}
          <button 
            onClick={togglePanel}
            className={`p-2 rounded-xl transition-colors cursor-pointer
              ${isPanelOpen 
                ? 'bg-indigo-50 text-indigo-600' 
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
              }
            `}
            aria-label="Customer Details"
            title="Customer Details"
          >
            <Info size={20} />
          </button>

          {/* Three dots menu */}
          <div className="relative">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className={`p-2 rounded-xl transition-colors cursor-pointer ${showMenu ? 'bg-slate-100 text-slate-700' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
              aria-label="More options"
            >
              <MoreVertical size={20} />
            </button>

            <AnimatePresence>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)}></div>
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50 py-1"
                  >
                    {/* On mobile screens, show Resolve in menu */}
                    <button 
                      onClick={() => { setShowMenu(false); setShowResolveModal(true); }}
                      className="sm:hidden w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-100 flex items-center gap-2 cursor-pointer"
                    >
                      <CheckCircle2 size={16} className="text-green-600" /> Resolve Chat
                    </button>
                    <button onClick={handleTransferChat} className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-100 cursor-pointer">
                      Transfer Chat
                    </button>
                    <button onClick={handleExportTranscript} className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-100 cursor-pointer">
                      Export Transcript
                    </button>
                    <button onClick={handleBlockUser} className="w-full text-left px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer">
                      Block User
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-3 sm:p-6 flex flex-col relative scrollbar-thin scrollbar-thumb-slate-300"
      >
        {/* Pattern Background */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

        <div className="text-center my-4 sm:my-6 sticky top-0 z-10">
          <span className="text-[10px] uppercase font-bold text-slate-500 bg-white/90 px-3 py-1 rounded-full border border-slate-200 shadow-sm backdrop-blur-md">
            Today
          </span>
        </div>

        <div className="flex flex-col relative z-0 min-h-full justify-end pb-4">
          {messages.map((msg, index) => {
            const isAgent = msg.senderType === 'agent';
            const prevMsg = index > 0 ? messages[index - 1] : null;
            const isFirstInGroup = !prevMsg || prevMsg.senderType !== msg.senderType;
            
            return (
              <motion.div 
                key={msg.id || index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <MessageBubble msg={msg} isAgent={isAgent} isFirstInGroup={isFirstInGroup} />
              </motion.div>
            );
          })}
          
          {typingUsers[session.id]?.isTyping && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start mt-3 sm:mt-4">
              <div className="bg-white border border-slate-200 px-4 py-3 rounded-[20px] rounded-bl-sm shadow-sm flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} className="h-2" />
        </div>

        {/* Scroll Down Button */}
        <AnimatePresence>
          {showScrollDown && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={scrollToBottom}
              className="absolute bottom-20 right-4 sm:right-6 p-2.5 bg-white shadow-lg rounded-full border border-slate-200 text-indigo-600 z-30 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <ArrowDown size={18} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Composer */}
      <Composer 
        replyText={replyText} 
        setReplyText={setReplyText} 
        handleSend={(attachment = null) => {
          handleSend(noteMode, attachment);
          if (noteMode) setNoteMode(false); // Reset to reply after sending a note
        }} 
        handleTyping={handleTyping}
        noteMode={noteMode}
        setNoteMode={setNoteMode}
      />

      <ResolveModal 
        isOpen={showResolveModal} 
        onClose={() => setShowResolveModal(false)} 
        onConfirm={() => onResolve && onResolve(session.id)}
      />
    </div>
  );
};
