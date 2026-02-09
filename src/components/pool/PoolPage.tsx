import { useState, useEffect, useCallback, useRef } from 'react'
import { useAccount, useChainId } from 'wagmi'
import { useQueryClient } from '@tanstack/react-query'
import { Plus, Wallet, RefreshCw, Search, TrendingUp, Layers, ChevronDown, ChevronUp, ExternalLink } from '../Icons3D'
import { getSubgraphUrl, MONAD_CONTRACTS, MEGAETH_CONTRACTS } from '../../config/contracts'
import { CHAIN_IDS } from '../../config/chains'
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

// Chain-specific WETH addresses
const WETH_ADDRESSES: Record<number, string> = {
  [CHAIN_IDS.MONAD]: MONAD_CONTRACTS.WETH.toLowerCase(),
  [CHAIN_IDS.MEGAETH]: MEGAETH_CONTRACTS.WETH.toLowerCase(),
}

// Placeholder price (should be fetched from oracle in production)
const NATIVE_PRICE_USD = 0.42
const FEE_RATE = 0.005

const TOKEN_LOGOS: Record<string, string> = {
  'WMON': 'https://imagedelivery.net/cBNDGgkrsEA-b_ixIp9SkQ/MON.png/public',
  'MON': 'https://imagedelivery.net/cBNDGgkrsEA-b_ixIp9SkQ/MON.png/public',
  'WETH': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
  'ETH': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
  'USDC': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png',
  'MEXA': '/mexa-logo.png',
  'MXA': '/mexa-logo.png',
  'GMEXA': '/mexa-logo.png',
}

// Utility Functions
export function getTokenLogo(symbol: string): string {
  return TOKEN_LOGOS[symbol.toUpperCase()] || `https://ui-avatars.com/api/?name=${symbol.slice(0,2)}&background=06b6d4&color=fff&size=64&bold=true`
}

// Chain-aware TVL calculation
export function calculatePoolTVL(pool: PoolData, chainId: number = CHAIN_IDS.MONAD): number {
  const r0 = parseFloat(pool.reserve0) || 0
  const r1 = parseFloat(pool.reserve1) || 0
  const wethAddress = WETH_ADDRESSES[chainId] || WETH_ADDRESSES[CHAIN_IDS.MONAD]
  
  if (pool.token0.id.toLowerCase() === wethAddress) return r0 * 2 * NATIVE_PRICE_USD
  if (pool.token1.id.toLowerCase() === wethAddress) return r1 * 2 * NATIVE_PRICE_USD
  return (r0 + r1) * NATIVE_PRICE_USD * 0.01
}

// Chain-aware volume calculation
export function calculatePoolVolume(pool: PoolData, chainId: number = CHAIN_IDS.MONAD): number {
  const v0 = parseFloat(pool.volumeToken0) || 0
  const v1 = parseFloat(pool.volumeToken1) || 0
  const wethAddress = WETH_ADDRESSES[chainId] || WETH_ADDRESSES[CHAIN_IDS.MONAD]
  
  if (pool.token0.id.toLowerCase() === wethAddress) return v0 * NATIVE_PRICE_USD
  if (pool.token1.id.toLowerCase() === wethAddress) return v1 * NATIVE_PRICE_USD
  return (v0 + v1) * NATIVE_PRICE_USD * 0.01
}

export function calculateFees(volume: number): number {
  return volume * FEE_RATE
}

export function calculateAPR(volume: number, tvl: number): number {
  if (tvl <= 0) return 0
  return (volume * FEE_RATE * 365) / tvl * 100
}

export function formatUSD(num: number): string {
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(2)}M`
  if (num >= 1_000) return `$${(num / 1_000).toFixed(2)}K`
  if (num >= 1) return `$${num.toFixed(2)}`
  return `$${num.toFixed(4)}`
}

export function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(2)}K`
  return num.toFixed(2)
}

type TabType = 'all' | 'myPositions'
type SortField = 'tvl' | 'volume24h' | 'apr'
type SortDirection = 'asc' | 'desc'

