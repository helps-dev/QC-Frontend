import { useState, useCallback } from 'react'
import { useAccount, usePublicClient, useWalletClient, useReadContract, useChainId } from 'wagmi'
import { parseUnits, formatUnits, type Address } from 'viem'
import { getContracts } from '../config/contracts'
import { CHAIN_IDS } from '../config/chains'

// ABIs
export const IDO_FACTORY_ABI = [
  { inputs: [], name: 'creationFeeMON', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'creationFeeETH', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'platformFee', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'getTotalIDOs', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'getAllIDOs', outputs: [{ components: [
    { name: 'poolAddress', type: 'address' }, { name: 'saleToken', type: 'address' },
    { name: 'creator', type: 'address' }, { name: 'name', type: 'string' },
    { name: 'hardCap', type: 'uint256' }, { name: 'softCap', type: 'uint256' },
    { name: 'startTime', type: 'uint256' }, { name: 'endTime', type: 'uint256' },
    { name: 'poolType', type: 'uint8' }, { name: 'createdAt', type: 'uint256' },
    { name: 'isActive', type: 'bool' }
  ], type: 'tuple[]' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'getLiveIDOs', outputs: [{ components: [
    { name: 'poolAddress', type: 'address' }, { name: 'saleToken', type: 'address' },
    { name: 'creator', type: 'address' }, { name: 'name', type: 'string' },
    { name: 'hardCap', type: 'uint256' }, { name: 'softCap', type: 'uint256' },
    { name: 'startTime', type: 'uint256' }, { name: 'endTime', type: 'uint256' },
    { name: 'poolType', type: 'uint8' }, { name: 'createdAt', type: 'uint256' },
    { name: 'isActive', type: 'bool' }
  ], type: 'tuple[]' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'getUpcomingIDOs', outputs: [{ components: [
    { name: 'poolAddress', type: 'address' }, { name: 'saleToken', type: 'address' },
    { name: 'creator', type: 'address' }, { name: 'name', type: 'string' },
    { name: 'hardCap', type: 'uint256' }, { name: 'softCap', type: 'uint256' },
    { name: 'startTime', type: 'uint256' }, { name: 'endTime', type: 'uint256' },
    { name: 'poolType', type: 'uint8' }, { name: 'createdAt', type: 'uint256' },
    { name: 'isActive', type: 'bool' }
  ], type: 'tuple[]' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'getEndedIDOs', outputs: [{ components: [
    { name: 'poolAddress', type: 'address' }, { name: 'saleToken', type: 'address' },
    { name: 'creator', type: 'address' }, { name: 'name', type: 'string' },
    { name: 'hardCap', type: 'uint256' }, { name: 'softCap', type: 'uint256' },
    { name: 'startTime', type: 'uint256' }, { name: 'endTime', type: 'uint256' },
    { name: 'poolType', type: 'uint8' }, { name: 'createdAt', type: 'uint256' },
    { name: 'isActive', type: 'bool' }
  ], type: 'tuple[]' }], stateMutability: 'view', type: 'function' },
  { inputs: [
    { name: '_name', type: 'string' }, { name: '_saleToken', type: 'address' },
    { name: '_paymentToken', type: 'address' }, { name: '_hardCap', type: 'uint256' },
    { name: '_softCap', type: 'uint256' }, { name: '_tokensForSale', type: 'uint256' },
    { name: '_startTime', type: 'uint256' }, { name: '_endTime', type: 'uint256' },
    { name: '_poolType', type: 'uint8' }
  ], name: 'createIDO', outputs: [{ type: 'address' }], stateMutability: 'payable', type: 'function' },
] as const

// Monad IDO Pool ABI (uses MON naming)
export const IDO_POOL_ABI_MONAD = [
  { inputs: [], name: 'getPoolInfo', outputs: [
    { name: '_name', type: 'string' }, { name: '_poolType', type: 'uint8' },
    { name: '_status', type: 'uint8' }, { name: '_hardCapMON', type: 'uint256' },
    { name: '_softCapMON', type: 'uint256' }, { name: '_totalCommittedMON', type: 'uint256' },
    { name: '_totalParticipants', type: 'uint256' }, { name: '_startTime', type: 'uint256' },
    { name: '_endTime', type: 'uint256' }, { name: '_tokensForSale', type: 'uint256' },
    { name: '_tokenPriceMON', type: 'uint256' }
  ], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'getOverflowPercent', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ name: '_user', type: 'address' }], name: 'getUserInfo', outputs: [
    { name: 'depositedMON', type: 'uint256' }, { name: 'allocation', type: 'uint256' },
    { name: 'refundAmountMON', type: 'uint256' }, { name: 'claimedAmount', type: 'uint256' },
    { name: 'claimable', type: 'uint256' }, { name: 'hasClaimedRefund', type: 'bool' }
  ], stateMutability: 'view', type: 'function' },
  { inputs: [{ name: '_user', type: 'address' }], name: 'estimateAllocation', outputs: [
    { name: 'estimatedTokens', type: 'uint256' }, { name: 'estimatedRefundMON', type: 'uint256' }
  ], stateMutability: 'view', type: 'function' },
  { inputs: [{ name: '_amount', type: 'uint256' }], name: 'deposit', outputs: [], stateMutability: 'payable', type: 'function' },
  { inputs: [], name: 'depositMON', outputs: [], stateMutability: 'payable', type: 'function' },
  { inputs: [], name: 'claim', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [], name: 'claimRefund', outputs: [], stateMutability: 'nonpayable', type: 'function' },
] as const

// MegaETH IDO Pool ABI (uses ETH naming)
export const IDO_POOL_ABI_MEGAETH = [
  { inputs: [], name: 'getPoolInfo', outputs: [
    { name: '_name', type: 'string' }, { name: '_poolType', type: 'uint8' },
    { name: '_status', type: 'uint8' }, { name: '_hardCapETH', type: 'uint256' },
    { name: '_softCapETH', type: 'uint256' }, { name: '_totalCommittedETH', type: 'uint256' },
    { name: '_totalParticipants', type: 'uint256' }, { name: '_startTime', type: 'uint256' },
    { name: '_endTime', type: 'uint256' }, { name: '_tokensForSale', type: 'uint256' },
    { name: '_tokenPriceETH', type: 'uint256' }
  ], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'getOverflowPercent', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ name: '_user', type: 'address' }], name: 'getUserInfo', outputs: [
    { name: 'depositedETH', type: 'uint256' }, { name: 'allocation', type: 'uint256' },
    { name: 'refundAmountETH', type: 'uint256' }, { name: 'claimedAmount', type: 'uint256' },
    { name: 'claimable', type: 'uint256' }, { name: 'hasClaimedRefund', type: 'bool' }
  ], stateMutability: 'view', type: 'function' },
  { inputs: [{ name: '_user', type: 'address' }], name: 'estimateAllocation', outputs: [
    { name: 'estimatedTokens', type: 'uint256' }, { name: 'estimatedRefundETH', type: 'uint256' }
  ], stateMutability: 'view', type: 'function' },
  { inputs: [{ name: '_amount', type: 'uint256' }], name: 'deposit', outputs: [], stateMutability: 'payable', type: 'function' },
  { inputs: [], name: 'depositETH', outputs: [], stateMutability: 'payable', type: 'function' },
  { inputs: [], name: 'claim', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [], name: 'claimRefund', outputs: [], stateMutability: 'nonpayable', type: 'function' },
] as const

// Dynamic ABI selector based on chain
export function getIDOPoolABI(chainId: number) {
  return chainId === CHAIN_IDS.MEGAETH ? IDO_POOL_ABI_MEGAETH : IDO_POOL_ABI_MONAD
}

// Legacy export for backward compatibility
export const IDO_POOL_ABI = IDO_POOL_ABI_MONAD

export const TIER_STAKING_ABI = [
  { inputs: [{ name: '_user', type: 'address' }], name: 'getUserTier', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ name: '_user', type: 'address' }], name: 'getStakedAmount', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ name: '_user', type: 'address' }], name: 'getUserWeight', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ name: '_user', type: 'address' }], name: 'hasGuaranteedAllocation', outputs: [{ type: 'bool' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ name: '_user', type: 'address' }], name: 'getUserInfo', outputs: [
    { name: 'stakedAmount', type: 'uint256' }, { name: 'tier', type: 'uint256' },
    { name: 'weight', type: 'uint256' }, { name: 'guaranteed', type: 'bool' },
    { name: 'stakingTime', type: 'uint256' }, { name: 'pendingRewards', type: 'uint256' },
    { name: 'unlockTime', type: 'uint256' }
  ], stateMutability: 'view', type: 'function' },
  { inputs: [{ name: '_user', type: 'address' }], name: 'getAmountToNextTier', outputs: [
    { name: 'amountNeeded', type: 'uint256' }, { name: 'nextTier', type: 'uint256' }
  ], stateMutability: 'view', type: 'function' },
  { inputs: [{ name: '_tier', type: 'uint256' }], name: 'getTierInfo', outputs: [
    { name: 'minStake', type: 'uint256' }, { name: 'weight', type: 'uint256' }, { name: 'guaranteed', type: 'bool' }
  ], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'totalStaked', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'totalStakers', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ name: '_amount', type: 'uint256' }], name: 'stake', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ name: '_amount', type: 'uint256' }], name: 'unstake', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [], name: 'claimRewards', outputs: [], stateMutability: 'nonpayable', type: 'function' },
] as const

