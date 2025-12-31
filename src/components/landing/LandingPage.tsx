import { useState, useEffect, useRef, Suspense, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, Stars, MeshDistortMaterial, Sphere } from '@react-three/drei'
import * as THREE from 'three'
import { 
  ArrowRight, ArrowUpRight, Zap, Shield, Coins, Globe, 
  TrendingUp, Layers, BarChart3, Rocket, Sparkles
} from 'lucide-react'

interface LandingPageProps {
  onEnterApp: () => void
  onShowTerms?: () => void
  onShowPrivacy?: () => void
}

// Floating Coin Component
function FloatingCoin({ position, color, speed = 1, size = 1 }: { 
  position: [number, number, number]
  color: string
  speed?: number
  size?: number
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const initialY = position[1]
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.02 * speed
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * speed) * 0.1
      meshRef.current.position.y = initialY + Math.sin(state.clock.elapsedTime * speed * 0.5) * 0.3
    }
  })

  return (
    <mesh ref={meshRef} position={position}>
      <cylinderGeometry args={[size, size, size * 0.15, 32]} />
      <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
    </mesh>
  )
}

// Particle System
function Particles({ count = 200 }: { count?: number }) {
  const points = useRef<THREE.Points>(null)
  
  const particlesPosition = useMemo(() => {
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20
    }
    return positions
  }, [count])

  useFrame((state) => {
    if (points.current) {
      points.current.rotation.y = state.clock.elapsedTime * 0.02
      points.current.rotation.x = state.clock.elapsedTime * 0.01
    }
  })

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={particlesPosition}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.03} color="#a855f7" transparent opacity={0.6} sizeAttenuation />
    </points>
  )
}

// Glowing Orb
function GlowingOrb({ position, color, size = 1 }: {
  position: [number, number, number]
  color: string
  size?: number
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.scale.setScalar(size + Math.sin(state.clock.elapsedTime * 2) * 0.1)
    }
  })

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <Sphere ref={meshRef} args={[size, 32, 32]} position={position}>
        <MeshDistortMaterial
          color={color}
          attach="material"
          distort={0.4}
          speed={2}
          roughness={0.2}
          metalness={0.8}
        />
      </Sphere>
    </Float>
  )
}

// Animated Ring
function AnimatedRing({ position, color }: {
  position: [number, number, number]
  color: string
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.5
      meshRef.current.rotation.z = state.clock.elapsedTime * 0.3
    }
  })

  return (
    <mesh ref={meshRef} position={position}>
      <torusGeometry args={[1.5, 0.05, 16, 100]} />
      <meshStandardMaterial color={color} metalness={0.9} roughness={0.1} transparent opacity={0.6} />
    </mesh>
  )
}

// 3D Scene
function Scene3D() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#a855f7" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#6366f1" />
      <spotLight position={[0, 10, 0]} intensity={0.8} color="#ffffff" angle={0.3} />
      
      <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />
      
      <Particles count={300} />
      
      {/* Floating Coins */}
      <FloatingCoin position={[-4, 2, -2]} color="#a855f7" speed={1.2} size={0.6} />
      <FloatingCoin position={[4, -1, -3]} color="#6366f1" speed={0.8} size={0.5} />
      <FloatingCoin position={[-3, -2, -1]} color="#8b5cf6" speed={1} size={0.4} />
      <FloatingCoin position={[3, 3, -4]} color="#c084fc" speed={0.9} size={0.7} />
      <FloatingCoin position={[0, 1, -5]} color="#a855f7" speed={1.1} size={0.55} />
      <FloatingCoin position={[-5, 0, -3]} color="#7c3aed" speed={0.7} size={0.45} />
      <FloatingCoin position={[5, 2, -2]} color="#8b5cf6" speed={1.3} size={0.5} />
      
      {/* Glowing Orbs */}
      <GlowingOrb position={[2, 0, -3]} color="#a855f7" size={0.8} />
      <GlowingOrb position={[-2, 1, -4]} color="#6366f1" size={0.6} />
      <GlowingOrb position={[0, -2, -2]} color="#8b5cf6" size={0.5} />
      
      {/* Animated Rings */}
      <AnimatedRing position={[0, 0, -6]} color="#a855f7" />
    </>
  )
}

