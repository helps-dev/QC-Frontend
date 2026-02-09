import { useState } from 'react'
import { usePublicClient, useChainId } from 'wagmi'
import { type Token, saveToken } from '../config/tokens'
import { ERC20_ABI } from '../config/abis'

interface Props {
  onClose: () => void
  onTokenImported: (token: Token) => void
}

export function TokenImportModal({ onClose, onTokenImported }: Props) {
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tokenInfo, setTokenInfo] = useState<Token | null>(null)
  
  const publicClient = usePublicClient()
  const chainId = useChainId()

  const handleSearch = async () => {
    if (!address || !address.startsWith('0x') || address.length !== 42) {
      setError('Invalid address format')
      return
    }

    setLoading(true)
    setError('')
    setTokenInfo(null)

    try {
      const [symbol, decimals] = await Promise.all([
        publicClient?.readContract({
          address: address as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'symbol',
        }),
        publicClient?.readContract({
          address: address as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'decimals',
        }),
      ])

      const token: Token = {
        address: address as `0x${string}`,
        symbol: symbol as string,
        name: symbol as string,
        decimals: Number(decimals),
        isNative: false
      }
      
      setTokenInfo(token)
    } catch {
      setError('Could not find token. Make sure the address is a valid ERC20 token on Monad.')
    } finally {
      setLoading(false)
    }
  }

  const handleImport = () => {
    if (tokenInfo) {
      saveToken(tokenInfo, chainId)
      onTokenImported(tokenInfo)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-display font-bold gradient-text">Import Token</h2>
          <button 
            onClick={onClose} 
            className="w-8 h-8 bg-atlantis-800 hover:bg-atlantis-700 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-all"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Token Contract Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="0x..."
              className="input-field"
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm bg-red-500/10 p-3 rounded-xl border border-red-500/20">
              {error}
            </div>
          )}

          {tokenInfo && (
            <div className="bg-atlantis-800/30 rounded-xl p-4 border border-atlantis-700/30">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {tokenInfo.symbol.charAt(0)}
                </div>
                <div>
                  <div className="text-white font-semibold text-lg">{tokenInfo.symbol}</div>
                  <div className="text-gray-400 text-sm">{tokenInfo.name}</div>
                  <div className="text-gray-500 text-xs">Decimals: {tokenInfo.decimals}</div>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            {!tokenInfo ? (
              <button
                onClick={handleSearch}
                disabled={loading || !address}
                className="flex-1 py-3 gradient-button font-semibold"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Searching...
                  </span>
                ) : 'Search Token'}
              </button>
            ) : (
              <button
                onClick={handleImport}
                className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 rounded-xl font-semibold text-white transition-all hover:shadow-glow"
              >
                Import {tokenInfo.symbol}
              </button>
            )}
          </div>

          <div className="text-center text-gray-500 text-xs">
            ⚠️ Only import tokens you trust. Anyone can create a token with any name.
          </div>
        </div>
      </div>
    </div>
  )
}
