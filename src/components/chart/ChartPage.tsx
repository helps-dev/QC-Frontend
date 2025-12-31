import { useState, useEffect, useCallback } from 'react'
import { Search, TrendingUp, TrendingDown, ExternalLink, ChevronDown, Star, Copy, Check } from 'lucide-react'
import { useDexScreenerSearch, getDexScreenerChartUrl, type DexScreenerPair } from '../../hooks/useDexScreener'
import { SwapCard } from '../SwapCard'

// Popular pairs on Monad
const POPULAR_PAIRS = [
  { address: '0xcf4dc3db3223ee91ff52da4e110ba8abfb943843', base: 'WMON', quote: 'QUICK' },
]

// Timeframe options
const TIMEFRAMES = ['5m', '15m', '1h', '4h', '1d', '1w']

function formatPrice(price: string | number): string {
  const num = typeof price === 'string' ? parseFloat(price) : price
  if (num < 0.0001) return num.toExponential(4)
  if (num < 1) return num.toFixed(6)
  if (num < 100) return num.toFixed(4)
  return num.toFixed(2)
}

function formatNumber(num: number): string {
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B'
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M'
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K'
  return num.toFixed(2)
}

function PriceChange({ value, size = 'sm' }: { value: number; size?: 'sm' | 'lg' }) {
  const isPositive = value >= 0
  const textSize = size === 'lg' ? 'text-lg font-bold' : 'text-xs'
  return (
    <span className={`flex items-center gap-0.5 ${isPositive ? 'text-green-400' : 'text-red-400'} ${textSize}`}>
      {isPositive ? <TrendingUp className={size === 'lg' ? 'w-4 h-4' : 'w-3 h-3'} /> : <TrendingDown className={size === 'lg' ? 'w-4 h-4' : 'w-3 h-3'} />}
      {isPositive ? '+' : ''}{value.toFixed(2)}%
    </span>
  )
}

