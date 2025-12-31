import { useState, useEffect, useCallback } from 'react'
import { useAccount, useReadContract, useBalance } from 'wagmi'
import { X, AlertTriangle, TrendingUp, RefreshCw, ExternalLink, Calculator, Percent, Gift } from 'lucide-react'
import { formatUnits } from 'viem'
import { useIDOPool, IDO_POOL_ABI } from '../../hooks/useIDOFactory'
import type { ExtendedIDO } from './LaunchpadPage'

interface ContributeModalProps {
  ido: ExtendedIDO
  onClose: () => void
}

function formatNum(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(2)}K`
  return num.toFixed(4)
}

export function ContributeModal({ ido, onClose }: ContributeModalProps) {
  const { address, isConnected } = useAccount()
  const { deposit, claim, claimRefund, isProcessing, statusMessage, txHash, reset } = useIDOPool(ido.poolAddress)
  const [amount, setAmount] = useState('')
  const [activeTab, setActiveTab] = useState<'deposit' | 'claim'>('deposit')

  const { data: balance } = useBalance({ address })
  const { data: userInfo, refetch: refetchUser } = useReadContract({
    address: ido.poolAddress, abi: IDO_POOL_ABI, functionName: 'getUserInfo',
    args: address ? [address] : undefined, query: { enabled: !!address }
  })
  const { data: estimation } = useReadContract({
    address: ido.poolAddress, abi: IDO_POOL_ABI, functionName: 'estimateAllocation',
    args: address ? [address] : undefined, query: { enabled: !!address }
  })

  const userDeposited = userInfo ? formatUnits(userInfo[0] as bigint, 18) : '0'
  const userAllocation = userInfo ? formatUnits(userInfo[1] as bigint, 18) : '0'
  const userRefund = userInfo ? formatUnits(userInfo[2] as bigint, 18) : '0'
  const userClaimed = userInfo ? formatUnits(userInfo[3] as bigint, 18) : '0'
  const userClaimable = userInfo ? formatUnits(userInfo[4] as bigint, 18) : '0'
  const hasClaimedRefund = userInfo ? userInfo[5] as boolean : false
  const estimatedTokens = estimation ? formatUnits(estimation[0] as bigint, 18) : '0'
  const estimatedRefund = estimation ? formatUnits(estimation[1] as bigint, 18) : '0'

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && !isProcessing) onClose()
  }, [onClose, isProcessing])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', handleKeyDown); document.body.style.overflow = 'unset' }
  }, [handleKeyDown])


  const hardCapNum = parseFloat(ido.hardCap) || 1
  const totalCommittedNum = parseFloat(ido.totalCommitted) || 0
  const progress = (totalCommittedNum / hardCapNum) * 100
  const hasOverflow = progress > 100
  const now = Math.floor(Date.now() / 1000)
  const isLive = now >= ido.startTime && now <= ido.endTime && ido.isActive
  const isEnded = now > ido.endTime || ido.status === 2
  const amountNum = parseFloat(amount) || 0
  const tokenPrice = parseFloat(ido.tokenPrice) || 0
  const tokensToReceive = tokenPrice > 0 ? amountNum / tokenPrice : 0

  const handleDeposit = async () => {
    if (!amount || amountNum <= 0) return
    const result = await deposit(amount)
    if (result.success) { refetchUser(); setTimeout(onClose, 2000) }
  }

  const handleClaim = async () => {
    const result = await claim()
    if (result.success) refetchUser()
  }

  const handleClaimRefund = async () => {
    const result = await claimRefund()
    if (result.success) refetchUser()
  }

  const handleMax = () => {
    if (balance) setAmount(formatUnits(balance.value, 18))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => !isProcessing && onClose()} />
      <div className="relative w-full sm:max-w-lg bg-atlantis-900 border border-atlantis-700/50 rounded-t-2xl sm:rounded-2xl shadow-2xl animate-slide-up overflow-hidden max-h-[85vh] sm:max-h-[90vh] overflow-y-auto safe-bottom">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-5 border-b border-atlantis-700/50 sticky top-0 bg-atlantis-900 z-10">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-r from-primary-500/20 to-secondary-500/20 flex items-center justify-center text-lg sm:text-xl shrink-0">🚀</div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-white truncate">{ido.name}</h2>
              <p className="text-[10px] sm:text-xs text-gray-400">{isLive ? 'Contribute to IDO' : isEnded ? 'Claim Tokens' : 'Upcoming'}</p>
            </div>
          </div>
          <button onClick={() => !isProcessing && onClose()} disabled={isProcessing}
            className="p-1.5 sm:p-2 rounded-lg hover:bg-atlantis-800 transition-colors text-gray-400 hover:text-white disabled:opacity-50 shrink-0">
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        <div className="p-3 sm:p-5 space-y-3 sm:space-y-5">
          {/* Progress with Overflow */}
          <div className="bg-atlantis-800/30 rounded-xl p-3 sm:p-4 border border-atlantis-700/30">
            <div className="flex justify-between text-xs sm:text-sm mb-2">
              <span className="text-gray-400">Sale Progress {hasOverflow && <span className="text-orange-400">(Overflow)</span>}</span>
              <span className={`font-semibold ${hasOverflow ? 'text-orange-400' : 'text-white'}`}>{progress.toFixed(1)}%</span>
            </div>
            <div className="h-2 sm:h-3 bg-atlantis-800 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${hasOverflow ? 'bg-gradient-to-r from-primary-500 to-orange-500' : 'bg-gradient-to-r from-primary-500 to-secondary-500'}`}
                style={{ width: `${Math.min(100, progress)}%` }} />
            </div>
            <div className="flex justify-between text-[10px] sm:text-xs mt-2 text-gray-500">
              <span>{formatNum(totalCommittedNum)} MON committed</span>
              <span>Hard Cap: {formatNum(hardCapNum)} MON</span>
            </div>
          </div>

          {/* User Stats */}
          {parseFloat(userDeposited) > 0 && (
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div className="bg-atlantis-800/30 rounded-lg p-2 sm:p-3">
                <p className="text-[10px] sm:text-xs text-gray-500">Your Deposit</p>
                <p className="text-xs sm:text-sm font-bold text-white">{formatNum(parseFloat(userDeposited))} MON</p>
              </div>
              <div className="bg-atlantis-800/30 rounded-lg p-2 sm:p-3">
                <p className="text-[10px] sm:text-xs text-gray-500">Est. Allocation</p>
                <p className="text-xs sm:text-sm font-bold text-primary-400">{formatNum(parseFloat(estimatedTokens))} Tokens</p>
              </div>
              {parseFloat(estimatedRefund) > 0 && (
                <div className="bg-orange-500/10 rounded-lg p-2 sm:p-3 col-span-2 border border-orange-500/30">
                  <p className="text-[10px] sm:text-xs text-orange-400">Est. Refund (Overflow)</p>
                  <p className="text-xs sm:text-sm font-bold text-orange-400">{formatNum(parseFloat(estimatedRefund))} MON</p>
                </div>
              )}
            </div>
          )}

          {/* Tabs */}
          {isEnded && parseFloat(userDeposited) > 0 && (
            <div className="flex gap-2">
              <button onClick={() => { setActiveTab('deposit'); reset() }}
                className={`flex-1 py-2 rounded-lg text-xs sm:text-sm font-medium ${activeTab === 'deposit' ? 'bg-primary-500/20 text-primary-400' : 'bg-atlantis-800/30 text-gray-400'}`}>
                Details
              </button>
              <button onClick={() => { setActiveTab('claim'); reset() }}
                className={`flex-1 py-2 rounded-lg text-xs sm:text-sm font-medium ${activeTab === 'claim' ? 'bg-primary-500/20 text-primary-400' : 'bg-atlantis-800/30 text-gray-400'}`}>
                Claim
              </button>
            </div>
          )}


          {/* Deposit Section */}
          {(isLive || activeTab === 'deposit') && !isEnded && (
            <>
              <div className="bg-atlantis-800/30 rounded-xl p-3 sm:p-4 border border-atlantis-700/30">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs sm:text-sm text-gray-400">Contribution Amount</span>
                  <button onClick={handleMax} disabled={isProcessing} className="text-[10px] sm:text-xs text-primary-400 hover:text-primary-300">
                    Balance: {balance ? parseFloat(formatUnits(balance.value, 18)).toFixed(4) : '0'} MON
                  </button>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.0"
                    disabled={isProcessing} className="flex-1 bg-transparent text-xl sm:text-2xl text-white outline-none placeholder-gray-600 min-w-0" />
                  <div className="flex items-center gap-1.5 sm:gap-2 bg-atlantis-700/50 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 shrink-0">
                    <span className="text-base sm:text-lg">⛽</span><span className="font-semibold text-white text-sm sm:text-base">MON</span>
                  </div>
                </div>
                <div className="flex gap-1.5 sm:gap-2 mt-2 sm:mt-3">
                  {[25, 50, 75, 100].map((pct) => (
                    <button key={pct} onClick={() => balance && setAmount((parseFloat(formatUnits(balance.value, 18)) * pct / 100).toString())}
                      disabled={isProcessing} className="flex-1 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium bg-atlantis-700/50 hover:bg-atlantis-600/50 text-gray-300 hover:text-white rounded-lg transition-all disabled:opacity-50">
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>

              {amountNum > 0 && (
                <div className="bg-green-500/10 rounded-xl p-3 sm:p-4 border border-green-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <Calculator className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-400" />
                    <span className="text-xs sm:text-sm text-gray-400">Estimated tokens</span>
                  </div>
                  <p className="text-xl sm:text-2xl font-bold text-green-400">{formatNum(tokensToReceive)} Tokens</p>
                  {hasOverflow && (
                    <p className="text-[10px] sm:text-xs text-orange-400 mt-1 flex items-center gap-1">
                      <Percent className="w-2.5 h-2.5 sm:w-3 sm:h-3" />Final allocation may be lower due to overflow
                    </p>
                  )}
                </div>
              )}
            </>
          )}

          {/* Claim Section */}
          {isEnded && activeTab === 'claim' && (
            <div className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div className="bg-atlantis-800/30 rounded-lg p-2 sm:p-3">
                  <p className="text-[10px] sm:text-xs text-gray-500">Allocation</p>
                  <p className="text-base sm:text-lg font-bold text-white">{formatNum(parseFloat(userAllocation))} Tokens</p>
                </div>
                <div className="bg-atlantis-800/30 rounded-lg p-2 sm:p-3">
                  <p className="text-[10px] sm:text-xs text-gray-500">Claimed</p>
                  <p className="text-base sm:text-lg font-bold text-white">{formatNum(parseFloat(userClaimed))} Tokens</p>
                </div>
              </div>
              {parseFloat(userClaimable) > 0 && (
                <div className="bg-green-500/10 rounded-xl p-3 sm:p-4 border border-green-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <Gift className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-400" />
                    <span className="text-xs sm:text-sm text-gray-400">Claimable Now</span>
                  </div>
                  <p className="text-xl sm:text-2xl font-bold text-green-400">{formatNum(parseFloat(userClaimable))} Tokens</p>
                </div>
              )}
              {parseFloat(userRefund) > 0 && !hasClaimedRefund && (
                <div className="bg-orange-500/10 rounded-xl p-3 sm:p-4 border border-orange-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <Percent className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-400" />
                    <span className="text-xs sm:text-sm text-gray-400">Refund Available</span>
                  </div>
                  <p className="text-xl sm:text-2xl font-bold text-orange-400">{formatNum(parseFloat(userRefund))} MON</p>
                </div>
              )}
            </div>
          )}

          {/* Status Message */}
          {statusMessage && (
            <div className={`rounded-xl p-2 sm:p-3 text-xs sm:text-sm ${statusMessage.includes('✅') ? 'bg-green-500/10 border border-green-500/30 text-green-400' : statusMessage.includes('❌') ? 'bg-red-500/10 border border-red-500/30 text-red-400' : 'bg-blue-500/10 border border-blue-500/30 text-blue-400'}`}>
              {isProcessing && <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline-block animate-spin mr-2" />}{statusMessage}
            </div>
          )}
          {txHash && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-2 sm:p-3">
              <a href={`https://explorer.monad.xyz/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
                className="text-blue-400 text-xs sm:text-sm flex items-center gap-2">
                📝 Tx: {txHash.slice(0, 8)}...{txHash.slice(-6)} <ExternalLink className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              </a>
            </div>
          )}

          {/* Warning */}
          <div className="bg-yellow-500/10 rounded-xl p-2 sm:p-3 border border-yellow-500/20">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-400 shrink-0 mt-0.5" />
              <div className="text-[10px] sm:text-xs text-yellow-400/80">
                <p className="font-medium mb-1">Overflow Method:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>If total exceeds hard cap, allocation is proportional</li>
                  <li>Excess MON refunded after sale ends</li>
                  <li>20% TGE, 180 days vesting</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-5 border-t border-atlantis-700/50 sticky bottom-0 bg-atlantis-900">
          {!isConnected ? (
            <button className="w-full py-3 sm:py-4 bg-atlantis-700/50 rounded-xl text-gray-400 font-semibold cursor-not-allowed text-sm sm:text-base">Connect Wallet</button>
          ) : isLive ? (
            <button onClick={handleDeposit} disabled={isProcessing || !amount || amountNum <= 0}
              className={`w-full py-3 sm:py-4 rounded-xl font-bold text-white transition-all text-sm sm:text-base ${isProcessing ? 'bg-gray-600 cursor-wait' : !amount || amountNum <= 0 ? 'bg-gray-600 cursor-not-allowed' : 'gradient-button hover:shadow-glow'} disabled:opacity-70`}>
              {isProcessing ? <><RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline-block animate-spin mr-2" />Processing...</> : <><TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline-block mr-2" />Contribute {amount || '0'} MON</>}
            </button>
          ) : isEnded && activeTab === 'claim' ? (
            <div className="flex gap-2 sm:gap-3">
              {parseFloat(userClaimable) > 0 && (
                <button onClick={handleClaim} disabled={isProcessing} className="flex-1 gradient-button py-3 sm:py-4 text-sm sm:text-base disabled:opacity-50">
                  {isProcessing ? 'Claiming...' : 'Claim Tokens'}
                </button>
              )}
              {parseFloat(userRefund) > 0 && !hasClaimedRefund && (
                <button onClick={handleClaimRefund} disabled={isProcessing} className="flex-1 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 py-3 sm:py-4 rounded-xl font-bold text-sm sm:text-base disabled:opacity-50">
                  {isProcessing ? 'Claiming...' : 'Claim Refund'}
                </button>
              )}
            </div>
          ) : (
            <button className="w-full py-3 sm:py-4 bg-gray-600/50 rounded-xl text-gray-400 font-semibold cursor-not-allowed text-sm sm:text-base">
              {isEnded ? 'Sale Ended' : 'Coming Soon'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
