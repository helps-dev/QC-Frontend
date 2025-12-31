import { useState } from 'react'
import { X, Info, ExternalLink, RefreshCw } from 'lucide-react'
import { useAccount } from 'wagmi'
import { isAddress } from 'viem'
import { useIDOFactory } from '../../hooks/useIDOFactory'

interface Props { onClose: () => void }

export function CreateIDOModal({ onClose }: Props) {
  const { isConnected } = useAccount()
  const { createIDO, isProcessing, statusMessage, txHash, creationFee, platformFee } = useIDOFactory()
  
  const [form, setForm] = useState({
    name: '', saleToken: '', hardCap: '100', softCap: '10',
    tokensForSale: '1000000', durationDays: '7', isPrivate: false
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAddress(form.saleToken)) { return }

    const now = Math.floor(Date.now() / 1000)
    const startTime = now + 300 // Start in 5 minutes
    const endTime = now + parseInt(form.durationDays) * 86400

    const result = await createIDO({
      name: form.name,
      saleToken: form.saleToken,
      hardCap: form.hardCap,
      softCap: form.softCap,
      tokensForSale: form.tokensForSale,
      startTime,
      endTime,
      isPrivate: form.isPrivate
    })

    if (result.success) {
      setTimeout(onClose, 3000)
    }
  }

  const tokenPrice = parseFloat(form.hardCap) > 0 && parseFloat(form.tokensForSale) > 0
    ? (parseFloat(form.hardCap) / parseFloat(form.tokensForSale)).toFixed(8)
    : '0'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-card w-full max-w-lg p-6 animate-fade-in max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Create IDO Pool</h2>
          <button onClick={onClose} className="p-2 hover:bg-atlantis-700/50 rounded-lg"><X className="w-5 h-5" /></button>
        </div>

        {/* Info Banner */}
        <div className="bg-primary-500/10 border border-primary-500/30 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-primary-400 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="text-primary-400 font-medium mb-1">Launchpad IDO</p>
              <ul className="text-gray-400 text-xs space-y-1">
                <li>• Overflow Method: Users can deposit more than hard cap</li>
                <li>• Linear Vesting: 20% TGE, 180 days vesting</li>
                <li>• Creation Fee: {creationFee} MON</li>
                <li>• Platform Fee: {platformFee}% of raised funds</li>
              </ul>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-gray-400">Project Name *</label>
            <input type="text" required placeholder="My Token Sale" value={form.name}
              onChange={e => setForm({...form, name: e.target.value})}
              className="w-full mt-1 px-4 py-3 bg-atlantis-800/50 border border-atlantis-700/50 rounded-xl text-white outline-none focus:border-primary-500/50" />
          </div>


          <div>
            <label className="text-sm text-gray-400">Sale Token Address *</label>
            <input type="text" required placeholder="0x..." value={form.saleToken}
              onChange={e => setForm({...form, saleToken: e.target.value})}
              className={`w-full mt-1 px-4 py-3 bg-atlantis-800/50 border rounded-xl text-white outline-none focus:border-primary-500/50 ${form.saleToken && !isAddress(form.saleToken) ? 'border-red-500/50' : 'border-atlantis-700/50'}`} />
            {form.saleToken && !isAddress(form.saleToken) && (
              <p className="text-xs text-red-400 mt-1">Invalid address format</p>
            )}
            <p className="text-xs text-gray-500 mt-1">Token you want to sell in the IDO</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-400">Hard Cap (MON) *</label>
              <input type="number" step="0.1" min="1" required value={form.hardCap}
                onChange={e => setForm({...form, hardCap: e.target.value})}
                className="w-full mt-1 px-4 py-3 bg-atlantis-800/50 border border-atlantis-700/50 rounded-xl text-white outline-none focus:border-primary-500/50" />
              <p className="text-xs text-gray-500 mt-1">Maximum MON to raise</p>
            </div>
            <div>
              <label className="text-sm text-gray-400">Soft Cap (MON) *</label>
              <input type="number" step="0.1" min="1" required value={form.softCap}
                onChange={e => setForm({...form, softCap: e.target.value})}
                className="w-full mt-1 px-4 py-3 bg-atlantis-800/50 border border-atlantis-700/50 rounded-xl text-white outline-none focus:border-primary-500/50" />
              <p className="text-xs text-gray-500 mt-1">Minimum for success</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-400">Tokens For Sale *</label>
              <input type="number" min="1" required value={form.tokensForSale}
                onChange={e => setForm({...form, tokensForSale: e.target.value})}
                className="w-full mt-1 px-4 py-3 bg-atlantis-800/50 border border-atlantis-700/50 rounded-xl text-white outline-none focus:border-primary-500/50" />
            </div>
            <div>
              <label className="text-sm text-gray-400">Duration (Days) *</label>
              <input type="number" min="1" max="30" required value={form.durationDays}
                onChange={e => setForm({...form, durationDays: e.target.value})}
                className="w-full mt-1 px-4 py-3 bg-atlantis-800/50 border border-atlantis-700/50 rounded-xl text-white outline-none focus:border-primary-500/50" />
            </div>
          </div>

          {/* Calculated Token Price */}
          <div className="bg-atlantis-800/30 rounded-lg p-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Token Price</span>
              <span className="text-sm font-semibold text-primary-400">{tokenPrice} MON per token</span>
            </div>
          </div>

          {/* Pool Type */}
          <div className="flex items-center gap-3 p-3 bg-atlantis-800/30 rounded-lg">
            <input type="checkbox" id="isPrivate" checked={form.isPrivate}
              onChange={e => setForm({...form, isPrivate: e.target.checked})}
              className="w-4 h-4 rounded border-atlantis-700 bg-atlantis-800 text-primary-500 focus:ring-primary-500" />
            <label htmlFor="isPrivate" className="text-sm text-gray-300">
              Private Sale (Tier-gated, requires QUICK staking)
            </label>
          </div>

          {/* Status */}
          {statusMessage && (
            <div className={`rounded-lg p-3 text-sm flex items-center gap-2 ${statusMessage.includes('✅') ? 'bg-green-500/10 text-green-400' : statusMessage.includes('❌') ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'}`}>
              {isProcessing && <RefreshCw className="w-4 h-4 animate-spin" />}
              {statusMessage}
            </div>
          )}
          {txHash && (
            <a href={`https://explorer.monad.xyz/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
              className="text-xs text-primary-400 hover:underline flex items-center gap-1">
              View on Explorer <ExternalLink className="w-3 h-3" />
            </a>
          )}

          {/* Important Note */}
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
            <p className="text-xs text-yellow-400">
              ⚠️ After creating the IDO, you must deposit the sale tokens to the pool address and call activate() to start the sale.
            </p>
          </div>

          <button type="submit" disabled={isProcessing || !isConnected || !form.name || !isAddress(form.saleToken)}
            className="w-full gradient-button py-3 disabled:opacity-50 disabled:cursor-not-allowed">
            {isProcessing ? (
              <><RefreshCw className="w-4 h-4 inline animate-spin mr-2" />Creating IDO...</>
            ) : (
              `Create IDO (${creationFee} MON)`
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
