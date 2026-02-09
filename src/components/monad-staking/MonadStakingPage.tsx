import { useState, useEffect } from 'react'
import { useAccount, useBalance, useChainId } from 'wagmi'
import { formatEther } from 'viem'
import { useMonadStaking, formatTimeUntilUnlock, calculateAPR } from '../../hooks/useMonadStaking'
import { CHAIN_IDS, getNativeSymbol } from '../../config/chains'
import { 
  Lock, Unlock, Clock, AlertTriangle, CheckCircle, 
  Loader2, Sparkles, Wallet, Gift, Zap, TrendingUp, Coins
} from '../Icons3D'

export function MonadStakingPage() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const nativeSymbol = getNativeSymbol(chainId)
  const rewardSymbol = chainId === CHAIN_IDS.MEGAETH ? 'rETH' : 'wMON'
  const [stakeAmount, setStakeAmount] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [activeTab, setActiveTab] = useState<'stake' | 'unstake'>('stake')

  const { poolInfo, userInfo, depositMON, withdraw, harvest, refetch, isPending, isConfirming, isSuccess, hash } = useMonadStaking(0)
  const { data: monBalance } = useBalance({ address })

  useEffect(() => { if (isSuccess) { refetch(); setStakeAmount(''); setWithdrawAmount('') } }, [isSuccess])
  useEffect(() => { const i = setInterval(refetch, 10000); return () => clearInterval(i) }, [])

  const handleStake = async () => { if (stakeAmount && parseFloat(stakeAmount) > 0) try { await depositMON(stakeAmount) } catch {} }
  const handleWithdraw = async () => { if (withdrawAmount && parseFloat(withdrawAmount) > 0) try { await withdraw(withdrawAmount) } catch {} }
  const handleHarvest = async () => { try { await harvest() } catch {} }
  const handleMaxStake = () => { if (monBalance) { const max = Number(formatEther(monBalance.value)) - 0.1; setStakeAmount(max > 0 ? max.toFixed(6) : '0') } }
  const handleMaxWithdraw = () => { if (userInfo) setWithdrawAmount(formatEther(userInfo.amount)) }

  const apr = poolInfo ? calculateAPR(poolInfo.rewardPerSecond, poolInfo.totalStaked) : 0
  const isLoading = isPending || isConfirming
  const totalStaked = poolInfo ? Number(formatEther(poolInfo.totalStaked)) : 0
  const userStaked = userInfo ? Number(formatEther(userInfo.amount)) : 0
  const pendingRewards = userInfo ? Number(formatEther(userInfo.pendingReward)) : 0

  return (
    <div className="w-full max-w-5xl mx-auto px-2">
      {/* Header Row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
            <Coins className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              {nativeSymbol} Staking
              <span className="px-1.5 py-0.5 text-[9px] bg-green-500/20 text-green-400 rounded-full">Live</span>
            </h1>
            <p className="text-xs text-gray-500">Earn {rewardSymbol} • Reward</p>
          </div>
        </div>
      </div>

      {/* Stats + Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
        {/* Stats Column */}
        <div className="lg:col-span-1 grid grid-cols-2 lg:grid-cols-1 gap-2">
          <div className="bg-white/[0.03] rounded-xl p-3 border border-white/5">
            <div className="flex items-center gap-1.5 text-gray-500 text-[10px] mb-1"><TrendingUp className="w-3 h-3" />APR</div>
            <p className="text-xl font-bold text-green-400">{apr.toFixed(1)}%</p>
          </div>
          <div className="bg-white/[0.03] rounded-xl p-3 border border-white/5">
            <div className="flex items-center gap-1.5 text-gray-500 text-[10px] mb-1"><Coins className="w-3 h-3" />TVL</div>
            <p className="text-xl font-bold text-white">{totalStaked.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
          </div>
          <div className="bg-white/[0.03] rounded-xl p-3 border border-white/5">
            <div className="flex items-center gap-1.5 text-gray-500 text-[10px] mb-1"><Wallet className="w-3 h-3" />Staked</div>
            <p className="text-xl font-bold text-white">{userStaked.toFixed(2)}</p>
          </div>
          <div className="bg-white/[0.03] rounded-xl p-3 border border-white/5">
            <div className="flex items-center gap-1.5 text-gray-500 text-[10px] mb-1"><Gift className="w-3 h-3" />Rewards</div>
            <p className="text-xl font-bold text-green-400">{pendingRewards.toFixed(4)}</p>
          </div>
        </div>

        {/* Stake/Unstake Card */}
        <div className="lg:col-span-2 bg-[#12121a]/80 backdrop-blur rounded-2xl border border-white/5 overflow-hidden">
          <div className="flex border-b border-white/5">
            <button onClick={() => setActiveTab('stake')} className={`flex-1 py-2.5 text-sm font-medium transition-all relative ${activeTab === 'stake' ? 'text-white' : 'text-gray-500 hover:text-white'}`}>
              <span className="flex items-center justify-center gap-1.5"><Zap className="w-3.5 h-3.5" />Stake</span>
              {activeTab === 'stake' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500" />}
            </button>
            <button onClick={() => setActiveTab('unstake')} className={`flex-1 py-2.5 text-sm font-medium transition-all relative ${activeTab === 'unstake' ? 'text-white' : 'text-gray-500 hover:text-white'}`}>
              <span className="flex items-center justify-center gap-1.5"><Unlock className="w-3.5 h-3.5" />Unstake</span>
              {activeTab === 'unstake' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500" />}
            </button>
          </div>

          <div className="p-4">
            {activeTab === 'stake' ? (
              <div className="space-y-3">
                <div className="bg-black/30 rounded-xl p-3 border border-white/5">
                  <div className="flex items-center gap-2">
                    <input type="number" value={stakeAmount} onChange={(e) => setStakeAmount(e.target.value)} placeholder="0.0"
                      className="flex-1 bg-transparent text-xl text-white outline-none placeholder-gray-600" />
                    <button onClick={handleMaxStake} className="px-2 py-1 text-[10px] font-medium text-purple-400 bg-purple-500/20 rounded-lg hover:bg-purple-500/30">MAX</button>
                    <div className="px-2 py-1 bg-white/5 rounded-lg text-xs text-white font-medium">{nativeSymbol}</div>
                  </div>
                  <p className="mt-1.5 text-[10px] text-gray-500">Balance: {monBalance ? Number(formatEther(monBalance.value)).toFixed(4) : '0'} {nativeSymbol}</p>
                </div>
                {!isConnected ? (
                  <div className="text-center py-2.5 text-xs text-gray-400 bg-white/5 rounded-xl">Connect wallet to stake</div>
                ) : (
                  <button onClick={handleStake} disabled={isLoading || !stakeAmount || parseFloat(stakeAmount) <= 0}
                    className="w-full py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white transition-all flex items-center justify-center gap-2">
                    {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" />{isPending ? 'Confirm...' : 'Processing...'}</> : <><Zap className="w-4 h-4" />Stake {nativeSymbol}</>}
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-black/30 rounded-xl p-3 border border-white/5">
                  <div className="flex items-center gap-2">
                    <input type="number" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} placeholder="0.0"
                      className="flex-1 bg-transparent text-xl text-white outline-none placeholder-gray-600" />
                    <button onClick={handleMaxWithdraw} className="px-2 py-1 text-[10px] font-medium text-purple-400 bg-purple-500/20 rounded-lg hover:bg-purple-500/30">MAX</button>
                    <div className="px-2 py-1 bg-white/5 rounded-lg text-xs text-white font-medium">{nativeSymbol}</div>
                  </div>
                  <p className="mt-1.5 text-[10px] text-gray-500">Staked: {userStaked.toFixed(4)} {nativeSymbol}</p>
                </div>
                {userInfo && !userInfo.canWithdraw && userInfo.amount > 0n && (
                  <div className="flex items-center gap-2 p-2 bg-red-500/10 rounded-xl border border-red-500/20">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                    <p className="text-[10px] text-red-200/80">Locked: <span className="font-mono">{formatTimeUntilUnlock(userInfo.timeUntilUnlock)}</span></p>
                  </div>
                )}
                {!isConnected ? (
                  <div className="text-center py-2.5 text-xs text-gray-400 bg-white/5 rounded-xl">Connect wallet to unstake</div>
                ) : (
                  <button onClick={handleWithdraw} disabled={isLoading || !withdrawAmount || parseFloat(withdrawAmount) <= 0 || !userInfo?.canWithdraw}
                    className="w-full py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white transition-all flex items-center justify-center gap-2">
                    {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" />{isPending ? 'Confirm...' : 'Processing...'}</> : <><Unlock className="w-4 h-4" />Unstake {nativeSymbol}</>}
                  </button>
                )}
              </div>
            )}
            {isSuccess && hash && (
              <div className="mt-3 flex items-center gap-2 text-xs text-green-400 bg-green-500/10 rounded-xl p-2 border border-green-500/20">
                <CheckCircle className="w-3.5 h-3.5" /><span>Transaction successful!</span>
              </div>
            )}
          </div>
        </div>

        {/* Position Card */}
        <div className="lg:col-span-1 bg-[#12121a]/80 backdrop-blur rounded-2xl border border-white/5 p-4">
          <h3 className="text-xs font-semibold text-white mb-3 flex items-center gap-1.5"><Wallet className="w-3.5 h-3.5 text-purple-400" />Your Position</h3>
          {!isConnected ? (
            <div className="text-center py-4"><Wallet className="w-8 h-8 text-purple-400/50 mx-auto mb-1" /><p className="text-xs text-gray-500">Connect wallet</p></div>
          ) : (
            <div className="space-y-2">
              <div className="bg-black/20 rounded-xl p-2.5">
                <p className="text-[10px] text-gray-500 mb-0.5">Staked</p>
                <p className="text-lg font-bold text-white">{userStaked.toFixed(4)} <span className="text-xs text-gray-400">{nativeSymbol}</span></p>
              </div>
              <div className="bg-green-900/20 rounded-xl p-2.5 border border-green-500/20">
                <div className="flex items-center justify-between mb-0.5">
                  <p className="text-[10px] text-green-400 flex items-center gap-1"><Sparkles className="w-2.5 h-2.5" />Rewards</p>
                  <span className="text-[10px] text-green-400">{rewardSymbol}</span>
                </div>
                <p className="text-lg font-bold text-green-400">{pendingRewards.toFixed(6)}</p>
                {pendingRewards > 0 && (
                  <button onClick={handleHarvest} disabled={isLoading}
                    className="w-full mt-2 py-1.5 rounded-lg text-xs font-medium bg-green-600 hover:bg-green-500 disabled:bg-gray-600 text-white flex items-center justify-center gap-1.5">
                    {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Gift className="w-3 h-3" />Harvest</>}
                  </button>
                )}
              </div>
              {userInfo && userInfo.amount > 0n && (
                <div className={`rounded-xl p-2 text-xs ${userInfo.canWithdraw ? 'bg-green-900/20 border border-green-500/20' : 'bg-amber-900/20 border border-amber-500/20'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {userInfo.canWithdraw ? <><Unlock className="w-3 h-3 text-green-400" /><span className="text-green-400">Unlocked</span></> 
                        : <><Lock className="w-3 h-3 text-amber-400" /><span className="text-amber-400">Locked</span></>}
                    </div>
                    {!userInfo.canWithdraw && <div className="flex items-center gap-1 text-amber-300"><Clock className="w-2.5 h-2.5" /><span className="font-mono text-[10px]">{formatTimeUntilUnlock(userInfo.timeUntilUnlock)}</span></div>}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
