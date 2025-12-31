import { useState, useMemo } from 'react'
import { Calculator, TrendingUp, Clock, DollarSign, Zap, Info } from 'lucide-react'

interface ROICalculatorProps {
  stakeAmount: string
  apr: number
  compoundBonus: number
  lockPeriodDays: number
  quickPrice?: number
}

type TimeFrame = '1D' | '7D' | '30D' | '1Y' | '5Y'

const TIMEFRAMES: { id: TimeFrame; label: string; days: number }[] = [
  { id: '1D', label: '1 Day', days: 1 },
  { id: '7D', label: '7 Days', days: 7 },
  { id: '30D', label: '30 Days', days: 30 },
  { id: '1Y', label: '1 Year', days: 365 },
  { id: '5Y', label: '5 Years', days: 1825 },
]

function formatNum(num: number, decimals = 2): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(decimals)}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(decimals)}K`
  if (num >= 1) return num.toFixed(decimals)
  if (num >= 0.0001) return num.toFixed(4)
  return num.toFixed(6)
}

function formatUSD(num: number): string {
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(2)}M`
  if (num >= 1_000) return `$${(num / 1_000).toFixed(2)}K`
  return `$${num.toFixed(2)}`
}

export function ROICalculator({
  stakeAmount,
  apr,
  compoundBonus,
  lockPeriodDays: _lockPeriodDays,
  quickPrice = 2.5, // Default mock price
}: ROICalculatorProps) {
  // lockPeriodDays available for future use (e.g., showing lock period warnings)
  void _lockPeriodDays
  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeFrame>('1Y')
  const [compoundFrequency, setCompoundFrequency] = useState<'daily' | 'weekly' | 'monthly'>('daily')

  const amount = parseFloat(stakeAmount) || 0
  const timeframeDays = TIMEFRAMES.find((t) => t.id === selectedTimeframe)?.days || 365

  // Calculate ROI
  const calculations = useMemo(() => {
    if (amount <= 0 || apr <= 0) {
      return {
        simpleROI: 0,
        simpleReward: 0,
        compoundROI: 0,
        compoundReward: 0,
        compoundBonus: 0,
        totalWithCompound: 0,
        difference: 0,
      }
    }

    const apyDecimal = apr / 100
    const years = timeframeDays / 365

    // Simple ROI (no compounding)
    const simpleReward = amount * apyDecimal * years
    const simpleROI = (simpleReward / amount) * 100

    // Compound ROI
    let compoundsPerYear: number
    switch (compoundFrequency) {
      case 'daily':
        compoundsPerYear = 365
        break
      case 'weekly':
        compoundsPerYear = 52
        break
      case 'monthly':
        compoundsPerYear = 12
        break
    }

    // Compound formula: A = P * (1 + r/n)^(n*t)
    const compoundMultiplier = Math.pow(1 + apyDecimal / compoundsPerYear, compoundsPerYear * years)
    const totalWithCompound = amount * compoundMultiplier
    const compoundReward = totalWithCompound - amount
    const compoundROI = (compoundReward / amount) * 100

    // Bonus from compounding
    const bonusFromCompound = compoundReward - simpleReward

    return {
      simpleROI,
      simpleReward,
      compoundROI,
      compoundReward,
      compoundBonus: bonusFromCompound,
      totalWithCompound,
      difference: compoundReward - simpleReward,
    }
  }, [amount, apr, timeframeDays, compoundFrequency, compoundBonus])

  // USD values
  const simpleRewardUSD = calculations.simpleReward * quickPrice
  const compoundRewardUSD = calculations.compoundReward * quickPrice
  const totalValueUSD = (amount + calculations.compoundReward) * quickPrice

  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Calculator className="w-5 h-5 text-primary-400" />
        <h2 className="text-lg font-bold text-white">ROI Calculator</h2>
      </div>

      {/* Timeframe Selector */}
      <div className="mb-4">
        <p className="text-xs text-gray-400 mb-2">Select Timeframe</p>
        <div className="flex gap-1 p-1 bg-atlantis-800/30 rounded-xl border border-atlantis-700/30">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.id}
              onClick={() => setSelectedTimeframe(tf.id)}
              className={`flex-1 py-2 px-2 rounded-lg text-xs font-medium transition-all ${
                selectedTimeframe === tf.id
                  ? 'bg-gradient-to-r from-primary-500/20 to-secondary-500/20 text-white border border-primary-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-atlantis-700/30'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {/* Compound Frequency */}
      <div className="mb-4">
        <p className="text-xs text-gray-400 mb-2">Compound Frequency</p>
        <div className="flex gap-2">
          {(['daily', 'weekly', 'monthly'] as const).map((freq) => (
            <button
              key={freq}
              onClick={() => setCompoundFrequency(freq)}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                compoundFrequency === freq
                  ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                  : 'bg-atlantis-800/30 text-gray-400 hover:text-white border border-atlantis-700/30'
              }`}
            >
              {freq.charAt(0).toUpperCase() + freq.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Input Summary */}
      <div className="bg-atlantis-800/30 rounded-xl p-3 border border-atlantis-700/30 mb-4">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-xs text-gray-500">Stake Amount</p>
            <p className="text-sm font-semibold text-white">{formatNum(amount)} QUICK</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">APR</p>
            <p className="text-sm font-semibold text-green-400">{apr.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Period</p>
            <p className="text-sm font-semibold text-white">{timeframeDays} days</p>
          </div>
        </div>
      </div>

      {amount <= 0 ? (
        <div className="text-center py-6 text-gray-500">
          <Calculator className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Enter stake amount to calculate ROI</p>
        </div>
      ) : (
        <>
          {/* Simple ROI */}
          <div className="bg-atlantis-900/30 rounded-xl p-4 border border-atlantis-700/20 mb-3">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              <p className="text-sm text-gray-400">Simple ROI (No Compounding)</p>
            </div>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-2xl font-bold text-white">
                  +{formatNum(calculations.simpleReward)} QUICK
                </p>
                <p className="text-sm text-gray-500">{formatUSD(simpleRewardUSD)}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-blue-400">
                  +{calculations.simpleROI.toFixed(2)}%
                </p>
              </div>
            </div>
          </div>

          {/* Compound ROI */}
          <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl p-4 border border-green-500/20 mb-3">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-green-400" />
              <p className="text-sm text-gray-400">
                Compound ROI ({compoundFrequency} compounding)
              </p>
            </div>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-2xl font-bold text-green-400">
                  +{formatNum(calculations.compoundReward)} QUICK
                </p>
                <p className="text-sm text-gray-500">{formatUSD(compoundRewardUSD)}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-green-400">
                  +{calculations.compoundROI.toFixed(2)}%
                </p>
              </div>
            </div>
          </div>

          {/* Compound Advantage */}
          {calculations.difference > 0 && (
            <div className="bg-yellow-500/10 rounded-xl p-3 border border-yellow-500/20 mb-3">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-yellow-400" />
                <p className="text-sm text-yellow-400">
                  Compound advantage: <span className="font-bold">+{formatNum(calculations.difference)} QUICK</span>
                  <span className="text-yellow-300/70 ml-1">({formatUSD(calculations.difference * quickPrice)})</span>
                </p>
              </div>
            </div>
          )}

          {/* Total Value */}
          <div className="bg-atlantis-800/30 rounded-xl p-4 border border-atlantis-700/30">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-purple-400" />
              <p className="text-sm text-gray-400">
                Total after {TIMEFRAMES.find((t) => t.id === selectedTimeframe)?.label}
              </p>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xl font-bold text-white">
                  {formatNum(amount + calculations.compoundReward)} QUICK
                </p>
                <p className="text-sm text-gray-500">{formatUSD(totalValueUSD)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">From</p>
                <p className="text-sm text-white">{formatNum(amount)} QUICK</p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Disclaimer */}
      <div className="mt-4 p-3 bg-atlantis-900/50 rounded-xl border border-atlantis-700/20">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
          <div className="text-xs text-gray-500">
            <p className="mb-1">
              <strong>Disclaimer:</strong> These calculations are estimates based on current APR.
            </p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>APR may change over time based on total staked</li>
              <li>Compound bonus: +{compoundBonus}% per compound action</li>
              <li>QUICK price: ${quickPrice.toFixed(2)} (estimated)</li>
              <li>Early withdrawal penalty: 10% if before lock period</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