// Types
export interface IDOInfo {
  poolAddress: Address
  saleToken: Address
  creator: Address
  name: string
  hardCap: string
  softCap: string
  startTime: number
  endTime: number
  poolType: number // 0 = PUBLIC, 1 = PRIVATE
  createdAt: number
  isActive: boolean
}

export interface PoolDetails {
  name: string
  poolType: number
  status: number // 0=PENDING, 1=ACTIVE, 2=FINALIZED, 3=CANCELLED
  hardCap: string
  softCap: string
  totalCommitted: string
  totalParticipants: number
  startTime: number
  endTime: number
  tokensForSale: string
  tokenPrice: string
  overflowPercent: number
}

export interface UserTierInfo {
  stakedAmount: string
  tier: number
  weight: number
  guaranteed: boolean
  stakingTime: number
  pendingRewards: string
  unlockTime: number
  amountToNextTier: string
  nextTier: number
}

// Parse IDO data from contract
export function parseIDOInfo(raw: readonly unknown[]): IDOInfo {
  const d = raw as [Address, Address, Address, string, bigint, bigint, bigint, bigint, number, bigint, boolean]
  return {
    poolAddress: d[0], saleToken: d[1], creator: d[2], name: d[3],
    hardCap: formatUnits(d[4], 18), softCap: formatUnits(d[5], 18),
    startTime: Number(d[6]), endTime: Number(d[7]), poolType: d[8],
    createdAt: Number(d[9]), isActive: d[10]
  }
}

