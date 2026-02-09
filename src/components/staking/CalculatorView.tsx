import { useMemo } from 'react'
import { TrendingUp, Zap, DollarSign, ArrowRight, Calculator } from '../Icons3D'
import { useROICalculatorStore } from '../../store/calculatorStore'

const DURATIONS = [
  { id: '1D' as const, label: '1D', days: 1 },
  { id: '7D' as const, label: '7D', days: 7 },
  { id: '30D' as const, label: '30D', days: 30 },
  { id: '1Y' as const, label: '1Y', days: 365 },
  { id: '5Y' as const, label: '5Y', days: 1825 },
]

const COMPOUND_OPTIONS = [
  { id: 'daily' as const, label: 'Daily' },
  { id: 'weekly' as const, label: 'Weekly' },
  { id: 'monthly' as const, label: 'Monthly' },
]

function formatNum(num: number, decimals = 2): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(decimals)}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(decimals)}K`
  if (num >= 1) return num.toFixed(decimals)
  if (num >= 0.0001) return num.toFixed(4)
  return num.toFixed(6)
}

export function CalculatorView() {
  const {
    amount,
    setAmount,
    duration,
    setDuration,
    compoundFrequency,
    setCompoundFrequency,
    isCompoundMode,
    setIsCompoundMode,
    poolData,
    quickPrice,
    calculateROI,
    closeModal,
  } = useROICalculatorStore()

  const roi = useMemo(() => calculateROI(), [calculateROI, amount, duration, compoundFrequency])
  const amountNum = parseFloat(amount) || 0

  // Slider percentage (1-1000 range)
  const sliderPercent = Math.min(100, Math.max(0, (amountNum / 1000) * 100))

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value)
    setAmount(value.toString())
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value)
    }
  }

  const handleStartStaking = () => {
    closeModal()
    // Set the amount in the main form by dispatching a custom event
    setTimeout(() => {
      const stakeInput = document.querySelector('input[placeholder="0.0"]') as HTMLInputElement
      if (stakeInput) {
        // Trigger React's onChange by setting value and dispatching input event
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          'value'
        )?.set
        if (nativeInputValueSetter) {
          nativeInputValueSetter.call(stakeInput, amount)
          const inputEvent = new Event('input', { bubbles: true })
          stakeInput.dispatchEvent(inputEvent)
        }
        stakeInput.focus()
      }
    }, 100)
  }

  const displayReward = isCompoundMode ? roi.compoundReward : roi.simpleReward
  const displayROI = isCompoundMode ? roi.compoundROI : roi.simpleROI
  const displayTotal = isCompoundMode ? roi.totalWithCompound : amountNum + roi.simpleReward

  return (
    <div className="space-y-5">
      {/* Amount Input Section */}
      <div className="bg-atlantis-800/30 rounded-xl p-4 border border-atlantis-700/30">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm text-gray-400">Stake Amount</span>
          <span className="text-xs text-gray-500">
            Min: {poolData.minStake} | Max: {poolData.maxStake} QUICK
          </span>
        </div>

        {/* Amount Input */}
        <div className="flex items-center gap-3 mb-4">
          <input
            type="text"
            value={amount}
            onChange={handleAmountChange}
            placeholder="0"
            className="flex-1 bg-atlantis-900/50 border border-atlantis-700/50 rounded-xl px-4 py-3 text-2xl font-bold text-white outline-none focus:border-primary-500/50 transition-colors"
          />
          <div className="flex items-center gap-2 bg-atlantis-900/50 border border-atlantis-700/50 rounded-xl px-4 py-3">
            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center text-xs font-bold">
              Q
            </div>
            <span className="font-semibold text-white">QUICK</span>
          </div>
        </div>

        {/* Slider */}
        <div className="relative">
          <input
            type="range"
            min="1"
            max="1000"
            step="1"
            value={amountNum || 1}
            onChange={handleSliderChange}
            className="w-full h-2 bg-atlantis-700 rounded-lg appearance-none cursor-pointer slider-thumb"
            style={{
              background: `linear-gradient(to right, rgb(139, 92, 246) 0%, rgb(236, 72, 153) ${sliderPercent}%, rgb(55, 65, 81) ${sliderPercent}%)`,
            }}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>1</span>
            <span>250</span>
            <span>500</span>
            <span>750</span>
            <span>1000</span>
          </div>
        </div>

        {/* Quick Amount Buttons */}
        <div className="flex gap-2 mt-3">
          {[10, 50, 100, 500, 1000].map((val) => (
            <button
              key={val}
              onClick={() => setAmount(val.toString())}
              className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${
                amountNum === val
                  ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                  : 'bg-atlantis-700/50 text-gray-400 hover:text-white border border-transparent'
              }`}
            >
              {val}
            </button>
          ))}
        </div>
      </div>

      {/* Duration Selection */}
      <div className="bg-atlantis-800/30 rounded-xl p-4 border border-atlantis-700/30">
        <span className="text-sm text-gray-400 block mb-3">Staking Duration</span>
        <div className="flex gap-2">
          {DURATIONS.map((d) => (
            <button
              key={d.id}
              onClick={() => setDuration(d.id)}
              className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                duration === d.id
                  ? 'bg-gradient-to-r from-primary-500/30 to-secondary-500/30 text-white border border-primary-500/50 shadow-lg shadow-primary-500/20'
                  : 'bg-atlantis-700/50 text-gray-400 hover:text-white border border-atlantis-600/30'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* ROI Mode Toggle */}
      <div className="bg-atlantis-800/30 rounded-xl p-4 border border-atlantis-700/30">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-400">ROI Calculation Mode</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCompoundMode(false)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                !isCompoundMode
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Simple
            </button>
            <button
              onClick={() => setIsCompoundMode(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isCompoundMode
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Compound
            </button>
          </div>
        </div>

        {/* Compound Frequency (only show if compound mode) */}
        {isCompoundMode && (
          <div className="flex gap-2 mt-3">
            {COMPOUND_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setCompoundFrequency(opt.id)}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                  compoundFrequency === opt.id
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-atlantis-700/50 text-gray-400 hover:text-white border border-transparent'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ROI Results */}
      {amountNum > 0 && (
        <div className="space-y-3">
          {/* Main Result */}
          <div
            className={`rounded-xl p-5 border ${
              isCompoundMode
                ? 'bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30'
                : 'bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-500/30'
            }`}
          >
            <div className="flex items-center gap-2 mb-3">
              {isCompoundMode ? (
                <Zap className="w-5 h-5 text-green-400" />
              ) : (
                <TrendingUp className="w-5 h-5 text-blue-400" />
              )}
              <span className="text-sm text-gray-400">
                {isCompoundMode ? 'Compound' : 'Simple'} ROI ({duration})
              </span>
            </div>

            <div className="flex justify-between items-end">
              <div>
                <p
                  className={`text-3xl font-bold ${isCompoundMode ? 'text-green-400' : 'text-blue-400'}`}
                >
                  +{formatNum(displayReward)} QUICK
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  <DollarSign className="w-3 h-3 inline" />
                  {formatNum(displayReward * quickPrice)} USD
                </p>
              </div>
              <div className="text-right">
                <p
                  className={`text-2xl font-bold ${isCompoundMode ? 'text-green-400' : 'text-blue-400'}`}
                >
                  +{displayROI.toFixed(2)}%
                </p>
                <p className="text-xs text-gray-500">ROI</p>
              </div>
            </div>
          </div>

          {/* Comparison (show when compound mode) */}
          {isCompoundMode && roi.difference > 0 && (
            <div className="bg-yellow-500/10 rounded-xl p-3 border border-yellow-500/20">
              <p className="text-sm text-yellow-400 flex items-center gap-2">
                <Calculator className="w-4 h-4" />
                Compound advantage:{' '}
                <span className="font-bold">+{formatNum(roi.difference)} QUICK</span>
                <span className="text-yellow-300/70">
                  (${formatNum(roi.difference * quickPrice)})
                </span>
              </p>
            </div>
          )}

          {/* Total Value */}
          <div className="bg-atlantis-800/30 rounded-xl p-4 border border-atlantis-700/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Total after {duration}</p>
                <p className="text-xl font-bold text-white">{formatNum(displayTotal)} QUICK</p>
                <p className="text-sm text-gray-500">
                  ${formatNum(displayTotal * quickPrice)} USD
                </p>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <span>{formatNum(amountNum)}</span>
                <ArrowRight className="w-4 h-4" />
                <span className="text-white font-semibold">{formatNum(displayTotal)}</span>
              </div>
            </div>
          </div>

          {/* APR Info */}
          <div className="flex justify-between text-sm text-gray-500 px-1">
            <span>Current APR: {poolData.apr.toFixed(1)}%</span>
            <span>Compound Bonus: +{poolData.compoundBonus}%</span>
          </div>
        </div>
      )}

      {/* Start Staking Button */}
      <button
        onClick={handleStartStaking}
        disabled={amountNum <= 0}
        className="w-full py-4 rounded-xl font-bold text-white gradient-button hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        🚀 START STAKING
      </button>
    </div>
  )
}
