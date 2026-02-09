import { useQuery } from '@tanstack/react-query'
import { useChainId } from 'wagmi'
import { getSubgraphUrl } from '../config/contracts'
import { CHAIN_IDS } from '../config/chains'

// Dynamic subgraph query based on chain
async function querySubgraph(url: string, query: string, variables?: Record<string, unknown>) {
  if (!url) {
    console.warn('⚠️ No subgraph URL configured for this chain')
    return null
  }
  
  console.log('🔄 Querying subgraph:', url)
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  })
  const result = await response.json()
  console.log('📥 RAW RESPONSE:', result)
  
  if (result.errors) {
    console.error('❌ Subgraph errors:', result.errors)
    throw new Error(result.errors[0].message)
  }
  return result.data
}

export function useFactoryStats() {
  const chainId = useChainId()
  const subgraphUrl = getSubgraphUrl(chainId)
  const isETHChain = chainId === CHAIN_IDS.MEGAETH
  
  // Use different field names based on chain
  const volumeField = isETHChain ? 'totalVolumeETH' : 'totalVolumeMON'
  const liquidityField = isETHChain ? 'totalLiquidityETH' : 'totalLiquidityMON'
  
  return useQuery({
    queryKey: ['factoryStats', chainId],
    queryFn: async () => {
      const data = await querySubgraph(subgraphUrl, `{
        factories(first: 1) {
          id
          pairCount
          ${volumeField}
          ${liquidityField}
          txCount
        }
      }`)
      console.log('📊 Factory data:', data?.factories?.[0])
      return data?.factories?.[0] || null
    },
    refetchInterval: 30000,
    retry: 2,
    enabled: !!subgraphUrl,
  })
}

export function usePairs() {
  const chainId = useChainId()
  const subgraphUrl = getSubgraphUrl(chainId)
  
  return useQuery({
    queryKey: ['pairs', chainId],
    queryFn: async () => {
      const data = await querySubgraph(subgraphUrl, `{
        pairs(first: 50, orderBy: txCount, orderDirection: desc) {
          id
          token0 { id symbol name }
          token1 { id symbol name }
          reserve0
          reserve1
          volumeToken0
          volumeToken1
          txCount
          totalSupply
          liquidityProviderCount
          token0Price
          token1Price
        }
      }`)
      console.log('📊 Pairs count:', data?.pairs?.length || 0)
      return data?.pairs || []
    },
    refetchInterval: 15000,
    retry: 2,
    enabled: !!subgraphUrl,
  })
}

export function useRecentSwaps() {
  const chainId = useChainId()
  const subgraphUrl = getSubgraphUrl(chainId)
  
  return useQuery({
    queryKey: ['recentSwaps', chainId],
    queryFn: async () => {
      const data = await querySubgraph(subgraphUrl, `{
        swaps(first: 20, orderBy: timestamp, orderDirection: desc) {
          id
          timestamp
          amount0In
          amount1In
          amount0Out
          amount1Out
          pair { token0 { symbol } token1 { symbol } }
        }
      }`)
      console.log('📊 Swaps count:', data?.swaps?.length || 0)
      return data?.swaps || []
    },
    refetchInterval: 10000,
    retry: 2,
    enabled: !!subgraphUrl,
  })
}

export function useUserPositions(userAddress: string | undefined) {
  const chainId = useChainId()
  const subgraphUrl = getSubgraphUrl(chainId)
  
  return useQuery({
    queryKey: ['userPositions', userAddress, chainId],
    queryFn: async () => {
      if (!userAddress) return []
      const data = await querySubgraph(subgraphUrl, `{
        liquidityPositions(where: { user: "${userAddress.toLowerCase()}", liquidityTokenBalance_gt: "0" }) {
          id
          liquidityTokenBalance
          pair {
            id
            token0 { id symbol name }
            token1 { id symbol name }
            reserve0
            reserve1
            totalSupply
          }
        }
      }`)
      console.log('📊 User positions:', data?.liquidityPositions?.length || 0)
      return data?.liquidityPositions || []
    },
    enabled: !!userAddress && !!subgraphUrl,
    refetchInterval: 30000,
    retry: 2,
  })
}
