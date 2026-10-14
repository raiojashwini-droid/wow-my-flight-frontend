import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import useAuth from '../../hooks/useAuth';
import { ConversationList } from './live-chat/ConversationList';
import { ChatWindow } from './live-chat/ChatWindow';
import { CustomerInfoPanel } from './live-chat/CustomerInfoPanel';

// Use same URL as CustomerChatWidget
const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const AgentLiveChatWorkspace = () => {
  const { currentUser } = useAuth();
  
  const [socket, setSocket] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [activeMessages, setActiveMessages] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [typingUsers, setTypingUsers] = useState({});
  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Responsive UI State
  const [isPanelOpen, setIsPanelOpen] = useState(false); // Default closed on mobile/tablet
  const [isMobileListOpen, setIsMobileListOpen] = useState(true); // For mobile (<768px)

  const activeSessionIdRef = useRef(activeSessionId);
  useEffect(() => {
    activeSessionIdRef.current = activeSessionId;
  }, [activeSessionId]);

  // Set default panel open only on very large desktop screens (>= 1280px)
  useEffect(() => {
    if (window.innerWidth >= 1280) {
      setIsPanelOpen(true);
    }
  }, []);

  // 1. Initialize Socket Connection for Agent
  useEffect(() => {
    if (!currentUser) return;

    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      // Register as agent
      newSocket.emit('agent:register', { 
        agentId: currentUser.id || 'agent-1', 
        agentName: currentUser.name || 'Sales Exec' 
      });

      // Fetch currently active sessions from server
      newSocket.emit('chat:get_active_sessions', (activeSessions) => {
        if(activeSessions) setSessions(activeSessions);
      });
    });

    // When a new customer joins
    newSocket.on('chat:new_session', (session) => {
      setSessions((prev) => [session, ...prev]);
    });

    // When a session's activity is updated
    newSocket.on('chat:session_updated', (updatedSession) => {
      setSessions((prev) => {
        const exists = prev.find(s => s.id === updatedSession.id);
        if (exists) {
          return prev.map(s => s.id === updatedSession.id ? updatedSession : s)
                     .sort((a, b) => new Date(b.lastActivityAt) - new Date(a.lastActivityAt));
        }
        return [updatedSession, ...prev];
      });
    });

    // When a message is received in the ACTIVE room
    newSocket.on('chat:receive_message', (msg) => {
      setActiveMessages((prev) => [...prev, msg]);
      
      // Stop typing indicator for this session
      setTypingUsers((prev) => ({ ...prev, [msg.sessionId]: false }));
      
      // Play a soft sound and show browser notification if tab not focused
      if (msg.senderType === 'customer') {
        if (document.hidden) {
          try {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
            audio.volume = 0.5;
            audio.play().catch(() => {});
            
            if (Notification.permission === "granted") {
              new Notification("New Message", { body: `${msg.senderName}: ${msg.text}` });
            }
          } catch (err) {}
        }
      }

      // Automatically mark as read if we are viewing this session
      if (msg.sessionId === activeSessionIdRef.current) {
        newSocket.emit('chat:mark_read', { sessionId: activeSessionIdRef.current, readerType: 'agent' });
      }
    });

    // Handle read receipts
    newSocket.on('chat:messages_read', ({ sessionId, readerType }) => {
      if (sessionId === activeSessionIdRef.current && readerType === 'customer') {
        setActiveMessages(prev => prev.map(m => {
          if (m.senderType === 'agent' && m.status !== 'read') {
            return { ...m, status: 'read' };
          }
          return m;
        }));
      }
    });

    // Handle typing status
    newSocket.on('chat:typing_status', ({ sessionId, isTyping, senderName, senderType }) => {
      if (senderType === 'customer') {
        setTypingUsers((prev) => ({
          ...prev,
          [sessionId]: { isTyping, senderName }
        }));
      }
    });

    // History loaded when joining a room
    newSocket.on('chat:history', ({ messages }) => {
      setActiveMessages(messages);
    });

    // Request notification permissions
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }

    return () => {
      newSocket.disconnect();
    };
  }, [currentUser]);

  // Join a room when clicking a session
  const handleSelectSession = (sessionId) => {
    setActiveSessionId(sessionId);
    setActiveMessages([]); // Clear until history loads
    setIsMobileListOpen(false); // Switch to chat view on mobile screens
    
    if (socket) {
      socket.emit('chat:agent_join_room', { 
        sessionId, 
        agentId: currentUser?.id || 'agent-1' 
      }, (response) => {
        if (response && response.success) {
          setActiveMessages(response.messages || []);
          // Mark all customer messages as read
          socket.emit('chat:mark_read', { sessionId, readerType: 'agent' });
        }
      });
    }
  };

  const handleSend = (isNote = false, attachment = null) => {
    if ((!replyText.trim() && !attachment) || !socket || !activeSessionId) return;

    const msgData = {
      sessionId: activeSessionId,
      senderType: 'agent',
      senderId: currentUser?.id || 'agent-1',
      senderName: currentUser?.name || 'Agent',
      text: replyText || '',
      type: isNote ? 'note' : (attachment ? 'image' : 'text'),
      attachment: attachment
    };

    socket.emit('chat:send_message', msgData);
    setReplyText('');
    
    // Stop typing
    socket.emit('chat:typing', { sessionId: activeSessionId, isTyping: false, senderType: 'agent', senderName: currentUser?.name || 'Agent' });
  };

  const handleTyping = (e) => {
    setReplyText(e.target.value);
    
    if (!socket || !activeSessionId) return;
    
    socket.emit('chat:typing', { sessionId: activeSessionId, isTyping: true, senderType: 'agent', senderName: currentUser?.name || 'Agent' });
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('chat:typing', { sessionId: activeSessionId, isTyping: false, senderType: 'agent', senderName: currentUser?.name || 'Agent' });
    }, 2000);
  };

  const activeSession = sessions.find(s => s.id === activeSessionId);

  return (
    <div className="h-[calc(100dvh-64px)] w-full flex overflow-hidden font-['Inter'] bg-slate-100 dark:bg-slate-900 relative">
      
      {/* 1. Left Sidebar: Conversation List */}
      <div className={`h-full shrink-0 transition-all duration-300
        ${isMobileListOpen 
          ? 'w-full md:w-80 lg:w-85 flex' 
          : 'hidden md:flex md:w-80 lg:w-85'
        }
      `}>
        <ConversationList 
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={handleSelectSession}
        />
      </div>

      {/* 2. Middle: Chat Window */}
      <div className={`flex-1 h-full min-w-0 transition-all duration-300 relative
        ${!isMobileListOpen ? 'flex flex-col' : 'hidden md:flex md:flex-col'}
      `}>
        <ChatWindow 
          session={activeSession}
          messages={activeMessages}
          typingUsers={typingUsers}
          handleSend={handleSend}
          replyText={replyText}
          setReplyText={setReplyText}
          handleTyping={handleTyping}
          togglePanel={() => setIsPanelOpen(!isPanelOpen)}
          isPanelOpen={isPanelOpen}
          messagesEndRef={messagesEndRef}
          onBack={() => setIsMobileListOpen(true)}
          onResolve={(sessionId) => {
            if (socket) {
              socket.emit('chat:resolve_session', { sessionId });
              setActiveSessionId(null);
              setIsMobileListOpen(true);
            }
          }}
          onAction={(action, sessionId) => {
            if (!socket) return;
            if (action === 'transfer') {
              socket.emit('chat:transfer_session', { sessionId });
              setActiveSessionId(null);
              setIsMobileListOpen(true);
            } else if (action === 'block') {
              socket.emit('chat:block_session', { sessionId });
              setActiveSessionId(null);
              setIsMobileListOpen(true);
            }
          }}
        />
      </div>

      {/* 3. Right: Customer Info Panel (Drawer on <xl, static panel on xl+) */}
      <AnimatePresence>
        {isPanelOpen && activeSession && (
          <>
            {/* Desktop persistent sidebar (xl: 1280px+) */}
            <div className="hidden xl:block h-full shrink-0">
              <CustomerInfoPanel 
                session={activeSession} 
                onClose={() => setIsPanelOpen(false)} 
              />
            </div>

            {/* Tablet & Mobile Slide-in Drawer with Backdrop (< 1280px) */}
            <div className="xl:hidden fixed inset-0 z-50 flex justify-end">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
                onClick={() => setIsPanelOpen(false)}
              />
              <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 240 }}
                className="relative z-10 h-full w-[85vw] sm:w-90 max-w-100 shadow-2xl bg-white"
              >
                <CustomerInfoPanel 
                  session={activeSession} 
                  onClose={() => setIsPanelOpen(false)} 
                  isMobile={true}
                />
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
};

export default AgentLiveChatWorkspace;
