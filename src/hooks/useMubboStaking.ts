import { useState, useEffect, useCallback } from 'react'
import { useAccount, usePublicClient, useWalletClient } from 'wagmi'
import { formatEther, parseEther } from 'viem'

// MubboStaking ABI
const MUBBO_STAKING_ABI = [
  // View functions
  {
    name: 'poolInfo',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '_poolId', type: 'uint256' }],
    outputs: [
      { name: 'stakingToken', type: 'address' },
      { name: 'totalStaked', type: 'uint256' },
      { name: 'rewardPerSecond', type: 'uint256' },
      { name: 'accRewardPerShare', type: 'uint256' },
      { name: 'lastRewardTime', type: 'uint256' },
      { name: 'isActive', type: 'bool' }
    ]
  },
  {
    name: 'userInfo',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: '_poolId', type: 'uint256' },
      { name: '_user', type: 'address' }
    ],
    outputs: [
      { name: 'amount', type: 'uint256' },
      { name: 'rewardDebt', type: 'uint256' },
      { name: 'lockEndTime', type: 'uint256' },
      { name: 'lastHarvestTime', type: 'uint256' }
    ]
  },
  {
    name: 'getUserInfo',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: '_poolId', type: 'uint256' },
      { name: '_user', type: 'address' }
    ],
    outputs: [
      { name: 'amount', type: 'uint256' },
      { name: 'lockEndTime', type: 'uint256' },
      { name: 'timeUntilUnlock', type: 'uint256' },
      { name: 'canWithdrawNow', type: 'bool' },
      { name: 'canHarvestNow', type: 'bool' },
      { name: 'lastHarvestTime', type: 'uint256' }
    ]
  },
  {
    name: 'pendingReward',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: '_poolId', type: 'uint256' },
      { name: '_user', type: 'address' }
    ],
    outputs: [{ type: 'uint256' }]
  },
  {
    name: 'poolLength',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }]
  },
  {
    name: 'owner',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'address' }]
  },
  {
    name: 'canWithdraw',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: '_poolId', type: 'uint256' },
      { name: '_user', type: 'address' }
    ],
    outputs: [{ type: 'bool' }]
  },
  // Write functions
  {
    name: 'deposit',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: '_poolId', type: 'uint256' },
      { name: '_amount', type: 'uint256' }
    ],
    outputs: []
  },
  {
    name: 'withdraw',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: '_poolId', type: 'uint256' },
      { name: '_amount', type: 'uint256' }
    ],
    outputs: []
  },
  {
    name: 'harvest',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: '_poolId', type: 'uint256' }],
    outputs: []
  },
  {
    name: 'emergencyWithdraw',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: '_poolId', type: 'uint256' }],
    outputs: []
  },
  {
    name: 'emergencyWithdrawAll',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: '_poolId', type: 'uint256' }],
    outputs: []
  }
] as const

// Contract addresses
const MUBBO_STAKING_ADDRESS = '0xAE78899Fe8fD6ACf14049d7883FB5FC91C39E057'
const MUBBO_TOKEN = '0xe046D0E8C1c8D31F616e03DbD76637B9C2187777'
const GMONIC_REWARD = '0x8002f04f9BDAE352eA3155B8Da985319c225dc75'
const POOL_ID = 0n

// ERC20 ABI for approval
const ERC20_ABI = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ type: 'bool' }]
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' }
    ],
    outputs: [{ type: 'uint256' }]
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }]
  }
] as const

export interface MubboPoolInfo {
  stakingToken: string
  totalStaked: bigint
  rewardPerSecond: bigint
  isActive: boolean
}

export interface MubboUserInfo {
  amount: bigint
  lockEndTime: bigint
  timeUntilUnlock: bigint
  canWithdrawNow: boolean
  canHarvestNow: boolean
  lastHarvestTime: bigint
}

