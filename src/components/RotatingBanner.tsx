import { useState, useEffect } from 'react'

const BANNERS = [
  {
    text: "🎉 QuickSwap is now live on Monad Mainnet!",
    gradient: "from-amber-500 to-orange-500",
  },
  {
    text: "⚡ AIRDROP CAMPAIGN IS NOW LIVE - Trade to earn rewards!",
    gradient: "from-pink-500 to-purple-500",
  },
  {
    text: "💰 Earn 0.4% fee as liquidity provider!",
    gradient: "from-primary-500 to-secondary-500",
  },
  {
    text: "🚀 0.5% swap fee - Lowest on Monad!",
    gradient: "from-cyan-500 to-blue-500",
  },
]

export function RotatingBanner() {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % BANNERS.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative h-16 md:h-20 rounded-2xl overflow-hidden mb-8">
      {BANNERS.map((banner, index) => (
        <div
          key={index}
          className={`absolute inset-0 flex items-center justify-center px-4
            bg-gradient-to-r ${banner.gradient}
            transition-all duration-700 ease-in-out
            ${index === currentIndex ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full'}`}
        >
          <p className="text-base md:text-lg font-display font-bold text-white drop-shadow-md text-center">
            {banner.text}
          </p>
        </div>
      ))}
      
      {/* Dots indicator */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
        {BANNERS.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentIndex ? 'bg-white scale-110' : 'bg-white/40 hover:bg-white/60'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
