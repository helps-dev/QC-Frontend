import { useState } from 'react'
import { useChainId } from 'wagmi'
import { useFactoryStats, usePairs, useRecentSwaps } from '../hooks/useSubgraph'
import { getContracts } from '../config/contracts'
import { CHAIN_IDS, getNetworkName } from '../config/chains'
import {
  BarChart3, Activity, Layers, ArrowUpRight, Copy, Check,
  ExternalLink, RefreshCw, Zap, TrendingUp, Users, Clock, Box, FileCode
} from './Icons3D'

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

function getTokenLogo(symbol: string): string {
  return TOKEN_LOGOS[symbol.toUpperCase()] || ''
}

function TokenIcon({ symbol, size = 24 }: { symbol: string; size?: number }) {
  const [err, setErr] = useState(false)
  const logo = getTokenLogo(symbol)
  if (!logo || err) {
    return (
      <div className="bg-gradient-to-br from-purple-500/30 to-indigo-500/30 rounded-full flex items-center justify-center border border-white/10"
        style={{ width: size, height: size, fontSize: size * 0.38 }}>
        <span className="text-white font-bold">{symbol.slice(0, 2)}</span>
      </div>
    )
  }
  return <img src={logo} alt={symbol} className="rounded-full" style={{ width: size, height: size }} onError={() => setErr(true)} />
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      className="p-1 hover:bg-white/10 rounded transition-colors">
      {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-gray-500" />}
    </button>
  )
}

const short = (a: string) => `${a.slice(0, 6)}...${a.slice(-4)}`

function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(2)}K`
  if (n >= 1) return `$${n.toFixed(2)}`
  return `$${n.toFixed(4)}`
}

function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(2)}K`
  if (n >= 1) return n.toFixed(2)
  return n.toFixed(4)
}

