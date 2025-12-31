import { Plus, Minus, Gift, RefreshCw, ExternalLink, Clock, AlertTriangle } from 'lucide-react'
import { useROICalculatorStore } from '../../store/calculatorStore'

function formatNum(num: number, decimals = 2): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(decimals)}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(decimals)}K`
  if (num >= 1) return num.toFixed(decimals)
  if (num >= 0.0001) return num.toFixed(4)
  return num.toFixed(6)
}

function formatDate(timestamp: number): string {
  if (timestamp === 0) return 'N/A'
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatTimeRemaining(endTimestamp: number): string {
  const now = Math.floor(Date.now() / 1000)
  const remaining = endTimestamp - now
  if (remaining <= 0) return 'Unlocked'

  const days = Math.floor(remaining / 86400)
  const hours = Math.floor((remaining % 86400) / 3600)

  if (days > 0) return `${days}d ${hours}h remaining`
  return `${hours}h remaining`
}

interface ActionButtonProps {
  icon: React.ReactNode
  label: string
  onClick: () => void
  disabled?: boolean
  variant?: 'primary' | 'success' | 'warning' | 'danger'
}

function ActionButton({ icon, label, onClick, disabled, variant = 'primary' }: ActionButtonProps) {
  const variants = {
    primary: 'bg-primary-500/20 hover:bg-primary-500/30 border-primary-500/30 text-primary-400',
    success: 'bg-green-500/20 hover:bg-green-500/30 border-green-500/30 text-green-400',
    warning: 'bg-yellow-500/20 hover:bg-yellow-500/30 border-yellow-500/30 text-yellow-400',
    danger: 'bg-red-500/20 hover:bg-red-500/30 border-red-500/30 text-red-400',
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex-1 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 border ${
        disabled ? 'opacity-50 cursor-not-allowed bg-gray-600/20 border-gray-500/30 text-gray-500' : variants[variant]
      }`}
    >
      {icon}
      {label}
    </button>
  )
}

export function UserStakedView() {
  const { userStakeData, poolData, quickPrice, closeModal } = useROICalculatorStore()

  const stakedAmount = parseFloat(userStakeData.stakedAmount)
  const pendingRewards = parseFloat(userStakeData.pendingRewards)
  const hasStake = stakedAmount > 0
  const hasRewards = pendingRewards > 0

  const handleAction = (action: string) => {
    closeModal()
    // The actual action will be handled by the parent component
    // This just closes the modal and lets user interact with main UI
    console.log(`[UserStakedView] Action: ${action}`)
  }

  if (!hasStake) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 rounded-full bg-atlantis-800/50 flex items-center justify-center mx-auto mb-4">
          <Gift className="w-10 h-10 text-gray-600" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">No Active Stakes</h3>
        <p className="text-gray-400 text-sm mb-6">
          You haven't staked any QUICK tokens yet.
          <br />
          Start staking to earn rewards!
        </p>
        <button
          onClick={() => handleAction('stake')}
          className="px-6 py-3 rounded-xl font-semibold gradient-button hover:shadow-glow transition-all"
        >
          🚀 Start Staking
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Position Card */}
      <div className="bg-gradient-to-r from-primary-500/10 to-secondary-500/10 rounded-xl p-5 border border-primary-500/20">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white">Your QUICK Stake</h3>
          <a
            href="https://explorer.monad.xyz/address/0x825eCCd2Df16CA272250134F66511AddCacAa4B9"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1"
          >
            <ExternalLink className="w-3 h-3" />
            Contract
          </a>
        </div>

        {/* Staked Amount */}
        <div className="bg-atlantis-900/50 rounded-xl p-4 mb-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-gray-400 mb-1">Staked Amount</p>
              <p className="text-2xl font-bold text-white">{formatNum(stakedAmount)} QUICK</p>
              <p className="text-sm text-gray-500">${formatNum(stakedAmount * quickPrice)} USD</p>
            </div>
            <div
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                userStakeData.isLocked
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : 'bg-green-500/20 text-green-400'
              }`}
            >
              {userStakeData.isLocked ? '🔒 Locked' : '🔓 Unlocked'}
            </div>
          </div>
        </div>

        {/* Pending Rewards */}
        <div className="bg-green-500/10 rounded-xl p-4 border border-green-500/20 mb-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-gray-400 mb-1">Pending Rewards</p>
              <p className="text-2xl font-bold text-green-400">{formatNum(pendingRewards)} QUICK</p>
              <p className="text-sm text-gray-500">${formatNum(pendingRewards * quickPrice)} USD</p>
            </div>
            <Gift className="w-6 h-6 text-green-400" />
          </div>
        </div>

        {/* Lock Info */}
        {userStakeData.lockEndTime > 0 && (
          <div className="bg-atlantis-800/50 rounded-xl p-3 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-gray-400">Lock Period</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-white">
                  {formatTimeRemaining(userStakeData.lockEndTime)}
                </p>
                <p className="text-xs text-gray-500">
                  Ends: {formatDate(userStakeData.lockEndTime)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <ActionButton
            icon={<Plus className="w-4 h-4" />}
            label="Add"
            onClick={() => handleAction('add')}
            variant="primary"
          />
          <ActionButton
            icon={<Minus className="w-4 h-4" />}
            label="Remove"
            onClick={() => handleAction('remove')}
            variant="danger"
            disabled={!hasStake}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <ActionButton
            icon={<Gift className="w-4 h-4" />}
            label="Claim"
            onClick={() => handleAction('claim')}
            variant="success"
            disabled={!hasRewards}
          />
          <ActionButton
            icon={<RefreshCw className="w-4 h-4" />}
            label={`Compound (+${poolData.compoundBonus}%)`}
            onClick={() => handleAction('compound')}
            variant="warning"
            disabled={!hasRewards}
          />
        </div>
      </div>

      {/* Early Withdrawal Warning */}
      {userStakeData.isLocked && (
        <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-red-400 font-medium text-sm">Early Withdrawal Penalty</p>
              <p className="text-red-300/70 text-xs mt-1">
                Withdrawing before lock period ends will incur a{' '}
                <span className="font-bold">{poolData.earlyWithdrawPenalty}%</span> penalty.
              </p>
              <p className="text-red-300/70 text-xs mt-1">
                Penalty amount:{' '}
                <span className="font-bold">
                  {formatNum(parseFloat(userStakeData.penaltyIfWithdrawNow))} QUICK
                </span>{' '}
                (${formatNum(parseFloat(userStakeData.penaltyIfWithdrawNow) * quickPrice)})
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Summary */}
      <div className="bg-atlantis-800/30 rounded-xl p-4 border border-atlantis-700/30">
        <h4 className="text-sm font-medium text-white mb-3">Position Summary</h4>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Total Value</span>
            <span className="text-white font-medium">
              ${formatNum((stakedAmount + pendingRewards) * quickPrice)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Current APR</span>
            <span className="text-green-400 font-medium">{poolData.apr.toFixed(1)}%</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Compound Bonus</span>
            <span className="text-yellow-400 font-medium">+{poolData.compoundBonus}%</span>
          </div>
        </div>
      </div>
    </div>
  )
}