// Hook for IDO Factory
export function useIDOFactory() {
  const { address } = useAccount()
  const chainId = useChainId()
  const contracts = getContracts(chainId)
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  const [isProcessing, setIsProcessing] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [txHash, setTxHash] = useState<string | null>(null)

  const { data: creationFee } = useReadContract({
    address: contracts.IDO_FACTORY, abi: IDO_FACTORY_ABI,
    functionName: chainId === CHAIN_IDS.MEGAETH ? 'creationFeeETH' : 'creationFeeMON'
  })

  const { data: platformFee } = useReadContract({
    address: contracts.IDO_FACTORY, abi: IDO_FACTORY_ABI, functionName: 'platformFee'
  })

  const waitForTx = useCallback(async (hash: `0x${string}`): Promise<boolean> => {
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
  }, [publicClient])

  const createIDO = useCallback(async (params: {
    name: string, saleToken: string, hardCap: string, softCap: string,
    tokensForSale: string, startTime: number, endTime: number, isPrivate: boolean
  }) => {
    if (!walletClient || !address || !publicClient || !creationFee) {
      setStatusMessage('❌ Connect wallet'); return { success: false }
    }
    setIsProcessing(true); setStatusMessage('📝 Confirm in wallet...')
    try {
      const gasPrice = await publicClient.getGasPrice()
      const hash = await walletClient.writeContract({
        address: contracts.IDO_FACTORY, abi: IDO_FACTORY_ABI, functionName: 'createIDO',
        args: [
          params.name, params.saleToken as Address,
          '0x0000000000000000000000000000000000000000' as Address, // Native token (MON/ETH)
          parseUnits(params.hardCap, 18), parseUnits(params.softCap, 18),
          parseUnits(params.tokensForSale, 18),
          BigInt(params.startTime), BigInt(params.endTime),
          params.isPrivate ? 1 : 0
        ],
        value: creationFee, gas: 5_000_000n, gasPrice: (gasPrice * 130n) / 100n
      })
      setTxHash(hash); setStatusMessage('⏳ Confirming...')
      const ok = await waitForTx(hash)
      setStatusMessage(ok ? '✅ IDO Created!' : '❌ Failed'); setIsProcessing(false)
      return { success: ok, hash }
    } catch (e: unknown) {
      const err = e as Error & { shortMessage?: string }
      setStatusMessage(`❌ ${err?.shortMessage || err?.message || 'Failed'}`); setIsProcessing(false)
      return { success: false }
    }
  }, [walletClient, address, publicClient, creationFee, waitForTx, contracts.IDO_FACTORY])

  const reset = useCallback(() => { setStatusMessage(''); setTxHash(null); setIsProcessing(false) }, [])

  return {
    createIDO, reset, isProcessing, statusMessage, txHash,
    creationFee: creationFee ? formatUnits(creationFee, 18) : '1',
    platformFee: platformFee ? Number(platformFee) / 100 : 2.5
  }
}

