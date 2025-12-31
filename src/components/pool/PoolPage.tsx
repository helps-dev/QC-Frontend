import { useState, useEffect, useCallback, useRef } from 'react'
import { useAccount } from 'wagmi'
import { useQueryClient } from '@tanstack/react-query'
import {
  Plus,
  Wallet,
  Layers,
  RefreshCw,
  Filter,
  BarChart3,
  Users,
  DollarSign,
  TrendingUp,
  Search,
  ChevronDown,
} from 'lucide-react'
import { SUBGRAPH_URL } from '../../config/contracts'
import { PositionCard } from './PositionCard'
import { PoolCard } from './PoolCard'
import { AddLiquidityModal } from './AddLiquidityModal'
import { RemoveLiquidityModal } from './RemoveLiquidityModal'

// Types
export interface PoolData {
  id: string
  token0: { id: string; symbol: string; name: string }
  token1: { id: string; symbol: string; name: string }
  reserve0: string
  reserve1: string
  volumeToken0: string
  volumeToken1: string
  txCount: string
  totalSupply: string
  liquidityProviderCount: string
}

export interface PositionData {
  pair: PoolData
  liquidityTokenBalance: string
}

// Constants
const WMON_ADDRESS = '0x3bd359c1119da7da1d913d1c4d2b7c461115433a'
const MON_PRICE_USD = 0.5

// Utility functions
export function calculatePoolTVL(pool: PoolData): number {
  const r0 = parseFloat(pool.reserve0) || 0
  const r1 = parseFloat(pool.reserve1) || 0
  if (pool.token0.id.toLowerCase() === WMON_ADDRESS) return r0 * 2 * MON_PRICE_USD
  if (pool.token1.id.toLowerCase() === WMON_ADDRESS) return r1 * 2 * MON_PRICE_USD
  return (r0 + r1) * MON_PRICE_USD * 0.01
}

export function calculatePoolVolume(pool: PoolData): number {
  const v0 = parseFloat(pool.volumeToken0) || 0
  const v1 = parseFloat(pool.volumeToken1) || 0
  if (pool.token0.id.toLowerCase() === WMON_ADDRESS) return v0 * MON_PRICE_USD
  if (pool.token1.id.toLowerCase() === WMON_ADDRESS) return v1 * MON_PRICE_USD
  return (v0 + v1) * MON_PRICE_USD * 0.01
}

