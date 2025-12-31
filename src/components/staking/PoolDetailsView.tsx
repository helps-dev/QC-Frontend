import { Zap, TrendingUp, Clock, Gift, AlertTriangle, Users, Coins } from 'lucide-react'
import { useROICalculatorStore } from '../../store/calculatorStore'

function formatNum(num: number, decimals = 2): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(decimals)}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(decimals)}K`
  if (num >= 1) return num.toFixed(decimals)
  if (num >= 0.0001) return num.toFixed(4)
  return num.toFixed(6)
}

function formatDays(seconds: number): string {
  const days = Math.floor(seconds / 86400)
  return `${days} days`
}

function formatDate(timestamp: number): string {
  if (timestamp === 0) return 'N/A'
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function PoolDetailsView() {
  const { poolData, userStakeData, quickPrice } = useROICalculatorStore()

  const totalStakedNum = parseFloat(poolData.totalStaked)
  const userStakedNum = parseFloat(userStakeData.stakedAmount)
  const pendingRewardsNum = parseFloat(userStakeData.pendingRewards)

  // Calculate user's share of pool
  const userShare = totalStakedNum > 0 ? (userStakedNum / totalStakedNum) * 100 : 0

  return (
    <div className="space-y-4">
      {/* Pool Stats */}
      <div className="bg-atlantis-800/30 rounded-xl p-4 border border-atlantis-700/30">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Coins className="w-4 h-4 text-primary-400" />
          Pool Statistics
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-atlantis-900/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-gray-400">Total Staked</span>
            </div>
            <p className="text-lg font-bold text-white">{formatNum(totalStakedNum)} QUICK</p>
            <p className="text-xs text-gray-500">${formatNum(totalStakedNum * quickPrice)}</p>
          </div>

          <div className="bg-atlantis-900/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-xs text-gray-400">APR</span>
            </div>
            <p className="text-lg font-bold text-green-400">{poolData.apr.toFixed(1)}%</p>
            <p className="text-xs text-gray-500">Annual Percentage Rate</p>
          </div>

          <div className="bg-atlantis-900/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Gift className="w-4 h-4 text-yellow-400" />
              <span className="text-xs text-gray-400">Reward Rate</span>
            </div>
            <p className="text-lg font-bold text-white">{poolData.rewardRate} QUICK</p>
            <p className="text-xs text-gray-500">per block</p>
          </div>

          <div className="bg-atlantis-900/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-gray-400">Lock Period</span>
            </div>
            <p className="text-lg font-bold text-white">{formatDays(poolData.lockPeriod)}</p>
            <p className="text-xs text-gray-500">minimum lock</p>
          </div>
        </div>
      </div>

      {/* Pool Parameters */}
      <div className="bg-atlantis-800/30 rounded-xl p-4 border border-atlantis-700/30">
        <h3 className="text-sm font-semibold text-white mb-4">Pool Parameters</h3>

        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-atlantis-700/30">
            <span className="text-gray-400 text-sm">Minimum Stake</span>
            <span className="text-white font-medium">{poolData.minStake} QUICK</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-atlantis-700/30">
            <span className="text-gray-400 text-sm">Maximum Stake</span>
            <span className="text-white font-medium">{poolData.maxStake} QUICK</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-atlantis-700/30">
            <span className="text-gray-400 text-sm">Compound Bonus</span>
            <span className="text-green-400 font-medium">+{poolData.compoundBonus}%</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-gray-400 text-sm">Early Withdraw Penalty</span>
            <span className="text-red-400 font-medium">{poolData.earlyWithdrawPenalty}%</span>
          </div>
        </div>
      </div>

      {/* Your Position */}
      <div className="bg-gradient-to-r from-primary-500/10 to-secondary-500/10 rounded-xl p-4 border border-primary-500/20">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Users className="w-4 h-4 text-primary-400" />
          Your Position
        </h3>

        {userStakedNum > 0 ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400 mb-1">Staked Amount</p>
                <p className="text-xl font-bold text-white">{formatNum(userStakedNum)} QUICK</p>
                <p className="text-xs text-gray-500">${formatNum(userStakedNum * quickPrice)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Pending Rewards</p>
                <p className="text-xl font-bold text-green-400">
                  {formatNum(pendingRewardsNum)} QUICK
                </p>
                <p className="text-xs text-gray-500">${formatNum(pendingRewardsNum * quickPrice)}</p>
              </div>
            </div>

            <div className="bg-atlantis-900/50 rounded-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-gray-400">Your Pool Share</span>
                <span className="text-sm font-medium text-white">{userShare.toFixed(4)}%</span>
              </div>
              <div className="w-full h-2 bg-atlantis-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full transition-all"
                  style={{ width: `${Math.min(100, userShare)}%` }}
                />
              </div>
            </div>

            {/* Lock Status */}
            <div className="flex justify-between items-center py-2 border-t border-atlantis-700/30">
              <span className="text-gray-400 text-sm">Lock Status</span>
              <span
                className={`font-medium ${userStakeData.isLocked ? 'text-yellow-400' : 'text-green-400'}`}
              >
                {userStakeData.isLocked ? '🔒 Locked' : '🔓 Unlocked'}
              </span>
            </div>

            {userStakeData.lockEndTime > 0 && (
              <div className="flex justify-between items-center py-2 border-t border-atlantis-700/30">
                <span className="text-gray-400 text-sm">Lock Ends</span>
                <span className="text-white font-medium">
                  {formatDate(userStakeData.lockEndTime)}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-gray-400 text-sm">You haven't staked any QUICK yet</p>
            <p className="text-gray-500 text-xs mt-1">
              Use the Calculator tab to estimate your rewards
            </p>
          </div>
        )}
      </div>

      {/* Warning */}
      {userStakeData.isLocked && userStakedNum > 0 && (
        <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-red-400 font-medium text-sm">Early Withdrawal Warning</p>
              <p className="text-red-300/70 text-xs mt-1">
                If you unstake before {formatDate(userStakeData.lockEndTime)}, you will lose{' '}
                <span className="font-bold">
                  {formatNum(parseFloat(userStakeData.penaltyIfWithdrawNow))} QUICK
                </span>{' '}
                ({poolData.earlyWithdrawPenalty}% penalty)
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
