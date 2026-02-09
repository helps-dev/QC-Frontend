import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap } from './Icons3D'
import { IS_MEGAETH_TESTNET } from '../config/chains'

const BANNERS = [
  {
    text: "AIRDROP CAMPAIGN IS NOW LIVE - Trade to earn rewards!",
    icon: "⚡",
  },
  {
    text: IS_MEGAETH_TESTNET ? "Mexa is now live on MegaETH Testnet!" : "Mexa is now live on MegaETH!",
    icon: "🎉",
  },
  {
    text: "Earn 0.4% fee as liquidity provider!",
    icon: "💰",
  },
  {
    text: "0.5% swap fee - Lowest fees guaranteed!",
    icon: "🚀",
  },
]

const INTERVAL_MS = 4000

export function RotatingBanner() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % BANNERS.length)
  }, [])

  const goToIndex = useCallback((index: number) => {
    setCurrentIndex(index)
  }, [])

  useEffect(() => {
    if (isPaused) return
    const interval = setInterval(goToNext, INTERVAL_MS)
    return () => clearInterval(interval)
  }, [isPaused, goToNext])

  const currentBanner = BANNERS[currentIndex]

  return (
    <div 
      className="flex flex-col items-center gap-3 mb-8"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Banner Container */}
      <div className="relative w-full max-w-2xl h-12 rounded-full overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-violet-500 to-purple-600" />
        
        {/* Animated shine effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_3s_infinite]" />
        
        {/* Banner Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 flex items-center justify-center px-6 gap-2"
          >
            <Zap className="w-4 h-4 text-yellow-300 fill-yellow-300" />
            <p className="text-sm md:text-base font-semibold text-white text-center">
              {currentBanner.text}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dots Indicator */}
      <div className="flex items-center gap-2">
        {BANNERS.map((_, index) => (
          <button
            key={index}
            onClick={() => goToIndex(index)}
            className="p-1"
          >
            <span
              className={`block rounded-full transition-all duration-300 ${
                index === currentIndex 
                  ? 'w-6 h-1.5 bg-white' 
                  : 'w-1.5 h-1.5 bg-gray-500 hover:bg-gray-400'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  )
}
