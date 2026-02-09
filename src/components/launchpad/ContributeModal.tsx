import { useState, useEffect, useCallback } from 'react'
import { useAccount, useReadContract, useBalance, useChainId } from 'wagmi'
import { formatUnits } from 'viem'
import { useIDOPool, getIDOPoolABI } from '../../hooks/useIDOFactory'
import type { ExtendedIDO } from './LaunchpadPage'
import { getNativeToken } from '../../config/tokens'
import { CHAIN_IDS } from '../../config/chains'

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
  const chainId = useChainId()
  const nativeToken = getNativeToken(chainId)
  const nativeSymbol = nativeToken.symbol
  const explorerUrl = chainId === CHAIN_IDS.MEGAETH ? 'https://megaeth.blockscout.com' : 'https://monadscan.com'
  const poolABI = getIDOPoolABI(chainId)
  const { deposit, claim, claimRefund, isProcessing, statusMessage, txHash, reset } = useIDOPool(ido.poolAddress)
  const [amount, setAmount] = useState('')
  const [activeTab, setActiveTab] = useState<'deposit' | 'claim'>('deposit')

  const { data: balance } = useBalance({ address })
  const { data: userInfo, refetch: refetchUser } = useReadContract({
    address: ido.poolAddress, abi: poolABI, functionName: 'getUserInfo',
    args: address ? [address] : undefined, query: { enabled: !!address }
  })
  const { data: estimation } = useReadContract({
    address: ido.poolAddress, abi: poolABI, functionName: 'estimateAllocation',
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
  const handleClaim = async () => { const result = await claim(); if (result.success) refetchUser() }
  const handleClaimRefund = async () => { const result = await claimRefund(); if (result.success) refetchUser() }
  const handleMax = () => { if (balance) setAmount(formatUnits(balance.value, 18)) }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => !isProcessing && onClose()} />
      <div className="relative w-full sm:max-w-lg bg-gradient-to-br from-[#161622] to-[#0f0f1a] border border-white/[0.08] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[85vh] sm:max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/5 sticky top-0 bg-gradient-to-br from-[#161622] to-[#0f0f1a] z-10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative w-10 h-10 shrink-0">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 blur-md opacity-30" />
              <div className="relative w-full h-full rounded-xl bg-gradient-to-br from-purple-400 via-pink-500 to-orange-400 p-[1.5px]">
                <div className="w-full h-full rounded-xl bg-gradient-to-br from-[#1a1028] to-[#12101f] flex items-center justify-center">
                  <span className="text-lg font-bold bg-gradient-to-br from-purple-300 to-pink-300 bg-clip-text text-transparent">{ido.name.charAt(0)}</span>
                </div>
              </div>
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-white truncate">{ido.name}</h2>
              <p className="text-[10px] text-gray-400">{isLive ? 'Contribute to IDO' : isEnded ? 'Claim Tokens' : 'Upcoming'}</p>
            </div>
          </div>
          <button onClick={() => !isProcessing && onClose()} disabled={isProcessing}
            className="p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] transition-all text-gray-400 hover:text-white disabled:opacity-50 shrink-0">
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-4">
          {/* Progress */}
          <div className="bg-black/20 rounded-xl p-4 border border-white/5">
            <div className="flex justify-between text-xs mb-2">
              <span className="text-gray-400">Sale Progress {hasOverflow && <span className="text-amber-400">(Overflow)</span>}</span>
              <span className={`font-semibold ${hasOverflow ? 'text-amber-400' : 'text-white'}`}>{progress.toFixed(1)}%</span>
            </div>
            <div className="h-2.5 bg-[#0d0d15] rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${hasOverflow ? 'bg-gradient-to-r from-purple-500 to-amber-500' : 'bg-gradient-to-r from-purple-500 to-pink-500'}`}
                style={{ width: `${Math.min(100, progress)}%` }} />
            </div>
            <div className="flex justify-between text-[10px] mt-2 text-gray-500">
              <span>{formatNum(totalCommittedNum)} {nativeSymbol}</span>
              <span>Hard Cap: {formatNum(hardCapNum)} {nativeSymbol}</span>
            </div>
          </div>

          {/* User Stats */}
          {parseFloat(userDeposited) > 0 && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.04]">
                <p className="text-[10px] text-gray-500">Your Deposit</p>
                <p className="text-sm font-bold text-white">{formatNum(parseFloat(userDeposited))} {nativeSymbol}</p>
              </div>
              <div className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.04]">
                <p className="text-[10px] text-gray-500">Est. Allocation</p>
                <p className="text-sm font-bold text-purple-400">{formatNum(parseFloat(estimatedTokens))} Tokens</p>
              </div>
              {parseFloat(estimatedRefund) > 0 && (
                <div className="bg-amber-500/10 rounded-xl p-3 col-span-2 border border-amber-500/15">
                  <p className="text-[10px] text-amber-400">Est. Refund (Overflow)</p>
                  <p className="text-sm font-bold text-amber-400">{formatNum(parseFloat(estimatedRefund))} {nativeSymbol}</p>
                </div>
              )}
            </div>
          )}

          {/* Tabs for ended */}
          {isEnded && parseFloat(userDeposited) > 0 && (
            <div className="flex gap-2 p-1 bg-white/[0.02] rounded-xl border border-white/[0.04]">
              <button onClick={() => { setActiveTab('deposit'); reset() }}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${activeTab === 'deposit' ? 'bg-gradient-to-r from-purple-600/20 to-pink-600/20 text-purple-300 border border-purple-500/20' : 'text-gray-500'}`}>
                Details
              </button>
              <button onClick={() => { setActiveTab('claim'); reset() }}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${activeTab === 'claim' ? 'bg-gradient-to-r from-purple-600/20 to-pink-600/20 text-purple-300 border border-purple-500/20' : 'text-gray-500'}`}>
                Claim
              </button>
            </div>
          )}

          {/* Deposit Section */}
          {(isLive || activeTab === 'deposit') && !isEnded && (
            <>
              <div className="bg-black/20 rounded-xl p-4 border border-white/5">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Contribution Amount</span>
                  <button onClick={handleMax} disabled={isProcessing} className="text-[10px] text-purple-400 hover:text-purple-300 transition-colors">
                    Balance: {balance ? parseFloat(formatUnits(balance.value, 18)).toFixed(4) : '0'} {nativeSymbol}
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.0"
                    disabled={isProcessing}
                    className="flex-1 bg-transparent text-2xl text-white outline-none placeholder-gray-600 min-w-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                  <div className="flex items-center gap-2 bg-white/[0.04] rounded-lg px-3 py-2 border border-white/[0.06] shrink-0">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-400 to-pink-400" />
                    <span className="font-semibold text-white text-sm">{nativeSymbol}</span>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  {[25, 50, 75, 100].map((pct) => (
                    <button key={pct} onClick={() => balance && setAmount((parseFloat(formatUnits(balance.value, 18)) * pct / 100).toString())}
                      disabled={isProcessing}
                      className="flex-1 py-1.5 text-[10px] font-semibold bg-white/[0.03] hover:bg-purple-500/10 text-gray-400 hover:text-purple-300 rounded-lg transition-all border border-white/[0.04] hover:border-purple-500/20 disabled:opacity-50">
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>

              {amountNum > 0 && (
                <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/15">
                  <div className="flex items-center gap-2 mb-1">
                    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-emerald-400" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>
                    <span className="text-[10px] text-gray-400">Estimated tokens</span>
                  </div>
                  <p className="text-xl font-bold text-emerald-400">{formatNum(tokensToReceive)} Tokens</p>
                  {hasOverflow && (
                    <p className="text-[9px] text-amber-400/70 mt-1">Final allocation may be lower due to overflow</p>
                  )}
                </div>
              )}
            </>
          )}

          {/* Claim Section */}
          {isEnded && activeTab === 'claim' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.04]">
                  <p className="text-[10px] text-gray-500">Allocation</p>
                  <p className="text-base font-bold text-white">{formatNum(parseFloat(userAllocation))} Tokens</p>
                </div>
                <div className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.04]">
                  <p className="text-[10px] text-gray-500">Claimed</p>
                  <p className="text-base font-bold text-white">{formatNum(parseFloat(userClaimed))} Tokens</p>
                </div>
              </div>
              {parseFloat(userClaimable) > 0 && (
                <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/15">
                  <div className="flex items-center gap-2 mb-1">
                    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-emerald-400" stroke="currentColor" strokeWidth="2"><path d="M20 12v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6M12 2v13M5 9l7 7 7-7"/></svg>
                    <span className="text-[10px] text-gray-400">Claimable Now</span>
                  </div>
                  <p className="text-xl font-bold text-emerald-400">{formatNum(parseFloat(userClaimable))} Tokens</p>
                </div>
              )}
              {parseFloat(userRefund) > 0 && !hasClaimedRefund && (
                <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/15">
                  <div className="flex items-center gap-2 mb-1">
                    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-amber-400" stroke="currentColor" strokeWidth="2"><path d="M1 4v6h6M23 20v-6h-6"/><path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"/></svg>
                    <span className="text-[10px] text-gray-400">Refund Available</span>
                  </div>
                  <p className="text-xl font-bold text-amber-400">{formatNum(parseFloat(userRefund))} {nativeSymbol}</p>
                </div>
              )}
            </div>
          )}

          {/* Status Message */}
          {statusMessage && (
            <div className={`rounded-xl p-3 text-sm ${statusMessage.includes('✅') ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : statusMessage.includes('❌') ? 'bg-red-500/10 border border-red-500/20 text-red-400' : 'bg-blue-500/10 border border-blue-500/20 text-blue-400'}`}>
              {isProcessing && <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 inline-block animate-spin mr-2" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>}
              {statusMessage}
            </div>
          )}
          {txHash && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
              <a href={`${explorerUrl}/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
                className="text-blue-400 text-xs flex items-center gap-2">
                📝 Tx: {txHash.slice(0, 8)}...{txHash.slice(-6)}
                <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/></svg>
              </a>
            </div>
          )}

          {/* Warning */}
          <div className="bg-amber-500/10 rounded-xl p-3 border border-amber-500/15">
            <div className="flex items-start gap-2.5">
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01"/></svg>
              <div className="text-[10px] text-amber-400/80 space-y-0.5">
                <p className="font-medium text-amber-400">Overflow Method:</p>
                <p>• If total exceeds hard cap, allocation is proportional</p>
                <p>• Excess {nativeSymbol} refunded after sale ends</p>
                <p>• 20% TGE, 180 days vesting</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-white/5 sticky bottom-0 bg-gradient-to-br from-[#161622] to-[#0f0f1a]">
          {!isConnected ? (
            <button className="w-full py-3.5 bg-white/[0.04] rounded-2xl text-gray-500 font-semibold cursor-not-allowed border border-white/[0.06] text-sm">Connect Wallet</button>
          ) : isLive ? (
            <button onClick={handleDeposit} disabled={isProcessing || !amount || amountNum <= 0}
              className="w-full py-3.5 rounded-2xl font-bold text-white text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-lg shadow-purple-500/20">
              {isProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 animate-spin" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
                  Processing...
                </span>
              ) : `Contribute ${amount || '0'} ${nativeSymbol}`}
            </button>
          ) : isEnded && activeTab === 'claim' ? (
            <div className="flex gap-3">
              {parseFloat(userClaimable) > 0 && (
                <button onClick={handleClaim} disabled={isProcessing}
                  className="flex-1 py-3.5 rounded-2xl font-bold text-white text-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-500/20 disabled:opacity-50">
                  {isProcessing ? 'Claiming...' : 'Claim Tokens'}
                </button>
              )}
              {parseFloat(userRefund) > 0 && !hasClaimedRefund && (
                <button onClick={handleClaimRefund} disabled={isProcessing}
                  className="flex-1 py-3.5 rounded-2xl font-bold text-amber-400 text-sm bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/20 disabled:opacity-50">
                  {isProcessing ? 'Claiming...' : 'Claim Refund'}
                </button>
              )}
            </div>
          ) : (
            <button className="w-full py-3.5 bg-white/[0.04] rounded-2xl text-gray-500 font-semibold cursor-not-allowed border border-white/[0.06] text-sm">
              {isEnded ? 'Sale Ended' : 'Coming Soon'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
