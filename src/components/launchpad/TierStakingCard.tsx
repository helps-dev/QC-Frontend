import { useState } from 'react'
import { useAccount, useReadContract, usePublicClient, useWalletClient, useChainId } from 'wagmi'
import { formatUnits, parseUnits } from 'viem'
import { TIER_STAKING_ABI } from '../../hooks/useIDOFactory'
import { getContracts, getStakingTokenName } from '../../config/contracts'
import { CHAIN_IDS } from '../../config/chains'

const TIER_NAMES = ['None', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond']
const TIER_COLORS = ['text-gray-400', 'text-amber-600', 'text-gray-300', 'text-yellow-400', 'text-cyan-400', 'text-purple-400']
const TIER_BG = ['from-gray-500/5', 'from-amber-600/10', 'from-gray-300/10', 'from-yellow-400/10', 'from-cyan-400/10', 'from-purple-400/10']
const TIER_BORDER = ['border-gray-500/10', 'border-amber-600/15', 'border-gray-300/15', 'border-yellow-400/15', 'border-cyan-400/15', 'border-purple-400/15']
const TIER_REQUIREMENTS = [0, 100, 500, 2000, 5000, 10000]
const TIER_WEIGHTS = [0, 1, 2, 5, 10, 20]

const ERC20_ABI = [
  { inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], name: 'approve', outputs: [{ type: 'bool' }], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }], name: 'allowance', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ name: 'account', type: 'address' }], name: 'balanceOf', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
] as const

