import { useState } from 'react'
import { useAccount, useChainId } from 'wagmi'
import { isAddress } from 'viem'
import { useIDOFactory } from '../../hooks/useIDOFactory'
import { getNativeToken } from '../../config/tokens'

interface Props { onClose: () => void }

export function CreateIDOModal({ onClose }: Props) {
  const { isConnected } = useAccount()
  const chainId = useChainId()
  const nativeSymbol = getNativeToken(chainId).symbol
  const { createIDO, isProcessing, statusMessage, txHash, creationFee, platformFee } = useIDOFactory()

  const [form, setForm] = useState({
    name: '', saleToken: '', hardCap: '100', softCap: '10',
    tokensForSale: '1000000', durationDays: '7', isPrivate: false
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAddress(form.saleToken)) return
    const now = Math.floor(Date.now() / 1000)
    const startTime = now + 300
    const endTime = now + parseInt(form.durationDays) * 86400
    const result = await createIDO({
      name: form.name, saleToken: form.saleToken,
      hardCap: form.hardCap, softCap: form.softCap,
      tokensForSale: form.tokensForSale, startTime, endTime, isPrivate: form.isPrivate
    })
    if (result.success) setTimeout(onClose, 3000)
  }

  const tokenPrice = parseFloat(form.hardCap) > 0 && parseFloat(form.tokensForSale) > 0
    ? (parseFloat(form.hardCap) / parseFloat(form.tokensForSale)).toFixed(8) : '0'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg bg-gradient-to-br from-[#161622] to-[#0f0f1a] border border-white/[0.08] rounded-2xl shadow-2xl p-6 animate-fade-in max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Create IDO Pool</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-gray-400" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 mb-6">
          <p className="text-purple-300 font-medium text-sm mb-1">Launchpad IDO</p>
          <ul className="text-gray-400 text-xs space-y-1">
            <li>Overflow Method: Users can deposit more than hard cap</li>
            <li>Linear Vesting: 20% TGE, 180 days vesting</li>
            <li>Creation Fee: {creationFee} {nativeSymbol}</li>
            <li>Platform Fee: {platformFee}% of raised funds</li>
          </ul>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-gray-400">Project Name *</label>
            <input type="text" required placeholder="My Token Sale" value={form.name}
              onChange={e => setForm({...form, name: e.target.value})}
              className="w-full mt-1 px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white outline-none focus:border-purple-500/40 transition-colors" />
          </div>
          <div>
            <label className="text-sm text-gray-400">Sale Token Address *</label>
            <input type="text" required placeholder="0x..." value={form.saleToken}
              onChange={e => setForm({...form, saleToken: e.target.value})}
              className={`w-full mt-1 px-4 py-3 bg-white/[0.03] border rounded-xl text-white outline-none focus:border-purple-500/40 transition-colors ${form.saleToken && !isAddress(form.saleToken) ? 'border-red-500/50' : 'border-white/[0.08]'}`} />
            {form.saleToken && !isAddress(form.saleToken) && <p className="text-xs text-red-400 mt-1">Invalid address</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-400">Hard Cap ({nativeSymbol}) *</label>
              <input type="number" step="0.1" min="1" required value={form.hardCap}
                onChange={e => setForm({...form, hardCap: e.target.value})}
                className="w-full mt-1 px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white outline-none focus:border-purple-500/40" />
            </div>
            <div>
              <label className="text-sm text-gray-400">Soft Cap ({nativeSymbol}) *</label>
              <input type="number" step="0.1" min="1" required value={form.softCap}
                onChange={e => setForm({...form, softCap: e.target.value})}
                className="w-full mt-1 px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white outline-none focus:border-purple-500/40" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-400">Tokens For Sale *</label>
              <input type="number" min="1" required value={form.tokensForSale}
                onChange={e => setForm({...form, tokensForSale: e.target.value})}
                className="w-full mt-1 px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white outline-none focus:border-purple-500/40" />
            </div>
            <div>
              <label className="text-sm text-gray-400">Duration (Days) *</label>
              <input type="number" min="1" max="30" required value={form.durationDays}
                onChange={e => setForm({...form, durationDays: e.target.value})}
                className="w-full mt-1 px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white outline-none focus:border-purple-500/40" />
            </div>
          </div>
          <div className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.06]">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Token Price</span>
              <span className="text-sm font-semibold text-purple-400">{tokenPrice} {nativeSymbol}</span>
            </div>
          </div>
          <label className="flex items-center gap-3 p-3 bg-white/[0.03] rounded-xl border border-white/[0.06] cursor-pointer">
            <input type="checkbox" checked={form.isPrivate} onChange={e => setForm({...form, isPrivate: e.target.checked})}
              className="w-4 h-4 rounded border-gray-600 bg-transparent text-purple-500 focus:ring-purple-500" />
            <span className="text-sm text-gray-300">Private Sale (Tier-gated)</span>
          </label>
          {statusMessage && (
            <div className={`rounded-xl p-3 text-sm ${statusMessage.includes('\u2705') ? 'bg-emerald-500/10 text-emerald-400' : statusMessage.includes('\u274C') ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'}`}>
              {statusMessage}
            </div>
          )}
          {txHash && (
            <a href={`https://megaeth.blockscout.com/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="text-xs text-purple-400 hover:underline">
              View on Explorer
            </a>
          )}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
            <p className="text-xs text-amber-400">After creating, deposit sale tokens to the pool and call activate().</p>
          </div>
          <button type="submit" disabled={isProcessing || !isConnected || !form.name || !isAddress(form.saleToken)}
            className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl font-bold text-white text-sm transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed">
            {isProcessing ? 'Creating IDO...' : `Create IDO (${creationFee} ${nativeSymbol})`}
          </button>
        </form>
      </div>
    </div>
  )
}
