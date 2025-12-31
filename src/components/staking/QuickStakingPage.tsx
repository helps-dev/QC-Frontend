import { useState, useEffect, useMemo, useRef } from 'react'
import { useAccount } from 'wagmi'
import {
  Zap,
  Lock,
  Unlock,
  TrendingUp,
  Clock,
  AlertTriangle,
  RefreshCw,
  Gift,
  Wallet,
  Info,
  Calculator,
} from 'lucide-react'
import { useQuickStaking, QUICK_STAKING_ADDRESS } from '../../hooks/useQuickStaking'
import { ROIModal } from './ROIModal'
import { useROICalculatorStore } from '../../store/calculatorStore'

function formatNum(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(2)}K`
  if (num >= 1) return num.toFixed(4)
  return num.toFixed(6)
}

function formatDate(timestamp: number): string {
  if (timestamp === 0) return 'N/A'
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function formatDays(seconds: number): string {
  const days = Math.floor(seconds / 86400)
  return `${days} days`
}

export function QuickStakingPage() {
  const { isConnected } = useAccount()
  const [mode, setMode] = useState<'stake' | 'unstake'>('stake')
  const [amount, setAmount] = useState('')

  // ROI Calculator Store - get setters once to avoid re-renders
  const openModal = useROICalculatorStore((state) => state.openModal)
  const setPoolData = useROICalculatorStore((state) => state.setPoolData)
  const setUserStakeData = useROICalculatorStore((state) => state.setUserStakeData)
  const setCalcAmount = useROICalculatorStore((state) => state.setAmount)

  // Track previous values to prevent infinite loops
  const prevPoolDataRef = useRef<string>('')
  const prevUserDataRef = useRef<string>('')

  const {
    approve,
    stake,
    unstake,
    claim,
    compound,
    needsApproval,
    reset,
    refetchAll,
    isProcessing,
    isSuccess,
    txHash,
    statusMessage,
    quickBalance,
    stakeDetails,
    poolInfo,
  } = useQuickStaking()

  // Calculate APR (simplified) - memoized
  const apr = useMemo(() => {
    const totalStaked = parseFloat(poolInfo.totalStaked)
    if (totalStaked <= 0) return 0
    return ((parseFloat(poolInfo.rewardRate) * 365 * 24 * 60 * 60) / totalStaked) * 100
  }, [poolInfo.totalStaked, poolInfo.rewardRate])

  // Sync pool data to store - with comparison to prevent infinite loop
  useEffect(() => {
    const newPoolData = {
      totalStaked: poolInfo.totalStaked,
      rewardRate: poolInfo.rewardRate,
      minStake: poolInfo.minStake,
      maxStake: poolInfo.maxStake,
      lockPeriod: poolInfo.lockPeriod,
      earlyWithdrawPenalty: poolInfo.earlyWithdrawPenalty,
      compoundBonus: poolInfo.compoundBonus,
      apr,
    }
    const newPoolDataStr = JSON.stringify(newPoolData)

    // Only update if data actually changed
    if (prevPoolDataRef.current !== newPoolDataStr) {
      prevPoolDataRef.current = newPoolDataStr
      setPoolData(newPoolData)
    }
  }, [
    poolInfo.totalStaked,
    poolInfo.rewardRate,
    poolInfo.minStake,
    poolInfo.maxStake,
    poolInfo.lockPeriod,
    poolInfo.earlyWithdrawPenalty,
    poolInfo.compoundBonus,
    apr,
    setPoolData,
  ])

  // Sync user stake data to store - with comparison to prevent infinite loop
  useEffect(() => {
    const newUserData = {
      stakedAmount: stakeDetails.stakedAmount,
      pendingRewards: stakeDetails.pendingRewards,
      lockEndTime: stakeDetails.lockEndTime,
      isLocked: stakeDetails.isLocked,
      penaltyIfWithdrawNow: stakeDetails.penaltyIfWithdrawNow,
    }
    const newUserDataStr = JSON.stringify(newUserData)

    // Only update if data actually changed
    if (prevUserDataRef.current !== newUserDataStr) {
      prevUserDataRef.current = newUserDataStr
      setUserStakeData(newUserData)
    }
  }, [
    stakeDetails.stakedAmount,
    stakeDetails.pendingRewards,
    stakeDetails.lockEndTime,
    stakeDetails.isLocked,
    stakeDetails.penaltyIfWithdrawNow,
    setUserStakeData,
  ])

  // Auto-refresh data
  useEffect(() => {
    const interval = setInterval(() => {
      refetchAll()
    }, 15000)
    return () => clearInterval(interval)
  }, [refetchAll])

  // Reset on success
  useEffect(() => {
    if (isSuccess) {
      setTimeout(() => {
        setAmount('')
        reset()
      }, 3000)
    }
  }, [isSuccess, reset])

  const maxAmount = mode === 'stake' ? quickBalance : stakeDetails.stakedAmount
  const requiresApproval = mode === 'stake' && needsApproval(amount)
  const hasRewards = parseFloat(stakeDetails.pendingRewards) > 0
  const hasStake = parseFloat(stakeDetails.stakedAmount) > 0

  const handleMax = () => setAmount(maxAmount)

  const handlePercent = (pct: number) => {
    const val = (parseFloat(maxAmount) * pct) / 100
    setAmount(val > 0 ? val.toFixed(6).replace(/\.?0+$/, '') : '0')
  }

  const handleOpenCalculator = () => {
    if (amount) setCalcAmount(amount)
    openModal()
  }

  const validateAmount = (): string | null => {
    if (!amount || amount === '') return 'Enter an amount'
    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) return 'Amount must be greater than 0'
    if (amountNum > parseFloat(maxAmount)) return 'Insufficient balance'
    if (mode === 'stake') {
      if (amountNum < parseFloat(poolInfo.minStake)) return `Min stake: ${poolInfo.minStake} QUICK`
      if (parseFloat(stakeDetails.stakedAmount) + amountNum > parseFloat(poolInfo.maxStake))
        return `Max stake: ${poolInfo.maxStake} QUICK`
    }
    return null
  }

  const handleSubmit = async () => {
    console.log('[QuickStakingPage] handleSubmit called', { mode, amount, requiresApproval })
    
    const error = validateAmount()
    if (error) {
      console.log('[QuickStakingPage] Validation error:', error)
      return
    }

    try {
      if (mode === 'stake') {
        if (requiresApproval) {
          console.log('[QuickStakingPage] Starting approval...')
          const result = await approve()
          console.log('[QuickStakingPage] Approval result:', result)
        } else {
          console.log('[QuickStakingPage] Starting stake...', { amount })
          const result = await stake(amount)
          console.log('[QuickStakingPage] Stake result:', result)
        }
      } else {
        console.log('[QuickStakingPage] Starting unstake...', { amount })
        const result = await unstake(amount)
        console.log('[QuickStakingPage] Unstake result:', result)
      }
    } catch (err) {
      console.error('[QuickStakingPage] handleSubmit error:', err)
    }
  }

  const getButtonText = () => {
    if (isSuccess) return '✓ Success!'
    if (isProcessing) return '⏳ Processing...'
    const error = validateAmount()
    if (error && amount !== '') return error
    if (requiresApproval) return '🔓 Approve QUICK'
    return mode === 'stake' ? '🔒 Stake QUICK' : '🔓 Unstake QUICK'
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold gradient-text">
            🔒 QUICK Staking
          </h1>
          <p className="text-gray-400 text-sm mt-1">Stake QUICK to earn QUICK with auto-compound</p>
        </div>
        <a
          href={`https://explorer.monad.xyz/address/${QUICK_STAKING_ADDRESS}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1"
        >
          <Info className="w-3 h-3" />
          View Contract
        </a>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-blue-400" />
            <p className="text-xs text-gray-400">Total Staked</p>
          </div>
          <p className="text-xl font-bold text-white">{formatNum(parseFloat(poolInfo.totalStaked))} QUICK</p>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <p className="text-xs text-gray-400">APR</p>
          </div>
          <p className="text-xl font-bold text-green-400">{apr.toFixed(1)}%</p>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-purple-400" />
            <p className="text-xs text-gray-400">Lock Period</p>
          </div>
          <p className="text-xl font-bold text-white">{formatDays(poolInfo.lockPeriod)}</p>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <Gift className="w-4 h-4 text-yellow-400" />
            <p className="text-xs text-gray-400">Compound Bonus</p>
          </div>
          <p className="text-xl font-bold text-yellow-400">+{poolInfo.compoundBonus}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Staking Card */}
        <div className="glass-card p-5">
          <h2 className="text-lg font-bold text-white mb-4">Stake / Unstake</h2>

          {/* Mode Toggle */}
          <div className="flex gap-2 p-1 bg-atlantis-800/30 rounded-xl border border-atlantis-700/30 mb-4">
            <button
              onClick={() => {
                setMode('stake')
                setAmount('')
              }}
              disabled={isProcessing}
              className={`flex-1 py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                mode === 'stake'
                  ? 'bg-gradient-to-r from-primary-500/20 to-secondary-500/20 text-white border border-primary-500/30'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Lock className="w-4 h-4" />
              Stake
            </button>
            <button
              onClick={() => {
                setMode('unstake')
                setAmount('')
              }}
              disabled={isProcessing}
              className={`flex-1 py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                mode === 'unstake'
                  ? 'bg-gradient-to-r from-secondary-500/20 to-primary-500/20 text-white border border-secondary-500/30'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Unlock className="w-4 h-4" />
              Unstake
            </button>
          </div>

          {/* Amount Input */}
          <div className="bg-atlantis-800/30 rounded-xl p-4 border border-atlantis-700/30 mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-500 text-xs">
                {mode === 'stake' ? 'Available QUICK' : 'Staked QUICK'}
              </span>
              <button onClick={handleMax} disabled={isProcessing} className="text-xs text-primary-400 hover:text-primary-300">
                Max: {formatNum(parseFloat(maxAmount))}
              </button>
            </div>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              disabled={isProcessing}
              className="w-full bg-transparent text-2xl text-white outline-none placeholder-gray-600"
            />
            <div className="flex gap-2 mt-3">
              {[25, 50, 75, 100].map((pct) => (
                <button
                  key={pct}
                  onClick={() => handlePercent(pct)}
                  disabled={isProcessing}
                  className="flex-1 py-1.5 text-xs font-medium bg-atlantis-700/50 hover:bg-atlantis-600/50 text-gray-300 hover:text-white rounded-lg transition-all disabled:opacity-50"
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>

          {/* Unstake Warning */}
          {mode === 'unstake' && stakeDetails.isLocked && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4">
              <p className="text-red-400 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Early withdrawal penalty: {poolInfo.earlyWithdrawPenalty}%
              </p>
              <p className="text-red-300/70 text-xs mt-1">
                Lock ends: {formatDate(stakeDetails.lockEndTime)}
              </p>
            </div>
          )}

          {/* Status Message */}
          {statusMessage && (
            <div
              className={`rounded-xl p-3 mb-4 text-sm ${
                statusMessage.includes('✅')
                  ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                  : statusMessage.includes('❌')
                    ? 'bg-red-500/10 border border-red-500/30 text-red-400'
                    : 'bg-blue-500/10 border border-blue-500/30 text-blue-400'
              }`}
            >
              {isProcessing && (
                <RefreshCw className="w-4 h-4 inline-block animate-spin mr-2" />
              )}
              {statusMessage}
            </div>
          )}

          {/* Tx Hash */}
          {txHash && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 mb-4">
              <p className="text-blue-400 text-sm">
                📝 Tx:{' '}
                <a
                  href={`https://explorer.monad.xyz/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-blue-300"
                >
                  {txHash.slice(0, 10)}...{txHash.slice(-8)}
                </a>
              </p>
            </div>
          )}

          {/* Submit Button */}
          {!isConnected ? (
            <button className="w-full py-4 bg-atlantis-700/50 rounded-xl text-gray-400 font-semibold cursor-not-allowed">
              Connect Wallet
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isProcessing || (!!validateAmount() && amount !== '')}
              className={`w-full py-4 rounded-xl font-bold text-white transition-all ${
                isSuccess
                  ? 'bg-green-500'
                  : isProcessing
                    ? 'bg-gray-600 cursor-wait'
                    : validateAmount() && amount !== ''
                      ? 'bg-gray-600 cursor-not-allowed'
                      : 'gradient-button hover:shadow-glow'
              } disabled:opacity-70`}
            >
              {isProcessing && (
                <RefreshCw className="w-4 h-4 inline-block animate-spin mr-2" />
              )}
              {getButtonText()}
            </button>
          )}

          {/* Info */}
          <div className="mt-4 p-3 bg-atlantis-900/30 rounded-xl text-xs text-gray-500 space-y-1">
            <div className="flex justify-between">
              <span>Min Stake</span>
              <span>{poolInfo.minStake} QUICK</span>
            </div>
            <div className="flex justify-between">
              <span>Max Stake</span>
              <span>{poolInfo.maxStake} QUICK</span>
            </div>
            <div className="flex justify-between">
              <span>Early Withdraw Penalty</span>
              <span>{poolInfo.earlyWithdrawPenalty}%</span>
            </div>
          </div>
        </div>

        {/* Your Position Card */}
        <div className="glass-card p-5">
          <h2 className="text-lg font-bold text-white mb-4">Your Position</h2>

          {!isConnected ? (
            <div className="text-center py-8">
              <Wallet className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">Connect wallet to view your position</p>
            </div>
          ) : (
            <>
              {/* Staked Amount */}
              <div className="bg-atlantis-800/30 rounded-xl p-4 border border-atlantis-700/30 mb-4">
                <p className="text-xs text-gray-400 mb-1">Staked Amount</p>
                <p className="text-2xl font-bold text-white">
                  {formatNum(parseFloat(stakeDetails.stakedAmount))} QUICK
                </p>
              </div>

              {/* Pending Rewards */}
              <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl p-4 border border-green-500/20 mb-4">
                <p className="text-xs text-gray-400 mb-1">Pending Rewards</p>
                <p className="text-2xl font-bold text-green-400">
                  {formatNum(parseFloat(stakeDetails.pendingRewards))} QUICK
                </p>
              </div>

              {/* Lock Status */}
              <div className="bg-atlantis-800/30 rounded-xl p-4 border border-atlantis-700/30 mb-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Lock Status</p>
                    <p className={`font-semibold ${stakeDetails.isLocked ? 'text-yellow-400' : 'text-green-400'}`}>
                      {stakeDetails.isLocked ? '🔒 Locked' : '🔓 Unlocked'}
                    </p>
                  </div>
                  {stakeDetails.lockEndTime > 0 && (
                    <div className="text-right">
                      <p className="text-xs text-gray-400 mb-1">Lock Ends</p>
                      <p className="text-sm text-white">{formatDate(stakeDetails.lockEndTime)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={claim}
                  disabled={!hasRewards || isProcessing}
                  className={`py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                    hasRewards
                      ? 'bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 text-green-400'
                      : 'bg-gray-600/20 border border-gray-500/30 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <Gift className="w-4 h-4" />
                  Claim
                </button>

                <button
                  onClick={compound}
                  disabled={!hasRewards || isProcessing}
                  className={`py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                    hasRewards
                      ? 'bg-yellow-600/20 hover:bg-yellow-600/30 border border-yellow-500/30 text-yellow-400'
                      : 'bg-gray-600/20 border border-gray-500/30 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <RefreshCw className="w-4 h-4" />
                  Compound (+{poolInfo.compoundBonus}%)
                </button>
              </div>

              {/* Penalty Warning */}
              {stakeDetails.isLocked && hasStake && (
                <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                  <p className="text-yellow-400 text-xs">
                    ⚠️ If you unstake now, you will lose{' '}
                    <span className="font-bold">{formatNum(parseFloat(stakeDetails.penaltyIfWithdrawNow))} QUICK</span>{' '}
                    ({poolInfo.earlyWithdrawPenalty}% penalty)
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ROI Calculator Button */}
      <div className="mt-6">
        <button
          onClick={handleOpenCalculator}
          className="w-full glass-card p-5 hover:border-primary-500/50 transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-primary-500/20 to-secondary-500/20 flex items-center justify-center">
                <Calculator className="w-6 h-6 text-primary-400" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-bold text-white group-hover:text-primary-400 transition-colors">
                  🧮 ROI Calculator
                </h3>
                <p className="text-sm text-gray-400">
                  Calculate your potential earnings with compound interest
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-green-400">{apr.toFixed(1)}%</p>
              <p className="text-xs text-gray-500">Current APR</p>
            </div>
          </div>
        </button>
      </div>

      {/* ROI Modal */}
      <ROIModal />

      {/* How It Works */}
      <div className="glass-card p-5 mt-6">
        <h2 className="text-lg font-bold text-white mb-4">💡 How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center mx-auto mb-2">
              <span className="text-lg">1️⃣</span>
            </div>
            <p className="text-sm text-white font-medium">Stake QUICK</p>
            <p className="text-xs text-gray-400 mt-1">Min 1, Max 1000 QUICK</p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center mx-auto mb-2">
              <span className="text-lg">2️⃣</span>
            </div>
            <p className="text-sm text-white font-medium">Earn Rewards</p>
            <p className="text-xs text-gray-400 mt-1">{poolInfo.rewardRate} QUICK/block</p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center mx-auto mb-2">
              <span className="text-lg">3️⃣</span>
            </div>
            <p className="text-sm text-white font-medium">Compound</p>
            <p className="text-xs text-gray-400 mt-1">+{poolInfo.compoundBonus}% bonus on compound</p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center mx-auto mb-2">
              <span className="text-lg">4️⃣</span>
            </div>
            <p className="text-sm text-white font-medium">Unstake</p>
            <p className="text-xs text-gray-400 mt-1">
              {poolInfo.earlyWithdrawPenalty}% penalty if before {formatDays(poolInfo.lockPeriod)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
