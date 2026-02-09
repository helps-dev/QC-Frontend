import { useState, useEffect, useMemo } from 'react'
import { X, Search, Copy, Check, ExternalLink, AlertCircle, Plus, Loader2 } from './Icons3D'
import { useAccount, useBalance, useReadContract, usePublicClient, useChainId } from 'wagmi'
import { formatUnits, isAddress } from 'viem'
import { getDefaultTokens, getStoredTokens, saveToken, NATIVE_ADDRESS, type Token } from '../config/tokens'
import { ERC20_ABI } from '../config/abis'
import { getExplorerUrl } from '../config/chains'

interface TokenModalProps {
  onSelect: (token: Token) => void
  onClose: () => void
  onImport?: () => void
  excludeToken?: Token
}

function TokenItem({ token, onSelect }: { token: Token; onSelect: (token: Token) => void }) {
  const { address } = useAccount()
  const chainId = useChainId()
  const [copied, setCopied] = useState(false)
  
  const { data: nativeBalance } = useBalance({ address, query: { enabled: token.isNative } })
  const { data: tokenBalance } = useReadContract({
    address: token.address, abi: ERC20_ABI, functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !token.isNative }
  })

  const balance = token.isNative 
    ? (nativeBalance ? parseFloat(nativeBalance.formatted).toFixed(4) : '0')
    : (tokenBalance ? parseFloat(formatUnits(tokenBalance, token.decimals)).toFixed(4) : '0')

  const copyAddress = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (token.address !== NATIVE_ADDRESS) {
      navigator.clipboard.writeText(token.address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const openExplorer = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (token.address !== NATIVE_ADDRESS) {
      window.open(getExplorerUrl(chainId, token.address), '_blank')
    }
  }

  return (
    <button
      onClick={() => onSelect(token)}
      className="w-full flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl transition-all group"
    >
      {token.logoURI ? (
        <img src={token.logoURI} alt={token.symbol} className="w-9 h-9 rounded-full" />
      ) : (
        <div className="w-9 h-9 bg-gradient-to-br from-purple-500/30 to-indigo-500/30 rounded-full flex items-center justify-center border border-white/10">
          <span className="text-xs font-bold text-white">{token.symbol.slice(0, 2)}</span>
        </div>
      )}
      
      <div className="text-left flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white text-sm">{token.symbol}</span>
          {token.isNative && <span className="text-[9px] px-1.5 py-0.5 bg-purple-500/20 text-purple-400 rounded">Native</span>}
        </div>
        <div className="text-xs text-gray-500 truncate">{token.name}</div>
      </div>
      
      <div className="text-right flex items-center gap-2">
        <span className="text-sm text-white font-medium">{balance}</span>
        {token.address !== NATIVE_ADDRESS && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={copyAddress} className="p-1 hover:bg-white/10 rounded" title="Copy">
              {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-gray-400" />}
            </button>
            <button onClick={openExplorer} className="p-1 hover:bg-white/10 rounded" title="Explorer">
              <ExternalLink className="w-3 h-3 text-gray-400" />
            </button>
          </div>
        )}
      </div>
    </button>
  )
}

