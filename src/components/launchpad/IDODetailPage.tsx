import { useState, useEffect } from 'react'
import { useAccount, useReadContract, useBalance, useChainId } from 'wagmi'
import { formatUnits } from 'viem'
import { useIDOPool, getIDOPoolABI } from '../../hooks/useIDOFactory'
import type { ExtendedIDO } from './LaunchpadPage'
import { getNativeToken } from '../../config/tokens'
import { CHAIN_IDS } from '../../config/chains'

interface IDODetailPageProps {
  ido: ExtendedIDO
  onBack: () => void
}

function formatNum(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(2)}K`
  return num.toLocaleString('en-US', { maximumFractionDigits: 2 })
}

function formatDate(ts: number): string {
  return new Date(ts * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function getIDOStatus(ido: ExtendedIDO) {
  const now = Math.floor(Date.now() / 1000)
  if (ido.status === 2) {
    const ok = parseFloat(ido.totalCommitted) >= parseFloat(ido.softCap)
    return ok ? { label: 'Successful', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' }
              : { label: 'Refunded', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' }
  }
  if (ido.status === 3) return { label: 'Cancelled', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' }
  if (now < ido.startTime) return { label: 'Upcoming', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' }
  if (now > ido.endTime) return { label: 'Ended', color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/20' }
  return { label: 'Live Now', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' }
}

export function IDODetailPage({ ido, onBack }: IDODetailPageProps) {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const nativeToken = getNativeToken(chainId)
  const nativeSymbol = nativeToken.symbol
  const explorerUrl = chainId === CHAIN_IDS.MEGAETH ? 'https://megaeth.blockscout.com' : 'https://monadscan.com'
  const [timeLeft, setTimeLeft] = useState('')
  const [copied, setCopied] = useState(false)
  const [amount, setAmount] = useState('')
  const [activeTab, setActiveTab] = useState<'overview' | 'tokenomics' | 'schedule'>('overview')

  const { deposit, claim, claimRefund, isProcessing, statusMessage } = useIDOPool(ido.poolAddress)
  const { data: balance } = useBalance({ address })
  const poolABI = getIDOPoolABI(chainId)
  const { data: userInfo, refetch: refetchUser } = useReadContract({
    address: ido.poolAddress, abi: poolABI, functionName: 'getUserInfo',
    args: address ? [address] : undefined, query: { enabled: !!address }
  })
  const { data: estimation } = useReadContract({
    address: ido.poolAddress, abi: poolABI, functionName: 'estimateAllocation',
    args: address ? [address] : undefined, query: { enabled: !!address }
  })

  const userDeposited = userInfo ? formatUnits(userInfo[0] as bigint, 18) : '0'
  const userRefund = userInfo ? formatUnits(userInfo[2] as bigint, 18) : '0'
  const userClaimable = userInfo ? formatUnits(userInfo[4] as bigint, 18) : '0'
  const hasClaimedRefund = userInfo ? userInfo[5] as boolean : false
  const estimatedTokens = estimation ? formatUnits(estimation[0] as bigint, 18) : '0'
  const estimatedRefund = estimation ? formatUnits(estimation[1] as bigint, 18) : '0'

  const status = getIDOStatus(ido)
  const hardCapNum = parseFloat(ido.hardCap) || 1
  const softCapNum = parseFloat(ido.softCap) || 0
  const totalCommittedNum = parseFloat(ido.totalCommitted) || 0
  const tokenPrice = parseFloat(ido.tokenPrice) || 0
  const tokensForSale = parseFloat(ido.tokensForSale) || 0
  const progress = Math.min((totalCommittedNum / hardCapNum) * 100, 100)
  // softCapProgress removed — soft cap marker rendered inline
  const hasOverflow = totalCommittedNum > hardCapNum
  const now = Math.floor(Date.now() / 1000)
  const isLive = now >= ido.startTime && now <= ido.endTime && ido.isActive
  const isUpcoming = now < ido.startTime && ido.isActive
  const isEnded = now > ido.endTime || ido.status === 2
  const isPrivate = ido.poolType === 1
  const amountNum = parseFloat(amount) || 0
  const tokensToReceive = tokenPrice > 0 ? amountNum / tokenPrice : 0

  useEffect(() => {
    const fmt = (t: number) => {
      const r = t - Math.floor(Date.now() / 1000)
      if (r <= 0) return '0d 0h 0m 0s'
      return `${Math.floor(r / 86400)}d ${Math.floor((r % 86400) / 3600)}h ${Math.floor((r % 3600) / 60)}m ${r % 60}s`
    }
    const iv = setInterval(() => {
      if (isUpcoming) setTimeLeft(fmt(ido.startTime))
      else if (isLive) setTimeLeft(fmt(ido.endTime))
    }, 1000)
    if (isUpcoming) setTimeLeft(fmt(ido.startTime))
    else if (isLive) setTimeLeft(fmt(ido.endTime))
    return () => clearInterval(iv)
  }, [ido, isLive, isUpcoming])

  const copyAddr = (addr: string) => { navigator.clipboard.writeText(addr); setCopied(true); setTimeout(() => setCopied(false), 2000) }
  const handleDeposit = async () => { if (!amount || amountNum <= 0) return; const r = await deposit(amount); if (r.success) { refetchUser(); setAmount('') } }
  const handleClaim = async () => { const r = await claim(); if (r.success) refetchUser() }
  const handleClaimRefund = async () => { const r = await claimRefund(); if (r.success) refetchUser() }
  const handleMax = () => { if (balance) setAmount(formatUnits(balance.value, 18)) }

  return (
    <div className="w-full max-w-6xl mx-auto px-2 sm:px-4">
      {/* Back */}
      <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6 group">
        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 group-hover:-translate-x-1 transition-transform" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        <span className="text-sm font-medium">Back to Launchpad</span>
      </button>

      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1a0e2e] via-[#1e1535] to-[#12101f] border border-purple-500/10 mb-6">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-purple-500/10 rounded-full blur-[80px]" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-pink-500/10 rounded-full blur-[60px]" />
          <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        </div>
        <div className="relative z-10 p-5 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 sm:w-20 sm:h-20">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 blur-lg opacity-40" />
                <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-purple-400 via-pink-500 to-orange-400 p-[2px] shadow-2xl shadow-purple-500/30">
                  <div className="w-full h-full rounded-2xl bg-gradient-to-br from-[#1a1028] to-[#12101f] flex items-center justify-center">
                    <span className="text-3xl sm:text-4xl font-bold bg-gradient-to-br from-purple-300 to-pink-300 bg-clip-text text-transparent">{ido.name.charAt(0)}</span>
                  </div>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {isPrivate && <span className="px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-300 text-[10px] font-medium">Private</span>}
                  <span className="px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-300 text-[10px] font-medium">Verified</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">{ido.name}</h1>
                <p className="text-sm text-gray-400 mt-0.5">{isPrivate ? 'Tier-based Allocation' : 'Overflow Method'}</p>
              </div>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${status.bg} border ${status.border}`}>
              {isLive && <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />}
              <span className={`text-sm font-semibold ${status.color}`}>{status.label}</span>
            </div>
          </div>
          {(isLive || isUpcoming) && (
            <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-4 sm:p-5 border border-white/5">
              <p className="text-xs text-gray-400 mb-3 font-medium uppercase tracking-wider">{isUpcoming ? 'Sale Starts In' : 'Sale Ends In'}</p>
              <div className="flex gap-2 sm:gap-3">
                {timeLeft.split(' ').map((part, i) => (
                  <div key={i} className="text-center flex-1">
                    <div className="bg-gradient-to-b from-white/[0.06] to-white/[0.02] rounded-xl px-2 sm:px-3 py-2 sm:py-3 border border-white/[0.06]">
                      <span className="text-xl sm:text-3xl font-bold text-white tabular-nums">{part.replace(/[dhms]/g, '')}</span>
                    </div>
                    <span className="text-[10px] text-gray-500 mt-1.5 block font-medium">{part.includes('d') ? 'Days' : part.includes('h') ? 'Hours' : part.includes('m') ? 'Mins' : 'Secs'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 mb-6">
        {/* Left: Stats + Tabs */}
        <div className="lg:col-span-3 space-y-5">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Hard Cap', value: `${formatNum(hardCapNum)} ${nativeSymbol}`, icon: (<svg viewBox="0 0 24 24" fill="none" className="w-5 h-5"><circle cx="12" cy="12" r="9" stroke="url(#s1)" strokeWidth="2"/><path d="M12 8v4l3 2" stroke="url(#s1)" strokeWidth="2" strokeLinecap="round"/><defs><linearGradient id="s1" x1="3" y1="3" x2="21" y2="21"><stop stopColor="#c084fc"/><stop offset="1" stopColor="#e879f9"/></linearGradient></defs></svg>), color: 'from-purple-500/10 to-purple-500/5' },
              { label: 'Token Price', value: `${tokenPrice.toFixed(6)} ${nativeSymbol}`, icon: (<svg viewBox="0 0 24 24" fill="none" className="w-5 h-5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="url(#s2)" strokeWidth="2" strokeLinecap="round"/><defs><linearGradient id="s2" x1="6" y1="2" x2="18" y2="22"><stop stopColor="#6ee7b7"/><stop offset="1" stopColor="#34d399"/></linearGradient></defs></svg>), color: 'from-emerald-500/10 to-emerald-500/5' },
              { label: 'Participants', value: `${ido.totalParticipants}`, icon: (<svg viewBox="0 0 24 24" fill="none" className="w-5 h-5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="url(#s3)" strokeWidth="2" strokeLinecap="round"/><circle cx="9" cy="7" r="4" stroke="url(#s3)" strokeWidth="2"/><defs><linearGradient id="s3" x1="1" y1="3" x2="21" y2="23"><stop stopColor="#93c5fd"/><stop offset="1" stopColor="#6366f1"/></linearGradient></defs></svg>), color: 'from-blue-500/10 to-blue-500/5' },
              { label: 'Total Raised', value: `${formatNum(totalCommittedNum)} ${nativeSymbol}`, icon: (<svg viewBox="0 0 24 24" fill="none" className="w-5 h-5"><path d="M22 7l-8.5 8.5-5-5L2 17" stroke="url(#s4)" strokeWidth="2" strokeLinecap="round"/><path d="M16 7h6v6" stroke="url(#s4)" strokeWidth="2" strokeLinecap="round"/><defs><linearGradient id="s4" x1="2" y1="7" x2="22" y2="17"><stop stopColor="#f9a8d4"/><stop offset="1" stopColor="#ec4899"/></linearGradient></defs></svg>), color: 'from-pink-500/10 to-pink-500/5' },
            ].map((stat) => (
              <div key={stat.label} className={`bg-gradient-to-br ${stat.color} rounded-2xl p-4 border border-white/5`}>
                <div className="mb-2">{stat.icon}</div>
                <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">{stat.label}</p>
                <p className="text-sm font-bold text-white mt-0.5">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="bg-gradient-to-br from-[#161622] to-[#0f0f1a] rounded-2xl border border-white/[0.06] overflow-hidden">
            <div className="flex border-b border-white/5">
              {(['overview', 'tokenomics', 'schedule'] as const).map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`flex-1 px-4 py-3.5 text-xs font-semibold transition-all capitalize relative ${activeTab === tab ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                  {tab}
                  {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-purple-500 to-pink-500" />}
                </button>
              ))}
            </div>
            <div className="p-5">
              {activeTab === 'overview' && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-base font-bold text-white mb-3">About {ido.name}</h3>
                    <p className="text-sm text-gray-400 leading-relaxed">A project launching on {chainId === CHAIN_IDS.MEGAETH ? 'MegaETH' : 'Monad'} blockchain with unique utility for early participants.</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-white/[0.02] rounded-xl p-3 border border-white/[0.04]">
                      <p className="text-[10px] text-gray-500 mb-1">Token Contract</p>
                      <div className="flex items-center gap-2">
                        <code className="text-xs text-gray-300 truncate flex-1">{ido.saleToken}</code>
                        <button onClick={() => copyAddr(ido.saleToken)} className="text-purple-400 hover:text-purple-300 shrink-0">
                          {copied ? <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
                                  : <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>}
                        </button>
                        <a href={`${explorerUrl}/address/${ido.saleToken}`} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 shrink-0">
                          <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/></svg>
                        </a>
                      </div>
                    </div>
                    <div className="bg-white/[0.02] rounded-xl p-3 border border-white/[0.04]">
                      <p className="text-[10px] text-gray-500 mb-1">Pool Contract</p>
                      <div className="flex items-center gap-2">
                        <code className="text-xs text-gray-300 truncate flex-1">{ido.poolAddress}</code>
                        <a href={`${explorerUrl}/address/${ido.poolAddress}`} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 shrink-0">
                          <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/></svg>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {activeTab === 'tokenomics' && (
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-white">Token Distribution</h3>
                  {[
                    { label: 'IDO Sale', pct: 40, color: 'from-purple-500 to-purple-600' },
                    { label: 'Liquidity Pool', pct: 30, color: 'from-blue-500 to-blue-600' },
                    { label: 'Team & Advisors', pct: 15, color: 'from-pink-500 to-pink-600' },
                    { label: 'Marketing', pct: 10, color: 'from-amber-500 to-amber-600' },
                    { label: 'Reserve', pct: 5, color: 'from-emerald-500 to-emerald-600' },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="flex justify-between text-xs mb-1.5"><span className="text-gray-400">{item.label}</span><span className="text-white font-semibold">{item.pct}%</span></div>
                      <div className="h-2 bg-[#0d0d15] rounded-full overflow-hidden"><div className={`h-full bg-gradient-to-r ${item.color} rounded-full`} style={{ width: `${item.pct}%` }} /></div>
                    </div>
                  ))}
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="bg-white/[0.02] rounded-xl p-3 border border-white/[0.04]"><p className="text-[10px] text-gray-500 mb-0.5">Total Supply</p><p className="text-sm font-bold text-white">{formatNum(tokensForSale * 2.5)}</p></div>
                    <div className="bg-white/[0.02] rounded-xl p-3 border border-white/[0.04]"><p className="text-[10px] text-gray-500 mb-0.5">For Sale</p><p className="text-sm font-bold text-white">{formatNum(tokensForSale)}</p></div>
                  </div>
                </div>
              )}
              {activeTab === 'schedule' && (
                <div className="space-y-5">
                  <h3 className="text-base font-bold text-white">Sale Schedule</h3>
                  {[
                    { title: 'Sale Start', time: ido.startTime, done: now >= ido.startTime },
                    { title: 'Sale End', time: ido.endTime, done: now >= ido.endTime },
                    { title: 'Token Distribution', time: ido.endTime + 3600, done: false, desc: '20% TGE, 80% vested over 180 days' },
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center ${item.done ? 'bg-emerald-500/15 border border-emerald-500/20' : 'bg-white/[0.03] border border-white/[0.06]'}`}>
                          {item.done
                            ? <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-emerald-400" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
                            : <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-gray-500" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>}
                        </div>
                        {i < 2 && <div className="w-px h-8 bg-white/5 mt-1" />}
                      </div>
                      <div className="pb-2">
                        <p className={`text-sm font-semibold ${item.done ? 'text-emerald-400' : 'text-white'}`}>{item.title}</p>
                        <p className="text-xs text-gray-500">{formatDate(item.time)}</p>
                        {item.desc && <p className="text-[10px] text-gray-500 mt-0.5">{item.desc}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Contribute Card */}
        <div className="lg:col-span-2 space-y-5">
          {/* Sale Progress Card */}
          <div className="bg-gradient-to-br from-[#161622] to-[#0f0f1a] rounded-2xl border border-white/[0.06] p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white">Sale Progress</h3>
              <span className={`text-xs font-semibold ${hasOverflow ? 'text-amber-400' : 'text-gray-400'}`}>
                {progress.toFixed(1)}%{hasOverflow && ' (Overflow)'}
              </span>
            </div>
            {/* Progress Bar */}
            <div className="relative h-3 bg-[#0d0d15] rounded-full overflow-hidden mb-2">
              <div
                className={`h-full rounded-full transition-all duration-500 ${hasOverflow ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500' : 'bg-gradient-to-r from-purple-500 to-pink-500'}`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
              {/* Soft Cap Marker */}
              {softCapNum > 0 && softCapNum < hardCapNum && (
                <div
                  className="absolute top-0 bottom-0 w-px bg-emerald-400/60"
                  style={{ left: `${(softCapNum / hardCapNum) * 100}%` }}
                >
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[8px] text-emerald-400 whitespace-nowrap font-medium">Soft Cap</div>
                </div>
              )}
            </div>
            <div className="flex justify-between text-[10px] text-gray-500">
              <span>{formatNum(totalCommittedNum)} {nativeSymbol}</span>
              <span>Hard Cap: {formatNum(hardCapNum)} {nativeSymbol}</span>
            </div>

            {/* Overflow Warning */}
            {hasOverflow && (
              <div className="mt-3 bg-amber-500/10 rounded-xl p-3 border border-amber-500/15">
                <div className="flex items-start gap-2">
                  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01"/></svg>
                  <p className="text-[10px] text-amber-400/80">Overflow active — allocation will be proportional. Excess {nativeSymbol} will be refunded.</p>
                </div>
              </div>
            )}
          </div>

          {/* Contribute Input Card */}
          {isLive && (
            <div className="bg-gradient-to-br from-[#161622] to-[#0f0f1a] rounded-2xl border border-white/[0.06] p-5">
              <h3 className="text-sm font-bold text-white mb-4">Contribute</h3>
              <div className="bg-black/20 rounded-xl p-4 border border-white/5">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Amount</span>
                  <button onClick={handleMax} disabled={isProcessing} className="text-[10px] text-purple-400 hover:text-purple-300 transition-colors">
                    Balance: {balance ? parseFloat(formatUnits(balance.value, 18)).toFixed(4) : '0'} {nativeSymbol}
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.0"
                    disabled={isProcessing}
                    className="flex-1 bg-transparent text-2xl text-white outline-none placeholder-gray-600 min-w-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <div className="flex items-center gap-2 bg-white/[0.04] rounded-lg px-3 py-2 border border-white/[0.06] shrink-0">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-400 to-pink-400" />
                    <span className="font-semibold text-white text-sm">{nativeSymbol}</span>
                  </div>
                </div>
                {/* Percentage Buttons */}
                <div className="flex gap-2 mt-3">
                  {[25, 50, 75, 100].map((pct) => (
                    <button
                      key={pct}
                      onClick={() => balance && setAmount((parseFloat(formatUnits(balance.value, 18)) * pct / 100).toString())}
                      disabled={isProcessing}
                      className="flex-1 py-1.5 text-[10px] font-semibold bg-white/[0.03] hover:bg-purple-500/10 text-gray-400 hover:text-purple-300 rounded-lg transition-all border border-white/[0.04] hover:border-purple-500/20 disabled:opacity-50"
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Token Estimate */}
              {amountNum > 0 && (
                <div className="mt-3 bg-emerald-500/10 rounded-xl p-3 border border-emerald-500/15">
                  <div className="flex items-center gap-2 mb-1">
                    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-emerald-400" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>
                    <span className="text-[10px] text-gray-400 font-medium">Estimated Tokens</span>
                  </div>
                  <p className="text-lg font-bold text-emerald-400">{formatNum(tokensToReceive)} Tokens</p>
                  {hasOverflow && (
                    <p className="text-[9px] text-amber-400/70 mt-1">Final allocation may be lower due to overflow</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* User Position Card */}
          {isConnected && parseFloat(userDeposited) > 0 && (
            <div className="bg-gradient-to-br from-[#161622] to-[#0f0f1a] rounded-2xl border border-white/[0.06] p-5">
              <h3 className="text-sm font-bold text-white mb-4">Your Position</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-xs text-gray-400">Deposited</span>
                  <span className="text-sm font-bold text-white">{formatNum(parseFloat(userDeposited))} {nativeSymbol}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-xs text-gray-400">Est. Allocation</span>
                  <span className="text-sm font-bold text-purple-400">{formatNum(parseFloat(estimatedTokens))} Tokens</span>
                </div>
                {parseFloat(estimatedRefund) > 0 && (
                  <div className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-xs text-gray-400">Est. Refund</span>
                    <span className="text-sm font-bold text-amber-400">{formatNum(parseFloat(estimatedRefund))} {nativeSymbol}</span>
                  </div>
                )}
                {parseFloat(userClaimable) > 0 && (
                  <div className="flex justify-between items-center py-2">
                    <span className="text-xs text-gray-400">Claimable</span>
                    <span className="text-sm font-bold text-emerald-400">{formatNum(parseFloat(userClaimable))} Tokens</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Status Message */}
          {statusMessage && (
            <div className={`rounded-2xl p-4 text-sm ${statusMessage.includes('✅') ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : statusMessage.includes('❌') ? 'bg-red-500/10 border border-red-500/20 text-red-400' : 'bg-blue-500/10 border border-blue-500/20 text-blue-400'}`}>
              {isProcessing && (
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 inline-block animate-spin mr-2" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
              )}
              {statusMessage}
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            {!isConnected ? (
              <button className="w-full py-4 bg-white/[0.04] rounded-2xl text-gray-500 font-semibold cursor-not-allowed border border-white/[0.06] text-sm">
                Connect Wallet to Participate
              </button>
            ) : isLive ? (
              <button
                onClick={handleDeposit}
                disabled={isProcessing || !amount || amountNum <= 0}
                className="w-full py-4 rounded-2xl font-bold text-white text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 animate-spin" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
                    Processing...
                  </span>
                ) : (
                  `Contribute ${amount || '0'} ${nativeSymbol}`
                )}
              </button>
            ) : isEnded ? (
              <div className="space-y-2">
                {parseFloat(userClaimable) > 0 && (
                  <button
                    onClick={handleClaim}
                    disabled={isProcessing}
                    className="w-full py-4 rounded-2xl font-bold text-white text-sm transition-all disabled:opacity-50 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-500/20"
                  >
                    {isProcessing ? 'Claiming...' : 'Claim Tokens'}
                  </button>
                )}
                {parseFloat(userRefund) > 0 && !hasClaimedRefund && (
                  <button
                    onClick={handleClaimRefund}
                    disabled={isProcessing}
                    className="w-full py-4 rounded-2xl font-bold text-amber-400 text-sm transition-all disabled:opacity-50 bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/20"
                  >
                    {isProcessing ? 'Claiming...' : `Claim Refund (${formatNum(parseFloat(userRefund))} ${nativeSymbol})`}
                  </button>
                )}
                {parseFloat(userClaimable) <= 0 && (parseFloat(userRefund) <= 0 || hasClaimedRefund) && (
                  <button className="w-full py-4 bg-white/[0.04] rounded-2xl text-gray-500 font-semibold cursor-not-allowed border border-white/[0.06] text-sm">
                    Sale Ended — Nothing to Claim
                  </button>
                )}
              </div>
            ) : isUpcoming ? (
              <button className="w-full py-4 bg-white/[0.04] rounded-2xl text-gray-500 font-semibold cursor-not-allowed border border-white/[0.06] text-sm">
                Sale Not Started Yet
              </button>
            ) : (
              <button className="w-full py-4 bg-white/[0.04] rounded-2xl text-gray-500 font-semibold cursor-not-allowed border border-white/[0.06] text-sm">
                Sale Closed
              </button>
            )}
          </div>

          {/* Info Note */}
          <div className="bg-white/[0.02] rounded-2xl p-4 border border-white/[0.04]">
            <div className="flex items-start gap-2.5">
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
              <div className="text-[10px] text-gray-500 space-y-1">
                <p className="font-medium text-gray-400">Overflow Method</p>
                <p>If total deposits exceed hard cap, allocation is proportional to your contribution.</p>
                <p>Excess {nativeSymbol} is automatically refunded after the sale ends.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