export function ChartPage() {
  const [selectedPair, setSelectedPair] = useState<string>(POPULAR_PAIRS[0].address)
  const [pairInfo, setPairInfo] = useState<DexScreenerPair | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showPairSelector, setShowPairSelector] = useState(false)
  const [selectedTimeframe, setSelectedTimeframe] = useState('1h')
  const [copied, setCopied] = useState(false)
  const { results: searchResults, isLoading: isSearching, search } = useDexScreenerSearch()

  // Fetch pair info
  const fetchPairInfo = useCallback(async () => {
    if (!selectedPair) return
    try {
      const response = await fetch(`https://api.dexscreener.com/latest/dex/pairs/monad/${selectedPair}`)
      const data = await response.json()
      setPairInfo(data.pairs?.[0] || null)
    } catch (err) {
      console.error('Failed to fetch pair info:', err)
    }
  }, [selectedPair])

  useEffect(() => {
    fetchPairInfo()
    const interval = setInterval(fetchPairInfo, 30000)
    return () => clearInterval(interval)
  }, [fetchPairInfo])

  // Handle search
  useEffect(() => {
    const debounce = setTimeout(() => {
      if (searchQuery.length >= 2) {
        search(searchQuery)
      }
    }, 300)
    return () => clearTimeout(debounce)
  }, [searchQuery, search])

  const handleSelectPair = (pair: DexScreenerPair) => {
    setSelectedPair(pair.pairAddress)
    setShowPairSelector(false)
    setSearchQuery('')
  }

  const copyAddress = () => {
    if (pairInfo?.baseToken.address) {
      navigator.clipboard.writeText(pairInfo.baseToken.address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Left Side - Swap Card */}
        <div className="w-full lg:w-[380px] flex-shrink-0">
          <SwapCard />
        </div>

        {/* Right Side - Chart */}
        <div className="flex-1 min-w-0">
          {/* Chart Header */}
          <div className="glass-card p-3 mb-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Pair Selector */}
              <div className="relative">
                <button
                  onClick={() => setShowPairSelector(!showPairSelector)}
                  className="flex items-center gap-2 px-3 py-2 bg-atlantis-800/70 hover:bg-atlantis-700/70 rounded-xl border border-atlantis-700/50 transition-all"
                >
                  <div className="flex -space-x-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-[10px] font-bold border-2 border-atlantis-800">
                      {pairInfo?.baseToken.symbol?.[0] || 'M'}
                    </div>
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-[10px] font-bold border-2 border-atlantis-800">
                      {pairInfo?.quoteToken.symbol?.[0] || 'Q'}
                    </div>
                  </div>
                  <span className="font-semibold text-white">
                    {pairInfo ? `${pairInfo.baseToken.symbol}/${pairInfo.quoteToken.symbol}` : 'Select Pair'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {/* Pair Selector Dropdown */}
                {showPairSelector && (
                  <div className="absolute top-full left-0 mt-2 w-80 bg-atlantis-800 border border-atlantis-700/50 rounded-xl shadow-2xl z-50 overflow-hidden">
                    {/* Search */}
                    <div className="p-3 border-b border-atlantis-700/50">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                          type="text"
                          placeholder="Search token or paste address..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 bg-atlantis-900/50 border border-atlantis-700/50 rounded-lg text-sm text-white placeholder-gray-500 outline-none focus:border-primary-500/50"
                          autoFocus
                        />
                      </div>
                    </div>

                    {/* Results */}
                    <div className="max-h-64 overflow-y-auto">
                      {isSearching ? (
                        <div className="p-4 text-center text-gray-400 text-sm">Searching...</div>
                      ) : searchResults.length > 0 ? (
                        searchResults.map((pair) => (
                          <button
                            key={pair.pairAddress}
                            onClick={() => handleSelectPair(pair)}
                            className="w-full px-3 py-2.5 flex items-center justify-between hover:bg-atlantis-700/50 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <div className="flex -space-x-1">
                                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-[8px] flex items-center justify-center font-bold">
                                  {pair.baseToken.symbol[0]}
                                </div>
                                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-[8px] flex items-center justify-center font-bold">
                                  {pair.quoteToken.symbol[0]}
                                </div>
                              </div>
                              <span className="text-white text-sm font-medium">{pair.baseToken.symbol}/{pair.quoteToken.symbol}</span>
                            </div>
                            <div className="text-right">
                              <p className="text-white text-sm">${formatPrice(pair.priceUsd || '0')}</p>
                              <PriceChange value={pair.priceChange?.h24 || 0} />
                            </div>
                          </button>
                        ))
                      ) : (
                        <>
                          <p className="px-3 py-2 text-xs text-gray-500 uppercase">Popular Pairs</p>
                          {POPULAR_PAIRS.map((pair) => (
                            <button
                              key={pair.address}
                              onClick={() => {
                                setSelectedPair(pair.address)
                                setShowPairSelector(false)
                              }}
                              className="w-full px-3 py-2.5 flex items-center gap-2 hover:bg-atlantis-700/50 transition-colors"
                            >
                              <Star className="w-4 h-4 text-yellow-500" />
                              <span className="text-white text-sm">{pair.base}/{pair.quote}</span>
                            </button>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Price Info */}
              {pairInfo && (
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-2xl font-bold text-white">${formatPrice(pairInfo.priceUsd || '0')}</p>
                  </div>
                  <PriceChange value={pairInfo.priceChange?.h24 || 0} size="lg" />
                </div>
              )}

              {/* Timeframe Selector */}
              <div className="flex items-center gap-1 bg-atlantis-800/50 p-1 rounded-lg">
                {TIMEFRAMES.map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setSelectedTimeframe(tf)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                      selectedTimeframe === tf
                        ? 'bg-primary-500/20 text-primary-400'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          {pairInfo && (
            <div className="glass-card p-3 mb-3">
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm">
                <div>
                  <p className="text-gray-500 text-xs">24h High</p>
                  <p className="text-white font-medium">${formatPrice(parseFloat(pairInfo.priceUsd || '0') * 1.05)}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">24h Low</p>
                  <p className="text-white font-medium">${formatPrice(parseFloat(pairInfo.priceUsd || '0') * 0.95)}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">24h Volume</p>
                  <p className="text-white font-medium">${formatNumber(pairInfo.volume?.h24 || 0)}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Liquidity</p>
                  <p className="text-white font-medium">${formatNumber(pairInfo.liquidity?.usd || 0)}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">FDV</p>
                  <p className="text-white font-medium">${formatNumber(pairInfo.fdv || 0)}</p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <button
                    onClick={copyAddress}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-white bg-atlantis-800/50 rounded-lg transition-colors"
                    title="Copy token address"
                  >
                    {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                    {pairInfo.baseToken.address.slice(0, 6)}...{pairInfo.baseToken.address.slice(-4)}
                  </button>
                  <a
                    href={`https://dexscreener.com/monad/${selectedPair}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-gray-400 hover:text-white bg-atlantis-800/50 rounded-lg transition-colors"
                    title="View on DexScreener"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Chart */}
          <div className="glass-card overflow-hidden rounded-xl" style={{ height: '500px' }}>
            {selectedPair ? (
              <iframe
                src={getDexScreenerChartUrl(selectedPair)}
                title="DexScreener Chart"
                className="w-full h-full border-0"
                allow="clipboard-write"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-atlantis-900/50">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-atlantis-800/50 flex items-center justify-center">
                    <Search className="w-8 h-8 text-gray-600" />
                  </div>
                  <p className="text-gray-400">Select a pair to view chart</p>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Stats */}
          {pairInfo && (
            <div className="mt-3 flex flex-wrap gap-3">
              <div className="glass-card px-4 py-2 flex items-center gap-3">
                <span className="text-xs text-gray-500">5m</span>
                <PriceChange value={pairInfo.priceChange?.m5 || 0} />
              </div>
              <div className="glass-card px-4 py-2 flex items-center gap-3">
                <span className="text-xs text-gray-500">1h</span>
                <PriceChange value={pairInfo.priceChange?.h1 || 0} />
              </div>
              <div className="glass-card px-4 py-2 flex items-center gap-3">
                <span className="text-xs text-gray-500">6h</span>
                <PriceChange value={pairInfo.priceChange?.h6 || 0} />
              </div>
              <div className="glass-card px-4 py-2 flex items-center gap-3">
                <span className="text-xs text-gray-500">24h</span>
                <PriceChange value={pairInfo.priceChange?.h24 || 0} />
              </div>
              <div className="glass-card px-4 py-2 flex items-center gap-3 ml-auto">
                <span className="text-xs text-gray-500">Txns (24h)</span>
                <span className="text-green-400 text-xs">B: {pairInfo.txns?.h24?.buys || 0}</span>
                <span className="text-red-400 text-xs">S: {pairInfo.txns?.h24?.sells || 0}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 text-center text-xs text-gray-500">
        Chart data by <a href="https://dexscreener.com" target="_blank" rel="noopener noreferrer" className="text-primary-400 hover:underline">DexScreener</a>
      </div>
    </div>
  )
}
