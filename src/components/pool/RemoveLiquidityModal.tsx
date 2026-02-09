import { useState, useEffect, useRef } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract, usePublicClient, useChainId } from 'wagmi'
import { useQueryClient } from '@tanstack/react-query'
import { parseUnits, formatUnits } from 'viem'
import { X, RefreshCw, Wallet } from '../Icons3D'
import { getContracts } from '../../config/contracts'
import { CHAIN_IDS } from '../../config/chains'
import { ROUTER_ABI, ERC20_ABI } from '../../config/abis'
import { PositionData } from './PoolPage'

// Token Icon
function TokenIcon({ symbol, size = 24 }: { symbol: string; size?: number }) {
  const colors: Record<string, string> = {
    WMON: 'from-purple-500 to-purple-700',
    MON: 'from-purple-400 to-purple-600',
    QUICK: 'from-blue-500 to-cyan-500',
  }
  return (
    <div
      className={`bg-gradient-to-br ${colors[symbol] || 'from-gray-500 to-gray-700'} rounded-full flex items-center justify-center text-white font-bold`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {symbol.slice(0, 2)}
    </div>
  )
}

function TokenPairIcon({ token0, token1 }: { token0: string; token1: string }) {
  return (
    <div className="flex -space-x-2">
      <div className="z-10"><TokenIcon symbol={token0} size={32} /></div>
      <div><TokenIcon symbol={token1} size={32} /></div>
    </div>
  )
}

function formatNum(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(2)}K`
  if (num >= 1) return num.toFixed(4)
  return num.toFixed(6)
}

interface RemoveLiquidityModalProps {
  position: PositionData
  onClose: () => void
  onSuccess: () => void
}

export function RemoveLiquidityModal({ position, onClose, onSuccess }: RemoveLiquidityModalProps) {
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()
  const queryClient = useQueryClient()
  const chainId = useChainId()
  const contracts = getContracts(chainId)
  const wrappedNativeAddress = contracts.WETH.toLowerCase()
  const nativeSymbol = chainId === CHAIN_IDS.MEGAETH ? 'ETH' : 'MON'
  const wrappedSymbol = chainId === CHAIN_IDS.MEGAETH ? 'WETH' : 'WMON'

  const [percentage, setPercentage] = useState(100)
  const [slippage, setSlippage] = useState(10)
  const [step, setStep] = useState<'input' | 'approve' | 'remove'>('input')
  
  // Track if component is mounted
  const isMounted = useRef(true)
  useEffect(() => {
    isMounted.current = true
    return () => { isMounted.current = false }
  }, [])

  const { writeContract, data: hash, isPending, reset } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const pairAddress = position.pair.id as `0x${string}`

  // Get LP token balance
  const { data: lpBalance } = useReadContract({
    address: pairAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })

  // Get LP token allowance
  const { data: lpAllowance, refetch: refetchAllowance } = useReadContract({
    address: pairAddress,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, contracts.ROUTER] : undefined,
    query: { enabled: !!address },
  })

  const totalSupply = parseFloat(position.pair.totalSupply) || 1
  const userLpBalance = lpBalance ? parseFloat(formatUnits(lpBalance, 18)) : 0
  const lpToRemoveWei = lpBalance ? (lpBalance * BigInt(percentage)) / 100n : 0n

  const sharePercent = (userLpBalance / totalSupply) * 100
  const token0Amount = parseFloat(position.pair.reserve0) * (userLpBalance / totalSupply) * (percentage / 100)
  const token1Amount = parseFloat(position.pair.reserve1) * (userLpBalance / totalSupply) * (percentage / 100)

  const isToken0WMON = position.pair.token0.id.toLowerCase() === wrappedNativeAddress
  const isToken1WMON = position.pair.token1.id.toLowerCase() === wrappedNativeAddress
  const hasWMON = isToken0WMON || isToken1WMON

  const needsApproval = lpAllowance !== undefined && lpToRemoveWei > 0n && lpAllowance < lpToRemoveWei

  const approveLp = async () => {
    setStep('approve')
    try {
      writeContract({
        address: pairAddress,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [contracts.ROUTER, parseUnits('999999999999', 18)],
      })
    } catch {
      setStep('input')
    }
  }

  const removeLiquidity = async () => {
    if (!address || !publicClient || lpToRemoveWei === 0n) return
    setStep('remove')

    const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200)
    const slipMult = BigInt(100 - slippage)

    const minAmount0 = (parseUnits(token0Amount.toFixed(18), 18) * slipMult) / 100n
    const minAmount1 = (parseUnits(token1Amount.toFixed(18), 18) * slipMult) / 100n

    try {
      if (hasWMON) {
        const tokenAddress = isToken0WMON ? (position.pair.token1.id as `0x${string}`) : (position.pair.token0.id as `0x${string}`)
        const minTokenAmount = isToken0WMON ? minAmount1 : minAmount0
        const minETHAmount = isToken0WMON ? minAmount0 : minAmount1

        const gasEstimate = await publicClient.estimateContractGas({
          address: contracts.ROUTER,
          abi: ROUTER_ABI,
          functionName: 'removeLiquidityETH',
          args: [tokenAddress, lpToRemoveWei, minTokenAmount, minETHAmount, address, deadline],
          account: address,
        })

        writeContract({
          address: contracts.ROUTER,
          abi: ROUTER_ABI,
          functionName: 'removeLiquidityETH',
          args: [tokenAddress, lpToRemoveWei, minTokenAmount, minETHAmount, address, deadline],
          gas: (gasEstimate * 120n) / 100n,
        })
      } else {
        const gasEstimate = await publicClient.estimateContractGas({
          address: contracts.ROUTER,
          abi: ROUTER_ABI,
          functionName: 'removeLiquidity',
          args: [position.pair.token0.id as `0x${string}`, position.pair.token1.id as `0x${string}`, lpToRemoveWei, minAmount0, minAmount1, address, deadline],
          account: address,
        })

        writeContract({
          address: contracts.ROUTER,
          abi: ROUTER_ABI,
          functionName: 'removeLiquidity',
          args: [position.pair.token0.id as `0x${string}`, position.pair.token1.id as `0x${string}`, lpToRemoveWei, minAmount0, minAmount1, address, deadline],
          gas: (gasEstimate * 120n) / 100n,
        })
      }
    } catch {
      setStep('input')
    }
  }

  useEffect(() => {
    if (isSuccess) {
      if (step === 'approve') {
        setTimeout(() => { 
          if (isMounted.current) {
            refetchAllowance()
            reset()
            setStep('input')
          }
        }, 2000)
      } else if (step === 'remove') {
        // Invalidate all queries to refresh balances
        queryClient.invalidateQueries()
        
        // Call onSuccess after a short delay to allow UI to show success message
        setTimeout(() => { 
          if (isMounted.current) {
            onSuccess()
            onClose()
          }
        }, 1500)
      }
    }
  }, [isSuccess, step, refetchAllowance, reset, onSuccess, onClose, queryClient])

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="glass-card w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-atlantis-700/50">
          <h2 className="text-xl font-bold text-white">Remove Liquidity</h2>
          <button onClick={onClose} className="p-2 hover:bg-atlantis-700/50 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Pool Info */}
          <div className="flex items-center gap-3 p-3 bg-atlantis-800/30 rounded-xl border border-atlantis-700/30">
            <TokenPairIcon token0={position.pair.token0.symbol} token1={position.pair.token1.symbol} />
            <div>
              <div className="font-semibold text-white">{position.pair.token0.symbol}/{position.pair.token1.symbol}</div>
              <div className="text-xs text-gray-500">Your share: {sharePercent.toFixed(4)}%</div>
            </div>
          </div>

          {/* Amount Selector */}
          <div className="bg-atlantis-800/30 rounded-xl p-4 border border-atlantis-700/30">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-400 text-sm">Amount to Remove</span>
              <span className="text-3xl font-bold text-white">{percentage}%</span>
            </div>

            <input
              type="range"
              min="1"
              max="100"
              value={percentage}
              onChange={(e) => setPercentage(parseInt(e.target.value))}
              className="w-full h-2 bg-atlantis-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
            />

            <div className="flex gap-2 mt-4">
              {[25, 50, 75, 100].map((pct) => (
                <button
                  key={pct}
                  onClick={() => setPercentage(pct)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${percentage === pct ? 'bg-primary-500 text-white' : 'bg-atlantis-700/50 text-gray-400 hover:bg-atlantis-600/50'}`}
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>

          {/* You Will Receive */}
          <div className="bg-atlantis-800/30 rounded-xl p-4 border border-atlantis-700/30">
            <div className="text-sm text-gray-400 mb-3">You will receive</div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <TokenIcon symbol={position.pair.token0.symbol} size={24} />
                  <span className="text-white">{position.pair.token0.symbol}</span>
                  {isToken0WMON && <span className="text-[10px] px-1 py-0.5 bg-purple-500/30 text-purple-300 rounded">→ {nativeSymbol}</span>}
                </div>
                <span className="text-white font-medium">{formatNum(token0Amount)}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <TokenIcon symbol={position.pair.token1.symbol} size={24} />
                  <span className="text-white">{position.pair.token1.symbol}</span>
                  {isToken1WMON && <span className="text-[10px] px-1 py-0.5 bg-purple-500/30 text-purple-300 rounded">→ {nativeSymbol}</span>}
                </div>
                <span className="text-white font-medium">{formatNum(token1Amount)}</span>
              </div>
            </div>
          </div>

          {/* Slippage */}
          <div className="bg-atlantis-800/30 rounded-xl p-3 border border-atlantis-700/30">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-400 text-sm">Slippage Tolerance</span>
              <span className="text-white font-semibold">{slippage}%</span>
            </div>
            <div className="flex gap-2">
              {[5, 10, 15, 20].map((s) => (
                <button
                  key={s}
                  onClick={() => setSlippage(s)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${slippage === s ? 'bg-primary-500 text-white' : 'bg-atlantis-700/50 text-gray-400 hover:bg-atlantis-600/50'}`}
                >
                  {s}%
                </button>
              ))}
            </div>
          </div>

          {/* Native Token Info */}
          {hasWMON && (
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-3 flex items-start gap-2">
              <Wallet className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-purple-400 text-sm font-medium">Receive Native {nativeSymbol}</p>
                <p className="text-purple-300/70 text-xs">{wrappedSymbol} will be auto-unwrapped to native {nativeSymbol}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {!isConnected ? (
            <button className="w-full py-4 bg-atlantis-700/50 rounded-xl text-gray-400 font-semibold cursor-not-allowed">Connect Wallet</button>
          ) : needsApproval ? (
            <button onClick={approveLp} disabled={isPending || isConfirming} className="w-full py-4 bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 rounded-xl text-white font-semibold disabled:opacity-50">
              {isPending || isConfirming ? <span className="flex items-center justify-center gap-2"><RefreshCw className="w-4 h-4 animate-spin" /> Approving LP Token...</span> : 'Approve LP Token'}
            </button>
          ) : (
            <button onClick={removeLiquidity} disabled={isPending || isConfirming || lpToRemoveWei === 0n} className="w-full py-4 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 rounded-xl text-white font-semibold disabled:opacity-50">
              {isPending || isConfirming ? <span className="flex items-center justify-center gap-2"><RefreshCw className="w-4 h-4 animate-spin" /> Removing...</span> : `Remove ${percentage}% Liquidity`}
            </button>
          )}

          {isSuccess && step === 'remove' && (
            <div className="text-center text-green-400 text-sm py-3 bg-green-500/10 rounded-xl border border-green-500/30">✓ Liquidity removed successfully!</div>
          )}
        </div>
      </div>
    </div>
  )
}
