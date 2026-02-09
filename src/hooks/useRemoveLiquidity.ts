import { useAccount, useWriteContract, useWaitForTransactionReceipt, usePublicClient, useChainId } from 'wagmi'
import { getContracts } from '../config/contracts'
import { ROUTER_ABI } from '../config/abis'

interface UseRemoveLiquidityResult {
  removeLiquidity: (
    lpAmount: bigint,
    token0Address: `0x${string}`,
    token1Address: `0x${string}`,
    minAmount0: bigint,
    minAmount1: bigint,
    hasWrappedNative: boolean
  ) => Promise<void>
  isLoading: boolean
  isSuccess: boolean
  error: Error | null
  hash: `0x${string}` | undefined
  reset: () => void
}

/**
 * Hook to remove liquidity - handles both standard and ETH/native pairs
 * Automatically uses removeLiquidityETH when one token is wrapped native
 */
export function useRemoveLiquidity(slippage: number = 10): UseRemoveLiquidityResult {
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const chainId = useChainId()
  const contracts = getContracts(chainId)

  const {
    writeContract,
    data: hash,
    isPending,
    error: writeError,
    reset,
  } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const removeLiquidity = async (
    lpAmount: bigint,
    token0Address: `0x${string}`,
    token1Address: `0x${string}`,
    minAmount0: bigint,
    minAmount1: bigint,
    hasWrappedNative: boolean
  ) => {
    if (!address || !publicClient) {
      throw new Error('Wallet not connected')
    }

    if (lpAmount <= 0n) {
      throw new Error('Invalid LP amount')
    }

    const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200) // 20 minutes
    const slippageMultiplier = BigInt(100 - slippage)
    const minOut0 = (minAmount0 * slippageMultiplier) / 100n
    const minOut1 = (minAmount1 * slippageMultiplier) / 100n

    if (hasWrappedNative) {
      // Use removeLiquidityETH to get native token back
      const isToken0Wrapped = token0Address.toLowerCase() === contracts.WETH.toLowerCase()
      const tokenAddress = isToken0Wrapped ? token1Address : token0Address
      const minTokenAmount = isToken0Wrapped ? minOut1 : minOut0
      const minETHAmount = isToken0Wrapped ? minOut0 : minOut1

      try {
        const gasEstimate = await publicClient.estimateContractGas({
          address: contracts.ROUTER,
          abi: ROUTER_ABI,
          functionName: 'removeLiquidityETH',
          args: [tokenAddress, lpAmount, minTokenAmount, minETHAmount, address, deadline],
          account: address,
        })

        writeContract({
          address: contracts.ROUTER,
          abi: ROUTER_ABI,
          functionName: 'removeLiquidityETH',
          args: [tokenAddress, lpAmount, minTokenAmount, minETHAmount, address, deadline],
          gas: (gasEstimate * 120n) / 100n,
        })
      } catch (err) {
        writeContract({
          address: contracts.ROUTER,
          abi: ROUTER_ABI,
          functionName: 'removeLiquidityETH',
          args: [tokenAddress, lpAmount, minTokenAmount, minETHAmount, address, deadline],
        })
      }
    } else {
      // Standard removeLiquidity for ERC20 pairs
      try {
        const gasEstimate = await publicClient.estimateContractGas({
          address: contracts.ROUTER,
          abi: ROUTER_ABI,
          functionName: 'removeLiquidity',
          args: [token0Address, token1Address, lpAmount, minOut0, minOut1, address, deadline],
          account: address,
        })

        writeContract({
          address: contracts.ROUTER,
          abi: ROUTER_ABI,
          functionName: 'removeLiquidity',
          args: [token0Address, token1Address, lpAmount, minOut0, minOut1, address, deadline],
          gas: (gasEstimate * 120n) / 100n,
        })
      } catch (err) {
        writeContract({
          address: contracts.ROUTER,
          abi: ROUTER_ABI,
          functionName: 'removeLiquidity',
          args: [token0Address, token1Address, lpAmount, minOut0, minOut1, address, deadline],
        })
      }
    }
  }

  return {
    removeLiquidity,
    isLoading: isPending || isConfirming,
    isSuccess,
    error: writeError,
    hash,
    reset,
  }
}
