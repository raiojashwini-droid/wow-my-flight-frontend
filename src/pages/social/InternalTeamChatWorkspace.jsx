import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Hash, 
  Video, 
  Send, 
  Smile, 
  Paperclip, 
  Shield, 
  Search, 
  MessageSquare,
  Phone,
  Mail,
  MapPin,
  Clock,
  CheckCheck,
  Filter,
  SquarePen,
  ChevronDown,
  FileText,
  PanelRightClose,
  PanelRightOpen,
  Plus,
  Tag,
  Briefcase,
  AlertCircle,
  X,
  UserPlus
} from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import JitsiMeetingModal from '../../components/JitsiMeetingModal';
import { generateInternalTeamRoom } from '../../services/jitsiService';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Exact Wow My Flight CRM Staff Roster & Roles (AuthContext & Project Standards)
const INITIAL_DIALOGS = [
  {
    id: 'usr-team-leader',
    name: 'David Vance (Sales TL)',
    username: '@david.vance',
    role: 'team_leader',
    roleLabel: 'Sales Team Leader',
    department: 'Phase 1 – Sales Desk',
    phone: '+1 (850) 332-9685',
    email: 'teamleader@wowmyflight.com',
    location: 'Executive Desk #2, Sales Floor',
    status: 'online',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces',
    time: '18:46',
    unread: 0,
    lastMessage: 'Sabre GDS ticket queue for London flight verified',
    assignedBooking: { pnr: 'WMF-BA782', airline: 'British Airways', route: 'JFK → LHR (Business)', total: '$3,450' },
    milestones: [
      { date: 'Today', label: 'Shift Briefing Completed', color: 'border-emerald-300 bg-emerald-50 text-emerald-700' },
      { date: '11/08/24', label: 'VIP Lead Escalation Handled', color: 'border-blue-300 bg-blue-50 text-blue-700' },
      { date: '09/03/24', label: 'Daily Target Exceeded', color: 'border-purple-300 bg-purple-50 text-purple-700' },
    ]
  },
  {
    id: 'usr-flight-expert',
    name: 'Priya Sharma (GDS Expert)',
    username: '@priya.sharma',
    role: 'flight_expert',
    roleLabel: 'Flight & GDS Expert',
    department: 'Phase 2 – Flight Desk',
    phone: '+1 (850) 332-9688',
    email: 'expert@wowmyflight.com',
    location: 'GDS Console Desk #1',
    status: 'online',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop&crop=faces',
    time: '19:00',
    unread: 2,
    lastMessage: 'Amadeus PNR confirmed with baggage add-on',
    assignedBooking: { pnr: 'WMF-EK991', airline: 'Emirates', route: 'DXB → DEL (Economy Y)', total: '$890' },
    milestones: [
      { date: 'Today', label: 'GDS Queue Cleared', color: 'border-emerald-300 bg-emerald-50 text-emerald-700' },
      { date: 'Yesterday', label: 'Schedule Change Disruption Alert', color: 'border-amber-300 bg-amber-50 text-amber-700' },
    ]
  },
  {
    id: 'usr-ticketing-agent',
    name: 'Omar Farouq (Ticketing)',
    username: '@omar.farouq',
    role: 'ticketing_agent',
    roleLabel: 'Ticketing & Issuance Agent',
    department: 'Phase 2 – Ticketing Operations',
    phone: '+1 (850) 332-9689',
    email: 'ticketing@wowmyflight.com',
    location: 'Ticketing Console #4',
    status: 'online',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=faces',
    time: '18:46',
    unread: 0,
    lastMessage: 'E-Ticket PDF dispatched to passenger email',
    assignedBooking: { pnr: 'WMF-QR332', airline: 'Qatar Airways', route: 'DOH → JFK (Qsuite)', total: '$5,120' },
    milestones: [
      { date: 'Today', label: 'Ticket Issued & Validated', color: 'border-blue-300 bg-blue-50 text-blue-700' },
    ]
  },
  {
    id: 'usr-consultant',
    name: 'Sofia Rodriguez (Sales)',
    username: '@sofia.rodriguez',
    role: 'consultant',
    roleLabel: 'Travel Sales Consultant',
    department: 'Phase 1 – Sales Desk',
    phone: '+1 (850) 332-9681',
    email: 'sales@wowmyflight.com',
    location: 'Sales Desk #6',
    status: 'online',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop&crop=faces',
    time: '18:12',
    unread: 0,
    lastMessage: 'New inquiry quote created for Dubai corporate pax',
    assignedBooking: { pnr: 'WMF-AI402', airline: 'Air India', route: 'DEL → LHR (Prem Eco)', total: '$1,480' },
    milestones: [
      { date: 'Today', label: 'Quote Accepted by Client', color: 'border-emerald-300 bg-emerald-50 text-emerald-700' },
    ]
  },
  {
    id: 'usr-operations',
    name: 'Carlos Gomez (Ops)',
    username: '@carlos.gomez',
    role: 'operations',
    roleLabel: 'Operations Specialist',
    department: 'Phase 2 – Booking Operations',
    phone: '+1 (850) 332-9684',
    email: 'ops@wowmyflight.com',
    location: 'Operations Terminal #2',
    status: 'away',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop&crop=faces',
    time: '17:35',
    unread: 0,
    lastMessage: 'After-sales baggage protection added to booking',
    assignedBooking: { pnr: 'WMF-LH104', airline: 'Lufthansa', route: 'FRA → ORD (Economy)', total: '$1,120' },
    milestones: []
  },
  {
    id: 'usr-expert-tl',
    name: 'Michael Chang (Escalation TL)',
    username: '@michael.chang',
    role: 'expert_team_leader',
    roleLabel: 'Escalation Team Leader',
    department: 'Phase 3 – Management & Escalations',
    phone: '+1 (850) 332-9686',
    email: 'expertlead@wowmyflight.com',
    location: 'Supervisor Suite #3',
    status: 'online',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&fit=crop&crop=faces',
    time: '16:00',
    unread: 0,
    lastMessage: 'Airline strike re-routing handled successfully',
    assignedBooking: { pnr: 'WMF-AF660', airline: 'Air France', route: 'CDG → JFK (Business)', total: '$4,200' },
    milestones: [
      { date: 'Today', label: 'SLA Escalation Resolved', color: 'border-purple-300 bg-purple-50 text-purple-700' }
    ]
  },
  {
    id: 'usr-finance',
    name: 'Elena Rostova (Finance)',
    username: '@elena.rostova',
    role: 'finance',
    roleLabel: 'Finance & Refunds Lead',
    department: 'Phase 3 – Finance',
    phone: '+1 (850) 332-9683',
    email: 'finance@wowmyflight.com',
    location: 'Finance Office #1',
    status: 'online',
    avatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=100&h=100&fit=crop&crop=faces',
    time: '15:20',
    unread: 0,
    lastMessage: 'Refund calculation approved: $650 net refund',
    assignedBooking: { pnr: 'WMF-UA220', airline: 'United Airlines', route: 'SFO → NRT (Economy)', total: '$1,350' },
    milestones: [
      { date: 'Today', label: 'Refund Audit Cleared', color: 'border-emerald-300 bg-emerald-50 text-emerald-700' }
    ]
  },
  {
    id: 'usr-admin',
    name: 'Alex Turner (GM)',
    username: '@alex.turner',
    role: 'admin',
    roleLabel: 'General Manager',
    department: 'Phase 3 – Management',
    phone: '+1 (850) 332-9680',
    email: 'admin@wowmyflight.com',
    location: 'Executive Suite #1',
    status: 'online',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    time: '14:50',
    unread: 0,
    lastMessage: 'All agent conversion metrics posted to Sales Dashboard',
    assignedBooking: { pnr: 'WMF-CORP01', airline: 'British Airways', route: 'JFK → LHR (First Class)', total: '$12,500' },
    milestones: []
  }
];

