import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import { getContracts, getStakingTokenName } from '../config/contracts'
import { ERC20_ABI } from '../config/abis'

// GmonicStaking ABI
const GMONIC_STAKING_ABI = [
  // View functions
  {
    inputs: [],
    name: 'poolLength',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: '', type: 'uint256' }],
    name: 'poolInfo',
    outputs: [
      { name: 'stakingToken', type: 'address' },
      { name: 'totalStaked', type: 'uint256' },
      { name: 'rewardPerSecond', type: 'uint256' },
      { name: 'accRewardPerShare', type: 'uint256' },
      { name: 'lastRewardTime', type: 'uint256' },
      { name: 'isActive', type: 'bool' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: '_poolId', type: 'uint256' }, { name: '_user', type: 'address' }],
    name: 'pendingReward',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: '_poolId', type: 'uint256' }, { name: '_user', type: 'address' }],
    name: 'getUserInfo',
    outputs: [
      { name: 'amount', type: 'uint256' },
      { name: 'lockEndTime', type: 'uint256' },
      { name: 'timeUntilUnlock', type: 'uint256' },
      { name: 'canWithdrawNow', type: 'bool' },
      { name: 'canHarvestNow', type: 'bool' },
      { name: 'lastHarvestTime', type: 'uint256' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: '_poolId', type: 'uint256' }, { name: '_user', type: 'address' }],
    name: 'canWithdraw',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function'
  },
  // Write functions
  {
    inputs: [{ name: '_poolId', type: 'uint256' }, { name: '_amount', type: 'uint256' }],
    name: 'deposit',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: '_poolId', type: 'uint256' }, { name: '_amount', type: 'uint256' }],
    name: 'withdraw',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: '_poolId', type: 'uint256' }],
    name: 'harvest',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: '_poolId', type: 'uint256' }],
    name: 'emergencyWithdraw',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
] as const

export interface GmonicPoolInfo {
  stakingToken: string
  totalStaked: bigint
  rewardPerSecond: bigint
  isActive: boolean
}

export interface GmonicUserInfo {
  amount: bigint
  lockEndTime: bigint
  timeUntilUnlock: bigint
  canWithdraw: boolean
  canHarvest: boolean
  lastHarvestTime: bigint
  pendingReward: bigint
}

export function useGmonicStaking(poolId: number = 0) {
  const { address } = useAccount()
  const chainId = useChainId()
  const contracts = getContracts(chainId)
  const tokenInfo = getStakingTokenName(chainId)
  
  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  // Read pool info
  const { data: poolData, refetch: refetchPool } = useReadContract({
    address: contracts.TOKEN_STAKING,
    abi: GMONIC_STAKING_ABI,
    functionName: 'poolInfo',
    args: [BigInt(poolId)],
  })

  // Read user info
  const { data: userInfoData, refetch: refetchUser } = useReadContract({
    address: contracts.TOKEN_STAKING,
    abi: GMONIC_STAKING_ABI,
    functionName: 'getUserInfo',
    args: [BigInt(poolId), address!],
    query: { enabled: !!address }
  })

  // Read pending reward
  const { data: pendingRewardData, refetch: refetchReward } = useReadContract({
    address: contracts.TOKEN_STAKING,
    abi: GMONIC_STAKING_ABI,
    functionName: 'pendingReward',
    args: [BigInt(poolId), address!],
    query: { enabled: !!address }
  })

  // Read user's staking token balance
  const { data: stakingTokenBalance, refetch: refetchBalance } = useReadContract({
    address: contracts.TOKEN_STAKE,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address!],
    query: { enabled: !!address }
  })

  // Read allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: contracts.TOKEN_STAKE,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [address!, contracts.TOKEN_STAKING],
    query: { enabled: !!address }
  })

  // Parse pool info
  const poolInfo: GmonicPoolInfo | null = poolData ? {
    stakingToken: poolData[0],
    totalStaked: poolData[1],
    rewardPerSecond: poolData[2],
    isActive: poolData[5],
  } : null

  // Parse user info
  const userInfo: GmonicUserInfo | null = userInfoData ? {
    amount: userInfoData[0],
    lockEndTime: userInfoData[1],
    timeUntilUnlock: userInfoData[2],
    canWithdraw: userInfoData[3],
    canHarvest: userInfoData[4],
    lastHarvestTime: userInfoData[5],
    pendingReward: pendingRewardData || 0n,
  } : null

  // Approve staking token
  const approve = async (amount: string) => {
    const value = parseEther(amount)
    writeContract({
      address: contracts.TOKEN_STAKE,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [contracts.TOKEN_STAKING, value],
    })
  }

  // Deposit staking token
  const deposit = async (amount: string) => {
    const value = parseEther(amount)
    writeContract({
      address: contracts.TOKEN_STAKING,
      abi: GMONIC_STAKING_ABI,
      functionName: 'deposit',
      args: [BigInt(poolId), value],
    })
  }

  // Withdraw
  const withdraw = async (amount: string) => {
    const value = parseEther(amount)
    writeContract({
      address: contracts.TOKEN_STAKING,
      abi: GMONIC_STAKING_ABI,
      functionName: 'withdraw',
      args: [BigInt(poolId), value],
    })
  }

  // Harvest rewards
  const harvest = async () => {
    writeContract({
      address: contracts.TOKEN_STAKING,
      abi: GMONIC_STAKING_ABI,
      functionName: 'harvest',
      args: [BigInt(poolId)],
    })
  }

  // Emergency withdraw (no rewards)
  const emergencyWithdraw = async () => {
    writeContract({
      address: contracts.TOKEN_STAKING,
      abi: GMONIC_STAKING_ABI,
      functionName: 'emergencyWithdraw',
      args: [BigInt(poolId)],
    })
  }

  // Refetch all data
  const refetch = () => {
    refetchPool()
    refetchUser()
    refetchReward()
    refetchBalance()
    refetchAllowance()
  }

  // Check if needs approval
  const needsApproval = (amount: string): boolean => {
    if (!allowance) return true
    try {
      const value = parseEther(amount)
      return allowance < value
    } catch {
      return true
    }
  }

  return {
    poolInfo,
    userInfo,
    stakingTokenBalance,
    gmonicBalance: stakingTokenBalance, // backward compatibility
    allowance,
    tokenInfo,
    chainId,
    approve,
    deposit,
    withdraw,
    harvest,
    emergencyWithdraw,
    needsApproval,
    refetch,
    isPending,
    isConfirming,
    isSuccess,
    hash,
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

// Calculate APR (reward per second * seconds per year / total staked)
export function calculateGmonicAPR(rewardPerSecond: bigint, totalStaked: bigint): number {
  const secondsPerYear = 31536000n // 365 days
  const yearlyReward = rewardPerSecond * secondsPerYear
  
  // If no stakes yet, calculate APR assuming 1 token staked
  const effectiveStaked = totalStaked === 0n ? parseEther('1') : totalStaked
  
  const apr = (Number(formatEther(yearlyReward)) / Number(formatEther(effectiveStaked))) * 100
  return apr
}
