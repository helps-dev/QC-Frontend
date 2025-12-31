import { useState, useEffect } from 'react'
import { useAccount, useBalance } from 'wagmi'
import { formatEther } from 'viem'
import { useMonadStaking, formatTimeUntilUnlock, calculateAPR } from '../../hooks/useMonadStaking'
import { 
  Lock, Unlock, TrendingUp, Clock, Coins, AlertTriangle, CheckCircle, 
  Loader2, Sparkles, Shield, Wallet, ArrowRight, Info, Gift, Zap
} from 'lucide-react'

export function MonadStakingPage() {
  const { address, isConnected } = useAccount()
  const [stakeAmount, setStakeAmount] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [activeTab, setActiveTab] = useState<'stake' | 'unstake'>('stake')
  const [showInfo, setShowInfo] = useState(false)

  const {
    poolInfo,
    userInfo,
    depositMON,
    withdraw,
    harvest,
    refetch,
    isPending,
    isConfirming,
    isSuccess,
    hash,
  } = useMonadStaking(0)

  const { data: monBalance } = useBalance({ address })

  useEffect(() => {
    if (isSuccess) {
      refetch()
      setStakeAmount('')
      setWithdrawAmount('')
    }
  }, [isSuccess])

  useEffect(() => {
    const interval = setInterval(refetch, 10000)
    return () => clearInterval(interval)
  }, [])

  const handleStake = async () => {
    if (!stakeAmount || parseFloat(stakeAmount) <= 0) return
    try { await depositMON(stakeAmount) } catch (e) { console.error('Stake error:', e) }
  }

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) return
    try { await withdraw(withdrawAmount) } catch (e) { console.error('Withdraw error:', e) }
  }

  const handleHarvest = async () => {
    try { await harvest() } catch (e) { console.error('Harvest error:', e) }
  }

  const handleMaxStake = () => {
    if (monBalance) {
      const max = Number(formatEther(monBalance.value)) - 0.1
      setStakeAmount(max > 0 ? max.toFixed(6) : '0')
    }
  }

  const handleMaxWithdraw = () => {
    if (userInfo) setWithdrawAmount(formatEther(userInfo.amount))
  }

  const apr = poolInfo ? calculateAPR(poolInfo.rewardPerSecond, poolInfo.totalStaked) : 0
  const isLoading = isPending || isConfirming
  const totalStaked = poolInfo ? Number(formatEther(poolInfo.totalStaked)) : 0
  const userStaked = userInfo ? Number(formatEther(userInfo.amount)) : 0
  const pendingRewards = userInfo ? Number(formatEther(userInfo.pendingReward)) : 0

  return (
    <div className="w-full max-w-4xl mx-auto px-2 sm:px-4 space-y-4 sm:space-y-6">
      {/* Hero Section - Responsive */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-purple-900/60 via-purple-800/40 to-indigo-900/60 p-4 sm:p-6 lg:p-8 border border-purple-500/20">
        {/* Live & About buttons - Top Right */}
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 flex items-center gap-2">
          <div className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg bg-green-500/20 border border-green-500/30 backdrop-blur-sm">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[10px] sm:text-xs text-green-400 font-medium">Live</span>
            </div>
          </div>
          <button 
            onClick={() => setShowInfo(!showInfo)} 
            className={`p-1.5 sm:p-2 rounded-lg backdrop-blur-sm transition-all ${showInfo ? 'bg-purple-500/30 border border-purple-400/50' : 'bg-white/10 hover:bg-white/20 border border-white/10'}`}
          >
            <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/80" />
          </button>
        </div>

        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-10 -right-10 sm:-top-20 sm:-right-20 w-32 sm:w-64 h-32 sm:h-64 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-10 -left-10 sm:-bottom-20 sm:-left-20 w-32 sm:w-64 h-32 sm:h-64 bg-indigo-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="relative z-10">
          {/* Header - Title Only (buttons moved to absolute top right) */}
          <div className="flex items-center gap-3 sm:gap-4 pr-20 sm:pr-24">
            <div className="relative flex-shrink-0">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <Coins className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-green-500 rounded-full flex items-center justify-center">
                <Sparkles className="w-2 h-2 sm:w-3 sm:h-3 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">Stake MON</h1>
              <p className="text-sm sm:text-base text-purple-200/80">Earn wMON rewards</p>
            </div>
          </div>

          {/* Stats Grid - Responsive */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-4 sm:mt-8">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/10">
              <div className="flex items-center gap-1 sm:gap-2 text-purple-300/70 text-[10px] sm:text-sm mb-0.5 sm:mb-1">
                <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">APR</span>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-green-400">{apr.toFixed(1)}%</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/10">
              <div className="flex items-center gap-1 sm:gap-2 text-purple-300/70 text-[10px] sm:text-sm mb-0.5 sm:mb-1">
                <Coins className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">Staked</span>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-white truncate">{totalStaked.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/10">
              <div className="flex items-center gap-1 sm:gap-2 text-purple-300/70 text-[10px] sm:text-sm mb-0.5 sm:mb-1">
                <Gift className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">Reward</span>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-white">wMON</p>
            </div>
          </div>
        </div>
      </div>

      {/* Info Panel - Responsive */}
      {showInfo && (
        <div className="bg-gradient-to-r from-blue-900/30 to-indigo-900/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-blue-500/20">
          <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
            How Staking Works
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {[
              { num: '1', text: 'Stake MON tokens to earn wMON rewards immediately' },
              { num: '2', text: '7 days lock period (resets on new deposits)' },
              { num: '3', text: 'Harvest rewards anytime without affecting lock' },
              { num: '4', text: 'Withdraw after lock period ends' },
            ].map((item) => (
              <div key={item.num} className="flex items-start gap-2 sm:gap-3">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-purple-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-[10px] sm:text-xs text-purple-300">{item.num}</span>
                </div>
                <p className="text-gray-300 text-xs sm:text-sm">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Content - Responsive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
        {/* Left Column - Your Position (Full width on mobile, 2 cols on desktop) */}
        <div className="lg:col-span-2 space-y-3 sm:space-y-4 order-2 lg:order-1">
          <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/50 rounded-xl sm:rounded-2xl border border-white/10 overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-white/5">
              <h3 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
                <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                Your Position
              </h3>
            </div>
            
            <div className="p-4 sm:p-5 space-y-3 sm:space-y-4">
              {!isConnected ? (
                <div className="text-center py-6 sm:py-8">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <Wallet className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400" />
                  </div>
                  <p className="text-sm sm:text-base text-gray-400">Connect wallet to view position</p>
                </div>
              ) : (
                <>
                  {/* Staked Amount */}
                  <div className="bg-black/20 rounded-lg sm:rounded-xl p-3 sm:p-4">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-gray-400 text-xs sm:text-sm">Staked Amount</span>
                      <span className="text-[10px] sm:text-xs text-purple-400">MON</span>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-white">
                      {userStaked.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                    </p>
                  </div>

                  {/* Pending Rewards */}
                  <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-green-500/20">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-green-300/70 text-xs sm:text-sm flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Pending Rewards
                      </span>
                      <span className="text-[10px] sm:text-xs text-green-400">wMON</span>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-green-400">
                      {pendingRewards.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                    </p>
                    
                    {pendingRewards > 0 && (
                      <button onClick={handleHarvest} disabled={isLoading}
                        className="w-full mt-2 sm:mt-3 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-sm font-medium bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white transition-all flex items-center justify-center gap-2">
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Gift className="w-4 h-4" />Harvest</>}
                      </button>
                    )}
                  </div>

                  {/* Lock Status */}
                  {userInfo && userInfo.amount > 0n && (
                    <div className={`rounded-lg sm:rounded-xl p-3 sm:p-4 ${userInfo.canWithdraw ? 'bg-green-900/20 border border-green-500/20' : 'bg-amber-900/20 border border-amber-500/20'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {userInfo.canWithdraw ? (
                            <><Unlock className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" /><span className="text-sm sm:text-base text-green-400 font-medium">Unlocked</span></>
                          ) : (
                            <><Lock className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" /><span className="text-sm sm:text-base text-amber-400 font-medium">Locked</span></>
                          )}
                        </div>
                        {!userInfo.canWithdraw && (
                          <div className="flex items-center gap-1 text-amber-300">
                            <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="text-xs sm:text-sm font-mono">{formatTimeUntilUnlock(userInfo.timeUntilUnlock)}</span>
                          </div>
                        )}
                      </div>
                      {!userInfo.canWithdraw && (
                        <div className="mt-2 sm:mt-3">
                          <div className="h-1.5 sm:h-2 bg-black/30 rounded-full overflow-hidden">
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

          {/* Wallet Balance - Mobile Optimized */}
          {isConnected && (
            <div className="bg-white/5 rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Wallet Balance</span>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="text-sm sm:text-base text-white font-semibold">
                    {monBalance ? Number(formatEther(monBalance.value)).toLocaleString(undefined, { maximumFractionDigits: 4 }) : '0'}
                  </span>
                  <span className="text-xs sm:text-sm text-gray-400">MON</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Stake/Unstake (Full width on mobile, 3 cols on desktop) */}
        <div className="lg:col-span-3 order-1 lg:order-2">
          <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/50 rounded-xl sm:rounded-2xl border border-white/10 overflow-hidden">
            {/* Tabs - Responsive */}
            <div className="flex border-b border-white/5">
              <button onClick={() => setActiveTab('stake')}
                className={`flex-1 py-3 sm:py-4 px-4 sm:px-6 text-sm sm:text-base font-medium transition-all relative ${activeTab === 'stake' ? 'text-white' : 'text-gray-400 hover:text-white'}`}>
                <span className="flex items-center justify-center gap-1.5 sm:gap-2">
                  <Zap className="w-4 h-4" />Stake
                </span>
                {activeTab === 'stake' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-indigo-500" />}
              </button>
              <button onClick={() => setActiveTab('unstake')}
                className={`flex-1 py-3 sm:py-4 px-4 sm:px-6 text-sm sm:text-base font-medium transition-all relative ${activeTab === 'unstake' ? 'text-white' : 'text-gray-400 hover:text-white'}`}>
                <span className="flex items-center justify-center gap-1.5 sm:gap-2">
                  <ArrowRight className="w-4 h-4" />Unstake
                </span>
                {activeTab === 'unstake' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-indigo-500" />}
              </button>
            </div>

            <div className="p-4 sm:p-6">
              {activeTab === 'stake' ? (
                <div className="space-y-4 sm:space-y-5">
                  {/* Stake Input */}
                  <div>
                    <label className="text-xs sm:text-sm text-gray-400 mb-1.5 sm:mb-2 block">Amount to Stake</label>
                    <div className="bg-black/30 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-white/10 focus-within:border-purple-500/50 transition-all">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <input type="number" value={stakeAmount} onChange={(e) => setStakeAmount(e.target.value)} placeholder="0.0"
                          className="flex-1 min-w-0 bg-transparent text-xl sm:text-2xl text-white outline-none placeholder-gray-600" />
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                          <button onClick={handleMaxStake}
                            className="px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium text-purple-400 hover:text-purple-300 bg-purple-500/20 hover:bg-purple-500/30 rounded-md sm:rounded-lg transition-all">
                            MAX
                          </button>
                          <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-white/5 rounded-md sm:rounded-lg">
                            <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-purple-500 flex items-center justify-center">
                              <span className="text-[8px] sm:text-[10px] font-bold text-white">M</span>
                            </div>
                            <span className="text-xs sm:text-sm text-white font-medium">MON</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 sm:mt-3 text-xs sm:text-sm text-gray-500">
                        Balance: {monBalance ? Number(formatEther(monBalance.value)).toFixed(4) : '0'} MON
                      </div>
                    </div>
                  </div>

                  {/* Lock Warning */}
                  <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 bg-amber-500/10 rounded-lg sm:rounded-xl border border-amber-500/20">
                    <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs sm:text-sm text-amber-200/80">
                      Funds locked for 7 days. New deposits reset timer.
                    </p>
                  </div>

                  {/* Stake Button */}
                  {!isConnected ? (
                    <div className="text-center py-3 sm:py-4 text-sm text-gray-400 bg-white/5 rounded-lg sm:rounded-xl">Connect wallet to stake</div>
                  ) : (
                    <button onClick={handleStake} disabled={isLoading || !stakeAmount || parseFloat(stakeAmount) <= 0}
                      className="w-full py-3 sm:py-4 rounded-lg sm:rounded-xl text-sm sm:text-base font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20">
                      {isLoading ? (<><Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />{isPending ? 'Confirm...' : 'Processing...'}</>) : (<><Zap className="w-4 h-4 sm:w-5 sm:h-5" />Stake MON</>)}
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4 sm:space-y-5">
                  {/* Unstake Input */}
                  <div>
                    <label className="text-xs sm:text-sm text-gray-400 mb-1.5 sm:mb-2 block">Amount to Unstake</label>
                    <div className="bg-black/30 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-white/10 focus-within:border-purple-500/50 transition-all">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <input type="number" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} placeholder="0.0"
                          className="flex-1 min-w-0 bg-transparent text-xl sm:text-2xl text-white outline-none placeholder-gray-600" />
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                          <button onClick={handleMaxWithdraw}
                            className="px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium text-purple-400 hover:text-purple-300 bg-purple-500/20 hover:bg-purple-500/30 rounded-md sm:rounded-lg transition-all">
                            MAX
                          </button>
                          <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-white/5 rounded-md sm:rounded-lg">
                            <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-purple-500 flex items-center justify-center">
                              <span className="text-[8px] sm:text-[10px] font-bold text-white">M</span>
                            </div>
                            <span className="text-xs sm:text-sm text-white font-medium">MON</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 sm:mt-3 text-xs sm:text-sm text-gray-500">
                        Staked: {userStaked.toFixed(4)} MON
                      </div>
                    </div>
                  </div>

                  {/* Lock Warning for Unstake */}
                  {userInfo && !userInfo.canWithdraw && userInfo.amount > 0n && (
                    <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 bg-red-500/10 rounded-lg sm:rounded-xl border border-red-500/20">
                      <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs sm:text-sm text-red-200/80">
                          Locked for <span className="font-mono font-semibold">{formatTimeUntilUnlock(userInfo.timeUntilUnlock)}</span>
                        </p>
                        <p className="text-[10px] sm:text-xs text-red-300/50 mt-0.5 sm:mt-1">Wait or use emergency withdraw (loses rewards)</p>
                      </div>
                    </div>
                  )}

                  {/* Unstake Button */}
                  {!isConnected ? (
                    <div className="text-center py-3 sm:py-4 text-sm text-gray-400 bg-white/5 rounded-lg sm:rounded-xl">Connect wallet to unstake</div>
                  ) : (
                    <button onClick={handleWithdraw} disabled={isLoading || !withdrawAmount || parseFloat(withdrawAmount) <= 0 || !userInfo?.canWithdraw}
                      className="w-full py-3 sm:py-4 rounded-lg sm:rounded-xl text-sm sm:text-base font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20">
                      {isLoading ? (<><Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />{isPending ? 'Confirm...' : 'Processing...'}</>) : (<><Unlock className="w-4 h-4 sm:w-5 sm:h-5" />Unstake MON</>)}
                    </button>
                  )}
                </div>
              )}

              {/* Success Message */}
              {isSuccess && hash && (
                <div className="mt-3 sm:mt-4 flex items-center gap-2 text-xs sm:text-sm text-green-400 bg-green-500/10 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-green-500/20">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Transaction successful!</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