// Token Icon Component
function TokenIcon({ symbol, size = 28 }: { symbol: string; size?: number }) {
  const [error, setError] = useState(false)
  const logo = getTokenLogo(symbol)
  
  if (error) {
    return (
      <div
        className="bg-gradient-to-br from-cyan-400 to-emerald-400 rounded-full flex items-center justify-center text-white font-bold border-2 border-slate-800"
        style={{ width: size, height: size, fontSize: size * 0.35 }}
      >
        {symbol.slice(0, 2)}
      </div>
    )
  }
  
  return (
    <img 
      src={logo} 
      alt={symbol}
      className="rounded-full border-2 border-slate-800 bg-slate-800"
      style={{ width: size, height: size }}
      onError={() => setError(true)}
    />
  )
}

// Token Pair Icons (overlapping)
function TokenPair({ token0, token1, size = 28 }: { token0: string; token1: string; size?: number }) {
  return (
    <div className="flex items-center">
      <TokenIcon symbol={token0} size={size} />
      <div className="-ml-2">
        <TokenIcon symbol={token1} size={size} />
      </div>
    </div>
  )
}

// Stats Dashboard Component - 4 stat cards with cyan/emerald theme
function StatsDashboard({ totalTVL, volume24h, fees24h, lpCount }: { 
  totalTVL: number; volume24h: number; fees24h: number; lpCount: number 
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900/80 to-indigo-900/40 border border-white/10 backdrop-blur-xl p-5 hover:border-cyan-400/40 hover:shadow-2xl hover:shadow-cyan-500/10 transition-all duration-300">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-400 to-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        <p className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-2">Total TVL</p>
        <p className="text-white text-2xl md:text-3xl font-bold font-mono">{formatUSD(totalTVL)}</p>
      </div>
      <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900/80 to-indigo-900/40 border border-white/10 backdrop-blur-xl p-5 hover:border-cyan-400/40 hover:shadow-2xl hover:shadow-cyan-500/10 transition-all duration-300">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-400 to-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        <p className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-2">Volume 24H</p>
        <p className="text-white text-2xl md:text-3xl font-bold font-mono">{formatUSD(volume24h)}</p>
      </div>
      <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900/80 to-indigo-900/40 border border-white/10 backdrop-blur-xl p-5 hover:border-cyan-400/40 hover:shadow-2xl hover:shadow-cyan-500/10 transition-all duration-300">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-400 to-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        <p className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-2">Fees 24H</p>
        <p className="text-white text-2xl md:text-3xl font-bold font-mono">{formatUSD(fees24h)}</p>
      </div>
      <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900/80 to-indigo-900/40 border border-white/10 backdrop-blur-xl p-5 hover:border-cyan-400/40 hover:shadow-2xl hover:shadow-cyan-500/10 transition-all duration-300">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-400 to-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        <p className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-2">LP Providers</p>
        <p className="text-white text-2xl md:text-3xl font-bold font-mono">{formatNumber(lpCount)}</p>
      </div>
    </div>
  )
}


