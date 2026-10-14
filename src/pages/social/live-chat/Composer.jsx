import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Smile, Paperclip, Lock, FileText, X } from 'lucide-react';

const COMMON_EMOJIS = ['😊','😂','🥰','😎','🤔','👍','🙏','🔥','✈️','🌍','💼','🎉'];
const CANNED_RESPONSES = [
  { shortcut: 'greet', text: 'Hi there! Welcome to WOW MY FLIGHT. How can I assist you today?' },
  { shortcut: 'pnr', text: 'Could you please provide your 6-character PNR / Booking Reference?' },
  { shortcut: 'refund', text: 'Refunds typically take 5-7 business days to reflect in your original payment method depending on the airline policy.' },
  { shortcut: 'payment', text: 'Here is the secure link to complete your payment: [LINK_PLACEHOLDER]' },
  { shortcut: 'close', text: 'Thank you for reaching out to WOW MY FLIGHT. Have a wonderful day!' },
  { shortcut: 'baggage', text: 'Baggage allowance varies by airline and ticket class. Generally, economy allows one cabin bag (7kg) and one checked bag (23kg). Shall I check the specific allowance for your flight?' },
  { shortcut: 'cancel', text: 'If you wish to cancel your flight, cancellation charges will apply as per the airline rules. Would you like me to calculate the exact penalty for your ticket?' },
  { shortcut: 'datechange', text: 'Date changes are subject to airline penalty and fare difference. Please let me know your preferred new travel date so I can check availability and costs.' },
  { shortcut: 'demo', text: 'I can certainly help you with a demo of the WOW MY FLIGHT CRM software. Are you available for a 15-minute screen share session tomorrow?' },
  { shortcut: 'api', text: 'Our API documentation is available in the developer portal. I can send you the direct link and an API key if you are an administrator.' }
];

