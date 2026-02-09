import { useState, useEffect } from 'react'
import { useChainId } from 'wagmi'
import type { ExtendedIDO } from './LaunchpadPage'
import { CHAIN_IDS } from '../../config/chains'
import { getNativeToken } from '../../config/tokens'

interface IDODetailModalProps {
  ido: ExtendedIDO
  onClose: () => void
  onContribute: () => void
}

function formatNum(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(2)}K`
  return num.toFixed(2)
}

function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

function formatTimeRemaining(targetTime: number): string {
  const now = Math.floor(Date.now() / 1000)
  const remaining = targetTime - now
  if (remaining <= 0) return 'Ended'
  const d = Math.floor(remaining / 86400)
  const h = Math.floor((remaining % 86400) / 3600)
  const m = Math.floor((remaining % 3600) / 60)
  const s = Math.floor(remaining % 60)
  if (d > 0) return `${d}d ${h}h ${m}m`
  if (h > 0) return `${h}h ${m}m ${s}s`
  return `${m}m ${s}s`
}

function getIDOStatus(ido: ExtendedIDO) {
  const now = Math.floor(Date.now() / 1000)
  if (ido.status === 2) {
    const ok = parseFloat(ido.totalCommitted) >= parseFloat(ido.softCap)
    return ok ? { label: 'Successful', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' }
              : { label: 'Failed', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' }
  }
  if (ido.status === 3) return { label: 'Cancelled', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' }
  if (now < ido.startTime) return { label: 'Upcoming', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' }
  if (now > ido.endTime) return { label: 'Ended', color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/20' }
  return { label: 'Live Now', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' }
}

export function IDODetailModal({ ido, onClose, onContribute }: IDODetailModalProps) {
  const chainId = useChainId()
  const nativeToken = getNativeToken(chainId)
  const nativeSymbol = nativeToken.symbol
  const explorerUrl = chainId === CHAIN_IDS.MEGAETH ? 'https://megaeth.blockscout.com' : 'https://monadscan.com'
  const [copied, setCopied] = useState(false)
  const [timeLeft, setTimeLeft] = useState('')
  const [activeTab, setActiveTab] = useState<'info' | 'tokenomics' | 'schedule'>('info')

  const status = getIDOStatus(ido)
  const hardCapNum = parseFloat(ido.hardCap) || 1
  const softCapNum = parseFloat(ido.softCap) || 0
  const totalCommittedNum = parseFloat(ido.totalCommitted) || 0
  const progress = (totalCommittedNum / hardCapNum) * 100
  const hasOverflow = progress > 100
  const now = Math.floor(Date.now() / 1000)
  const isLive = now >= ido.startTime && now <= ido.endTime && ido.isActive
  const isUpcoming = now < ido.startTime && ido.isActive
  const isPrivate = ido.poolType === 1
  const softCapReached = totalCommittedNum >= softCapNum

  useEffect(() => {
    const iv = setInterval(() => {
      if (isUpcoming) setTimeLeft(formatTimeRemaining(ido.startTime))
      else if (isLive) setTimeLeft(formatTimeRemaining(ido.endTime))
    }, 1000)
    return () => clearInterval(iv)
  }, [ido, isLive, isUpcoming])

  const copyAddress = () => {
    navigator.clipboard.writeText(ido.saleToken)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-4xl my-8 bg-gradient-to-br from-[#12121a] to-[#0d0d15] rounded-3xl border border-white/[0.08] shadow-2xl overflow-hidden">

        {/* Hero Banner */}
        <div className="relative h-40 sm:h-48 bg-gradient-to-r from-purple-600/30 via-pink-500/20 to-purple-600/30 overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          <button onClick={onClose} className="absolute top-4 left-4 p-2 rounded-xl bg-black/30 hover:bg-black/50 backdrop-blur-sm transition-all">
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </button>
          <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-xl bg-black/30 hover:bg-black/50 backdrop-blur-sm transition-all">
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
          {/* Token Logo */}
          <div className="absolute -bottom-10 left-6 sm:left-8">
            <div className="relative w-20 h-20 sm:w-24 sm:h-24">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 blur-lg opacity-40" />
              <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-purple-400 via-pink-500 to-orange-400 p-[2px] shadow-2xl shadow-purple-500/30">
                <div className="w-full h-full rounded-2xl bg-gradient-to-br from-[#1a1028] to-[#12101f] flex items-center justify-center">
                  <span className="text-3xl sm:text-4xl font-bold bg-gradient-to-br from-purple-300 to-pink-300 bg-clip-text text-transparent">{ido.name.charAt(0)}</span>
                </div>
              </div>
            </div>
          </div>
          {/* Status Badge */}
          <div className="absolute bottom-4 right-4 sm:right-6">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${status.bg} border ${status.border} backdrop-blur-sm`}>
              {isLive && <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />}
              <span className={`text-sm font-bold ${status.color}`}>{status.label}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 pt-14 sm:pt-16">
          {/* Title & Badges */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">{ido.name}</h1>
              <div className="flex flex-wrap items-center gap-2">
                {isPrivate && (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/15 text-purple-300 text-xs font-medium">
                    <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                    Private Sale
                  </span>
                )}
                {hasOverflow && (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-300 text-xs font-medium">
                    <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
                    Overflow: {ido.overflowPercent.toFixed(0)}%
                  </span>
                )}
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/15 text-blue-300 text-xs font-medium">
                  <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  Verified
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <a href={`${explorerUrl}/address/${ido.poolAddress}`} target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] transition-all">
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-gray-400" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/></svg>
              </a>
            </div>
          </div>

          {/* Progress Card */}
          <div className="bg-white/[0.02] rounded-2xl p-5 border border-white/5 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <p className="text-xs text-gray-400 mb-1">Total Raised</p>
                <p className="text-2xl sm:text-3xl font-bold text-white">{formatNum(totalCommittedNum)} <span className="text-lg text-gray-400">{nativeSymbol}</span></p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400 mb-1">{isUpcoming ? 'Starts In' : isLive ? 'Ends In' : 'Status'}</p>
                <p className={`text-xl sm:text-2xl font-bold ${isLive ? 'text-emerald-400' : isUpcoming ? 'text-amber-400' : 'text-gray-400'}`}>
                  {isUpcoming || isLive ? timeLeft : status.label}
                </p>
              </div>
            </div>
            <div className="relative h-3 bg-[#0d0d15] rounded-full overflow-hidden mb-3">
              <div className={`h-full rounded-full transition-all duration-500 ${hasOverflow ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500' : 'bg-gradient-to-r from-purple-500 to-pink-500'}`} style={{ width: `${Math.min(100, progress)}%` }} />
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">{progress.toFixed(2)}%</span>
              <span className="text-gray-400">{formatNum(hardCapNum)} {nativeSymbol}</span>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <div className={`w-2.5 h-2.5 rounded-full ${softCapReached ? 'bg-emerald-500' : 'bg-gray-600'}`} />
              <span className={`text-xs ${softCapReached ? 'text-emerald-400' : 'text-gray-500'}`}>
                Soft Cap: {formatNum(softCapNum)} {nativeSymbol} {softCapReached && '✓'}
              </span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-6 p-1 bg-white/[0.02] rounded-xl border border-white/[0.04]">
            {(['info', 'tokenomics', 'schedule'] as const).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all capitalize relative ${activeTab === tab ? 'text-white bg-gradient-to-r from-purple-600/30 to-pink-600/30 border border-purple-500/20' : 'text-gray-500 hover:text-gray-300'}`}>
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'info' && (
            <div className="space-y-4">
              <div className="bg-white/[0.02] rounded-2xl p-5 border border-white/5">
                <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-purple-400" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
                  Token Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex justify-between items-center py-2.5 border-b border-white/5">
                    <span className="text-gray-400 text-xs">Token Address</span>
                    <button onClick={copyAddress} className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors">
                      <span className="text-xs font-mono">{ido.saleToken.slice(0, 8)}...{ido.saleToken.slice(-6)}</span>
                      {copied
                        ? <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
                        : <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>}
                    </button>
                  </div>
                  <div className="flex justify-between items-center py-2.5 border-b border-white/5">
                    <span className="text-gray-400 text-xs">Pool Address</span>
                    <span className="text-white text-xs font-mono">{ido.poolAddress.slice(0, 8)}...{ido.poolAddress.slice(-6)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2.5 border-b border-white/5">
                    <span className="text-gray-400 text-xs">Token Price</span>
                    <span className="text-white text-xs font-semibold">{parseFloat(ido.tokenPrice).toFixed(6)} {nativeSymbol}</span>
                  </div>
                  <div className="flex justify-between items-center py-2.5 border-b border-white/5">
                    <span className="text-gray-400 text-xs">Tokens For Sale</span>
                    <span className="text-white text-xs font-semibold">{formatNum(parseFloat(ido.tokensForSale))}</span>
                  </div>
                </div>
              </div>
              <div className="bg-white/[0.02] rounded-2xl p-5 border border-white/5">
                <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-pink-400" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M8 12l2 2 4-4"/></svg>
                  Pool Details
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Soft Cap', value: formatNum(softCapNum), sub: nativeSymbol },
                    { label: 'Hard Cap', value: formatNum(hardCapNum), sub: nativeSymbol },
                    { label: 'Participants', value: `${ido.totalParticipants}`, sub: 'Users' },
                    { label: 'Pool Type', value: isPrivate ? 'Private' : 'Public', sub: 'Sale' },
                  ].map((item) => (
                    <div key={item.label} className="bg-white/[0.02] rounded-xl p-3 text-center border border-white/[0.04]">
                      <p className="text-[10px] text-gray-500 mb-0.5">{item.label}</p>
                      <p className="text-base font-bold text-white">{item.value}</p>
                      <p className="text-[10px] text-gray-500">{item.sub}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tokenomics' && (
            <div className="bg-white/[0.02] rounded-2xl p-5 border border-white/5">
              <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-yellow-400" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                Tokenomics
              </h3>
              <div className="space-y-3">
                {[
                  { label: 'IDO Sale', pct: 40, color: 'from-purple-500 to-purple-600' },
                  { label: 'Liquidity', pct: 30, color: 'from-blue-500 to-blue-600' },
                  { label: 'Team', pct: 15, color: 'from-pink-500 to-pink-600' },
                  { label: 'Marketing', pct: 10, color: 'from-amber-500 to-amber-600' },
                  { label: 'Reserve', pct: 5, color: 'from-emerald-500 to-emerald-600' },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-gray-400">{item.label}</span>
                      <span className="text-white font-semibold">{item.pct}%</span>
                    </div>
                    <div className="h-2 bg-[#0d0d15] rounded-full overflow-hidden">
                      <div className={`h-full bg-gradient-to-r ${item.color} rounded-full`} style={{ width: `${item.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'schedule' && (
            <div className="bg-white/[0.02] rounded-2xl p-5 border border-white/5">
              <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-blue-400" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                Sale Schedule
              </h3>
              <div className="space-y-1">
                {[
                  { title: 'Sale Start', time: ido.startTime, done: now >= ido.startTime },
                  { title: 'Sale End', time: ido.endTime, done: now >= ido.endTime },
                  { title: 'Token Distribution', time: ido.endTime + 3600, done: false },
                ].map((item, i) => (
                  <div key={i}>
                    <div className="flex items-start gap-4">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${item.done ? 'bg-emerald-500/15 border border-emerald-500/20' : 'bg-white/[0.03] border border-white/[0.06]'}`}>
                        {item.done
                          ? <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-emerald-400" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
                          : <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-gray-500" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>}
                      </div>
                      <div className="pb-2">
                        <p className={`text-sm font-semibold ${item.done ? 'text-emerald-400' : 'text-white'}`}>{item.title}</p>
                        <p className="text-xs text-gray-500">{formatDate(item.time)}</p>
                      </div>
                    </div>
                    {i < 2 && <div className="w-px h-6 bg-white/5 ml-[18px]" />}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Overflow Warning */}
          {hasOverflow && isLive && (
            <div className="bg-amber-500/10 border border-amber-500/15 rounded-2xl p-4 mt-6">
              <div className="flex items-start gap-3">
                <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01"/></svg>
                <div>
                  <p className="text-amber-300 font-semibold text-sm mb-1">Overflow Mode Active</p>
                  <p className="text-amber-200/70 text-xs">This sale has exceeded its hard cap. Your final allocation will be calculated proportionally. Excess {nativeSymbol} will be refunded.</p>
                </div>
              </div>
            </div>
          )}

          {/* CTA Button */}
          <div className="mt-6">
            <button onClick={() => { onClose(); onContribute(); }} disabled={!isLive}
              className={`w-full py-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${isLive ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-500/20' : isUpcoming ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 cursor-not-allowed' : 'bg-white/[0.04] text-gray-500 border border-white/[0.06] cursor-not-allowed'}`}>
              {isLive ? (
                <>
                  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                  Contribute Now
                </>
              ) : isUpcoming ? (
                <>
                  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                  Sale Starts Soon
                </>
              ) : 'Sale Ended'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
