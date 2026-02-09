import { Plus, Minus, Eye } from '../Icons3D'
import { PositionData, calculatePoolTVL, formatUSD } from './PoolPage'

// Token Icon Component - Responsive sizes
function TokenIcon({ symbol, size = 32, mobileSize }: { symbol: string; size?: number; mobileSize?: number }) {
  const colors: Record<string, string> = {
    WMON: 'from-purple-500 to-purple-700',
    MON: 'from-purple-400 to-purple-600',
    QUICK: 'from-blue-500 to-cyan-500',
    USDC: 'from-blue-400 to-blue-600',
  }
  const actualMobileSize = mobileSize || size * 0.8
  return (
    <>
      {/* Mobile */}
      <div
        className={`sm:hidden bg-gradient-to-br ${colors[symbol] || 'from-gray-500 to-gray-700'} rounded-full flex items-center justify-center text-white font-bold shadow-lg border-2 border-atlantis-800`}
        style={{ width: actualMobileSize, height: actualMobileSize, fontSize: actualMobileSize * 0.35 }}
      >
        {symbol.slice(0, 2)}
      </div>
      {/* Desktop */}
      <div
        className={`hidden sm:flex bg-gradient-to-br ${colors[symbol] || 'from-gray-500 to-gray-700'} rounded-full items-center justify-center text-white font-bold shadow-lg border-2 border-atlantis-800`}
        style={{ width: size, height: size, fontSize: size * 0.35 }}
      >
        {symbol.slice(0, 2)}
      </div>
    </>
  )
}

function TokenPairIcon({ token0, token1 }: { token0: string; token1: string }) {
  return (
    <div className="flex -space-x-2 sm:-space-x-3">
      <div className="z-10">
        <TokenIcon symbol={token0} size={40} mobileSize={32} />
      </div>
      <div>
        <TokenIcon symbol={token1} size={40} mobileSize={32} />
      </div>
    </div>
  )
}

function formatNum(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(2)}K`
  if (num >= 1) return num.toFixed(4)
  return num.toFixed(6)
}

interface PositionCardProps {
  position: PositionData
  onAdd: () => void
  onRemove: () => void
}

export function PositionCard({
  position,
  onAdd,
  onRemove,
}: PositionCardProps) {
  const lpBalance = parseFloat(position.liquidityTokenBalance)
  const totalSupply = parseFloat(position.pair.totalSupply) || 1
  const sharePercent = (lpBalance / totalSupply) * 100
  const tvl = calculatePoolTVL(position.pair)
  const myValue = tvl * (lpBalance / totalSupply)
  const pooled0 = parseFloat(position.pair.reserve0) * (lpBalance / totalSupply)
  const pooled1 = parseFloat(position.pair.reserve1) * (lpBalance / totalSupply)

  // Calculate APR
  const volume = parseFloat(position.pair.volumeToken0) + parseFloat(position.pair.volumeToken1)
  const apr = tvl > 0 ? ((volume * 0.005 * 365) / tvl) * 100 : 0

  return (
    <div className="glass-card p-3 sm:p-4 md:p-5 hover:border-primary-500/30 transition-all duration-300">
      {/* Header - Stack on mobile, row on desktop */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <TokenPairIcon
            token0={position.pair.token0.symbol}
            token1={position.pair.token1.symbol}
          />
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-white text-base sm:text-lg truncate">
              {position.pair.token0.symbol}/{position.pair.token1.symbol}
            </h3>
            <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1 flex-wrap">
              <span className="text-[10px] sm:text-xs text-gray-400">MexaSwap V2</span>
              <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 bg-atlantis-700/50 text-gray-300 rounded-full">
                0.5% Fee
              </span>
            </div>
          </div>
        </div>

        {/* Value section - inline on mobile */}
        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2">
          <span className="bg-primary-500/20 text-primary-400 px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold order-2 sm:order-1">
            {apr.toFixed(1)}% APR
          </span>
          <div className="order-1 sm:order-2 sm:mt-1">
            <div className="text-lg sm:text-xl font-bold text-white">{formatUSD(myValue)}</div>
            <div className="text-[10px] sm:text-xs text-gray-500 text-right">{sharePercent.toFixed(4)}% share</div>
          </div>
        </div>
      </div>

      {/* Stats Grid - 2 cols on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-3 sm:mb-4">
        <div className="bg-atlantis-800/30 rounded-lg sm:rounded-xl p-2 sm:p-3 border border-atlantis-700/30">
          <p className="text-[10px] sm:text-xs text-gray-400 mb-0.5 sm:mb-1">LP Balance</p>
          <p className="text-white font-semibold text-sm sm:text-base truncate">{formatNum(lpBalance)}</p>
        </div>
        <div className="bg-atlantis-800/30 rounded-lg sm:rounded-xl p-2 sm:p-3 border border-atlantis-700/30">
          <p className="text-[10px] sm:text-xs text-gray-400 mb-0.5 sm:mb-1 truncate">Pooled {position.pair.token0.symbol}</p>
          <p className="text-white font-semibold text-sm sm:text-base truncate">{formatNum(pooled0)}</p>
        </div>
        <div className="bg-atlantis-800/30 rounded-lg sm:rounded-xl p-2 sm:p-3 border border-atlantis-700/30">
          <p className="text-[10px] sm:text-xs text-gray-400 mb-0.5 sm:mb-1 truncate">Pooled {position.pair.token1.symbol}</p>
          <p className="text-white font-semibold text-sm sm:text-base truncate">{formatNum(pooled1)}</p>
        </div>
        <div className="bg-atlantis-800/30 rounded-lg sm:rounded-xl p-2 sm:p-3 border border-atlantis-700/30">
          <p className="text-[10px] sm:text-xs text-gray-400 mb-0.5 sm:mb-1">Pool TVL</p>
          <p className="text-white font-semibold text-sm sm:text-base">{formatUSD(tvl)}</p>
        </div>
      </div>

      {/* Action Buttons - responsive sizing */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <button
          onClick={onAdd}
          className="flex flex-col items-center gap-1 sm:gap-1.5 py-2 sm:py-3 px-2 bg-blue-600/20 hover:bg-blue-600/30 active:bg-blue-600/40 border border-blue-500/30 rounded-lg sm:rounded-xl text-blue-400 hover:text-blue-300 transition-all min-h-[52px] sm:min-h-[60px]"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-[10px] sm:text-xs font-medium">Add</span>
        </button>

        <button
          onClick={onRemove}
          disabled={lpBalance <= 0}
          className="flex flex-col items-center gap-1 sm:gap-1.5 py-2 sm:py-3 px-2 bg-red-600/20 hover:bg-red-600/30 active:bg-red-600/40 border border-red-500/30 rounded-lg sm:rounded-xl text-red-400 hover:text-red-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[52px] sm:min-h-[60px]"
        >
          <Minus className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-[10px] sm:text-xs font-medium">Remove</span>
        </button>

        <a
          href={`https://explorer.monad.xyz/address/${position.pair.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center gap-1 sm:gap-1.5 py-2 sm:py-3 px-2 bg-atlantis-700/30 hover:bg-atlantis-600/30 active:bg-atlantis-500/30 border border-atlantis-600/30 rounded-lg sm:rounded-xl text-gray-400 hover:text-white transition-all min-h-[52px] sm:min-h-[60px]"
        >
          <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-[10px] sm:text-xs font-medium">View</span>
        </a>
      </div>
    </div>
  )
}
