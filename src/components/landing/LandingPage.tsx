import { useState, useEffect, useRef, useMemo } from 'react'
import { ArrowRight, ChevronDown, Menu, X } from '../Icons3D'
import { IS_MEGAETH_TESTNET } from '../../config/chains'

interface LandingPageProps {
  onEnterApp: () => void
  onShowTerms?: () => void
  onShowPrivacy?: () => void
}

// ═══════════════════════════════════════════════════════════════
// ANIMATED COUNTER
// ═══════════════════════════════════════════════════════════════
function AnimatedCounter({ target, prefix = '', suffix = '', duration = 2000 }: {
  target: number; prefix?: string; suffix?: string; duration?: number
}) {
  const [count, setCount] = useState(0)
  const [started, setStarted] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting && !started) setStarted(true) }, { threshold: 0.5 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [started])
  useEffect(() => {
    if (!started) return
    const t0 = performance.now()
    const step = (now: number) => {
      const p = Math.min((now - t0) / duration, 1)
      setCount(Math.floor((1 - Math.pow(1 - p, 3)) * target))
      if (p < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [started, target, duration])
  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>
}

// ═══════════════════════════════════════════════════════════════
// SCROLL REVEAL
// ═══════════════════════════════════════════════════════════════
function useReveal() {
  const ref = useRef<HTMLDivElement>(null)
  const [v, setV] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setV(true); obs.disconnect() } }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return { ref, v }
}

function Reveal({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, v } = useReveal()
  return (
    <div ref={ref} className={`transition-all duration-700 ease-out ${className}`}
      style={{ opacity: v ? 1 : 0, transform: v ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.98)', transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// FLOATING PARTICLES BACKGROUND
// ═══════════════════════════════════════════════════════════════
function ParticleField() {
  const particles = useMemo(() => 
    Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 20 + 15,
      delay: Math.random() * 10,
      opacity: Math.random() * 0.3 + 0.05,
    })), [])

  return (
    <div className="absolute inset-0 overflow-hidden">
      {particles.map(p => (
        <div key={p.id} className="absolute rounded-full bg-purple-400 animate-particle"
          style={{
            left: `${p.x}%`, top: `${p.y}%`,
            width: p.size, height: p.size,
            opacity: p.opacity,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }} />
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// PREMIUM 3D PRODUCT ICONS
// ═══════════════════════════════════════════════════════════════
function SwapIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="lsi1" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#c084fc"/><stop offset="1" stopColor="#7c3aed"/>
        </linearGradient>
        <radialGradient id="lsi2" cx="0.3" cy="0.3" r="0.7">
          <stop stopColor="#e9d5ff" stopOpacity="0.4"/><stop offset="1" stopColor="#e9d5ff" stopOpacity="0"/>
        </radialGradient>
        <filter id="lsig"><feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#a855f7" floodOpacity="0.6"/></filter>
      </defs>
      <rect x="4" y="6" width="40" height="36" rx="10" fill="url(#lsi1)" fillOpacity="0.1" filter="url(#lsig)"/>
      <circle cx="24" cy="24" r="16" fill="url(#lsi2)"/>
      <path d="M15 16L10 21l5 5" stroke="url(#lsi1)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10 21h28" stroke="url(#lsi1)" strokeWidth="3" strokeLinecap="round"/>
      <path d="M33 32l5-5-5-5" stroke="#e879f9" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M38 27H10" stroke="#e879f9" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  )
}

function PoolIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="lpi1" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#22d3ee"/><stop offset="1" stopColor="#3b82f6"/>
        </linearGradient>
        <radialGradient id="lpi2" cx="0.3" cy="0.3" r="0.5">
          <stop stopColor="#ffffff" stopOpacity="0.3"/><stop offset="1" stopColor="#ffffff" stopOpacity="0"/>
        </radialGradient>
        <filter id="lpig"><feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#06b6d4" floodOpacity="0.6"/></filter>
      </defs>
      <circle cx="18" cy="20" r="13" fill="url(#lpi1)" fillOpacity="0.12" stroke="url(#lpi1)" strokeWidth="2" filter="url(#lpig)"/>
      <circle cx="18" cy="20" r="13" fill="url(#lpi2)"/>
      <circle cx="30" cy="28" r="13" fill="url(#lpi1)" fillOpacity="0.08" stroke="url(#lpi1)" strokeWidth="2"/>
      <ellipse cx="15" cy="16" rx="5" ry="3" fill="white" fillOpacity="0.1" transform="rotate(-15 15 16)"/>
    </svg>
  )
}

function StakeIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <defs>
        <radialGradient id="lsti1" cx="0.35" cy="0.3" r="0.65">
          <stop stopColor="#fde68a"/><stop offset="1" stopColor="#f59e0b"/>
        </radialGradient>
        <radialGradient id="lsti2" cx="0.3" cy="0.25" r="0.5">
          <stop stopColor="#ffffff" stopOpacity="0.35"/><stop offset="1" stopColor="#ffffff" stopOpacity="0"/>
        </radialGradient>
        <filter id="lstig"><feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#f59e0b" floodOpacity="0.6"/></filter>
      </defs>
      <circle cx="24" cy="24" r="18" fill="url(#lsti1)" fillOpacity="0.12" stroke="url(#lsti1)" strokeWidth="2" filter="url(#lstig)"/>
      <circle cx="24" cy="24" r="18" fill="url(#lsti2)"/>
      <text x="24" y="30" textAnchor="middle" fill="url(#lsti1)" fontSize="20" fontWeight="bold">Ξ</text>
      <ellipse cx="18" cy="18" rx="6" ry="4" fill="white" fillOpacity="0.08" transform="rotate(-20 18 18)"/>
    </svg>
  )
}

function GmexaIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="lgmi1" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f472b6"/><stop offset="0.5" stopColor="#c084fc"/><stop offset="1" stopColor="#818cf8"/>
        </linearGradient>
        <radialGradient id="lgmi2" cx="0.5" cy="0.5" r="0.5">
          <stop stopColor="#f9a8d4" stopOpacity="0.5"/><stop offset="1" stopColor="#f9a8d4" stopOpacity="0"/>
        </radialGradient>
        <filter id="lgmig"><feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#a855f7" floodOpacity="0.6"/></filter>
      </defs>
      <circle cx="24" cy="24" r="10" fill="url(#lgmi2)"/>
      <path d="M24 6l5 14.5L43 24l-14 3.5L24 42l-3.5-14.5L6 24l14.5-3.5z" fill="url(#lgmi1)" fillOpacity="0.15" stroke="url(#lgmi1)" strokeWidth="2" strokeLinejoin="round" filter="url(#lgmig)"/>
      <circle cx="36" cy="12" r="3" fill="url(#lgmi1)" fillOpacity="0.5"/>
      <circle cx="36" cy="12" r="1.5" fill="white" fillOpacity="0.2"/>
    </svg>
  )
}

function LaunchIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="lli1" x1="12" y1="4" x2="36" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fb923c"/><stop offset="1" stopColor="#ef4444"/>
        </linearGradient>
        <radialGradient id="lli2" cx="0.5" cy="0.9" r="0.5">
          <stop stopColor="#fbbf24"/><stop offset="1" stopColor="#f97316" stopOpacity="0"/>
        </radialGradient>
        <filter id="llig"><feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#f97316" floodOpacity="0.6"/></filter>
      </defs>
      <ellipse cx="14" cy="40" rx="6" ry="7" fill="url(#lli2)" opacity="0.5"/>
      <path d="M24 30l-6-6a40 40 0 0 1 4-8A24 24 0 0 1 42 6c0 5-1.5 14-11 21a40 40 0 0 1-7 3z" fill="url(#lli1)" fillOpacity="0.15" stroke="url(#lli1)" strokeWidth="2" filter="url(#llig)"/>
      <path d="M18 24H9s1-6 4-8c3-2 10 0 10 0" stroke="url(#lli1)" strokeWidth="2"/>
      <path d="M24 30v10s6-1 8-4c2-3 0-10 0-10" stroke="url(#lli1)" strokeWidth="2"/>
      <circle cx="34" cy="14" r="3" fill="white" fillOpacity="0.25"/>
      <circle cx="34" cy="14" r="1.5" fill="white" fillOpacity="0.15"/>
    </svg>
  )
}

function ChartIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="lci1" x1="4" y1="44" x2="44" y2="4" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6366f1"/><stop offset="1" stopColor="#c084fc"/>
        </linearGradient>
        <filter id="lcig"><feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#7c3aed" floodOpacity="0.5"/></filter>
      </defs>
      <path d="M6 6v36h36" stroke="url(#lci1)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/>
      <rect x="12" y="28" width="6" height="12" rx="2" fill="url(#lci1)" fillOpacity="0.5" filter="url(#lcig)"/>
      <rect x="21" y="18" width="6" height="22" rx="2" fill="url(#lci1)" fillOpacity="0.7" filter="url(#lcig)"/>
      <rect x="30" y="8" width="6" height="32" rx="2" fill="url(#lci1)" filter="url(#lcig)"/>
      <rect x="13" y="29" width="2" height="10" rx="1" fill="white" fillOpacity="0.12"/>
      <rect x="22" y="19" width="2" height="20" rx="1" fill="white" fillOpacity="0.12"/>
      <rect x="31" y="9" width="2" height="30" rx="1" fill="white" fillOpacity="0.12"/>
    </svg>
  )
}

// Feature icons (larger, more detailed)
function ZapIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <defs>
        <linearGradient id="lfz1" x1="14" y1="2" x2="26" y2="38" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fde047"/><stop offset="1" stopColor="#f59e0b"/>
        </linearGradient>
        <filter id="lfzg"><feGaussianBlur stdDeviation="3"/></filter>
        <filter id="lfzs"><feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#eab308" floodOpacity="0.6"/></filter>
      </defs>
      <path d="M22 3L6 23h14l-2 14 16-20H20l2-14z" fill="url(#lfz1)" fillOpacity="0.12" filter="url(#lfzg)"/>
      <path d="M22 3L6 23h14l-2 14 16-20H20l2-14z" fill="url(#lfz1)" fillOpacity="0.25" stroke="url(#lfz1)" strokeWidth="2" strokeLinejoin="round" filter="url(#lfzs)"/>
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <defs>
        <linearGradient id="lfs1" x1="6" y1="2" x2="34" y2="38" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4ade80"/><stop offset="1" stopColor="#059669"/>
        </linearGradient>
        <filter id="lfss"><feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#22c55e" floodOpacity="0.5"/></filter>
      </defs>
      <path d="M20 3l14 6.5v10c0 8.7-5.7 16.2-14 18.3C11.7 35.7 6 28.2 6 19.5v-10L20 3z" fill="url(#lfs1)" fillOpacity="0.12" stroke="url(#lfs1)" strokeWidth="2" filter="url(#lfss)"/>
      <path d="M14 20l4 4 8-8" stroke="url(#lfs1)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function GlobeIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <defs>
        <radialGradient id="lfg1" cx="0.35" cy="0.3" r="0.65">
          <stop stopColor="#67e8f9"/><stop offset="1" stopColor="#0e7490"/>
        </radialGradient>
        <filter id="lfgs"><feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#06b6d4" floodOpacity="0.5"/></filter>
      </defs>
      <circle cx="20" cy="20" r="17" fill="url(#lfg1)" fillOpacity="0.1" stroke="url(#lfg1)" strokeWidth="2" filter="url(#lfgs)"/>
      <ellipse cx="20" cy="20" rx="7" ry="17" stroke="url(#lfg1)" strokeWidth="1" opacity="0.35"/>
      <path d="M3 20h34" stroke="url(#lfg1)" strokeWidth="1" opacity="0.35"/>
      <path d="M6 11h28M6 29h28" stroke="url(#lfg1)" strokeWidth="0.7" opacity="0.2"/>
      <ellipse cx="14" cy="14" rx="6" ry="4" fill="white" fillOpacity="0.06" transform="rotate(-15 14 14)"/>
    </svg>
  )
}

function TrendIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <defs>
        <linearGradient id="lft1" x1="2" y1="32" x2="38" y2="8" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4ade80"/><stop offset="1" stopColor="#22d3ee"/>
        </linearGradient>
        <filter id="lftg"><feGaussianBlur stdDeviation="2.5"/></filter>
        <filter id="lfts"><feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#22c55e" floodOpacity="0.5"/></filter>
      </defs>
      <path d="M38 10l-14 14-8-8L2 30" stroke="url(#lft1)" strokeWidth="5" filter="url(#lftg)" opacity="0.2"/>
      <path d="M38 10l-14 14-8-8L2 30" stroke="url(#lft1)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" filter="url(#lfts)"/>
      <path d="M28 10h10v10" stroke="url(#lft1)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

// ═══════════════════════════════════════════════════════════════
// MAIN LANDING PAGE
// ═══════════════════════════════════════════════════════════════
export function LandingPage({ onEnterApp, onShowTerms, onShowPrivacy }: LandingPageProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      setMousePos({ x: (e.clientX / window.innerWidth) * 100, y: (e.clientY / window.innerHeight) * 100 })
    }
    window.addEventListener('mousemove', fn, { passive: true })
    return () => window.removeEventListener('mousemove', fn)
  }, [])

  const navLinks = [
    { label: 'Products', href: '#products' },
    { label: 'Features', href: '#features' },
    { label: 'Stats', href: '#stats' },
  ]

  const products = [
    { icon: <SwapIcon />, title: 'Swap', desc: 'Lightning-fast token swaps with minimal slippage and MEV protection', accent: 'purple', tag: 'CORE' },
    { icon: <PoolIcon />, title: 'Liquidity Pools', desc: 'Provide liquidity and earn trading fees automatically from every swap', accent: 'cyan', tag: 'EARN' },
    { icon: <StakeIcon />, title: 'ETH Staking', desc: 'Stake ETH and earn passive rewards distributed in real-time', accent: 'amber', tag: 'YIELD' },
    { icon: <GmexaIcon />, title: 'gMEXA Staking', desc: 'Stake gMEXA governance tokens for enhanced yield and voting power', accent: 'pink', tag: 'GOV' },
    { icon: <LaunchIcon />, title: 'IDO Launchpad', desc: 'Get early access to new token launches with tier-based allocation', accent: 'orange', tag: 'LAUNCH' },
    { icon: <ChartIcon />, title: 'Analytics', desc: 'Real-time charts, volume stats, and comprehensive portfolio tracking', accent: 'indigo', tag: 'DATA' },
  ]

  const accentMap: Record<string, { card: string; glow: string }> = {
    purple: { card: 'from-purple-500/10 to-violet-500/5 border-purple-500/15 hover:border-purple-400/40 hover:from-purple-500/15 hover:to-violet-500/10', glow: 'group-hover:shadow-purple-500/20' },
    cyan: { card: 'from-cyan-500/10 to-blue-500/5 border-cyan-500/15 hover:border-cyan-400/40 hover:from-cyan-500/15 hover:to-blue-500/10', glow: 'group-hover:shadow-cyan-500/20' },
    amber: { card: 'from-amber-500/10 to-orange-500/5 border-amber-500/15 hover:border-amber-400/40 hover:from-amber-500/15 hover:to-orange-500/10', glow: 'group-hover:shadow-amber-500/20' },
    pink: { card: 'from-pink-500/10 to-rose-500/5 border-pink-500/15 hover:border-pink-400/40 hover:from-pink-500/15 hover:to-rose-500/10', glow: 'group-hover:shadow-pink-500/20' },
    orange: { card: 'from-orange-500/10 to-red-500/5 border-orange-500/15 hover:border-orange-400/40 hover:from-orange-500/15 hover:to-red-500/10', glow: 'group-hover:shadow-orange-500/20' },
    indigo: { card: 'from-indigo-500/10 to-purple-500/5 border-indigo-500/15 hover:border-indigo-400/40 hover:from-indigo-500/15 hover:to-purple-500/10', glow: 'group-hover:shadow-indigo-500/20' },
  }

  const features = [
    { icon: <ZapIcon />, title: 'Real-Time Speed', desc: 'MegaETH delivers sub-second finality for instant trade execution', tag: 'FAST', color: 'text-yellow-400' },
    { icon: <ShieldIcon />, title: 'Secure & Audited', desc: 'Battle-tested smart contracts with multi-layer security protections', tag: 'SAFE', color: 'text-green-400' },
    { icon: <GlobeIcon />, title: 'Decentralized', desc: 'Fully on-chain, non-custodial, permissionless trading for everyone', tag: 'OPEN', color: 'text-cyan-400' },
    { icon: <TrendIcon />, title: 'Ultra Low Fees', desc: 'Minimal gas costs powered by MegaETH L2 infrastructure', tag: 'CHEAP', color: 'text-emerald-400' },
  ]

  return (
    <div className="min-h-screen relative overflow-x-hidden bg-[#030306]">
      {/* ── ANIMATED BACKGROUND ── */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <div className="absolute inset-0 bg-[#030306]" />
        {/* Interactive gradient orbs that follow mouse */}
        <div className="absolute w-[800px] h-[800px] rounded-full bg-purple-600/[0.06] blur-[150px] transition-all duration-[3000ms] ease-out"
          style={{ left: `${mousePos.x * 0.3 - 10}%`, top: `${mousePos.y * 0.3 - 20}%` }} />
        <div className="absolute w-[600px] h-[600px] rounded-full bg-cyan-500/[0.04] blur-[120px] transition-all duration-[4000ms] ease-out"
          style={{ right: `${(100 - mousePos.x) * 0.2 - 10}%`, top: `${mousePos.y * 0.4 + 10}%` }} />
        <div className="absolute bottom-[-10%] left-[20%] w-[500px] h-[500px] rounded-full bg-violet-600/[0.05] blur-[120px] animate-float" style={{ animationDuration: '12s' }} />
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '80px 80px' }} />
        {/* Particles */}
        <ParticleField />
      </div>

      {/* ── NAV ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? 'bg-[#030306]/70 backdrop-blur-2xl border-b border-white/[0.06] shadow-2xl shadow-black/30' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <img src="/mexa-logo-header.png" alt="Mexa" className="h-10 sm:h-14 w-auto object-contain" />
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map(l => (
                <a key={l.href} href={l.href} className="text-sm text-gray-400 hover:text-white transition-colors relative group">
                  {l.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-500 to-cyan-500 group-hover:w-full transition-all duration-300" />
                </a>
              ))}
              <button onClick={onEnterApp}
                className="relative px-6 py-2.5 rounded-xl text-sm font-semibold text-white overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-violet-600 group-hover:from-purple-500 group-hover:to-violet-500 transition-all" />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-r from-purple-400/20 to-cyan-400/20 blur-xl" />
                <span className="relative">Launch App</span>
              </button>
            </div>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-gray-400 hover:text-white">
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#030306]/95 backdrop-blur-2xl border-t border-white/5 animate-slide-up">
            <div className="px-4 py-4 space-y-3">
              {navLinks.map(l => (
                <a key={l.href} href={l.href} onClick={() => setMobileMenuOpen(false)} className="block py-2.5 text-gray-400 hover:text-white transition-colors">{l.label}</a>
              ))}
              <button onClick={() => { setMobileMenuOpen(false); onEnterApp() }}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-violet-600 mt-2">
                Launch App
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className="relative z-10 flex items-center justify-center min-h-screen px-4 sm:px-6">
        <div className="text-center max-w-5xl mx-auto pt-20 sm:pt-0">
          <Reveal>
            <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-gradient-to-r from-purple-500/[0.08] to-cyan-500/[0.08] border border-purple-500/20 mb-8 backdrop-blur-sm">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-400 shadow-lg shadow-green-400/50" />
              </span>
              <span className="text-xs sm:text-sm text-gray-300 font-medium">Live on MegaETH{IS_MEGAETH_TESTNET ? ' Testnet' : ''}</span>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <h1 className="text-5xl sm:text-7xl lg:text-[5.5rem] font-bold leading-[1.05] mb-6 tracking-tight">
              <span className="text-white drop-shadow-lg">The Future of</span>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-400 to-cyan-400 animate-gradient-x drop-shadow-lg">
                DeFi Trading
              </span>
            </h1>
          </Reveal>

          <Reveal delay={200}>
            <p className="text-base sm:text-lg lg:text-xl text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed">
              Swap, stake, and earn with sub-second finality on MegaETH.
              <br className="hidden sm:block" />
              Built for speed. Designed for everyone.
            </p>
          </Reveal>

          <Reveal delay={300}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button onClick={onEnterApp}
                className="group relative w-full sm:w-auto px-10 py-4.5 rounded-2xl text-base sm:text-lg font-semibold text-white overflow-hidden flex items-center justify-center gap-2.5 transition-all hover:scale-[1.02] active:scale-[0.98]">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-violet-600 group-hover:from-purple-500 group-hover:to-violet-500 transition-all" />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-400/30 to-cyan-400/30 blur-2xl" />
                </div>
                <span className="relative flex items-center gap-2.5">
                  Enter App
                  <span className="group-hover:translate-x-1 transition-transform"><ArrowRight className="w-5 h-5" /></span>
                </span>
              </button>
              <a href="#products"
                className="group w-full sm:w-auto px-10 py-4.5 rounded-2xl text-base sm:text-lg font-semibold text-gray-300 bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.15] transition-all text-center flex items-center justify-center gap-2">
                Explore <ChevronDown className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
              </a>
            </div>
          </Reveal>

          {/* Hero Stats */}
          <Reveal delay={400}>
            <div id="stats" className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-16 sm:mt-24">
              {[
                { value: <AnimatedCounter target={100} suffix="+" />, label: 'Trading Pairs', icon: '📊' },
                { value: <AnimatedCounter target={50} prefix="$" suffix="K+" />, label: 'Total Volume', icon: '💰' },
                { value: <AnimatedCounter target={500} suffix="+" />, label: 'Active Users', icon: '👥' },
                { value: '<1s', label: 'Finality', icon: '⚡' },
              ].map((s, i) => (
                <div key={i} className="group relative text-center p-5 sm:p-6 rounded-2xl overflow-hidden transition-all duration-500 hover:-translate-y-1">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.06] rounded-2xl group-hover:border-white/[0.12] transition-all" />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-purple-500/[0.05] to-transparent rounded-2xl" />
                  <div className="relative">
                    <div className="text-lg mb-2 opacity-70">{s.icon}</div>
                    <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1.5">{s.value}</div>
                    <div className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider font-medium">{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── PRODUCTS ── */}
      <section id="products" className="relative z-10 py-24 sm:py-36 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <div className="text-center mb-14 sm:mb-20">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 mb-5">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                <span className="text-purple-400 text-xs font-semibold uppercase tracking-wider">Products</span>
              </div>
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-white mb-5 tracking-tight">Complete DeFi Suite</h2>
              <p className="text-sm sm:text-base lg:text-lg text-gray-400 max-w-xl mx-auto">Everything you need to trade, earn, and grow on the fastest blockchain</p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {products.map((p, i) => (
              <Reveal key={i} delay={i * 80}>
                <div className={`group relative p-6 sm:p-8 rounded-2xl bg-gradient-to-br ${accentMap[p.accent].card} border backdrop-blur-sm cursor-pointer transition-all duration-500 hover:shadow-2xl ${accentMap[p.accent].glow} hover:-translate-y-1.5`}
                  onClick={onEnterApp}>
                  {/* Tag */}
                  <div className="absolute top-5 right-5 px-2 py-0.5 rounded-md bg-white/[0.05] border border-white/[0.08]">
                    <span className="text-[9px] font-bold text-gray-500 tracking-wider">{p.tag}</span>
                  </div>
                  {/* Icon */}
                  <div className="mb-5 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500 ease-out">
                    {p.icon}
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-white mb-2.5">{p.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed pr-4">{p.desc}</p>
                  {/* Arrow on hover */}
                  <div className="mt-5 flex items-center gap-2 text-gray-500 group-hover:text-white transition-all duration-300">
                    <span className="text-xs font-medium opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300">Open</span>
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300 delay-75" />
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="relative z-10 py-24 sm:py-36 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <div className="text-center mb-14 sm:mb-20">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-5">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-cyan-400 text-xs font-semibold uppercase tracking-wider">Why Mexa</span>
              </div>
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-white mb-5 tracking-tight">Built Different</h2>
              <p className="text-sm sm:text-base lg:text-lg text-gray-400 max-w-xl mx-auto">Powered by MegaETH for unmatched speed and reliability</p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            {features.map((f, i) => (
              <Reveal key={i} delay={i * 100}>
                <div className="group relative flex gap-5 p-6 sm:p-8 rounded-2xl overflow-hidden transition-all duration-500 hover:-translate-y-1">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent border border-white/[0.06] rounded-2xl group-hover:border-white/[0.12] group-hover:from-white/[0.04] transition-all" />
                  <div className="relative flex-shrink-0 mt-1 group-hover:scale-110 transition-transform duration-300">
                    {f.icon}
                  </div>
                  <div className="relative">
                    <div className="flex items-center gap-2.5 mb-2.5">
                      <h3 className="text-lg font-semibold text-white">{f.title}</h3>
                      <span className={`px-2 py-0.5 rounded-md bg-white/[0.05] border border-white/[0.08] text-[10px] font-bold ${f.color} tracking-wider`}>{f.tag}</span>
                    </div>
                    <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative z-10 py-24 sm:py-36 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <Reveal>
            <div className="relative text-center p-10 sm:p-16 lg:p-20 rounded-3xl overflow-hidden">
              {/* CTA background */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/[0.06] via-violet-600/[0.04] to-cyan-600/[0.06] border border-purple-500/15 rounded-3xl" />
              <div className="absolute inset-0 rounded-3xl" style={{ backgroundImage: 'radial-gradient(circle at 30% 20%, rgba(168,85,247,0.1) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(34,211,238,0.06) 0%, transparent 50%)' }} />
              {/* Animated border glow */}
              <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-r from-purple-500/20 via-transparent to-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-purple-500/15 to-violet-500/15 border border-purple-500/20 flex items-center justify-center shadow-2xl shadow-purple-500/10">
                  <img src="/mexa-logo.png" alt="Mexa" className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg" />
                </div>
                <h2 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-white mb-5 tracking-tight">Ready to Trade?</h2>
                <p className="text-sm sm:text-base text-gray-400 mb-10 max-w-lg mx-auto leading-relaxed">
                  Experience the fastest DEX on MegaETH. Connect your wallet and start trading in seconds.
                </p>
                <button onClick={onEnterApp}
                  className="group relative px-10 py-4.5 sm:px-14 sm:py-5 rounded-2xl text-base sm:text-lg font-semibold text-white overflow-hidden inline-flex items-center gap-2.5 transition-all hover:scale-[1.02] active:scale-[0.98]">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-violet-600 group-hover:from-purple-500 group-hover:to-violet-500 transition-all" />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-cyan-400/20 blur-xl" />
                  </div>
                  <span className="relative flex items-center gap-2.5">
                    Launch App
                    <span className="group-hover:translate-x-1 transition-transform"><ArrowRight className="w-5 h-5" /></span>
                  </span>
                </button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 border-t border-white/[0.06] py-10 sm:py-14 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              <img src="/mexa-logo-header.png" alt="Mexa" className="h-8 sm:h-10 w-auto" />
              <span className="text-xs sm:text-sm text-gray-500">© 2026 Mexa DEX. All rights reserved.</span>
            </div>
            <div className="flex items-center gap-5 sm:gap-6">
              {onShowTerms && <button onClick={onShowTerms} className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors">Terms</button>}
              {onShowPrivacy && <button onClick={onShowPrivacy} className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors">Privacy</button>}
              <a href="https://x.com/mexaswap" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/[0.08] hover:border-white/[0.12] transition-all">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a href="https://t.me/mexaswap" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/[0.08] hover:border-white/[0.12] transition-all">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
