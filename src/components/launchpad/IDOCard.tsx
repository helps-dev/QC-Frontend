import { useChainId } from 'wagmi'
import type { ExtendedIDO } from './LaunchpadPage'
import { getNativeToken } from '../../config/tokens'

interface IDOCardProps {
  ido: ExtendedIDO
  onSelect: () => void
}

function formatNum(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(2)}K`
  return num.toFixed(2)
}

function formatTimeRemaining(targetTime: number): string {
  const now = Math.floor(Date.now() / 1000)
  const remaining = targetTime - now
  if (remaining <= 0) return 'Ended'
  const d = Math.floor(remaining / 86400)
  const h = Math.floor((remaining % 86400) / 3600)
  const m = Math.floor((remaining % 3600) / 60)
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

function getIDOStatus(ido: ExtendedIDO): { label: string; color: string; bgColor: string; borderColor: string; dotColor: string } {
  const now = Math.floor(Date.now() / 1000)
  if (ido.status === 2) {
    const ok = parseFloat(ido.totalCommitted) >= parseFloat(ido.softCap)
    return ok
      ? { label: 'Successful', color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/20', dotColor: 'bg-emerald-400' }
      : { label: 'Failed', color: 'text-red-400', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/20', dotColor: 'bg-red-400' }
  }
  if (ido.status === 3) return { label: 'Cancelled', color: 'text-red-400', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/20', dotColor: 'bg-red-400' }
  if (now < ido.startTime) return { label: 'Upcoming', color: 'text-amber-400', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/20', dotColor: 'bg-amber-400' }
  if (now > ido.endTime) return { label: 'Ended', color: 'text-gray-400', bgColor: 'bg-gray-500/10', borderColor: 'border-gray-500/20', dotColor: 'bg-gray-400' }
  return { label: 'Live', color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/20', dotColor: 'bg-emerald-400' }
}

function TokenLogo3D({ name }: { name: string }) {
  const ch = name.charAt(0).toUpperCase()
  return (
    <div className="relative w-14 h-14 shrink-0">
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 blur-lg opacity-30" />
      <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-purple-400 via-pink-500 to-orange-400 p-[2px] shadow-xl shadow-purple-500/20">
        <div className="w-full h-full rounded-[14px] bg-gradient-to-br from-[#1a1028] to-[#12101f] flex items-center justify-center">
          <span className="text-xl font-bold bg-gradient-to-br from-purple-300 via-pink-300 to-orange-300 bg-clip-text text-transparent">{ch}</span>
        </div>
      </div>
    </div>
  )
}

export function IDOCard({ ido, onSelect }: IDOCardProps) {
  const chainId = useChainId()
  const nativeSymbol = getNativeToken(chainId).symbol
  const status = getIDOStatus(ido)
  const hardCapNum = parseFloat(ido.hardCap) || 1
  const totalCommittedNum = parseFloat(ido.totalCommitted) || 0
  const progress = (totalCommittedNum / hardCapNum) * 100
  const hasOverflow = progress > 100
  const now = Math.floor(Date.now() / 1000)
  const isLive = now >= ido.startTime && now <= ido.endTime && ido.isActive
  const isUpcoming = now < ido.startTime && ido.isActive
  const isPrivate = ido.poolType === 1

  return (
    <div onClick={onSelect} className="group relative bg-gradient-to-br from-[#161622] to-[#0f0f1a] rounded-2xl border border-white/[0.06] hover:border-purple-500/25 transition-all duration-300 overflow-hidden cursor-pointer hover:shadow-2xl hover:shadow-purple-500/[0.07] hover:-translate-y-0.5">
      <div className={`absolute top-0 left-0 right-0 h-[2px] transition-opacity ${isLive ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 opacity-100' : isUpcoming ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 opacity-100' : 'bg-gradient-to-r from-transparent via-purple-500/50 to-transparent opacity-0 group-hover:opacity-100'}`} />
      <div className="p-5">
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3.5 min-w-0">
            <TokenLogo3D name={ido.name} />
            <div className="min-w-0">
              <h3 className="text-base font-bold text-white group-hover:text-purple-200 transition-colors truncate max-w-[160px]">{ido.name}</h3>
              <div className="flex items-center gap-1.5 mt-1">
                {isPrivate && <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-purple-500/15 text-purple-300 text-[10px] font-medium">Private</span>}
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-300 text-[10px] font-medium">Verified</span>
              </div>
            </div>
          </div>
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${status.bgColor} border ${status.borderColor} shrink-0`}>
            {isLive && <span className={`w-1.5 h-1.5 rounded-full ${status.dotColor} animate-pulse`} />}
            <span className={`text-[10px] font-semibold ${status.color}`}>{status.label}</span>
          </div>
        </div>
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[11px] text-gray-500 font-medium">Progress</span>
            <span className={`text-xs font-bold ${hasOverflow ? 'text-orange-400' : progress >= 100 ? 'text-emerald-400' : 'text-white'}`}>
              {progress.toFixed(1)}%{hasOverflow && <span className="text-[10px] ml-1 text-orange-400/70">overflow</span>}
            </span>
          </div>
          <div className="relative h-2.5 bg-[#0d0d15] rounded-full overflow-hidden">
            {parseFloat(ido.softCap) > 0 && <div className="absolute top-0 bottom-0 w-px bg-white/20 z-10" style={{ left: `${Math.min(100, (parseFloat(ido.softCap) / hardCapNum) * 100)}%` }} />}
            <div className={`h-full rounded-full transition-all duration-700 ${hasOverflow ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500' : progress >= 80 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-purple-500 to-pink-500'}`} style={{ width: `${Math.min(100, progress)}%` }} />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[10px] text-gray-500">{formatNum(totalCommittedNum)} {nativeSymbol}</span>
            <span className="text-[10px] text-gray-500">{formatNum(hardCapNum)} {nativeSymbol}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-white/[0.02] rounded-xl p-2.5 border border-white/[0.04]">
            <p className="text-[10px] text-gray-500 mb-0.5">Token Price</p>
            <p className="text-xs font-semibold text-white">{parseFloat(ido.tokenPrice) > 0 ? parseFloat(ido.tokenPrice).toFixed(6) : '\u2014'} {nativeSymbol}</p>
          </div>
          <div className="bg-white/[0.02] rounded-xl p-2.5 border border-white/[0.04]">
            <p className="text-[10px] text-gray-500 mb-0.5">Participants</p>
            <p className="text-xs font-semibold text-white">{ido.totalParticipants}</p>
          </div>
          <div className="bg-white/[0.02] rounded-xl p-2.5 border border-white/[0.04]">
            <p className="text-[10px] text-gray-500 mb-0.5">Soft Cap</p>
            <p className="text-xs font-semibold text-white">{formatNum(parseFloat(ido.softCap))} {nativeSymbol}</p>
          </div>
          <div className="bg-white/[0.02] rounded-xl p-2.5 border border-white/[0.04]">
            <p className="text-[10px] text-gray-500 mb-0.5">{isUpcoming ? 'Starts In' : isLive ? 'Ends In' : 'Status'}</p>
            <p className={`text-xs font-semibold ${isLive ? 'text-emerald-400' : isUpcoming ? 'text-amber-400' : 'text-gray-400'}`}>
              {isUpcoming ? formatTimeRemaining(ido.startTime) : isLive ? formatTimeRemaining(ido.endTime) : status.label}
            </p>
          </div>
        </div>
        {hasOverflow && isLive && (
          <div className="bg-orange-500/[0.06] border border-orange-500/15 rounded-xl p-2.5 mb-4">
            <p className="text-[10px] text-orange-300/80 flex items-center gap-1.5">
              <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5 text-orange-400 shrink-0" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 10 10-12h-9l1-10z"/></svg>
              Overflow {ido.overflowPercent.toFixed(0)}% — proportional allocation
            </p>
          </div>
        )}
        <button onClick={(e) => { e.stopPropagation(); onSelect() }} className={`w-full py-2.5 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-1.5 ${isLive ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-500/15' : isUpcoming ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/15' : 'bg-white/[0.03] text-gray-400 border border-white/[0.06] hover:bg-white/[0.06]'}`}>
          {isLive ? 'Participate Now' : isUpcoming ? 'Coming Soon' : 'View Details'}
        </button>
      </div>
    </div>
  )
}
