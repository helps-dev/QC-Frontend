import { useState } from 'react'
import { Settings, X } from 'lucide-react'

export interface SwapSettings {
  slippage: number
  deadline: number
  expertMode: boolean
}

interface Props {
  settings: SwapSettings
  onSettingsChange: (settings: SwapSettings) => void
}

const SLIPPAGE_OPTIONS = [0.1, 0.5, 1.0, 3.0]

export function TransactionSettings({ settings, onSettingsChange }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [customSlippage, setCustomSlippage] = useState('')

  const handleSlippageSelect = (value: number) => {
    onSettingsChange({ ...settings, slippage: value })
    setCustomSlippage('')
  }

  const handleCustomSlippage = (value: string) => {
    setCustomSlippage(value)
    const num = parseFloat(value)
    if (!isNaN(num) && num > 0 && num <= 50) {
      onSettingsChange({ ...settings, slippage: num })
    }
  }

  const isHighSlippage = settings.slippage > 5
  const isLowSlippage = settings.slippage < 0.1

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2.5 bg-atlantis-800/50 hover:bg-atlantis-700/50 border border-atlantis-700/50 hover:border-primary-500/30 rounded-xl transition-all"
      >
        <Settings className="w-5 h-5 text-gray-400 hover:text-white" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Modal */}
          <div className="absolute right-0 top-12 w-80 glass-card p-5 z-50">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-display font-bold gradient-text">Settings</h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-atlantis-700 rounded-lg transition-all"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Slippage Tolerance */}
            <div className="mb-5">
              <label className="block text-sm text-gray-400 mb-3">Slippage Tolerance</label>
              <div className="flex gap-2 mb-3">
                {SLIPPAGE_OPTIONS.map((value) => (
                  <button
                    key={value}
                    onClick={() => handleSlippageSelect(value)}
                    className={`flex-1 py-2 rounded-lg font-medium text-sm transition-all ${
                      settings.slippage === value && !customSlippage
                        ? 'bg-gradient-to-r from-primary-500/20 to-secondary-500/20 text-white border border-primary-500/30'
                        : 'bg-atlantis-800/50 text-gray-400 hover:text-white border border-atlantis-700/50'
                    }`}
                  >
                    {value}%
                  </button>
                ))}
              </div>
              <div className="relative">
                <input
                  type="number"
                  value={customSlippage}
                  onChange={(e) => handleCustomSlippage(e.target.value)}
                  placeholder="Custom"
                  className="w-full bg-atlantis-800/50 border border-atlantis-700/50 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-primary-500/50 transition-all"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">%</span>
              </div>
              
              {/* Warnings */}
              {isHighSlippage && (
                <div className="mt-2 text-xs text-yellow-400 bg-yellow-500/10 p-2 rounded-lg border border-yellow-500/20">
                  ⚠️ High slippage may result in unfavorable trades
                </div>
              )}
              {isLowSlippage && (
                <div className="mt-2 text-xs text-yellow-400 bg-yellow-500/10 p-2 rounded-lg border border-yellow-500/20">
                  ⚠️ Low slippage may cause transaction to fail
                </div>
              )}
            </div>

            {/* Transaction Deadline */}
            <div className="mb-5">
              <label className="block text-sm text-gray-400 mb-3">Transaction Deadline</label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={settings.deadline}
                  onChange={(e) => onSettingsChange({ ...settings, deadline: parseInt(e.target.value) || 20 })}
                  className="flex-1 bg-atlantis-800/50 border border-atlantis-700/50 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-primary-500/50 transition-all"
                />
                <span className="text-gray-400 text-sm">minutes</span>
              </div>
            </div>

            {/* Expert Mode */}
            <div className="flex items-center justify-between p-3 bg-atlantis-800/30 rounded-xl border border-atlantis-700/30">
              <div>
                <div className="text-sm text-white font-medium">Expert Mode</div>
                <div className="text-xs text-gray-500">Skip confirmation prompts</div>
              </div>
              <button
                onClick={() => onSettingsChange({ ...settings, expertMode: !settings.expertMode })}
                className={`w-12 h-6 rounded-full relative transition-all ${
                  settings.expertMode 
                    ? 'bg-gradient-to-r from-primary-500 to-secondary-500' 
                    : 'bg-atlantis-700'
                }`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    settings.expertMode ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Current Settings Summary */}
            <div className="mt-4 pt-4 border-t border-atlantis-700/30 text-xs text-gray-500">
              Current: {settings.slippage}% slippage, {settings.deadline}min deadline
            </div>
          </div>
        </>
      )}
    </div>
  )
}