// Hook for IDO Pool interactions
export function useIDOPool(poolAddress: Address | undefined) {
  const { address } = useAccount()
  const chainId = useChainId()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  const [isProcessing, setIsProcessing] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [txHash, setTxHash] = useState<string | null>(null)

  const waitForTx = useCallback(async (hash: `0x${string}`): Promise<boolean> => {
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
  }, [publicClient])

  const deposit = useCallback(async (amount: string) => {
    if (!walletClient || !address || !publicClient || !poolAddress) {
      setStatusMessage('❌ Connect wallet'); return { success: false }
    }
    setIsProcessing(true); setStatusMessage('📝 Confirm deposit...')
    try {
      const amountWei = parseUnits(amount, 18)
      const gasPrice = await publicClient.getGasPrice()
      // Use chain-specific deposit function: depositETH for MegaETH, depositMON for Monad
      const poolABI = getIDOPoolABI(chainId)
      const depositFn = chainId === CHAIN_IDS.MEGAETH ? 'depositETH' : 'depositMON'
      const hash = await walletClient.writeContract({
        address: poolAddress, abi: poolABI, functionName: depositFn,
        value: amountWei, gas: 300_000n, gasPrice: (gasPrice * 130n) / 100n
      })
      setTxHash(hash); setStatusMessage('⏳ Confirming...')
      const ok = await waitForTx(hash)
      setStatusMessage(ok ? '✅ Deposited!' : '❌ Failed'); setIsProcessing(false)
      return { success: ok, hash }
    } catch (e: unknown) {
      const err = e as Error & { shortMessage?: string }
      setStatusMessage(`❌ ${err?.shortMessage || err?.message || 'Failed'}`); setIsProcessing(false)
      return { success: false }
    }
  }, [walletClient, address, publicClient, poolAddress, waitForTx])

  const claim = useCallback(async () => {
    if (!walletClient || !publicClient || !poolAddress) {
      setStatusMessage('❌ Connect wallet'); return { success: false }
    }
    setIsProcessing(true); setStatusMessage('📝 Confirm claim...')
    try {
      const gasPrice = await publicClient.getGasPrice()
      const poolABI = getIDOPoolABI(chainId)
      const hash = await walletClient.writeContract({
        address: poolAddress, abi: poolABI, functionName: 'claim',
        gas: 200_000n, gasPrice: (gasPrice * 130n) / 100n
      })
      setTxHash(hash); setStatusMessage('⏳ Confirming...')
      const ok = await waitForTx(hash)
      setStatusMessage(ok ? '✅ Claimed!' : '❌ Failed'); setIsProcessing(false)
      return { success: ok, hash }
    } catch (e: unknown) {
      const err = e as Error & { shortMessage?: string }
      setStatusMessage(`❌ ${err?.shortMessage || err?.message || 'Failed'}`); setIsProcessing(false)
      return { success: false }
    }
  }, [walletClient, publicClient, poolAddress, waitForTx])

  const claimRefund = useCallback(async () => {
    if (!walletClient || !publicClient || !poolAddress) {
      setStatusMessage('❌ Connect wallet'); return { success: false }
    }
    setIsProcessing(true); setStatusMessage('📝 Confirm refund...')
    try {
      const gasPrice = await publicClient.getGasPrice()
      const poolABI = getIDOPoolABI(chainId)
      const hash = await walletClient.writeContract({
        address: poolAddress, abi: poolABI, functionName: 'claimRefund',
        gas: 200_000n, gasPrice: (gasPrice * 130n) / 100n
      })
      setTxHash(hash); setStatusMessage('⏳ Confirming...')
      const ok = await waitForTx(hash)
      setStatusMessage(ok ? '✅ Refunded!' : '❌ Failed'); setIsProcessing(false)
      return { success: ok, hash }
    } catch (e: unknown) {
      const err = e as Error & { shortMessage?: string }
      setStatusMessage(`❌ ${err?.shortMessage || err?.message || 'Failed'}`); setIsProcessing(false)
      return { success: false }
    }
  }, [walletClient, publicClient, poolAddress, waitForTx])

  const reset = useCallback(() => { setStatusMessage(''); setTxHash(null); setIsProcessing(false) }, [])

  return { deposit, claim, claimRefund, reset, isProcessing, statusMessage, txHash }
}