function timeAgo(ts: string): string {
  const diff = Math.floor(Date.now() / 1000) - parseInt(ts)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

const NATIVE_PRICE = 0.42

export function Stats() {
  const chainId = useChainId()
  const contracts = getContracts(chainId)
  const { data: factory, isLoading, refetch: refetchFactory } = useFactoryStats()
  const { data: pairs, refetch: refetchPairs } = usePairs()
  const { data: swaps, refetch: refetchSwaps } = useRecentSwaps()
  const [refreshing, setRefreshing] = useState(false)

  const isMega = chainId === CHAIN_IDS.MEGAETH
  const networkName = getNetworkName(chainId)
  const nativeSymbol = isMega ? 'WETH' : 'WMON'
  const tokenSymbol = isMega ? 'MXA' : 'QUICK'
  const explorer = isMega ? 'https://megaeth.blockscout.com' : 'https://monadscan.com'

  const refresh = async () => {
    setRefreshing(true)
    await Promise.all([refetchFactory(), refetchPairs(), refetchSwaps()])
    setTimeout(() => setRefreshing(false), 500)
  }

  const totalTVL = (pairs || []).reduce((s: number, p: any) => {
    return s + ((parseFloat(p.reserve0) || 0) + (parseFloat(p.reserve1) || 0)) * NATIVE_PRICE * 0.5
  }, 0)

  const totalVolume = (pairs || []).reduce((s: number, p: any) => {
    return s + ((parseFloat(p.volumeToken0) || 0) + (parseFloat(p.volumeToken1) || 0)) * NATIVE_PRICE * 0.5
  }, 0)

  const totalLPs = (pairs || []).reduce((s: number, p: any) => s + (parseInt(p.liquidityProviderCount) || 0), 0)
  const totalTxns = Number(factory?.txCount || 0)

  const contractList = [
    { label: 'Factory', address: contracts.FACTORY, icon: Box },
    { label: 'Router', address: contracts.ROUTER, icon: ArrowUpRight },
    { label: nativeSymbol, address: contracts.WETH, icon: Activity },
    { label: tokenSymbol, address: contracts.NATIVE_TOKEN, icon: Zap },
    { label: 'MasterChef', address: contracts.MASTERCHEF, icon: Layers },
    { label: 'ETH Staking', address: contracts.NATIVE_STAKING, icon: TrendingUp },
    { label: 'gMEXA Staking', address: contracts.TOKEN_STAKING, icon: FileCode },
    { label: 'IDO Factory', address: contracts.IDO_FACTORY, icon: BarChart3 },
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 gap-3">
        <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-gray-400 text-sm">Loading analytics...</span>
      </div>
    )
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/20 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Protocol Analytics</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                </span>
                <span className="text-xs text-gray-500">{networkName} — Live data</span>
              </div>
            </div>
          </div>
        </div>
        <button onClick={refresh} disabled={refreshing}
          className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs text-gray-400 hover:text-white transition-all">
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Overview Stats - 4 cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Value Locked', value: fmt(totalTVL), icon: TrendingUp, color: 'purple', sub: `${factory?.pairCount || 0} pools` },
          { label: 'Total Volume', value: fmt(totalVolume), icon: BarChart3, color: 'blue', sub: `${totalTxns.toLocaleString()} txns` },
          { label: 'Trading Pairs', value: String(factory?.pairCount || 0), icon: Layers, color: 'emerald', sub: 'Active pairs' },
          { label: 'LP Providers', value: String(totalLPs), icon: Users, color: 'amber', sub: 'Unique providers' },
        ].map((s, i) => {
          const colors: Record<string, string> = {
            purple: 'from-purple-500/15 to-purple-600/5 border-purple-500/10 hover:border-purple-500/25',
            blue: 'from-blue-500/15 to-blue-600/5 border-blue-500/10 hover:border-blue-500/25',
            emerald: 'from-emerald-500/15 to-emerald-600/5 border-emerald-500/10 hover:border-emerald-500/25',
            amber: 'from-amber-500/15 to-amber-600/5 border-amber-500/10 hover:border-amber-500/25',
          }
          const iconColors: Record<string, string> = {
            purple: 'text-purple-400 bg-purple-500/15',
            blue: 'text-blue-400 bg-blue-500/15',
            emerald: 'text-emerald-400 bg-emerald-500/15',
            amber: 'text-amber-400 bg-amber-500/15',
          }
          return (
            <div key={i} className={`relative overflow-hidden bg-gradient-to-br ${colors[s.color]} border rounded-2xl p-4 transition-all duration-300`}>
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${iconColors[s.color]}`}>
                  <s.icon className="w-3.5 h-3.5" />
                </div>
                <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">{s.label}</span>
              </div>
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p className="text-[10px] text-gray-600 mt-1">{s.sub}</p>
            </div>
          )
        })}
      </div>

      {/* Main Content: 3 columns on desktop */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Trading Pairs - takes 1 col */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-white/[0.04] flex items-center justify-between">
            <h2 className="text-xs font-semibold text-white flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              Trading Pairs
            </h2>
            <span className="text-[10px] text-gray-600 bg-white/5 px-2 py-0.5 rounded-full">{(pairs || []).length}</span>
          </div>
          <div className="divide-y divide-white/[0.03] overflow-y-auto max-h-[340px] flex-1">
            {(pairs || []).length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-600 text-xs">No pairs found</div>
            ) : (
              (pairs || []).slice(0, 12).map((pair: any) => {
                const r0 = parseFloat(pair.reserve0) || 0
                const r1 = parseFloat(pair.reserve1) || 0
                const tvl = (r0 + r1) * NATIVE_PRICE * 0.5
                const txCount = parseInt(pair.txCount) || 0
                return (
                  <div key={pair.id} className="px-4 py-2.5 hover:bg-white/[0.02] transition-colors flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex -space-x-1.5 shrink-0">
                        <TokenIcon symbol={pair.token0.symbol} size={24} />
                        <TokenIcon symbol={pair.token1.symbol} size={24} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-white truncate">{pair.token0.symbol}/{pair.token1.symbol}</p>
                        <p className="text-[10px] text-gray-600">{txCount} txns</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[11px] text-white font-mono">{fmt(tvl)}</p>
                      <p className="text-[9px] text-gray-600">TVL</p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Recent Swaps - takes 1 col */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-white/[0.04] flex items-center justify-between">
            <h2 className="text-xs font-semibold text-white flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              Recent Swaps
            </h2>
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
              <span className="text-[10px] text-gray-600">Live</span>
            </div>
          </div>
          <div className="divide-y divide-white/[0.03] overflow-y-auto max-h-[340px] flex-1">
            {(swaps || []).length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-600 text-xs">No swaps yet</div>
            ) : (
              (swaps || []).map((swap: any) => {
                const a0In = parseFloat(swap.amount0In) || 0
                const a1In = parseFloat(swap.amount1In) || 0
                const a0Out = parseFloat(swap.amount0Out) || 0
                const a1Out = parseFloat(swap.amount1Out) || 0
                const fromSym = a0In > 0 ? swap.pair.token0.symbol : swap.pair.token1.symbol
                const toSym = a0In > 0 ? swap.pair.token1.symbol : swap.pair.token0.symbol
                const fromAmt = a0In > 0 ? a0In : a1In
                const toAmt = a0In > 0 ? a1Out : a0Out
                return (
                  <div key={swap.id} className="px-4 py-2.5 hover:bg-white/[0.02] transition-colors flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-6 h-6 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                        <ArrowUpRight className="w-3 h-3 text-purple-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-white truncate">
                          <span className="font-medium">{fromSym}</span>
                          <span className="text-gray-600 mx-1">→</span>
                          <span className="font-medium">{toSym}</span>
                        </p>
                        {swap.timestamp && (
                          <p className="text-[10px] text-gray-600 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {timeAgo(swap.timestamp)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[11px] font-mono text-gray-400">{fmtNum(fromAmt)}</p>
                      <p className="text-[10px] font-mono text-emerald-400/80">+{fmtNum(toAmt)}</p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Contracts - takes 1 col */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-white/[0.04] flex items-center justify-between">
            <h2 className="text-xs font-semibold text-white flex items-center gap-2">
              <FileCode className="w-3.5 h-3.5 text-purple-400" />
              Contracts
            </h2>
            <span className="text-[9px] px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded-full">{networkName}</span>
          </div>
          <div className="divide-y divide-white/[0.03] overflow-y-auto max-h-[340px] flex-1">
            {contractList.map((c) => (
              <div key={c.label} className="px-4 py-2.5 hover:bg-white/[0.02] transition-colors flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                    <c.icon className="w-3 h-3 text-gray-500" />
                  </div>
                  <span className="text-xs text-gray-400">{c.label}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <code className="text-[11px] font-mono text-purple-400/80">{short(c.address)}</code>
                  <CopyBtn text={c.address} />
                  <a href={`${explorer}/address/${c.address}`} target="_blank" rel="noopener noreferrer"
                    className="p-1 hover:bg-white/10 rounded transition-colors">
                    <ExternalLink className="w-3 h-3 text-gray-600 hover:text-gray-300" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Protocol Info Footer */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-[10px] text-gray-600 pb-2">
        <span>Swap Fee: 0.5%</span>
        <span className="text-gray-800">·</span>
        <span>LP Fee: 0.4%</span>
        <span className="text-gray-800">·</span>
        <span>Protocol Fee: 0.1%</span>
        <span className="text-gray-800">·</span>
        <span>MexaSwap V2</span>
      </div>
    </div>
  )
}
