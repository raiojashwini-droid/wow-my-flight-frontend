import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, ChevronDown, Send, User, Smile, Paperclip, MoreVertical, Volume2, VolumeX, WifiOff, ArrowDown, X } from 'lucide-react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const COMMON_EMOJIS = ['😊','😂','🥰','😎','🤔','👍','🙏','🔥','✈️','🌍','💼','🎉'];
const QUICK_REPLIES = ["Flight Booking Help", "Check PNR Status", "CRM Demo Request", "API Documentation"];

const CustomerChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [socket, setSocket] = useState(null);
  const [session, setSession] = useState(null);
  const [isConnected, setIsConnected] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('chat_sound') !== 'false';
  });
  
  // Registration State
  const [customerDetails, setCustomerDetails] = useState({ name: '', email: '', phone: '' });
  const [isRegistered, setIsRegistered] = useState(false);
  
  // Chat State
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isAgentTyping, setIsAgentTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showScrollDown, setShowScrollDown] = useState(false);

  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const audioRef = useRef(null);
  const socketRef = useRef(null);
  const fileInputRef = useRef(null);

  const onFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        sendMessage('', event.target.result);
      };
      reader.readAsDataURL(file);
      e.target.value = ''; // Reset
    }
  };

  // Initial setup: tooltip timer and audio
  useEffect(() => {
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audioRef.current.volume = 0.5;

    const hasSeenTooltip = sessionStorage.getItem('chat_tooltip_seen');
    if (!hasSeenTooltip) {
      const timer = setTimeout(() => {
        if (!isOpen) setShowTooltip(true);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const dismissTooltip = () => {
    setShowTooltip(false);
    sessionStorage.setItem('chat_tooltip_seen', 'true');
  };

  const playSound = () => {
    if (soundEnabled && audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
  };

  const toggleSound = () => {
    setSoundEnabled(prev => {
      localStorage.setItem('chat_sound', (!prev).toString());
      return !prev;
    });
    setShowMenu(false);
  };

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    // Show scroll down button if not at bottom (buffer of 100px)
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
    // Only auto-scroll if we are already near bottom or it's our own message
    // Simplification: always scroll on new message if open
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isAgentTyping]);

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      dismissTooltip();
      if (session && socket) {
        socket.emit('chat:mark_read', { sessionId: session, readerType: 'customer' });
      }
    }
  }, [isOpen, session, socket]);

  // Handle restoring session from localStorage
  useEffect(() => {
    const savedSessionId = localStorage.getItem('chat_session_id');
    const savedDetails = localStorage.getItem('chat_customer_details');
    
    if (savedSessionId && savedDetails) {
      setCustomerDetails(JSON.parse(savedDetails));
      connectSocket(savedSessionId, true);
    }
    
    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const connectSocket = (sessionIdToRestore = null, isRejoin = false) => {
    if (socketRef.current) socketRef.current.disconnect();
    const newSocket = io(SOCKET_URL);
    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
      if (isRejoin && sessionIdToRestore) {
        newSocket.emit('chat:customer_rejoin', { sessionId: sessionIdToRestore }, (res) => {
          if (res.success) {
            setSession(sessionIdToRestore);
            setIsRegistered(true);
            setMessages(res.messages || []);
          } else {
            localStorage.removeItem('chat_session_id');
            localStorage.removeItem('chat_customer_details');
            setIsRegistered(false);
          }
        });
      } else {
        const formattedDetails = {
          customerName: customerDetails.name,
          customerEmail: customerDetails.email,
          customerPhone: customerDetails.phone
        };
        newSocket.emit('chat:customer_join', formattedDetails, (res) => {
          setSession(res.sessionId);
          setIsRegistered(true);
          localStorage.setItem('chat_session_id', res.sessionId);
          localStorage.setItem('chat_customer_details', JSON.stringify(customerDetails));
          
          // Inject an initial welcome message locally if brand new
          if (res.messages && res.messages.length === 0) {
            setMessages([{
              id: 'welcome_1',
              senderType: 'agent',
              senderName: 'Virtual Assistant',
              text: 'Hi there! 👋 How can we help you today?',
              timestamp: new Date().toISOString(),
              status: 'read'
            }]);
          } else {
            setMessages(res.messages || []);
          }
        });
      }
    });

    newSocket.on('disconnect', () => setIsConnected(false));
    newSocket.on('connect_error', () => setIsConnected(false));

    newSocket.on('chat:receive_message', (msg) => {
      setMessages((prev) => [...prev, msg]);
      setIsAgentTyping(false);
      
      if (msg.senderType === 'agent') {
        playSound();
        if (isOpen) {
          newSocket.emit('chat:mark_read', { sessionId: session || sessionIdToRestore, readerType: 'customer' });
        } else {
          setUnreadCount(prev => prev + 1);
        }
      }
    });

    newSocket.on('chat:messages_read', ({ sessionId: eventSession, readerType }) => {
      if ((eventSession === session || eventSession === sessionIdToRestore) && readerType === 'agent') {
        setMessages(prev => prev.map(m => {
          if (m.senderType === 'customer' && m.status !== 'read') {
            return { ...m, status: 'read' };
          }
          return m;
        }));
      }
    });

    newSocket.on('chat:typing_status', ({ isTyping, senderType }) => {
      if (senderType === 'agent') setIsAgentTyping(isTyping);
    });

    newSocket.on('chat:blocked', () => {
      alert("Your chat session has been blocked by an administrator.");
      localStorage.removeItem('wow_chat_session');
      setSession(null);
      if (newSocket) newSocket.disconnect();
    });
  };

  const handleStartChat = (e) => {
    e.preventDefault();
    if (!customerDetails.name.trim()) return;
    if (socketRef.current) socketRef.current.disconnect();
    connectSocket(null, false);
  };

  const sendMessage = (text, attachment = null) => {
    if ((!text?.trim() && !attachment) || !socket || !session) return;

    const msgData = {
      sessionId: session,
      senderType: 'customer',
      senderId: socket.id,
      senderName: customerDetails.name,
      text: text ? text.trim() : '',
      type: attachment ? 'image' : 'text',
      attachment: attachment
    };

    socket.emit('chat:send_message', msgData, () => {});
    socket.emit('chat:typing', { sessionId: session, isTyping: false, senderType: 'customer', senderName: customerDetails.name });
    
    setInputValue('');
    if (session && socket) {
      socket.emit('chat:mark_read', { sessionId: session, readerType: 'customer' });
    }
  };

  const handleSendMessage = (e) => {
    if (e) e.preventDefault();
    sendMessage(inputValue);
  };

  const handleQuickReply = (text) => {
    sendMessage(text);
  };

  const handleTyping = (e) => {
    setInputValue(e.target.value);
    
    if (!socket || !session) return;
    
    socket.emit('chat:typing', { sessionId: session, isTyping: true, senderType: 'customer', senderName: customerDetails.name });
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('chat:typing', { sessionId: session, isTyping: false, senderType: 'customer', senderName: customerDetails.name });
    }, 2000);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const onEmojiClick = (emoji) => {
    setInputValue(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  return (
    <div className="font-['Inter']">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            role="dialog"
            aria-live="polite"
            aria-modal="true"
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="
              /* Mobile View: Clean full-screen sheet with notch & home-bar safe areas */
              fixed inset-0 z-50 flex flex-col overflow-hidden bg-white dark:bg-[#0B1020]
              w-full h-[100dvh] rounded-none

              /* Tablet & Desktop View: Sleek floating card cleanly anchored above the launcher */
              sm:inset-auto sm:fixed sm:bottom-[92px] sm:right-6
              sm:w-[390px] md:w-[410px] sm:max-w-[calc(100vw-32px)]
              sm:h-[min(580px,calc(100dvh-116px))] sm:max-h-[620px]
              sm:rounded-[24px] sm:shadow-[0_20px_60px_rgba(0,0,0,0.35)]
              sm:border sm:border-slate-200/90 sm:dark:border-slate-800
            "
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] px-4 py-3 sm:py-3.5 text-white flex justify-between items-center shrink-0 relative pt-[max(0.75rem,env(safe-area-inset-top,0.75rem))]">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/20 flex items-center justify-center border border-white/30 backdrop-blur-sm overflow-hidden">
                    <User size={18} className="text-white sm:w-5 sm:h-5" />
                  </div>
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-400 border-2 border-[#4F46E5] rounded-full"></div>
                </div>
                <div>
                  <h3 className="font-semibold text-sm leading-tight tracking-wide">Live Support</h3>
                  <p className="text-[11px] text-white/80 flex items-center gap-1 mt-0.5">
                    Typically replies instantly
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-1 relative">
                <button 
                  onClick={() => setShowMenu(!showMenu)} 
                  className="p-1.5 hover:bg-white/20 rounded-full transition-colors active:scale-95"
                  aria-label="Settings"
                >
                  <MoreVertical size={18} />
                </button>
                <button 
                  onClick={() => setIsOpen(false)} 
                  className="p-1.5 hover:bg-white/20 rounded-full transition-colors active:scale-95" 
                  aria-label="Close Chat"
                  title="Close Chat"
                >
                  {/* On desktop/tablet minimize chevron; on mobile clear X close button */}
                  <ChevronDown size={22} className="hidden sm:block" />
                  <X size={20} className="sm:hidden" />
                </button>

                {/* Settings Dropdown */}
                <AnimatePresence>
                  {showMenu && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 10 }}
                      className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 py-1 z-50"
                    >
                      <button onClick={toggleSound} className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200">
                        {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                        {soundEnabled ? 'Mute Sounds' : 'Unmute Sounds'}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Offline Banner */}
            {!isConnected && isRegistered && (
              <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-2 flex items-center gap-2 text-xs font-medium text-red-600 dark:text-red-400 shrink-0">
                <WifiOff size={14} /> Reconnecting to server...
              </div>
            )}

            {/* Content Area */}
            <div 
              className="flex-1 overflow-y-auto bg-slate-50 dark:bg-[#0B1020] flex flex-col relative scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 p-4 space-y-4"
              ref={scrollContainerRef}
              onScroll={handleScroll}
            >
              {/* Pattern Background */}
              <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)', backgroundSize: '16px 16px' }} />

              {!isRegistered ? (
                // Registration Form
                <div className="flex flex-col justify-center my-auto relative z-10 max-w-sm mx-auto w-full px-2 sm:px-4 py-4 sm:py-6">
                  <div className="text-center mb-6 sm:mb-8">
                    <div className="bg-indigo-100 dark:bg-indigo-500/20 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 text-[#4F46E5] dark:text-indigo-400 shadow-sm">
                      <MessageCircle size={28} className="sm:w-8 sm:h-8" strokeWidth={1.5} />
                    </div>
                    <h4 className="font-bold text-lg sm:text-xl text-slate-800 dark:text-white tracking-tight">Hi there! 👋</h4>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 sm:mt-2">Please introduce yourself to connect with our travel experts.</p>
                  </div>

                  <form onSubmit={handleStartChat} className="space-y-3">
                    <input 
                      type="text" 
                      required
                      placeholder="Your Name *"
                      className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 sm:py-3.5 text-base sm:text-sm focus:outline-none focus:border-[#4F46E5] focus:ring-4 focus:ring-[#4F46E5]/10 bg-white dark:bg-slate-800 text-slate-900 dark:text-white transition-all shadow-sm"
                      value={customerDetails.name}
                      onChange={(e) => setCustomerDetails({...customerDetails, name: e.target.value})}
                    />
                    <input 
                      type="email" 
                      placeholder="Email Address (Optional)"
                      className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 sm:py-3.5 text-base sm:text-sm focus:outline-none focus:border-[#4F46E5] focus:ring-4 focus:ring-[#4F46E5]/10 bg-white dark:bg-slate-800 text-slate-900 dark:text-white transition-all shadow-sm"
                      value={customerDetails.email}
                      onChange={(e) => setCustomerDetails({...customerDetails, email: e.target.value})}
                    />
                    <button 
                      type="submit"
                      className="w-full bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white font-semibold py-3 sm:py-3.5 rounded-xl text-sm transition-all shadow-lg shadow-indigo-500/30 mt-3 sm:mt-4 active:scale-95 cursor-pointer"
                    >
                      Start Conversation
                    </button>
                  </form>
                </div>
              ) : (
                // Messages
                <div className="flex flex-col relative z-10 w-full pb-3">
                  <div className="text-center my-3 sticky top-0 z-20">
                    <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm backdrop-blur-md bg-opacity-90 dark:bg-opacity-90">
                      Today
                    </span>
                  </div>
                  
                  {messages.map((msg, index) => {
                    const isMe = msg.senderType === 'customer';
                    const prevMsg = index > 0 ? messages[index - 1] : null;
                    const isFirstInGroup = !prevMsg || prevMsg.senderType !== msg.senderType;
                    
                    return (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={msg.id ? msg.id : `msg-${index}`} 
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} ${isFirstInGroup ? 'mt-3 sm:mt-4' : 'mt-1'}`}
                      >
                        {!isMe && isFirstInGroup && (
                          <div className="text-[11px] text-[#D4A72C] mb-1 font-semibold tracking-wide ml-2 flex items-center gap-1">
                            {msg.senderName || 'Support Agent'}
                            {msg.senderRole && <span className="text-[9px] bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded-md font-medium">{msg.senderRole}</span>}
                          </div>
                        )}
                        
                        <div 
                          className={`max-w-[85%] sm:max-w-[80%] px-3.5 sm:px-4 py-2 sm:py-2.5 text-[13.5px] sm:text-[14px] leading-relaxed shadow-sm relative group break-words
                            ${isMe 
                              ? 'bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] text-white rounded-[20px] rounded-br-sm' 
                              : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-[20px] rounded-bl-sm'
                            }
                          `}
                        >
                          {msg.type === 'image' && msg.attachment && (
                            <img src={msg.attachment} alt="Attachment" className="max-w-full rounded-lg mb-2 shadow-sm" />
                          )}
                          {msg.text && <div className="break-words">{msg.text}</div>}
                          <div className={`text-[9px] mt-1 text-right font-medium flex justify-end items-center gap-1 ${isMe ? 'text-white/70' : 'text-slate-400 dark:text-slate-500'}`}>
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {isMe && (
                              <span className={msg.status === 'read' ? 'text-blue-300 font-bold' : 'text-white/50'}>
                                ✓✓
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                  
                  {/* Agent Typing Indicator */}
                  {isAgentTyping && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start mt-2">
                      <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 px-4 py-3 rounded-[20px] rounded-bl-sm shadow-sm flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </div>
                    </motion.div>
                  )}

                  {/* Quick Replies (show if last message is from agent and we haven't replied yet) */}
                  {messages.length > 0 && messages[messages.length - 1].senderType === 'agent' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-wrap gap-1.5 sm:gap-2 mt-3 sm:mt-4 ml-1">
                      {QUICK_REPLIES.map((reply, i) => (
                        <button 
                          key={i}
                          onClick={() => handleQuickReply(reply)}
                          className="text-[11px] sm:text-xs font-medium bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors cursor-pointer"
                        >
                          {reply}
                        </button>
                      ))}
                    </motion.div>
                  )}

                  <div ref={messagesEndRef} className="h-2" />
                </div>
              )}

              {/* Scroll Down Button */}
              <AnimatePresence>
                {showScrollDown && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={scrollToBottom}
                    className="absolute bottom-4 right-4 p-2 bg-white dark:bg-slate-800 shadow-lg rounded-full border border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 z-30 cursor-pointer"
                  >
                    <ArrowDown size={16} />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            {/* Input Area */}
            {isRegistered && (
              <div className="p-2 sm:p-3 bg-white dark:bg-[#0B1020] border-t border-slate-100 dark:border-slate-800 shrink-0 relative z-40 pb-[max(0.6rem,env(safe-area-inset-bottom,0.6rem))]">
                {/* Emoji Picker Popover */}
                <AnimatePresence>
                  {showEmojiPicker && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                      className="absolute bottom-full left-2 sm:left-3 mb-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-3 w-64 max-w-[calc(100vw-32px)] z-50"
                    >
                      <div className="grid grid-cols-6 gap-2">
                        {COMMON_EMOJIS.map((emoji) => (
                          <button key={emoji} onClick={() => onEmojiClick(emoji)} className="text-xl p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors cursor-pointer">
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleSendMessage} className="flex gap-1.5 sm:gap-2 relative items-end bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 p-1">
                  <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-2 sm:p-2.5 text-slate-400 hover:text-indigo-500 transition-colors" aria-label="Add emoji">
                    <Smile size={19} />
                  </button>
                  <input type="file" ref={fileInputRef} className="hidden" onChange={onFileChange} accept="image/*" />
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 sm:p-2.5 -ml-1.5 sm:-ml-2 text-slate-400 hover:text-indigo-500 transition-colors" aria-label="Attach file">
                    <Paperclip size={19} />
                  </button>
                  
                  <textarea
                    rows={1}
                    placeholder="Type a message..."
                    className="flex-1 bg-transparent py-2.5 sm:py-3 text-base sm:text-sm focus:outline-none text-slate-900 dark:text-white resize-none max-h-[100px] sm:max-h-[120px] scrollbar-thin dark:placeholder:text-slate-500"
                    value={inputValue}
                    onChange={handleTyping}
                    onKeyDown={handleKeyDown}
                    style={{ minHeight: '40px' }}
                  />
                  
                  <button 
                    type="submit"
                    disabled={!inputValue.trim()}
                    className="m-0.5 sm:m-1 bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white p-2.5 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all active:scale-95 shrink-0 cursor-pointer"
                    aria-label="Send Message"
                  >
                    <Send size={16} className="ml-0.5" />
                  </button>
                </form>
                <div className="text-center mt-1.5 sm:mt-2">
                  <span className="text-[10px] text-slate-400 font-medium">Secured chat • Replies within minutes</span>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Launcher Button */}
      <div 
        className={`fixed z-40 transition-all ${
          isOpen ? 'hidden sm:block' : 'block'
        } bottom-4 right-4 sm:bottom-6 sm:right-6`}
        style={{
          bottom: 'max(16px, env(safe-area-inset-bottom, 16px))',
          right: 'max(16px, env(safe-area-inset-right, 16px))'
        }}
      >
        <AnimatePresence>
          {showTooltip && !isOpen && (
            <motion.div
              initial={{ opacity: 0, x: 20, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="hidden sm:flex absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-xs sm:text-sm font-semibold px-3.5 py-2 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 whitespace-nowrap items-center gap-2"
            >
              Need help? Chat with us
              <button onClick={dismissTooltip} className="ml-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" aria-label="Dismiss tooltip">
                <X size={14} />
              </button>
              <div className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-3 h-3 bg-white dark:bg-slate-800 border-r border-t border-slate-100 dark:border-slate-700 rotate-45"></div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setIsOpen(!isOpen);
            if (!isOpen) setUnreadCount(0);
          }}
          className="w-14 h-14 sm:w-15 sm:h-15 md:w-16 md:h-16 bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] text-white rounded-full flex items-center justify-center shadow-[0_8px_30px_rgba(79,70,229,0.4)] hover:shadow-[0_8px_35px_rgba(79,70,229,0.6)] transition-shadow relative focus:outline-none focus:ring-4 focus:ring-indigo-500/30 cursor-pointer"
          aria-label={isOpen ? 'Close Chat' : 'Open Chat'}
        >
          {/* Subtle pulse ring on new message */}
          {!isOpen && unreadCount > 0 && (
            <span className="absolute -inset-1 rounded-full border-2 border-indigo-400 animate-ping opacity-75"></span>
          )}

          {!isOpen && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-5 w-5 bg-red-500 border-2 border-white dark:border-[#0B1020] text-[10px] font-bold items-center justify-center text-white">
                {unreadCount > 0 ? unreadCount : ''}
              </span>
            </span>
          )}
          
          <div className="relative w-full h-full flex items-center justify-center">
            <AnimatePresence mode="wait">
              {isOpen ? (
                <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                  <X size={26} className="sm:w-7 sm:h-7" />
                </motion.div>
              ) : (
                <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                  <MessageCircle size={28} className="sm:w-7 sm:h-7" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.button>
      </div>
    </div>
  );
};

export default CustomerChatWidget;
