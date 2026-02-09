import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ExternalLink, RefreshCw } from '../../components/Icons3D'
import { useChainId } from 'wagmi'
import { type DexScreenerPair } from '../../hooks/useDexScreener'
import { SwapCardWithChartToggle } from './SwapCardWithChartToggle'
import { type Token, NATIVE_ADDRESS } from '../../config/tokens'
import { getContracts, MEGAETH_CONTRACTS } from '../../config/contracts'
import { CHAIN_IDS } from '../../config/chains'

// localStorage key
const CHART_VISIBLE_KEY = 'monic_chart_visible'

// Default pair addresses per chain
const DEFAULT_PAIRS: Record<number, string> = {
  [CHAIN_IDS.MONAD]: '0xcf4dc3db3223ee91ff52da4e110ba8abfb943843', // WMON/QUICK
  [CHAIN_IDS.MEGAETH]: MEGAETH_CONTRACTS.WETH_TOKEN_PAIR, // WETH/MEXA
}

// DexScreener chain IDs
const DEXSCREENER_CHAINS: Record<number, string> = {
  [CHAIN_IDS.MONAD]: 'monad',
  [CHAIN_IDS.MEGAETH]: 'megaeth', // May need to update when MegaETH is listed
}

// Custom hook for media query
function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)
  
  useEffect(() => {
    const media = window.matchMedia(query)
    setMatches(media.matches)
    
    const listener = (e: MediaQueryListEvent) => setMatches(e.matches)
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [query])
  
  return matches
}

function formatPrice(price: string | number): string {
  const num = typeof price === 'string' ? parseFloat(price) : price
  if (num < 0.0001) return num.toExponential(4)
  if (num < 1) return num.toFixed(6)
  if (num < 100) return num.toFixed(4)
  return num.toFixed(2)
}

