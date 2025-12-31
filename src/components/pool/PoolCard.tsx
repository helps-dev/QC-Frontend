import { Eye, Plus, TrendingUp, Users, BarChart3 } from 'lucide-react'
import { PoolData, calculatePoolTVL, calculatePoolVolume, formatUSD } from './PoolPage'

// Token Icon Component
function TokenIcon({ symbol, size = 32 }: { symbol: string; size?: number }) {
  const colors: Record<string, string> = {
    WMON: 'from-purple-500 to-purple-700',
    MON: 'from-purple-400 to-purple-600',
    QUICK: 'from-blue-500 to-cyan-500',
    USDC: 'from-blue-400 to-blue-600',
  }
  return (
    <div
      className={`bg-gradient-to-br ${colors[symbol] || 'from-gray-500 to-gray-700'} rounded-full flex items-center justify-center text-white font-bold shadow-lg border-2 border-atlantis-800`}
      style={{ width: size, height: size, fontSize: size * 0.35 }}
    >
      {symbol.slice(0, 2)}
    </div>
  )
}

function TokenPairIcon({ token0, token1 }: { token0: string; token1: string }) {
  return (
    <div className="flex -space-x-2">
      <div className="z-10">
        <TokenIcon symbol={token0} size={36} />
      </div>
      <div>
        <TokenIcon symbol={token1} size={36} />
      </div>
    </div>
  )
}

interface PoolCardProps {
  pool: PoolData
  onAddLiquidity: () => void
}

export function PoolCard({ pool, onAddLiquidity }: PoolCardProps) {
  const tvl = calculatePoolTVL(pool)
  const volume = calculatePoolVolume(pool)
  const apr = tvl > 0 ? ((volume * 0.005 * 365) / tvl) * 100 : 0
  const lpCount = parseInt(pool.liquidityProviderCount || '0')

  return (
    <div className="glass-card p-5 hover:border-primary-500/30 transition-all duration-300 group">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <TokenPairIcon token0={pool.token0.symbol} token1={pool.token1.symbol} />
          <div>
            <h3 className="font-bold text-white text-lg group-hover:text-primary-400 transition-colors">
              {pool.token0.symbol}/{pool.token1.symbol}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-gray-400">V2 Pool</span>
              <span className="text-xs px-2 py-0.5 bg-atlantis-700/50 text-gray-300 rounded-full">
                0.5% Fee
              </span>
            </div>
          </div>
        </div>

        <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
          <TrendingUp size={14} />
          {apr.toFixed(1)}% APR
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-atlantis-800/30 rounded-xl p-3 border border-atlantis-700/30">
          <div className="flex items-center gap-1 mb-1">
            <BarChart3 className="w-3 h-3 text-blue-400" />
            <p className="text-xs text-gray-400">TVL</p>
          </div>
          <p className="text-white font-semibold">{formatUSD(tvl)}</p>
        </div>
        <div className="bg-atlantis-800/30 rounded-xl p-3 border border-atlantis-700/30">
          <div className="flex items-center gap-1 mb-1">
            <TrendingUp className="w-3 h-3 text-green-400" />
            <p className="text-xs text-gray-400">Volume 24h</p>
          </div>
          <p className="text-white font-semibold">{formatUSD(volume)}</p>
        </div>
        <div className="bg-atlantis-800/30 rounded-xl p-3 border border-atlantis-700/30">
          <div className="flex items-center gap-1 mb-1">
            <Users className="w-3 h-3 text-purple-400" />
            <p className="text-xs text-gray-400">LPs</p>
          </div>
          <p className="text-white font-semibold">{lpCount}</p>
        </div>
      </div>

      {/* Reserves */}
      <div className="bg-atlantis-900/30 rounded-xl p-3 mb-4 border border-atlantis-700/20">
        <p className="text-xs text-gray-500 mb-2">Pool Reserves</p>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">{pool.token0.symbol}</span>
          <span className="text-white font-medium">
            {parseFloat(pool.reserve0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex justify-between text-sm mt-1">
          <span className="text-gray-400">{pool.token1.symbol}</span>
          <span className="text-white font-medium">
            {parseFloat(pool.reserve1).toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onAddLiquidity}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 gradient-button rounded-xl text-sm font-semibold"
        >
          <Plus className="w-4 h-4" />
          Add Liquidity
        </button>
        <a
          href={`https://explorer.monad.xyz/address/${pool.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-atlantis-700/30 hover:bg-atlantis-600/30 border border-atlantis-600/30 rounded-xl text-gray-400 hover:text-white transition-all"
        >
          <Eye className="w-4 h-4" />
        </a>
      </div>
    </div>
  )
}