export function TierStakingCard() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const contracts = getContracts(chainId)
  const stakingToken = getStakingTokenName(chainId)
  const explorerUrl = chainId === CHAIN_IDS.MEGAETH ? 'https://megaeth.blockscout.com' : 'https://monadscan.com'
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  const [amount, setAmount] = useState('')
  const [isStaking, setIsStaking] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [status, setStatus] = useState('')
  const [txHash, setTxHash] = useState('')

  const STAKING_TOKEN = contracts.NATIVE_TOKEN

  const { data: userInfo, refetch: refetchUser } = useReadContract({
    address: contracts.TIER_STAKING, abi: TIER_STAKING_ABI, functionName: 'getUserInfo',
    args: address ? [address] : undefined, query: { enabled: !!address }
  })
  const { data: quickBalance } = useReadContract({
    address: STAKING_TOKEN, abi: ERC20_ABI, functionName: 'balanceOf',
    args: address ? [address] : undefined, query: { enabled: !!address }
  })
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: STAKING_TOKEN, abi: ERC20_ABI, functionName: 'allowance',
    args: address ? [address, contracts.TIER_STAKING] : undefined, query: { enabled: !!address }
  })
  const { data: totalStaked } = useReadContract({
    address: contracts.TIER_STAKING, abi: TIER_STAKING_ABI, functionName: 'totalStaked'
  })

  const stakedAmount = userInfo ? formatUnits(userInfo[0] as bigint, 18) : '0'
  const userTier = userInfo ? Number(userInfo[1]) : 0
  const userWeight = userInfo ? Number(userInfo[2]) : 0
  const hasGuaranteed = userInfo ? userInfo[3] as boolean : false
  const unlockTime = userInfo ? Number(userInfo[6]) : 0
  const balance = quickBalance ? formatUnits(quickBalance, 18) : '0'
  const totalStakedAmount = totalStaked ? formatUnits(totalStaked, 18) : '0'
  const needsApproval = allowance !== undefined && parseUnits(amount || '0', 18) > (allowance as bigint)
  const isLocked = unlockTime > Math.floor(Date.now() / 1000)

  const waitForTx = async (hash: `0x${string}`): Promise<boolean> => {
    if (!publicClient) return false
    const start = Date.now()
    while (Date.now() - start < 180000) {
      try {
        const r = await publicClient.getTransactionReceipt({ hash })
        if (r) return r.status === 'success'
      } catch { /* continue */ }
      await new Promise(r => setTimeout(r, 3000))
    }
    return false
  }

  const handleApprove = async () => {
    if (!walletClient || !publicClient) return
    setIsProcessing(true); setStatus(`📝 Approving ${stakingToken.symbol}...`)
    try {
      const gasPrice = await publicClient.getGasPrice()
      const hash = await walletClient.writeContract({
        address: STAKING_TOKEN, abi: ERC20_ABI, functionName: 'approve',
        args: [contracts.TIER_STAKING, parseUnits('999999999', 18)],
        gas: 100_000n, gasPrice: (gasPrice * 130n) / 100n
      })
      setTxHash(hash); setStatus('⏳ Confirming...')
      const ok = await waitForTx(hash)
      setStatus(ok ? '✅ Approved!' : '❌ Failed')
      if (ok) refetchAllowance()
    } catch (e: unknown) {
      const err = e as Error & { shortMessage?: string }
      setStatus(`❌ ${err?.shortMessage || err?.message || 'Failed'}`)
    }
    setIsProcessing(false)
  }

  const handleStake = async () => {
    if (!walletClient || !publicClient || !amount) return
    setIsProcessing(true); setStatus(`📝 Staking ${stakingToken.symbol}...`)
    try {
      const gasPrice = await publicClient.getGasPrice()
      const hash = await walletClient.writeContract({
        address: contracts.TIER_STAKING, abi: TIER_STAKING_ABI, functionName: 'stake',
        args: [parseUnits(amount, 18)],
        gas: 300_000n, gasPrice: (gasPrice * 130n) / 100n
      })
      setTxHash(hash); setStatus('⏳ Confirming...')
      const ok = await waitForTx(hash)
      setStatus(ok ? '✅ Staked!' : '❌ Failed')
      if (ok) { refetchUser(); setAmount('') }
    } catch (e: unknown) {
      const err = e as Error & { shortMessage?: string }
      setStatus(`❌ ${err?.shortMessage || err?.message || 'Failed'}`)
    }
    setIsProcessing(false)
  }

  const handleUnstake = async () => {
    if (!walletClient || !publicClient || !amount) return
    if (isLocked) { setStatus('❌ Tokens still locked'); return }
    setIsProcessing(true); setStatus(`📝 Unstaking ${stakingToken.symbol}...`)
    try {
      const gasPrice = await publicClient.getGasPrice()
      const hash = await walletClient.writeContract({
        address: contracts.TIER_STAKING, abi: TIER_STAKING_ABI, functionName: 'unstake',
        args: [parseUnits(amount, 18)],
        gas: 300_000n, gasPrice: (gasPrice * 130n) / 100n
      })
      setTxHash(hash); setStatus('⏳ Confirming...')
      const ok = await waitForTx(hash)
      setStatus(ok ? '✅ Unstaked!' : '❌ Failed')
      if (ok) { refetchUser(); setAmount('') }
    } catch (e: unknown) {
      const err = e as Error & { shortMessage?: string }
      setStatus(`❌ ${err?.shortMessage || err?.message || 'Failed'}`)
    }
    setIsProcessing(false)
  }

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1a0e2e] via-[#1e1535] to-[#12101f] border border-purple-500/10 p-5 sm:p-6 mb-6">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-yellow-500/5 rounded-full blur-[80px]" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-500/5 rounded-full blur-[60px]" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-500 blur-lg opacity-30" />
              <div className="relative w-full h-full rounded-xl bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 p-[2px]">
                <div className="w-full h-full rounded-xl bg-gradient-to-br from-[#1a1028] to-[#12101f] flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="url(#tierStar)" />
                    <defs><linearGradient id="tierStar" x1="2" y1="2" x2="22" y2="22"><stop stopColor="#fbbf24"/><stop offset="1" stopColor="#f59e0b"/></linearGradient></defs>
                  </svg>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-white">Tier Staking</h3>
              <p className="text-xs text-gray-400">Stake {stakingToken.symbol} to unlock higher tiers</p>
            </div>
          </div>
          <div className="bg-white/[0.03] rounded-xl px-4 py-2 border border-white/[0.06]">
            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Total Staked</p>
            <p className="text-sm font-bold text-white">{parseFloat(totalStakedAmount).toLocaleString()} {stakingToken.symbol}</p>
          </div>
        </div>

        {/* Tier Progress Grid */}
        <div className="overflow-x-auto hide-scrollbar -mx-5 sm:mx-0 px-5 sm:px-0 mb-6">
          <div className="grid grid-cols-6 gap-2 min-w-[520px] sm:min-w-0">
            {TIER_NAMES.map((name, i) => (
              <div key={i} className={`text-center p-2.5 sm:p-3 rounded-xl bg-gradient-to-b ${TIER_BG[i]} to-transparent border ${userTier >= i ? TIER_BORDER[i] : 'border-white/[0.04]'} transition-all ${userTier === i ? 'ring-1 ring-purple-500/30' : ''}`}>
                <p className={`text-[10px] sm:text-xs font-bold ${TIER_COLORS[i]}`}>{name}</p>
                <p className="text-[9px] text-gray-500 mt-0.5">{TIER_REQUIREMENTS[i]} {stakingToken.symbol}</p>
                <p className="text-[9px] text-gray-500">{TIER_WEIGHTS[i]}x weight</p>
                {userTier >= i && i > 0 && (
                  <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3 mx-auto mt-1 text-emerald-400" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
                )}
              </div>
            ))}
          </div>
        </div>

        {isConnected && (
          <>
            {/* User Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {[
                { label: 'Your Tier', value: TIER_NAMES[userTier], colorClass: TIER_COLORS[userTier] },
                { label: 'Staked', value: `${parseFloat(stakedAmount).toLocaleString()}`, colorClass: 'text-white' },
                { label: 'Weight', value: `${userWeight}x`, colorClass: 'text-purple-400' },
                { label: 'Guaranteed', value: hasGuaranteed ? 'Yes ✓' : 'No', colorClass: hasGuaranteed ? 'text-emerald-400' : 'text-gray-500' },
              ].map((stat) => (
                <div key={stat.label} className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.04]">
                  <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">{stat.label}</p>
                  <p className={`text-base sm:text-lg font-bold ${stat.colorClass} truncate`}>{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Lock Status */}
            {isLocked && (
              <div className="bg-amber-500/10 border border-amber-500/15 rounded-xl p-3 mb-4 flex items-center gap-2.5">
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-amber-400 shrink-0" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                <span className="text-xs text-amber-400">Locked until {new Date(unlockTime * 1000).toLocaleDateString()}</span>
              </div>
            )}

            {/* Stake/Unstake Toggle */}
            <div className="flex gap-2 mb-4 p-1 bg-white/[0.02] rounded-xl border border-white/[0.04]">
              <button onClick={() => setIsStaking(true)}
                className={`flex-1 py-2.5 rounded-lg font-medium transition-all text-sm flex items-center justify-center gap-2 ${isStaking ? 'bg-gradient-to-r from-purple-600/20 to-pink-600/20 text-purple-300 border border-purple-500/20' : 'text-gray-500 hover:text-gray-300'}`}>
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="2"><path d="M22 7l-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/></svg>
                Stake
              </button>
              <button onClick={() => setIsStaking(false)}
                className={`flex-1 py-2.5 rounded-lg font-medium transition-all text-sm flex items-center justify-center gap-2 ${!isStaking ? 'bg-gradient-to-r from-purple-600/20 to-pink-600/20 text-purple-300 border border-purple-500/20' : 'text-gray-500 hover:text-gray-300'}`}>
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                Unstake
              </button>
            </div>

            {/* Amount Input */}
            <div className="bg-black/20 rounded-xl p-4 border border-white/5 mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">{isStaking ? 'Stake' : 'Unstake'} Amount</span>
                <button onClick={() => setAmount(isStaking ? balance : stakedAmount)} className="text-[10px] text-purple-400 hover:text-purple-300 transition-colors">
                  Max: {isStaking ? parseFloat(balance).toFixed(2) : parseFloat(stakedAmount).toFixed(2)}
                </button>
              </div>
              <div className="flex items-center gap-3">
                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.0"
                  disabled={isProcessing}
                  className="flex-1 bg-transparent text-2xl text-white outline-none placeholder-gray-600 min-w-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                <div className="flex items-center gap-2 bg-white/[0.04] rounded-lg px-3 py-2 border border-white/[0.06] shrink-0">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-400 to-pink-400" />
                  <span className="font-semibold text-white text-sm">{stakingToken.symbol}</span>
                </div>
              </div>
            </div>

            {/* Status */}
            {status && (
              <div className={`rounded-xl p-3 mb-4 text-sm ${status.includes('✅') ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : status.includes('❌') ? 'bg-red-500/10 border border-red-500/20 text-red-400' : 'bg-blue-500/10 border border-blue-500/20 text-blue-400'}`}>
                {isProcessing && <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 inline-block animate-spin mr-2" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>}
                {status}
              </div>
            )}
            {txHash && (
              <a href={`${explorerUrl}/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
                className="text-[10px] text-purple-400 hover:text-purple-300 flex items-center gap-1.5 mb-4 transition-colors">
                <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/></svg>
                View on Explorer
              </a>
            )}

            {/* Action Button */}
            {isStaking ? (
              needsApproval ? (
                <button onClick={handleApprove} disabled={isProcessing || !amount}
                  className="w-full py-3.5 rounded-2xl font-bold text-white text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-lg shadow-purple-500/20">
                  {isProcessing ? 'Approving...' : `Approve ${stakingToken.symbol}`}
                </button>
              ) : (
                <button onClick={handleStake} disabled={isProcessing || !amount}
                  className="w-full py-3.5 rounded-2xl font-bold text-white text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-lg shadow-purple-500/20">
                  {isProcessing ? 'Staking...' : `Stake ${amount || '0'} ${stakingToken.symbol}`}
                </button>
              )
            ) : (
              <button onClick={handleUnstake} disabled={isProcessing || !amount || isLocked}
                className="w-full py-3.5 rounded-2xl font-bold text-white text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-lg shadow-purple-500/20">
                {isProcessing ? 'Unstaking...' : isLocked ? 'Tokens Locked' : `Unstake ${amount || '0'} ${stakingToken.symbol}`}
              </button>
            )}
          </>
        )}

        {!isConnected && (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-gray-500" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
            </div>
            <p className="text-gray-400 text-sm">Connect wallet to stake {stakingToken.symbol} and unlock tiers</p>
          </div>
        )}
      </div>
    </div>
  )
}
