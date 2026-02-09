// ═══════════════════════════════════════════════════════════════
// PREMIUM 3D SVG ICON LIBRARY — Mexa DEX
// Multi-layer gradients, inner glow, depth shadows, reflections
// ═══════════════════════════════════════════════════════════════

interface IconProps {
  className?: string
  size?: number
}

function I({ className, size, children, vb = '0 0 24 24' }: IconProps & { children: React.ReactNode; vb?: string }) {
  return (
    <svg className={className} width={size || 24} height={size || 24} viewBox={vb} fill="none" xmlns="http://www.w3.org/2000/svg">
      {children}
    </svg>
  )
}

// ═══════════════════════════════════════════════════════════════
// SWAP / ARROWS
// ═══════════════════════════════════════════════════════════════

export function ArrowLeftRight({ className, size }: IconProps) {
  return (
    <I className={className} size={size}>
      <defs>
        <linearGradient id="alr1" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor="#c084fc" /><stop offset="1" stopColor="#7c3aed" />
        </linearGradient>
        <linearGradient id="alr2" x1="24" y1="0" x2="0" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor="#e879f9" /><stop offset="1" stopColor="#a855f7" />
        </linearGradient>
        <filter id="alrG"><feGaussianBlur stdDeviation="0.5" /></filter>
      </defs>
      <rect x="2" y="4" width="20" height="16" rx="4" fill="url(#alr1)" fillOpacity="0.12"/>
      <path d="M8 3L4 7l4 4" stroke="url(#alr2)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M4 7h16" stroke="url(#alr2)" strokeWidth="2.2" strokeLinecap="round"/>
      <path d="M16 21l4-4-4-4" stroke="url(#alr1)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M20 17H4" stroke="url(#alr1)" strokeWidth="2.2" strokeLinecap="round"/>
      <circle cx="4" cy="7" r="1.5" fill="#e879f9" fillOpacity="0.5" filter="url(#alrG)"/>
      <circle cx="20" cy="17" r="1.5" fill="#c084fc" fillOpacity="0.5" filter="url(#alrG)"/>
    </I>
  )
}

export function ArrowDownUp({ className, size }: IconProps) {
  return (
    <I className={className} size={size}>
      <defs>
        <linearGradient id="adu1" x1="6" y1="2" x2="18" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#c084fc" /><stop offset="1" stopColor="#7c3aed" />
        </linearGradient>
        <filter id="aduG"><feGaussianBlur stdDeviation="0.6" /></filter>
      </defs>
      <rect x="4" y="2" width="16" height="20" rx="4" fill="url(#adu1)" fillOpacity="0.08"/>
      <path d="M7 8l5-5 5 5" stroke="url(#adu1)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 3v18" stroke="url(#adu1)" strokeWidth="1.5" strokeLinecap="round" opacity="0.3"/>
      <path d="M17 16l-5 5-5-5" stroke="url(#adu1)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="12" cy="3" r="1.5" fill="#e879f9" fillOpacity="0.5" filter="url(#aduG)"/>
      <circle cx="12" cy="21" r="1.5" fill="#a855f7" fillOpacity="0.5" filter="url(#aduG)"/>
    </I>
  )
}

export function ArrowRight({ className, size }: IconProps) {
  return (
    <I className={className} size={size}>
      <defs>
        <linearGradient id="ar1" x1="2" y1="12" x2="22" y2="12" gradientUnits="userSpaceOnUse">
          <stop stopColor="#a855f7" /><stop offset="1" stopColor="#ec4899" />
        </linearGradient>
        <filter id="arG"><feGaussianBlur stdDeviation="0.8" /></filter>
      </defs>
      <path d="M5 12h14" stroke="url(#ar1)" strokeWidth="2.2" strokeLinecap="round"/>
      <path d="M13 5l7 7-7 7" stroke="url(#ar1)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="20" cy="12" r="2" fill="#ec4899" fillOpacity="0.4" filter="url(#arG)"/>
    </I>
  )
}

export function ArrowLeft({ className, size }: IconProps) {
  return (
    <I className={className} size={size}>
      <path d="M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M11 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </I>
  )
}

export function ArrowUpRight({ className, size }: IconProps) {
  return (
    <I className={className} size={size}>
      <defs>
        <linearGradient id="aur1" x1="7" y1="17" x2="17" y2="7" gradientUnits="userSpaceOnUse">
          <stop stopColor="#22c55e" /><stop offset="1" stopColor="#10b981" />
        </linearGradient>
      </defs>
      <path d="M7 17L17 7" stroke="url(#aur1)" strokeWidth="2.2" strokeLinecap="round"/>
      <path d="M7 7h10v10" stroke="url(#aur1)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
    </I>
  )
}

// ═══════════════════════════════════════════════════════════════
// CHEVRONS / NAVIGATION
// ═══════════════════════════════════════════════════════════════

