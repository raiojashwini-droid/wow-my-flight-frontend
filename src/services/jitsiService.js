/**
 * src/services/jitsiService.js
 * 
 * Production-ready Jitsi Meet Video Conferencing Service for WowMyFlight CRM.
 * Provides:
 *   - Secure, branded room generation
 *   - Direct Jitsi URL generation (https://meet.jit.si/<room>)
 *   - Seamless WhatsApp & Email invitation generator
 *   - Dynamic Jitsi Meet External API script loader for embedded CRM video calls
 */

const JITSI_DOMAIN = 'meet.jit.si';

/**
 * Generate a unique, URL-safe room name for WowMyFlight
 * e.g., "WowMyFlight-Lead-LD1001-a8f2"
 */
export function generateMeetingRoom(identifier = 'Consultation', clientName = '') {
  const cleanId = String(identifier).replace(/[^a-zA-Z0-9]/g, '');
  const cleanName = String(clientName).trim().replace(/[^a-zA-Z0-9]/g, '').slice(0, 10);
  const randomSuffix = Math.random().toString(36).substring(2, 6);
  
  if (cleanName) {
    return `WowMyFlight-${cleanName}-${cleanId || 'Room'}-${randomSuffix}`;
  }
  return `WowMyFlight-${cleanId || 'Consultation'}-${randomSuffix}`;
}

/**
 * Build direct public Jitsi Meet URL
 */
export function getMeetingUrl(roomName) {
  const cleanRoom = encodeURIComponent(roomName || generateMeetingRoom());
  return `https://${JITSI_DOMAIN}/${cleanRoom}`;
}

/**
 * Pre-formatted meeting invite text for WhatsApp / Email / SMS
 */
export function generateMeetingInvitation({
  roomName,
  meetingUrl,
  clientName = 'Valued Traveler',
  agentName = 'Flight Expert',
  dateTime = 'Immediate Consultation',
  origin = '',
  destination = '',
}) {
  const url = meetingUrl || getMeetingUrl(roomName);
  const routeText = origin && destination ? ` (${origin} ➔ ${destination})` : '';

  return (
    `✈️ *WOWMYFLIGHT — LIVE VIDEO CONSULTATION*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `👤 *Client:* ${clientName}\n` +
    `👨‍💼 *Travel Consultant:* ${agentName}\n` +
    `🛫 *Inquiry:* Flight Consultation${routeText}\n` +
    `📅 *Scheduled:* ${dateTime}\n\n` +
    `🎥 *JOIN LIVE VIDEO MEETING:* (No download needed!)\n` +
    `👉 ${url}\n\n` +
    `💡 *Instructions:* Click the link above on your smartphone or computer to join directly in your browser with Camera & Mic enabled.\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━`
  );
}

/**
 * Dynamically loads the official Jitsi Meet External API script tag
 * if it has not been loaded yet.
 */
export function loadJitsiScript() {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && window.JitsiMeetExternalAPI) {
      return resolve(window.JitsiMeetExternalAPI);
    }

    const existingScript = document.getElementById('jitsi-external-api-script');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.JitsiMeetExternalAPI));
      existingScript.addEventListener('error', (e) => reject(e));
      return;
    }

    const script = document.createElement('script');
    script.id = 'jitsi-external-api-script';
    script.src = `https://${JITSI_DOMAIN}/external_api.js`;
    script.async = true;
    script.onload = () => {
      console.log('✅ [Jitsi] JitsiMeetExternalAPI script loaded successfully.');
      resolve(window.JitsiMeetExternalAPI);
    };
    script.onerror = (err) => {
      console.error('❌ [Jitsi] Failed to load JitsiMeetExternalAPI script:', err);
      reject(err);
    };

    document.body.appendChild(script);
  });
}

export const jitsiService = {
  domain: JITSI_DOMAIN,
  generateMeetingRoom,
  getMeetingUrl,
  generateMeetingInvitation,
  loadJitsiScript,
};

export default jitsiService;