export const Composer = ({ 
  replyText, 
  setReplyText, 
  handleSend, 
  handleTyping,
  noteMode,
  setNoteMode
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showCanned, setShowCanned] = useState(false);
  const [cannedFilter, setCannedFilter] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-grow textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [replyText]);

  // Canned responses logic via "/"
  useEffect(() => {
    const lastWord = replyText.split(/\s+/).pop();
    if (lastWord.startsWith('/')) {
      setShowCanned(true);
      setCannedFilter(lastWord.substring(1).toLowerCase());
      setSelectedIndex(0);
    } else {
      setShowCanned(false);
    }
  }, [replyText]);

  const filteredCanned = CANNED_RESPONSES.filter(c => 
    c.shortcut.toLowerCase().includes(cannedFilter) || 
    c.text.toLowerCase().includes(cannedFilter)
  );

  const insertCanned = (text) => {
    const words = replyText.split(/\s+/);
    words.pop(); // remove the /shortcut
    const newText = words.join(' ') + (words.length > 0 ? ' ' : '') + text + ' ';
    setReplyText(newText);
    setShowCanned(false);
    if (textareaRef.current) textareaRef.current.focus();
  };

  const handleKeyDown = (e) => {
    if (showCanned && filteredCanned.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredCanned.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertCanned(filteredCanned[selectedIndex].text);
        return;
      }
      if (e.key === 'Escape') {
        setShowCanned(false);
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleAttachment = () => {
    // We just mock the file attachment logic
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const onFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        handleSend(event.target.result);
      };
      reader.readAsDataURL(file);
      e.target.value = ''; // Reset
    }
  };

  return (
    <div className={`p-2.5 sm:p-4 border-t border-slate-200 transition-colors ${noteMode ? 'bg-amber-50/50' : 'bg-white'} pb-[max(0.6rem,env(safe-area-inset-bottom,0.6rem))]`}>
      
      {/* Tabs */}
      <div className="flex gap-4 mb-2.5 sm:mb-3 px-1">
        <button 
          onClick={() => setNoteMode(false)}
          className={`text-xs sm:text-sm font-semibold pb-1 border-b-2 transition-colors cursor-pointer ${!noteMode ? 'border-[#4F46E5] text-[#4F46E5]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Reply
        </button>
        <button 
          onClick={() => setNoteMode(true)}
          className={`text-xs sm:text-sm font-semibold pb-1 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${noteMode ? 'border-amber-500 text-amber-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <Lock size={13} className="sm:w-3.5 sm:h-3.5" /> Internal Note
        </button>
      </div>

      <div className="relative">
        {/* Canned Responses Popup */}
        <AnimatePresence>
          {showCanned && filteredCanned.length > 0 && !noteMode && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-full left-0 mb-2 w-full max-w-[calc(100vw-32px)] sm:max-w-md bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50"
            >
              <div className="px-3 py-2 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Canned Responses</span>
                <span className="text-[10px] text-slate-400 font-medium">Use ↑↓ and Enter</span>
              </div>
              <div className="max-h-48 overflow-y-auto">
                {filteredCanned.map((c, i) => (
                  <button
                    key={c.shortcut}
                    onClick={() => insertCanned(c.text)}
                    className={`w-full text-left px-4 py-2.5 hover:bg-indigo-50 transition-colors border-b last:border-b-0 border-slate-100 cursor-pointer ${i === selectedIndex ? 'bg-indigo-50' : ''}`}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <span className="font-bold text-sm text-indigo-600">/{c.shortcut}</span>
                    </div>
                    <p className="text-xs text-slate-600 truncate mt-0.5">{c.text}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Emoji Picker Popup */}
        <AnimatePresence>
          {showEmojiPicker && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-full left-0 mb-2 bg-white border border-slate-200 rounded-xl shadow-xl p-3 w-64 max-w-[calc(100vw-32px)] z-50"
            >
              <div className="grid grid-cols-6 gap-2">
                {COMMON_EMOJIS.map((emoji) => (
                  <button 
                    key={emoji} 
                    onClick={() => {
                      setReplyText(prev => prev + emoji);
                      setShowEmojiPicker(false);
                      if (textareaRef.current) textareaRef.current.focus();
                    }} 
                    className="text-xl hover:bg-slate-100 rounded-md transition-colors p-1 cursor-pointer"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Area */}
        <div className={`flex items-end gap-1 sm:gap-2 p-1.5 sm:p-2 rounded-2xl border transition-all
          ${noteMode 
            ? 'bg-amber-50 border-amber-200 focus-within:border-amber-400 focus-within:ring-4 focus-within:ring-amber-400/20' 
            : 'bg-slate-50 border-slate-200 focus-within:border-[#4F46E5] focus-within:ring-4 focus-within:ring-[#4F46E5]/20'
          }`}
        >
          <div className="flex gap-0.5 sm:gap-1 pb-1 px-0.5 sm:px-1">
            <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-1.5 sm:p-2 text-slate-400 hover:text-indigo-600 transition-colors rounded-lg hover:bg-slate-200/50 cursor-pointer" aria-label="Insert Emoji">
              <Smile size={18} />
            </button>
            <input type="file" ref={fileInputRef} className="hidden" onChange={onFileChange} />
            <button type="button" onClick={handleAttachment} className="p-1.5 sm:p-2 text-slate-400 hover:text-indigo-600 transition-colors rounded-lg hover:bg-slate-200/50 cursor-pointer" aria-label="Attach File">
              <Paperclip size={18} />
            </button>
            {!noteMode && (
              <button 
                type="button" 
                onClick={() => {
                  setReplyText(prev => prev + '/');
                  if (textareaRef.current) textareaRef.current.focus();
                }}
                className="p-1.5 sm:p-2 text-slate-400 hover:text-indigo-600 transition-colors rounded-lg hover:bg-slate-200/50 cursor-pointer"
                title="Canned Responses (/)"
                aria-label="Canned Responses"
              >
                <FileText size={18} />
              </button>
            )}
          </div>
          
          <textarea
            ref={textareaRef}
            rows={1}
            placeholder={noteMode ? "Type a private note..." : "Type reply... (/ for shortcuts)"}
            value={replyText}
            onChange={handleTyping}
            onKeyDown={handleKeyDown}
            className={`flex-1 bg-transparent py-2.5 sm:py-3 text-base sm:text-sm focus:outline-none resize-none scrollbar-thin
              ${noteMode ? 'text-amber-900 placeholder:text-amber-500/70' : 'text-slate-900 placeholder:text-slate-400'}
            `}
            style={{ minHeight: '40px', maxHeight: '120px' }}
          />
          
          <button 
            type="button"
            onClick={() => handleSend()}
            disabled={!replyText.trim()}
            className={`m-0.5 sm:m-1 p-2.5 sm:p-3 rounded-xl transition-all shadow-sm flex-shrink-0 cursor-pointer
              ${!replyText.trim() 
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                : noteMode
                  ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/30 hover:shadow-lg active:scale-95'
                  : 'bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white shadow-indigo-500/30 hover:shadow-lg active:scale-95'
              }
            `}
            aria-label="Send"
          >
            <Send size={17} className={replyText.trim() ? "ml-0.5" : ""} />
          </button>
        </div>
      </div>
      
      {!noteMode && (
        <div className="hidden sm:flex justify-between items-center mt-2 px-1">
          <span className="text-[10px] font-medium text-slate-400">Shift + Enter for new line • Enter to send</span>
        </div>
      )}
    </div>
  );
};
