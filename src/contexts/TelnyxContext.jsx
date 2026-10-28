/**
 * src/contexts/TelnyxContext.jsx
 * 
 * Global Telnyx WebRTC state manager.
 * Handles:
 *   - Telnyx JS SDK initialization & SIP registration
 *   - Outbound call flow
 *   - Incoming call detection & popup
 *   - Call state machine: IDLE → DIALING → ON_CALL → ON_HOLD → ENDED
 *   - Socket.io connection for real-time server events
 *   - Reconnect & error resilience
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from 'react';
import { io as socketIO } from 'socket.io-client';
import { fetchWebRTCToken, fetchPhoneNumbers } from '../services/telnyxService';
import { useAuth } from './AuthContext';

const TelnyxContext = createContext(null);

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

// Call state machine values
export const CALL_STATE = {
  IDLE: 'IDLE',
  CONNECTING: 'CONNECTING',
  DIALING: 'DIALING',
  RINGING: 'RINGING',
  ON_CALL: 'ON_CALL',
  ON_HOLD: 'ON_HOLD',
  ENDED: 'ENDED',
};

export const TelnyxProvider = ({ children }) => {
  const { currentUser } = useAuth();

  // SDK & connection refs (don't cause re-renders)
  const telnyxClientRef = useRef(null);
  const activeCallRef = useRef(null);
  const socketRef = useRef(null);
  const callTimerRef = useRef(null);
  const remoteAudioRef = useRef(null); // <audio> element for call audio output
  const isInitializingRef = useRef(false);
  const sdkStatusRef = useRef('idle');

  // ── State ───────────────────────────────────────────────────────────────────
  const [sdkStatus, setSdkStatus] = useState('idle'); // idle | loading | registered | error | disconnected
  sdkStatusRef.current = sdkStatus;
  const [callState, setCallState] = useState(CALL_STATE.IDLE);
  const [activeCall, setActiveCall] = useState(null);      // current call details
  const [incomingCall, setIncomingCall] = useState(null);  // incoming call popup data
  const [callSeconds, setCallSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isOnHold, setIsOnHold] = useState(false);
  const [phoneNumbers, setPhoneNumbers] = useState([]);
  const [selectedFromNumber, setSelectedFromNumber] = useState('');
  const [socketConnected, setSocketConnected] = useState(false);
  const [dispositionPending, setDispositionPending] = useState(null); // call that needs disposition
  const [incomingChatRequest, setIncomingChatRequest] = useState(null); // Real-time incoming website chat request

  // ── Socket.io: Connect to backend for real-time events ──────────────────────
  useEffect(() => {
    if (!currentUser) return;

    const socket = socketIO(BACKEND_URL, { withCredentials: true });
    socketRef.current = socket;

    socket.on('connect', () => {
      setSocketConnected(true);
      socket.emit('agent:register', {
        agentId: currentUser.id,
        agentName: currentUser.name,
        role: currentUser.role,
        status: 'available',
      });
      console.log('[TelnyxContext] Socket connected:', socket.id);
    });

    socket.on('disconnect', () => {
      setSocketConnected(false);
      console.log('[TelnyxContext] Socket disconnected');
    });

    // Real-time Incoming Website Chat Request
    socket.on('chat:incoming_request', (data) => {
      console.log('[TelnyxContext] Incoming chat request:', data);
      setIncomingChatRequest(data);
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.volume = 0.5;
        audio.play().catch(() => {});
      } catch (e) {}
    });

    // Request claimed by another agent -> dismiss notification
    socket.on('chat:request_claimed', ({ chatRequestId }) => {
      setIncomingChatRequest((prev) => {
        if (prev && prev.chatRequestId === chatRequestId) {
          return null;
        }
        return prev;
      });
    });

    // Incoming call from server (inbound calls from customers)
    socket.on('telnyx:incoming_call', (data) => {
      console.log('[TelnyxContext] Incoming call:', data);
      setIncomingCall(data);
    });

    // Call answered confirmation
    socket.on('telnyx:call_answered', ({ callControlId }) => {
      if (activeCallRef.current?.callControlId === callControlId) {
        setCallState(CALL_STATE.ON_CALL);
        startCallTimer();
      }
    });

    // Call ended — require disposition
    socket.on('telnyx:call_ended', (data) => {
      stopCallTimer();
      setCallState(CALL_STATE.ENDED);
      if (data.callLogId) {
        setDispositionPending({ callId: data.callLogId, durationSeconds: data.durationSeconds });
      }
      setTimeout(() => {
        setCallState(CALL_STATE.IDLE);
        setActiveCall(null);
        activeCallRef.current = null;
        setIsMuted(false);
        setIsOnHold(false);
        setCallSeconds(0);
      }, 1500);
    });

    // Recording ready
    socket.on('telnyx:recording_ready', ({ callControlId, recordingUrl }) => {
      console.log('[TelnyxContext] Recording ready:', recordingUrl);
    });

    // Inbound SMS
    socket.on('telnyx:sms_received', (data) => {
      console.log('[TelnyxContext] Inbound SMS:', data);
      // TODO: Show notification
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [currentUser?.id]);

  // ── Load phone numbers on mount ─────────────────────────────────────────────
  useEffect(() => {
    fetchPhoneNumbers()
      .then((numbers) => {
        setPhoneNumbers(numbers || []);
        // Default to toll-free if available
        const tollFree = numbers?.find(n => n.type === 'toll_free');
        setSelectedFromNumber(tollFree?.number || numbers?.[0]?.number || '');
      })
      .catch((err) => console.warn('[TelnyxContext] Could not fetch phone numbers:', err.message));
  }, []);

  // ── Initialize Telnyx WebRTC SDK ────────────────────────────────────────────
  const initializeSdk = useCallback(async () => {
    if (isInitializingRef.current) return;
    if (sdkStatusRef.current === 'registered') return;

    isInitializingRef.current = true;
    const agent = currentUser || { id: 'agent-1', name: 'Agent' };

    try {
      setSdkStatus('loading');
      console.log('[TelnyxContext] Fetching WebRTC token...');

      const tokenData = await fetchWebRTCToken({
        agentId: agent.id,
        agentName: agent.name,
      });

      // Cleanup any previous client before creating a new one
      if (telnyxClientRef.current) {
        try {
          telnyxClientRef.current.disconnect?.();
        } catch (e) {
          // ignore
        }
        telnyxClientRef.current = null;
      }

      // Dynamically load @telnyx/webrtc SDK
      const { TelnyxRTC } = await import('@telnyx/webrtc');

      const client = new TelnyxRTC({
        login_token: tokenData.token,
        login: tokenData.sipUsername,
        password: tokenData.sipPassword,
        remoteElement: 'telnyx-remote-audio',
      });

      // ── SDK Event Listeners ──────────────────────────────────────────────────
      client.on('telnyx.ready', () => {
        console.log('[TelnyxRTC] Registered & ready for calls');
        setSdkStatus('registered');
        isInitializingRef.current = false;
      });

      client.on('telnyx.error', (err) => {
        console.error('[TelnyxRTC] Error:', err);
        setSdkStatus('error');
        isInitializingRef.current = false;
      });

      client.on('telnyx.socket.close', () => {
        console.warn('[TelnyxRTC] Socket closed');
        setSdkStatus('disconnected');
        isInitializingRef.current = false;
      });

      // Incoming & Outbound WebRTC call event updates
      client.on('telnyx.notification', (notification) => {
        console.log('[TelnyxRTC] Notification:', notification.type);

        if (notification.type === 'callUpdate') {
          const call = notification.call;
          const state = call?.state;
          console.log('[TelnyxRTC] Call state changed to:', state);

          // Attach remote audio stream whenever it becomes available
          if (call?.remoteStream && remoteAudioRef.current) {
            if (remoteAudioRef.current.srcObject !== call.remoteStream) {
              remoteAudioRef.current.srcObject = call.remoteStream;
            }
            remoteAudioRef.current.play().catch((e) => console.warn('[TelnyxRTC] Audio play error:', e));
          }

          if (state === 'ringing') {
            if (call.direction === 'inbound') {
              setIncomingCall({
                callControlId: call.id,
                from: call.options?.remoteCallerNumber || call.callerNumber,
                to: call.options?.destinationNumber || call.destinationNumber,
                direction: 'inbound',
                webrtcCall: call,
              });
              setCallState(CALL_STATE.RINGING);
            } else {
              setCallState(CALL_STATE.DIALING);
            }
          }

          if (state === 'active') {
            setCallState(CALL_STATE.ON_CALL);
            startCallTimer();
          }

          if (state === 'hangup' || state === 'destroy') {
            stopCallTimer();
            setCallState(CALL_STATE.ENDED);
            setIncomingCall(null);
            if (remoteAudioRef.current) {
              remoteAudioRef.current.srcObject = null;
            }
            setTimeout(() => {
              setCallState(CALL_STATE.IDLE);
              setActiveCall(null);
              activeCallRef.current = null;
              setIsMuted(false);
              setIsOnHold(false);
              setCallSeconds(0);
            }, 1500);
          }
        }
      });

      client.connect();
      telnyxClientRef.current = client;

    } catch (err) {
      console.error('[TelnyxContext] SDK init failed:', err.message);
      setSdkStatus('error');
      isInitializingRef.current = false;
    }
  }, [currentUser?.id]);

  // Auto-initialize WebRTC SDK once on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      if (sdkStatusRef.current === 'idle') {
        initializeSdk();
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [initializeSdk]);

  // ── Call Timer helpers ───────────────────────────────────────────────────────
  const startCallTimer = () => {
    setCallSeconds(0);
    if (callTimerRef.current) clearInterval(callTimerRef.current);
    callTimerRef.current = setInterval(() => {
      setCallSeconds((s) => s + 1);
    }, 1000);
  };

  const stopCallTimer = () => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
  };

  // Cleanup timer on unmount
  useEffect(() => () => stopCallTimer(), []);

  // ── Make an outbound call ────────────────────────────────────────────────────
  const makeCall = useCallback(async ({ toNumber, toName = '' }) => {
    if (!telnyxClientRef.current) {
      console.log('[TelnyxContext] Client not initialized. Initializing...');
      await initializeSdk();
    }

    if (callState !== CALL_STATE.IDLE) {
      console.warn('[TelnyxContext] Already in a call.');
      return;
    }

    try {
      // Ensure microphone access before placing WebRTC call
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      }

      // Unlock remote audio output element for browser media playback
      if (remoteAudioRef.current) {
        remoteAudioRef.current.play().catch(() => {});
      }

      setCallState(CALL_STATE.DIALING);
      setCallSeconds(0);

      const fromNumber = selectedFromNumber || phoneNumbers[0]?.number || '+18503329681';

      const call = telnyxClientRef.current.newCall({
        destinationNumber: toNumber,
        callerNumber: fromNumber,
        audio: true,
        video: false,
        remoteElement: remoteAudioRef.current || 'telnyx-remote-audio',
      });

      activeCallRef.current = call;
      setActiveCall({
        toNumber,
        toName,
        fromNumber,
        startedAt: new Date().toISOString(),
      });

      console.log(`[TelnyxContext] Calling ${toNumber} from ${fromNumber}...`);
      return call;
    } catch (err) {
      console.error('[TelnyxContext] makeCall error:', err.message);
      setCallState(CALL_STATE.IDLE);
      throw err;
    }
  }, [initializeSdk, callState, selectedFromNumber, phoneNumbers]);

  // ── Accept an incoming call ──────────────────────────────────────────────────
  const answerCall = useCallback(() => {
    const call = incomingCall?.webrtcCall;
    if (call) {
      call.answer({
        audio: true,
        video: false,
        remoteElement: remoteAudioRef.current || 'telnyx-remote-audio',
      });
      setIncomingCall(null);
      setCallState(CALL_STATE.ON_CALL);
      activeCallRef.current = call;
      startCallTimer();
    }
  }, [incomingCall]);

  // ── Reject incoming call ─────────────────────────────────────────────────────
  const rejectCall = useCallback(() => {
    const call = incomingCall?.webrtcCall;
    if (call) call.hangup();
    setIncomingCall(null);
    setCallState(CALL_STATE.IDLE);
  }, [incomingCall]);

  // ── Hangup current call ───────────────────────────────────────────────────────
  const hangup = useCallback(() => {
    const call = activeCallRef.current;
    if (call) {
      call.hangup();
    }
    stopCallTimer();
    setCallState(CALL_STATE.ENDED);
    setTimeout(() => {
      setCallState(CALL_STATE.IDLE);
      setActiveCall(null);
      activeCallRef.current = null;
      setIsMuted(false);
      setIsOnHold(false);
      setCallSeconds(0);
    }, 1200);
  }, []);

  // ── Toggle mute ───────────────────────────────────────────────────────────────
  const toggleMute = useCallback(() => {
    const call = activeCallRef.current;
    if (!call) return;
    if (isMuted) {
      call.unmuteAudio();
      setIsMuted(false);
    } else {
      call.muteAudio();
      setIsMuted(true);
    }
  }, [isMuted]);

  // ── Toggle hold ───────────────────────────────────────────────────────────────
  const toggleHold = useCallback(() => {
    const call = activeCallRef.current;
    if (!call) return;
    if (isOnHold) {
      call.unhold();
      setIsOnHold(false);
      setCallState(CALL_STATE.ON_CALL);
    } else {
      call.hold();
      setIsOnHold(true);
      setCallState(CALL_STATE.ON_HOLD);
    }
  }, [isOnHold]);

  // ── Send DTMF tones ────────────────────────────────────────────────────────────
  const sendDTMF = useCallback((digit) => {
    const call = activeCallRef.current;
    if (call) call.dtmf(digit);
  }, []);

  // ── Clear disposition pending (after agent submits it) ────────────────────────
  const clearDispositionPending = useCallback(() => {
    setDispositionPending(null);
  }, []);

  // ── Accept incoming chat request (Single-agent atomic claim) ───────────────────
  const acceptChatRequest = useCallback((sessionId, callback) => {
    if (!socketRef.current || !sessionId) return;
    socketRef.current.emit('chat:accept_request', {
      sessionId,
      agentId: currentUser?.id || 'agent-1',
      agentName: currentUser?.name || 'Support Agent',
    }, (res) => {
      setIncomingChatRequest(null);
      if (callback) callback(res);
    });
  }, [currentUser]);

  // ── Dismiss incoming chat request notification ────────────────────────────────
  const dismissChatRequest = useCallback(() => {
    setIncomingChatRequest(null);
  }, []);

  const value = {
    // SDK
    sdkStatus,
    initializeSdk,
    socketConnected,

    // Call state
    callState,
    activeCall,
    incomingCall,
    callSeconds,
    isMuted,
    isOnHold,
    dispositionPending,

    // Chat incoming notification
    incomingChatRequest,
    acceptChatRequest,
    dismissChatRequest,

    // Phone numbers
    phoneNumbers,
    selectedFromNumber,
    setSelectedFromNumber,

    // Actions
    makeCall,
    answerCall,
    rejectCall,
    hangup,
    toggleMute,
    toggleHold,
    sendDTMF,
    clearDispositionPending,
  };

  return (
    <TelnyxContext.Provider value={value}>
      {children}
      <audio
        ref={remoteAudioRef}
        id="telnyx-remote-audio"
        autoPlay
        playsInline
        style={{
          position: 'fixed',
          top: -9999,
          left: -9999,
          width: '1px',
          height: '1px',
          opacity: 0.01,
          pointerEvents: 'none',
        }}
      />
    </TelnyxContext.Provider>
  );
};

export const useTelnyx = () => {
  const ctx = useContext(TelnyxContext);
  if (!ctx) throw new Error('useTelnyx must be used within TelnyxProvider');
  return ctx;
};