const INITIAL_MESSAGES_BY_DIALOG = {
  'usr-team-leader': [
    {
      id: 'm1',
      senderType: 'agent',
      senderId: 'current-user',
      senderName: 'Wael Madi (CEO)',
      senderAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
      text: 'Good evening David, please share the status of today\'s transatlantic GDS queues and high-value bookings.',
      timestamp: '18:30',
      attachment: null,
      isOutgoing: true
    },
    {
      id: 'm2',
      senderType: 'agent',
      senderId: 'current-user',
      senderName: 'Wael Madi (CEO)',
      senderAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
      text: null,
      timestamp: '18:45',
      attachment: { name: 'Airline_GDS_Circular_BA.pdf', size: '720.89 Kb', ext: 'pdf' },
      isOutgoing: true
    },
    {
      id: 'm3',
      senderType: 'staff',
      senderId: 'usr-team-leader',
      senderName: 'David Vance (Sales TL)',
      senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces',
      text: 'All queues are cleared sir! PNR #WMF-BA782 for British Airways JFK → LHR is ticketed and verified in Sabre.',
      timestamp: '19:00',
      attachment: null,
      isOutgoing: false,
      taskMeta: 'Today 17:09 • Ticketing Team • PNR #WMF-BA782 • Status: Ticketed & Dispatched'
    },
    {
      id: 'm4',
      senderType: 'staff',
      senderId: 'usr-team-leader',
      senderName: 'David Vance (Sales TL)',
      senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces',
      text: 'Priya from GDS desk has verified the baggage allowance and E-ticket numbers with the airline.',
      timestamp: '19:01',
      attachment: null,
      isOutgoing: false
    },
    {
      id: 'm5',
      senderType: 'staff',
      senderId: 'usr-team-leader',
      senderName: 'David Vance (Sales TL)',
      senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces',
      text: 'We are also monitoring the overnight Dubai flight bookings for any schedule changes.',
      timestamp: '19:02',
      attachment: null,
      isOutgoing: false
    },
    {
      id: 'm6',
      senderType: 'agent',
      senderId: 'current-user',
      senderName: 'Wael Madi (CEO)',
      senderAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
      text: 'Excellent work team. Make sure overnight ticketing desk remains on high alert for Sabre queue auto-cancellations.',
      timestamp: '19:05',
      attachment: null,
      isOutgoing: true
    }
  ]
};

