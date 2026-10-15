/**
 * src/pages/documents/documentVisualTemplates.js
 * High-fidelity realistic visual document generators for Passport, E-Ticket, Visa, and Travel Docs.
 * Used for instant in-browser inspection, authentic preview, and download.
 */

export const getRealisticDocumentVisual = (doc) => {
  if (!doc) return null;
  // If the user uploaded a real file (image or base64 data URL), use that real file!
  if (doc.fileData) return doc.fileData;

  const rawName = (doc.customerName || 'PASSENGER').toUpperCase();
  const parts = rawName.split(' ');
  const surname = parts.length > 1 ? parts[parts.length - 1] : rawName;
  const givenNames = parts.length > 1 ? parts.slice(0, -1).join(' ') : 'TRAVELER';
  const pnr = (doc.pnr || 'WMF99').toUpperCase();
  const expiry = doc.expiryDate || '2031-10-15';
  const bookingRef = doc.bookingRef || 'BK-101';

  // 1. PASSPORT (Authentic US/International Biometric Passport Page)
  if (doc.type === 'Passport') {
    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 480" width="700" height="480">
      <defs>
        <linearGradient id="passBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#f8fafc"/>
          <stop offset="40%" stop-color="#eff6ff"/>
          <stop offset="100%" stop-color="#e0e7ff"/>
        </linearGradient>
        <pattern id="guilloche" width="30" height="30" patternUnits="userSpaceOnUse">
          <circle cx="15" cy="15" r="12" fill="none" stroke="#93c5fd" stroke-width="0.5" opacity="0.35"/>
          <path d="M 0 15 Q 7.5 0 15 15 T 30 15" fill="none" stroke="#cbd5e1" stroke-width="0.6" opacity="0.4"/>
        </pattern>
      </defs>

      <!-- Outer Booklet Border & Guilloche Security Background -->
      <rect width="700" height="480" rx="14" fill="url(#passBg)" stroke="#64748b" stroke-width="2.5"/>
      <rect x="8" y="8" width="684" height="464" rx="10" fill="url(#guilloche)"/>
      <rect x="10" y="10" width="680" height="460" rx="8" fill="none" stroke="#2563eb" stroke-width="1.2" stroke-dasharray="6,4"/>

      <!-- Header Banner -->
      <rect x="8" y="8" width="684" height="50" rx="8" fill="#1e3a8a"/>
      <text x="32" y="40" font-family="'Helvetica Neue', Arial, sans-serif" font-size="19" font-weight="900" fill="#ffffff" letter-spacing="2">PASSPORT / PASSEPORT</text>
      <text x="490" y="40" font-family="'Helvetica Neue', Arial, sans-serif" font-size="13" font-weight="800" fill="#93c5fd" letter-spacing="1">UNITED STATES OF AMERICA</text>

      <!-- Biometric Chip Symbol -->
      <rect x="636" y="70" width="36" height="24" rx="4" fill="none" stroke="#475569" stroke-width="2"/>
      <circle cx="654" cy="82" r="6" fill="#475569"/>
      <line x1="636" y1="82" x2="672" y2="82" stroke="#475569" stroke-width="2"/>

      <!-- Photo Box -->
      <rect x="35" y="80" width="165" height="205" rx="6" fill="#cbd5e1" stroke="#334155" stroke-width="2"/>
      <!-- Silhouette Portrait -->
      <circle cx="117" cy="150" r="44" fill="#64748b"/>
      <path d="M 58 265 C 58 205, 176 205, 176 265 Z" fill="#64748b"/>
      <text x="117" y="278" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="#1e293b" text-anchor="middle">OFFICIAL TRAVELER PHOTO</text>

      <!-- Security Stamp Over Photo -->
      <circle cx="170" cy="240" r="32" fill="none" stroke="#2563eb" stroke-width="2" opacity="0.7"/>
      <text x="170" y="244" font-family="Arial, sans-serif" font-size="8" font-weight="bold" fill="#2563eb" text-anchor="middle" opacity="0.9">AUTHENTIC</text>

      <!-- Fields Grid -->
      <text x="230" y="88" font-family="Arial, sans-serif" font-size="9" fill="#64748b" font-weight="bold">Type / Type</text>
      <text x="230" y="105" font-family="Arial, sans-serif" font-size="14" fill="#0f172a" font-weight="bold">P</text>

      <text x="320" y="88" font-family="Arial, sans-serif" font-size="9" fill="#64748b" font-weight="bold">Code of State</text>
      <text x="320" y="105" font-family="Arial, sans-serif" font-size="14" fill="#0f172a" font-weight="bold">USA</text>

      <text x="460" y="88" font-family="Arial, sans-serif" font-size="9" fill="#64748b" font-weight="bold">Passport No. / No. du Passeport</text>
      <text x="460" y="106" font-family="monospace" font-size="16" fill="#b91c1c" font-weight="900">${pnr}89410</text>

      <text x="230" y="132" font-family="Arial, sans-serif" font-size="9" fill="#64748b" font-weight="bold">Surname / Nom</text>
      <text x="230" y="151" font-family="Arial, sans-serif" font-size="16" fill="#0f172a" font-weight="900">${surname}</text>

      <text x="230" y="178" font-family="Arial, sans-serif" font-size="9" fill="#64748b" font-weight="bold">Given Names / Prénoms</text>
      <text x="230" y="196" font-family="Arial, sans-serif" font-size="14" fill="#0f172a" font-weight="bold">${givenNames}</text>

      <text x="230" y="222" font-family="Arial, sans-serif" font-size="9" fill="#64748b" font-weight="bold">Nationality / Nationalité</text>
      <text x="230" y="240" font-family="Arial, sans-serif" font-size="13" fill="#0f172a" font-weight="bold">UNITED STATES OF AMERICA</text>

      <text x="460" y="222" font-family="Arial, sans-serif" font-size="9" fill="#64748b" font-weight="bold">Date of Birth</text>
      <text x="460" y="240" font-family="Arial, sans-serif" font-size="13" fill="#0f172a" font-weight="bold">18 JUN 1988</text>

      <text x="230" y="266" font-family="Arial, sans-serif" font-size="9" fill="#64748b" font-weight="bold">Date of Issue</text>
      <text x="230" y="284" font-family="Arial, sans-serif" font-size="13" fill="#0f172a" font-weight="bold">15 AUG 2021</text>

      <text x="460" y="266" font-family="Arial, sans-serif" font-size="9" fill="#64748b" font-weight="bold">Date of Expiration</text>
      <text x="460" y="284" font-family="Arial, sans-serif" font-size="14" fill="#15803d" font-weight="900">${expiry}</text>

      <text x="230" y="310" font-family="Arial, sans-serif" font-size="9" fill="#64748b" font-weight="bold">Issuing Authority / Booking</text>
      <text x="230" y="327" font-family="Arial, sans-serif" font-size="11" fill="#0f172a" font-weight="bold">UNITED STATES DEPT OF STATE · REF: ${bookingRef}</text>

      <!-- ICAO 9303 Machine Readable Zone (MRZ) 2 Lines -->
      <rect x="20" y="365" width="660" height="98" rx="6" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="1.5"/>
      <text x="36" y="405" font-family="'Courier New', Courier, monospace" font-size="19" font-weight="bold" fill="#0f172a" letter-spacing="3">P&lt;USA${surname}&lt;&lt;${givenNames.replace(/\s+/g, '&lt;')}&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</text>
      <text x="36" y="440" font-family="'Courier New', Courier, monospace" font-size="19" font-weight="bold" fill="#0f172a" letter-spacing="3">${pnr}894107USA8806184M3108154&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;06</text>
    </svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }

  // 2. E-TICKET (Electronic Passenger Ticket & Boarding Pass)
  if (doc.type === 'E-Ticket (PDF)') {
    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 440" width="700" height="440">
      <defs>
        <linearGradient id="tktBg" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="68%" stop-color="#ffffff"/>
          <stop offset="68%" stop-color="#f8fafc"/>
          <stop offset="100%" stop-color="#f1f5f9"/>
        </linearGradient>
      </defs>
      <rect width="700" height="440" rx="12" fill="url(#tktBg)" stroke="#0284c7" stroke-width="2.5"/>
      
      <!-- Top banner -->
      <rect x="0" y="0" width="700" height="54" rx="12" fill="#0369a1"/>
      <text x="30" y="35" font-family="'Helvetica Neue', Arial, sans-serif" font-size="17" font-weight="bold" fill="#ffffff">BRITISH AIRWAYS · ELECTRONIC PASSENGER TICKET</text>
      <text x="540" y="35" font-family="monospace" font-size="14" font-weight="bold" fill="#bae6fd">PNR: ${pnr}</text>

      <!-- Main Passenger Info -->
      <text x="30" y="90" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="#64748b">PASSENGER NAME</text>
      <text x="30" y="115" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#0f172a">${rawName}</text>

      <text x="260" y="90" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="#64748b">ETICKET NUMBER</text>
      <text x="260" y="115" font-family="monospace" font-size="14" font-weight="bold" fill="#0f172a">125-9834102941</text>

      <text x="30" y="160" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="#64748b">FLIGHT / CABIN CLASS</text>
      <text x="30" y="185" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#0f172a">BA 178 · CLUB WORLD (J)</text>

      <text x="260" y="160" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="#64748b">SEAT / BOARDING</text>
      <text x="260" y="185" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#0369a1">SEAT 4A · GROUP 1</text>

      <!-- Route Banner -->
      <rect x="30" y="215" width="420" height="70" rx="8" fill="#f0f9ff" stroke="#bae6fd"/>
      <text x="50" y="248" font-family="Arial, sans-serif" font-size="24" font-weight="900" fill="#0369a1">JFK</text>
      <text x="50" y="270" font-family="Arial, sans-serif" font-size="11" fill="#64748b">New York, Terminal 8</text>

      <text x="210" y="258" font-family="Arial, sans-serif" font-size="20" fill="#0284c7" font-weight="bold">✈ ───────►</text>

      <text x="365" y="248" font-family="Arial, sans-serif" font-size="24" font-weight="900" fill="#0369a1">LHR</text>
      <text x="365" y="270" font-family="Arial, sans-serif" font-size="11" fill="#64748b">London Heathrow, T5</text>

      <!-- Perforation Divider -->
      <line x1="480" y1="0" x2="480" y2="440" stroke="#94a3b8" stroke-width="2" stroke-dasharray="8,6"/>

      <!-- Boarding Pass Stub Right Side -->
      <text x="505" y="85" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#0369a1">BOARDING STUB</text>
      <text x="505" y="115" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#0f172a">${surname}</text>
      <text x="505" y="145" font-family="Arial, sans-serif" font-size="11" fill="#64748b">SEAT: <b>4A</b></text>
      <text x="505" y="170" font-family="Arial, sans-serif" font-size="11" fill="#64748b">GATE: <b>B22</b></text>
      <text x="505" y="195" font-family="Arial, sans-serif" font-size="11" fill="#64748b">BOARDING: <b>18:45</b></text>

      <!-- Barcode Mockup -->
      <rect x="505" y="225" width="165" height="70" fill="#0f172a"/>
      <line x1="520" y1="225" x2="520" y2="295" stroke="#ffffff" stroke-width="3"/>
      <line x1="530" y1="225" x2="530" y2="295" stroke="#ffffff" stroke-width="1.5"/>
      <line x1="542" y1="225" x2="542" y2="295" stroke="#ffffff" stroke-width="4"/>
      <line x1="555" y1="225" x2="555" y2="295" stroke="#ffffff" stroke-width="2"/>
      <line x1="568" y1="225" x2="568" y2="295" stroke="#ffffff" stroke-width="5"/>
      <line x1="582" y1="225" x2="582" y2="295" stroke="#ffffff" stroke-width="2"/>
      <line x1="595" y1="225" x2="595" y2="295" stroke="#ffffff" stroke-width="3"/>
      <line x1="610" y1="225" x2="610" y2="295" stroke="#ffffff" stroke-width="4"/>
      <line x1="625" y1="225" x2="625" y2="295" stroke="#ffffff" stroke-width="1.5"/>
      <line x1="640" y1="225" x2="640" y2="295" stroke="#ffffff" stroke-width="3"/>

      <!-- Footer Barcode & Legal -->
      <rect x="30" y="320" width="420" height="90" fill="#f8fafc" stroke="#e2e8f0" rx="6"/>
      <text x="45" y="348" font-family="monospace" font-size="16" font-weight="bold" fill="#0f172a">||| | ||||| ||| |||| || |||||| |||| | ||| ||||</text>
      <text x="45" y="375" font-family="monospace" font-size="11" fill="#475569">M1${surname}/${givenNames}     E${pnr} JFKBA178 04A CLUB WORLD</text>
      <text x="45" y="395" font-family="Arial, sans-serif" font-size="9" fill="#94a3b8">Baggage: 2 Checked Bags (32kg) · Valid for BA Flight Operations</text>
    </svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }

  // 3. VISA COPY (e-Visa / Travel Permit)
  if (doc.type === 'Visa Copy') {
    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 450" width="700" height="450">
      <rect width="700" height="450" rx="10" fill="#ffffff" stroke="#047857" stroke-width="2.5"/>
      <rect x="0" y="0" width="700" height="60" rx="10" fill="#047857"/>
      <text x="30" y="38" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#ffffff">GENERAL DIRECTORATE OF RESIDENCY · ENTRY VISA</text>
      <text x="560" y="38" font-family="monospace" font-size="14" font-weight="bold" fill="#bbf7d0">${pnr}-VISA</text>

      <rect x="30" y="80" width="640" height="120" rx="6" fill="#f0fdf4" stroke="#bbf7d0"/>
      <text x="50" y="115" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#166534">BENEFICIARY TRAVELER</text>
      <text x="50" y="145" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#0f172a">${rawName}</text>
      <text x="50" y="175" font-family="Arial, sans-serif" font-size="12" fill="#475569">Booking Ref: <b>${bookingRef}</b> | Classification: <b>TOURIST (30 DAYS)</b> | Status: <b>APPROVED</b></text>

      <text x="450" y="115" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#166534">VALID UNTIL</text>
      <text x="450" y="145" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#b91c1c">${expiry}</text>

      <!-- Notes & Official Stamp -->
      <rect x="30" y="220" width="430" height="185" rx="6" fill="#f8fafc" stroke="#cbd5e1"/>
      <text x="50" y="250" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#334155">OFFICIAL IMMIGRATION VERIFICATION & COMPLIANCE</text>
      <text x="50" y="278" font-family="Arial, sans-serif" font-size="12" fill="#475569">${doc.notes || 'Entry permit approved. Single entry allowed. Valid for transit and tourism.'}</text>
      <text x="50" y="320" font-family="Arial, sans-serif" font-size="11" fill="#64748b">Verified by: <b>${doc.verifiedBy || 'QA Officer'}</b></text>
      <text x="50" y="345" font-family="monospace" font-size="10" fill="#94a3b8">BARCODE / SHA: 2026-DXB-${pnr}-991823901</text>
      <text x="50" y="380" font-family="monospace" font-size="16" font-weight="bold" fill="#0f172a">|||||| | || ||||| || |||||||| |||| | ||||||</text>

      <!-- Circular Green Immigration Seal -->
      <circle cx="560" cy="310" r="60" fill="none" stroke="#047857" stroke-width="3" stroke-dasharray="5,3"/>
      <circle cx="560" cy="310" r="50" fill="none" stroke="#047857" stroke-width="1.5"/>
      <text x="560" y="305" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#047857" text-anchor="middle">OFFICIAL VISA</text>
      <text x="560" y="325" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="#047857" text-anchor="middle">VERIFIED</text>
    </svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }

  // 4. OFFICIAL ITINERARY / AUTH FORM / OTHER FALLBACK
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 450" width="700" height="450">
    <rect width="700" height="450" rx="10" fill="#ffffff" stroke="#4f46e5" stroke-width="2.5"/>
    <rect x="0" y="0" width="700" height="60" rx="10" fill="#4338ca"/>
    <text x="30" y="38" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#ffffff">OFFICIAL TRAVEL RECORD · ${doc.type.toUpperCase()}</text>
    <text x="540" y="38" font-family="monospace" font-size="14" font-weight="bold" fill="#c7d2fe">${pnr}</text>

    <rect x="30" y="80" width="640" height="110" rx="6" fill="#eef2ff" stroke="#c7d2fe"/>
    <text x="50" y="112" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#3730a3">PASSENGER / RECIPIENT</text>
    <text x="50" y="140" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#0f172a">${rawName}</text>
    <text x="50" y="168" font-family="Arial, sans-serif" font-size="12" fill="#475569">Booking: <b>${bookingRef}</b> | File: <b>${doc.fileName}</b> | Status: <b>${doc.status}</b></text>

    <!-- Notes & Stamp -->
    <rect x="30" y="210" width="440" height="195" rx="6" fill="#f8fafc" stroke="#cbd5e1"/>
    <text x="50" y="240" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#334155">RECORD DETAILS & VERIFICATION LOG</text>
    <text x="50" y="270" font-family="Arial, sans-serif" font-size="12" fill="#475569">${doc.notes || 'Document verified authentic and approved for international flight operations.'}</text>
    <text x="50" y="315" font-family="Arial, sans-serif" font-size="11" fill="#64748b">Verified by Authority: <b>${doc.verifiedBy || 'Super Admin'}</b></text>
    <text x="50" y="340" font-family="Arial, sans-serif" font-size="11" fill="#64748b">Expiry Date: <b>${expiry}</b></text>
    <text x="50" y="375" font-family="monospace" font-size="10" fill="#94a3b8">SHA-256: 4f8b2c1e7a9d30048e72fbc681023a9d (CLOUD ARCHIVE)</text>

    <!-- Official Seal -->
    <circle cx="560" cy="305" r="58" fill="none" stroke="#4f46e5" stroke-width="3" stroke-dasharray="5,3"/>
    <circle cx="560" cy="305" r="48" fill="none" stroke="#4f46e5" stroke-width="1.5"/>
    <text x="560" y="300" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#4f46e5" text-anchor="middle">WOWMYFLIGHT</text>
    <text x="560" y="320" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="#4f46e5" text-anchor="middle">CERTIFIED</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};
