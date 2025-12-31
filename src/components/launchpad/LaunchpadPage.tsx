import { useState, useEffect } from 'react'
import { useAccount, useReadContract, usePublicClient } from 'wagmi'
import { Rocket, TrendingUp, Users, Search, Zap, Award } from 'lucide-react'
import { formatUnits, type Address } from 'viem'
import { IDOCard } from './IDOCard'
import { IDODetailPage } from './IDODetailPage'
import { CreateIDOModal } from './CreateIDOModal'
import { TierStakingCard } from './TierStakingCard'
import { IDO_FACTORY_ADDRESS, IDO_FACTORY_ABI, IDO_POOL_ABI, type IDOInfo } from '../../hooks/useIDOFactory'

type FilterType = 'all' | 'live' | 'upcoming' | 'ended'

// Extended IDO data with pool details
export interface ExtendedIDO extends IDOInfo {
  totalCommitted: string
  totalParticipants: number
  status: number
  tokensForSale: string
  tokenPrice: string
  overflowPercent: number
}

export function LaunchpadPage() {
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()
  const [filter, setFilter] = useState<FilterType>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIDO, setSelectedIDO] = useState<ExtendedIDO | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showTierCard, setShowTierCard] = useState(false)
  const [idos, setIdos] = useState<ExtendedIDO[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Admin address - only this address can create IDOs
  const ADMIN_ADDRESS = '0x862345b87b44E71910e1F48aA4BD58DB600e4BEd'.toLowerCase()
  const isAdmin = address?.toLowerCase() === ADMIN_ADDRESS

  const { data: rawIDOs, refetch } = useReadContract({
    address: IDO_FACTORY_ADDRESS,
    abi: IDO_FACTORY_ABI,
    functionName: 'getAllIDOs',
  })

  const { data: platformFee } = useReadContract({
    address: IDO_FACTORY_ADDRESS,
    abi: IDO_FACTORY_ABI,
    functionName: 'platformFee',
  })

  const { data: creationFee } = useReadContract({
    address: IDO_FACTORY_ADDRESS,
    abi: IDO_FACTORY_ABI,
    functionName: 'creationFeeMON',
  })

  // Fetch pool details for each IDO
  useEffect(() => {
    async function fetchPoolDetails() {
      if (!rawIDOs || !Array.isArray(rawIDOs) || !publicClient) {
        setIsLoading(false)
        return
      }

      const extendedIDOs: ExtendedIDO[] = []
      
      for (const raw of rawIDOs) {
        const ido = raw as {
          poolAddress: Address; saleToken: Address; creator: Address; name: string;
          hardCap: bigint; softCap: bigint; startTime: bigint; endTime: bigint;
          poolType: number; createdAt: bigint; isActive: boolean
        }
        
        try {
          const poolInfo = await publicClient.readContract({
            address: ido.poolAddress,
            abi: IDO_POOL_ABI,
            functionName: 'getPoolInfo',
          }) as [string, number, number, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint]

          const overflow = await publicClient.readContract({
            address: ido.poolAddress,
            abi: IDO_POOL_ABI,
            functionName: 'getOverflowPercent',
          }) as bigint

          extendedIDOs.push({
            poolAddress: ido.poolAddress,
            saleToken: ido.saleToken,
            creator: ido.creator,
            name: ido.name,
            hardCap: formatUnits(ido.hardCap, 18),
            softCap: formatUnits(ido.softCap, 18),
            startTime: Number(ido.startTime),
            endTime: Number(ido.endTime),
            poolType: ido.poolType,
            createdAt: Number(ido.createdAt),
            isActive: ido.isActive,
            totalCommitted: formatUnits(poolInfo[5], 18),
            totalParticipants: Number(poolInfo[6]),
            status: poolInfo[2],
            tokensForSale: formatUnits(poolInfo[9], 18),
            tokenPrice: formatUnits(poolInfo[10], 18),
            overflowPercent: Number(overflow) / 100,
          })
        } catch {
          // If pool read fails, add basic info
          extendedIDOs.push({
            poolAddress: ido.poolAddress,
            saleToken: ido.saleToken,
            creator: ido.creator,
            name: ido.name,
            hardCap: formatUnits(ido.hardCap, 18),
            softCap: formatUnits(ido.softCap, 18),
            startTime: Number(ido.startTime),
            endTime: Number(ido.endTime),
            poolType: ido.poolType,
            createdAt: Number(ido.createdAt),
            isActive: ido.isActive,
            totalCommitted: '0',
            totalParticipants: 0,
            status: 0,
            tokensForSale: '0',
            tokenPrice: '0',
            overflowPercent: 0,
          })
        }
      }
      
      setIdos(extendedIDOs)
      setIsLoading(false)
    }

    fetchPoolDetails()
  }, [rawIDOs, publicClient])

  const filteredIDOs = idos.filter((ido) => {
    const now = Math.floor(Date.now() / 1000)
    const matchesSearch = ido.name.toLowerCase().includes(searchQuery.toLowerCase())
    if (!matchesSearch) return false
    switch (filter) {
      case 'live': return now >= ido.startTime && now <= ido.endTime && ido.isActive
      case 'upcoming': return now < ido.startTime && ido.isActive
      case 'ended': return now > ido.endTime || ido.status === 2
      default: return true
    }
  })

  const totalRaised = idos.reduce((sum, ido) => sum + parseFloat(ido.totalCommitted || '0'), 0)
  const totalParticipants = idos.reduce((sum, ido) => sum + (ido.totalParticipants || 0), 0)
  const liveIDOs = idos.filter(ido => {
    const now = Math.floor(Date.now() / 1000)
    return now >= ido.startTime && now <= ido.endTime && ido.isActive
  }).length

  const feePercent = platformFee ? Number(platformFee) / 100 : 2.5
  const creationFeeMON = creationFee ? formatUnits(creationFee, 18) : '1'

  // If an IDO is selected, show the detail page
  if (selectedIDO) {
    return (
      <IDODetailPage 
        ido={selectedIDO} 
        onBack={() => { setSelectedIDO(null); refetch() }} 
      />
    )
  }

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold gradient-text mb-2">🚀 Monic Launchpad</h1>
        <p className="text-gray-400 text-sm sm:text-base px-2">Launchpad IDO with Overflow Method & Tier System</p>
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 mt-2 text-xs">
          <span className="text-yellow-400">Platform Fee: {feePercent}%</span>
          <span className="text-primary-400">Creation Fee: {creationFeeMON} MON</span>
        </div>
      </div>

      {/* Tier Staking Banner */}
      {isConnected && (
        <div className="glass-card p-3 sm:p-4 mb-4 sm:mb-6 border-primary-500/30">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Award className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400 shrink-0" />
              <div>
                <p className="text-white font-semibold text-sm sm:text-base">Tier System</p>
                <p className="text-xs text-gray-400">Stake QUICK for higher allocation</p>
              </div>
            </div>
            <button onClick={() => setShowTierCard(!showTierCard)} className="w-full sm:w-auto px-4 py-2 bg-primary-500/20 hover:bg-primary-500/30 rounded-lg text-primary-400 text-sm transition-all">
              {showTierCard ? 'Hide' : 'View Tiers'}
            </button>
          </div>
        </div>
      )}

      {showTierCard && <TierStakingCard />}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-6 sm:mb-8">
        <div className="glass-card p-3 sm:p-4">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1"><TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-400" /><p className="text-[10px] sm:text-xs text-gray-400">Total Committed</p></div>
          <p className="text-base sm:text-xl font-bold text-white truncate">{totalRaised.toFixed(2)} MON</p>
        </div>
        <div className="glass-card p-3 sm:p-4">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1"><Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400" /><p className="text-[10px] sm:text-xs text-gray-400">Participants</p></div>
          <p className="text-base sm:text-xl font-bold text-white">{totalParticipants}</p>
        </div>
        <div className="glass-card p-3 sm:p-4">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1"><Rocket className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400" /><p className="text-[10px] sm:text-xs text-gray-400">Total IDOs</p></div>
          <p className="text-base sm:text-xl font-bold text-white">{idos.length}</p>
        </div>
        <div className="glass-card p-3 sm:p-4">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1"><Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-400" /><p className="text-[10px] sm:text-xs text-gray-400">Live Now</p></div>
          <p className="text-base sm:text-xl font-bold text-green-400">{liveIDOs}</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
            <input type="text" placeholder="Search IDOs..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 bg-atlantis-800/50 border border-atlantis-700/50 rounded-xl text-white text-sm sm:text-base placeholder-gray-500 outline-none focus:border-primary-500/50" />
          </div>
          {isConnected && isAdmin && (
            <button onClick={() => setShowCreateModal(true)} className="gradient-button px-4 sm:px-6 py-2.5 sm:py-2 whitespace-nowrap text-sm sm:text-base">
              + Create IDO
            </button>
          )}
        </div>
        <div className="flex gap-1.5 sm:gap-2 p-1 bg-atlantis-800/30 rounded-xl border border-atlantis-700/30 overflow-x-auto hide-scrollbar">
          {(['all', 'live', 'upcoming', 'ended'] as FilterType[]).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all capitalize whitespace-nowrap ${filter === f ? 'bg-gradient-to-r from-primary-500/20 to-secondary-500/20 text-white border border-primary-500/30' : 'text-gray-400 hover:text-white'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="glass-card p-8 sm:p-12 text-center">
          <div className="animate-spin w-10 h-10 sm:w-12 sm:h-12 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-400 text-sm sm:text-base">Loading IDOs...</p>
        </div>
      ) : filteredIDOs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          {filteredIDOs.map((ido) => (<IDOCard key={ido.poolAddress} ido={ido} onSelect={() => setSelectedIDO(ido)} />))}
        </div>
      ) : (
        <div className="glass-card p-8 sm:p-12 text-center">
          <Rocket className="w-12 h-12 sm:w-16 sm:h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">No IDOs Found</h3>
          <p className="text-gray-400 text-sm sm:text-base">{idos.length === 0 ? 'Be the first to create an IDO!' : 'Try a different filter'}</p>
        </div>
      )}

      {showCreateModal && <CreateIDOModal onClose={() => { setShowCreateModal(false); refetch() }} />}
    </div>
  )
}
