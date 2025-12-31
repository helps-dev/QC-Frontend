import { create } from 'zustand'

export interface PoolData {
  totalStaked: string
  rewardRate: string
  minStake: string
  maxStake: string
  lockPeriod: number
  earlyWithdrawPenalty: number
  compoundBonus: number
  apr: number
}

export interface UserStakeData {
  stakedAmount: string
  pendingRewards: string
  lockEndTime: number
  isLocked: boolean
  penaltyIfWithdrawNow: string
}

type TabType = 'calculator' | 'details' | 'staked'
type DurationType = '1D' | '7D' | '30D' | '1Y' | '5Y'
type CompoundFrequency = 'daily' | 'weekly' | 'monthly'

interface ROICalculatorState {
  // Modal state
  isModalOpen: boolean
  activeTab: TabType

  // Calculator inputs
  amount: string
  duration: DurationType
  compoundFrequency: CompoundFrequency
  isCompoundMode: boolean

  // Pool data (from smart contract)
  poolData: PoolData
  userStakeData: UserStakeData
  quickPrice: number

  // Actions
  openModal: () => void
  closeModal: () => void
  setActiveTab: (tab: TabType) => void
  setAmount: (amount: string) => void
  setDuration: (duration: DurationType) => void
  setCompoundFrequency: (freq: CompoundFrequency) => void
  setIsCompoundMode: (isCompound: boolean) => void
  setPoolData: (data: PoolData) => void
  setUserStakeData: (data: UserStakeData) => void
  setQuickPrice: (price: number) => void
  reset: () => void

  // Calculated values
  calculateROI: () => {
    simpleROI: number
    simpleReward: number
    compoundROI: number
    compoundReward: number
    totalWithCompound: number
    difference: number
    dailyBreakdown: { day: number; simple: number; compound: number }[]
  }
}

const DURATION_DAYS: Record<DurationType, number> = {
  '1D': 1,
  '7D': 7,
  '30D': 30,
  '1Y': 365,
  '5Y': 1825,
}

const COMPOUND_FREQUENCY: Record<CompoundFrequency, number> = {
  daily: 365,
  weekly: 52,
  monthly: 12,
}

const initialPoolData: PoolData = {
  totalStaked: '0',
  rewardRate: '0',
  minStake: '1',
  maxStake: '1000',
  lockPeriod: 365 * 24 * 60 * 60,
  earlyWithdrawPenalty: 10,
  compoundBonus: 1,
  apr: 0,
}

const initialUserStakeData: UserStakeData = {
  stakedAmount: '0',
  pendingRewards: '0',
  lockEndTime: 0,
  isLocked: false,
  penaltyIfWithdrawNow: '0',
}

// Helper to compare objects shallowly
const shallowEqual = <T extends object>(a: T, b: T): boolean => {
  const keysA = Object.keys(a) as (keyof T)[]
  const keysB = Object.keys(b) as (keyof T)[]
  if (keysA.length !== keysB.length) return false
  for (const key of keysA) {
    if (a[key] !== b[key]) return false
  }
  return true
}

export const useROICalculatorStore = create<ROICalculatorState>((set, get) => ({
  // Initial state
  isModalOpen: false,
  activeTab: 'calculator',
  amount: '100',
  duration: '1Y',
  compoundFrequency: 'daily',
  isCompoundMode: true,
  poolData: initialPoolData,
  userStakeData: initialUserStakeData,
  quickPrice: 2.5,

  // Actions
  openModal: () => set({ isModalOpen: true }),
  closeModal: () => set({ isModalOpen: false }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setAmount: (amount) => set({ amount }),
  setDuration: (duration) => set({ duration }),
  setCompoundFrequency: (freq) => set({ compoundFrequency: freq }),
  setIsCompoundMode: (isCompound) => set({ isCompoundMode: isCompound }),

  // Pool data setter with shallow comparison to prevent infinite loops
  setPoolData: (data) => {
    const current = get().poolData
    if (!shallowEqual(current, data)) {
      set({ poolData: data })
    }
  },

  // User stake data setter with shallow comparison to prevent infinite loops
  setUserStakeData: (data) => {
    const current = get().userStakeData
    if (!shallowEqual(current, data)) {
      set({ userStakeData: data })
    }
  },

  setQuickPrice: (price) => set({ quickPrice: price }),
  reset: () =>
    set({
      amount: '100',
      duration: '1Y',
      compoundFrequency: 'daily',
      isCompoundMode: true,
      activeTab: 'calculator',
    }),

  // Calculate ROI
  calculateROI: () => {
    const { amount, duration, compoundFrequency, poolData } = get()
    const amountNum = parseFloat(amount) || 0
    const apr = poolData.apr
    const days = DURATION_DAYS[duration]
    const compoundsPerYear = COMPOUND_FREQUENCY[compoundFrequency]

    if (amountNum <= 0 || apr <= 0) {
      return {
        simpleROI: 0,
        simpleReward: 0,
        compoundROI: 0,
        compoundReward: 0,
        totalWithCompound: 0,
        difference: 0,
        dailyBreakdown: [],
      }
    }

    const aprDecimal = apr / 100
    const years = days / 365

    // Simple ROI
    const simpleReward = amountNum * aprDecimal * years
    const simpleROI = (simpleReward / amountNum) * 100

    // Compound ROI: A = P * (1 + r/n)^(n*t)
    const compoundMultiplier = Math.pow(1 + aprDecimal / compoundsPerYear, compoundsPerYear * years)
    const totalWithCompound = amountNum * compoundMultiplier
    const compoundReward = totalWithCompound - amountNum
    const compoundROI = (compoundReward / amountNum) * 100

    // Daily breakdown for chart (max 365 points)
    const breakdownDays = Math.min(days, 365)
    const dailyBreakdown: { day: number; simple: number; compound: number }[] = []

    for (let d = 0; d <= breakdownDays; d += Math.max(1, Math.floor(breakdownDays / 30))) {
      const dayYears = d / 365
      const simpleVal = amountNum + amountNum * aprDecimal * dayYears
      const compoundVal =
        amountNum * Math.pow(1 + aprDecimal / compoundsPerYear, compoundsPerYear * dayYears)
      dailyBreakdown.push({ day: d, simple: simpleVal, compound: compoundVal })
    }

    return {
      simpleROI,
      simpleReward,
      compoundROI,
      compoundReward,
      totalWithCompound,
      difference: compoundReward - simpleReward,
      dailyBreakdown,
    }
  },
}))
