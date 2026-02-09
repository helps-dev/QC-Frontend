import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import { getContracts } from '../config/contracts'
import { MONAD_STAKING_ABI, ERC20_ABI } from '../config/abis'
import { getNativeSymbol } from '../config/chains'

export interface PoolInfo {
  poolId: number
  stakingToken: string
  totalStaked: bigint
  rewardPerSecond: bigint
  isNative: boolean
  isActive: boolean
}

export interface UserStakeInfo {
  amount: bigint
  lockEndTime: bigint
  timeUntilUnlock: bigint
  pendingReward: bigint
  canWithdraw: boolean
}

export function useMonadStaking(poolId: number = 0) {
  const { address } = useAccount()
  const chainId = useChainId()
  const contracts = getContracts(chainId)
  const nativeSymbol = getNativeSymbol(chainId)
  
  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  // Read pool info
  const { data: poolData, refetch: refetchPool } = useReadContract({
    address: contracts.NATIVE_STAKING,
    abi: MONAD_STAKING_ABI,
    functionName: 'poolInfo',
    args: [BigInt(poolId)],
  })

  // Read user info
  const { data: userInfoData, refetch: refetchUser } = useReadContract({
    address: contracts.NATIVE_STAKING,
    abi: MONAD_STAKING_ABI,
    functionName: 'getUserInfo',
    args: [BigInt(poolId), address!],
    query: { enabled: !!address }
  })

  // Read pending reward
  const { data: pendingRewardData, refetch: refetchReward } = useReadContract({
    address: contracts.NATIVE_STAKING,
    abi: MONAD_STAKING_ABI,
    functionName: 'pendingReward',
    args: [BigInt(poolId), address!],
    query: { enabled: !!address }
  })

  // Read can withdraw
  const { data: canWithdrawData } = useReadContract({
    address: contracts.NATIVE_STAKING,
    abi: MONAD_STAKING_ABI,
    functionName: 'canWithdraw',
    args: [BigInt(poolId), address!],
    query: { enabled: !!address }
  })

  // Read reward token balance in contract
  const { data: rewardBalance } = useReadContract({
    address: contracts.NATIVE_REWARD,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [contracts.NATIVE_STAKING],
  })

  // Parse pool info
  const poolInfo: PoolInfo | null = poolData ? {
    poolId,
    stakingToken: poolData[0],
    totalStaked: poolData[1],
    rewardPerSecond: poolData[2],
    isNative: poolData[5],
    isActive: poolData[6],
  } : null

  // Parse user info
  const userInfo: UserStakeInfo | null = userInfoData ? {
    amount: userInfoData[0],
    lockEndTime: userInfoData[1],
    timeUntilUnlock: userInfoData[2],
    pendingReward: pendingRewardData || 0n,
    canWithdraw: canWithdrawData || false,
  } : null

  // Deposit native token (MON or ETH)
  const depositNative = async (amount: string) => {
    if (!poolInfo?.isNative) throw new Error('Not a native pool')
    const value = parseEther(amount)
    writeContract({
      address: contracts.NATIVE_STAKING,
      abi: MONAD_STAKING_ABI,
      functionName: 'deposit',
      args: [BigInt(poolId), 0n],
      value,
    })
  }

  // Alias for backward compatibility
  const depositMON = depositNative

  // Deposit ERC20 token
  const depositToken = async (amount: string) => {
    if (poolInfo?.isNative) throw new Error('Use depositNative for native pool')
    const value = parseEther(amount)
    writeContract({
      address: contracts.NATIVE_STAKING,
      abi: MONAD_STAKING_ABI,
      functionName: 'deposit',
      args: [BigInt(poolId), value],
    })
  }

  // Withdraw
  const withdraw = async (amount: string) => {
    const value = parseEther(amount)
    writeContract({
      address: contracts.NATIVE_STAKING,
      abi: MONAD_STAKING_ABI,
      functionName: 'withdraw',
      args: [BigInt(poolId), value],
    })
  }

  // Harvest rewards
  const harvest = async () => {
    writeContract({
      address: contracts.NATIVE_STAKING,
      abi: MONAD_STAKING_ABI,
      functionName: 'harvest',
      args: [BigInt(poolId)],
    })
  }

  // Emergency withdraw (no rewards)
  const emergencyWithdraw = async () => {
    writeContract({
      address: contracts.NATIVE_STAKING,
      abi: MONAD_STAKING_ABI,
      functionName: 'emergencyWithdraw',
      args: [BigInt(poolId)],
    })
  }

  // Refetch all data
  const refetch = () => {
    refetchPool()
    refetchUser()
    refetchReward()
  }

  return {
    poolInfo,
    userInfo,
    rewardBalance,
    nativeSymbol,
    chainId,
    depositNative,
    depositMON, // backward compatibility
    depositToken,
    withdraw,
    harvest,
    emergencyWithdraw,
    refetch,
    isPending,
    isConfirming,
    isSuccess,
    hash,
  }
}

// Hook untuk mendapatkan semua pools
export function useMonadStakingPools() {
  const chainId = useChainId()
  const contracts = getContracts(chainId)
  
  const { data: poolLength } = useReadContract({
    address: contracts.NATIVE_STAKING,
    abi: MONAD_STAKING_ABI,
    functionName: 'poolLength',
  })

  return {
    poolCount: poolLength ? Number(poolLength) : 0,
  }
}

// Format time until unlock
export function formatTimeUntilUnlock(seconds: bigint): string {
  const secs = Number(seconds)
  if (secs <= 0) return 'Unlocked'
  
  const days = Math.floor(secs / 86400)
  const hours = Math.floor((secs % 86400) / 3600)
  const mins = Math.floor((secs % 3600) / 60)
  
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${mins}m`
  return `${mins}m`
}

// Calculate APR
export function calculateAPR(rewardPerSecond: bigint, totalStaked: bigint, rewardPrice: number = 1, stakePrice: number = 1): number {
  if (totalStaked === 0n) return 0
  
  const yearlyReward = Number(formatEther(rewardPerSecond)) * 31536000 // seconds in year
  const totalStakedNum = Number(formatEther(totalStaked))
  
  const apr = (yearlyReward * rewardPrice) / (totalStakedNum * stakePrice) * 100
  return apr
}