// Hook for Tier Staking
export function useTierStaking() {
  const { address } = useAccount()
  const chainId = useChainId()
  const contracts = getContracts(chainId)
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  const [isProcessing, setIsProcessing] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [txHash, setTxHash] = useState<string | null>(null)

  const { data: userTier } = useReadContract({
    address: contracts.TIER_STAKING, abi: TIER_STAKING_ABI, functionName: 'getUserTier',
    args: address ? [address] : undefined, query: { enabled: !!address }
  })

  const { data: totalStaked } = useReadContract({
    address: contracts.TIER_STAKING, abi: TIER_STAKING_ABI, functionName: 'totalStaked'
  })

  const waitForTx = useCallback(async (hash: `0x${string}`): Promise<boolean> => {
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
  }, [publicClient])

  const stake = useCallback(async (amount: string) => {
    if (!walletClient || !address || !publicClient) {
      setStatusMessage('❌ Connect wallet'); return { success: false }
    }
    setIsProcessing(true); setStatusMessage('📝 Confirm stake...')
    try {
      const amountWei = parseUnits(amount, 18)
      const gasPrice = await publicClient.getGasPrice()
      const hash = await walletClient.writeContract({
        address: contracts.TIER_STAKING, abi: TIER_STAKING_ABI, functionName: 'stake',
        args: [amountWei], gas: 300_000n, gasPrice: (gasPrice * 130n) / 100n
      })
      setTxHash(hash); setStatusMessage('⏳ Confirming...')
      const ok = await waitForTx(hash)
      setStatusMessage(ok ? '✅ Staked!' : '❌ Failed'); setIsProcessing(false)
      return { success: ok, hash }
    } catch (e: unknown) {
      const err = e as Error & { shortMessage?: string }
      setStatusMessage(`❌ ${err?.shortMessage || err?.message || 'Failed'}`); setIsProcessing(false)
      return { success: false }
    }
  }, [walletClient, address, publicClient, waitForTx, contracts.TIER_STAKING])

  const unstake = useCallback(async (amount: string) => {
    if (!walletClient || !address || !publicClient) {
      setStatusMessage('❌ Connect wallet'); return { success: false }
    }
    setIsProcessing(true); setStatusMessage('📝 Confirm unstake...')
    try {
      const amountWei = parseUnits(amount, 18)
      const gasPrice = await publicClient.getGasPrice()
      const hash = await walletClient.writeContract({
        address: contracts.TIER_STAKING, abi: TIER_STAKING_ABI, functionName: 'unstake',
        args: [amountWei], gas: 300_000n, gasPrice: (gasPrice * 130n) / 100n
      })
      setTxHash(hash); setStatusMessage('⏳ Confirming...')
      const ok = await waitForTx(hash)
      setStatusMessage(ok ? '✅ Unstaked!' : '❌ Failed'); setIsProcessing(false)
      return { success: ok, hash }
    } catch (e: unknown) {
      const err = e as Error & { shortMessage?: string }
      setStatusMessage(`❌ ${err?.shortMessage || err?.message || 'Failed'}`); setIsProcessing(false)
      return { success: false }
    }
  }, [walletClient, address, publicClient, waitForTx, contracts.TIER_STAKING])

  const reset = useCallback(() => { setStatusMessage(''); setTxHash(null); setIsProcessing(false) }, [])

  return {
    stake, unstake, reset, isProcessing, statusMessage, txHash,
    userTier: userTier !== undefined ? Number(userTier) : 0,
    totalStaked: totalStaked ? formatUnits(totalStaked, 18) : '0'
  }
}
