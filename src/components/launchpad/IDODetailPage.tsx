import { useState, useEffect } from 'react'
import { 
  ArrowLeft, Globe, FileText, Send, Rocket, ExternalLink, Copy, Check, 
  Clock, Users, TrendingUp, Shield, Zap, AlertTriangle, Gift, Calendar,
  Target, Coins, Award, ChevronRight, RefreshCw
} from 'lucide-react'
import { useAccount, useReadContract, useBalance } from 'wagmi'
import { formatUnits } from 'viem'
import { useIDOPool, IDO_POOL_ABI } from '../../hooks/useIDOFactory'
import type { ExtendedIDO } from './LaunchpadPage'

interface IDODetailPageProps {
  ido: ExtendedIDO
  onBack: () => void
}

function formatNum(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(2)}K`
  return num.toLocaleString('en-US', { maximumFractionDigits: 2 })
}

function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

function getIDOStatus(ido: ExtendedIDO): { label: string; color: string; bgColor: string; icon: typeof Clock } {
  const now = Math.floor(Date.now() / 1000)
  if (ido.status === 2) {
    const softCapReached = parseFloat(ido.totalCommitted) >= parseFloat(ido.softCap)
    return softCapReached
      ? { label: 'Successful', color: 'text-emerald-400', bgColor: 'bg-emerald-500/20', icon: Check }
      : { label: 'Refunded', color: 'text-red-400', bgColor: 'bg-red-500/20', icon: AlertTriangle }
  }
  if (ido.status === 3) return { label: 'Cancelled', color: 'text-red-400', bgColor: 'bg-red-500/20', icon: AlertTriangle }
  if (now < ido.startTime) return { label: 'Upcoming', color: 'text-amber-400', bgColor: 'bg-amber-500/20', icon: Clock }
  if (now > ido.endTime) return { label: 'Ended', color: 'text-gray-400', bgColor: 'bg-gray-500/20', icon: Clock }
  return { label: 'Live Now', color: 'text-emerald-400', bgColor: 'bg-emerald-500/20', icon: Zap }
}

export function IDODetailPage({ ido, onBack }: IDODetailPageProps) {
  const { address, isConnected } = useAccount()
  const [timeLeft, setTimeLeft] = useState('')
  const [copied, setCopied] = useState(false)
  const [amount, setAmount] = useState('')
  const [activeTab, setActiveTab] = useState<'overview' | 'tokenomics' | 'schedule'>('overview')

  const { deposit, claim, claimRefund, isProcessing, statusMessage } = useIDOPool(ido.poolAddress)
  const { data: balance } = useBalance({ address })
  const { data: userInfo, refetch: refetchUser } = useReadContract({
    address: ido.poolAddress, abi: IDO_POOL_ABI, functionName: 'getUserInfo',
    args: address ? [address] : undefined, query: { enabled: !!address }
  })
  const { data: estimation } = useReadContract({
    address: ido.poolAddress, abi: IDO_POOL_ABI, functionName: 'estimateAllocation',
    args: address ? [address] : undefined, query: { enabled: !!address }
  })

  const userDeposited = userInfo ? formatUnits(userInfo[0] as bigint, 18) : '0'
  const userRefund = userInfo ? formatUnits(userInfo[2] as bigint, 18) : '0'
  const userClaimable = userInfo ? formatUnits(userInfo[4] as bigint, 18) : '0'
  const hasClaimedRefund = userInfo ? userInfo[5] as boolean : false
  const estimatedTokens = estimation ? formatUnits(estimation[0] as bigint, 18) : '0'
  const estimatedRefund = estimation ? formatUnits(estimation[1] as bigint, 18) : '0'
  
  const status = getIDOStatus(ido)
  const StatusIcon = status.icon
  const hardCapNum = parseFloat(ido.hardCap) || 1
  const softCapNum = parseFloat(ido.softCap) || 0
  const totalCommittedNum = parseFloat(ido.totalCommitted) || 0
  const tokenPrice = parseFloat(ido.tokenPrice) || 0
  const tokensForSale = parseFloat(ido.tokensForSale) || 0
  const progress = Math.min((totalCommittedNum / hardCapNum) * 100, 100)
  const softCapProgress = Math.min((totalCommittedNum / softCapNum) * 100, 100)
  const hasOverflow = totalCommittedNum > hardCapNum
  const now = Math.floor(Date.now() / 1000)
  const isLive = now >= ido.startTime && now <= ido.endTime && ido.isActive
  const isUpcoming = now < ido.startTime && ido.isActive
  const isEnded = now > ido.endTime || ido.status === 2
  const isPrivate = ido.poolType === 1
  const amountNum = parseFloat(amount) || 0
  const tokensToReceive = tokenPrice > 0 ? amountNum / tokenPrice : 0

  useEffect(() => {
    const formatTime = (targetTime: number): string => {
      const remaining = targetTime - Math.floor(Date.now() / 1000)
      if (remaining <= 0) return '0d 0h 0m 0s'
      const days = Math.floor(remaining / 86400)
      const hours = Math.floor((remaining % 86400) / 3600)
      const minutes = Math.floor((remaining % 3600) / 60)
      const seconds = remaining % 60
      return `${days}d ${hours}h ${minutes}m ${seconds}s`
    }
    const interval = setInterval(() => {
      if (isUpcoming) setTimeLeft(formatTime(ido.startTime))
      else if (isLive) setTimeLeft(formatTime(ido.endTime))
    }, 1000)
    if (isUpcoming) setTimeLeft(formatTime(ido.startTime))
    else if (isLive) setTimeLeft(formatTime(ido.endTime))
    return () => clearInterval(interval)
  }, [ido, isLive, isUpcoming])

  const copyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDeposit = async () => {
    if (!amount || amountNum <= 0) return
    const result = await deposit(amount)
    if (result.success) { refetchUser(); setAmount('') }
  }

  const handleClaim = async () => {
    const result = await claim()
    if (result.success) refetchUser()
  }

  const handleClaimRefund = async () => {
    const result = await claimRefund()
    if (result.success) refetchUser()
  }

  const handleMax = () => {
    if (balance) setAmount(formatUnits(balance.value, 18))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a12] via-[#0d0d18] to-[#0a0a12]">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-1/3 -right-20 w-[400px] h-[400px] bg-pink-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-1/3 w-[600px] h-[300px] bg-blue-500/5 rounded-full blur-[150px]" />
      </div>

      {/* Header */}
      <div className="relative z-10 border-b border-white/5 bg-black/20 backdrop-blur-xl sticky top-0">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group">
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back to Launchpad</span>
          </button>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${status.bgColor} border border-white/10`}>
            <StatusIcon className={`w-4 h-4 ${status.color}`} />
            <span className={`text-sm font-semibold ${status.color}`}>{status.label}</span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12">
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* Left - Token Info */}
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 p-1 shadow-2xl shadow-purple-500/30">
                  <div className="w-full h-full rounded-xl bg-[#12121a] flex items-center justify-center">
                    <Rocket className="w-10 h-10 sm:w-12 sm:h-12 text-purple-400" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {isPrivate && (
                      <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 text-xs font-medium">Private</span>
                    )}
                    <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 text-xs font-medium flex items-center gap-1">
                      <Shield className="w-3 h-3" /> Verified
                    </span>
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-white">{ido.name}</h1>
                  <p className="text-gray-400 mt-1">{isPrivate ? 'Tier-based Allocation' : 'First Come First Serve'}</p>
                </div>
              </div>

              {/* Countdown Timer */}
              {(isLive || isUpcoming) && (
                <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl p-4 sm:p-6 border border-purple-500/20 mb-6">
                  <p className="text-sm text-gray-400 mb-2">{isUpcoming ? '🚀 Sale Starts In' : '⏰ Sale Ends In'}</p>
                  <div className="flex gap-3 sm:gap-4">
                    {timeLeft.split(' ').map((part, i) => (
                      <div key={i} className="text-center">
                        <div className="bg-black/40 rounded-xl px-3 sm:px-4 py-2 sm:py-3 min-w-[60px] sm:min-w-[70px]">
                          <span className="text-2xl sm:text-3xl font-bold text-white">{part.replace(/[dhms]/g, '')}</span>
                        </div>
                        <span className="text-xs text-gray-500 mt-1 block">{part.includes('d') ? 'Days' : part.includes('h') ? 'Hours' : part.includes('m') ? 'Mins' : 'Secs'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                  <div className="flex items-center gap-2 text-gray-400 mb-1">
                    <Target className="w-4 h-4" />
                    <span className="text-xs">Hard Cap</span>
                  </div>
                  <p className="text-lg font-bold text-white">{formatNum(hardCapNum)} MON</p>
                </div>
                <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                  <div className="flex items-center gap-2 text-gray-400 mb-1">
                    <Coins className="w-4 h-4" />
                    <span className="text-xs">Token Price</span>
                  </div>
                  <p className="text-lg font-bold text-white">{tokenPrice.toFixed(6)} MON</p>
                </div>
                <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                  <div className="flex items-center gap-2 text-gray-400 mb-1">
                    <Users className="w-4 h-4" />
                    <span className="text-xs">Participants</span>
                  </div>
                  <p className="text-lg font-bold text-white">{ido.totalParticipants}</p>
                </div>
                <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                  <div className="flex items-center gap-2 text-gray-400 mb-1">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-xs">Total Raised</span>
                  </div>
                  <p className="text-lg font-bold text-emerald-400">{formatNum(totalCommittedNum)} MON</p>
                </div>
              </div>
            </div>

            {/* Right - Contribute Card */}
            <div className="w-full lg:w-[420px] shrink-0">
              <div className="bg-gradient-to-br from-[#1a1a2e] to-[#12121a] rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
                {/* Progress Header */}
                <div className="p-5 border-b border-white/5">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm text-gray-400">Sale Progress</span>
                    <span className={`text-sm font-bold ${hasOverflow ? 'text-orange-400' : 'text-white'}`}>
                      {progress.toFixed(1)}% {hasOverflow && '(Overflow!)'}
                    </span>
                  </div>
                  <div className="h-3 bg-black/40 rounded-full overflow-hidden mb-2">
                    <div 
                      className={`h-full rounded-full transition-all duration-700 ${hasOverflow ? 'bg-gradient-to-r from-emerald-500 via-amber-500 to-orange-500' : 'bg-gradient-to-r from-purple-500 to-pink-500'}`}
                      style={{ width: `${Math.min(100, progress)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{formatNum(totalCommittedNum)} MON raised</span>
                    <span>Goal: {formatNum(hardCapNum)} MON</span>
                  </div>
                  {/* Soft Cap Indicator */}
                  <div className="flex items-center gap-2 mt-3 text-xs">
                    <div className={`w-2 h-2 rounded-full ${softCapProgress >= 100 ? 'bg-emerald-500' : 'bg-gray-600'}`} />
                    <span className={softCapProgress >= 100 ? 'text-emerald-400' : 'text-gray-500'}>
                      Soft Cap: {formatNum(softCapNum)} MON {softCapProgress >= 100 && '✓'}
                    </span>
                  </div>
                </div>

                {/* Contribute Section */}
                <div className="p-5">
                  {isLive && isConnected && (
                    <>
                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-gray-400">Amount to contribute</span>
                          <button onClick={handleMax} className="text-xs text-purple-400 hover:text-purple-300 transition-colors">
                            Max: {balance ? parseFloat(formatUnits(balance.value, 18)).toFixed(4) : '0'} MON
                          </button>
                        </div>
                        <div className="bg-black/30 rounded-xl p-3 border border-white/5 focus-within:border-purple-500/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <input
                              type="number"
                              value={amount}
                              onChange={(e) => setAmount(e.target.value)}
                              placeholder="0.0"
                              className="flex-1 bg-transparent text-2xl text-white outline-none placeholder-gray-600"
                            />
                            <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
                              <span className="text-lg">⛽</span>
                              <span className="font-semibold text-white">MON</span>
                            </div>
                          </div>
                        </div>
                        {/* Quick Amount Buttons */}
                        <div className="flex gap-2 mt-3">
                          {[25, 50, 75, 100].map((pct) => (
                            <button
                              key={pct}
                              onClick={() => balance && setAmount((parseFloat(formatUnits(balance.value, 18)) * pct / 100).toString())}
                              className="flex-1 py-2 text-xs font-medium bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-lg transition-all"
                            >
                              {pct}%
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Estimated Tokens */}
                      {amountNum > 0 && (
                        <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/20 mb-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-400">You will receive</span>
                            <span className="text-xl font-bold text-emerald-400">~{formatNum(tokensToReceive)} Tokens</span>
                          </div>
                          {hasOverflow && (
                            <p className="text-xs text-orange-400 mt-2 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              Final allocation may vary due to overflow
                            </p>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {/* User Stats */}
                  {parseFloat(userDeposited) > 0 && (
                    <div className="bg-purple-500/10 rounded-xl p-4 border border-purple-500/20 mb-4">
                      <h4 className="text-sm font-semibold text-purple-300 mb-3">Your Position</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Deposited</span>
                          <span className="text-white font-medium">{formatNum(parseFloat(userDeposited))} MON</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Est. Allocation</span>
                          <span className="text-emerald-400 font-medium">{formatNum(parseFloat(estimatedTokens))} Tokens</span>
                        </div>
                        {parseFloat(estimatedRefund) > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Est. Refund</span>
                            <span className="text-orange-400 font-medium">{formatNum(parseFloat(estimatedRefund))} MON</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Status Message */}
                  {statusMessage && (
                    <div className={`rounded-xl p-3 mb-4 text-sm ${statusMessage.includes('✅') ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : statusMessage.includes('❌') ? 'bg-red-500/10 border border-red-500/30 text-red-400' : 'bg-blue-500/10 border border-blue-500/30 text-blue-400'}`}>
                      {isProcessing && <RefreshCw className="w-4 h-4 inline-block animate-spin mr-2" />}
                      {statusMessage}
                    </div>
                  )}

                  {/* Action Buttons */}
                  {!isConnected ? (
                    <button className="w-full py-4 bg-gray-600/50 rounded-xl text-gray-400 font-semibold cursor-not-allowed">
                      Connect Wallet to Participate
                    </button>
                  ) : isLive ? (
                    <button
                      onClick={handleDeposit}
                      disabled={isProcessing || !amount || amountNum <= 0}
                      className={`w-full py-4 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 ${
                        isProcessing || !amount || amountNum <= 0
                          ? 'bg-gray-600/50 cursor-not-allowed'
                          : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50'
                      }`}
                    >
                      {isProcessing ? (
                        <><RefreshCw className="w-5 h-5 animate-spin" />Processing...</>
                      ) : (
                        <><Zap className="w-5 h-5" />Contribute Now</>
                      )}
                    </button>
                  ) : isEnded && parseFloat(userDeposited) > 0 ? (
                    <div className="space-y-3">
                      {parseFloat(userClaimable) > 0 && (
                        <button onClick={handleClaim} disabled={isProcessing} className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                          <Gift className="w-5 h-5" />Claim {formatNum(parseFloat(userClaimable))} Tokens
                        </button>
                      )}
                      {parseFloat(userRefund) > 0 && !hasClaimedRefund && (
                        <button onClick={handleClaimRefund} disabled={isProcessing} className="w-full py-4 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 rounded-xl font-bold text-orange-400 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                          Claim {formatNum(parseFloat(userRefund))} MON Refund
                        </button>
                      )}
                    </div>
                  ) : (
                    <button className="w-full py-4 bg-gray-600/50 rounded-xl text-gray-400 font-semibold cursor-not-allowed">
                      {isUpcoming ? 'Sale Not Started Yet' : 'Sale Has Ended'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="relative z-10 border-t border-white/5 bg-black/20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 py-2">
            {(['overview', 'tokenomics', 'schedule'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 rounded-lg text-sm font-medium transition-all capitalize ${
                  activeTab === tab
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* About Project */}
            <div className="lg:col-span-2 bg-white/[0.02] rounded-2xl p-6 border border-white/5">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Rocket className="w-5 h-5 text-purple-400" />
                About {ido.name}
              </h3>
              <p className="text-gray-400 leading-relaxed mb-6">
                A groundbreaking project launching on Monad blockchain. This innovative token offers unique utility and benefits for early participants. Join the community and be part of the next generation of decentralized applications on the fastest EVM-compatible blockchain.
              </p>
              <div className="flex flex-wrap gap-3">
                <a href="#" className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-300 hover:text-white transition-all">
                  <Globe className="w-4 h-4" />Website
                  <ChevronRight className="w-4 h-4" />
                </a>
                <a href="#" className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-300 hover:text-white transition-all">
                  <FileText className="w-4 h-4" />Whitepaper
                  <ChevronRight className="w-4 h-4" />
                </a>
                <a href="#" className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-300 hover:text-white transition-all">
                  <Send className="w-4 h-4" />Telegram
                  <ChevronRight className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Contract Info */}
            <div className="bg-white/[0.02] rounded-2xl p-6 border border-white/5">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-400" />
                Contract Details
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Token Contract</p>
                  <div className="flex items-center gap-2 bg-black/30 rounded-lg p-2">
                    <code className="text-xs text-gray-300 flex-1 truncate">{ido.saleToken}</code>
                    <button onClick={() => copyAddress(ido.saleToken)} className="text-purple-400 hover:text-purple-300 p-1">
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <a href={`https://explorer.monad.xyz/address/${ido.saleToken}`} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 p-1">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Pool Contract</p>
                  <div className="flex items-center gap-2 bg-black/30 rounded-lg p-2">
                    <code className="text-xs text-gray-300 flex-1 truncate">{ido.poolAddress}</code>
                    <a href={`https://explorer.monad.xyz/address/${ido.poolAddress}`} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 p-1">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tokenomics' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white/[0.02] rounded-2xl p-6 border border-white/5">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                Token Distribution
              </h3>
              <div className="space-y-4">
                {[
                  { label: 'IDO Sale', percent: 40, color: 'bg-purple-500' },
                  { label: 'Liquidity Pool', percent: 30, color: 'bg-blue-500' },
                  { label: 'Team & Advisors', percent: 15, color: 'bg-pink-500' },
                  { label: 'Marketing', percent: 10, color: 'bg-amber-500' },
                  { label: 'Reserve', percent: 5, color: 'bg-emerald-500' },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">{item.label}</span>
                      <span className="text-white font-medium">{item.percent}%</span>
                    </div>
                    <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                      <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.percent}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white/[0.02] rounded-2xl p-6 border border-white/5">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Coins className="w-5 h-5 text-emerald-400" />
                Token Metrics
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-black/20 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">Total Supply</p>
                  <p className="text-lg font-bold text-white">{formatNum(tokensForSale * 2.5)}</p>
                </div>
                <div className="bg-black/20 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">For Sale</p>
                  <p className="text-lg font-bold text-white">{formatNum(tokensForSale)}</p>
                </div>
                <div className="bg-black/20 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">Initial Market Cap</p>
                  <p className="text-lg font-bold text-white">{formatNum(tokensForSale * tokenPrice * 0.4)}</p>
                </div>
                <div className="bg-black/20 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">FDV</p>
                  <p className="text-lg font-bold text-white">{formatNum(tokensForSale * 2.5 * tokenPrice)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'schedule' && (
          <div className="bg-white/[0.02] rounded-2xl p-6 border border-white/5 max-w-2xl">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-400" />
              Sale Schedule
            </h3>
            <div className="space-y-6">
              {[
                { title: 'Sale Start', time: ido.startTime, done: now >= ido.startTime },
                { title: 'Sale End', time: ido.endTime, done: now >= ido.endTime },
                { title: 'Token Distribution', time: ido.endTime + 3600, done: false, desc: '20% TGE, 80% vested over 180 days' },
              ].map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${item.done ? 'bg-emerald-500/20' : 'bg-gray-500/20'}`}>
                      {item.done ? <Check className="w-5 h-5 text-emerald-400" /> : <Clock className="w-5 h-5 text-gray-400" />}
                    </div>
                    {i < 2 && <div className="w-0.5 h-12 bg-white/10 mt-2" />}
                  </div>
                  <div className="flex-1 pb-6">
                    <p className={`font-semibold ${item.done ? 'text-emerald-400' : 'text-white'}`}>{item.title}</p>
                    <p className="text-sm text-gray-400">{formatDate(item.time)}</p>
                    {item.desc && <p className="text-xs text-gray-500 mt-1">{item.desc}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