export function useMubboStaking() {
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()

  const [poolInfo, setPoolInfo] = useState<MubboPoolInfo | null>(null)
  const [userInfo, setUserInfo] = useState<MubboUserInfo | null>(null)
  const [pendingReward, setPendingReward] = useState<bigint>(0n)
  const [mubboBalance, setMubboBalance] = useState<bigint>(0n)
  const [allowance, setAllowance] = useState<bigint>(0n)
  const [rewardBalance, setRewardBalance] = useState<bigint>(0n)
  const [isLoading, setIsLoading] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  // Fetch all data
  const fetchData = useCallback(async () => {
    if (!publicClient) return

    try {
      // Get pool info
      const poolData = await publicClient.readContract({
        address: MUBBO_STAKING_ADDRESS,
        abi: MUBBO_STAKING_ABI,
        functionName: 'poolInfo',
        args: [POOL_ID]
      }) as [string, bigint, bigint, bigint, bigint, boolean]

      setPoolInfo({
        stakingToken: poolData[0],
        totalStaked: poolData[1],
        rewardPerSecond: poolData[2],
        isActive: poolData[5]
      })

      // Get reward balance in contract
      const rewardBal = await publicClient.readContract({
        address: GMONIC_REWARD,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [MUBBO_STAKING_ADDRESS]
      }) as bigint
      setRewardBalance(rewardBal)

      // Check if admin
      if (address) {
        const owner = await publicClient.readContract({
          address: MUBBO_STAKING_ADDRESS,
          abi: MUBBO_STAKING_ABI,
          functionName: 'owner'
        }) as string
        setIsAdmin(owner.toLowerCase() === address.toLowerCase())
      }

      // User specific data
      if (address) {
        // Get user info
        const userData = await publicClient.readContract({
          address: MUBBO_STAKING_ADDRESS,
          abi: MUBBO_STAKING_ABI,
          functionName: 'getUserInfo',
          args: [POOL_ID, address]
        }) as [bigint, bigint, bigint, boolean, boolean, bigint]

        setUserInfo({
          amount: userData[0],
          lockEndTime: userData[1],
          timeUntilUnlock: userData[2],
          canWithdrawNow: userData[3],
          canHarvestNow: userData[4],
          lastHarvestTime: userData[5]
        })

        // Get pending reward
        const pending = await publicClient.readContract({
          address: MUBBO_STAKING_ADDRESS,
          abi: MUBBO_STAKING_ABI,
          functionName: 'pendingReward',
          args: [POOL_ID, address]
        }) as bigint
        setPendingReward(pending)

        // Get MUBBO balance
        const balance = await publicClient.readContract({
          address: MUBBO_TOKEN,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [address]
        }) as bigint
        setMubboBalance(balance)

        // Get allowance
        const allow = await publicClient.readContract({
          address: MUBBO_TOKEN,
          abi: ERC20_ABI,
          functionName: 'allowance',
          args: [address, MUBBO_STAKING_ADDRESS]
        }) as bigint
        setAllowance(allow)
      }
    } catch (error) {
      console.error('Error fetching mubbo staking data:', error)
    }
  }, [publicClient, address])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 10000) // Refresh every 10s
    return () => clearInterval(interval)
  }, [fetchData])

  // Approve MUBBO
  const approve = async (amount: string) => {
    if (!walletClient || !address) throw new Error('Wallet not connected')
    setIsLoading(true)
    try {
      const hash = await walletClient.writeContract({
        address: MUBBO_TOKEN,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [MUBBO_STAKING_ADDRESS, parseEther(amount)]
      })
      await publicClient?.waitForTransactionReceipt({ hash })
      await fetchData()
      return hash
    } finally {
      setIsLoading(false)
    }
  }

  // Deposit MUBBO
  const deposit = async (amount: string) => {
    if (!walletClient || !address) throw new Error('Wallet not connected')
    setIsLoading(true)
    try {
      const hash = await walletClient.writeContract({
        address: MUBBO_STAKING_ADDRESS,
        abi: MUBBO_STAKING_ABI,
        functionName: 'deposit',
        args: [POOL_ID, parseEther(amount)]
      })
      await publicClient?.waitForTransactionReceipt({ hash })
      await fetchData()
      return hash
    } finally {
      setIsLoading(false)
    }
  }

  // Withdraw MUBBO
  const withdraw = async (amount: string) => {
    if (!walletClient || !address) throw new Error('Wallet not connected')
    setIsLoading(true)
    try {
      const hash = await walletClient.writeContract({
        address: MUBBO_STAKING_ADDRESS,
        abi: MUBBO_STAKING_ABI,
        functionName: 'withdraw',
        args: [POOL_ID, parseEther(amount)]
      })
      await publicClient?.waitForTransactionReceipt({ hash })
      await fetchData()
      return hash
    } finally {
      setIsLoading(false)
    }
  }

  // Harvest reward
  const harvest = async () => {
    if (!walletClient || !address) throw new Error('Wallet not connected')
    setIsLoading(true)
    try {
      const hash = await walletClient.writeContract({
        address: MUBBO_STAKING_ADDRESS,
        abi: MUBBO_STAKING_ABI,
        functionName: 'harvest',
        args: [POOL_ID]
      })
      await publicClient?.waitForTransactionReceipt({ hash })
      await fetchData()
      return hash
    } finally {
      setIsLoading(false)
    }
  }

  // Emergency withdraw (bypass lock, lose rewards)
  const emergencyWithdraw = async () => {
    if (!walletClient || !address) throw new Error('Wallet not connected')
    setIsLoading(true)
    try {
      const hash = await walletClient.writeContract({
        address: MUBBO_STAKING_ADDRESS,
        abi: MUBBO_STAKING_ABI,
        functionName: 'emergencyWithdraw',
        args: [POOL_ID]
      })
      await publicClient?.waitForTransactionReceipt({ hash })
      await fetchData()
      return hash
    } finally {
      setIsLoading(false)
    }
  }

  // Admin: Emergency withdraw all
  const adminEmergencyWithdrawAll = async () => {
    if (!walletClient || !address || !isAdmin) throw new Error('Not admin')
    setIsLoading(true)
    try {
      const hash = await walletClient.writeContract({
        address: MUBBO_STAKING_ADDRESS,
        abi: MUBBO_STAKING_ABI,
        functionName: 'emergencyWithdrawAll',
        args: [POOL_ID]
      })
      await publicClient?.waitForTransactionReceipt({ hash })
      await fetchData()
      return hash
    } finally {
      setIsLoading(false)
    }
  }

  // Calculate APR
  const calculateAPR = (): number => {
    if (!poolInfo || poolInfo.totalStaked === 0n) return 0
    const yearlyReward = Number(formatEther(poolInfo.rewardPerSecond)) * 31536000
    const totalStakedNum = Number(formatEther(poolInfo.totalStaked))
    return (yearlyReward / totalStakedNum) * 100
  }

  return {
    // State
    poolInfo,
    userInfo,
    pendingReward,
    mubboBalance,
    allowance,
    rewardBalance,
    isLoading,
    isConnected,
    isAdmin,
    apr: calculateAPR(),
    
    // Actions
    approve,
    deposit,
    withdraw,
    harvest,
    emergencyWithdraw,
    adminEmergencyWithdrawAll,
    refetch: fetchData,
    
    // Constants
    MUBBO_STAKING_ADDRESS,
    MUBBO_TOKEN,
    GMONIC_REWARD,
    POOL_ID
  }
}
