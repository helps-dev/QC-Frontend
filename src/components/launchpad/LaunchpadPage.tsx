import { useState, useEffect } from 'react'
import { useAccount, useReadContract, usePublicClient, useChainId } from 'wagmi'
import { formatUnits, type Address } from 'viem'
import { IDOCard } from './IDOCard'
import { IDODetailPage } from './IDODetailPage'
import { CreateIDOModal } from './CreateIDOModal'
import { IDO_FACTORY_ABI, getIDOPoolABI, type IDOInfo } from '../../hooks/useIDOFactory'
import { getContracts } from '../../config/contracts'
import { getNativeToken } from '../../config/tokens'

type FilterType = 'all' | 'live' | 'upcoming' | 'ended'

export interface ExtendedIDO extends IDOInfo {
  totalCommitted: string
  totalParticipants: number
  status: number
  tokensForSale: string
  tokenPrice: string
  overflowPercent: number
}

function Icon3DWrapper({ gradient, glow, children, size = 48 }: { gradient: string; glow: string; children: React.ReactNode; size?: number }) {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <div className={`absolute inset-0 rounded-2xl ${glow} blur-xl opacity-50`} />
      <div className={`relative w-full h-full rounded-2xl ${gradient} p-[1.5px] shadow-2xl`}>
        <div className="w-full h-full rounded-[14px] bg-[#0c0c18]/80 backdrop-blur-xl flex items-center justify-center">{children}</div>
      </div>
    </div>
  )
}

function RocketIcon3D() {
  return (
    <Icon3DWrapper gradient="bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500" glow="bg-purple-500">
      <svg viewBox="0 0 32 32" fill="none" className="w-6 h-6">
        <path d="M16 4c0 0-8 5.5-8 13 0 2.8 1.2 5 3 6.5l2-3.5h6l2 3.5c1.8-1.5 3-3.7 3-6.5 0-7.5-8-13-8-13z" fill="url(#rk)" />
        <circle cx="16" cy="13" r="2.5" fill="white" opacity="0.9" />
        <defs><linearGradient id="rk" x1="8" y1="4" x2="24" y2="24"><stop stopColor="#c084fc" /><stop offset="1" stopColor="#e879f9" /></linearGradient></defs>
      </svg>
    </Icon3DWrapper>
  )
}

function TrendIcon3D() {
  return (
    <Icon3DWrapper gradient="bg-gradient-to-br from-emerald-400 to-teal-500" glow="bg-emerald-500" size={44}>
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="url(#tg)" strokeWidth="2.5" strokeLinecap="round">
        <path d="M22 7l-8.5 8.5-5-5L2 17" /><path d="M16 7h6v6" />
        <defs><linearGradient id="tg" x1="2" y1="7" x2="22" y2="17"><stop stopColor="#6ee7b7" /><stop offset="1" stopColor="#ffffff" /></linearGradient></defs>
      </svg>
    </Icon3DWrapper>
  )
}

function UsersIcon3D() {
  return (
    <Icon3DWrapper gradient="bg-gradient-to-br from-blue-400 to-indigo-500" glow="bg-blue-500" size={44}>
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="white" strokeWidth="2" strokeLinecap="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
      </svg>
    </Icon3DWrapper>
  )
}

function PoolIcon3D() {
  return (
    <Icon3DWrapper gradient="bg-gradient-to-br from-purple-400 to-pink-500" glow="bg-pink-500" size={44}>
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="white" strokeWidth="2" strokeLinecap="round">
        <rect x="3" y="3" width="18" height="18" rx="3" /><path d="M12 8v8M8 12h8" />
      </svg>
    </Icon3DWrapper>
  )
}

function BoltIcon3D() {
  return (
    <Icon3DWrapper gradient="bg-gradient-to-br from-amber-400 to-orange-500" glow="bg-amber-500" size={44}>
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
        <path d="M13 2L3 14h9l-1 10 10-12h-9l1-10z" fill="url(#bl)" />
        <defs><linearGradient id="bl" x1="3" y1="2" x2="21" y2="24"><stop stopColor="#fde68a" /><stop offset="1" stopColor="#ffffff" /></linearGradient></defs>
      </svg>
    </Icon3DWrapper>
  )
}