export function TokenModal({ onSelect, onClose, excludeToken }: TokenModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [customTokens, setCustomTokens] = useState<Token[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [foundToken, setFoundToken] = useState<Token | null>(null)
  const [searchError, setSearchError] = useState('')
  const publicClient = usePublicClient()
  const chainId = useChainId()
  
  useEffect(() => { setCustomTokens(getStoredTokens(chainId)) }, [chainId])
  
  const defaultTokens = getDefaultTokens(chainId)
  const allTokens = [...defaultTokens, ...customTokens]
  
  const filteredTokens = allTokens.filter(token => {
    if (excludeToken && token.address.toLowerCase() === excludeToken.address.toLowerCase()) return false
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return token.symbol.toLowerCase().includes(q) || token.name.toLowerCase().includes(q) || token.address.toLowerCase().includes(q)
  })
  
  // Search by address
  useEffect(() => {
    const fetchToken = async () => {
      if (!searchQuery || !isAddress(searchQuery) || !publicClient) {
        setFoundToken(null)
        setSearchError('')
        return
      }
      
      if (allTokens.find(t => t.address.toLowerCase() === searchQuery.toLowerCase())) {
        setFoundToken(null)
        return
      }
      
      setIsSearching(true)
      setSearchError('')
      
      try {
        const [symbol, decimals] = await Promise.all([
          publicClient.readContract({ address: searchQuery as `0x${string}`, abi: ERC20_ABI, functionName: 'symbol' }),
          publicClient.readContract({ address: searchQuery as `0x${string}`, abi: ERC20_ABI, functionName: 'decimals' }),
        ])
        
        let name = symbol as string
        try {
          const n = await publicClient.readContract({
            address: searchQuery as `0x${string}`,
            abi: [{ inputs: [], name: 'name', outputs: [{ type: 'string' }], stateMutability: 'view', type: 'function' }] as const,
            functionName: 'name',
          })
          name = n as string
        } catch {}
        
        setFoundToken({ address: searchQuery as `0x${string}`, symbol: symbol as string, name, decimals: Number(decimals), isNative: false })
      } catch {
        setSearchError('Invalid token address')
        setFoundToken(null)
      } finally {
        setIsSearching(false)
      }
    }
    
    const t = setTimeout(fetchToken, 400)
    return () => clearTimeout(t)
  }, [searchQuery, publicClient, allTokens])
  
  const handleImport = () => {
    if (foundToken) {
      saveToken(foundToken, chainId)
      setCustomTokens(prev => [...prev, foundToken])
      onSelect(foundToken)
    }
  }
  
  const quickTokens = useMemo(() => defaultTokens.slice(0, 4), [defaultTokens])

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#12121a] border border-white/10 rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-white/5">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-base font-semibold text-white">Select Token</h3>
            <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg transition-all">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name or paste address"
              className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm placeholder-gray-500 outline-none focus:border-purple-500/50"
              autoFocus
            />
          </div>
        </div>

        {/* Quick Select */}
        <div className="px-4 py-2.5 border-b border-white/5">
          <div className="flex gap-2 flex-wrap">
            {quickTokens.map(token => (
              <button
                key={token.address}
                onClick={() => onSelect(token)}
                disabled={excludeToken?.address.toLowerCase() === token.address.toLowerCase()}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-purple-500/30 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {token.logoURI ? (
                  <img src={token.logoURI} alt={token.symbol} className="w-5 h-5 rounded-full" />
                ) : (
                  <div className="w-5 h-5 bg-purple-500/20 rounded-full flex items-center justify-center">
                    <span className="text-[8px] font-bold text-purple-400">{token.symbol.slice(0, 1)}</span>
                  </div>
                )}
                <span className="text-xs font-medium text-white">{token.symbol}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Token List */}
        <div className="flex-1 overflow-y-auto p-2">
          {/* Loading */}
          {isSearching && (
            <div className="flex items-center justify-center py-6 gap-2">
              <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
              <span className="text-gray-400 text-sm">Searching...</span>
            </div>
          )}
          
          {/* Error */}
          {searchError && (
            <div className="mx-2 mb-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span className="text-red-400 text-xs">{searchError}</span>
            </div>
          )}
          
          {/* Found Token - Import Card */}
          {foundToken && (
            <div className="mx-2 mb-2 p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-purple-400">{foundToken.symbol.slice(0, 2)}</span>
                  </div>
                  <div>
                    <div className="font-semibold text-white text-sm">{foundToken.symbol}</div>
                    <div className="text-[10px] text-gray-500">{foundToken.name}</div>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded">New</span>
              </div>
              <div className="flex items-start gap-2 mb-2 p-2 bg-amber-500/10 rounded-lg">
                <AlertCircle className="w-3 h-3 text-amber-400 mt-0.5 flex-shrink-0" />
                <p className="text-[10px] text-amber-200/80">Only import tokens you trust. Anyone can create a token with any name.</p>
              </div>
              <button
                onClick={handleImport}
                className="w-full py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-white font-medium text-sm transition-all flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Import Token
              </button>
            </div>
          )}
          
          {/* Token List */}
          {filteredTokens.length > 0 ? (
            filteredTokens.map(token => (
              <TokenItem key={token.address} token={token} onSelect={onSelect} />
            ))
          ) : !foundToken && !isSearching && (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm">No tokens found</p>
              <p className="text-gray-600 text-xs mt-1">Paste a token address to import</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
