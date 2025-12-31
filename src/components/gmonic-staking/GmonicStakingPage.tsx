import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { formatEther } from 'viem'
import { useGmonicStaking, formatTimeUntilUnlock, calculateGmonicAPR } from '../../hooks/useGmonicStaking'
import { ADMIN_ADDRESSES } from '../../config/contracts'
import { 
  Lock, Unlock, TrendingUp, Clock, Coins, AlertTriangle, CheckCircle, 
  Loader2, Sparkles, Shield, Wallet, ArrowRight, Info, Gift, Zap, XCircle
} from 'lucide-react'

export function GmonicStakingPage() {
  const { isConnected, address } = useAccount()
  const [stakeAmount, setStakeAmount] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [activeTab, setActiveTab] = useState<'stake' | 'unstake'>('stake')
  const [showInfo, setShowInfo] = useState(false)
  const [isApproving, setIsApproving] = useState(false)
  const [showEmergencyConfirm, setShowEmergencyConfirm] = useState(false)

  const isAdmin = address?.toLowerCase() === ADMIN_ADDRESSES.MULTIPOOL_STAKING.toLowerCase()

  const {
    poolInfo, userInfo, gmonicBalance,
    approve, deposit, withdraw, harvest, emergencyWithdraw, needsApproval,
    refetch, isPending, isConfirming, isSuccess,
  } = useGmonicStaking(0)

  useEffect(() => {
    if (isSuccess) {
      refetch()
      setStakeAmount('')
      setWithdrawAmount('')
      setIsApproving(false)
      setShowEmergencyConfirm(false)
    }
  }, [isSuccess])

  useEffect(() => {
    const interval = setInterval(refetch, 10000)
    return () => clearInterval(interval)
  }, [])

  const handleStake = async () => {
    if (!stakeAmount || parseFloat(stakeAmount) <= 0) return
    try {
      if (needsApproval(stakeAmount)) {
        setIsApproving(true)
        await approve(stakeAmount)
      } else {
        await deposit(stakeAmount)
      }
    } catch (e) { console.error('Stake error:', e) }
  }

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) return
    try { await withdraw(withdrawAmount) } catch (e) { console.error('Withdraw error:', e) }
  }

  const handleHarvest = async () => {
    try { await harvest() } catch (e) { console.error('Harvest error:', e) }
  }

  const handleEmergencyWithdraw = async () => {
    try { await emergencyWithdraw() } catch (e) { console.error('Emergency withdraw error:', e) }
  }

  const handleMaxStake = () => gmonicBalance && setStakeAmount(formatEther(gmonicBalance))
  const handleMaxWithdraw = () => userInfo && setWithdrawAmount(formatEther(userInfo.amount))

  // APR multiplied by 100 for display (3% -> 300%)
  const apr = poolInfo ? calculateGmonicAPR(poolInfo.rewardPerSecond, poolInfo.totalStaked) * 100 : 0
  const isEstimatedAPR = poolInfo ? poolInfo.totalStaked === 0n : true
  const isLoading = isPending || isConfirming
  const totalStaked = poolInfo ? Number(formatEther(poolInfo.totalStaked)) : 0
  const userStaked = userInfo ? Number(formatEther(userInfo.amount)) : 0
  const pendingRewards = userInfo ? Number(formatEther(userInfo.pendingReward)) : 0
  const walletBalance = gmonicBalance ? Number(formatEther(gmonicBalance)) : 0

  return (
    <div className="w-full max-w-5xl mx-auto px-3 sm:px-4 md:px-6 py-2 sm:py-4 space-y-3 sm:space-y-4 md:space-y-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-xl sm:rounded-2xl md:rounded-3xl bg-gradient-to-br from-emerald-900/60 via-cyan-800/40 to-teal-900/60 p-3 sm:p-5 md:p-6 lg:p-8 border border-cyan-500/20">
        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 md:top-4 md:right-4 z-20 flex items-center gap-1.5 sm:gap-2">
          <div className="px-2 py-0.5 sm:px-2.5 sm:py-1 md:px-3 md:py-1.5 rounded-md sm:rounded-lg bg-green-500/20 border border-green-500/30 backdrop-blur-sm">
            <div className="flex items-center gap-1 sm:gap-1.5">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[9px] sm:text-[10px] md:text-xs text-green-400 font-medium">Live</span>
            </div>
          </div>
          <button onClick={() => setShowInfo(!showInfo)} 
            className={`p-1 sm:p-1.5 md:p-2 rounded-md sm:rounded-lg backdrop-blur-sm transition-all ${showInfo ? 'bg-cyan-500/30 border border-cyan-400/50' : 'bg-white/10 hover:bg-white/20 border border-white/10'}`}>
            <Info className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-white/80" />
          </button>
        </div>

        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-8 -right-8 sm:-top-16 sm:-right-16 md:-top-20 md:-right-20 w-24 sm:w-48 md:w-64 h-24 sm:h-48 md:h-64 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-8 -left-8 sm:-bottom-16 sm:-left-16 md:-bottom-20 md:-left-20 w-24 sm:w-48 md:w-64 h-24 sm:h-48 md:h-64 bg-emerald-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2.5 sm:gap-3 md:gap-4 pr-16 sm:pr-20 md:pr-24">
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-lg sm:rounded-xl md:rounded-2xl bg-gradient-to-br from-cyan-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-cyan-500/30 overflow-hidden">
                <img src="/logo.png" alt="gMONIC" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              </div>
              <div className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 bg-green-500 rounded-full flex items-center justify-center">
                <Sparkles className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 text-white" />
              </div>
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl md:text-2xl lg:text-3xl font-bold text-white truncate">Stake gMONIC</h1>
              <p className="text-xs sm:text-sm md:text-base text-cyan-200/80">Earn gMONIC rewards</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2 md:gap-3 lg:gap-4 mt-3 sm:mt-5 md:mt-6 lg:mt-8">
            <div className="bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl md:rounded-2xl p-2 sm:p-3 md:p-4 border border-white/10">
              <div className="flex items-center gap-1 text-cyan-300/70 text-[9px] sm:text-[10px] md:text-xs lg:text-sm mb-0.5">
                <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 flex-shrink-0" />
                <span className="truncate">APR</span>
                {isEstimatedAPR && <span className="text-[7px] sm:text-[8px] text-amber-400 hidden sm:inline">(est)</span>}
              </div>
              <p className="text-sm sm:text-lg md:text-xl lg:text-2xl font-bold text-green-400 truncate">
                {apr.toLocaleString(undefined, { maximumFractionDigits: 0 })}%
              </p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl md:rounded-2xl p-2 sm:p-3 md:p-4 border border-white/10">
              <div className="flex items-center gap-1 text-cyan-300/70 text-[9px] sm:text-[10px] md:text-xs lg:text-sm mb-0.5">
                <Coins className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 flex-shrink-0" />
                <span className="truncate">TVL</span>
              </div>
              <p className="text-sm sm:text-lg md:text-xl lg:text-2xl font-bold text-white truncate">
                {totalStaked.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl md:rounded-2xl p-2 sm:p-3 md:p-4 border border-white/10">
              <div className="flex items-center gap-1 text-cyan-300/70 text-[9px] sm:text-[10px] md:text-xs lg:text-sm mb-0.5">
                <Gift className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 flex-shrink-0" />
                <span className="truncate">Earn</span>
              </div>
              <p className="text-sm sm:text-lg md:text-xl lg:text-2xl font-bold text-white truncate">gMONIC</p>
            </div>
          </div>
        </div>
      </div>

      {/* Info Panel */}
      {showInfo && (
        <div className="bg-gradient-to-r from-cyan-900/30 to-emerald-900/30 rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 border border-cyan-500/20">
          <h3 className="text-sm sm:text-base md:text-lg font-semibold text-white mb-2 sm:mb-3 md:mb-4 flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-cyan-400" />
            How Staking Works
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 md:gap-4">
            {[
              { num: '1', text: 'Stake gMONIC to earn gMONIC rewards' },
              { num: '2', text: '7 days lock for withdraw' },
              { num: '3', text: 'New deposits reset lock timer' },
              { num: '4', text: 'Harvest rewards anytime' },
            ].map((item) => (
              <div key={item.num} className="flex items-start gap-2">
                <div className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 rounded-full bg-cyan-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-[9px] sm:text-[10px] md:text-xs text-cyan-300">{item.num}</span>
                </div>
                <p className="text-gray-300 text-[11px] sm:text-xs md:text-sm leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
        {/* Stake/Unstake Card */}
        <div className="lg:col-span-7 order-1">
          <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/50 rounded-lg sm:rounded-xl md:rounded-2xl border border-white/10 overflow-hidden h-full">
            {/* Tabs */}
            <div className="flex border-b border-white/5">
              <button onClick={() => setActiveTab('stake')}
                className={`flex-1 py-2.5 sm:py-3 md:py-4 px-3 sm:px-4 md:px-6 text-xs sm:text-sm md:text-base font-medium transition-all relative ${activeTab === 'stake' ? 'text-white' : 'text-gray-400 hover:text-white'}`}>
                <span className="flex items-center justify-center gap-1.5 sm:gap-2">
                  <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />Stake
                </span>
                {activeTab === 'stake' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-emerald-500" />}
              </button>
              <button onClick={() => setActiveTab('unstake')}
                className={`flex-1 py-2.5 sm:py-3 md:py-4 px-3 sm:px-4 md:px-6 text-xs sm:text-sm md:text-base font-medium transition-all relative ${activeTab === 'unstake' ? 'text-white' : 'text-gray-400 hover:text-white'}`}>
                <span className="flex items-center justify-center gap-1.5 sm:gap-2">
                  <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />Unstake
                </span>
                {activeTab === 'unstake' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-emerald-500" />}
              </button>
            </div>

            <div className="p-3 sm:p-4 md:p-5 lg:p-6">
              {activeTab === 'stake' ? (
                <div className="space-y-3 sm:space-y-4 md:space-y-5">
                  <div>
                    <label className="text-[10px] sm:text-xs md:text-sm text-gray-400 mb-1 sm:mb-1.5 md:mb-2 block">Amount to Stake</label>
                    <div className="bg-black/30 rounded-lg sm:rounded-xl p-2.5 sm:p-3 md:p-4 border border-white/10 focus-within:border-cyan-500/50 transition-all">
                      <div className="flex items-center gap-2">
                        <input type="number" inputMode="decimal" value={stakeAmount} onChange={(e) => setStakeAmount(e.target.value)} placeholder="0.0"
                          className="flex-1 min-w-0 bg-transparent text-lg sm:text-xl md:text-2xl text-white outline-none placeholder-gray-600 w-full" />
                        <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 flex-shrink-0">
                          <button onClick={handleMaxStake} className="px-1.5 sm:px-2 md:px-3 py-0.5 sm:py-1 md:py-1.5 text-[9px] sm:text-[10px] md:text-xs font-medium text-cyan-400 hover:text-cyan-300 bg-cyan-500/20 hover:bg-cyan-500/30 rounded sm:rounded-md md:rounded-lg transition-all">MAX</button>
                          <div className="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 md:px-3 py-0.5 sm:py-1 md:py-1.5 bg-white/5 rounded sm:rounded-md md:rounded-lg">
                            <img src="/logo.png" alt="gMONIC" className="w-4 h-4 sm:w-5 sm:h-5 rounded-full object-cover" />
                            <span className="text-[10px] sm:text-xs md:text-sm text-white font-medium hidden xs:inline">gMONIC</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-1.5 sm:mt-2 md:mt-3 text-[10px] sm:text-xs md:text-sm text-gray-500">
                        Balance: {walletBalance.toLocaleString(undefined, { maximumFractionDigits: 4 })} gMONIC
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-2 sm:p-3 md:p-4 bg-amber-500/10 rounded-lg sm:rounded-xl border border-amber-500/20">
                    <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-[10px] sm:text-xs md:text-sm text-amber-200/80">Funds locked for 7 days. New deposits reset timer.</p>
                  </div>
                  {!isConnected ? (
                    <div className="text-center py-2.5 sm:py-3 md:py-4 text-xs sm:text-sm text-gray-400 bg-white/5 rounded-lg sm:rounded-xl">Connect wallet to stake</div>
                  ) : (
                    <button onClick={handleStake} disabled={isLoading || !stakeAmount || parseFloat(stakeAmount) <= 0}
                      className="w-full py-2.5 sm:py-3 md:py-4 rounded-lg sm:rounded-xl text-xs sm:text-sm md:text-base font-semibold bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white transition-all flex items-center justify-center gap-1.5 sm:gap-2 shadow-lg shadow-cyan-500/20 active:scale-[0.98]">
                      {isLoading ? (<><Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 animate-spin" /><span className="truncate">{isPending ? 'Confirm...' : 'Processing...'}</span></>) 
                        : isApproving || (stakeAmount && needsApproval(stakeAmount)) ? (<><CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" /><span>Approve gMONIC</span></>) 
                        : (<><Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" /><span>Stake gMONIC</span></>)}
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4 md:space-y-5">
                  <div>
                    <label className="text-[10px] sm:text-xs md:text-sm text-gray-400 mb-1 sm:mb-1.5 md:mb-2 block">Amount to Unstake</label>
                    <div className="bg-black/30 rounded-lg sm:rounded-xl p-2.5 sm:p-3 md:p-4 border border-white/10 focus-within:border-cyan-500/50 transition-all">
                      <div className="flex items-center gap-2">
                        <input type="number" inputMode="decimal" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} placeholder="0.0"
                          className="flex-1 min-w-0 bg-transparent text-lg sm:text-xl md:text-2xl text-white outline-none placeholder-gray-600 w-full" />
                        <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 flex-shrink-0">
                          <button onClick={handleMaxWithdraw} className="px-1.5 sm:px-2 md:px-3 py-0.5 sm:py-1 md:py-1.5 text-[9px] sm:text-[10px] md:text-xs font-medium text-cyan-400 hover:text-cyan-300 bg-cyan-500/20 hover:bg-cyan-500/30 rounded sm:rounded-md md:rounded-lg transition-all">MAX</button>
                          <div className="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 md:px-3 py-0.5 sm:py-1 md:py-1.5 bg-white/5 rounded sm:rounded-md md:rounded-lg">
                            <img src="/logo.png" alt="gMONIC" className="w-4 h-4 sm:w-5 sm:h-5 rounded-full object-cover" />
                            <span className="text-[10px] sm:text-xs md:text-sm text-white font-medium hidden xs:inline">gMONIC</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-1.5 sm:mt-2 md:mt-3 text-[10px] sm:text-xs md:text-sm text-gray-500">
                        Staked: {userStaked.toLocaleString(undefined, { maximumFractionDigits: 4 })} gMONIC
                      </div>
                    </div>
                  </div>

                  {/* Lock Warning */}
                  {userInfo && !userInfo.canWithdraw && userInfo.amount > 0n && (
                    <div className="flex items-start gap-2 p-2 sm:p-3 md:p-4 bg-red-500/10 rounded-lg sm:rounded-xl border border-red-500/20">
                      <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-[10px] sm:text-xs md:text-sm text-red-200/80">
                          Locked: <span className="font-mono font-semibold">{formatTimeUntilUnlock(userInfo.timeUntilUnlock)}</span>
                        </p>
                        <p className="text-[9px] sm:text-[10px] md:text-xs text-red-300/50 mt-0.5">Emergency withdraw loses rewards</p>
                      </div>
                    </div>
                  )}

                  {/* Unstake Button */}
                  {!isConnected ? (
                    <div className="text-center py-2.5 sm:py-3 md:py-4 text-xs sm:text-sm text-gray-400 bg-white/5 rounded-lg sm:rounded-xl">Connect wallet to unstake</div>
                  ) : (
                    <button onClick={handleWithdraw} disabled={isLoading || !withdrawAmount || parseFloat(withdrawAmount) <= 0 || !userInfo?.canWithdraw}
                      className="w-full py-2.5 sm:py-3 md:py-4 rounded-lg sm:rounded-xl text-xs sm:text-sm md:text-base font-semibold bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white transition-all flex items-center justify-center gap-1.5 sm:gap-2 shadow-lg shadow-cyan-500/20 active:scale-[0.98]">
                      {isLoading ? (<><Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 animate-spin" /><span className="truncate">{isPending ? 'Confirm...' : 'Processing...'}</span></>) 
                        : (<><Unlock className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" /><span>Unstake gMONIC</span></>)}
                    </button>
                  )}

                  {/* Emergency Withdraw - Admin Only */}
                  {isConnected && isAdmin && userInfo && userInfo.amount > 0n && !userInfo.canWithdraw && (
                    <>
                      {!showEmergencyConfirm ? (
                        <button onClick={() => setShowEmergencyConfirm(true)}
                          className="w-full py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs md:text-sm font-medium bg-red-900/30 hover:bg-red-900/50 border border-red-500/30 text-red-400 transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]">
                          <XCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
                          <span>Emergency Withdraw (Admin)</span>
                        </button>
                      ) : (
                        <div className="p-3 sm:p-4 bg-red-900/20 rounded-lg sm:rounded-xl border border-red-500/30 space-y-2 sm:space-y-3">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs sm:text-sm text-red-300 font-medium">Confirm Emergency Withdraw</p>
                              <p className="text-[10px] sm:text-xs text-red-400/70 mt-1">You will lose {pendingRewards.toLocaleString(undefined, { maximumFractionDigits: 6 })} gMONIC rewards!</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => setShowEmergencyConfirm(false)} className="flex-1 py-2 rounded-lg text-[10px] sm:text-xs font-medium bg-gray-700 hover:bg-gray-600 text-white transition-all">Cancel</button>
                            <button onClick={handleEmergencyWithdraw} disabled={isLoading}
                              className="flex-1 py-2 rounded-lg text-[10px] sm:text-xs font-medium bg-red-600 hover:bg-red-500 disabled:bg-gray-600 text-white transition-all flex items-center justify-center gap-1">
                              {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <><XCircle className="w-3 h-3" />Confirm</>}
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Your Position Card */}
        <div className="lg:col-span-5 order-2 space-y-3 sm:space-y-4">
          <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/50 rounded-lg sm:rounded-xl md:rounded-2xl border border-white/10 overflow-hidden">
            <div className="p-3 sm:p-4 md:p-5 border-b border-white/5">
              <h3 className="text-sm sm:text-base md:text-lg font-semibold text-white flex items-center gap-2">
                <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-cyan-400" />
                Your Position
              </h3>
            </div>
            
            <div className="p-3 sm:p-4 md:p-5 space-y-2.5 sm:space-y-3 md:space-y-4">
              {!isConnected ? (
                <div className="text-center py-4 sm:py-6 md:py-8">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-full bg-cyan-500/10 flex items-center justify-center mx-auto mb-2 sm:mb-3 md:mb-4">
                    <Wallet className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-cyan-400" />
                  </div>
                  <p className="text-xs sm:text-sm md:text-base text-gray-400">Connect wallet to view</p>
                </div>
              ) : (
                <>
                  {/* Staked Amount */}
                  <div className="bg-black/20 rounded-lg sm:rounded-xl p-2.5 sm:p-3 md:p-4">
                    <div className="flex justify-between items-center mb-0.5 sm:mb-1">
                      <span className="text-gray-400 text-[10px] sm:text-xs md:text-sm">Staked</span>
                      <span className="text-[9px] sm:text-[10px] md:text-xs text-cyan-400">gMONIC</span>
                    </div>
                    <p className="text-base sm:text-xl md:text-2xl font-bold text-white truncate">
                      {userStaked.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                    </p>
                  </div>

                  {/* Pending Rewards */}
                  <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 rounded-lg sm:rounded-xl p-2.5 sm:p-3 md:p-4 border border-green-500/20">
                    <div className="flex justify-between items-center mb-0.5 sm:mb-1">
                      <span className="text-green-300/70 text-[10px] sm:text-xs md:text-sm flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3" />Rewards
                      </span>
                      <span className="text-[9px] sm:text-[10px] md:text-xs text-green-400">gMONIC</span>
                    </div>
                    <p className="text-base sm:text-xl md:text-2xl font-bold text-green-400 truncate">
                      {pendingRewards.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                    </p>
                    
                    {pendingRewards > 0 && userInfo && (
                      <button onClick={handleHarvest} disabled={isLoading || !userInfo.canHarvest}
                        className="w-full mt-2 sm:mt-2.5 md:mt-3 py-1.5 sm:py-2 md:py-2.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs md:text-sm font-medium bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]">
                        {isLoading ? <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" /> 
                          : !userInfo.canHarvest ? <><Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />{formatTimeUntilUnlock(userInfo.timeUntilUnlock)}</>
                          : <><Gift className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />Harvest</>}
                      </button>
                    )}
                  </div>

                  {/* Lock Status */}
                  {userInfo && userInfo.amount > 0n && (
                    <div className={`rounded-lg sm:rounded-xl p-2.5 sm:p-3 md:p-4 ${userInfo.canWithdraw ? 'bg-green-900/20 border border-green-500/20' : 'bg-amber-900/20 border border-amber-500/20'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          {userInfo.canWithdraw ? (
                            <><Unlock className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-green-400" /><span className="text-xs sm:text-sm md:text-base text-green-400 font-medium">Unlocked</span></>
                          ) : (
                            <><Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-amber-400" /><span className="text-xs sm:text-sm md:text-base text-amber-400 font-medium">Locked</span></>
                          )}
                        </div>
                        {!userInfo.canWithdraw && (
                          <div className="flex items-center gap-1 text-amber-300">
                            <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4" />
                            <span className="text-[10px] sm:text-xs md:text-sm font-mono">{formatTimeUntilUnlock(userInfo.timeUntilUnlock)}</span>
                          </div>
                        )}
                      </div>
                      {!userInfo.canWithdraw && (
                        <div className="mt-1.5 sm:mt-2 md:mt-3">
                          <div className="h-1 sm:h-1.5 md:h-2 bg-black/30 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all"
                              style={{ width: `${Math.max(0, 100 - (Number(userInfo.timeUntilUnlock) / 604800 * 100))}%` }} />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Wallet Balance */}
          {isConnected && (
            <div className="bg-white/5 rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 border border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs md:text-sm text-gray-400">Wallet Balance</span>
                <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2">
                  <span className="text-xs sm:text-sm md:text-base text-white font-semibold truncate max-w-[120px] sm:max-w-none">
                    {walletBalance.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                  </span>
                  <span className="text-[10px] sm:text-xs md:text-sm text-gray-400">gMONIC</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
