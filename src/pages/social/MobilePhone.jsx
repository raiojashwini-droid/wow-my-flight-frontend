import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTelnyx, CALL_STATE } from '../../contexts/TelnyxContext';
import { getBackendUrl } from '../../services/dbService';

export default function MobilePhone() {
  const { currentUser } = useAuth();
  const phone = useTelnyx();
  const [to, setTo] = useState('');
  const [text, setText] = useState('');
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const loadMessages = async () => {
    const response = await fetch(getBackendUrl() + '/api/telnyx/sms');
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Could not load messages');
    setMessages(result.data || []);
  };
  useEffect(() => {
    loadMessages().catch(e => setError(e.message));
    const timer = setInterval(() => loadMessages().catch(() => {}), 10000);
    return () => clearInterval(timer);
  }, [currentUser.id]);
  async function action(fn) {
    setError(''); setNotice(''); setBusy(true);
    try { await fn(); } catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  async function send() {
    const response = await fetch(getBackendUrl() + '/api/telnyx/sms/send', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to: to.trim(), text })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'SMS could not be sent');
    setText(''); setNotice('Message accepted. Delivery status appears below.');
    await loadMessages();
  }
  const inCall = ![CALL_STATE.IDLE, CALL_STATE.ENDED].includes(phone.callState);
  const button = 'rounded-xl px-5 py-3 font-semibold disabled:opacity-40';
  return <main className="mx-auto w-full max-w-xl space-y-5 p-3 sm:p-6">
    <h1 className="text-2xl font-bold">Calls &amp; SMS</h1>
    <p>{currentUser.name} · {currentUser.phone || 'No number assigned'}</p>
    <div className="rounded-2xl border border-slate-300 p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span role="status">Phone: {phone.sdkStatus === 'registered' ? 'Ready' : phone.sdkStatus}</span>
        <button className={`${button} bg-slate-200 text-slate-900`} onClick={() => action(phone.initializeSdk)} disabled={busy || phone.sdkStatus === 'loading'}>Connect phone</button>
      </div>
      <p className="text-sm">Keep this page open to receive calls. Allow microphone access when asked.</p>
      <label className="block">Customer phone number
        <input aria-label="Customer phone number" type="tel" autoComplete="tel" placeholder="+1…" value={to} onChange={e => setTo(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 p-3 text-slate-900" />
      </label>
      {phone.incomingCall?.webrtcCall && <div className="space-y-3" role="alert">
        <p>Incoming call: {phone.incomingCall.from}</p>
        <button className={`${button} bg-green-700 text-white`} onClick={() => action(phone.answerCall)}>Answer</button>{' '}
        <button className={`${button} bg-red-700 text-white`} onClick={phone.rejectCall}>Decline</button>
      </div>}
      <div className="flex flex-wrap gap-3">
        <button className={`${button} bg-green-700 text-white`} disabled={busy || inCall || phone.sdkStatus !== 'registered' || !to} onClick={() => action(() => phone.makeCall({ toNumber: to.trim() }))}>Call</button>
        {inCall && <>
          <button className={`${button} bg-red-700 text-white`} onClick={phone.hangup}>End call</button>
          <button className={`${button} bg-slate-200 text-slate-900`} onClick={phone.toggleMute}>{phone.isMuted ? 'Unmute' : 'Mute'}</button>
          <button className={`${button} bg-slate-200 text-slate-900`} onClick={phone.toggleHold}>{phone.isOnHold ? 'Resume' : 'Hold'}</button>
        </>}
      </div>
      {inCall && <p>{phone.callState} · {phone.callSeconds}s</p>}
      <label className="block">Message
        <textarea aria-label="Message" rows={3} maxLength={1600} value={text} onChange={e => setText(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 p-3 text-slate-900" />
      </label>
      <button className={`${button} bg-blue-700 text-white`} disabled={busy || !text.trim() || !to} onClick={() => action(send)}>Send SMS</button>
      {error && <p role="alert" className="text-red-600">{error}</p>}
      {notice && <p role="status">{notice}</p>}
    </div>
    <section className="space-y-3">
      <h2 className="text-xl font-semibold">Messages</h2>
      {!messages.length && <p>No messages yet.</p>}
      {messages.map(m => <article key={m.id} className="rounded-xl border border-slate-300 p-4 break-words">
        <p className="font-semibold">{m.direction === 'inbound' ? `From ${m.fromNumber}` : `To ${m.toNumber}`}</p>
        <p className="whitespace-pre-wrap">{m.text}</p>
        <small>{m.status} · {new Date(m.createdAt).toLocaleString()}</small>
      </article>)}
    </section>
  </main>;
}
