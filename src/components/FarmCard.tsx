import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { parseUnits, formatUnits } from 'viem'
import { CONTRACTS } from '../config/contracts'
import { MASTERCHEF_ABI } from '../config/abis'

export function FarmCard() {
  const { address, isConnected } = useAccount()
  const [amount, setAmount] = useState('')
  const [mode, setMode] = useState<'deposit' | 'withdraw'>('deposit')

  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const { data: poolLength } = useReadContract({
    address: CONTRACTS.MASTERCHEF,
    abi: MASTERCHEF_ABI,
    functionName: 'poolLength',
  })

  const { data: pendingRewards } = useReadContract({
    address: CONTRACTS.MASTERCHEF,
    abi: MASTERCHEF_ABI,
    functionName: 'pendingQuick',
    args: address ? [0n, address] : undefined,
    query: { enabled: !!address }
  })

  const handleDeposit = () => {
    if (!amount) return
    writeContract({
      address: CONTRACTS.MASTERCHEF,
      abi: MASTERCHEF_ABI,
      functionName: 'deposit',
      args: [0n, parseUnits(amount, 18)]
    })
  }

  const handleWithdraw = () => {
    if (!amount) return
    writeContract({
      address: CONTRACTS.MASTERCHEF,
      abi: MASTERCHEF_ABI,
      functionName: 'withdraw',
      args: [0n, parseUnits(amount, 18)]
    })
  }

  const handleHarvest = () => {
    writeContract({
      address: CONTRACTS.MASTERCHEF,
      abi: MASTERCHEF_ABI,
      functionName: 'deposit',
      args: [0n, 0n]
    })
  }

  const pendingFormatted = pendingRewards ? formatUnits(pendingRewards, 18) : '0'
  const poolCount = poolLength ? Number(poolLength) : 0

  return (
    <div className="glass-card p-6">
      <h2 className="text-xl font-display font-bold gradient-text mb-6">🌾 Farm</h2>
      
      <div className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="stat-card">
            <div className="text-xs text-gray-400 mb-1">Active Pools</div>
            <div className="text-xl font-bold text-white">{poolCount}</div>
          </div>
          <div className="stat-card">
            <div className="text-xs text-gray-400 mb-1">Pending QUICK</div>
            <div className="text-xl font-bold text-green-400">
              {parseFloat(pendingFormatted).toFixed(4)}
            </div>
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="flex gap-2 p-1 bg-atlantis-800/30 rounded-xl border border-atlantis-700/30">
          <button
            onClick={() => setMode('deposit')}
            className={`flex-1 py-2.5 rounded-lg font-medium transition-all duration-200 ${
              mode === 'deposit' 
                ? 'bg-gradient-to-r from-primary-500/20 to-secondary-500/20 text-white border border-primary-500/30 shadow-glow' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Stake
          </button>
          <button
            onClick={() => setMode('withdraw')}
            className={`flex-1 py-2.5 rounded-lg font-medium transition-all duration-200 ${
              mode === 'withdraw' 
                ? 'bg-gradient-to-r from-secondary-500/20 to-primary-500/20 text-white border border-secondary-500/30 shadow-glow-purple' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Unstake
          </button>
        </div>

        {/* Amount Input */}
        <div className="bg-atlantis-800/30 rounded-xl p-4 border border-atlantis-700/30">
          <div className="text-sm text-gray-400 mb-3">
            {mode === 'deposit' ? 'Amount to Stake (LP)' : 'Amount to Unstake (LP)'}
          </div>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.0"
            className="w-full bg-transparent text-2xl text-white outline-none font-medium"
          />
        </div>

        {/* Buttons */}
        {!isConnected ? (
          <div className="text-center text-gray-500 py-4 bg-atlantis-800/20 rounded-xl">Connect wallet</div>
        ) : poolCount === 0 ? (
          <div className="text-center text-yellow-400 py-4 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
            No pools available yet
          </div>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={mode === 'deposit' ? handleDeposit : handleWithdraw}
              disabled={isPending || isConfirming || !amount}
              className="flex-1 py-4 gradient-button font-bold"
            >
              {isPending || isConfirming 
                ? 'Processing...' 
                : mode === 'deposit' ? 'Stake LP' : 'Unstake LP'}
            </button>
            <button
              onClick={handleHarvest}
              disabled={isPending || isConfirming || parseFloat(pendingFormatted) === 0}
              className="px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 disabled:from-gray-600 disabled:to-gray-600 rounded-xl font-bold text-white transition-all hover:shadow-glow"
            >
              Harvest
            </button>
          </div>
        )}

        {isSuccess && (
          <div className="text-center text-green-400 text-sm py-2 bg-green-500/10 rounded-xl border border-green-500/20">
            ✓ Transaction successful!
          </div>
        )}
      </div>
    </div>
  )
}