// Control Bar Component with cyan/emerald theme
function ControlBar({ 
  activeTab, onTabChange, searchQuery, onSearchChange, 
  sortBy, onSortChange, onAddLiquidity, onRefresh, isRefreshing 
}: {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  sortBy: SortField
  onSortChange: (field: SortField) => void
  onAddLiquidity: () => void
  onRefresh: () => void
  isRefreshing: boolean
}) {
  const [showSortDropdown, setShowSortDropdown] = useState(false)
  
  const sortOptions: { value: SortField; label: string }[] = [
    { value: 'tvl', label: 'TVL' },
    { value: 'volume24h', label: 'Volume 24H' },
    { value: 'apr', label: 'APR' },
  ]
  
  return (
    <div className="flex flex-col md:flex-row md:items-center gap-3 mb-6 bg-slate-800/50 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
      {/* Tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => onTabChange('all')}
          className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'all' 
              ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/25' 
              : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
          }`}
        >
          All Pools
        </button>
        <button
          onClick={() => onTabChange('myPositions')}
          className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'myPositions' 
              ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/25' 
              : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
          }`}
        >
          My Positions
        </button>
        
        {/* Add Liquidity Button */}
        <button
          onClick={onAddLiquidity}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white rounded-xl font-semibold text-sm shadow-lg shadow-emerald-500/25 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Add Liquidity
        </button>
      </div>
      
      {/* Search and Sort */}
      <div className="flex items-center gap-3 md:ml-auto flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search pools..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-700 border border-slate-600 rounded-xl text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
          />
        </div>
        
        {/* Sort Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowSortDropdown(!showSortDropdown)}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-xl text-sm text-gray-300 hover:border-cyan-500/50 transition-colors"
          >
            Sort: {sortOptions.find(o => o.value === sortBy)?.label}
            <ChevronDown className="w-4 h-4" />
          </button>
          {showSortDropdown && (
            <div className="absolute right-0 top-full mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-20 min-w-[150px] overflow-hidden">
              {sortOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => { onSortChange(option.value); setShowSortDropdown(false) }}
                  className={`w-full px-4 py-3 text-left text-sm hover:bg-slate-700 transition-colors ${
                    sortBy === option.value ? 'text-cyan-400 bg-slate-700/50' : 'text-gray-300'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Refresh */}
        <button 
          onClick={onRefresh} 
          disabled={isRefreshing} 
          className="p-2.5 bg-slate-700 hover:bg-slate-600 rounded-xl transition-colors"
        >
          <RefreshCw className={`w-4 h-4 text-gray-400 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </div>
  )
}

// Pool Row Component (expandable) with cyan/emerald theme
function PoolRow({ 
  pool, isExpanded, onExpand, onAddLiquidity, chainId 
}: { 
  pool: PoolData; isExpanded: boolean; onExpand: () => void; onAddLiquidity: () => void; chainId: number 
}) {
  const tvl = calculatePoolTVL(pool, chainId)
  const volume = calculatePoolVolume(pool, chainId)
  const volume24h = volume * 0.08
  const volume7d = volume * 0.4
  const apr = calculateAPR(volume24h, tvl)
  const lpCount = parseInt(pool.liquidityProviderCount) || 0
  
  // Dynamic explorer URL based on chain
  const explorerUrl = chainId === CHAIN_IDS.MEGAETH 
    ? `https://megaeth.blockscout.com/address/${pool.id}`
    : `https://testnet.monadexplorer.com/address/${pool.id}`
  
  const getAPRColor = (apr: number) => {
    if (apr > 100) return 'text-emerald-400 font-bold'
    if (apr > 20) return 'text-amber-400 font-bold'
    return 'text-gray-300'
  }
  
  return (
    <>
      {/* Main Row */}
      <tr 
        onClick={onExpand}
        className="border-b border-white/5 hover:bg-slate-700/30 cursor-pointer transition-colors"
      >
        {/* Pool Name */}
        <td className="py-4 px-4">
          <div className="flex items-center gap-3">
            <TokenPair token0={pool.token0.symbol} token1={pool.token1.symbol} size={36} />
            <div>
              <p className="text-white font-semibold">{pool.token0.symbol}/{pool.token1.symbol}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] px-2 py-0.5 bg-cyan-500/20 text-cyan-400 rounded-full font-medium">MexaSwap V2</span>
                <span className="text-[10px] px-2 py-0.5 bg-slate-600/50 text-gray-400 rounded-full font-medium">0.5% Fee</span>
              </div>
            </div>
          </div>
        </td>
        
        {/* TVL */}
        <td className="py-4 px-4 text-right">
          <p className="text-white font-mono font-medium">{formatUSD(tvl)}</p>
        </td>
        
        {/* Volume 24h */}
        <td className="py-4 px-4 text-right hidden md:table-cell">
          <p className="text-white font-mono">{formatUSD(volume24h)}</p>
        </td>
        
        {/* Volume 7D */}
        <td className="py-4 px-4 text-right hidden lg:table-cell">
          <p className="text-white font-mono">{formatUSD(volume7d)}</p>
        </td>
        
        {/* APR */}
        <td className="py-4 px-4 text-right">
          <p className={`font-mono ${getAPRColor(apr)}`}>
            {apr.toFixed(2)}%
          </p>
        </td>
        
        {/* Expand Icon */}
        <td className="py-4 px-4 text-right">
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-cyan-400 inline" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400 inline" />
          )}
        </td>
      </tr>
      
      {/* Expanded Details */}
      {isExpanded && (
        <tr className="bg-slate-800/50">
          <td colSpan={6} className="px-4 py-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Pool Reserves */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="bg-slate-900/50 rounded-xl px-5 py-4 border border-white/5">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Pool Reserves</p>
                  <div className="flex items-center gap-2 mb-2">
                    <TokenIcon symbol={pool.token0.symbol} size={22} />
                    <span className="text-white text-sm font-mono">{formatNumber(parseFloat(pool.reserve0))} {pool.token0.symbol}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TokenIcon symbol={pool.token1.symbol} size={22} />
                    <span className="text-white text-sm font-mono">{formatNumber(parseFloat(pool.reserve1))} {pool.token1.symbol}</span>
                  </div>
                </div>
                
                <div className="bg-slate-900/50 rounded-xl px-5 py-4 border border-white/5">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">LP Providers</p>
                  <p className="text-white text-2xl font-bold font-mono">{lpCount}</p>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex items-center gap-3">
                <button
                  onClick={(e) => { e.stopPropagation(); onAddLiquidity() }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white rounded-xl font-semibold text-sm shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  Add Liquidity
                </button>
                <a
                  href={explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="p-2.5 bg-slate-700 hover:bg-slate-600 text-gray-400 hover:text-white rounded-xl transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}


// Pool Table Component with cyan/emerald theme
function PoolTable({ 
  pools, sortBy, sortDirection, onSort, expandedPoolId, onExpandPool, onAddLiquidity, chainId 
}: {
  pools: PoolData[]
  sortBy: SortField
  sortDirection: SortDirection
  onSort: (field: SortField) => void
  expandedPoolId: string | null
  onExpandPool: (poolId: string) => void
  onAddLiquidity: (pool: PoolData) => void
  chainId: number
}) {
  const SortHeader = ({ field, label, className = '' }: { field: SortField; label: string; className?: string }) => (
    <th 
      onClick={() => onSort(field)}
      className={`py-4 px-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-cyan-400 transition-colors ${className}`}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {sortBy === field && (
          sortDirection === 'desc' ? <ChevronDown className="w-3 h-3 text-cyan-400" /> : <ChevronUp className="w-3 h-3 text-cyan-400" />
        )}
      </span>
    </th>
  )
  
  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-700/50 sticky top-0">
            <tr>
              <th className="py-4 px-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Pool</th>
              <SortHeader field="tvl" label="TVL" />
              <SortHeader field="volume24h" label="Vol 24H" className="hidden md:table-cell" />
              <th className="py-4 px-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider hidden lg:table-cell">Vol 7D</th>
              <SortHeader field="apr" label="APR" />
              <th className="py-4 px-4 w-12"></th>
            </tr>
          </thead>
          <tbody>
            {pools.map(pool => (
              <PoolRow
                key={pool.id}
                pool={pool}
                isExpanded={expandedPoolId === pool.id}
                onExpand={() => onExpandPool(pool.id)}
                onAddLiquidity={() => onAddLiquidity(pool)}
                chainId={chainId}
              />
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Mobile Cards */}
      <div className="md:hidden divide-y divide-white/5">
        {pools.map(pool => {
          const tvl = calculatePoolTVL(pool)
          const volume = calculatePoolVolume(pool)
          const apr = calculateAPR(volume * 0.08, tvl)
          const isExpanded = expandedPoolId === pool.id
          
          const getAPRColor = (apr: number) => {
            if (apr > 100) return 'text-emerald-400'
            if (apr > 20) return 'text-amber-400'
            return 'text-gray-300'
          }
          
          return (
            <div key={pool.id} className="p-4">
              <div 
                onClick={() => onExpandPool(pool.id)}
                className="flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <TokenPair token0={pool.token0.symbol} token1={pool.token1.symbol} size={40} />
                  <div>
                    <p className="text-white font-semibold">{pool.token0.symbol}/{pool.token1.symbol}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] px-2 py-0.5 bg-cyan-500/20 text-cyan-400 rounded-full">V2</span>
                      <span className="text-[10px] text-gray-500">0.5%</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-mono font-medium">{formatUSD(tvl)}</p>
                  <p className={`text-sm font-mono ${getAPRColor(apr)}`}>{apr.toFixed(2)}% APR</p>
                </div>
              </div>
              
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-white/5">
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-slate-900/50 rounded-xl p-3">
                      <p className="text-xs text-gray-500 mb-1">{pool.token0.symbol}</p>
                      <p className="text-white text-sm font-mono">{formatNumber(parseFloat(pool.reserve0))}</p>
                    </div>
                    <div className="bg-slate-900/50 rounded-xl p-3">
                      <p className="text-xs text-gray-500 mb-1">{pool.token1.symbol}</p>
                      <p className="text-white text-sm font-mono">{formatNumber(parseFloat(pool.reserve1))}</p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); onAddLiquidity(pool) }}
                    className="w-full py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white rounded-xl font-semibold text-sm transition-all active:scale-[0.98]"
                  >
                    Add Liquidity
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Position Card for My Positions view with cyan/emerald theme
function PositionCard({ position, onAdd, onRemove, chainId }: { position: PositionData; onAdd: () => void; onRemove: () => void; chainId: number }) {
  const pool = position.pair
  const tvl = calculatePoolTVL(pool, chainId)
  const totalSupply = parseFloat(pool.totalSupply) || 1
  const userBalance = parseFloat(position.liquidityTokenBalance) || 0
  const sharePercent = (userBalance / totalSupply) * 100
  const userTVL = tvl * (sharePercent / 100)
  const volume = calculatePoolVolume(pool, chainId)
  const apr = calculateAPR(volume * 0.08, tvl)
  
  // Dynamic explorer URL
  const explorerUrl = chainId === CHAIN_IDS.MEGAETH 
    ? `https://megaeth.blockscout.com/address/${pool.id}`
    : `https://testnet.monadexplorer.com/address/${pool.id}`
  
  const getAPRColor = (apr: number) => {
    if (apr > 100) return 'bg-emerald-500/20 text-emerald-400'
    if (apr > 20) return 'bg-amber-500/20 text-amber-400'
    return 'bg-gray-500/20 text-gray-400'
  }
  
  return (
    <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl p-5 border border-white/10 hover:border-cyan-400/30 hover:shadow-xl hover:shadow-cyan-500/5 transition-all duration-300">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <TokenPair token0={pool.token0.symbol} token1={pool.token1.symbol} size={40} />
          <div>
            <p className="text-white font-semibold">{pool.token0.symbol}/{pool.token1.symbol}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] px-2 py-0.5 bg-cyan-500/20 text-cyan-400 rounded-full">V2</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${getAPRColor(apr)}`}>
                {apr.toFixed(1)}% APR
              </span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-white font-bold text-lg font-mono">{formatUSD(userTVL)}</p>
          <p className="text-xs text-gray-500">{sharePercent.toFixed(4)}% share</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-slate-900/50 rounded-xl p-3 border border-white/5">
          <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">LP Tokens</p>
          <p className="text-white text-sm font-mono font-medium">{userBalance.toFixed(6)}</p>
        </div>
        <div className="bg-slate-900/50 rounded-xl p-3 border border-white/5">
          <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Pool TVL</p>
          <p className="text-white text-sm font-mono font-medium">{formatUSD(tvl)}</p>
        </div>
      </div>
      
      <div className="flex gap-2">
        <button onClick={onAdd} className="flex-1 py-2.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-xl text-sm font-semibold transition-colors">
          Add
        </button>
        <button onClick={onRemove} className="flex-1 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl text-sm font-semibold transition-colors">
          Remove
        </button>
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-2.5 bg-slate-700 hover:bg-slate-600 text-gray-400 hover:text-white rounded-xl transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  )
}


// Main Pool Page Component
export function PoolPage() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const queryClient = useQueryClient()
  const subgraphUrl = getSubgraphUrl(chainId)
  
  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortField>('tvl')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [pools, setPools] = useState<PoolData[]>([])
  const [positions, setPositions] = useState<PositionData[]>([])
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [expandedPoolId, setExpandedPoolId] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showRemoveModal, setShowRemoveModal] = useState(false)
  const [selectedPosition, setSelectedPosition] = useState<PositionData | null>(null)
  
  const isMounted = useRef(true)
  useEffect(() => { isMounted.current = true; return () => { isMounted.current = false } }, [])

  // Calculate stats
  const totalTVL = pools.reduce((sum, p) => sum + calculatePoolTVL(p), 0)
  const totalVolume = pools.reduce((sum, p) => sum + calculatePoolVolume(p), 0)
  const volume24h = totalVolume * 0.08
  const fees24h = calculateFees(volume24h)
  const totalLPCount = pools.reduce((sum, p) => sum + (parseInt(p.liquidityProviderCount) || 0), 0)

  // Fetch pools
  const fetchPools = useCallback(async () => {
    try {
      const res = await fetch(subgraphUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: `{ pairs(first: 100, orderBy: txCount, orderDirection: desc) { id token0 { id symbol name } token1 { id symbol name } reserve0 reserve1 volumeToken0 volumeToken1 txCount totalSupply liquidityProviderCount } }` 
        }),
      })
      const data = await res.json()
      if (isMounted.current && data.data?.pairs) setPools(data.data.pairs)
    } catch (e) { console.error(e) }
  }, [subgraphUrl])

  // Fetch user positions
  const fetchPositions = useCallback(async () => {
    if (!address) { setPositions([]); return }
    try {
      const res = await fetch(subgraphUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: `{ liquidityPositions(where: { user: "${address.toLowerCase()}", liquidityTokenBalance_gt: "0" }) { liquidityTokenBalance pair { id token0 { id symbol name } token1 { id symbol name } reserve0 reserve1 volumeToken0 volumeToken1 txCount totalSupply liquidityProviderCount } } }` 
        }),
      })
      const data = await res.json()
      if (isMounted.current && data.data?.liquidityPositions) setPositions(data.data.liquidityPositions)
    } catch (e) { console.error(e) }
  }, [address, subgraphUrl])

  // Reset pools when chain changes
  useEffect(() => {
    setPools([])
    setPositions([])
    setLoading(true)
  }, [chainId])

  // Initial load
  useEffect(() => {
    const load = async () => { 
      setLoading(true)
      await Promise.all([fetchPools(), fetchPositions()])
      setLoading(false) 
    }
    load()
  }, [fetchPools, fetchPositions])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchPools()
      fetchPositions()
    }, 30000)
    return () => clearInterval(interval)
  }, [fetchPools, fetchPositions])

  // Manual refresh
  const refresh = useCallback(async () => {
    queryClient.invalidateQueries()
    setIsRefreshing(true)
    await Promise.all([fetchPools(), fetchPositions()])
    setTimeout(() => isMounted.current && setIsRefreshing(false), 800)
  }, [fetchPools, fetchPositions, queryClient])

  // Filter pools by search
  const filterPools = (poolList: PoolData[]) => {
    if (!searchQuery) return poolList
    const query = searchQuery.toLowerCase()
    return poolList.filter(p => 
      p.token0.symbol.toLowerCase().includes(query) || 
      p.token1.symbol.toLowerCase().includes(query)
    )
  }

  // Sort pools
  const sortPools = (poolList: PoolData[]) => {
    return [...poolList].sort((a, b) => {
      let aVal = 0, bVal = 0
      if (sortBy === 'tvl') {
        aVal = calculatePoolTVL(a, chainId)
        bVal = calculatePoolTVL(b, chainId)
      } else if (sortBy === 'volume24h') {
        aVal = calculatePoolVolume(a, chainId) * 0.08
        bVal = calculatePoolVolume(b, chainId) * 0.08
      } else if (sortBy === 'apr') {
        const aTvl = calculatePoolTVL(a, chainId)
        const bTvl = calculatePoolTVL(b, chainId)
        aVal = calculateAPR(calculatePoolVolume(a, chainId) * 0.08, aTvl)
        bVal = calculateAPR(calculatePoolVolume(b, chainId) * 0.08, bTvl)
      }
      return sortDirection === 'desc' ? bVal - aVal : aVal - bVal
    })
  }

  // Handle sort
  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortDirection(d => d === 'desc' ? 'asc' : 'desc')
    } else {
      setSortBy(field)
      setSortDirection('desc')
    }
  }

  // Handle expand pool
  const handleExpandPool = (poolId: string) => {
    setExpandedPoolId(prev => prev === poolId ? null : poolId)
  }

  // Handle add liquidity
  const handleAddLiquidity = (_pool?: PoolData) => {
    setShowAddModal(true)
  }

  // Process pools
  const filteredPools = sortPools(filterPools(pools))

  return (
    <div className="w-full max-w-7xl mx-auto px-4">
      {/* Stats Dashboard */}
      <StatsDashboard 
        totalTVL={totalTVL} 
        volume24h={volume24h} 
        fees24h={fees24h} 
        lpCount={totalLPCount} 
      />

      {/* Control Bar */}
      <ControlBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortBy={sortBy}
        onSortChange={handleSort}
        onAddLiquidity={() => handleAddLiquidity()}
        onRefresh={refresh}
        isRefreshing={isRefreshing}
      />

      {/* Content */}
      {loading ? (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-16 text-center border border-white/10">
          <RefreshCw className="w-10 h-10 text-cyan-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading pools...</p>
        </div>
      ) : activeTab === 'myPositions' ? (
        !isConnected ? (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-16 text-center border border-white/10">
            <Wallet className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-white text-xl font-semibold mb-2">Connect your wallet</p>
            <p className="text-gray-500">Connect to view your liquidity positions</p>
          </div>
        ) : positions.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {positions.map((pos, i) => (
              <PositionCard 
                key={i} 
                position={pos} 
                onAdd={() => handleAddLiquidity(pos.pair)} 
                onRemove={() => { setSelectedPosition(pos); setShowRemoveModal(true) }}
                chainId={chainId}
              />
            ))}
          </div>
        ) : (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-16 text-center border border-white/10">
            <TrendingUp className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-white text-xl font-semibold mb-2">No positions yet</p>
            <p className="text-gray-500 mb-6">Add liquidity to start earning fees</p>
            <button 
              onClick={() => handleAddLiquidity()} 
              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white rounded-xl font-semibold transition-all shadow-lg shadow-emerald-500/25"
            >
              Add Liquidity
            </button>
          </div>
        )
      ) : filteredPools.length > 0 ? (
        <PoolTable
          pools={filteredPools}
          sortBy={sortBy}
          sortDirection={sortDirection}
          onSort={handleSort}
          expandedPoolId={expandedPoolId}
          onExpandPool={handleExpandPool}
          onAddLiquidity={handleAddLiquidity}
          chainId={chainId}
        />
      ) : (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-16 text-center border border-white/10">
          <Layers className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-white text-xl font-semibold mb-2">No pools found</p>
          <p className="text-gray-500">Try a different search term</p>
        </div>
      )}

      {/* Modals */}
      {showAddModal && <AddLiquidityModal onClose={() => setShowAddModal(false)} onSuccess={refresh} />}
      {showRemoveModal && selectedPosition && (
        <RemoveLiquidityModal 
          position={selectedPosition} 
          onClose={() => { setShowRemoveModal(false); setSelectedPosition(null) }} 
          onSuccess={refresh} 
        />
      )}
    </div>
  )
}
