import { useEffect, useCallback } from 'react'
import { X } from 'lucide-react'
import { useROICalculatorStore } from '../../store/calculatorStore'
import { CalculatorView } from './CalculatorView'
import { PoolDetailsView } from './PoolDetailsView'
import { UserStakedView } from './UserStakedView'

export function ROIModal() {
  const { isModalOpen, closeModal, activeTab, setActiveTab } = useROICalculatorStore()

  // Handle ESC key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal()
    },
    [closeModal]
  )

  useEffect(() => {
    if (isModalOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isModalOpen, handleKeyDown])

  if (!isModalOpen) return null

  const tabs = [
    { id: 'calculator' as const, label: '🧮 Calculator' },
    { id: 'details' as const, label: '📊 Details' },
    { id: 'staked' as const, label: '💰 Staked' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={closeModal}
      />

      {/* Modal */}
      <div className="relative w-full sm:max-w-2xl max-h-[90vh] sm:max-h-[85vh] bg-atlantis-900 border border-atlantis-700/50 rounded-t-3xl sm:rounded-2xl shadow-2xl animate-slide-up overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-atlantis-700/50">
          <h2 className="text-xl font-bold gradient-text">ROI Calculator</h2>
          <button
            onClick={closeModal}
            className="p-2 rounded-lg hover:bg-atlantis-800 transition-colors text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-2 bg-atlantis-800/30 border-b border-atlantis-700/30">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-primary-500/20 to-secondary-500/20 text-white border border-primary-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-atlantis-700/30'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'calculator' && <CalculatorView />}
          {activeTab === 'details' && <PoolDetailsView />}
          {activeTab === 'staked' && <UserStakedView />}
        </div>
      </div>
    </div>
  )
}
