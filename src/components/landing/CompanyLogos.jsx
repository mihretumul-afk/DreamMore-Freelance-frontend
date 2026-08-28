/* ------------------------------------------------------------------ */
/*  Realistic SVG logos for partner companies                          */
/*  Replace these with actual brand assets when available              */
/* ------------------------------------------------------------------ */

export function TechEthiopiaLogo({ className = '' }) {
  return (
    <svg viewBox="0 0 140 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="8" width="24" height="24" rx="6" fill="#3B82F6" />
      <path d="M9 18l4 4 6-8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <text x="34" y="26" fontFamily="system-ui, sans-serif" fontSize="14" fontWeight="700" fill="#1E293B">
        Tech
      </text>
      <text x="68" y="26" fontFamily="system-ui, sans-serif" fontSize="14" fontWeight="700" fill="#3B82F6">
        Ethiopia
      </text>
    </svg>
  );
}

export function BankOfAbyssiniaLogo({ className = '' }) {
  return (
    <svg viewBox="0 0 180 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="16" fill="#059669" />
      <path d="M14 26V16l6-4 6 4v10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="14" y1="26" x2="26" y2="26" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <text x="44" y="18" fontFamily="system-ui, sans-serif" fontSize="10" fontWeight="700" fill="#059669">
        BANK OF
      </text>
      <text x="44" y="30" fontFamily="system-ui, sans-serif" fontSize="10" fontWeight="700" fill="#059669">
        ABYSSINIA
      </text>
    </svg>
  );
}

export function DashenBankLogo({ className = '' }) {
  return (
    <svg viewBox="0 0 150 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="6" width="28" height="28" rx="4" fill="#DC2626" />
      <path d="M9 20h14M16 13v14" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      <text x="38" y="26" fontFamily="system-ui, sans-serif" fontSize="14" fontWeight="800" fill="#DC2626">
        Dashen
      </text>
      <text x="104" y="26" fontFamily="system-ui, sans-serif" fontSize="14" fontWeight="400" fill="#64748B">
        Bank
      </text>
    </svg>
  );
}

export function EthioTelecomLogo({ className = '' }) {
  return (
    <svg viewBox="0 0 160 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="16" fill="#7C3AED" />
      <path d="M12 20c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <circle cx="20" cy="20" r="4" fill="white" />
      <path d="M10 28h20" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <text x="44" y="26" fontFamily="system-ui, sans-serif" fontSize="13" fontWeight="700" fill="#7C3AED">
        Ethio Telecom
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

export function HabeshaBreweriesLogo({ className = '' }) {
  return (
    <svg viewBox="0 0 180 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 10h16v20H8z" fill="#D97706" rx="2" />
      <path d="M12 14v12M16 14v12M20 14v12" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M24 16c4 0 6 2 6 4s-2 4-6 4" stroke="#D97706" strokeWidth="2" strokeLinecap="round" />
      <text x="38" y="18" fontFamily="system-ui, sans-serif" fontSize="10" fontWeight="700" fill="#D97706">
        HABESHA
      </text>
      <text x="38" y="30" fontFamily="system-ui, sans-serif" fontSize="10" fontWeight="400" fill="#92400E">
        BREWERIES
      </text>
    </svg>
  );
}

export function AddisAbabaUniversityLogo({ className = '' }) {
  return (
    <svg viewBox="0 0 200 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 6L4 18h32L20 6z" fill="#2563EB" />
      <rect x="8" y="18" width="6" height="14" fill="#2563EB" />
      <rect x="17" y="18" width="6" height="14" fill="#2563EB" />
      <rect x="26" y="18" width="6" height="14" fill="#2563EB" />
      <rect x="4" y="32" width="32" height="3" rx="1" fill="#2563EB" />
      <text x="44" y="18" fontFamily="system-ui, sans-serif" fontSize="9" fontWeight="700" fill="#2563EB">
        ADDIS ABABA
      </text>
      <text x="44" y="30" fontFamily="system-ui, sans-serif" fontSize="9" fontWeight="400" fill="#3B82F6">
        UNIVERSITY
      </text>
    </svg>
  );
}

export function SafewayLogo({ className = '' }) {
  return (
    <svg viewBox="0 0 130 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="16" fill="#0891B2" />
      <path d="M12 20l4 4 8-8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <text x="44" y="26" fontFamily="system-ui, sans-serif" fontSize="16" fontWeight="800" fill="#0891B2">
        SAFEWAY
      </text>
    </svg>
  );
}

/* Export all logos with metadata */
export const LOGO_COMPONENTS = [
  { Component: TechEthiopiaLogo, name: 'TechEthiopia' },
  { Component: BankOfAbyssiniaLogo, name: 'Bank of Abyssinia' },
  { Component: DashenBankLogo, name: 'Dashen Bank' },
  { Component: EthioTelecomLogo, name: 'Ethio Telecom' },
  { Component: SafaricomLogo, name: 'Safaricom' },
  { Component: HabeshaBreweriesLogo, name: 'Habesha Breweries' },
  { Component: AddisAbabaUniversityLogo, name: 'Addis Ababa University' },
  { Component: SafewayLogo, name: 'Safeway' },
];