export function LandingPage({ onEnterApp, onShowTerms, onShowPrivacy }: LandingPageProps) {
  const [scrollY, setScrollY] = useState(0)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2
      })
    }
    window.addEventListener('scroll', handleScroll)
    window.addEventListener('mousemove', handleMouseMove)
    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  const stats = [
    { value: '10M+', label: 'Users Across Monad', desc: 'Connect to a growing network of traders and liquidity providers.' },
    { value: '$50M+', label: 'Trading Volume', desc: 'Robust liquidity with millions in daily trading volume.' },
    { value: '500K+', label: 'Transactions', desc: 'Proven reliability with hundreds of thousands of swaps.' },
    { value: '0.5%', label: 'Swap Fee', desc: 'The lowest swap fees on Monad network.' },
  ]

  const products = [
    { icon: Zap, title: 'Swap Tokens', desc: 'Trade any token instantly with real-time prices and minimal slippage.', action: 'Start Swapping', gradient: 'from-purple-500 to-violet-600' },
    { icon: Layers, title: 'Provide Liquidity', desc: 'Add liquidity to pools and earn trading fees passively.', action: 'Add Liquidity', gradient: 'from-blue-500 to-cyan-500' },
    { icon: BarChart3, title: 'Farm Rewards', desc: 'Stake your LP tokens to earn additional rewards.', action: 'Start Farming', gradient: 'from-emerald-500 to-green-500' },
    { icon: Rocket, title: 'IDO Launchpad', desc: 'Get early access to promising projects launching on Monad.', action: 'View Launches', gradient: 'from-orange-500 to-amber-500' },
  ]

  const features = [
    { icon: Zap, title: 'Lightning Fast', desc: 'Sub-second finality on Monad' },
    { icon: Shield, title: 'Secure Protocol', desc: 'Audited smart contracts' },
    { icon: Coins, title: 'Low Fees', desc: '0.5% swap fee - lowest on Monad' },
    { icon: Globe, title: 'Decentralized', desc: 'Non-custodial trading' },
    { icon: TrendingUp, title: 'Deep Liquidity', desc: 'Efficient price discovery' },
    { icon: Layers, title: 'Multi-Pool', desc: 'Diverse trading pairs' },
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden">
      {/* 3D Canvas Background */}
      <div className="fixed inset-0 z-0">
        <Canvas
          camera={{ position: [0, 0, 8], fov: 60 }}
          style={{ background: 'transparent' }}
          dpr={[1, 2]}
        >
          <Suspense fallback={null}>
            <Scene3D />
          </Suspense>
        </Canvas>
      </div>

      {/* Gradient Overlays */}
      <div className="fixed inset-0 pointer-events-none z-[1]">
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[800px] bg-purple-600/10 rounded-full blur-[200px]"
          style={{ transform: `translate(${mousePosition.x * 20}px, ${mousePosition.y * 20}px)` }}
        />
        <div className="absolute bottom-0 left-0 w-[600px] h-[400px] bg-violet-600/10 rounded-full blur-[150px]" />
        <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[150px]" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Navigation */}
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrollY > 50 ? 'bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5' : ''}`}>
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img src="/logo.png" alt="Monic" className="w-10 h-10 rounded-xl object-contain" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                </div>
                <span className="text-xl font-bold tracking-tight">Monic</span>
              </div>
              <div className="hidden md:flex items-center gap-8">
                <a href="#products" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">Products</a>
                <a href="#features" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">Features</a>
                <a href="https://docs.monic.fi" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors text-sm font-medium flex items-center gap-1">
                  Docs <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </div>
              <button 
                onClick={onEnterApp} 
                className="group px-5 py-2.5 rounded-full text-sm font-semibold bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 transition-all shadow-lg shadow-purple-500/20 flex items-center gap-2"
              >
                Launch App
                <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
              </button>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center pt-20">
          <div className="max-w-7xl mx-auto px-6 w-full py-20">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left Content */}
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full mb-6 backdrop-blur-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  <span className="text-sm text-purple-300">Live on Monad Network</span>
                </div>
                
                <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold mb-6 leading-[1.1]">
                  <span className="text-white">The Future of</span>
                  <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-violet-400 to-indigo-400 animate-gradient">
                    DeFi on Monad
                  </span>
                </h1>
                
                <p className="text-lg text-gray-400 mb-8 leading-relaxed max-w-lg">
                  Monic is building the most efficient DEX infrastructure on Monad, enabling lightning-fast swaps, deep liquidity, and seamless DeFi experiences.
                </p>
                
                <div className="flex flex-wrap gap-4">
                  <button 
                    onClick={onEnterApp} 
                    className="group px-8 py-4 rounded-full font-semibold bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 transition-all flex items-center gap-2 shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105"
                  >
                    Start Trading 
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button 
                    onClick={onEnterApp}
                    className="px-8 py-4 rounded-full font-semibold bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all backdrop-blur-sm hover:scale-105"
                  >
                    Provide Liquidity
                  </button>
                </div>

                {/* Quick Stats */}
                <div className="flex gap-8 mt-12 pt-8 border-t border-white/5">
                  <div>
                    <p className="text-2xl font-bold text-white">$50M+</p>
                    <p className="text-sm text-gray-500">Total Volume</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">10K+</p>
                    <p className="text-sm text-gray-500">Active Users</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">0.5%</p>
                    <p className="text-sm text-gray-500">Swap Fee</p>
                  </div>
                </div>
              </div>

              {/* Right - Mascot with Glow */}
              <div className="relative flex justify-center lg:justify-end">
                <div className="relative">
                  {/* Animated Glow Rings */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-[400px] h-[400px] rounded-full border border-purple-500/20 animate-spin-slow" />
                    <div className="absolute w-[350px] h-[350px] rounded-full border border-violet-500/20 animate-spin-reverse" />
                    <div className="absolute w-[300px] h-[300px] rounded-full border border-indigo-500/20 animate-spin-slow" />
                  </div>
                  
                  {/* Glow Effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/30 to-violet-500/30 rounded-full blur-[100px] scale-75 animate-pulse" />
                  
                  {/* Mascot */}
                  <img 
                    src="/maskot.png" 
                    alt="Monic Mascot" 
                    className="relative w-[280px] sm:w-[350px] lg:w-[420px] h-auto object-contain drop-shadow-2xl animate-float z-10"
                    style={{ 
                      filter: 'drop-shadow(0 0 40px rgba(168, 85, 247, 0.4))',
                      transform: `translate(${mousePosition.x * -10}px, ${mousePosition.y * -10}px)`
                    }}
                  />
                  
                  {/* Floating Elements */}
                  <div className="absolute top-10 left-0 w-16 h-16 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl flex items-center justify-center animate-bounce-slow shadow-lg shadow-purple-500/30">
                    <Coins className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute bottom-20 right-0 w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center animate-bounce-slow-delay shadow-lg shadow-blue-500/30">
                    <Zap className="w-7 h-7 text-white" />
                  </div>
                  <div className="absolute top-1/2 -left-10 w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl flex items-center justify-center animate-bounce-slow-delay-2 shadow-lg shadow-emerald-500/30">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
            <span className="text-xs text-gray-500">Scroll to explore</span>
            <div className="w-6 h-10 rounded-full border-2 border-white/20 flex justify-center pt-2">
              <div className="w-1.5 h-3 bg-white/50 rounded-full animate-scroll-down" />
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="relative py-24 border-y border-white/5">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                Reshaping DeFi on <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-violet-400">Monad</span>
              </h2>
              <p className="text-gray-400 max-w-2xl mx-auto text-lg">
                The Monic ecosystem connects traders, liquidity providers, and projects across the Monad network.
              </p>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, i) => (
                <div 
                  key={i} 
                  className="group relative bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.05] rounded-2xl p-6 hover:border-purple-500/30 transition-all duration-300 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-violet-500/0 group-hover:from-purple-500/5 group-hover:to-violet-500/5 transition-all duration-300" />
                  <div className="relative">
                    <p className="text-4xl lg:text-5xl font-bold text-white mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-violet-400 transition-all">
                      {stat.value}
                    </p>
                    <p className="text-white font-medium mb-2">{stat.label}</p>
                    <p className="text-gray-500 text-sm leading-relaxed">{stat.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Products Section */}
        <section id="products" className="relative py-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                Start Using <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-violet-400">Monic</span>
              </h2>
              <p className="text-gray-400 max-w-2xl mx-auto text-lg">
                Access the full suite of DeFi products built for speed and efficiency on Monad.
              </p>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-6">
              {products.map((product, i) => (
                <div 
                  key={i} 
                  className="group relative bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.05] rounded-3xl p-8 hover:border-purple-500/30 transition-all duration-500 cursor-pointer overflow-hidden"
                  onClick={onEnterApp}
                >
                  {/* Hover Glow */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${product.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                  
                  <div className="relative">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${product.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                      <product.icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-2xl font-semibold text-white mb-3">{product.title}</h3>
                    <p className="text-gray-400 mb-6 leading-relaxed">{product.desc}</p>
                    <span className="inline-flex items-center gap-2 text-purple-400 font-medium group-hover:gap-4 transition-all duration-300">
                      {product.action} <ArrowRight className="w-5 h-5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="relative py-24 border-t border-white/5">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                Why <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-violet-400">Monic</span>?
              </h2>
              <p className="text-gray-400 max-w-2xl mx-auto text-lg">
                Built for the next generation of DeFi on Monad's high-performance blockchain.
              </p>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, i) => (
                <div 
                  key={i} 
                  className="group bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.05] rounded-2xl p-6 hover:border-purple-500/30 transition-all duration-300"
                >
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4 group-hover:bg-purple-500/20 group-hover:scale-110 transition-all duration-300">
                    <feature.icon className="w-6 h-6 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-500 text-sm">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative py-24">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <div className="relative bg-gradient-to-br from-purple-500/10 to-violet-500/10 border border-purple-500/20 rounded-3xl p-12 overflow-hidden">
              {/* Animated Background */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-violet-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
              </div>
              
              <div className="relative">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full mb-6">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span className="text-sm text-gray-300">Join the Revolution</span>
                </div>
                
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                  Ready to Start?
                </h2>
                <p className="text-gray-400 mb-8 max-w-lg mx-auto text-lg">
                  Join thousands of traders already using Monic for fast, efficient DeFi on Monad.
                </p>
                <button 
                  onClick={onEnterApp} 
                  className="group px-10 py-5 rounded-full font-semibold bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 transition-all flex items-center gap-3 mx-auto shadow-xl shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105"
                >
                  Launch App 
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/5 py-12">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-3">
                <img src="/logo.png" alt="Monic" className="w-8 h-8 rounded-lg object-contain" />
                <span className="font-semibold">Monic</span>
              </div>
              <div className="flex items-center gap-6 text-sm text-gray-500">
                <a href="https://x.com/monic_on_monad" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Twitter</a>
                <a href="https://t.me/monic_on_monad" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Telegram</a>
                <a href="#" className="hover:text-white transition-colors">Docs</a>
                {onShowTerms && (
                  <button onClick={onShowTerms} className="hover:text-white transition-colors">Terms</button>
                )}
                {onShowPrivacy && (
                  <button onClick={onShowPrivacy} className="hover:text-white transition-colors">Privacy</button>
                )}
              </div>
              <p className="text-sm text-gray-600">© 2025 Monic. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>

      {/* Custom Animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes scroll-down {
          0% { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(8px); opacity: 0; }
        }
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-float {
          animation: float 5s ease-in-out infinite;
        }
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
        .animate-spin-reverse {
          animation: spin-reverse 15s linear infinite;
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
        .animate-bounce-slow-delay {
          animation: bounce-slow 3s ease-in-out infinite 0.5s;
        }
        .animate-bounce-slow-delay-2 {
          animation: bounce-slow 3s ease-in-out infinite 1s;
        }
        .animate-scroll-down {
          animation: scroll-down 1.5s ease-in-out infinite;
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  )
}
