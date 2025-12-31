import { useState } from 'react'
import { useAccount, useReadContract, usePublicClient, useWalletClient } from 'wagmi'
import { Award, Lock, Unlock, TrendingUp, RefreshCw, ExternalLink } from 'lucide-react'
import { formatUnits, parseUnits, type Address } from 'viem'
import { TIER_STAKING_ADDRESS, TIER_STAKING_ABI } from '../../hooks/useIDOFactory'

const QUICK_TOKEN = '0x6d42eFC8B2EC22cC61B47BfC2ABb38D570Faabb5' as Address
const TIER_NAMES = ['None', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond']
const TIER_COLORS = ['text-gray-400', 'text-amber-600', 'text-gray-300', 'text-yellow-400', 'text-cyan-400', 'text-purple-400']
const TIER_REQUIREMENTS = [0, 100, 500, 2000, 5000, 10000]
const TIER_WEIGHTS = [0, 1, 2, 5, 10, 20]

const ERC20_ABI = [
  { inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], name: 'approve', outputs: [{ type: 'bool' }], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }], name: 'allowance', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ name: 'account', type: 'address' }], name: 'balanceOf', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
] as const

export function TierStakingCard() {
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  const [amount, setAmount] = useState('')
  const [isStaking, setIsStaking] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [status, setStatus] = useState('')
  const [txHash, setTxHash] = useState('')

  const { data: userInfo, refetch: refetchUser } = useReadContract({
    address: TIER_STAKING_ADDRESS, abi: TIER_STAKING_ABI, functionName: 'getUserInfo',
    args: address ? [address] : undefined, query: { enabled: !!address }
  })

  const { data: quickBalance } = useReadContract({
    address: QUICK_TOKEN, abi: ERC20_ABI, functionName: 'balanceOf',
    args: address ? [address] : undefined, query: { enabled: !!address }
  })

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: QUICK_TOKEN, abi: ERC20_ABI, functionName: 'allowance',
    args: address ? [address, TIER_STAKING_ADDRESS] : undefined, query: { enabled: !!address }
  })

  const { data: totalStaked } = useReadContract({
    address: TIER_STAKING_ADDRESS, abi: TIER_STAKING_ABI, functionName: 'totalStaked'
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
    setIsProcessing(true); setStatus('📝 Approving QUICK...')
    try {
      const gasPrice = await publicClient.getGasPrice()
      const hash = await walletClient.writeContract({
        address: QUICK_TOKEN, abi: ERC20_ABI, functionName: 'approve',
        args: [TIER_STAKING_ADDRESS, parseUnits('999999999', 18)],
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
    setIsProcessing(true); setStatus('📝 Staking QUICK...')
    try {
      const gasPrice = await publicClient.getGasPrice()
      const hash = await walletClient.writeContract({
        address: TIER_STAKING_ADDRESS, abi: TIER_STAKING_ABI, functionName: 'stake',
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
    setIsProcessing(true); setStatus('📝 Unstaking QUICK...')
    try {
      const gasPrice = await publicClient.getGasPrice()
      const hash = await walletClient.writeContract({
        address: TIER_STAKING_ADDRESS, abi: TIER_STAKING_ABI, functionName: 'unstake',
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
    <div className="glass-card p-4 sm:p-5 md:p-6 mb-4 sm:mb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 sm:mb-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <Award className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-400 shrink-0" />
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-white">Tier Staking</h3>
            <p className="text-xs sm:text-sm text-gray-400">Stake QUICK to unlock higher tiers</p>
          </div>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-[10px] sm:text-xs text-gray-400">Total Staked</p>
          <p className="text-base sm:text-lg font-bold text-white">{parseFloat(totalStakedAmount).toLocaleString()} QUICK</p>
        </div>
      </div>

      {/* Tier Progress - Scrollable on mobile */}
      <div className="overflow-x-auto hide-scrollbar -mx-4 sm:mx-0 px-4 sm:px-0 mb-4 sm:mb-6">
        <div className="grid grid-cols-6 gap-1.5 sm:gap-2 min-w-[500px] sm:min-w-0">
          {TIER_NAMES.map((name, i) => (
            <div key={i} className={`text-center p-2 sm:p-3 rounded-lg ${userTier >= i ? 'bg-primary-500/20 border border-primary-500/30' : 'bg-atlantis-800/30'}`}>
              <p className={`text-[10px] sm:text-xs font-semibold ${TIER_COLORS[i]}`}>{name}</p>
              <p className="text-[9px] sm:text-xs text-gray-500">{TIER_REQUIREMENTS[i]}</p>
              <p className="text-[9px] sm:text-xs text-gray-500">{TIER_WEIGHTS[i]}x</p>
            </div>
          ))}
        </div>
      </div>

      {isConnected && (
        <>
          {/* User Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
            <div className="bg-atlantis-800/30 rounded-lg p-2 sm:p-3">
              <p className="text-[10px] sm:text-xs text-gray-400">Your Tier</p>
              <p className={`text-base sm:text-lg font-bold ${TIER_COLORS[userTier]}`}>{TIER_NAMES[userTier]}</p>
            </div>
            <div className="bg-atlantis-800/30 rounded-lg p-2 sm:p-3">
              <p className="text-[10px] sm:text-xs text-gray-400">Staked</p>
              <p className="text-base sm:text-lg font-bold text-white truncate">{parseFloat(stakedAmount).toLocaleString()}</p>
            </div>
            <div className="bg-atlantis-800/30 rounded-lg p-2 sm:p-3">
              <p className="text-[10px] sm:text-xs text-gray-400">Weight</p>
              <p className="text-base sm:text-lg font-bold text-primary-400">{userWeight}x</p>
            </div>
            <div className="bg-atlantis-800/30 rounded-lg p-2 sm:p-3">
              <p className="text-[10px] sm:text-xs text-gray-400">Guaranteed</p>
              <p className={`text-base sm:text-lg font-bold ${hasGuaranteed ? 'text-green-400' : 'text-gray-500'}`}>
                {hasGuaranteed ? 'Yes ✓' : 'No'}
              </p>
            </div>
          </div>

          {/* Lock Status */}
          {isLocked && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-2 sm:p-3 mb-3 sm:mb-4 flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-400 shrink-0" />
              <span className="text-xs sm:text-sm text-yellow-400">
                Locked until {new Date(unlockTime * 1000).toLocaleDateString()}
              </span>
            </div>
          )}

          {/* Stake/Unstake Toggle */}
          <div className="flex gap-2 mb-3 sm:mb-4">
            <button onClick={() => setIsStaking(true)}
              className={`flex-1 py-2 rounded-lg font-medium transition-all text-sm ${isStaking ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30' : 'bg-atlantis-800/30 text-gray-400'}`}>
              <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline mr-1.5 sm:mr-2" />Stake
            </button>
            <button onClick={() => setIsStaking(false)}
              className={`flex-1 py-2 rounded-lg font-medium transition-all text-sm ${!isStaking ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30' : 'bg-atlantis-800/30 text-gray-400'}`}>
              <Unlock className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline mr-1.5 sm:mr-2" />Unstake
            </button>
          </div>

          {/* Amount Input */}
          <div className="bg-atlantis-800/30 rounded-xl p-3 sm:p-4 border border-atlantis-700/30 mb-3 sm:mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs sm:text-sm text-gray-400">{isStaking ? 'Stake' : 'Unstake'} Amount</span>
              <button onClick={() => setAmount(isStaking ? balance : stakedAmount)} className="text-[10px] sm:text-xs text-primary-400 hover:text-primary-300">
                Max: {isStaking ? parseFloat(balance).toFixed(2) : parseFloat(stakedAmount).toFixed(2)}
              </button>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.0"
                disabled={isProcessing} className="flex-1 bg-transparent text-xl sm:text-2xl text-white outline-none placeholder-gray-600 min-w-0" />
              <span className="font-semibold text-white text-sm sm:text-base shrink-0">QUICK</span>
            </div>
          </div>

          {/* Status */}
          {status && (
            <div className={`rounded-lg p-2 sm:p-3 mb-3 sm:mb-4 text-xs sm:text-sm ${status.includes('✅') ? 'bg-green-500/10 text-green-400' : status.includes('❌') ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'}`}>
              {isProcessing && <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline animate-spin mr-2" />}
              {status}
            </div>
          )}
          {txHash && (
            <a href={`https://explorer.monad.xyz/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
              className="text-[10px] sm:text-xs text-primary-400 hover:underline flex items-center gap-1 mb-3 sm:mb-4">
              View on Explorer <ExternalLink className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            </a>
          )}

          {/* Action Button */}
          {isStaking ? (
            needsApproval ? (
              <button onClick={handleApprove} disabled={isProcessing || !amount}
                className="w-full gradient-button py-2.5 sm:py-3 text-sm sm:text-base disabled:opacity-50">
                {isProcessing ? 'Approving...' : 'Approve QUICK'}
              </button>
            ) : (
              <button onClick={handleStake} disabled={isProcessing || !amount}
                className="w-full gradient-button py-2.5 sm:py-3 text-sm sm:text-base disabled:opacity-50">
                {isProcessing ? 'Staking...' : `Stake ${amount || '0'} QUICK`}
              </button>
            )
          ) : (
            <button onClick={handleUnstake} disabled={isProcessing || !amount || isLocked}
              className="w-full gradient-button py-2.5 sm:py-3 text-sm sm:text-base disabled:opacity-50">
              {isProcessing ? 'Unstaking...' : isLocked ? 'Tokens Locked' : `Unstake ${amount || '0'} QUICK`}
            </button>
          )}
        </>
      )}

      {!isConnected && (
        <div className="text-center py-6 sm:py-8">
          <p className="text-gray-400 text-sm sm:text-base">Connect wallet to stake QUICK and unlock tiers</p>
        </div>
      )}
    </div>
  )
}
