/* ------------------------------------------------------------------ */
/*  Realistic SVG logos for partner companies                          */
/*  Software companies & tech institutions                             */
/* ------------------------------------------------------------------ */

export function AppWorksLogo({ className = '' }) {
  return (
    <svg viewBox="0 0 160 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="8" width="24" height="24" rx="6" fill="#6366F1" />
      <path d="M9 18l4 4 6-8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <text x="34" y="26" fontFamily="system-ui, sans-serif" fontSize="14" fontWeight="700" fill="#1E293B">
        App
      </text>
      <text x="64" y="26" fontFamily="system-ui, sans-serif" fontSize="14" fontWeight="700" fill="#6366F1">
        Works
      </text>
    </svg>
  );
}

export function KifyLogo({ className = '' }) {
  return (
    <svg viewBox="0 0 120 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="16" fill="#059669" />
      <path d="M14 26V16l6-4 6 4v10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="14" y1="26" x2="26" y2="26" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <text x="44" y="26" fontFamily="system-ui, sans-serif" fontSize="15" fontWeight="800" fill="#059669">
        Kify
      </text>
    </svg>
  );
}

export function ArifPayLogo({ className = '' }) {
  return (
    <svg viewBox="0 0 140 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="6" width="28" height="28" rx="4" fill="#DC2626" />
      <path d="M9 20h14M16 13v14" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      <text x="38" y="26" fontFamily="system-ui, sans-serif" fontSize="14" fontWeight="800" fill="#DC2626">
        ArifPay
      </text>
    </svg>
  );
}

export function TelebirrLogo({ className = '' }) {
  return (
    <svg viewBox="0 0 150 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="16" fill="#7C3AED" />
      <path d="M12 20c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <circle cx="20" cy="20" r="4" fill="white" />
      <path d="M10 28h20" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <text x="44" y="26" fontFamily="system-ui, sans-serif" fontSize="13" fontWeight="700" fill="#7C3AED">
        TeleBirr
      </text>
    </svg>
  );
}

export function SafaricomLogo({ className = '' }) {
  return (
    <svg viewBox="0 0 150 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="8" width="24" height="24" rx="12" fill="#16A34A" />
      <path d="M10 20h8M14 16v8" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      <text x="34" y="26" fontFamily="system-ui, sans-serif" fontSize="14" fontWeight="700" fill="#16A34A">
        Safaricom
      </text>
    </svg>
  );
}

export function ChapaLogo({ className = '' }) {
  return (
    <svg viewBox="0 0 120 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="8" width="24" height="24" rx="6" fill="#F59E0B" />
      <path d="M9 20h10M14 15v10" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      <text x="34" y="26" fontFamily="system-ui, sans-serif" fontSize="14" fontWeight="800" fill="#F59E0B">
        Chapa
      </text>
    </svg>
  );
}

export function EthioTechLogo({ className = '' }) {
  return (
    <svg viewBox="0 0 170 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 6L4 18h32L20 6z" fill="#2563EB" />
      <rect x="8" y="18" width="6" height="14" fill="#2563EB" />
      <rect x="17" y="18" width="6" height="14" fill="#2563EB" />
      <rect x="26" y="18" width="6" height="14" fill="#2563EB" />
      <rect x="4" y="32" width="32" height="3" rx="1" fill="#2563EB" />
      <text x="44" y="18" fontFamily="system-ui, sans-serif" fontSize="9" fontWeight="700" fill="#2563EB">
        ETHIO
      </text>
      <text x="44" y="30" fontFamily="system-ui, sans-serif" fontSize="9" fontWeight="400" fill="#3B82F6">
        TECH HUB
      </text>
    </svg>
  );
}

export function rideLogo({ className = '' }) {
  return (
    <svg viewBox="0 0 130 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="16" fill="#0891B2" />
      <path d="M12 20l4 4 8-8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <text x="44" y="26" fontFamily="system-ui, sans-serif" fontSize="14" fontWeight="800" fill="#0891B2">
        Ride
      </text>
    </svg>
  );
}

/* Export all logos with metadata */
export const LOGO_COMPONENTS = [
  { Component: AppWorksLogo, name: 'AppWorks' },
  { Component: KifyLogo, name: 'Kify' },
  { Component: ArifPayLogo, name: 'ArifPay' },
  { Component: TelebirrLogo, name: 'TeleBirr' },
  { Component: SafaricomLogo, name: 'Safaricom' },
  { Component: ChapaLogo, name: 'Chapa' },
  { Component: EthioTechLogo, name: 'Ethio Tech Hub' },
  { Component: rideLogo, name: 'Ride' },
];
