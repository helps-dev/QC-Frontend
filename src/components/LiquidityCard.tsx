import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { parseUnits, formatUnits } from 'viem'
import { CONTRACTS } from '../config/contracts'
import { ROUTER_ABI, ERC20_ABI } from '../config/abis'

export function LiquidityCard() {
  const { address, isConnected } = useAccount()
  const [tokenA] = useState(CONTRACTS.WMON)
  const [tokenB] = useState(CONTRACTS.QUICK)
  const [amountA, setAmountA] = useState('')
  const [amountB, setAmountB] = useState('')

  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const { data: balanceA } = useReadContract({
    address: tokenA,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  })

  const { data: balanceB } = useReadContract({
    address: tokenB,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  })

  const { data: allowanceA } = useReadContract({
    address: tokenA,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, CONTRACTS.ROUTER] : undefined,
    query: { enabled: !!address }
  })

  const { data: allowanceB } = useReadContract({
    address: tokenB,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, CONTRACTS.ROUTER] : undefined,
    query: { enabled: !!address }
  })

  const needsApprovalA = allowanceA !== undefined && amountA 
    ? allowanceA < parseUnits(amountA || '0', 18) 
    : false

  const needsApprovalB = allowanceB !== undefined && amountB 
    ? allowanceB < parseUnits(amountB || '0', 18) 
    : false

  const handleApprove = (token: `0x${string}`) => {
    writeContract({
      address: token,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [CONTRACTS.ROUTER, parseUnits('999999999', 18)]
    })
  }

  const handleAddLiquidity = () => {
    if (!address || !amountA || !amountB) return
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200)

    writeContract({
      address: CONTRACTS.ROUTER,
      abi: ROUTER_ABI,
      functionName: 'addLiquidity',
      args: [tokenA, tokenB, parseUnits(amountA, 18), parseUnits(amountB, 18), 0n, 0n, address, deadline]
    })
  }

  const balAFormatted = balanceA ? parseFloat(formatUnits(balanceA, 18)).toFixed(4) : '0'
  const balBFormatted = balanceB ? parseFloat(formatUnits(balanceB, 18)).toFixed(4) : '0'

  return (
    <div className="glass-card p-6">
      <h2 className="text-xl font-display font-bold gradient-text mb-6">💧 Add Liquidity</h2>
      
      <div className="space-y-3">
        {/* Token A */}
        <div className="bg-atlantis-800/30 rounded-xl p-4 border border-atlantis-700/30">
          <div className="flex justify-between text-sm mb-3">
            <span className="text-primary-400 font-medium">WMON</span>
            <span className="text-gray-400">Balance: {balAFormatted}</span>
          </div>
          <input
            type="number"
            value={amountA}
            onChange={(e) => setAmountA(e.target.value)}
            placeholder="0.0"
            className="w-full bg-transparent text-2xl text-white outline-none font-medium"
          />
        </div>

        <div className="flex justify-center">
          <div className="w-10 h-10 bg-atlantis-800 border border-atlantis-600/50 rounded-xl flex items-center justify-center">
            <span className="text-primary-400 text-xl">+</span>
          </div>
        </div>

        {/* Token B */}
        <div className="bg-atlantis-800/30 rounded-xl p-4 border border-atlantis-700/30">
          <div className="flex justify-between text-sm mb-3">
            <span className="text-secondary-400 font-medium">QUICK</span>
            <span className="text-gray-400">Balance: {balBFormatted}</span>
          </div>
          <input
            type="number"
            value={amountB}
            onChange={(e) => setAmountB(e.target.value)}
            placeholder="0.0"
            className="w-full bg-transparent text-2xl text-white outline-none font-medium"
          />
        </div>

        {/* Info */}
        <div className="bg-atlantis-800/20 rounded-xl p-4 space-y-2 text-sm border border-atlantis-700/20">
          <div className="flex justify-between">
            <span className="text-gray-500">Pool Fee</span>
            <span className="text-gray-300">0.5%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">LP Rewards</span>
            <span className="text-primary-400">0.4% per swap</span>
          </div>
        </div>

        {/* Buttons */}
        {!isConnected ? (
          <div className="text-center text-gray-500 py-4 bg-atlantis-800/20 rounded-xl">Connect wallet</div>
        ) : needsApprovalA ? (
          <button
            onClick={() => handleApprove(tokenA)}
            disabled={isPending || isConfirming}
            className="w-full py-4 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 disabled:from-gray-600 disabled:to-gray-600 rounded-xl font-bold text-white transition-all"
          >
            {isPending || isConfirming ? 'Approving...' : 'Approve WMON'}
          </button>
        ) : needsApprovalB ? (
          <button
            onClick={() => handleApprove(tokenB)}
            disabled={isPending || isConfirming}
            className="w-full py-4 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 disabled:from-gray-600 disabled:to-gray-600 rounded-xl font-bold text-white transition-all"
          >
            {isPending || isConfirming ? 'Approving...' : 'Approve QUICK'}
          </button>
        ) : (
          <button
            onClick={handleAddLiquidity}
            disabled={isPending || isConfirming || !amountA || !amountB}
            className="w-full py-4 gradient-button font-bold text-lg"
          >
            {isPending || isConfirming ? 'Adding...' : 'Add Liquidity'}
          </button>
        )}

        {isSuccess && (
          <div className="text-center text-green-400 text-sm py-2 bg-green-500/10 rounded-xl border border-green-500/20">
            ✓ Liquidity added!
          </div>
        )}
      </div>
    </div>
  )
}
