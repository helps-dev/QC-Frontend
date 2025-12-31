import { Clock, Users, Lock, Percent, Sparkles, Zap } from 'lucide-react'
import type { ExtendedIDO } from './LaunchpadPage'

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
  const days = Math.floor(remaining / 86400)
  const hours = Math.floor((remaining % 86400) / 3600)
  const minutes = Math.floor((remaining % 3600) / 60)
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

function getIDOStatus(ido: ExtendedIDO): { label: string; color: string; bgColor: string; borderColor: string } {
  const now = Math.floor(Date.now() / 1000)
  if (ido.status === 2) {
    const softCapReached = parseFloat(ido.totalCommitted) >= parseFloat(ido.softCap)
    return softCapReached
      ? { label: 'Successful', color: 'text-green-400', bgColor: 'bg-green-500/20', borderColor: 'border-green-500/30' }
      : { label: 'Failed', color: 'text-red-400', bgColor: 'bg-red-500/20', borderColor: 'border-red-500/30' }
  }
  if (ido.status === 3) return { label: 'Cancelled', color: 'text-red-400', bgColor: 'bg-red-500/20', borderColor: 'border-red-500/30' }
  if (now < ido.startTime) return { label: 'Upcoming', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20', borderColor: 'border-yellow-500/30' }
  if (now > ido.endTime) return { label: 'Ended', color: 'text-gray-400', bgColor: 'bg-gray-500/20', borderColor: 'border-gray-500/30' }
  return { label: 'Sale Live', color: 'text-green-400', bgColor: 'bg-green-500/20', borderColor: 'border-green-500/30' }
}

export function IDOCard({ ido, onSelect }: IDOCardProps) {
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
    <div 
      onClick={onSelect}
      className="group relative bg-gradient-to-br from-[#1a1a2e] to-[#16162a] rounded-2xl border border-white/5 hover:border-purple-500/30 transition-all duration-300 overflow-hidden cursor-pointer"
    >
        {/* Glow Effect on Hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-pink-500/0 group-hover:from-purple-500/5 group-hover:to-pink-500/5 transition-all duration-300" />
        
        {/* Status Badge - Top Right */}
        <div className="absolute top-3 right-3 z-10">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${status.bgColor} border ${status.borderColor}`}>
            {isLive && <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />}
            <span className={`text-xs font-semibold ${status.color}`}>{status.label}</span>
          </div>
        </div>

        {/* Card Header with Banner */}
        <div className="relative h-24 sm:h-28 bg-gradient-to-r from-purple-600/30 via-pink-500/20 to-purple-600/30">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />

          {/* Badges */}
          <div className="absolute bottom-2 right-3 flex gap-1.5">
            {isPrivate && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-500/30 backdrop-blur-sm">
                <Lock className="w-3 h-3 text-purple-300" />
                <span className="text-[10px] text-purple-200 font-medium">Private</span>
              </div>
            )}
            {hasOverflow && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-orange-500/30 backdrop-blur-sm">
                <Percent className="w-3 h-3 text-orange-300" />
                <span className="text-[10px] text-orange-200 font-medium">{ido.overflowPercent.toFixed(0)}%</span>
              </div>
            )}
          </div>
        </div>

        {/* Token Logo - positioned to overlap header */}
        <div className="absolute top-[4.5rem] sm:top-20 left-4 z-20">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 p-0.5 shadow-lg shadow-purple-500/30">
            <div className="w-full h-full rounded-2xl bg-[#1a1a2e] flex items-center justify-center text-2xl sm:text-3xl">
              🚀
            </div>
          </div>
        </div>

        {/* Card Content */}
        <div className="relative p-4 pt-8">
          {/* Token Name & Symbol */}
          <div className="mb-4">
            <h3 className="text-lg sm:text-xl font-bold text-white group-hover:text-purple-300 transition-colors">
              {ido.name}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5 truncate">
              {ido.saleToken.slice(0, 6)}...{ido.saleToken.slice(-4)}
            </p>
          </div>

          {/* Progress Section */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-gray-400">Progress</span>
              <span className={`text-sm font-bold ${hasOverflow ? 'text-orange-400' : progress >= 100 ? 'text-green-400' : 'text-white'}`}>
                {progress.toFixed(1)}%
              </span>
            </div>
            <div className="h-2.5 bg-[#0d0d15] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  hasOverflow 
                    ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500' 
                    : 'bg-gradient-to-r from-purple-500 to-pink-500'
                }`}
                style={{ width: `${Math.min(100, progress)}%` }}
              />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-[10px] text-gray-500">{formatNum(totalCommittedNum)} MON</span>
              <span className="text-[10px] text-gray-500">{formatNum(hardCapNum)} MON</span>
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="bg-white/[0.02] rounded-xl p-2.5 border border-white/5">
              <p className="text-[10px] text-gray-500 mb-0.5">Soft Cap</p>
              <p className="text-sm font-semibold text-white">{formatNum(parseFloat(ido.softCap))} MON</p>
            </div>
            <div className="bg-white/[0.02] rounded-xl p-2.5 border border-white/5">
              <p className="text-[10px] text-gray-500 mb-0.5">Hard Cap</p>
              <p className="text-sm font-semibold text-white">{formatNum(hardCapNum)} MON</p>
            </div>
            <div className="bg-white/[0.02] rounded-xl p-2.5 border border-white/5">
              <div className="flex items-center gap-1 mb-0.5">
                <Users className="w-3 h-3 text-gray-500" />
                <p className="text-[10px] text-gray-500">Participants</p>
              </div>
              <p className="text-sm font-semibold text-white">{ido.totalParticipants}</p>
            </div>
            <div className="bg-white/[0.02] rounded-xl p-2.5 border border-white/5">
              <div className="flex items-center gap-1 mb-0.5">
                <Clock className="w-3 h-3 text-gray-500" />
                <p className="text-[10px] text-gray-500">{isUpcoming ? 'Starts In' : isLive ? 'Ends In' : 'Status'}</p>
              </div>
              <p className={`text-sm font-semibold ${isLive ? 'text-green-400' : isUpcoming ? 'text-yellow-400' : 'text-gray-400'}`}>
                {isUpcoming ? formatTimeRemaining(ido.startTime) : isLive ? formatTimeRemaining(ido.endTime) : status.label}
              </p>
            </div>
          </div>

          {/* Overflow Warning */}
          {hasOverflow && isLive && (
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-2.5 mb-4">
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-orange-300">
                  Overflow active! Your allocation will be calculated proportionally.
                </p>
              </div>
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={(e) => { e.stopPropagation(); onSelect(); }}
            className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-1.5 ${
              isLive
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-500/20'
                : isUpcoming
                  ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                  : 'bg-gray-600/20 text-gray-500 border border-gray-500/30'
            }`}
          >
            {isLive ? (
              <><Zap className="w-4 h-4" />View & Buy</>
            ) : isUpcoming ? (
              <><Clock className="w-4 h-4" />Coming Soon</>
            ) : (
              'View Details'
            )}
          </button>
        </div>
    </div>
  )
}
