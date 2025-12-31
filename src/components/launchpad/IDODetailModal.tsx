import { useState, useEffect } from 'react'
import { 
  X, Clock, Lock, Percent, Globe, Send, FileText, 
  Copy, Check, Shield, Zap, Sparkles, AlertTriangle, Calendar,
  Coins, Target, Award, ArrowLeft
} from 'lucide-react'
import type { ExtendedIDO } from './LaunchpadPage'

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
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

function formatTimeRemaining(targetTime: number): string {
  const now = Math.floor(Date.now() / 1000)
  const remaining = targetTime - now
  if (remaining <= 0) return 'Ended'
  const days = Math.floor(remaining / 86400)
  const hours = Math.floor((remaining % 86400) / 3600)
  const minutes = Math.floor((remaining % 3600) / 60)
  const seconds = Math.floor(remaining % 60)
  if (days > 0) return `${days}d ${hours}h ${minutes}m`
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`
  return `${minutes}m ${seconds}s`
}

function getIDOStatus(ido: ExtendedIDO): { label: string; color: string; bgColor: string } {
  const now = Math.floor(Date.now() / 1000)
  if (ido.status === 2) {
    const softCapReached = parseFloat(ido.totalCommitted) >= parseFloat(ido.softCap)
    return softCapReached
      ? { label: 'Successful', color: 'text-green-400', bgColor: 'bg-green-500/20' }
      : { label: 'Failed', color: 'text-red-400', bgColor: 'bg-red-500/20' }
  }
  if (ido.status === 3) return { label: 'Cancelled', color: 'text-red-400', bgColor: 'bg-red-500/20' }
  if (now < ido.startTime) return { label: 'Upcoming', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' }
  if (now > ido.endTime) return { label: 'Ended', color: 'text-gray-400', bgColor: 'bg-gray-500/20' }
  return { label: 'Sale Live', color: 'text-green-400', bgColor: 'bg-green-500/20' }
}
export function IDODetailModal({ ido, onClose, onContribute }: IDODetailModalProps) {
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
    const interval = setInterval(() => {
      if (isUpcoming) {
        setTimeLeft(formatTimeRemaining(ido.startTime))
      } else if (isLive) {
        setTimeLeft(formatTimeRemaining(ido.endTime))
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [ido, isLive, isUpcoming])

  const copyAddress = () => {
    navigator.clipboard.writeText(ido.saleToken)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-4xl my-8 bg-gradient-to-br from-[#12121a] to-[#0d0d15] rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
        <div className="relative h-40 sm:h-48 bg-gradient-to-r from-purple-600/40 via-pink-500/30 to-purple-600/40 overflow-hidden">
          <button onClick={onClose} className="absolute top-4 left-4 p-2 rounded-xl bg-black/30 hover:bg-black/50 backdrop-blur-sm transition-all"><ArrowLeft className="w-5 h-5 text-white" /></button>
          <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-xl bg-black/30 hover:bg-black/50 backdrop-blur-sm transition-all"><X className="w-5 h-5 text-white" /></button>
          <div className="absolute -bottom-10 left-6 sm:left-8"><div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 p-1 shadow-xl shadow-purple-500/30"><div className="w-full h-full rounded-2xl bg-[#12121a] flex items-center justify-center text-4xl sm:text-5xl"></div></div></div>
          <div className="absolute bottom-4 right-4 sm:right-6"><div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${status.bgColor} backdrop-blur-sm border border-white/10`}>{isLive && <span className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse" />}<span className={`text-sm font-bold ${status.color}`}>{status.label}</span></div></div>
        </div>
        <div className="p-6 sm:p-8 pt-14 sm:pt-16">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">{ido.name}</h1>
              <div className="flex flex-wrap items-center gap-2">
                {isPrivate && <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 text-xs font-medium"><Lock className="w-3 h-3" /> Private Sale</span>}
                {hasOverflow && <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-500/20 text-orange-300 text-xs font-medium"><Percent className="w-3 h-3" /> Overflow: {ido.overflowPercent.toFixed(0)}%</span>}
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-300 text-xs font-medium"><Shield className="w-3 h-3" /> Verified</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all"><Globe className="w-4 h-4 text-gray-400" /></button>
              <button className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all"><Send className="w-4 h-4 text-gray-400" /></button>
              <button className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all"><FileText className="w-4 h-4 text-gray-400" /></button>
            </div>
          </div>
          <div className="bg-white/[0.02] rounded-2xl p-5 border border-white/5 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div><p className="text-sm text-gray-400 mb-1">Total Raised</p><p className="text-2xl sm:text-3xl font-bold text-white">{formatNum(totalCommittedNum)} <span className="text-lg text-gray-400">MON</span></p></div>
              <div className="text-right"><p className="text-sm text-gray-400 mb-1">{isUpcoming ? 'Starts In' : isLive ? 'Ends In' : 'Status'}</p><p className={`text-xl sm:text-2xl font-bold ${isLive ? 'text-green-400' : isUpcoming ? 'text-yellow-400' : 'text-gray-400'}`}>{isUpcoming || isLive ? timeLeft : status.label}</p></div>
            </div>
            <div className="mb-3"><div className="h-4 bg-[#0d0d15] rounded-full overflow-hidden"><div className={`h-full rounded-full transition-all duration-500 ${hasOverflow ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500' : 'bg-gradient-to-r from-purple-500 to-pink-500'}`} style={{ width: `${Math.min(100, progress)}%` }} /></div></div>
            <div className="flex justify-between text-sm"><span className="text-gray-400">{progress.toFixed(2)}%</span><span className="text-gray-400">{formatNum(hardCapNum)} MON</span></div>
            <div className="flex items-center gap-2 mt-3"><div className={`w-3 h-3 rounded-full ${softCapReached ? 'bg-green-500' : 'bg-gray-600'}`} /><span className={`text-sm ${softCapReached ? 'text-green-400' : 'text-gray-500'}`}>Soft Cap: {formatNum(softCapNum)} MON {softCapReached && ''}</span></div>
          </div>
          <div className="flex gap-2 mb-6 p-1 bg-white/[0.02] rounded-xl border border-white/5">
            {(['info', 'tokenomics', 'schedule'] as const).map((tab) => (<button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all capitalize ${activeTab === tab ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>{tab}</button>))}
          </div>
          {activeTab === 'info' && (
            <div className="space-y-4">
              <div className="bg-white/[0.02] rounded-2xl p-5 border border-white/5">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Coins className="w-5 h-5 text-purple-400" />Token Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex justify-between items-center py-2 border-b border-white/5"><span className="text-gray-400 text-sm">Token Address</span><button onClick={copyAddress} className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors"><span className="text-sm font-mono">{ido.saleToken.slice(0, 8)}...{ido.saleToken.slice(-6)}</span>{copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}</button></div>
                  <div className="flex justify-between items-center py-2 border-b border-white/5"><span className="text-gray-400 text-sm">Pool Address</span><span className="text-white text-sm font-mono">{ido.poolAddress.slice(0, 8)}...{ido.poolAddress.slice(-6)}</span></div>
                  <div className="flex justify-between items-center py-2 border-b border-white/5"><span className="text-gray-400 text-sm">Token Price</span><span className="text-white text-sm font-semibold">{parseFloat(ido.tokenPrice).toFixed(6)} MON</span></div>
                  <div className="flex justify-between items-center py-2 border-b border-white/5"><span className="text-gray-400 text-sm">Tokens For Sale</span><span className="text-white text-sm font-semibold">{formatNum(parseFloat(ido.tokensForSale))}</span></div>
                </div>
              </div>
              <div className="bg-white/[0.02] rounded-2xl p-5 border border-white/5">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Target className="w-5 h-5 text-pink-400" />Pool Details</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-white/[0.02] rounded-xl p-3 text-center"><p className="text-xs text-gray-500 mb-1">Soft Cap</p><p className="text-lg font-bold text-white">{formatNum(softCapNum)}</p><p className="text-xs text-gray-500">MON</p></div>
                  <div className="bg-white/[0.02] rounded-xl p-3 text-center"><p className="text-xs text-gray-500 mb-1">Hard Cap</p><p className="text-lg font-bold text-white">{formatNum(hardCapNum)}</p><p className="text-xs text-gray-500">MON</p></div>
                  <div className="bg-white/[0.02] rounded-xl p-3 text-center"><p className="text-xs text-gray-500 mb-1">Participants</p><p className="text-lg font-bold text-white">{ido.totalParticipants}</p><p className="text-xs text-gray-500">Users</p></div>
                  <div className="bg-white/[0.02] rounded-xl p-3 text-center"><p className="text-xs text-gray-500 mb-1">Pool Type</p><p className="text-lg font-bold text-white">{isPrivate ? 'Private' : 'Public'}</p><p className="text-xs text-gray-500">Sale</p></div>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'tokenomics' && (
            <div className="bg-white/[0.02] rounded-2xl p-5 border border-white/5">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Award className="w-5 h-5 text-yellow-400" />Tokenomics</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl"><span className="text-gray-400">IDO Sale</span><span className="text-white font-semibold">40%</span></div>
                <div className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl"><span className="text-gray-400">Liquidity</span><span className="text-white font-semibold">30%</span></div>
                <div className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl"><span className="text-gray-400">Team</span><span className="text-white font-semibold">15%</span></div>
                <div className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl"><span className="text-gray-400">Marketing</span><span className="text-white font-semibold">10%</span></div>
                <div className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl"><span className="text-gray-400">Reserve</span><span className="text-white font-semibold">5%</span></div>
              </div>
            </div>
          )}
          {activeTab === 'schedule' && (
            <div className="bg-white/[0.02] rounded-2xl p-5 border border-white/5">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Calendar className="w-5 h-5 text-blue-400" />Sale Schedule</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-4"><div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${now >= ido.startTime ? 'bg-green-500/20' : 'bg-gray-500/20'}`}><Clock className={`w-5 h-5 ${now >= ido.startTime ? 'text-green-400' : 'text-gray-400'}`} /></div><div><p className="text-white font-semibold">Sale Start</p><p className="text-gray-400 text-sm">{formatDate(ido.startTime)}</p></div></div>
                <div className="w-0.5 h-8 bg-white/10 ml-5" />
                <div className="flex items-start gap-4"><div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${now >= ido.endTime ? 'bg-green-500/20' : 'bg-gray-500/20'}`}><Clock className={`w-5 h-5 ${now >= ido.endTime ? 'text-green-400' : 'text-gray-400'}`} /></div><div><p className="text-white font-semibold">Sale End</p><p className="text-gray-400 text-sm">{formatDate(ido.endTime)}</p></div></div>
                <div className="w-0.5 h-8 bg-white/10 ml-5" />
                <div className="flex items-start gap-4"><div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-gray-500/20"><Sparkles className="w-5 h-5 text-gray-400" /></div><div><p className="text-white font-semibold">Token Distribution</p><p className="text-gray-400 text-sm">After sale ends</p></div></div>
              </div>
            </div>
          )}
          {hasOverflow && isLive && (
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4 mt-6">
              <div className="flex items-start gap-3"><AlertTriangle className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" /><div><p className="text-orange-300 font-semibold mb-1">Overflow Mode Active</p><p className="text-orange-200/70 text-sm">This sale has exceeded its hard cap. Your final allocation will be calculated proportionally based on your contribution. Excess funds will be refunded.</p></div></div>
            </div>
          )}
          <div className="mt-6">
            <button onClick={() => { onClose(); onContribute(); }} disabled={!isLive} className={`w-full py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${isLive ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-500/30' : isUpcoming ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 cursor-not-allowed' : 'bg-gray-600/20 text-gray-500 border border-gray-500/30 cursor-not-allowed'}`}>
              {isLive ? (<><Zap className="w-5 h-5" />Contribute Now</>) : isUpcoming ? (<><Clock className="w-5 h-5" />Sale Starts Soon</>) : ('Sale Ended')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
