import { useFactoryStats, usePairs, useRecentSwaps } from '../hooks/useSubgraph'

export function Stats() {
  const { data: factory, isLoading: factoryLoading } = useFactoryStats()
  const { data: pairs } = usePairs()
  const { data: swaps } = useRecentSwaps()

  if (factoryLoading) {
    return (
      <div className="glass-card p-8">
        <div className="flex items-center justify-center gap-3">
          <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-400">Loading stats...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Protocol Stats */}
      <div className="glass-card p-6">
        <h2 className="text-xl font-display font-bold gradient-text mb-6">📊 Protocol Stats</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="stat-card">
            <div className="text-2xl font-bold gradient-text">{factory?.pairCount || 0}</div>
            <div className="text-xs text-gray-400 mt-1">Trading Pairs</div>
          </div>
          <div className="stat-card">
            <div className="text-2xl font-bold gradient-text">{factory?.txCount || 0}</div>
            <div className="text-xs text-gray-400 mt-1">Transactions</div>
          </div>
          <div className="stat-card">
            <div className="text-2xl font-bold gradient-text">0.5%</div>
            <div className="text-xs text-gray-400 mt-1">Swap Fee</div>
          </div>
          <div className="stat-card">
            <div className="text-2xl font-bold text-primary-400">Monad</div>
            <div className="text-xs text-gray-400 mt-1">Network</div>
          </div>
        </div>
      </div>

      {/* Pairs */}
      {pairs && pairs.length > 0 && (
        <div className="glass-card p-6">
          <h2 className="text-xl font-display font-bold gradient-text mb-6">💎 Pairs</h2>
          <div className="space-y-3">
            {pairs.slice(0, 5).map((pair: any) => (
              <div key={pair.id} className="glass-card-hover p-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-sm font-bold">
                      {pair.token0.symbol.charAt(0)}
                    </div>
                    <div>
                      <div className="text-white font-semibold">
                        {pair.token0.symbol}/{pair.token1.symbol}
                      </div>
                      <div className="text-xs text-gray-500">{pair.txCount} transactions</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-300">
                      {parseFloat(pair.reserve0).toFixed(2)} / {parseFloat(pair.reserve1).toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500">Reserves</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Swaps */}
      {swaps && swaps.length > 0 && (
        <div className="glass-card p-6">
          <h2 className="text-xl font-display font-bold gradient-text mb-6">⚡ Recent Swaps</h2>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {swaps.map((swap: any) => (
              <div key={swap.id} className="flex justify-between items-center bg-atlantis-800/30 rounded-xl p-3 border border-atlantis-700/20">
                <div className="flex items-center gap-2">
                  <span className="text-primary-400">→</span>
                  <span className="text-white text-sm">
                    {swap.pair.token0.symbol} → {swap.pair.token1.symbol}
                  </span>
                </div>
                <div className="text-gray-400 text-sm">
                  {parseFloat(swap.amount0In) > 0 
                    ? parseFloat(swap.amount0In).toFixed(4)
                    : parseFloat(swap.amount1In).toFixed(4)
                  }
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contract Info */}
      <div className="glass-card p-6">
        <h2 className="text-xl font-display font-bold gradient-text mb-6">📋 Contracts</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center bg-atlantis-800/30 rounded-xl p-3 border border-atlantis-700/20">
            <span className="text-gray-400">Factory</span>
            <code className="text-primary-400 font-mono text-xs">0x5D36...e858</code>
          </div>
          <div className="flex justify-between items-center bg-atlantis-800/30 rounded-xl p-3 border border-atlantis-700/20">
            <span className="text-gray-400">Router</span>
            <code className="text-primary-400 font-mono text-xs">0xa45c...9929</code>
          </div>
          <div className="flex justify-between items-center bg-atlantis-800/30 rounded-xl p-3 border border-atlantis-700/20">
            <span className="text-gray-400">WMON</span>
            <code className="text-primary-400 font-mono text-xs">0x3bd3...433A</code>
          </div>
          <div className="flex justify-between items-center bg-atlantis-800/30 rounded-xl p-3 border border-atlantis-700/20">
            <span className="text-gray-400">QUICK</span>
            <code className="text-primary-400 font-mono text-xs">0x6d42...abb5</code>
          </div>
        </div>
      </div>
    </div>
  )
}