function PriceChange({ value }: { value: number }) {
  const isPositive = value >= 0
  return (
    <span className={`px-2 py-0.5 rounded text-xs sm:text-sm font-medium ${isPositive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
      {isPositive ? '+' : ''}{value.toFixed(2)}%
    </span>
  )
}

export function SwapWithChart() {
  const chainId = useChainId()
  const contracts = getContracts(chainId)
  const dexScreenerChain = DEXSCREENER_CHAINS[chainId] || 'monad'
  const defaultPairAddress = DEFAULT_PAIRS[chainId] || DEFAULT_PAIRS[CHAIN_IDS.MONAD]
  
  const isMobile = useMediaQuery('(max-width: 768px)')
  const isTablet = useMediaQuery('(max-width: 1024px)')
  
  // Chart visibility state with localStorage persistence
  const [isChartVisible, setIsChartVisible] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    const saved = localStorage.getItem(CHART_VISIBLE_KEY)
    if (saved !== null) return JSON.parse(saved)
    return false
  })

  // Token pair from swap component
  const [swapTokenIn, setSwapTokenIn] = useState<Token | null>(null)
  const [swapTokenOut, setSwapTokenOut] = useState<Token | null>(null)
  const [pairAddress, setPairAddress] = useState<string>(defaultPairAddress)
  const [pairInfo, setPairInfo] = useState<DexScreenerPair | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [pairNotFound, setPairNotFound] = useState(false)
  
  // Use ref to track current search to avoid race conditions
  const searchRef = useRef<string>('')

  // Reset pair address when chain changes
  useEffect(() => {
    setPairAddress(DEFAULT_PAIRS[chainId] || DEFAULT_PAIRS[CHAIN_IDS.MONAD])
    setPairInfo(null)
    setPairNotFound(false)
  }, [chainId])

  // Persist chart visibility to localStorage
  useEffect(() => {
    localStorage.setItem(CHART_VISIBLE_KEY, JSON.stringify(isChartVisible))
  }, [isChartVisible])

  // Handle token change from swap component
  const handleTokenChange = useCallback((tokenIn: Token, tokenOut: Token) => {
    setSwapTokenIn(tokenIn)
    setSwapTokenOut(tokenOut)
  }, [])

  // Find pair address when tokens change - improved search logic
  useEffect(() => {
    const findPairAddress = async () => {
      if (!swapTokenIn || !swapTokenOut) {
        setPairAddress(defaultPairAddress)
        setPairNotFound(false)
        return
      }
      
      // Get actual token addresses (convert native to wrapped)
      const tokenInAddr = (swapTokenIn.address === NATIVE_ADDRESS || swapTokenIn.address === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE')
        ? contracts.WETH 
        : swapTokenIn.address
      const tokenOutAddr = (swapTokenOut.address === NATIVE_ADDRESS || swapTokenOut.address === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE')
        ? contracts.WETH 
        : swapTokenOut.address
      
      // Create unique search key
      const searchKey = `${tokenInAddr}-${tokenOutAddr}`
      searchRef.current = searchKey
      
      setIsSearching(true)
      setPairNotFound(false)
      
      try {
        let matchingPair: DexScreenerPair | null = null
        
        // Try searching by tokenIn address first
        const response1 = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${tokenInAddr}`)
        const data1 = await response1.json()
        
        if (searchRef.current !== searchKey) return
        
        // Filter for current chain and find matching pair
        const chainPairs1 = data1.pairs?.filter((p: DexScreenerPair) => p.chainId === dexScreenerChain) || []
        matchingPair = chainPairs1.find((pair: DexScreenerPair) => {
          const baseAddr = pair.baseToken.address.toLowerCase()
          const quoteAddr = pair.quoteToken.address.toLowerCase()
          const inAddr = tokenInAddr.toLowerCase()
          const outAddr = tokenOutAddr.toLowerCase()
          
          return (baseAddr === inAddr && quoteAddr === outAddr) ||
                 (baseAddr === outAddr && quoteAddr === inAddr)
        })
        
        // Strategy 2: If not found, try searching by tokenOut address
        if (!matchingPair) {
          const response2 = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${tokenOutAddr}`)
          const data2 = await response2.json()
          
          if (searchRef.current !== searchKey) return
          
          const chainPairs2 = data2.pairs?.filter((p: DexScreenerPair) => p.chainId === dexScreenerChain) || []
          matchingPair = chainPairs2.find((pair: DexScreenerPair) => {
            const baseAddr = pair.baseToken.address.toLowerCase()
            const quoteAddr = pair.quoteToken.address.toLowerCase()
            const inAddr = tokenInAddr.toLowerCase()
            const outAddr = tokenOutAddr.toLowerCase()
            
            return (baseAddr === inAddr && quoteAddr === outAddr) ||
                   (baseAddr === outAddr && quoteAddr === inAddr)
          })
        }
        
        // Strategy 3: Try symbol search as fallback
        if (!matchingPair) {
          const symbolQuery = `${swapTokenIn.symbol} ${swapTokenOut.symbol}`
          const response3 = await fetch(`https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(symbolQuery)}`)
          const data3 = await response3.json()
          
          if (searchRef.current !== searchKey) return
          
          const chainPairs3 = data3.pairs?.filter((p: DexScreenerPair) => p.chainId === dexScreenerChain) || []
          matchingPair = chainPairs3.find((pair: DexScreenerPair) => {
            const baseAddr = pair.baseToken.address.toLowerCase()
            const quoteAddr = pair.quoteToken.address.toLowerCase()
            const inAddr = tokenInAddr.toLowerCase()
            const outAddr = tokenOutAddr.toLowerCase()
            
            return (baseAddr === inAddr && quoteAddr === outAddr) ||
                   (baseAddr === outAddr && quoteAddr === inAddr)
          })
        }
        
        if (searchRef.current !== searchKey) return
        
        if (matchingPair) {
          console.log('✅ Found pair from DexScreener:', matchingPair.pairAddress, matchingPair.baseToken.symbol, '/', matchingPair.quoteToken.symbol)
          setPairAddress(matchingPair.pairAddress)
          setPairInfo(matchingPair)
          setPairNotFound(false)
        } else {
          console.log('⚠️ No pair found on DexScreener for:', swapTokenIn.symbol, '/', swapTokenOut.symbol)
          setPairNotFound(true)
          setPairInfo(null)
        }
      } catch (err) {
        console.error('Failed to find pair:', err)
        if (searchRef.current === searchKey) {
          setPairNotFound(true)
          setPairInfo(null)
        }
      } finally {
        if (searchRef.current === searchKey) {
          setIsSearching(false)
        }
      }
    }
    
    findPairAddress()
  }, [swapTokenIn, swapTokenOut, contracts.WETH, dexScreenerChain, defaultPairAddress])

  // Refresh pair info periodically
  const fetchPairInfo = useCallback(async () => {
    if (!pairAddress) return
    try {
      const response = await fetch(`https://api.dexscreener.com/latest/dex/pairs/${dexScreenerChain}/${pairAddress}`)
      const data = await response.json()
      setPairInfo(data.pairs?.[0] || null)
    } catch (err) {
      console.error('Failed to fetch pair info:', err)
    }
  }, [pairAddress, dexScreenerChain])

  useEffect(() => {
    if (pairAddress) {
      fetchPairInfo()
      const interval = setInterval(fetchPairInfo, 10000)
      return () => clearInterval(interval)
    }
  }, [pairAddress, fetchPairInfo])

  const toggleChart = () => {
    setIsChartVisible(prev => !prev)
  }

  // Get display pair name based on chain
  const getPairName = () => {
    if (swapTokenIn && swapTokenOut) {
      return `${swapTokenIn.symbol}/${swapTokenOut.symbol}`
    }
    return chainId === CHAIN_IDS.MEGAETH ? 'WETH/MXA' : 'WMON/QUICK'
  }

  const isVerticalLayout = isTablet

  return (
    <div className="w-full max-w-7xl mx-auto px-2 sm:px-0">
      <div className={`flex ${isVerticalLayout ? 'flex-col' : 'flex-row'} gap-3 sm:gap-4 items-start`}>
        <motion.div
          layout
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className={`w-full ${
            isVerticalLayout 
              ? 'max-w-full' 
              : isChartVisible 
                ? 'lg:w-[400px] xl:w-[420px]' 
                : 'lg:max-w-md lg:mx-auto'
          } flex-shrink-0`}
        >
          <SwapCardWithChartToggle 
            isChartVisible={isChartVisible} 
            onToggleChart={toggleChart}
            onTokenChange={handleTokenChange}
          />
        </motion.div>

        <AnimatePresence mode="wait">
          {isChartVisible && (
            <motion.div
              initial={isVerticalLayout ? { height: 0, opacity: 0 } : { width: 0, opacity: 0 }}
              animate={isVerticalLayout ? { height: 'auto', opacity: 1 } : { width: 'auto', opacity: 1 }}
              exit={isVerticalLayout ? { height: 0, opacity: 0 } : { width: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className={`${isVerticalLayout ? 'w-full' : 'flex-1 min-w-0'} overflow-hidden`}
            >
              <div className={isVerticalLayout ? 'w-full' : 'min-w-[350px] lg:min-w-[400px]'}>
                <div className="glass-card p-3 sm:p-4 rounded-xl">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <div className="flex -space-x-1">
                        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-[8px] sm:text-[10px] font-bold border-2 border-atlantis-800">
                          {swapTokenIn?.symbol?.[0] || (chainId === CHAIN_IDS.MEGAETH ? 'W' : 'W')}
                        </div>
                        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-[8px] sm:text-[10px] font-bold border-2 border-atlantis-800">
                          {swapTokenOut?.symbol?.[0] || (chainId === CHAIN_IDS.MEGAETH ? 'M' : 'Q')}
                        </div>
                      </div>
                      <span className="font-semibold text-white text-sm sm:text-base truncate">
                        {getPairName()}
                      </span>
                      {isSearching && (
                        <RefreshCw className="w-3 h-3 text-primary-400 animate-spin" />
                      )}
                    </div>

                    <a 
                      href={`https://dexscreener.com/${dexScreenerChain}/${pairAddress}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-gray-400 hover:text-white flex-shrink-0 p-1"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>

                  {pairInfo && !pairNotFound && (
                    <div className="flex items-center gap-2 sm:gap-3 mb-3">
                      <span className="text-xl sm:text-2xl font-bold text-white">
                        ${formatPrice(pairInfo.priceUsd || '0')}
                      </span>
                      <PriceChange value={pairInfo.priceChange?.h24 || 0} />
                    </div>
                  )}

                  {pairNotFound && !isSearching && (
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-2 mb-3">
                      <p className="text-amber-400 text-xs">
                        ⚠️ Pair {getPairName()} not found on DexScreener. Showing default chart.
                      </p>
                    </div>
                  )}

                  <div 
                    className="overflow-hidden rounded-xl relative bg-atlantis-900/30"
                    style={{ height: isMobile ? '280px' : isTablet ? '320px' : '350px' }}
                  >
                    {isSearching ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-atlantis-900/50">
                        <div className="text-center">
                          <RefreshCw className="w-8 h-8 text-primary-400 animate-spin mx-auto mb-2" />
                          <p className="text-gray-400 text-sm">Loading chart...</p>
                        </div>
                      </div>
                    ) : null}
                    <iframe
                      key={pairAddress}
                      src={`https://dexscreener.com/${dexScreenerChain}/${pairAddress}?embed=1&theme=dark&trades=0&info=0`}
                      title="DexScreener Chart"
                      className="w-full h-full border-0"
                      allow="clipboard-write"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
