import { useState, useEffect } from 'react'
import { useAccount, useBalance, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits, parseEther, formatUnits, formatEther } from 'viem'
import { ChevronDown, ArrowDownUp, Info, BarChart2 } from 'lucide-react'
import { CONTRACTS, FEE } from '../../config/contracts'
import { ROUTER_ABI, ERC20_ABI, WMON_ABI } from '../../config/abis'
import { DEFAULT_TOKENS, NATIVE_ADDRESS, getStoredTokens, type Token } from '../../config/tokens'
import { TokenModal } from '../TokenModal'
import { TokenImportModal } from '../TokenImportModal'
import { TransactionSettings, type SwapSettings } from '../TransactionSettings'

interface SwapCardWithChartToggleProps {
  isChartVisible: boolean
  onToggleChart: () => void
  onTokenChange?: (tokenIn: Token, tokenOut: Token) => void
}

export function SwapCardWithChartToggle({ isChartVisible, onToggleChart, onTokenChange }: SwapCardWithChartToggleProps) {
  const { address, isConnected } = useAccount()
  const [tokenIn, setTokenIn] = useState<Token>(DEFAULT_TOKENS[0]) // MON
  const [tokenOut, setTokenOut] = useState<Token>(DEFAULT_TOKENS[2]) // QUICK
  const [amountIn, setAmountIn] = useState('')
  const [amountOut, setAmountOut] = useState('')
  const [settings, setSettings] = useState<SwapSettings>({ slippage: 0.5, deadline: 20, expertMode: false })
  const [showTokenModal, setShowTokenModal] = useState<'in' | 'out' | null>(null)
  const [showImportModal, setShowImportModal] = useState(false)
  const [, setCustomTokens] = useState<Token[]>([])
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    setCustomTokens(getStoredTokens())
  }, [])

  // Notify parent when tokens change
  useEffect(() => {
    if (onTokenChange) {
      onTokenChange(tokenIn, tokenOut)
    }
  }, [tokenIn, tokenOut, onTokenChange])

  const isNativeIn = tokenIn.address === NATIVE_ADDRESS
  const isNativeOut = tokenOut.address === NATIVE_ADDRESS
  const isWmonIn = tokenIn.address.toLowerCase() === CONTRACTS.WMON.toLowerCase()
  const isWmonOut = tokenOut.address.toLowerCase() === CONTRACTS.WMON.toLowerCase()
  
  const isWrapOperation = isNativeIn && isWmonOut
  const isUnwrapOperation = isWmonIn && isNativeOut
  const isWrapOrUnwrap = isWrapOperation || isUnwrapOperation

  const routeTokenIn = isNativeIn ? CONTRACTS.WMON : tokenIn.address
  const routeTokenOut = isNativeOut ? CONTRACTS.WMON : tokenOut.address

  const { writeContract, data: hash, isPending, reset } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  useEffect(() => {
    if (isSuccess) {
      setAmountIn('')
      setAmountOut('')
      const timer = setTimeout(() => reset(), 3000)
      return () => clearTimeout(timer)
    }
  }, [isSuccess, reset])

  const { data: amountsOut } = useReadContract({
    address: CONTRACTS.ROUTER,
    abi: ROUTER_ABI,
    functionName: 'getAmountsOut',
    args: amountIn && parseFloat(amountIn) > 0 
      ? [parseUnits(amountIn, 18), [routeTokenIn, routeTokenOut]] 
      : undefined,
    query: { enabled: !!amountIn && parseFloat(amountIn) > 0 && !isWrapOrUnwrap && routeTokenIn !== routeTokenOut }
  })

  const { data: nativeBalance } = useBalance({ address })
  
  const { data: tokenInBalance } = useReadContract({
    address: tokenIn.address,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !isNativeIn }
  })

  const { data: tokenOutBalance } = useReadContract({
    address: tokenOut.address,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !isNativeOut }
  })

  const { data: wmonBalance } = useReadContract({
    address: CONTRACTS.WMON,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  })

  const { data: allowance } = useReadContract({
    address: tokenIn.address,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, CONTRACTS.ROUTER] : undefined,
    query: { enabled: !!address && !isNativeIn && !isWrapOrUnwrap }
  })

  useEffect(() => {
    if (isWrapOrUnwrap) {
      setAmountOut(amountIn || '')
    } else if (amountsOut) {
      setAmountOut(formatUnits(amountsOut[1], 18))
    } else {
      setAmountOut('')
    }
  }, [amountsOut, amountIn, isWrapOrUnwrap])

  const balanceIn = isNativeIn 
    ? (nativeBalance ? formatEther(nativeBalance.value) : '0')
    : (tokenInBalance ? formatUnits(tokenInBalance, 18) : '0')

  const balanceOut = isNativeOut
    ? (nativeBalance ? formatEther(nativeBalance.value) : '0')
    : isWmonOut
    ? (wmonBalance ? formatUnits(wmonBalance, 18) : '0')
    : (tokenOutBalance ? formatUnits(tokenOutBalance, 18) : '0')

  const needsApproval = !isNativeIn && !isWrapOrUnwrap && allowance !== undefined && amountIn 
    ? allowance < parseUnits(amountIn || '0', 18) 
    : false

  const handleApprove = () => {
    writeContract({
      address: tokenIn.address,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [CONTRACTS.ROUTER, parseUnits('999999999', 18)]
    })
  }

  const handleWrap = () => {
    if (!address || !amountIn) return
    writeContract({
      address: CONTRACTS.WMON,
      abi: WMON_ABI,
      functionName: 'deposit',
      value: parseEther(amountIn)
    })
  }

  const handleUnwrap = () => {
    if (!address || !amountIn) return
    writeContract({
      address: CONTRACTS.WMON,
      abi: WMON_ABI,
      functionName: 'withdraw',
      args: [parseUnits(amountIn, 18)]
    })
  }

  const handleSwap = () => {
    if (!address || !amountIn || !amountOut) return
    
    if (isWrapOperation) {
      handleWrap()
      return
    }
    if (isUnwrapOperation) {
      handleUnwrap()
      return
    }

    const minOut = parseUnits((parseFloat(amountOut) * (1 - settings.slippage / 100)).toFixed(18), 18)
    const deadline = BigInt(Math.floor(Date.now() / 1000) + settings.deadline * 60)

    if (isNativeIn) {
      writeContract({
        address: CONTRACTS.ROUTER,
        abi: ROUTER_ABI,
        functionName: 'swapExactETHForTokens',
        args: [minOut, [CONTRACTS.WMON, routeTokenOut], address, deadline],
        value: parseEther(amountIn)
      })
    } else if (isNativeOut) {
      writeContract({
        address: CONTRACTS.ROUTER,
        abi: ROUTER_ABI,
        functionName: 'swapExactTokensForETH',
        args: [parseUnits(amountIn, 18), minOut, [routeTokenIn, CONTRACTS.WMON], address, deadline]
      })
    } else {
      writeContract({
        address: CONTRACTS.ROUTER,
        abi: ROUTER_ABI,
        functionName: 'swapExactTokensForTokens',
        args: [parseUnits(amountIn, 18), minOut, [routeTokenIn, routeTokenOut], address, deadline]
      })
    }
  }

  const switchTokens = () => {
    setTokenIn(tokenOut)
    setTokenOut(tokenIn)
    setAmountIn('')
    setAmountOut('')
  }

  const handleTokenSelect = (token: Token, type: 'in' | 'out') => {
    if (type === 'in') {
      if (token.address === tokenOut.address) {
        setTokenOut(tokenIn)
      }
      setTokenIn(token)
    } else {
      if (token.address === tokenIn.address) {
        setTokenIn(tokenOut)
      }
      setTokenOut(token)
    }
    setShowTokenModal(null)
    setAmountIn('')
    setAmountOut('')
  }

  const handleTokenImported = (token: Token) => {
    setCustomTokens(prev => [...prev, token])
    setShowImportModal(false)
  }

  const setMaxAmount = () => {
    if (isNativeIn && nativeBalance) {
      const max = parseFloat(formatEther(nativeBalance.value)) - 0.01
      setAmountIn(max > 0 ? max.toFixed(6) : '0')
    } else if (tokenInBalance) {
      setAmountIn(formatUnits(tokenInBalance, 18))
    }
  }

  const rate = amountIn && amountOut && parseFloat(amountIn) > 0 
    ? (parseFloat(amountOut) / parseFloat(amountIn)).toFixed(6) 
    : '0'

  const isSameToken = !isWrapOrUnwrap && routeTokenIn === routeTokenOut

  const getButtonText = () => {
    if (isWrapOperation) return 'Wrap'
    if (isUnwrapOperation) return 'Unwrap'
    return 'Swap'
  }

  return (
    <div className="glass-card p-5">
      {/* Header with Chart Toggle */}
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-xl font-display font-bold text-white">
          {isWrapOperation ? 'Wrap' : isUnwrapOperation ? 'Unwrap' : 'Swap'}
        </h2>
        <div className="flex items-center gap-2">
          <TransactionSettings settings={settings} onSettingsChange={setSettings} />
          {/* Chart Toggle Button - Like Atlantis DEX */}
          <button
            onClick={onToggleChart}
            className={`w-10 h-10 flex items-center justify-center rounded-xl border-2 transition-all ${
              isChartVisible 
                ? 'bg-primary-500/20 border-primary-500 text-primary-400' 
                : 'bg-atlantis-800/50 border-atlantis-700/50 text-gray-400 hover:border-primary-500/50 hover:text-primary-400'
            }`}
            title={isChartVisible ? 'Hide Chart' : 'Show Chart'}
          >
            <BarChart2 className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      <div className="space-y-2">
        {/* Sell Section */}
        <div className="bg-atlantis-800/40 rounded-2xl p-4 border border-atlantis-700/30">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-400">Sell</span>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-500">Balance: {parseFloat(balanceIn).toFixed(4)}</span>
              <button 
                onClick={setMaxAmount}
                className="text-primary-400 hover:text-primary-300 font-semibold transition-colors"
              >
                MAX
              </button>
            </div>
          </div>
          <div className="flex gap-3 items-center">
            <input
              type="number"
              value={amountIn}
              onChange={(e) => setAmountIn(e.target.value)}
              placeholder="0"
              className="flex-1 min-w-0 bg-transparent text-3xl font-semibold text-white outline-none placeholder-gray-600"
            />
            <button
              onClick={() => setShowTokenModal('in')}
              className="flex items-center gap-2 bg-atlantis-700/60 hover:bg-atlantis-600/60 border border-atlantis-600/50 hover:border-primary-500/30 rounded-2xl px-3 py-2 transition-all shrink-0"
            >
              {tokenIn.logoURI ? (
                <img src={tokenIn.logoURI} alt={tokenIn.symbol} className="w-7 h-7 rounded-full" />
              ) : (
                <div className="w-7 h-7 bg-gradient-to-br from-primary-500/40 to-secondary-500/40 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold">{tokenIn.symbol.slice(0, 1)}</span>
                </div>
              )}
              <span className="font-semibold text-white">{tokenIn.symbol}</span>
              {tokenIn.isNative && <span className="text-primary-400 text-xs">⚡</span>}
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Switch Button */}
        <div className="flex justify-center -my-3 relative z-10">
          <button 
            onClick={switchTokens}
            className="w-10 h-10 bg-atlantis-900 hover:bg-atlantis-800 border-4 border-atlantis-950 hover:border-primary-500/30 rounded-xl flex items-center justify-center transition-all duration-300 hover:shadow-glow group"
          >
            <ArrowDownUp className="w-4 h-4 text-gray-400 group-hover:text-primary-400 group-hover:rotate-180 transition-all duration-300" />
          </button>
        </div>

        {/* Buy Section */}
        <div className="bg-atlantis-800/40 rounded-2xl p-4 border border-atlantis-700/30">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-400">Buy</span>
            <span className="text-xs text-gray-500">Balance: {parseFloat(balanceOut).toFixed(4)}</span>
          </div>
          <div className="flex gap-3 items-center">
            <input
              type="text"
              value={amountOut ? parseFloat(amountOut).toFixed(6) : ''}
              readOnly
              placeholder="0"
              className="flex-1 min-w-0 bg-transparent text-3xl font-semibold text-white outline-none placeholder-gray-600"
            />
            <button
              onClick={() => setShowTokenModal('out')}
              className="flex items-center gap-2 bg-atlantis-700/60 hover:bg-atlantis-600/60 border border-atlantis-600/50 hover:border-primary-500/30 rounded-2xl px-3 py-2 transition-all shrink-0"
            >
              {tokenOut.logoURI ? (
                <img src={tokenOut.logoURI} alt={tokenOut.symbol} className="w-7 h-7 rounded-full" />
              ) : (
                <div className="w-7 h-7 bg-gradient-to-br from-primary-500/40 to-secondary-500/40 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold">{tokenOut.symbol.slice(0, 1)}</span>
                </div>
              )}
              <span className="font-semibold text-white">{tokenOut.symbol}</span>
              {tokenOut.isNative && <span className="text-primary-400 text-xs">⚡</span>}
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Wrap/Unwrap Info */}
        {isWrapOrUnwrap && amountIn && parseFloat(amountIn) > 0 && (
          <div className="bg-primary-500/10 border border-primary-500/20 rounded-xl p-3 text-sm">
            <div className="flex items-center gap-2 text-primary-400">
              <Info className="w-4 h-4" />
              <span>
                {isWrapOperation 
                  ? 'Wrapping MON to WMON (1:1 ratio, no fee)'
                  : 'Unwrapping WMON to MON (1:1 ratio, no fee)'}
              </span>
            </div>
          </div>
        )}

        {/* Rate & Details */}
        {!isWrapOrUnwrap && amountIn && amountOut && parseFloat(amountIn) > 0 && (
          <div className="mt-3">
            <button 
              onClick={() => setShowDetails(!showDetails)}
              className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              <span>1 {tokenIn.symbol} = {rate} {tokenOut.symbol}</span>
              <Info className={`w-4 h-4 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
            </button>
            
            {showDetails && (
              <div className="bg-atlantis-800/30 rounded-xl p-3 space-y-2 text-sm border border-atlantis-700/20 mt-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">Slippage Tolerance</span>
                  <span className="text-white">{settings.slippage}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Swap Fee</span>
                  <span className="text-white">{FEE.TOTAL_PERCENT}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Min. Received</span>
                  <span className="text-primary-400">{(parseFloat(amountOut) * (1 - settings.slippage / 100)).toFixed(6)} {tokenOut.symbol}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Route</span>
                  <span className="text-white">{tokenIn.symbol} → {tokenOut.symbol}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Button */}
        <div className="pt-2">
          {!isConnected ? (
            <button className="w-full py-4 bg-atlantis-700/50 rounded-2xl font-semibold text-gray-400 cursor-not-allowed">
              Connect Wallet
            </button>
          ) : isSameToken ? (
            <button className="w-full py-4 bg-atlantis-700/50 rounded-2xl font-semibold text-gray-400 cursor-not-allowed">
              Select Different Tokens
            </button>
          ) : !amountIn || parseFloat(amountIn) === 0 ? (
            <button className="w-full py-4 bg-atlantis-700/50 rounded-2xl font-semibold text-gray-400 cursor-not-allowed">
              Enter Amount
            </button>
          ) : needsApproval ? (
            <button
              onClick={handleApprove}
              disabled={isPending || isConfirming}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 disabled:from-gray-600 disabled:to-gray-600 rounded-2xl font-bold text-white transition-all shadow-lg hover:shadow-purple-500/25"
            >
              {isPending || isConfirming ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Approving...
                </span>
              ) : (
                `Approve ${tokenIn.symbol}`
              )}
            </button>
          ) : (
            <button
              onClick={handleSwap}
              disabled={isPending || isConfirming || (!isWrapOrUnwrap && !amountOut)}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 disabled:from-gray-600 disabled:to-gray-600 rounded-2xl font-bold text-white text-lg transition-all shadow-lg hover:shadow-purple-500/25"
            >
              {isPending || isConfirming ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {isWrapOperation ? 'Wrapping...' : isUnwrapOperation ? 'Unwrapping...' : 'Swapping...'}
                </span>
              ) : (
                getButtonText()
              )}
            </button>
          )}
        </div>

        {isSuccess && (
          <div className="text-center text-green-400 text-sm py-3 bg-green-500/10 rounded-xl border border-green-500/20 mt-2">
            ✓ {isWrapOperation ? 'Wrap' : isUnwrapOperation ? 'Unwrap' : 'Swap'} successful!
          </div>
        )}
      </div>

      {/* Token Modal */}
      {showTokenModal && (
        <TokenModal
          onSelect={(token) => handleTokenSelect(token, showTokenModal)}
          onClose={() => setShowTokenModal(null)}
          onImport={() => {
            setShowTokenModal(null)
            setShowImportModal(true)
          }}
        />
      )}

      {/* Import Modal */}
      {showImportModal && (
        <TokenImportModal
          onClose={() => setShowImportModal(false)}
          onTokenImported={handleTokenImported}
        />
      )}
    </div>
  )
}
