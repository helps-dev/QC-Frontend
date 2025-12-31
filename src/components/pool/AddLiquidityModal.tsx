import { useState, useEffect, useRef } from 'react'
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
  useBalance,
  usePublicClient,
} from 'wagmi'
import { useQueryClient } from '@tanstack/react-query'
import { parseUnits, formatUnits } from 'viem'
import { X, Plus, RefreshCw, AlertTriangle, Lock, Unlock, Info, ChevronDown } from 'lucide-react'
import { CONTRACTS } from '../../config/contracts'
import { ROUTER_ABI, ERC20_ABI } from '../../config/abis'
import { TokenModal } from '../TokenModal'
import { type Token, MON_TOKEN, QUICK_TOKEN } from '../../config/tokens'
import { usePoolRatio } from '../../hooks/usePoolRatio'

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

interface AddLiquidityModalProps {
  onClose: () => void
  onSuccess: () => void
}

export function AddLiquidityModal({ onClose, onSuccess }: AddLiquidityModalProps) {
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()
  const queryClient = useQueryClient()
  
  // Track if component is mounted
  const isMounted = useRef(true)
  useEffect(() => {
    isMounted.current = true
    return () => { isMounted.current = false }
  }, [])

  // Token state
  const [tokenA, setTokenA] = useState<Token>(MON_TOKEN)
  const [tokenB, setTokenB] = useState<Token>(QUICK_TOKEN)
  const [amountA, setAmountA] = useState('')
  const [amountB, setAmountB] = useState('')
  const [slippage, setSlippage] = useState(10)
  const [isLocked, setIsLocked] = useState(true)
  const [lastChanged, setLastChanged] = useState<'a' | 'b' | null>(null)

  // Modal state
  const [showTokenModalA, setShowTokenModalA] = useState(false)
  const [showTokenModalB, setShowTokenModalB] = useState(false)

  // Handle mode toggle - reset amounts when switching to manual
  const handleModeToggle = () => {
    if (isLocked) {
      // Switching from Auto to Manual - keep current values
      setIsLocked(false)
    } else {
      // Switching from Manual to Auto - recalculate based on amountA
      setIsLocked(true)
      if (amountA && parseFloat(amountA) > 0) {
        setLastChanged('a')
      }
    }
  }

  // Contract interactions
  const { writeContract, data: hash, isPending, reset } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  // Pool ratio hook
  const { ratio, poolExists, loading: ratioLoading, calculateAmountB, calculateAmountA, refetch: refetchRatio } = usePoolRatio(tokenA, tokenB)

  // Balances
  const { data: nativeBalance } = useBalance({ address })
  const { data: balAData } = useReadContract({
    address: tokenA.address,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !tokenA.isNative },
  })
  const { data: balBData } = useReadContract({
    address: tokenB.address,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !tokenB.isNative },
  })

  // Allowances
  const { data: allowA, refetch: refetchAllowA } = useReadContract({
    address: tokenA.address,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, CONTRACTS.ROUTER] : undefined,
    query: { enabled: !!address && !tokenA.isNative },
  })
  const { data: allowB, refetch: refetchAllowB } = useReadContract({
    address: tokenB.address,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, CONTRACTS.ROUTER] : undefined,
    query: { enabled: !!address && !tokenB.isNative },
  })

  // Calculate balances
  const balanceA = tokenA.isNative
    ? nativeBalance ? parseFloat(formatUnits(nativeBalance.value, 18)) : 0
    : balAData ? parseFloat(formatUnits(balAData, tokenA.decimals)) : 0

  const balanceB = tokenB.isNative
    ? nativeBalance ? parseFloat(formatUnits(nativeBalance.value, 18)) : 0
    : balBData ? parseFloat(formatUnits(balBData, tokenB.decimals)) : 0

  const amtAWei = amountA && parseFloat(amountA) > 0 ? parseUnits(amountA, tokenA.decimals) : 0n
  const amtBWei = amountB && parseFloat(amountB) > 0 ? parseUnits(amountB, tokenB.decimals) : 0n

  const needsApproveA = !tokenA.isNative && allowA !== undefined && amtAWei > 0n && allowA < amtAWei
  const needsApproveB = !tokenB.isNative && allowB !== undefined && amtBWei > 0n && allowB < amtBWei

  const [step, setStep] = useState<'input' | 'approveA' | 'approveB' | 'add'>('input')

  // Auto-calculate
  useEffect(() => {
    if (!isLocked || ratioLoading) return
    if (lastChanged === 'a' && amountA) {
      const calcB = calculateAmountB(amountA)
      if (calcB && calcB !== amountB) setAmountB(calcB)
    } else if (lastChanged === 'b' && amountB) {
      const calcA = calculateAmountA(amountB)
      if (calcA && calcA !== amountA) setAmountA(calcA)
    }
  }, [amountA, amountB, isLocked, lastChanged, ratioLoading, calculateAmountA, calculateAmountB])

  const handleAmountAChange = (value: string) => {
    setLastChanged('a')
    setAmountA(value)
  }

  const handleAmountBChange = (value: string) => {
    setLastChanged('b')
    setAmountB(value)
  }

  const handleSelectTokenA = (token: Token) => {
    if (token.address === tokenB.address) setTokenB(tokenA)
    setTokenA(token)
    setShowTokenModalA(false)
    setAmountA('')
    setAmountB('')
  }

  const handleSelectTokenB = (token: Token) => {
    if (token.address === tokenA.address) setTokenA(tokenB)
    setTokenB(token)
    setShowTokenModalB(false)
    setAmountA('')
    setAmountB('')
  }

  const approveA = async () => {
    setStep('approveA')
    try {
      // Approve max uint256 for unlimited approval
      const maxApproval = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')
      writeContract({
        address: tokenA.address,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [CONTRACTS.ROUTER, maxApproval],
      })
    } catch {
      setStep('input')
    }
  }

  const approveB = async () => {
    setStep('approveB')
    try {
      // Approve max uint256 for unlimited approval
      const maxApproval = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')
      writeContract({
        address: tokenB.address,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [CONTRACTS.ROUTER, maxApproval],
      })
    } catch {
      setStep('input')
    }
  }

  const addLiquidity = async () => {
    if (!address || !amountA || !amountB || !publicClient) return
    setStep('add')

    const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200)
    const slipMult = BigInt(100 - slippage)
    const isTokenANative = tokenA.isNative
    const isTokenBNative = tokenB.isNative

    try {
      if (isTokenANative || isTokenBNative) {
        const nativeAmount = isTokenANative ? amtAWei : amtBWei
        const tokenAmount = isTokenANative ? amtBWei : amtAWei
        const tokenAddress = isTokenANative ? tokenB.address : tokenA.address
        const minToken = (tokenAmount * slipMult) / 100n
        const minETH = (nativeAmount * slipMult) / 100n

        const gasEstimate = await publicClient.estimateContractGas({
          address: CONTRACTS.ROUTER,
          abi: ROUTER_ABI,
          functionName: 'addLiquidityETH',
          args: [tokenAddress, tokenAmount, minToken, minETH, address, deadline],
          value: nativeAmount,
          account: address,
        })

        writeContract({
          address: CONTRACTS.ROUTER,
          abi: ROUTER_ABI,
          functionName: 'addLiquidityETH',
          args: [tokenAddress, tokenAmount, minToken, minETH, address, deadline],
          value: nativeAmount,
          gas: (gasEstimate * 120n) / 100n,
        })
      } else {
        const gasEstimate = await publicClient.estimateContractGas({
          address: CONTRACTS.ROUTER,
          abi: ROUTER_ABI,
          functionName: 'addLiquidity',
          args: [tokenA.address, tokenB.address, amtAWei, amtBWei, (amtAWei * slipMult) / 100n, (amtBWei * slipMult) / 100n, address, deadline],
          account: address,
        })

        writeContract({
          address: CONTRACTS.ROUTER,
          abi: ROUTER_ABI,
          functionName: 'addLiquidity',
          args: [tokenA.address, tokenB.address, amtAWei, amtBWei, (amtAWei * slipMult) / 100n, (amtBWei * slipMult) / 100n, address, deadline],
          gas: (gasEstimate * 120n) / 100n,
        })
      }
    } catch {
      setStep('input')
    }
  }

  useEffect(() => {
    if (isSuccess) {
      if (step === 'approveA') {
        setTimeout(() => { 
          if (isMounted.current) {
            refetchAllowA()
            reset()
            setStep('input')
          }
        }, 2000)
      } else if (step === 'approveB') {
        setTimeout(() => { 
          if (isMounted.current) {
            refetchAllowB()
            reset()
            setStep('input')
          }
        }, 2000)
      } else if (step === 'add') {
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
  }, [isSuccess, step, refetchAllowA, refetchAllowB, reset, onSuccess, onClose, queryClient])

  const canAdd = amountA && amountB && parseFloat(amountA) > 0 && parseFloat(amountB) > 0 && !needsApproveA && !needsApproveB

  // Validation checks
  const amountAExceedsBalance = parseFloat(amountA || '0') > balanceA
  const amountBExceedsBalance = parseFloat(amountB || '0') > balanceB
  const hasInsufficientBalance = amountAExceedsBalance || amountBExceedsBalance

  // Final check for add button
  const canAddLiquidity = canAdd && !hasInsufficientBalance

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="glass-card w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-atlantis-700/50">
            <h2 className="text-xl font-bold text-white">Add Liquidity</h2>
            <button onClick={onClose} className="p-2 hover:bg-atlantis-700/50 rounded-lg transition-colors">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            {/* Pool Ratio Info */}
            <div className="bg-atlantis-800/30 rounded-xl p-3 border border-atlantis-700/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {ratioLoading ? <RefreshCw className="w-3 h-3 text-primary-400 animate-spin" /> : <Info className="w-3 h-3 text-gray-400" />}
                  <span className="text-gray-400 text-xs">Pool Ratio</span>
                </div>
                <button
                  onClick={handleModeToggle}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all ${isLocked ? 'bg-primary-500/20 text-primary-400' : 'bg-amber-500/20 text-amber-400'}`}
                >
                  {isLocked ? <><Lock className="w-2.5 h-2.5" /> Auto</> : <><Unlock className="w-2.5 h-2.5" /> Manual</>}
                </button>
              </div>
              <div className="mt-2 flex items-center justify-between">
                {ratioLoading ? (
                  <span className="text-gray-500 text-xs">Loading...</span>
                ) : poolExists ? (
                  <>
                    <span className="text-white text-sm font-semibold">1 {tokenA.symbol} = {ratio.toFixed(4)} {tokenB.symbol}</span>
                    <button onClick={refetchRatio} className="text-primary-400 hover:text-primary-300 p-1"><RefreshCw className="w-3 h-3" /></button>
                  </>
                ) : (
                  <span className="text-amber-400 text-xs flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> New pool - you set ratio</span>
                )}
              </div>
            </div>

            {/* Token A Input - Swap Style */}
            <div className="bg-atlantis-800/40 rounded-2xl p-4 border border-atlantis-700/30">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-400">You pay</span>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-gray-500">Balance: {balanceA.toFixed(4)}</span>
                  <button 
                    onClick={() => handleAmountAChange(tokenA.isNative ? (balanceA * 0.95).toFixed(6) : balanceA.toFixed(6))} 
                    className="text-primary-400 hover:text-primary-300 font-semibold transition-colors"
                  >
                    MAX
                  </button>
                </div>
              </div>
              <div className="flex gap-3 items-center">
                <input
                  type="number"
                  value={amountA}
                  onChange={(e) => handleAmountAChange(e.target.value)}
                  placeholder="0"
                  className="flex-1 min-w-0 bg-transparent text-3xl font-semibold text-white outline-none placeholder-gray-600"
                />
                <button 
                  onClick={() => setShowTokenModalA(true)} 
                  className="flex items-center gap-2 bg-atlantis-700/60 hover:bg-atlantis-600/60 border border-atlantis-600/50 hover:border-primary-500/30 rounded-2xl px-3 py-2 transition-all shrink-0"
                >
                  {tokenA.logoURI ? (
                    <img src={tokenA.logoURI} alt={tokenA.symbol} className="w-7 h-7 rounded-full" />
                  ) : (
                    <TokenIcon symbol={tokenA.symbol} size={28} />
                  )}
                  <span className="font-semibold text-white">{tokenA.symbol}</span>
                  {tokenA.isNative && <span className="text-primary-400 text-xs">⚡</span>}
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Plus Icon - Swap Style */}
            <div className="flex justify-center -my-3 relative z-10">
              <div className="w-10 h-10 bg-atlantis-900 border-4 border-atlantis-950 rounded-xl flex items-center justify-center">
                <Plus className="w-4 h-4 text-gray-400" />
              </div>
            </div>

            {/* Token B Input - Swap Style */}
            <div className="bg-atlantis-800/40 rounded-2xl p-4 border border-atlantis-700/30">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-400">You pay</span>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-gray-500">Balance: {balanceB.toFixed(4)}</span>
                  <button 
                    onClick={() => handleAmountBChange(tokenB.isNative ? (balanceB * 0.95).toFixed(6) : balanceB.toFixed(6))} 
                    className="text-primary-400 hover:text-primary-300 font-semibold transition-colors"
                  >
                    MAX
                  </button>
                </div>
              </div>
              <div className="flex gap-3 items-center">
                <input
                  type="number"
                  value={amountB}
                  onChange={(e) => handleAmountBChange(e.target.value)}
                  placeholder="0"
                  className="flex-1 min-w-0 bg-transparent text-3xl font-semibold text-white outline-none placeholder-gray-600"
                />
                <button 
                  onClick={() => setShowTokenModalB(true)} 
                  className="flex items-center gap-2 bg-atlantis-700/60 hover:bg-atlantis-600/60 border border-atlantis-600/50 hover:border-primary-500/30 rounded-2xl px-3 py-2 transition-all shrink-0"
                >
                  {tokenB.logoURI ? (
                    <img src={tokenB.logoURI} alt={tokenB.symbol} className="w-7 h-7 rounded-full" />
                  ) : (
                    <TokenIcon symbol={tokenB.symbol} size={28} />
                  )}
                  <span className="font-semibold text-white">{tokenB.symbol}</span>
                  {tokenB.isNative && <span className="text-primary-400 text-xs">⚡</span>}
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Slippage - Swap Style */}
            <div className="bg-atlantis-800/30 rounded-xl p-4 border border-atlantis-700/30">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-gray-400">Slippage Tolerance</span>
                <span className="text-white text-sm font-semibold">{slippage}%</span>
              </div>
              <div className="flex gap-2">
                {[5, 10, 15, 20].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSlippage(s)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      slippage === s 
                        ? 'bg-gradient-to-r from-purple-600 to-violet-600 text-white' 
                        : 'bg-atlantis-700/50 text-gray-400 hover:bg-atlantis-600/50 hover:text-white'
                    }`}
                  >
                    {s}%
                  </button>
                ))}
              </div>
            </div>

            {/* Balance Warning */}
            {hasInsufficientBalance && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                <p className="text-red-400 text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  {amountAExceedsBalance && amountBExceedsBalance 
                    ? `Insufficient ${tokenA.symbol} and ${tokenB.symbol} balance`
                    : amountAExceedsBalance 
                      ? `Insufficient ${tokenA.symbol} balance`
                      : `Insufficient ${tokenB.symbol} balance`
                  }
                </p>
              </div>
            )}

            {/* Action Button - Swap Style */}
            <div className="pt-2">
              {!isConnected ? (
                <button className="w-full py-4 bg-atlantis-700/50 rounded-2xl font-semibold text-gray-400 cursor-not-allowed">
                  Connect Wallet
                </button>
              ) : hasInsufficientBalance ? (
                <button className="w-full py-4 bg-red-600/50 rounded-2xl font-semibold text-red-300 cursor-not-allowed">
                  Insufficient Balance
                </button>
              ) : needsApproveA ? (
                <button 
                  onClick={approveA} 
                  disabled={isPending || isConfirming} 
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 disabled:from-gray-600 disabled:to-gray-600 rounded-2xl font-bold text-white transition-all shadow-lg hover:shadow-purple-500/25"
                >
                  {isPending || isConfirming ? (
                    <span className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" /> Approving...
                    </span>
                  ) : (
                    `Approve ${tokenA.symbol}`
                  )}
                </button>
              ) : needsApproveB ? (
                <button 
                  onClick={approveB} 
                  disabled={isPending || isConfirming} 
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 disabled:from-gray-600 disabled:to-gray-600 rounded-2xl font-bold text-white transition-all shadow-lg hover:shadow-purple-500/25"
                >
                  {isPending || isConfirming ? (
                    <span className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" /> Approving...
                    </span>
                  ) : (
                    `Approve ${tokenB.symbol}`
                  )}
                </button>
              ) : (
                <button 
                  onClick={addLiquidity} 
                  disabled={!canAddLiquidity || isPending || isConfirming} 
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 disabled:from-gray-600 disabled:to-gray-600 rounded-2xl font-bold text-white text-lg transition-all shadow-lg hover:shadow-purple-500/25"
                >
                  {isPending || isConfirming ? (
                    <span className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin" /> Adding Liquidity...
                    </span>
                  ) : (
                    'Add Liquidity'
                  )}
                </button>
              )}
            </div>

            {isSuccess && step === 'add' && (
              <div className="text-center text-green-400 text-sm py-3 bg-green-500/10 rounded-xl border border-green-500/30">✓ Liquidity added successfully!</div>
            )}
          </div>
        </div>
      </div>

      {showTokenModalA && <TokenModal onSelect={handleSelectTokenA} onClose={() => setShowTokenModalA(false)} onImport={() => {}} />}
      {showTokenModalB && <TokenModal onSelect={handleSelectTokenB} onClose={() => setShowTokenModalB(false)} onImport={() => {}} />}
    </>
  )
}
