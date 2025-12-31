import { useState, useEffect, useCallback } from 'react'

// DexScreener API Types
export interface DexScreenerPair {
  chainId: string
  dexId: string
  url: string
  pairAddress: string
  baseToken: {
    address: string
    name: string
    symbol: string
  }
  quoteToken: {
    address: string
    name: string
    symbol: string
  }
  priceNative: string
  priceUsd: string
  txns: {
    m5: { buys: number; sells: number }
    h1: { buys: number; sells: number }
    h6: { buys: number; sells: number }
    h24: { buys: number; sells: number }
  }
  volume: {
    h24: number
    h6: number
    h1: number
    m5: number
  }
  priceChange: {
    m5: number
    h1: number
    h6: number
    h24: number
  }
  liquidity: {
    usd: number
    base: number
    quote: number
  }
  fdv: number
  pairCreatedAt: number
}

export interface DexScreenerResponse {
  schemaVersion: string
  pairs: DexScreenerPair[] | null
}

// Monad chain ID for DexScreener
const DEXSCREENER_CHAIN = 'monad'

// Hook to fetch token pairs from DexScreener
export function useDexScreener(tokenAddress?: string) {
  const [pairs, setPairs] = useState<DexScreenerPair[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPairs = useCallback(async (address: string) => {
    if (!address || address === '0x0000000000000000000000000000000000000000') {
      setPairs([])
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // DexScreener API endpoint for token
      const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${address}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch from DexScreener')
      }

      const data: DexScreenerResponse = await response.json()
      
      // Filter pairs for Monad chain only
      const monadPairs = data.pairs?.filter(p => p.chainId === DEXSCREENER_CHAIN) || []
      setPairs(monadPairs)
    } catch (err) {
      console.error('DexScreener fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
      setPairs([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (tokenAddress) {
      fetchPairs(tokenAddress)
    }
  }, [tokenAddress, fetchPairs])

  return { pairs, isLoading, error, refetch: () => tokenAddress && fetchPairs(tokenAddress) }
}

// Hook to fetch pair by address
export function useDexScreenerPair(pairAddress?: string) {
  const [pair, setPair] = useState<DexScreenerPair | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPair = useCallback(async (address: string) => {
    if (!address) {
      setPair(null)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`https://api.dexscreener.com/latest/dex/pairs/${DEXSCREENER_CHAIN}/${address}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch pair from DexScreener')
      }

      const data: DexScreenerResponse = await response.json()
      setPair(data.pairs?.[0] || null)
    } catch (err) {
      console.error('DexScreener pair fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch pair')
      setPair(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (pairAddress) {
      fetchPair(pairAddress)
    }
  }, [pairAddress, fetchPair])

  return { pair, isLoading, error, refetch: () => pairAddress && fetchPair(pairAddress) }
}

// Hook to search tokens on DexScreener
export function useDexScreenerSearch() {
  const [results, setResults] = useState<DexScreenerPair[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const search = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setResults([])
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(query)}`)
      
      if (!response.ok) {
        throw new Error('Search failed')
      }

      const data: DexScreenerResponse = await response.json()
      // Filter for Monad chain
      const monadResults = data.pairs?.filter(p => p.chainId === DEXSCREENER_CHAIN) || []
      setResults(monadResults.slice(0, 20)) // Limit to 20 results
    } catch (err) {
      console.error('DexScreener search error:', err)
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { results, isLoading, search }
}

// Get DexScreener chart embed URL
export function getDexScreenerChartUrl(pairAddress: string, theme: 'dark' | 'light' = 'dark'): string {
  return `https://dexscreener.com/${DEXSCREENER_CHAIN}/${pairAddress}?embed=1&theme=${theme}&trades=0&info=0`
}

// Get DexScreener pair page URL
export function getDexScreenerPairUrl(pairAddress: string): string {
  return `https://dexscreener.com/${DEXSCREENER_CHAIN}/${pairAddress}`
}