export default function InternalTeamChatWorkspace() {
  const { currentUser } = useAuth();

  const [dialogs, setDialogs] = useState(INITIAL_DIALOGS);
  const [selectedDialogId, setSelectedDialogId] = useState('usr-team-leader');
  const [messagesMap, setMessagesMap] = useState(INITIAL_MESSAGES_BY_DIALOG);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchScope, setSearchScope] = useState('messages'); // 'messages' | 'staff' | 'pnrs'
  const [isScopeDropdownOpen, setIsScopeDropdownOpen] = useState(false);
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [filterType, setFilterType] = useState('all'); // 'all' | 'unread'
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  const [attachedFile, setAttachedFile] = useState(null);
  
  // Call Modals
  const [huddleOpen, setHuddleOpen] = useState(false);
  const [huddleRoom, setHuddleRoom] = useState('');
  const [callTypeLabel, setCallTypeLabel] = useState('Internal Staff Video Consultation');
  
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const scopeDropdownRef = useRef(null);

  const selectedDialog = dialogs.find((d) => d.id === selectedDialogId) || dialogs[0];
  const activeMessages = messagesMap[selectedDialogId] || [];

  // Close scope dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (scopeDropdownRef.current && !scopeDropdownRef.current.contains(event.target)) {
        setIsScopeDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Socket Connection for Real-Time Staff Sync
  useEffect(() => {
    const s = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });
    socketRef.current = s;

    s.on('connect', () => {
      s.emit('agent:register', {
        agentId: currentUser?.id || 'usr-super-admin',
        agentName: currentUser?.name || 'Wael Madi (CEO)',
        role: currentUser?.role || 'super_admin',
        status: 'available',
      });
    });

    s.on('team:receive_message', (incoming) => {
      if (!incoming) return;
      const targetId = incoming.channelId || 'usr-team-leader';
      const formatted = {
        id: incoming.id || `sock-${Date.now()}`,
        senderType: 'staff',
        senderId: incoming.senderId,
        senderName: incoming.senderName,
        text: incoming.text,
        timestamp: new Date(incoming.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        attachment: null,
        isOutgoing: incoming.senderId === (currentUser?.id || 'usr-super-admin'),
      };

      setMessagesMap((prev) => ({
        ...prev,
        [targetId]: [...(prev[targetId] || []), formatted],
      }));
    });

    return () => {
      s.disconnect();
    };
  }, [currentUser]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages]);

  const handleSend = () => {
    const text = inputText.trim();
    if (!text && !attachedFile) return;

    const currentUserName = currentUser?.name || 'Wael Madi (CEO)';
    const currentUserAvatar = currentUser?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150';

    const newMsg = {
      id: `msg-${Date.now()}`,
      senderType: 'agent',
      senderId: currentUser?.id || 'current-user',
      senderName: currentUserName,
      senderAvatar: currentUserAvatar,
      text: text || null,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachment: attachedFile ? { name: attachedFile.name, size: `${Math.round(attachedFile.size / 1024)} Kb`, ext: attachedFile.name.split('.').pop() } : null,
      isOutgoing: true
    };

    // Update local state
    setMessagesMap((prev) => ({
      ...prev,
      [selectedDialogId]: [...(prev[selectedDialogId] || []), newMsg],
    }));

    // Update last message in dialogs list
    setDialogs((prev) =>
      prev.map((d) =>
        d.id === selectedDialogId
          ? { ...d, lastMessage: text || attachedFile?.name || 'Attachment sent', time: newMsg.timestamp, unread: 0 }
          : d
      )
    );

    // Emit over socket strictly to staff room
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('team:send_message', {
        channelId: selectedDialogId,
        senderId: currentUser?.id || 'usr-super-admin',
        senderName: currentUserName,
        senderRole: currentUser?.role || 'super_admin',
        text: text || (attachedFile ? `[Sent Attachment: ${attachedFile.name}]` : ''),
      });
    }

    setInputText('');
    setAttachedFile(null);
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setAttachedFile(e.target.files[0]);
    }
  };

  // Video Call Launch
  const handleStartVideoCall = () => {
    const room = generateInternalTeamRoom('Video-' + (selectedDialog.roleLabel || selectedDialog.name), currentUser?.name || 'Staff');
    setHuddleRoom(room);
    setCallTypeLabel(`Internal Staff Video Consultation with ${selectedDialog.name}`);
    setHuddleOpen(true);
  };

  // Audio Call Launch
  const handleStartAudioCall = () => {
    const room = generateInternalTeamRoom('Voice-' + (selectedDialog.roleLabel || selectedDialog.name), currentUser?.name || 'Staff');
    setHuddleRoom(room);
    setCallTypeLabel(`Internal Staff Audio Consultation (Voice Only) with ${selectedDialog.name}`);
    setHuddleOpen(true);
  };

  // Search Filter respecting the active Search Scope
  const filteredDialogs = dialogs.filter((d) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) {
      if (filterType === 'unread') return d.unread > 0;
      return true;
    }

    let matches = false;
    if (searchScope === 'messages') {
      matches = d.lastMessage.toLowerCase().includes(q) || (messagesMap[d.id] || []).some((m) => m.text && m.text.toLowerCase().includes(q));
    } else if (searchScope === 'staff') {
      matches = d.name.toLowerCase().includes(q) || d.roleLabel.toLowerCase().includes(q) || d.department.toLowerCase().includes(q) || d.username.toLowerCase().includes(q);
    } else if (searchScope === 'pnrs') {
      matches = (d.assignedBooking?.pnr && d.assignedBooking.pnr.toLowerCase().includes(q)) ||
                (d.assignedBooking?.airline && d.assignedBooking.airline.toLowerCase().includes(q)) ||
                (d.assignedBooking?.route && d.assignedBooking.route.toLowerCase().includes(q));
    } else {
      matches = d.name.toLowerCase().includes(q) || d.lastMessage.toLowerCase().includes(q);
    }

    if (filterType === 'unread') return matches && d.unread > 0;
    return matches;
  });

  return (
    <div className="flex h-[calc(100vh-64px)] w-full overflow-hidden bg-[#F8FAFC] font-sans antialiased text-slate-800">
      
      {/* ══════════════════════════════════════════════════════════════════
          1. LEFT COLUMN: MY CHATS / DIALOGS LIST
      ══════════════════════════════════════════════════════════════════ */}
      <div className="w-[310px] sm:w-[330px] flex-shrink-0 bg-white border-r border-slate-200/80 flex flex-col h-full shadow-[1px_0_4px_rgba(0,0,0,0.02)]">
        
        {/* Top Header */}
        <div className="p-4 pb-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">My chats</h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
              Staff Desk
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setFilterType(filterType === 'all' ? 'unread' : 'all')}
              className={`text-xs font-semibold px-2 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                filterType === 'unread' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              <Filter size={12} /> Filters
            </button>
            <button 
              onClick={() => setIsNewChatModalOpen(true)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
              title="Start New Staff Chat"
            >
              <SquarePen size={17} />
            </button>
          </div>
        </div>

        {/* Search Bar + Scope Dropdown (Interactive) */}
        <div className="px-3.5 pt-3 pb-2 border-b border-slate-100/80">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-1.5 focus-within:border-indigo-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all">
            <Search size={14} className="text-slate-400 flex-shrink-0" />
            <input 
              type="text" 
              placeholder={searchScope === 'messages' ? 'Search in messages...' : searchScope === 'staff' ? 'Search staff by name/role...' : 'Search PNR, airline, route...'} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none"
            />
            
            {/* Interactive Search Scope Dropdown */}
            <div className="relative" ref={scopeDropdownRef}>
              <button
                type="button"
                onClick={() => setIsScopeDropdownOpen(!isScopeDropdownOpen)}
                className="flex items-center gap-1 text-[11px] font-medium text-slate-600 border-l border-slate-200 pl-2 cursor-pointer flex-shrink-0 hover:text-indigo-600 transition-colors"
                title="Change search filter scope"
              >
                <span>
                  {searchScope === 'messages' ? 'In messages' : searchScope === 'staff' ? 'In staff' : 'In PNRs'}
                </span>
                <ChevronDown size={11} className={`transition-transform duration-200 ${isScopeDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isScopeDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-38 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-40 text-xs">
                  <div className="px-3 py-1 text-[10px] font-bold uppercase text-slate-400 tracking-wider">Search Scope</div>
                  <button
                    type="button"
                    onClick={() => { setSearchScope('messages'); setIsScopeDropdownOpen(false); }}
                    className={`w-full text-left px-3 py-1.5 hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-between ${searchScope === 'messages' ? 'font-bold text-indigo-600 bg-indigo-50/50' : 'text-slate-700'}`}
                  >
                    <span>In messages</span>
                    {searchScope === 'messages' && <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSearchScope('staff'); setIsScopeDropdownOpen(false); }}
                    className={`w-full text-left px-3 py-1.5 hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-between ${searchScope === 'staff' ? 'font-bold text-indigo-600 bg-indigo-50/50' : 'text-slate-700'}`}
                  >
                    <span>In staff / roles</span>
                    {searchScope === 'staff' && <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSearchScope('pnrs'); setIsScopeDropdownOpen(false); }}
                    className={`w-full text-left px-3 py-1.5 hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-between ${searchScope === 'pnrs' ? 'font-bold text-indigo-600 bg-indigo-50/50' : 'text-slate-700'}`}
                  >
                    <span>In PNRs / Flights</span>
                    {searchScope === 'pnrs' && <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Dialogs Counter */}
        <div className="px-4 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex justify-between items-center bg-slate-50/40">
          <span>All dialogs</span>
          <span className="font-semibold text-slate-500">{filteredDialogs.length}</span>
        </div>

        {/* Dialog Items List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100/60 scrollbar-thin">
          {filteredDialogs.map((dialog) => {
            const isSelected = dialog.id === selectedDialogId;
            return (
              <div
                key={dialog.id}
                onClick={() => {
                  setSelectedDialogId(dialog.id);
                  setDialogs((prev) =>
                    prev.map((d) => (d.id === dialog.id ? { ...d, unread: 0 } : d))
                  );
                }}
                className={`flex items-start gap-3 p-3.5 cursor-pointer transition-all ${
                  isSelected 
                    ? 'bg-blue-500 text-white shadow-sm' 
                    : 'hover:bg-slate-50/90 text-slate-700'
                }`}
              >
                {/* Avatar with Status Dot */}
                <div className="relative flex-shrink-0">
                  <img 
                    src={dialog.avatar} 
                    alt={dialog.name} 
                    className="w-10 h-10 rounded-full object-cover shadow-sm border border-black/5"
                  />
                  <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 ${
                    isSelected ? 'border-blue-500' : 'border-white'
                  } ${
                    dialog.status === 'online' ? 'bg-emerald-500' : dialog.status === 'away' ? 'bg-amber-400' : 'bg-slate-300'
                  }`} />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                      {dialog.name}
                    </span>
                    <span className={`text-[10px] font-medium ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                      {dialog.time}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between gap-1">
                    <p className={`text-[11px] truncate leading-tight ${isSelected ? 'text-blue-50' : 'text-slate-500'}`}>
                      {dialog.lastMessage}
                    </p>
                    {dialog.unread > 0 && !isSelected && (
                      <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center flex-shrink-0">
                        {dialog.unread}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer: User Role Badge */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="font-semibold text-slate-700">{currentUser?.name || 'Wael Madi (CEO)'}</span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200/70 text-slate-600 uppercase">
            {currentUser?.role || 'Super Admin'}
          </span>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          2. MIDDLE COLUMN: CHAT CONVERSATION WINDOW
      ══════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col h-full bg-[#FAFAFA] min-w-0 relative">
        
        {/* Chat Window Header */}
        <div className="h-16 px-6 bg-white border-b border-slate-200/80 flex items-center justify-between z-10 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-3 min-w-0">
            <img 
              src={selectedDialog.avatar} 
              alt={selectedDialog.name} 
              className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-sm flex-shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 truncate">{selectedDialog.name}</h2>
                <span className="text-xs text-slate-400 font-medium">{selectedDialog.username}</span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Shield size={10} /> Internal Staff
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate">
                {selectedDialog.roleLabel} • {selectedDialog.department}
              </p>
            </div>
          </div>

          {/* Action Tools: Pure Icon Buttons (Audio Call + Video Call, text removed) */}
          <div className="flex items-center gap-2">
            
            {/* Audio Call Icon Button */}
            <button
              onClick={handleStartAudioCall}
              className="p-2 sm:p-2.5 rounded-xl text-slate-700 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 transition-all active:scale-95 cursor-pointer shadow-xs"
              title="Start Audio Call (Voice Only)"
            >
              <Phone size={16} className="text-emerald-600" />
            </button>

            {/* Video Call Icon Button (Text removed as requested) */}
            <button
              onClick={handleStartVideoCall}
              className="p-2 sm:p-2.5 rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all active:scale-95 cursor-pointer flex items-center justify-center"
              title="Start Video Call"
            >
              <Video size={16} />
            </button>

            {/* Toggle Staff Details Panel */}
            <button
              onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
              className="p-2 sm:p-2.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer border border-slate-200 ml-1"
              title={isRightPanelOpen ? "Close Staff Details" : "Open Staff Details"}
            >
              {isRightPanelOpen ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
            </button>
          </div>
        </div>

        {/* Message Thread Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          
          {/* Date Separator Pill */}
          <div className="text-center my-2">
            <span className="inline-block px-3 py-1 rounded-full text-[11px] font-semibold bg-white border border-slate-200 text-slate-500 shadow-sm">
              Today, 11 June
            </span>
          </div>

          {activeMessages.map((msg, index) => {
            const isOutgoing = msg.isOutgoing;

            return (
              <div key={msg.id || index} className="space-y-1">
                <div className={`flex gap-3 ${isOutgoing ? 'justify-end' : 'justify-start'}`}>
                  
                  {/* Incoming Avatar */}
                  {!isOutgoing && (
                    <img 
                      src={msg.senderAvatar || selectedDialog.avatar} 
                      alt={msg.senderName} 
                      className="w-8 h-8 rounded-full object-cover border border-slate-200 mt-1 flex-shrink-0"
                    />
                  )}

                  <div className={`max-w-[85%] sm:max-w-[70%] flex flex-col ${isOutgoing ? 'items-end' : 'items-start'}`}>
                    
                    {/* Sender Name Header */}
                    <span className="text-[11px] font-bold text-slate-500 mb-1 px-1">
                      {isOutgoing ? (currentUser?.name || 'Wael Madi (CEO)') : selectedDialog.name}
                    </span>

                    {/* Bubble Content */}
                    {msg.text && (
                      <div className={`p-3.5 rounded-2xl text-[13.5px] leading-relaxed shadow-sm break-words ${
                        isOutgoing 
                          ? 'bg-[#E7F8E8] text-slate-900 border border-[#D0F0D2] rounded-tr-sm' 
                          : 'bg-white text-slate-900 border border-slate-200/90 rounded-tl-sm'
                      }`}>
                        {msg.text}
                        <div className={`text-[10px] mt-1.5 flex items-center justify-end gap-1 font-medium ${
                          isOutgoing ? 'text-emerald-700/80' : 'text-slate-400'
                        }`}>
                          <span>{msg.timestamp}</span>
                          {isOutgoing && <CheckCheck size={13} className="text-blue-500 stroke-[2.5]" />}
                        </div>
                      </div>
                    )}

                    {/* File Attachment Bubble (Reference Logo.ai style) */}
                    {msg.attachment && (
                      <div className="mt-1.5 p-3 rounded-2xl bg-[#E7F8E8] border border-[#D0F0D2] flex items-center gap-3 text-slate-800 shadow-sm">
                        <div className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center font-bold text-xs shadow-sm flex-shrink-0">
                          <FileText size={20} />
                        </div>
                        <div className="min-w-0 pr-4">
                          <div className="text-xs font-bold truncate text-slate-900">{msg.attachment.name}</div>
                          <div className="text-[10px] text-slate-500">{msg.attachment.size}</div>
                        </div>
                        <div className="text-[10px] font-medium text-emerald-700/80 flex items-center gap-0.5 ml-auto">
                          <span>{msg.timestamp}</span>
                          <CheckCheck size={13} className="text-blue-500 stroke-[2.5]" />
                        </div>
                      </div>
                    )}

                    {/* Sub-meta details (Reference "Submitted by Dan / Task info") */}
                    {msg.taskMeta && (
                      <div className="mt-1 px-1 text-[11px] text-slate-500 flex flex-wrap items-center gap-2">
                        <span className="font-medium text-slate-600">{msg.taskMeta}</span>
                      </div>
                    )}

                    {isOutgoing && (
                      <span className="text-[10px] text-slate-400 mt-0.5 px-1">
                        Submitted via Wow My Flight CRM Staff Desk
                      </span>
                    )}
                  </div>

                  {/* Outgoing Avatar */}
                  {isOutgoing && (
                    <img 
                      src={msg.senderAvatar || currentUser?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'} 
                      alt="Current User" 
                      className="w-8 h-8 rounded-full object-cover border border-slate-200 mt-1 flex-shrink-0"
                    />
                  )}
                </div>
              </div>
            );
          })}
          
          <div ref={messagesEndRef} />
        </div>

        {/* ══════════════════════════════════════════════════════════════
            COMPOSER (Matching reference photo bottom bar)
        ══════════════════════════════════════════════════════════════ */}
        <div className="p-3 sm:p-4 bg-white border-t border-slate-200/90 shadow-sm">
          
          {/* Responding As Banner */}
          <div className="text-[11px] font-semibold text-slate-500 mb-1.5 px-1 flex items-center gap-1">
            <span className="text-indigo-600 font-bold">{currentUser?.name || 'Wael Madi (CEO)'}</span>
            <span>responding in internal staff desk</span>
          </div>

          {/* Pending Attachment Chip */}
          {attachedFile && (
            <div className="mb-2 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs flex items-center justify-between w-max max-w-full">
              <span className="truncate flex items-center gap-1.5">
                <FileText size={14} /> {attachedFile.name}
              </span>
              <button onClick={() => setAttachedFile(null)} className="ml-2 hover:text-rose-600 cursor-pointer">
                <X size={14} />
              </button>
            </div>
          )}

          {/* Input Box with icons */}
          <div className="flex items-center gap-2 p-2 rounded-2xl border border-slate-200 bg-slate-50/80 focus-within:bg-white focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all">
            <input 
              type="text" 
              placeholder={`Message ${selectedDialog.name}...`} 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              className="flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none px-2"
            />

            {/* Action Tools */}
            <div className="flex items-center gap-1 text-slate-400">
              <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
              
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 hover:text-indigo-600 transition-colors rounded-lg hover:bg-slate-100 cursor-pointer"
                title="Attach Document / PNR"
              >
                <Paperclip size={17} />
              </button>
              
              <button 
                type="button"
                onClick={() => setInputText((prev) => prev + ' 👍')}
                className="p-1.5 hover:text-indigo-600 transition-colors rounded-lg hover:bg-slate-100 cursor-pointer"
                title="Insert Quick Reaction"
              >
                <Smile size={17} />
              </button>
            </div>

            {/* Send Button */}
            <button
              onClick={handleSend}
              disabled={!inputText.trim() && !attachedFile}
              className={`p-2.5 rounded-xl transition-all shadow-sm cursor-pointer flex-shrink-0 ${
                inputText.trim() || attachedFile
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Send size={15} />
            </button>
          </div>
        </div>

      </div>

      {/* ══════════════════════════════════════════════════════════════════
          3. RIGHT COLUMN: PROFILE & DETAILS PANEL
      ══════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {isRightPanelOpen && (
          <motion.div 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 290, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-shrink-0 bg-white border-l border-slate-200/90 h-full flex flex-col overflow-y-auto divide-y divide-slate-100/90 shadow-[-1px_0_4px_rgba(0,0,0,0.02)]"
          >
            {/* Staff Card Header */}
            <div className="p-5 flex flex-col items-center text-center">
              <div className="relative mb-3">
                <img 
                  src={selectedDialog.avatar} 
                  alt={selectedDialog.name} 
                  className="w-16 h-16 rounded-full object-cover border-2 border-indigo-100 shadow-sm"
                />
                <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${
                  selectedDialog.status === 'online' ? 'bg-emerald-500' : 'bg-amber-400'
                }`} />
              </div>
              <span className="text-xs font-bold text-slate-400">{selectedDialog.username}</span>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">{selectedDialog.name}</h3>
              <p className="text-xs text-indigo-600 font-semibold">{selectedDialog.roleLabel}</p>

              {/* Instant Audio / Video Call Tools */}
              <div className="w-full mt-3.5 flex gap-2">
                <button 
                  onClick={handleStartAudioCall}
                  className="flex-1 py-2 px-2.5 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 text-xs font-bold rounded-xl border border-slate-200 hover:border-emerald-200 flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  <Phone size={13} className="text-emerald-600" /> Audio
                </button>
                <button 
                  onClick={handleStartVideoCall}
                  className="flex-1 py-2 px-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                >
                  <Video size={13} /> Video
                </button>
              </div>
            </div>

            {/* Direct Contact Info */}
            <div className="p-4 space-y-2.5 text-xs">
              <div className="flex items-center gap-2.5 text-slate-700">
                <Phone size={14} className="text-emerald-600 flex-shrink-0" />
                <span className="font-semibold">{selectedDialog.phone}</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-600">
                <Mail size={14} className="text-slate-400 flex-shrink-0" />
                <span className="truncate">{selectedDialog.email}</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-600">
                <MapPin size={14} className="text-slate-400 flex-shrink-0" />
                <span className="truncate">{selectedDialog.location}</span>
              </div>
            </div>

            {/* Milestone / Shift Timeline */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800">Shift & Activity Timeline</span>
                <ChevronDown size={14} className="text-slate-400" />
              </div>
              <div className="space-y-1.5">
                {selectedDialog.milestones && selectedDialog.milestones.length > 0 ? (
                  selectedDialog.milestones.map((m, idx) => (
                    <div 
                      key={idx} 
                      className={`text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border flex items-center justify-between ${m.color}`}
                    >
                      <span>{m.date}</span>
                      <span className="truncate ml-2">• {m.label}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-[11px] text-slate-400 italic">No previous escalations</div>
                )}
              </div>
            </div>

            {/* Assigned Booking Case */}
            {selectedDialog.assignedBooking && (
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800">Active PNR / Case</span>
                  <span className="text-[10px] font-bold text-indigo-600">GDS Live</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900">{selectedDialog.assignedBooking.airline}</span>
                    <span className="font-extrabold text-slate-900">{selectedDialog.assignedBooking.total}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    PNR: {selectedDialog.assignedBooking.pnr}
                  </div>
                  <div className="text-[11px] text-slate-600 flex items-center gap-1 font-medium">
                    <Tag size={12} className="text-indigo-500" /> {selectedDialog.assignedBooking.route}
                  </div>
                </div>
              </div>
            )}

            {/* Internal Notes / Quick Remarks */}
            <div className="p-4 text-xs">
              <div className="flex items-center justify-between mb-1.5 text-slate-800 font-bold">
                <span>Internal Remarks</span>
                <span className="text-[10px] text-slate-400">Private</span>
              </div>
              <div className="p-2.5 rounded-lg bg-amber-50/60 border border-amber-200/80 text-amber-900 text-[11px] leading-relaxed">
                Staff member assigned to transatlantic and GDS ticketing queues. For emergency ticket issuance, connect via internal Jitsi huddle.
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════════
          4. NEW STAFF CHAT MODAL (Triggered by SquarePen "edit" button)
      ══════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {isNewChatModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                    <UserPlus size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Start New Staff Conversation</h3>
                    <p className="text-[11px] text-slate-500">Select any team member from the CRM roster</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsNewChatModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Staff Roster Picker List */}
              <div className="p-3 overflow-y-auto flex-1 divide-y divide-slate-100">
                {dialogs.map((dialog) => (
                  <button
                    key={dialog.id}
                    onClick={() => {
                      setSelectedDialogId(dialog.id);
                      setIsNewChatModalOpen(false);
                    }}
                    className="w-full p-2.5 flex items-center gap-3 hover:bg-slate-50 rounded-xl transition-all text-left cursor-pointer group"
                  >
                    <div className="relative flex-shrink-0">
                      <img src={dialog.avatar} alt={dialog.name} className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                      <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${
                        dialog.status === 'online' ? 'bg-emerald-500' : 'bg-amber-400'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {dialog.name}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {dialog.roleLabel} • {dialog.department}
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                      Chat
                    </span>
                  </button>
                ))}
              </div>

              <div className="p-3 bg-slate-50 border-t border-slate-100 text-right">
                <button
                  onClick={() => setIsNewChatModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold rounded-xl text-slate-600 hover:bg-slate-200/70 transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Jitsi Meeting Modal for Staff Video / Audio Consultation */}
      <JitsiMeetingModal
        open={huddleOpen}
        onClose={() => setHuddleOpen(false)}
        roomName={huddleRoom}
        clientName="Internal Team Desk"
        agentName={currentUser?.name || 'Wael Madi (CEO)'}
        dateTime={callTypeLabel}
      />

    </div>
  );
}
