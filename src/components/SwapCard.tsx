import { useState, useEffect } from 'react'
import { useAccount, useBalance, useReadContract, useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi'
import { parseUnits, parseEther, formatUnits, formatEther } from 'viem'
import { ChevronDown, RefreshCw, BarChart3, Info } from './Icons3D'
import { getContracts, FEE } from '../config/contracts'
import { ROUTER_ABI, ERC20_ABI, WMON_ABI } from '../config/abis'
import { NATIVE_ADDRESS, getStoredTokens, getDefaultTokens, type Token } from '../config/tokens'
import { TokenModal } from './TokenModal'
import { TokenImportModal } from './TokenImportModal'
import { TransactionSettings, type SwapSettings } from './TransactionSettings'

export function SwapCard() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const contracts = getContracts(chainId)
  const defaultTokens = getDefaultTokens(chainId)
  
  const [tokenIn, setTokenIn] = useState<Token>(defaultTokens[0])
  const [tokenOut, setTokenOut] = useState<Token>(defaultTokens[1])
  const [amountIn, setAmountIn] = useState('')
  const [amountOut, setAmountOut] = useState('')
  const [settings, setSettings] = useState<SwapSettings>({ slippage: 0.5, deadline: 20, expertMode: false })
  const [showTokenModal, setShowTokenModal] = useState<'in' | 'out' | null>(null)
  const [showImportModal, setShowImportModal] = useState(false)
  const [, setCustomTokens] = useState<Token[]>([])
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    const newDefaultTokens = getDefaultTokens(chainId)
    setTokenIn(newDefaultTokens[0])
    setTokenOut(newDefaultTokens[1])
    setAmountIn('')
    setAmountOut('')
  }, [chainId])

  useEffect(() => {
    setCustomTokens(getStoredTokens(chainId))
  }, [chainId])

  const isNativeIn = tokenIn.address === NATIVE_ADDRESS
  const isNativeOut = tokenOut.address === NATIVE_ADDRESS
  const isWrappedIn = tokenIn.address.toLowerCase() === contracts.WETH.toLowerCase()
  const isWrappedOut = tokenOut.address.toLowerCase() === contracts.WETH.toLowerCase()
  
  const isWrapOperation = isNativeIn && isWrappedOut
  const isUnwrapOperation = isWrappedIn && isNativeOut
  const isWrapOrUnwrap = isWrapOperation || isUnwrapOperation

  const routeTokenIn = isNativeIn ? contracts.WETH : tokenIn.address
  const routeTokenOut = isNativeOut ? contracts.WETH : tokenOut.address

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
    address: contracts.ROUTER,
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

  const { data: wrappedBalance } = useReadContract({
    address: contracts.WETH,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  })

  const { data: allowance } = useReadContract({
    address: tokenIn.address,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, contracts.ROUTER] : undefined,
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
    : isWrappedOut
    ? (wrappedBalance ? formatUnits(wrappedBalance, 18) : '0')
    : (tokenOutBalance ? formatUnits(tokenOutBalance, 18) : '0')

  const needsApproval = !isNativeIn && !isWrapOrUnwrap && allowance !== undefined && amountIn 
    ? allowance < parseUnits(amountIn || '0', 18) 
    : false

  const handleApprove = () => {
    writeContract({
      address: tokenIn.address,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [contracts.ROUTER, parseUnits('999999999', 18)]
    })
  }

  const handleWrap = () => {
    if (!address || !amountIn) return
    writeContract({
      address: contracts.WETH,
      abi: WMON_ABI,
      functionName: 'deposit',
      value: parseEther(amountIn)
    })
  }

  const handleUnwrap = () => {
    if (!address || !amountIn) return
    writeContract({
      address: contracts.WETH,
      abi: WMON_ABI,
      functionName: 'withdraw',
      args: [parseUnits(amountIn, 18)]
    })
  }

  const handleSwap = () => {
    if (!address || !amountIn || !amountOut) return
    
    if (isWrapOperation) { handleWrap(); return }
    if (isUnwrapOperation) { handleUnwrap(); return }

    const minOut = parseUnits((parseFloat(amountOut) * (1 - settings.slippage / 100)).toFixed(18), 18)
    const deadline = BigInt(Math.floor(Date.now() / 1000) + settings.deadline * 60)

    if (isNativeIn) {
      writeContract({
        address: contracts.ROUTER,
        abi: ROUTER_ABI,
        functionName: 'swapExactETHForTokens',
        args: [minOut, [contracts.WETH, routeTokenOut], address, deadline],
        value: parseEther(amountIn)
      })
    } else if (isNativeOut) {
      writeContract({
        address: contracts.ROUTER,
        abi: ROUTER_ABI,
        functionName: 'swapExactTokensForETH',
        args: [parseUnits(amountIn, 18), minOut, [routeTokenIn, contracts.WETH], address, deadline]
      })
    } else {
      writeContract({
        address: contracts.ROUTER,
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
      if (token.address === tokenOut.address) setTokenOut(tokenIn)
      setTokenIn(token)
    } else {
      if (token.address === tokenIn.address) setTokenIn(tokenOut)
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
    <div className="w-full max-w-[420px] bg-[#1a1a2e]/90 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl shadow-purple-900/20 p-5">
      {/* Header */}
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-xl font-bold text-white">Swap</h2>
        <div className="flex items-center gap-2">
          <TransactionSettings settings={settings} onSettingsChange={setSettings} />
          <button 
            onClick={() => setShowDetails(!showDetails)}
            className="w-9 h-9 rounded-xl bg-[#252542] hover:bg-[#2d2d4a] border border-white/5 flex items-center justify-center transition-all"
          >
            <BarChart3 className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>
      
      <div className="space-y-3">
        {/* Sell Section */}
        <div className="bg-[#12121a] rounded-2xl p-4 border border-white/5">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm text-gray-400">Sell</span>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-500">Balance: {parseFloat(balanceIn).toFixed(4)}</span>
              <button 
                onClick={setMaxAmount}
                className="text-purple-400 hover:text-purple-300 font-semibold transition-colors"
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
              className="flex-1 min-w-0 bg-transparent text-2xl font-medium text-white outline-none placeholder-gray-600"
            />
            <button
              onClick={() => setShowTokenModal('in')}
              className="flex items-center gap-2 bg-[#252542] hover:bg-[#2d2d4a] border border-white/10 rounded-full px-3 py-2 transition-all shrink-0"
            >
              {tokenIn.logoURI ? (
                <img src={tokenIn.logoURI} alt={tokenIn.symbol} className="w-6 h-6 rounded-full" />
              ) : (
                <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <span className="text-[10px] font-bold text-white">{tokenIn.symbol.slice(0, 1)}</span>
                </div>
              )}
              <span className="font-semibold text-white text-sm">{tokenIn.symbol}</span>
              {tokenIn.isNative && <span className="text-yellow-400 text-xs">⚡</span>}
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Switch Button */}
        <div className="flex justify-center -my-1 relative z-10">
          <button 
            onClick={switchTokens}
            className="w-10 h-10 bg-[#1a1a2e] border-4 border-[#0d0d15] hover:border-purple-500/30 rounded-xl flex items-center justify-center transition-all duration-300 group"
          >
            <RefreshCw className="w-4 h-4 text-purple-400 group-hover:rotate-180 transition-all duration-500" />
          </button>
        </div>

        {/* Buy Section */}
        <div className="bg-[#12121a] rounded-2xl p-4 border border-white/5">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm text-gray-400">Buy</span>
            <span className="text-xs text-gray-500">Balance: {parseFloat(balanceOut).toFixed(4)}</span>
          </div>
          <div className="flex gap-3 items-center">
            <input
              type="text"
              value={amountOut ? parseFloat(amountOut).toFixed(6) : ''}
              readOnly
              placeholder="0"
              className="flex-1 min-w-0 bg-transparent text-2xl font-medium text-white outline-none placeholder-gray-600"
            />
            <button
              onClick={() => setShowTokenModal('out')}
              className="flex items-center gap-2 bg-[#252542] hover:bg-[#2d2d4a] border border-white/10 rounded-full px-3 py-2 transition-all shrink-0"
            >
              {tokenOut.logoURI ? (
                <img src={tokenOut.logoURI} alt={tokenOut.symbol} className="w-6 h-6 rounded-full" />
              ) : (
                <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                  <span className="text-[10px] font-bold text-white">{tokenOut.symbol.slice(0, 1)}</span>
                </div>
              )}
              <span className="font-semibold text-white text-sm">{tokenOut.symbol}</span>
              {tokenOut.isNative && <span className="text-yellow-400 text-xs">⚡</span>}
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Wrap/Unwrap Info */}
        {isWrapOrUnwrap && amountIn && parseFloat(amountIn) > 0 && (
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3 text-sm">
            <div className="flex items-center gap-2 text-purple-400">
              <Info className="w-4 h-4" />
              <span>
                {isWrapOperation 
                  ? 'Wrapping to wrapped token (1:1 ratio)'
                  : 'Unwrapping to native token (1:1 ratio)'}
              </span>
            </div>
          </div>
        )}

        {/* Rate & Details */}
        {!isWrapOrUnwrap && amountIn && amountOut && parseFloat(amountIn) > 0 && showDetails && (
          <div className="bg-[#12121a]/50 rounded-xl p-3 space-y-2 text-sm border border-white/5">
            <div className="flex justify-between">
              <span className="text-gray-500">Rate</span>
              <span className="text-white">1 {tokenIn.symbol} = {rate} {tokenOut.symbol}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Slippage</span>
              <span className="text-white">{settings.slippage}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Fee</span>
              <span className="text-white">{FEE.TOTAL_PERCENT}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Min. Received</span>
              <span className="text-purple-400">{(parseFloat(amountOut) * (1 - settings.slippage / 100)).toFixed(6)} {tokenOut.symbol}</span>
            </div>
          </div>
        )}

        {/* Enter Amount Button (disabled state) */}
        {(!amountIn || parseFloat(amountIn) === 0) && (
          <button 
            disabled
            className="w-full py-4 bg-[#252542]/50 rounded-2xl font-semibold text-gray-500 cursor-not-allowed border border-white/5"
          >
            Enter Amount
          </button>
        )}

        {/* Action Button */}
        {amountIn && parseFloat(amountIn) > 0 && (
          <div className="space-y-2">
            {!isConnected ? (
              <button className="w-full py-4 bg-[#252542]/50 rounded-2xl font-semibold text-gray-500 cursor-not-allowed border border-white/5">
                Connect Wallet
              </button>
            ) : isSameToken ? (
              <button className="w-full py-4 bg-[#252542]/50 rounded-2xl font-semibold text-gray-500 cursor-not-allowed border border-white/5">
                Select Different Tokens
              </button>
            ) : needsApproval ? (
              <button
                onClick={handleApprove}
                disabled={isPending || isConfirming}
                className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:from-gray-600 disabled:to-gray-600 rounded-2xl font-bold text-white transition-all"
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
                className="w-full py-4 bg-gradient-to-r from-[#6366f1] via-[#8b5cf6] to-[#a855f7] hover:from-[#818cf8] hover:via-[#a78bfa] hover:to-[#c084fc] disabled:from-gray-600 disabled:to-gray-600 rounded-2xl font-bold text-white text-lg transition-all shadow-lg shadow-purple-500/20"
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
        )}

        {isSuccess && (
          <div className="text-center text-green-400 text-sm py-3 bg-green-500/10 rounded-xl border border-green-500/20">
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
