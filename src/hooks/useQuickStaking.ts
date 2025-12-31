import { useState, useCallback } from 'react'
import { useAccount, usePublicClient, useWalletClient, useReadContract } from 'wagmi'
import { parseUnits, formatUnits, maxUint256 } from 'viem'
import { ERC20_ABI } from '../config/abis'

// Contract addresses
export const QUICK_STAKING_ADDRESS = '0x825eCCd2Df16CA272250134F66511AddCacAa4B9' as `0x${string}`
export const QUICK_TOKEN_ADDRESS = '0x6d42eFC8B2EC16cC61B47BfC2ABb38D570Faabb5' as `0x${string}`

// Staking contract ABI
export const QUICK_STAKING_ABI = [
  {
    inputs: [{ name: '_amount', type: 'uint256' }],
    name: 'stake',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: '_amount', type: 'uint256' }],
    name: 'unstake',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'claim',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'compound',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: '_user', type: 'address' }],
    name: 'pendingReward',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: '_user', type: 'address' }],
    name: 'getStakeDetails',
    outputs: [
      { name: 'stakedAmount', type: 'uint256' },
      { name: 'pendingRewards', type: 'uint256' },
      { name: 'lockEndTime', type: 'uint256' },
      { name: 'isLocked', type: 'bool' },
      { name: 'penaltyIfWithdrawNow', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalStaked',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'rewardRate',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'minStake',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'maxStake',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'lockPeriod',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'earlyWithdrawPenalty',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'compoundBonus',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

// Debug logger
const DEBUG = true
const log = (...args: unknown[]) => {
  if (DEBUG) console.log('[useQuickStaking]', ...args)
}

interface StakeDetails {
  stakedAmount: string
  pendingRewards: string
  lockEndTime: number
  isLocked: boolean
  penaltyIfWithdrawNow: string
}

interface PoolInfo {
  totalStaked: string
  rewardRate: string
  minStake: string
  maxStake: string
  lockPeriod: number
  earlyWithdrawPenalty: number
  compoundBonus: number
}

interface TxResult {
  success: boolean
  hash?: string
  error?: string
}

export function useQuickStaking() {
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()

  const [isProcessing, setIsProcessing] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [txError, setTxError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')

  // Read QUICK balance
  const { data: quickBalance, refetch: refetchBalance } = useReadContract({
    address: QUICK_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })

  // Read allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: QUICK_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, QUICK_STAKING_ADDRESS] : undefined,
    query: { enabled: !!address },
  })

  // Read stake details
  const { data: stakeDetailsRaw, refetch: refetchStakeDetails } = useReadContract({
    address: QUICK_STAKING_ADDRESS,
    abi: QUICK_STAKING_ABI,
    functionName: 'getStakeDetails',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })

  // Read pool info
  const { data: totalStaked } = useReadContract({
    address: QUICK_STAKING_ADDRESS,
    abi: QUICK_STAKING_ABI,
    functionName: 'totalStaked',
  })

  const { data: rewardRate } = useReadContract({
    address: QUICK_STAKING_ADDRESS,
    abi: QUICK_STAKING_ABI,
    functionName: 'rewardRate',
  })

  const { data: minStake } = useReadContract({
    address: QUICK_STAKING_ADDRESS,
    abi: QUICK_STAKING_ABI,
    functionName: 'minStake',
  })

  const { data: maxStake } = useReadContract({
    address: QUICK_STAKING_ADDRESS,
    abi: QUICK_STAKING_ABI,
    functionName: 'maxStake',
  })

  const { data: lockPeriod } = useReadContract({
    address: QUICK_STAKING_ADDRESS,
    abi: QUICK_STAKING_ABI,
    functionName: 'lockPeriod',
  })

  const { data: earlyWithdrawPenalty } = useReadContract({
    address: QUICK_STAKING_ADDRESS,
    abi: QUICK_STAKING_ABI,
    functionName: 'earlyWithdrawPenalty',
  })

  const { data: compoundBonus } = useReadContract({
    address: QUICK_STAKING_ADDRESS,
    abi: QUICK_STAKING_ABI,
    functionName: 'compoundBonus',
  })

  // Parse stake details
  const stakeDetails: StakeDetails = stakeDetailsRaw
    ? {
        stakedAmount: formatUnits(stakeDetailsRaw[0], 18),
        pendingRewards: formatUnits(stakeDetailsRaw[1], 18),
        lockEndTime: Number(stakeDetailsRaw[2]),
        isLocked: stakeDetailsRaw[3],
        penaltyIfWithdrawNow: formatUnits(stakeDetailsRaw[4], 18),
      }
    : {
        stakedAmount: '0',
        pendingRewards: '0',
        lockEndTime: 0,
        isLocked: false,
        penaltyIfWithdrawNow: '0',
      }

  // Parse pool info
  const poolInfo: PoolInfo = {
    totalStaked: totalStaked ? formatUnits(totalStaked, 18) : '0',
    rewardRate: rewardRate ? formatUnits(rewardRate, 18) : '0',
    minStake: minStake ? formatUnits(minStake, 18) : '1',
    maxStake: maxStake ? formatUnits(maxStake, 18) : '1000',
    lockPeriod: lockPeriod ? Number(lockPeriod) : 365 * 24 * 60 * 60,
    earlyWithdrawPenalty: earlyWithdrawPenalty ? Number(earlyWithdrawPenalty) : 10,
    compoundBonus: compoundBonus ? Number(compoundBonus) : 1,
  }

  // Get fresh nonce
  const getFreshNonce = useCallback(async (): Promise<number> => {
    if (!publicClient || !address) throw new Error('Not connected')
    const nonce = await publicClient.getTransactionCount({ address, blockTag: 'pending' })
    return nonce
  }, [publicClient, address])

  // Wait for tx
  const waitForTx = useCallback(
    async (hash: `0x${string}`, timeoutMs = 120000): Promise<boolean> => {
      if (!publicClient) return false
      log('⏳ Waiting for tx:', hash)
      const startTime = Date.now()
      while (Date.now() - startTime < timeoutMs) {
        try {
          const receipt = await publicClient.getTransactionReceipt({ hash })
          if (receipt) {
            log('✅ Tx confirmed:', receipt.status)
            return receipt.status === 'success'
          }
        } catch {
          // Continue waiting
        }
        await new Promise((r) => setTimeout(r, 2000))
      }
      return false
    },
    [publicClient]
  )

  // Check if approval needed
  const needsApproval = useCallback(
    (amount: string): boolean => {
      if (!allowance || !amount) return true
      try {
        const amountWei = parseUnits(amount, 18)
        return allowance < amountWei
      } catch {
        return true
      }
    },
    [allowance]
  )

  // Approve QUICK
  const approve = useCallback(async (): Promise<TxResult> => {
    log('🚀 Starting APPROVE...')
    if (!walletClient || !address || !publicClient) {
      return { success: false, error: 'Wallet not connected' }
    }

    setIsProcessing(true)
    setTxError(null)
    setStatusMessage('Approving QUICK...')

    try {
      const nonce = await getFreshNonce()
      const gasPrice = await publicClient.getGasPrice()

      const hash = await walletClient.writeContract({
        address: QUICK_TOKEN_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [QUICK_STAKING_ADDRESS, maxUint256],
        gas: BigInt(100_000),
        nonce,
        gasPrice: (gasPrice * 130n) / 100n,
      })

      log('✅ Approve tx sent:', hash)
      setTxHash(hash)
      setStatusMessage('Waiting for approval confirmation...')

      const confirmed = await waitForTx(hash)
      if (confirmed) {
        await refetchAllowance()
        setIsSuccess(true)
        setStatusMessage('✅ Approved!')
        setIsProcessing(false)
        return { success: true, hash }
      }
      throw new Error('Approval not confirmed')
    } catch (err: unknown) {
      const error = err as Error & { shortMessage?: string }
      const msg = error?.shortMessage || error?.message || 'Approval failed'
      log('❌ Approve error:', msg)
      setTxError(msg)
      setStatusMessage(`❌ ${msg}`)
      setIsProcessing(false)
      return { success: false, error: msg }
    }
  }, [walletClient, address, publicClient, getFreshNonce, waitForTx, refetchAllowance])

  // Stake QUICK
  const stake = useCallback(
    async (amount: string): Promise<TxResult> => {
      log('🚀 Starting STAKE...', { amount })
      
      if (!walletClient || !address || !publicClient) {
        const error = 'Wallet not connected'
        log('❌ Stake error:', error)
        setStatusMessage(`❌ ${error}`)
        return { success: false, error }
      }

      const amountNum = parseFloat(amount)
      if (isNaN(amountNum) || amountNum <= 0) {
        const error = 'Invalid amount'
        log('❌ Stake error:', error)
        setStatusMessage(`❌ ${error}`)
        return { success: false, error }
      }

      if (amountNum < parseFloat(poolInfo.minStake)) {
        const error = `Minimum stake is ${poolInfo.minStake} QUICK`
        log('❌ Stake error:', error)
        setStatusMessage(`❌ ${error}`)
        return { success: false, error }
      }

      if (parseFloat(stakeDetails.stakedAmount) + amountNum > parseFloat(poolInfo.maxStake)) {
        const error = `Maximum stake is ${poolInfo.maxStake} QUICK`
        log('❌ Stake error:', error)
        setStatusMessage(`❌ ${error}`)
        return { success: false, error }
      }

      setIsProcessing(true)
      setTxError(null)
      setTxHash(null)
      setIsSuccess(false)
      setStatusMessage('🔄 Preparing stake transaction...')

      try {
        const amountWei = parseUnits(amount, 18)
        log('📊 Amount in Wei:', amountWei.toString())

        setStatusMessage('🔄 Getting fresh nonce...')
        const nonce = await getFreshNonce()
        log('📊 Nonce:', nonce)

        setStatusMessage('🔄 Getting gas price...')
        const gasPrice = await publicClient.getGasPrice()
        const adjustedGasPrice = (gasPrice * 130n) / 100n
        log('📊 Gas price:', gasPrice.toString(), '→', adjustedGasPrice.toString())

        setStatusMessage('📝 Please confirm in your wallet...')
        
        const hash = await walletClient.writeContract({
          address: QUICK_STAKING_ADDRESS,
          abi: QUICK_STAKING_ABI,
          functionName: 'stake',
          args: [amountWei],
          gas: BigInt(300_000),
          nonce,
          gasPrice: adjustedGasPrice,
        })

        log('✅ Stake tx sent:', hash)
        setTxHash(hash)
        setStatusMessage('⏳ Waiting for confirmation (up to 2 min)...')

        const confirmed = await waitForTx(hash)
        if (confirmed) {
          await Promise.all([refetchBalance(), refetchStakeDetails()])
          setIsSuccess(true)
          setStatusMessage(`✅ Successfully staked ${amount} QUICK!`)
          setIsProcessing(false)
          return { success: true, hash }
        }
        throw new Error('Transaction not confirmed within timeout')
      } catch (err: unknown) {
        const error = err as Error & { shortMessage?: string; code?: number }
        let msg = error?.shortMessage || error?.message || 'Stake failed'
        
        // Handle specific error cases
        if (msg.includes('user rejected') || error?.code === 4001) {
          msg = 'Transaction rejected by user'
        } else if (msg.includes('insufficient funds')) {
          msg = 'Insufficient QUICK balance'
        } else if (msg.includes('Below minimum')) {
          msg = `Minimum stake is ${poolInfo.minStake} QUICK`
        } else if (msg.includes('Exceeds maximum')) {
          msg = `Maximum stake is ${poolInfo.maxStake} QUICK`
        }
        
        log('❌ Stake error:', msg)
        setTxError(msg)
        setStatusMessage(`❌ ${msg}`)
        setIsProcessing(false)
        return { success: false, error: msg }
      }
    },
    [walletClient, address, publicClient, poolInfo, stakeDetails, getFreshNonce, waitForTx, refetchBalance, refetchStakeDetails]
  )

  // Unstake QUICK
  const unstake = useCallback(
    async (amount: string): Promise<TxResult> => {
      log('🚀 Starting UNSTAKE...', { amount })
      if (!walletClient || !address || !publicClient) {
        return { success: false, error: 'Wallet not connected' }
      }

      setIsProcessing(true)
      setTxError(null)
      setStatusMessage('Unstaking QUICK...')

      try {
        const amountWei = parseUnits(amount, 18)
        const nonce = await getFreshNonce()
        const gasPrice = await publicClient.getGasPrice()

        const hash = await walletClient.writeContract({
          address: QUICK_STAKING_ADDRESS,
          abi: QUICK_STAKING_ABI,
          functionName: 'unstake',
          args: [amountWei],
          gas: BigInt(300_000),
          nonce,
          gasPrice: (gasPrice * 130n) / 100n,
        })

        log('✅ Unstake tx sent:', hash)
        setTxHash(hash)
        setStatusMessage('Waiting for unstake confirmation...')

        const confirmed = await waitForTx(hash)
        if (confirmed) {
          await Promise.all([refetchBalance(), refetchStakeDetails()])
          setIsSuccess(true)
          setStatusMessage('✅ Unstaked successfully!')
          setIsProcessing(false)
          return { success: true, hash }
        }
        throw new Error('Unstake not confirmed')
      } catch (err: unknown) {
        const error = err as Error & { shortMessage?: string }
        const msg = error?.shortMessage || error?.message || 'Unstake failed'
        log('❌ Unstake error:', msg)
        setTxError(msg)
        setStatusMessage(`❌ ${msg}`)
        setIsProcessing(false)
        return { success: false, error: msg }
      }
    },
    [walletClient, address, publicClient, getFreshNonce, waitForTx, refetchBalance, refetchStakeDetails]
  )

  // Claim rewards
  const claim = useCallback(async (): Promise<TxResult> => {
    log('🚀 Starting CLAIM...')
    if (!walletClient || !address || !publicClient) {
      return { success: false, error: 'Wallet not connected' }
    }

    setIsProcessing(true)
    setTxError(null)
    setStatusMessage('Claiming rewards...')

    try {
      const nonce = await getFreshNonce()
      const gasPrice = await publicClient.getGasPrice()

      const hash = await walletClient.writeContract({
        address: QUICK_STAKING_ADDRESS,
        abi: QUICK_STAKING_ABI,
        functionName: 'claim',
        args: [],
        gas: BigInt(200_000),
        nonce,
        gasPrice: (gasPrice * 130n) / 100n,
      })

      log('✅ Claim tx sent:', hash)
      setTxHash(hash)
      setStatusMessage('Waiting for claim confirmation...')

      const confirmed = await waitForTx(hash)
      if (confirmed) {
        await Promise.all([refetchBalance(), refetchStakeDetails()])
        setIsSuccess(true)
        setStatusMessage('✅ Rewards claimed!')
        setIsProcessing(false)
        return { success: true, hash }
      }
      throw new Error('Claim not confirmed')
    } catch (err: unknown) {
      const error = err as Error & { shortMessage?: string }
      const msg = error?.shortMessage || error?.message || 'Claim failed'
      log('❌ Claim error:', msg)
      setTxError(msg)
      setStatusMessage(`❌ ${msg}`)
      setIsProcessing(false)
      return { success: false, error: msg }
    }
  }, [walletClient, address, publicClient, getFreshNonce, waitForTx, refetchBalance, refetchStakeDetails])

  // Compound rewards
  const compound = useCallback(async (): Promise<TxResult> => {
    log('🚀 Starting COMPOUND...')
    if (!walletClient || !address || !publicClient) {
      return { success: false, error: 'Wallet not connected' }
    }

    setIsProcessing(true)
    setTxError(null)
    setStatusMessage('Compounding rewards...')

    try {
      const nonce = await getFreshNonce()
      const gasPrice = await publicClient.getGasPrice()

      const hash = await walletClient.writeContract({
        address: QUICK_STAKING_ADDRESS,
        abi: QUICK_STAKING_ABI,
        functionName: 'compound',
        args: [],
        gas: BigInt(250_000),
        nonce,
        gasPrice: (gasPrice * 130n) / 100n,
      })

      log('✅ Compound tx sent:', hash)
      setTxHash(hash)
      setStatusMessage('Waiting for compound confirmation...')

      const confirmed = await waitForTx(hash)
      if (confirmed) {
        await refetchStakeDetails()
        setIsSuccess(true)
        setStatusMessage('✅ Compounded with bonus!')
        setIsProcessing(false)
        return { success: true, hash }
      }
      throw new Error('Compound not confirmed')
    } catch (err: unknown) {
      const error = err as Error & { shortMessage?: string }
      const msg = error?.shortMessage || error?.message || 'Compound failed'
      log('❌ Compound error:', msg)
      setTxError(msg)
      setStatusMessage(`❌ ${msg}`)
      setIsProcessing(false)
      return { success: false, error: msg }
    }
  }, [walletClient, address, publicClient, getFreshNonce, waitForTx, refetchStakeDetails])

  const reset = useCallback(() => {
    setTxError(null)
    setTxHash(null)
    setIsSuccess(false)
    setStatusMessage('')
  }, [])

  const refetchAll = useCallback(() => {
    refetchBalance()
    refetchAllowance()
    refetchStakeDetails()
  }, [refetchBalance, refetchAllowance, refetchStakeDetails])

  return {
    // Actions
    approve,
    stake,
    unstake,
    claim,
    compound,
    needsApproval,
    reset,
    refetchAll,
    // State
    isProcessing,
    isSuccess,
    txHash,
    txError,
    statusMessage,
    // Data
    quickBalance: quickBalance ? formatUnits(quickBalance, 18) : '0',
    stakeDetails,
    poolInfo,
  }
}