export function ChevronDown({ className, size }: IconProps) {
  return (
    <I className={className} size={size}>
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
    </I>
  )
}

export function ChevronUp({ className, size }: IconProps) {
  return (
    <I className={className} size={size}>
      <path d="M18 15l-6-6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
    </I>
  )
}

export function X({ className, size }: IconProps) {
  return (
    <I className={className} size={size}>
      <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
    </I>
  )
}

export function Menu({ className, size }: IconProps) {
  return (
    <I className={className} size={size}>
      <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
    </I>
  )
}

// ═══════════════════════════════════════════════════════════════
// DROPLETS / LIQUIDITY — 3D water drop with inner shine
// ═══════════════════════════════════════════════════════════════

export function Droplets({ className, size }: IconProps) {
  return (
    <I className={className} size={size}>
      <defs>
        <radialGradient id="drp1" cx="0.35" cy="0.35" r="0.65">
          <stop stopColor="#67e8f9" /><stop offset="1" stopColor="#0891b2" />
        </radialGradient>
        <radialGradient id="drp2" cx="0.3" cy="0.25" r="0.5">
          <stop stopColor="#ffffff" stopOpacity="0.6" /><stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <filter id="drpS"><feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#06b6d4" floodOpacity="0.4"/></filter>
      </defs>
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" fill="url(#drp1)" fillOpacity="0.25" stroke="url(#drp1)" strokeWidth="1.5" filter="url(#drpS)"/>
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" fill="url(#drp2)" fillOpacity="0.3"/>
      <ellipse cx="9.5" cy="10" rx="2.5" ry="1.8" fill="white" fillOpacity="0.15" transform="rotate(-20 9.5 10)"/>
    </I>
  )
}

// ═══════════════════════════════════════════════════════════════
// SPROUT / FARM — 3D plant with glow
// ═══════════════════════════════════════════════════════════════

export function Sprout({ className, size }: IconProps) {
  return (
    <I className={className} size={size}>
      <defs>
        <linearGradient id="spr1" x1="4" y1="2" x2="20" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4ade80" /><stop offset="1" stopColor="#16a34a" />
        </linearGradient>
        <radialGradient id="spr2" cx="0.3" cy="0.3" r="0.7">
          <stop stopColor="#86efac" /><stop offset="1" stopColor="#22c55e" />
        </radialGradient>
        <filter id="sprG"><feDropShadow dx="0" dy="1" stdDeviation="1.2" floodColor="#22c55e" floodOpacity="0.35"/></filter>
      </defs>
      <path d="M7 20h10" stroke="url(#spr1)" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M12 20v-8" stroke="url(#spr1)" strokeWidth="2" strokeLinecap="round"/>
      <path d="M12 12C12 8 8 6 4 6c0 4 2 8 8 8z" fill="url(#spr2)" fillOpacity="0.3" stroke="url(#spr1)" strokeWidth="1.5" filter="url(#sprG)"/>
      <path d="M12 8c0-4 4-6 8-6 0 4-2 8-8 8z" fill="url(#spr2)" fillOpacity="0.2" stroke="url(#spr1)" strokeWidth="1.5"/>
      <path d="M6.5 8.5c1.5 0.5 3 1.5 4 3" stroke="white" strokeWidth="0.8" strokeLinecap="round" opacity="0.3"/>
    </I>
  )
}

// ═══════════════════════════════════════════════════════════════
// LOCK / UNLOCK — 3D padlock with metallic shine
// ═══════════════════════════════════════════════════════════════

export function Lock({ className, size }: IconProps) {
  return (
    <I className={className} size={size}>
      <defs>
        <linearGradient id="lk1" x1="5" y1="10" x2="19" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#c084fc" /><stop offset="1" stopColor="#7c3aed" />
        </linearGradient>
        <linearGradient id="lk2" x1="8" y1="4" x2="16" y2="11" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ddd6fe" /><stop offset="1" stopColor="#8b5cf6" />
        </linearGradient>
        <radialGradient id="lk3" cx="0.35" cy="0.3" r="0.6">
          <stop stopColor="#ffffff" stopOpacity="0.25" /><stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <filter id="lkS"><feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#7c3aed" floodOpacity="0.4"/></filter>
      </defs>
      <rect x="5" y="11" width="14" height="10" rx="2.5" fill="url(#lk1)" fillOpacity="0.25" stroke="url(#lk1)" strokeWidth="1.5" filter="url(#lkS)"/>
      <rect x="5" y="11" width="14" height="10" rx="2.5" fill="url(#lk3)"/>
      <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="url(#lk2)" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="12" cy="16" r="1.8" fill="url(#lk1)"/>
      <ellipse cx="12" cy="15.5" rx="0.8" ry="0.5" fill="white" fillOpacity="0.4"/>
    </I>
  )
}

export function Unlock({ className, size }: IconProps) {
  return (
    <I className={className} size={size}>
      <defs>
        <linearGradient id="ul1" x1="5" y1="10" x2="19" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4ade80" /><stop offset="1" stopColor="#16a34a" />
        </linearGradient>
        <filter id="ulS"><feDropShadow dx="0" dy="1.5" stdDeviation="1.2" floodColor="#22c55e" floodOpacity="0.35"/></filter>
      </defs>
      <rect x="5" y="11" width="14" height="10" rx="2.5" fill="url(#ul1)" fillOpacity="0.2" stroke="url(#ul1)" strokeWidth="1.5" filter="url(#ulS)"/>
      <path d="M8 11V7a4 4 0 0 1 7.83-1" stroke="url(#ul1)" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="12" cy="16" r="1.5" fill="url(#ul1)"/>
    </I>
  )
}

// ═══════════════════════════════════════════════════════════════
// ROCKET — 3D rocket with flame glow
// ═══════════════════════════════════════════════════════════════

export function Rocket({ className, size }: IconProps) {
  return (
    <I className={className} size={size}>
      <defs>
        <linearGradient id="rk1" x1="6" y1="2" x2="18" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fb923c" /><stop offset="1" stopColor="#dc2626" />
        </linearGradient>
        <radialGradient id="rk2" cx="0.5" cy="0.8" r="0.5">
          <stop stopColor="#fbbf24" /><stop offset="1" stopColor="#f97316" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="rk3" cx="0.35" cy="0.25" r="0.5">
          <stop stopColor="#ffffff" stopOpacity="0.3" /><stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <filter id="rkF"><feGaussianBlur stdDeviation="1.5" /></filter>
        <filter id="rkS"><feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#f97316" floodOpacity="0.4"/></filter>
      </defs>
      {/* Flame glow */}
      <ellipse cx="7" cy="19" rx="3" ry="4" fill="url(#rk2)" filter="url(#rkF)" opacity="0.7"/>
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" fill="url(#rk1)" fillOpacity="0.3" stroke="url(#rk1)" strokeWidth="1.5"/>
      <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" fill="url(#rk1)" fillOpacity="0.2" stroke="url(#rk1)" strokeWidth="1.5" filter="url(#rkS)"/>
      <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" fill="url(#rk3)"/>
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" stroke="url(#rk1)" strokeWidth="1.5"/>
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" stroke="url(#rk1)" strokeWidth="1.5"/>
      <circle cx="17" cy="7" r="1.5" fill="white" fillOpacity="0.3"/>
    </I>
  )
}

// ═══════════════════════════════════════════════════════════════
// BARCHART — 3D bars with depth
// ═══════════════════════════════════════════════════════════════

export function BarChart3({ className, size }: IconProps) {
  return (
    <I className={className} size={size}>
      <defs>
        <linearGradient id="bc1" x1="7" y1="20" x2="7" y2="13" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6366f1" /><stop offset="1" stopColor="#818cf8" />
        </linearGradient>
        <linearGradient id="bc2" x1="12" y1="20" x2="12" y2="8" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7c3aed" /><stop offset="1" stopColor="#a78bfa" />
        </linearGradient>
        <linearGradient id="bc3" x1="17" y1="20" x2="17" y2="4" gradientUnits="userSpaceOnUse">
          <stop stopColor="#a855f7" /><stop offset="1" stopColor="#c084fc" />
        </linearGradient>
        <filter id="bcS"><feDropShadow dx="0" dy="1" stdDeviation="0.8" floodColor="#7c3aed" floodOpacity="0.3"/></filter>
      </defs>
      <path d="M3 3v18h18" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
      <rect x="5.5" y="13" width="3" height="7" rx="1" fill="url(#bc1)" filter="url(#bcS)"/>
      <rect x="6" y="13.5" width="1.2" height="6" rx="0.5" fill="white" fillOpacity="0.15"/>
      <rect x="10.5" y="8" width="3" height="12" rx="1" fill="url(#bc2)" filter="url(#bcS)"/>
      <rect x="11" y="8.5" width="1.2" height="11" rx="0.5" fill="white" fillOpacity="0.15"/>
      <rect x="15.5" y="4" width="3" height="16" rx="1" fill="url(#bc3)" filter="url(#bcS)"/>
      <rect x="16" y="4.5" width="1.2" height="15" rx="0.5" fill="white" fillOpacity="0.15"/>
    </I>
  )
}

export function BarChart2({ className, size }: IconProps) {
  return <BarChart3 className={className} size={size} />
}

// ═══════════════════════════════════════════════════════════════
// COINS — 3D stacked coins with metallic shine
// ═══════════════════════════════════════════════════════════════

export function Coins({ className, size }: IconProps) {
  return (
    <I className={className} size={size}>
      <defs>
        <radialGradient id="cn1" cx="0.35" cy="0.3" r="0.65">
          <stop stopColor="#fde68a" /><stop offset="1" stopColor="#f59e0b" />
        </radialGradient>
        <radialGradient id="cn2" cx="0.4" cy="0.35" r="0.6">
          <stop stopColor="#fcd34d" /><stop offset="1" stopColor="#d97706" />
        </radialGradient>
        <filter id="cnS"><feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#f59e0b" floodOpacity="0.35"/></filter>
      </defs>
      <circle cx="9" cy="9" r="7" fill="url(#cn1)" fillOpacity="0.2" stroke="url(#cn1)" strokeWidth="1.5" filter="url(#cnS)"/>
      <ellipse cx="7.5" cy="7.5" rx="2.5" ry="1.8" fill="white" fillOpacity="0.12" transform="rotate(-15 7.5 7.5)"/>
      <circle cx="15" cy="15" r="7" fill="url(#cn2)" fillOpacity="0.25" stroke="url(#cn2)" strokeWidth="1.5"/>
      <ellipse cx="13.5" cy="13.5" rx="2.5" ry="1.8" fill="white" fillOpacity="0.12" transform="rotate(-15 13.5 13.5)"/>
      <text x="9" y="11" textAnchor="middle" fill="url(#cn1)" fontSize="6" fontWeight="bold" opacity="0.6">$</text>
      <text x="15" y="17" textAnchor="middle" fill="url(#cn2)" fontSize="6" fontWeight="bold" opacity="0.6">$</text>
    </I>
  )
}

// ═══════════════════════════════════════════════════════════════
// SPARKLES — 3D star burst with glow
// ═══════════════════════════════════════════════════════════════

export function Sparkles({ className, size }: IconProps) {
  return (
    <I className={className} size={size}>
      <defs>
        <linearGradient id="sp1" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f472b6" /><stop offset="0.5" stopColor="#c084fc" /><stop offset="1" stopColor="#818cf8" />
        </linearGradient>
        <radialGradient id="sp2" cx="0.5" cy="0.5" r="0.5">
          <stop stopColor="#f9a8d4" stopOpacity="0.8" /><stop offset="1" stopColor="#f9a8d4" stopOpacity="0" />
        </radialGradient>
        <filter id="spG"><feGaussianBlur stdDeviation="1.2" /></filter>
        <filter id="spS"><feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#a855f7" floodOpacity="0.4"/></filter>
      </defs>
      {/* Center glow */}
      <circle cx="12" cy="12" r="5" fill="url(#sp2)" filter="url(#spG)"/>
      <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z" fill="url(#sp1)" fillOpacity="0.2" stroke="url(#sp1)" strokeWidth="1.5" strokeLinejoin="round" filter="url(#spS)"/>
      {/* Highlight */}
      <path d="M12 5l1 3.5L16.5 10" stroke="white" strokeWidth="0.6" strokeLinecap="round" opacity="0.35"/>
      <circle cx="19" cy="5" r="1.8" fill="url(#sp1)" fillOpacity="0.5"/>
      <circle cx="19" cy="5" r="1" fill="white" fillOpacity="0.2"/>
      <circle cx="5" cy="19" r="1.2" fill="url(#sp1)" fillOpacity="0.4"/>
    </I>
  )
}

// ═══════════════════════════════════════════════════════════════
// ZAP / LIGHTNING — 3D bolt with electric glow
// ═══════════════════════════════════════════════════════════════

export function Zap({ className, size }: IconProps) {
  return (
    <I className={className} size={size}>
      <defs>
        <linearGradient id="zp1" x1="8" y1="2" x2="16" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fde047" /><stop offset="1" stopColor="#f59e0b" />
        </linearGradient>
        <radialGradient id="zp2" cx="0.5" cy="0.4" r="0.5">
          <stop stopColor="#fef08a" stopOpacity="0.6" /><stop offset="1" stopColor="#fef08a" stopOpacity="0" />
        </radialGradient>
        <filter id="zpG"><feGaussianBlur stdDeviation="2" /></filter>
        <filter id="zpS"><feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#eab308" floodOpacity="0.5"/></filter>
      </defs>
      {/* Electric glow behind */}
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="url(#zp2)" filter="url(#zpG)"/>
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="url(#zp1)" fillOpacity="0.3" stroke="url(#zp1)" strokeWidth="1.5" strokeLinejoin="round" filter="url(#zpS)"/>
      {/* Highlight edge */}
      <path d="M12.5 3L5 12h6" stroke="white" strokeWidth="0.7" strokeLinecap="round" opacity="0.3"/>
    </I>
  )
}

// ═══════════════════════════════════════════════════════════════
// SHIELD — 3D shield with checkmark
// ═══════════════════════════════════════════════════════════════

export function Shield({ className, size }: IconProps) {
  return (
    <I className={className} size={size}>
      <defs>
        <linearGradient id="sh1" x1="4" y1="2" x2="20" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4ade80" /><stop offset="1" stopColor="#059669" />
        </linearGradient>
        <radialGradient id="sh2" cx="0.35" cy="0.25" r="0.6">
          <stop stopColor="#ffffff" stopOpacity="0.25" /><stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <filter id="shS"><feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#22c55e" floodOpacity="0.4"/></filter>
      </defs>
      <path d="M12 2l8 4v6c0 5.25-3.5 9.74-8 11-4.5-1.26-8-5.75-8-11V6l8-4z" fill="url(#sh1)" fillOpacity="0.2" stroke="url(#sh1)" strokeWidth="1.5" filter="url(#shS)"/>
      <path d="M12 2l8 4v6c0 5.25-3.5 9.74-8 11-4.5-1.26-8-5.75-8-11V6l8-4z" fill="url(#sh2)"/>
      <path d="M9 12l2 2 4-4" stroke="url(#sh1)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
    </I>
  )
}

// ═══════════════════════════════════════════════════════════════
// GLOBE — 3D sphere with grid
// ═══════════════════════════════════════════════════════════════

export function Globe({ className, size }: IconProps) {
  return (
    <I className={className} size={size}>
      <defs>
        <radialGradient id="gl1" cx="0.35" cy="0.3" r="0.65">
          <stop stopColor="#67e8f9" /><stop offset="1" stopColor="#0e7490" />
        </radialGradient>
        <radialGradient id="gl2" cx="0.3" cy="0.25" r="0.4">
          <stop stopColor="#ffffff" stopOpacity="0.3" /><stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <filter id="glS"><feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#06b6d4" floodOpacity="0.35"/></filter>
      </defs>
      <circle cx="12" cy="12" r="10" fill="url(#gl1)" fillOpacity="0.15" stroke="url(#gl1)" strokeWidth="1.5" filter="url(#glS)"/>
      <circle cx="12" cy="12" r="10" fill="url(#gl2)"/>
      <ellipse cx="12" cy="12" rx="4" ry="10" stroke="url(#gl1)" strokeWidth="0.8" opacity="0.4"/>
      <path d="M2 12h20" stroke="url(#gl1)" strokeWidth="0.8" opacity="0.4"/>
      <path d="M4.5 7h15M4.5 17h15" stroke="url(#gl1)" strokeWidth="0.5" opacity="0.25"/>
    </I>
  )
}

// ═══════════════════════════════════════════════════════════════
// TRENDING UP / DOWN — with glow trail
// ═══════════════════════════════════════════════════════════════

export function TrendingUp({ className, size }: IconProps) {
  return (
    <I className={className} size={size}>
      <defs>
        <linearGradient id="tu1" x1="2" y1="17" x2="22" y2="7" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4ade80" /><stop offset="1" stopColor="#22d3ee" />
        </linearGradient>
        <filter id="tuG"><feGaussianBlur stdDeviation="1.5" /></filter>
        <filter id="tuS"><feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#22c55e" floodOpacity="0.3"/></filter>
      </defs>
      {/* Glow trail */}
      <path d="M22 7l-8.5 8.5-5-5L2 17" stroke="url(#tu1)" strokeWidth="4" filter="url(#tuG)" opacity="0.3"/>
      <path d="M22 7l-8.5 8.5-5-5L2 17" stroke="url(#tu1)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" filter="url(#tuS)"/>
      <path d="M16 7h6v6" stroke="url(#tu1)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="22" cy="7" r="2" fill="#4ade80" fillOpacity="0.4" filter="url(#tuG)"/>
    </I>
  )
}

export function TrendingDown({ className, size }: IconProps) {
  return (
    <I className={className} size={size}>
      <defs>
        <linearGradient id="td1" x1="2" y1="7" x2="22" y2="17" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f87171" /><stop offset="1" stopColor="#dc2626" />
        </linearGradient>
        <filter id="tdS"><feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#ef4444" floodOpacity="0.3"/></filter>
      </defs>
      <path d="M22 17l-8.5-8.5-5 5L2 7" stroke="url(#td1)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" filter="url(#tdS)"/>
      <path d="M16 17h6v-6" stroke="url(#td1)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
    </I>
  )
}

// ═══════════════════════════════════════════════════════════════
// LAYERS — 3D stacked layers
// ═══════════════════════════════════════════════════════════════

export function Layers({ className, size }: IconProps) {
  return (
    <I className={className} size={size}>
      <defs>
        <linearGradient id="ly1" x1="2" y1="4" x2="22" y2="20" gradientUnits="userSpaceOnUse">
          <stop stopColor="#38bdf8" /><stop offset="1" stopColor="#6366f1" />
        </linearGradient>
        <filter id="lyS"><feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#3b82f6" floodOpacity="0.3"/></filter>
      </defs>
      <path d="M12 2L2 7l10 5 10-5-10-5z" fill="url(#ly1)" fillOpacity="0.25" stroke="url(#ly1)" strokeWidth="1.5" strokeLinejoin="round" filter="url(#lyS)"/>
      <path d="M2 17l10 5 10-5" stroke="url(#ly1)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M2 12l10 5 10-5" stroke="url(#ly1)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
      <path d="M5 8.5l7 3.5" stroke="white" strokeWidth="0.6" strokeLinecap="round" opacity="0.2"/>
    </I>
  )
}

// ═══════════════════════════════════════════════════════════════
// WALLET — 3D wallet with card slot
// ═══════════════════════════════════════════════════════════════

export function Wallet({ className, size }: IconProps) {
  return (
    <I className={className} size={size}>
      <defs>
        <linearGradient id="wl1" x1="2" y1="4" x2="22" y2="20" gradientUnits="userSpaceOnUse">
          <stop stopColor="#c084fc" /><stop offset="1" stopColor="#6366f1" />
        </linearGradient>
        <radialGradient id="wl2" cx="0.3" cy="0.25" r="0.5">
          <stop stopColor="#ffffff" stopOpacity="0.2" /><stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <filter id="wlS"><feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#7c3aed" floodOpacity="0.35"/></filter>
      </defs>
      <rect x="2" y="6" width="20" height="14" rx="3" fill="url(#wl1)" fillOpacity="0.2" stroke="url(#wl1)" strokeWidth="1.5" filter="url(#wlS)"/>
      <rect x="2" y="6" width="20" height="14" rx="3" fill="url(#wl2)"/>
      <path d="M2 10h20" stroke="url(#wl1)" strokeWidth="1" opacity="0.4"/>
      <rect x="15" y="13" width="5" height="4" rx="1.5" fill="url(#wl1)" fillOpacity="0.3" stroke="url(#wl1)" strokeWidth="1"/>
      <circle cx="17.5" cy="15" r="1" fill="url(#wl1)"/>
      <ellipse cx="17.5" cy="14.5" rx="0.5" ry="0.3" fill="white" fillOpacity="0.3"/>
    </I>
  )
}

// ═══════════════════════════════════════════════════════════════
// GIFT — 3D gift box with ribbon
// ═══════════════════════════════════════════════════════════════

export function Gift({ className, size }: IconProps) {
  return (
    <I className={className} size={size}>
      <defs>
        <linearGradient id="gf1" x1="3" y1="4" x2="21" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f472b6" /><stop offset="1" stopColor="#a855f7" />
        </linearGradient>
        <radialGradient id="gf2" cx="0.3" cy="0.2" r="0.5">
          <stop stopColor="#ffffff" stopOpacity="0.2" /><stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <filter id="gfS"><feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#ec4899" floodOpacity="0.35"/></filter>
      </defs>
      <rect x="3" y="8" width="18" height="4" rx="1.5" fill="url(#gf1)" fillOpacity="0.3" stroke="url(#gf1)" strokeWidth="1.5" filter="url(#gfS)"/>
      <rect x="5" y="12" width="14" height="9" rx="1.5" fill="url(#gf1)" fillOpacity="0.15" stroke="url(#gf1)" strokeWidth="1.5"/>
      <rect x="3" y="8" width="18" height="4" rx="1.5" fill="url(#gf2)"/>
      <path d="M12 8v13" stroke="url(#gf1)" strokeWidth="1.5"/>
      <path d="M7.5 8a2.5 2.5 0 0 1 0-5C9 3 12 6 12 8" stroke="url(#gf1)" strokeWidth="1.5" fill="none"/>
      <path d="M16.5 8a2.5 2.5 0 0 0 0-5C15 3 12 6 12 8" stroke="url(#gf1)" strokeWidth="1.5" fill="none"/>
    </I>
  )
}

// ═══════════════════════════════════════════════════════════════
// UTILITY ICONS — Clean with subtle depth
// ═══════════════════════════════════════════════════════════════

export function MoreHorizontal({ className, size }: IconProps) {
  return (
    <I className={className} size={size}>
      <circle cx="5" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="19" cy="12" r="1.5" fill="currentColor"/>
    </I>
  )
}

export function LogOut({ className, size }: IconProps) {
  return (
    <I className={className} size={size}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </I>
  )
}

export function FileText({ className, size }: IconProps) {
  return (
    <I className={className} size={size}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <path d="M14 2v6h6" stroke="currentColor" strokeWidth="1.5"/><path d="M8 13h8M8 17h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </I>
  )
}

export function Search({ className, size }: IconProps) {
  return (
    <I className={className} size={size}>
      <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" fill="none"/>
      <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </I>
  )
}

export function ExternalLink({ className, size }: IconProps) {
  return (
    <I className={className} size={size}>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M15 3h6v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10 14L21 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </I>
  )
}

export function Copy({ className, size }: IconProps) {
  return (
    <I className={className} size={size}>
      <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" strokeWidth="2"/>
    </I>
  )
}

export function Check({ className, size }: IconProps) {
  return (
    <I className={className} size={size}>
      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </I>
  )
}

export function RefreshCw({ className, size }: IconProps) {
  return (
    <I className={className} size={size}>
      <path d="M23 4v6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M1 20v-6h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </I>
  )
}

export function Info({ className, size }: IconProps) {
  return (
    <I className={className} size={size}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <path d="M12 16v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="12" cy="8" r="0.8" fill="currentColor"/>
    </I>
  )
}

export function Clock({ className, size }: IconProps) {
  return (
    <I className={className} size={size}>
      <defs>
        <linearGradient id="clk1" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#94a3b8" /><stop offset="1" stopColor="#64748b" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="10" fill="url(#clk1)" fillOpacity="0.08" stroke="url(#clk1)" strokeWidth="1.5"/>
      <path d="M12 6v6l4 2" stroke="url(#clk1)" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="12" cy="12" r="1.2" fill="url(#clk1)"/>
    </I>
  )
}

export function Settings({ className, size }: IconProps) {
  return (
    <I className={className} size={size}>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    </I>
  )
}

export function Loader2({ className, size }: IconProps) {
  return (
    <I className={className} size={size}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    </I>
  )
}

// ═══════════════════════════════════════════════════════════════
// ALERT / WARNING — 3D triangle with glow
// ═══════════════════════════════════════════════════════════════

export function AlertTriangle({ className, size }: IconProps) {
  return (
    <I className={className} size={size}>
      <defs>
        <linearGradient id="at1" x1="2" y1="20" x2="22" y2="4" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fbbf24" /><stop offset="1" stopColor="#f97316" />
        </linearGradient>
        <filter id="atS"><feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#f59e0b" floodOpacity="0.4"/></filter>
      </defs>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" fill="url(#at1)" fillOpacity="0.2" stroke="url(#at1)" strokeWidth="1.5" filter="url(#atS)"/>
      <path d="M12 9v4" stroke="url(#at1)" strokeWidth="2.2" strokeLinecap="round"/>
      <circle cx="12" cy="17" r="0.8" fill="url(#at1)"/>
    </I>
  )
}

export function AlertCircle({ className, size }: IconProps) {
  return (
    <I className={className} size={size}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <path d="M12 8v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="12" cy="16" r="0.8" fill="currentColor"/>
    </I>
  )
}

// ═══════════════════════════════════════════════════════════════
// CHECKCIRCLE — 3D success badge
// ═══════════════════════════════════════════════════════════════

export function CheckCircle({ className, size }: IconProps) {
  return (
    <I className={className} size={size}>
      <defs>
        <radialGradient id="cc1" cx="0.35" cy="0.3" r="0.65">
          <stop stopColor="#86efac" /><stop offset="1" stopColor="#16a34a" />
        </radialGradient>
        <filter id="ccS"><feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#22c55e" floodOpacity="0.4"/></filter>
      </defs>
      <circle cx="12" cy="12" r="10" fill="url(#cc1)" fillOpacity="0.15" stroke="url(#cc1)" strokeWidth="1.5" filter="url(#ccS)"/>
      <path d="M9 12l2 2 4-4" stroke="url(#cc1)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <ellipse cx="9" cy="9" rx="3" ry="2" fill="white" fillOpacity="0.1" transform="rotate(-20 9 9)"/>
    </I>
  )
}

// ═══════════════════════════════════════════════════════════════
// STAR — 3D golden star
// ═══════════════════════════════════════════════════════════════

export function Star({ className, size }: IconProps) {
  return (
    <I className={className} size={size}>
      <defs>
        <linearGradient id="st1" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fde68a" /><stop offset="1" stopColor="#f59e0b" />
        </linearGradient>
        <filter id="stS"><feDropShadow dx="0" dy="1" stdDeviation="1.2" floodColor="#f59e0b" floodOpacity="0.4"/></filter>
      </defs>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="url(#st1)" fillOpacity="0.25" stroke="url(#st1)" strokeWidth="1.5" strokeLinejoin="round" filter="url(#stS)"/>
      <path d="M10 5l2-3" stroke="white" strokeWidth="0.6" strokeLinecap="round" opacity="0.3"/>
    </I>
  )
}

// ═══════════════════════════════════════════════════════════════
// PLUS / MINUS / EYE
// ═══════════════════════════════════════════════════════════════

export function Plus({ className, size }: IconProps) {
  return (
    <I className={className} size={size}>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
    </I>
  )
}

export function Minus({ className, size }: IconProps) {
  return (
    <I className={className} size={size}>
      <path d="M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
    </I>
  )
}

export function Eye({ className, size }: IconProps) {
  return (
    <I className={className} size={size}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <circle cx="12" cy="12" r="1" fill="currentColor"/>
    </I>
  )
}

// ═══════════════════════════════════════════════════════════════
// USERS / ACTIVITY / BOX / FILECODE
// ═══════════════════════════════════════════════════════════════

export function Users({ className, size }: IconProps) {
  return (
    <I className={className} size={size}>
      <defs>
        <linearGradient id="us1" x1="1" y1="7" x2="23" y2="21" gradientUnits="userSpaceOnUse">
          <stop stopColor="#a78bfa" /><stop offset="1" stopColor="#6366f1" />
        </linearGradient>
      </defs>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="url(#us1)" strokeWidth="1.5" fill="none"/>
      <circle cx="9" cy="7" r="4" fill="url(#us1)" fillOpacity="0.12" stroke="url(#us1)" strokeWidth="1.5"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="url(#us1)" strokeWidth="1.5"/>
      <circle cx="16" cy="4" r="3" stroke="url(#us1)" strokeWidth="1" opacity="0.5" fill="none"/>
    </I>
  )
}

export function Activity({ className, size }: IconProps) {
  return (
    <I className={className} size={size}>
      <defs>
        <linearGradient id="ac1" x1="2" y1="12" x2="22" y2="12" gradientUnits="userSpaceOnUse">
          <stop stopColor="#22c55e" /><stop offset="0.5" stopColor="#f59e0b" /><stop offset="1" stopColor="#ef4444" />
        </linearGradient>
      </defs>
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke="url(#ac1)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
    </I>
  )
}

export function Box({ className, size }: IconProps) {
  return (
    <I className={className} size={size}>
      <defs>
        <linearGradient id="bx1" x1="3" y1="3" x2="21" y2="21" gradientUnits="userSpaceOnUse">
          <stop stopColor="#818cf8" /><stop offset="1" stopColor="#6366f1" />
        </linearGradient>
      </defs>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" fill="url(#bx1)" fillOpacity="0.1" stroke="url(#bx1)" strokeWidth="1.5"/>
      <path d="M3.27 6.96L12 12.01l8.73-5.05" stroke="url(#bx1)" strokeWidth="1.5" opacity="0.6"/>
      <path d="M12 22.08V12" stroke="url(#bx1)" strokeWidth="1.5"/>
    </I>
  )
}

export function FileCode({ className, size }: IconProps) {
  return (
    <I className={className} size={size}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <path d="M14 2v6h6" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M10 13l-2 2 2 2M14 13l2 2-2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </I>
  )
}

// ═══════════════════════════════════════════════════════════════
// CALCULATOR / DOLLAR
// ═══════════════════════════════════════════════════════════════

export function Calculator({ className, size }: IconProps) {
  return (
    <I className={className} size={size}>
      <defs>
        <linearGradient id="cal1" x1="4" y1="2" x2="20" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#a78bfa" /><stop offset="1" stopColor="#6366f1" />
        </linearGradient>
      </defs>
      <rect x="4" y="2" width="16" height="20" rx="2.5" fill="url(#cal1)" fillOpacity="0.1" stroke="url(#cal1)" strokeWidth="1.5"/>
      <rect x="7" y="5" width="10" height="5" rx="1.5" fill="url(#cal1)" fillOpacity="0.15" stroke="url(#cal1)" strokeWidth="1"/>
      <circle cx="8" cy="14" r="1" fill="url(#cal1)" fillOpacity="0.6"/>
      <circle cx="12" cy="14" r="1" fill="url(#cal1)" fillOpacity="0.6"/>
      <circle cx="16" cy="14" r="1" fill="url(#cal1)" fillOpacity="0.6"/>
      <circle cx="8" cy="18" r="1" fill="url(#cal1)" fillOpacity="0.6"/>
      <circle cx="12" cy="18" r="1" fill="url(#cal1)" fillOpacity="0.6"/>
      <circle cx="16" cy="18" r="1" fill="url(#cal1)" fillOpacity="0.6"/>
    </I>
  )
}

export function DollarSign({ className, size }: IconProps) {
  return (
    <I className={className} size={size}>
      <defs>
        <linearGradient id="dl1" x1="6" y1="1" x2="18" y2="23" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4ade80" /><stop offset="1" stopColor="#16a34a" />
        </linearGradient>
      </defs>
      <path d="M12 1v22" stroke="url(#dl1)" strokeWidth="2" strokeLinecap="round"/>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke="url(#dl1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </I>
  )
}

// ═══════════════════════════════════════════════════════════════
// FILTER
// ═══════════════════════════════════════════════════════════════

export function Filter({ className, size }: IconProps) {
  return (
    <I className={className} size={size}>
      <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </I>
  )
}