export function formatUSD(num: number): string {
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(2)}M`
  if (num >= 1_000) return `$${(num / 1_000).toFixed(2)}K`
  if (num >= 1) return `$${num.toFixed(2)}`
  return `$${num.toFixed(4)}`
}

type TabType = 'positions' | 'pools'
type SortType = 'tvl' | 'volume' | 'apr' | 'fee'

// Stats Header Component - Responsive
function StatsHeader({ pools }: { pools: PoolData[] }) {
  const totalTVL = pools.reduce((acc, pool) => acc + calculatePoolTVL(pool), 0)
  const totalVolume = pools.reduce((acc, pool) => acc + calculatePoolVolume(pool), 0)
  const totalFees = totalVolume * 0.005
  const totalLPs = pools.reduce((acc, pool) => acc + parseInt(pool.liquidityProviderCount || '0'), 0)

  const stats = [
    { label: 'TVL', fullLabel: 'Total Value Locked', value: formatUSD(totalTVL), icon: DollarSign, color: 'text-green-400', bg: 'from-green-500/10 to-emerald-500/10' },
    { label: 'Volume', fullLabel: '24h Volume', value: formatUSD(totalVolume), icon: BarChart3, color: 'text-blue-400', bg: 'from-blue-500/10 to-cyan-500/10' },
    { label: 'Fees', fullLabel: '24h Fees', value: formatUSD(totalFees), icon: TrendingUp, color: 'text-purple-400', bg: 'from-purple-500/10 to-pink-500/10' },
    { label: 'LPs', fullLabel: 'LP Providers', value: totalLPs.toLocaleString(), icon: Users, color: 'text-orange-400', bg: 'from-orange-500/10 to-amber-500/10' },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6">
      {stats.map((stat) => (
        <div key={stat.label} className={`bg-gradient-to-br ${stat.bg} backdrop-blur-sm rounded-xl sm:rounded-2xl p-2.5 sm:p-4 border border-white/5`}>
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
            <stat.icon className={`w-3 h-3 sm:w-4 sm:h-4 ${stat.color}`} />
            <span className="text-gray-400 text-[10px] sm:text-xs hidden sm:inline">{stat.fullLabel}</span>
            <span className="text-gray-400 text-[10px] sm:hidden">{stat.label}</span>
          </div>
          <p className="text-white text-base sm:text-lg md:text-xl font-bold">{stat.value}</p>
        </div>
      ))}
    </div>
  )
}

// Filter Bar Component - Responsive
function FilterBar({
  activeTab,
  setActiveTab,
  sortBy,
  setSortBy,
  searchQuery,
  setSearchQuery,
  positionCount,
}: {
  activeTab: TabType
  setActiveTab: (tab: TabType) => void
  sortBy: SortType
  setSortBy: (sort: SortType) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  positionCount: number
}) {
  const [showSortDropdown, setShowSortDropdown] = useState(false)

  const tabs = [
    { id: 'pools' as TabType, label: 'All Pools', shortLabel: 'Pools', icon: Layers, count: null },
    { id: 'positions' as TabType, label: 'My Positions', shortLabel: 'Positions', icon: Wallet, count: positionCount },
  ]

  const sortOptions = [
    { id: 'tvl' as SortType, label: 'TVL' },
    { id: 'volume' as SortType, label: 'Volume' },
    { id: 'apr' as SortType, label: 'APR' },
    { id: 'fee' as SortType, label: 'Fee' },
  ]

  return (
    <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
      {/* Tabs - Full width on mobile */}
      <div className="flex gap-1 p-1 bg-atlantis-800/30 rounded-xl border border-atlantis-700/30 w-full">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2 sm:py-2.5 rounded-lg font-medium transition-all text-sm ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-primary-500/20 to-secondary-500/20 text-white border border-primary-500/30'
                : 'text-gray-400 hover:text-white hover:bg-atlantis-700/30'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.shortLabel}</span>
            {tab.count !== null && tab.count > 0 && (
              <span className="px-1.5 py-0.5 bg-primary-500/20 text-primary-400 text-[10px] sm:text-xs rounded-full">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search & Sort Row */}
      <div className="flex gap-2">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 bg-atlantis-800/30 border border-atlantis-700/30 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-primary-500/50"
          />
        </div>

        {/* Sort Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowSortDropdown(!showSortDropdown)}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-atlantis-800/30 border border-atlantis-700/30 rounded-xl text-gray-400 hover:text-white transition-all min-h-[40px] sm:min-h-[44px]"
          >
            <Filter className="w-4 h-4" />
            <span className="text-sm">{sortOptions.find(s => s.id === sortBy)?.label}</span>
            <ChevronDown className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform ${showSortDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showSortDropdown && (
            <>
              {/* Backdrop for mobile */}
              <div 
                className="fixed inset-0 z-40 sm:hidden" 
                onClick={() => setShowSortDropdown(false)}
              />
              <div className="absolute right-0 mt-2 w-36 sm:w-40 bg-atlantis-800 border border-atlantis-700 rounded-xl shadow-xl z-50 overflow-hidden">
                {sortOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => {
                      setSortBy(option.id)
                      setShowSortDropdown(false)
                    }}
                    className={`w-full px-3 sm:px-4 py-2.5 text-left text-sm transition-all ${
                      sortBy === option.id
                        ? 'bg-primary-500/20 text-primary-400'
                        : 'text-gray-400 hover:bg-atlantis-700/50 hover:text-white'
                    }`}
                  >
                    Sort by {option.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// Main Pool Page Component
export function PoolPage() {
  const { address, isConnected } = useAccount()
  const queryClient = useQueryClient()
  
  // State
  const [activeTab, setActiveTab] = useState<TabType>('pools')
  const [sortBy, setSortBy] = useState<SortType>('tvl')
  const [searchQuery, setSearchQuery] = useState('')
  const [pools, setPools] = useState<PoolData[]>([])
  const [positions, setPositions] = useState<PositionData[]>([])
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false)
  const [showRemoveModal, setShowRemoveModal] = useState(false)
  const [selectedPosition, setSelectedPosition] = useState<PositionData | null>(null)
  
  // Ref to track if component is mounted
  const isMounted = useRef(true)
  
  useEffect(() => {
    isMounted.current = true
    return () => { isMounted.current = false }
  }, [])

  // Fetch pools with cache busting
  const fetchPools = useCallback(async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setIsRefreshing(true)
    try {
      const response = await fetch(SUBGRAPH_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({
          query: `{
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
            }
          }`,
        }),
      })
      const data = await response.json()
      if (isMounted.current && data.data?.pairs) {
        setPools(data.data.pairs)
      }
    } catch (err) {
      console.error('Failed to fetch pools:', err)
    } finally {
      if (isMounted.current) setIsRefreshing(false)
    }
  }, [])

  // Fetch positions with cache busting
  const fetchPositions = useCallback(async (showRefreshIndicator = false) => {
    if (!address) {
      setPositions([])
      return
    }

    if (showRefreshIndicator) setIsRefreshing(true)
    try {
      const response = await fetch(SUBGRAPH_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({
          query: `{
            liquidityPositions(where: { user: "${address.toLowerCase()}", liquidityTokenBalance_gt: "0" }) {
              liquidityTokenBalance
              pair {
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
              }
            }
          }`,
        }),
      })
      const data = await response.json()
      if (isMounted.current && data.data?.liquidityPositions) {
        setPositions(data.data.liquidityPositions)
      }
    } catch (err) {
      console.error('Failed to fetch positions:', err)
    } finally {
      if (isMounted.current) setIsRefreshing(false)
    }
  }, [address])

  // Initial load
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      await Promise.all([fetchPools(), fetchPositions()])
      setLoading(false)
    }
    load()
  }, [fetchPools, fetchPositions])

  // Refresh data with retry logic for subgraph indexing delay
  const refreshDataWithRetry = useCallback(async () => {
    // Invalidate all wagmi queries to refresh balances
    queryClient.invalidateQueries()
    
    // Initial fetch
    setIsRefreshing(true)
    await Promise.all([fetchPools(false), fetchPositions(false)])
    
    // Retry fetches to handle subgraph indexing delay
    // Subgraph typically indexes within 2-10 seconds
    const retryDelays = [2000, 4000, 8000] // Retry at 2s, 4s, 8s
    
    for (const delay of retryDelays) {
      if (!isMounted.current) break
      await new Promise(resolve => setTimeout(resolve, delay))
      if (!isMounted.current) break
      await Promise.all([fetchPools(false), fetchPositions(false)])
    }
    
    if (isMounted.current) setIsRefreshing(false)
  }, [fetchPools, fetchPositions, queryClient])

  // Handle success from modals - trigger refresh with retry
  const handleSuccess = useCallback(() => {
    refreshDataWithRetry()
  }, [refreshDataWithRetry])

  // Manual refresh button handler
  const handleManualRefresh = useCallback(() => {
    refreshDataWithRetry()
  }, [refreshDataWithRetry])

  // Filter and sort pools
  const filteredPools = pools
    .filter((pool) => {
      if (!searchQuery) return true
      const query = searchQuery.toLowerCase()
      return (
        pool.token0.symbol.toLowerCase().includes(query) ||
        pool.token1.symbol.toLowerCase().includes(query) ||
        pool.token0.name.toLowerCase().includes(query) ||
        pool.token1.name.toLowerCase().includes(query)
      )
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'tvl':
          return calculatePoolTVL(b) - calculatePoolTVL(a)
        case 'volume':
          return calculatePoolVolume(b) - calculatePoolVolume(a)
        case 'apr':
          const aprA = calculatePoolTVL(a) > 0 ? (calculatePoolVolume(a) * 0.005 * 365) / calculatePoolTVL(a) : 0
          const aprB = calculatePoolTVL(b) > 0 ? (calculatePoolVolume(b) * 0.005 * 365) / calculatePoolTVL(b) : 0
          return aprB - aprA
        default:
          return 0
      }
    })

  // Handle actions
  const handleRemove = (position: PositionData) => {
    setSelectedPosition(position)
    setShowRemoveModal(true)
  }

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Header - Responsive */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-display font-bold gradient-text">💧 Pool</h1>
            <p className="text-gray-400 text-xs sm:text-sm mt-0.5 sm:mt-1">Provide liquidity and earn fees</p>
          </div>
          {/* Refresh Button */}
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="p-1.5 sm:p-2 hover:bg-atlantis-700/50 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh data"
          >
            <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-400 ${isRefreshing ? 'animate-spin text-primary-400' : ''}`} />
          </button>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 gradient-button font-semibold rounded-xl shadow-glow text-sm sm:text-base"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          Add Liquidity
        </button>
      </div>

      {/* Stats */}
      <StatsHeader pools={pools} />

      {/* Filter Bar */}
      <FilterBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sortBy={sortBy}
        setSortBy={setSortBy}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        positionCount={positions.length}
      />

      {/* Content */}
      <div className="space-y-3 sm:space-y-4">
        {loading ? (
          <div className="glass-card p-8 sm:p-12 text-center">
            <RefreshCw className="w-8 h-8 sm:w-10 sm:h-10 text-primary-500 animate-spin mx-auto mb-3 sm:mb-4" />
            <p className="text-gray-400 text-sm sm:text-base">Loading pools...</p>
          </div>
        ) : activeTab === 'positions' ? (
          !isConnected ? (
            <div className="glass-card p-8 sm:p-12 text-center">
              <Wallet className="w-12 h-12 sm:w-16 sm:h-16 text-gray-600 mx-auto mb-3 sm:mb-4" />
              <p className="text-white text-base sm:text-lg mb-1 sm:mb-2">Connect your wallet</p>
              <p className="text-gray-500 text-xs sm:text-sm">Connect to view your liquidity positions</p>
            </div>
          ) : positions.length > 0 ? (
            positions.map((position, idx) => {
              return (
                <PositionCard
                  key={idx}
                  position={position}
                  onAdd={() => setShowAddModal(true)}
                  onRemove={() => handleRemove(position)}
                />
              )
            })
          ) : (
            <div className="glass-card p-8 sm:p-12 text-center">
              <TrendingUp className="w-12 h-12 sm:w-16 sm:h-16 text-gray-600 mx-auto mb-3 sm:mb-4" />
              <p className="text-white text-base sm:text-lg mb-1 sm:mb-2">No positions yet</p>
              <p className="text-gray-500 text-xs sm:text-sm mb-4 sm:mb-6">Add liquidity to start earning trading fees</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-6 sm:px-8 py-2.5 sm:py-3 gradient-button font-semibold rounded-xl text-sm sm:text-base"
              >
                Add Liquidity
              </button>
            </div>
          )
        ) : filteredPools.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {filteredPools.map((pool) => (
              <PoolCard key={pool.id} pool={pool} onAddLiquidity={() => setShowAddModal(true)} />
            ))}
          </div>
        ) : (
          <div className="glass-card p-8 sm:p-12 text-center">
            <Layers className="w-12 h-12 sm:w-16 sm:h-16 text-gray-600 mx-auto mb-3 sm:mb-4" />
            <p className="text-white text-base sm:text-lg mb-1 sm:mb-2">No pools found</p>
            <p className="text-gray-500 text-xs sm:text-sm">Try a different search term</p>
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddLiquidityModal onClose={() => setShowAddModal(false)} onSuccess={handleSuccess} />
      )}

      {showRemoveModal && selectedPosition && (
        <RemoveLiquidityModal
          position={selectedPosition}
          onClose={() => {
            setShowRemoveModal(false)
            setSelectedPosition(null)
          }}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  )
}
