import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const BANNERS = [
  {
    text: "🎉 Monic is now live on Monad Mainnet!",
    gradient: "from-purple-600 via-violet-600 to-purple-600",
    glow: "shadow-purple-500/30",
  },
  {
    text: "⚡ AIRDROP CAMPAIGN IS NOW LIVE - Trade to earn rewards!",
    gradient: "from-violet-600 via-purple-600 to-violet-600",
    glow: "shadow-violet-500/30",
  },
  {
    text: "💰 Earn 0.4% fee as liquidity provider!",
    gradient: "from-purple-600 via-fuchsia-600 to-purple-600",
    glow: "shadow-fuchsia-500/30",
  },
  {
    text: "🚀 0.5% swap fee - Lowest on Monad!",
    gradient: "from-violet-600 via-purple-600 to-violet-600",
    glow: "shadow-purple-500/30",
  },
]

const INTERVAL_MS = 3000 // 3 seconds

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
      className="flex flex-col items-center gap-3 mb-6"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Banner Container */}
      <div className="relative w-full h-12 md:h-14 rounded-2xl overflow-hidden">
        {/* Animated Background Glow */}
        <div className={`absolute inset-0 bg-gradient-to-r ${currentBanner.gradient} opacity-20 blur-xl transition-all duration-500`} />
        
        {/* Banner Content with AnimatePresence for smooth transitions */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ 
              duration: 0.4, 
              ease: [0.4, 0, 0.2, 1] // Custom easing for smooth feel
            }}
            className={`absolute inset-0 flex items-center justify-center px-6
              bg-gradient-to-r ${currentBanner.gradient}
              shadow-lg ${currentBanner.glow}`}
          >
            {/* Subtle shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 animate-shimmer" />
            
            <p className="relative text-sm md:text-base lg:text-lg font-semibold text-white text-center tracking-wide">
              {currentBanner.text}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dots Indicator - Below Banner */}
      <div className="flex items-center gap-2">
        {BANNERS.map((_, index) => (
          <button
            key={index}
            onClick={() => goToIndex(index)}
            aria-label={`Go to banner ${index + 1}`}
            className="group relative p-1"
          >
            <span
              className={`block rounded-full transition-all duration-300 ${
                index === currentIndex 
                  ? 'w-6 h-2 bg-gradient-to-r from-purple-500 to-violet-500' 
                  : 'w-2 h-2 bg-gray-600 hover:bg-gray-500 group-hover:scale-110'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  )
}
