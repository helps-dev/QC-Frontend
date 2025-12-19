import { useQuery } from '@tanstack/react-query'
import { SUBGRAPH_URL } from '../config/contracts'

async function querySubgraph(query: string, variables?: Record<string, unknown>) {
  const response = await fetch(SUBGRAPH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  })
  const { data, errors } = await response.json()
  if (errors) throw new Error(errors[0].message)
  return data
}

export function useFactoryStats() {
  return useQuery({
    queryKey: ['factoryStats'],
    queryFn: async () => {
      const data = await querySubgraph(`{
        factories(first: 1) {
          id
          pairCount
          totalVolumeUSD
          totalLiquidityUSD
          txCount
        }
      }`)
      return data.factories[0]
    },
    refetchInterval: 30000,
  })
}

export function usePairs() {
  return useQuery({
    queryKey: ['pairs'],
    queryFn: async () => {
      const data = await querySubgraph(`{
        pairs(first: 50, orderBy: txCount, orderDirection: desc) {
          id
          token0 { id symbol name }
          token1 { id symbol name }
          reserve0
          reserve1
          volumeToken0
          volumeToken1
          txCount
          token0Price
          token1Price
        }
      }`)
      return data.pairs
    },
    refetchInterval: 15000,
  })
}

export function useRecentSwaps() {
  return useQuery({
    queryKey: ['recentSwaps'],
    queryFn: async () => {
      const data = await querySubgraph(`{
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
      return data.swaps
    },
    refetchInterval: 10000,
  })
}