export function LaunchpadPage() {
  const { address } = useAccount()
  const chainId = useChainId()
  const contracts = getContracts(chainId)
  const nativeToken = getNativeToken(chainId)
  const nativeSymbol = nativeToken.symbol
  const publicClient = usePublicClient()
  const [filter, setFilter] = useState<FilterType>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIDO, setSelectedIDO] = useState<ExtendedIDO | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [idos, setIdos] = useState<ExtendedIDO[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const ADMIN_ADDRESS = '0x862345b87b44E71910e1F48aA4BD58DB600e4BEd'.toLowerCase()
  const isAdmin = address?.toLowerCase() === ADMIN_ADDRESS

  const { data: rawIDOs, refetch } = useReadContract({
    address: contracts.IDO_FACTORY, abi: IDO_FACTORY_ABI, functionName: 'getAllIDOs',
  })

  useEffect(() => {
    async function fetchPoolDetails() {
      if (!rawIDOs || !Array.isArray(rawIDOs) || !publicClient) { setIsLoading(false); return }
      const extendedIDOs: ExtendedIDO[] = []
      for (const raw of rawIDOs) {
        const ido = raw as { poolAddress: Address; saleToken: Address; creator: Address; name: string; hardCap: bigint; softCap: bigint; startTime: bigint; endTime: bigint; poolType: number; createdAt: bigint; isActive: boolean }
        try {
          const poolABI = getIDOPoolABI(chainId)
          const poolInfo = await publicClient.readContract({ address: ido.poolAddress, abi: poolABI, functionName: 'getPoolInfo' }) as [string, number, number, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint]
          const overflow = await publicClient.readContract({ address: ido.poolAddress, abi: poolABI, functionName: 'getOverflowPercent' }) as bigint
          extendedIDOs.push({
            poolAddress: ido.poolAddress, saleToken: ido.saleToken, creator: ido.creator, name: ido.name,
            hardCap: formatUnits(ido.hardCap, 18), softCap: formatUnits(ido.softCap, 18),
            startTime: Number(ido.startTime), endTime: Number(ido.endTime), poolType: ido.poolType,
            createdAt: Number(ido.createdAt), isActive: ido.isActive,
            totalCommitted: formatUnits(poolInfo[5], 18), totalParticipants: Number(poolInfo[6]),
            status: poolInfo[2], tokensForSale: formatUnits(poolInfo[9], 18),
            tokenPrice: formatUnits(poolInfo[10], 18), overflowPercent: Number(overflow) / 100,
          })
        } catch {
          extendedIDOs.push({
            poolAddress: ido.poolAddress, saleToken: ido.saleToken, creator: ido.creator, name: ido.name,
            hardCap: formatUnits(ido.hardCap, 18), softCap: formatUnits(ido.softCap, 18),
            startTime: Number(ido.startTime), endTime: Number(ido.endTime), poolType: ido.poolType,
            createdAt: Number(ido.createdAt), isActive: ido.isActive,
            totalCommitted: '0', totalParticipants: 0, status: 0, tokensForSale: '0', tokenPrice: '0', overflowPercent: 0,
          })
        }
      }
      setIdos(extendedIDOs)
      setIsLoading(false)
    }
    fetchPoolDetails()
  }, [rawIDOs, publicClient, chainId])

  const filteredIDOs = idos.filter((ido) => {
    const now = Math.floor(Date.now() / 1000)
    if (!ido.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
    switch (filter) {
      case 'live': return now >= ido.startTime && now <= ido.endTime && ido.isActive
      case 'upcoming': return now < ido.startTime && ido.isActive
      case 'ended': return now > ido.endTime || ido.status === 2
      default: return true
    }
  })

  const totalRaised = idos.reduce((sum, ido) => sum + parseFloat(ido.totalCommitted || '0'), 0)
  const totalParticipants = idos.reduce((sum, ido) => sum + (ido.totalParticipants || 0), 0)
  const liveCount = idos.filter(i => { const n = Math.floor(Date.now() / 1000); return n >= i.startTime && n <= i.endTime && i.isActive }).length

  if (selectedIDO) {
    return <IDODetailPage ido={selectedIDO} onBack={() => { setSelectedIDO(null); refetch() }} />
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-2 sm:px-4">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl mb-8">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0e2e] via-[#1e1040] to-[#0f0a1f]" />
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-purple-600/15 rounded-full blur-[100px]" />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-pink-600/10 rounded-full blur-[80px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-violet-600/5 rounded-full blur-[120px]" />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        </div>
        <div className="relative z-10 px-6 sm:px-10 py-10 sm:py-14">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <RocketIcon3D />
                <div className="px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/20">
                  <span className="text-[11px] font-semibold text-purple-300 tracking-wide uppercase">IDO Launchpad</span>
                </div>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3 leading-tight">
                Launch Your Token
                <span className="block bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">on Mexa DEX</span>
              </h1>
              <p className="text-gray-400 text-sm sm:text-base max-w-lg leading-relaxed">Discover and participate in the most promising token launches. Fair allocation with overflow method, vesting protection, and tier-based access.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 lg:w-[380px]">
              <div className="bg-white/[0.04] backdrop-blur-sm rounded-2xl p-4 border border-white/[0.06] hover:border-purple-500/20 transition-colors">
                <div className="mb-2.5"><TrendIcon3D /></div>
                <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider mb-0.5">Total Raised</p>
                <p className="text-lg font-bold text-white">{totalRaised.toFixed(2)} <span className="text-sm text-gray-400">{nativeSymbol}</span></p>
              </div>
              <div className="bg-white/[0.04] backdrop-blur-sm rounded-2xl p-4 border border-white/[0.06] hover:border-blue-500/20 transition-colors">
                <div className="mb-2.5"><UsersIcon3D /></div>
                <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider mb-0.5">Participants</p>
                <p className="text-lg font-bold text-white">{totalParticipants.toLocaleString()}</p>
              </div>
              <div className="bg-white/[0.04] backdrop-blur-sm rounded-2xl p-4 border border-white/[0.06] hover:border-pink-500/20 transition-colors">
                <div className="mb-2.5"><PoolIcon3D /></div>
                <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider mb-0.5">Total Pools</p>
                <p className="text-lg font-bold text-white">{idos.length}</p>
              </div>
              <div className="bg-white/[0.04] backdrop-blur-sm rounded-2xl p-4 border border-white/[0.06] hover:border-amber-500/20 transition-colors">
                <div className="mb-2.5"><BoltIcon3D /></div>
                <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider mb-0.5">Live Now</p>
                <p className="text-lg font-bold text-white">{liveCount} <span className="text-sm text-gray-400">active</span></p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 p-1 bg-white/[0.03] rounded-xl border border-white/[0.06]">
          {(['all', 'live', 'upcoming', 'ended'] as FilterType[]).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all capitalize ${filter === f ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'}`}>
              {f === 'live' && <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />}
              {f}{f === 'all' && ` (${idos.length})`}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <svg viewBox="0 0 24 24" fill="none" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search projects..." className="w-full pl-10 pr-4 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm text-white placeholder-gray-500 outline-none focus:border-purple-500/30 transition-colors" />
          </div>
          {isAdmin && (
            <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-sm font-semibold text-white shadow-lg shadow-purple-500/20 shrink-0">
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
              Create IDO
            </button>
          )}
        </div>
      </div>

      {/* IDO Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-[#161622] rounded-2xl border border-white/[0.06] p-5 animate-pulse">
              <div className="flex items-center gap-3 mb-5"><div className="w-14 h-14 rounded-2xl bg-white/[0.06]" /><div className="flex-1"><div className="h-4 w-24 bg-white/[0.06] rounded mb-2" /><div className="h-3 w-16 bg-white/[0.04] rounded" /></div></div>
              <div className="h-2 bg-white/[0.04] rounded-full mb-4" />
              <div className="grid grid-cols-2 gap-2"><div className="h-16 bg-white/[0.03] rounded-xl" /><div className="h-16 bg-white/[0.03] rounded-xl" /></div>
            </div>
          ))}
        </div>
      ) : filteredIDOs.length === 0 ? (
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-purple-500/10 border border-purple-500/15 mb-5">
            <svg viewBox="0 0 32 32" fill="none" className="w-10 h-10"><path d="M16 4c0 0-8 5.5-8 13 0 2.8 1.2 5 3 6.5l2-3.5h6l2 3.5c1.8-1.5 3-3.7 3-6.5 0-7.5-8-13-8-13z" fill="url(#emp)" opacity="0.3" /><defs><linearGradient id="emp" x1="8" y1="4" x2="24" y2="24"><stop stopColor="#c084fc" /><stop offset="1" stopColor="#e879f9" /></linearGradient></defs></svg>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No IDO Pools Found</h3>
          <p className="text-gray-500 text-sm max-w-sm mx-auto">{searchQuery ? `No results for "${searchQuery}".` : 'No IDO pools yet. Check back soon.'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredIDOs.map((ido) => (<IDOCard key={ido.poolAddress} ido={ido} onSelect={() => setSelectedIDO(ido)} />))}
        </div>
      )}

      {/* How It Works */}
      <div className="mt-12 mb-8">
        <div className="text-center mb-8"><h2 className="text-2xl font-bold text-white mb-2">How It Works</h2><p className="text-gray-500 text-sm">Simple steps to participate in token launches</p></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { step: '01', title: 'Stake MXA', desc: 'Stake MXA tokens to unlock tier access and higher allocations', icon: '\u{1F512}', color: 'from-purple-500/10 to-purple-500/5', border: 'border-purple-500/10' },
            { step: '02', title: 'Choose IDO', desc: 'Browse upcoming launches and select projects you believe in', icon: '\u{1F3AF}', color: 'from-blue-500/10 to-blue-500/5', border: 'border-blue-500/10' },
            { step: '03', title: 'Contribute', desc: 'Deposit during the sale period. Overflow method ensures fairness', icon: '\u{26A1}', color: 'from-pink-500/10 to-pink-500/5', border: 'border-pink-500/10' },
            { step: '04', title: 'Claim Tokens', desc: '20% at TGE, remaining vested over 180 days for price stability', icon: '\u{1F381}', color: 'from-emerald-500/10 to-emerald-500/5', border: 'border-emerald-500/10' },
          ].map((item) => (
            <div key={item.step} className={`relative bg-gradient-to-br ${item.color} rounded-2xl p-5 border ${item.border} group hover:border-white/10 transition-all`}>
              <div className="absolute top-4 right-4 text-3xl font-black text-white/[0.04] group-hover:text-white/[0.06] transition-colors">{item.step}</div>
              <div className="text-2xl mb-3">{item.icon}</div>
              <h3 className="text-sm font-bold text-white mb-1.5">{item.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {showCreateModal && <CreateIDOModal onClose={() => { setShowCreateModal(false); refetch() }} />}
    </div>
  )
}
