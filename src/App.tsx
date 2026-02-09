import { useState, useRef, useEffect } from 'react'
import { WagmiProvider, http, useDisconnect, useAccount } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider, ConnectButton, connectorsForWallets } from '@rainbow-me/rainbowkit'
import { 
  metaMaskWallet, 
  walletConnectWallet, 
  trustWallet,
  rainbowWallet,
  injectedWallet,
  coinbaseWallet
} from '@rainbow-me/rainbowkit/wallets'
import '@rainbow-me/rainbowkit/styles.css'
import { monadMainnet, megaethChain, MEGAETH_LOGO, IS_MEGAETH_TESTNET } from './config/chains'
import { SwapWithChart } from './components/swap'
import { PoolPage } from './components/pool'
import { FarmPage } from './components/farm'
import { QuickStakingPage } from './components/staking'
import { LaunchpadPage } from './components/launchpad'
import { MonadStakingPage } from './components/monad-staking'
import { GmonicStakingPage } from './components/gmonic-staking'
import { Stats } from './components/Stats'
import { LandingPage } from './components/landing'
import { TermsOfService, PrivacyPolicy } from './components/legal'
import { ArrowLeftRight, Droplets, Sprout, Lock, Rocket, BarChart3, Coins, ChevronDown, MoreHorizontal, LogOut, FileText, Shield, Sparkles } from './components/Icons3D'
import { createConfig } from 'wagmi'

// Page type including legal pages
type PageView = 'app' | 'landing' | 'terms' | 'privacy'

// Admin wallet address - only this wallet can see Stake QUICK
const ADMIN_WALLET = '0x862345b87b44E71910e1F48aA4BD58DB600e4BEd'.toLowerCase()

// WalletConnect Project ID
const projectId = 'a507fa027d362624cc47449e82ccb3ca'

// App metadata for WalletConnect
const appMetadata = {
  appName: 'Mexa DEX',
  appDescription: 'Real-Time Decentralized Exchange on MegaETH',
  appUrl: typeof window !== 'undefined' ? window.location.origin : 'https://mexa.exchange',
  appIcon: typeof window !== 'undefined' ? `${window.location.origin}/mexa-logo.png` : '/mexa-logo.png',
}

// Configure wallet connectors with improved WalletConnect support
const connectors = connectorsForWallets(
  [
    {
      groupName: 'Recommended',
      wallets: [
        injectedWallet,
        metaMaskWallet,
        trustWallet,
        walletConnectWallet,
      ],
    },
    {
      groupName: 'More',
      wallets: [
        rainbowWallet,
        coinbaseWallet,
      ],
    },
  ],
  {
    appName: appMetadata.appName,
    projectId: projectId,
  }
)

// Create wagmi config with custom connectors
const megaethRpc = megaethChain.rpcUrls.default.http[0]
const config = createConfig({
  connectors,
  chains: [megaethChain, monadMainnet],
  transports: { 
    6343: http(megaethRpc, { batch: true, retryCount: 3, retryDelay: 1000 }),
    6342: http(megaethRpc, { batch: true, retryCount: 3, retryDelay: 1000 }),
    [monadMainnet.id]: http('https://rpc.monad.xyz', { batch: true, retryCount: 3, retryDelay: 1000 })
  },
  ssr: false,
})

// Custom Wallet Button Component with direct disconnect support
function WalletButton() {
  const { disconnect } = useDisconnect()
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside as EventListener)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside as EventListener)
    }
  }, [])

  const handleDisconnect = () => {
    disconnect()
    setShowMenu(false)
  }

  return (
    <ConnectButton.Custom>
      {({ account, chain, openConnectModal, mounted }) => {
        const connected = mounted && account && chain

        return (
          <div className="flex items-center gap-2">
            {!connected ? (
              <button
                type="button"
                onClick={() => openConnectModal()}
                className="px-4 py-2.5 rounded-xl font-medium text-sm text-white bg-purple-600 hover:bg-purple-500 active:bg-purple-700 transition-all cursor-pointer select-none"
                style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
              >
                Connect Wallet
              </button>
            ) : (
              <>
                {/* Network badge - display only, no switcher */}
                <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 bg-white/5 border border-white/10 rounded-xl select-none">
                  <img src={MEGAETH_LOGO} alt="MegaETH" className="w-5 h-5 rounded-full" />
                  <span className="text-xs sm:text-sm text-gray-300">MegaETH</span>
                  {IS_MEGAETH_TESTNET && <span className="text-[9px] px-1 py-0.5 bg-yellow-500/20 text-yellow-400 rounded hidden sm:inline">Testnet</span>}
                </div>
                
                {/* Account button with dropdown menu */}
                <div className="relative" ref={menuRef}>
                  <button
                    type="button"
                    onClick={() => setShowMenu(!showMenu)}
                    className="px-3 py-2 bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/10 rounded-xl transition-all cursor-pointer select-none"
                    style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
                  >
                    <span className="text-sm font-medium text-white">{account.displayName}</span>
                  </button>
                  
                  {/* Dropdown Menu */}
                  {showMenu && (
                    <div className="absolute top-full right-0 mt-2 w-48 bg-[#12121a] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50">
                      <div className="px-4 py-3 border-b border-white/5">
                        <p className="text-xs text-gray-500">Connected</p>
                        <p className="text-sm text-white font-medium truncate">{account.displayName}</p>
                        {account.displayBalance && (
                          <p className="text-xs text-gray-400 mt-1">{account.displayBalance}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={handleDisconnect}
                        className="w-full px-4 py-3 flex items-center gap-3 text-red-400 hover:bg-red-500/10 transition-all"
                        style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
                      >
                        <LogOut className="w-4 h-4" />
                        <span className="text-sm font-medium">Disconnect</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )
      }}
    </ConnectButton.Custom>
  )
}

const queryClient = new QueryClient()
type Tab = 'swap' | 'liquidity' | 'farm' | 'staking' | 'monad-staking' | 'gmonic-staking' | 'launchpad' | 'stats'

const VALID_TABS: Tab[] = ['swap', 'liquidity', 'farm', 'staking', 'monad-staking', 'gmonic-staking', 'launchpad', 'stats']

// Helper functions for session storage
const getStoredTab = (): Tab => {
  const stored = sessionStorage.getItem('monic_active_tab')
  if (stored && VALID_TABS.includes(stored as Tab)) {
    return stored as Tab
  }
  return 'swap'
}

const getStoredAppState = (): boolean => {
  return sessionStorage.getItem('monic_in_app') === 'true'
}

const setStoredTab = (tab: Tab) => {
  sessionStorage.setItem('monic_active_tab', tab)
}

const setStoredAppState = (inApp: boolean) => {
  sessionStorage.setItem('monic_in_app', String(inApp))
}

// Mobile tabs - base tabs (Farm will be added dynamically for admin)
const baseMobileTabs: { id: Tab; label: string; Icon: typeof ArrowLeftRight }[] = [
  { id: 'swap', label: 'Swap', Icon: ArrowLeftRight },
  { id: 'liquidity', label: 'Pool', Icon: Droplets },
  { id: 'monad-staking', label: 'ETH', Icon: Coins },
  { id: 'gmonic-staking', label: 'gMEXA', Icon: Sparkles },
]

// Inner App Component that uses wagmi hooks
function AppContent({ 
  setShowLanding, 
  setCurrentPage 
}: { 
  showLanding: boolean
  setShowLanding: (show: boolean) => void
  currentPage: PageView
  setCurrentPage: (page: PageView) => void
}) {
  const { address } = useAccount()
  const [activeTab, setActiveTabState] = useState<Tab>(() => getStoredTab())
  const [earnDropdownOpen, setEarnDropdownOpen] = useState(false)
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false)
  const earnDropdownRef = useRef<HTMLDivElement>(null)
  const mobileMoreRef = useRef<HTMLDivElement>(null)

  // Check if current wallet is admin
  const isAdmin = address?.toLowerCase() === ADMIN_WALLET

  // Earn dropdown items - filter based on admin status
  const earnItems = [
    ...(isAdmin ? [{ id: 'farm' as Tab, label: 'Farm', icon: Sprout, desc: 'Stake LP tokens' }] : []),
    ...(isAdmin ? [{ id: 'staking' as Tab, label: 'Stake', icon: Lock, desc: 'Stake QUICK' }] : []),
    { id: 'monad-staking' as Tab, label: 'ETH Staking', icon: Coins, desc: 'Stake ETH' },
    { id: 'gmonic-staking' as Tab, label: 'gMEXA', icon: Sparkles, desc: 'Stake gMEXA' },
  ]

  // More menu items for mobile - filter based on admin status
  const moreMenuItems = [
    ...(isAdmin ? [{ id: 'farm' as Tab, label: 'Farm', Icon: Sprout }] : []),
    ...(isAdmin ? [{ id: 'staking' as Tab, label: 'Stake QUICK', Icon: Lock }] : []),
    { id: 'launchpad' as Tab, label: 'IDO', Icon: Rocket },
    { id: 'stats' as Tab, label: 'Stats', Icon: BarChart3 },
  ]

  // Wrapper functions to persist state
  const setActiveTab = (tab: Tab) => {
    // Prevent non-admin from accessing staking or farm tab
    if ((tab === 'staking' || tab === 'farm') && !isAdmin) {
      setActiveTabState('swap')
      setStoredTab('swap')
      return
    }
    setActiveTabState(tab)
    setStoredTab(tab)
  }

  // If user is on staking or farm tab but not admin, redirect to swap
  useEffect(() => {
    if ((activeTab === 'staking' || activeTab === 'farm') && !isAdmin) {
      setActiveTab('swap')
    }
  }, [activeTab, isAdmin])

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (earnDropdownRef.current && !earnDropdownRef.current.contains(event.target as Node)) {
        setEarnDropdownOpen(false)
      }
      if (mobileMoreRef.current && !mobileMoreRef.current.contains(event.target as Node)) {
        setMobileMoreOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const isEarnTab = (activeTab === 'farm' && isAdmin) || (activeTab === 'staking' && isAdmin) || activeTab === 'monad-staking' || activeTab === 'gmonic-staking'
  const isMoreTab = (activeTab === 'farm' && isAdmin) || (activeTab === 'staking' && isAdmin) || activeTab === 'launchpad' || activeTab === 'stats'

  return (
    <div className="min-h-screen flex flex-col pb-16 lg:pb-0 bg-[#0a0a0f] relative overflow-hidden">
            {/* Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-purple-600/15 rounded-full blur-[150px]" />
              <div className="absolute -top-20 right-0 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[120px]" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-900/5 rounded-full blur-[200px]" />
            </div>

            {/* Header */}
            <header className="sticky top-0 z-50 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5">
              <div className="max-w-7xl mx-auto px-4 lg:px-6 py-3">
                <div className="flex justify-between items-center">
                  {/* Logo */}
                  <button 
                    onClick={() => setShowLanding(true)} 
                    className="flex items-center hover:opacity-80 transition-opacity"
                  >
                    <img src="/mexa-logo-header.png" alt="Mexa" className="h-14 sm:h-16 w-auto object-contain" />
                  </button>

                  {/* Desktop Navigation */}
                  <nav className="hidden lg:flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
                    {/* Swap */}
                    <button 
                      onClick={() => setActiveTab('swap')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        activeTab === 'swap' 
                          ? 'bg-purple-600 text-white' 
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      Swap
                    </button>

                    {/* Pool */}
                    <button 
                      onClick={() => setActiveTab('liquidity')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        activeTab === 'liquidity' 
                          ? 'bg-purple-600 text-white' 
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      Pool
                    </button>

                    {/* Earn Dropdown */}
                    <div className="relative" ref={earnDropdownRef}>
                      <button 
                        onClick={() => setEarnDropdownOpen(!earnDropdownOpen)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                          isEarnTab 
                            ? 'bg-purple-600 text-white' 
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        Earn
                        <ChevronDown className={`w-4 h-4 transition-transform ${earnDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {/* Dropdown Menu */}
                      {earnDropdownOpen && (
                        <div className="absolute top-full left-0 mt-2 w-56 bg-[#12121a] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50">
                          {earnItems.map((item) => {
                            const IconComponent = item.icon
                            return (
                              <button
                                key={item.id}
                                onClick={() => {
                                  setActiveTab(item.id)
                                  setEarnDropdownOpen(false)
                                }}
                                className={`w-full px-4 py-3 flex items-center gap-3 transition-all ${
                                  activeTab === item.id 
                                    ? 'bg-purple-600/20 text-white' 
                                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                }`}
                              >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                  activeTab === item.id ? 'bg-purple-600' : 'bg-white/5'
                                }`}>
                                  <IconComponent className="w-4 h-4" />
                                </div>
                                <div className="text-left">
                                  <p className="text-sm font-medium">{item.label}</p>
                                  <p className="text-xs text-gray-500">{item.desc}</p>
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>

                    {/* IDO */}
                    <button 
                      onClick={() => setActiveTab('launchpad')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        activeTab === 'launchpad' 
                          ? 'bg-purple-600 text-white' 
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      IDO
                    </button>

                    {/* Stats */}
                    <button 
                      onClick={() => setActiveTab('stats')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        activeTab === 'stats' 
                          ? 'bg-purple-600 text-white' 
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      Stats
                    </button>
                  </nav>

                  {/* Connect Wallet */}
                  <div className="flex items-center gap-2">
                    <WalletButton />
                  </div>
                </div>
              </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 w-full px-4 lg:px-6 relative z-10 flex flex-col">
              <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col">
                {activeTab === 'swap' ? (
                  <div className="flex-1 flex items-center justify-center py-2">
                    <SwapWithChart />
                  </div>
                ) : activeTab === 'monad-staking' || activeTab === 'gmonic-staking' || activeTab === 'launchpad' ? (
                  <div className="flex-1 flex items-center justify-center py-2">
                    {activeTab === 'monad-staking' && <MonadStakingPage />}
                    {activeTab === 'gmonic-staking' && <GmonicStakingPage />}
                    {activeTab === 'launchpad' && <LaunchpadPage />}
                  </div>
                ) : activeTab === 'stats' ? (
                  <div className="flex-1 flex items-start justify-center py-4">
                    <Stats />
                  </div>
                ) : (
                  <div className="py-6 sm:py-8 flex justify-center">
                    {activeTab === 'liquidity' && <PoolPage />}
                    {activeTab === 'farm' && <FarmPage />}
                    {activeTab === 'staking' && <QuickStakingPage />}
                  </div>
                )}
              </div>
            </main>

            {/* Mobile Bottom Navigation */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0f]/95 backdrop-blur-xl border-t border-white/5 safe-bottom">
              <div className="flex justify-around items-center px-1 py-2">
                {baseMobileTabs.map((tab) => {
                  const IconComponent = tab.Icon
                  const isActive = activeTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex flex-col items-center justify-center py-1.5 px-2 sm:px-3 rounded-xl transition-all min-w-0 ${
                        isActive ? 'text-white' : 'text-gray-500'
                      }`}
                    >
                      <IconComponent className={`w-5 h-5 ${isActive ? 'text-purple-500' : ''}`} />
                      <span className={`text-[9px] sm:text-[10px] mt-1 font-medium truncate ${isActive ? 'text-white' : ''}`}>
                        {tab.label}
                      </span>
                    </button>
                  )
                })}
                
                {/* More Menu */}
                <div className="relative" ref={mobileMoreRef}>
                  <button
                    onClick={() => setMobileMoreOpen(!mobileMoreOpen)}
                    className={`flex flex-col items-center justify-center py-1.5 px-2 sm:px-3 rounded-xl transition-all ${
                      isMoreTab || mobileMoreOpen ? 'text-white' : 'text-gray-500'
                    }`}
                  >
                    <MoreHorizontal className={`w-5 h-5 ${isMoreTab ? 'text-purple-500' : ''}`} />
                    <span className={`text-[9px] sm:text-[10px] mt-1 font-medium ${isMoreTab ? 'text-white' : ''}`}>
                      More
                    </span>
                  </button>
                  
                  {/* More Dropdown */}
                  {mobileMoreOpen && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-40 bg-[#12121a] border border-white/10 rounded-xl shadow-xl overflow-hidden">
                      {moreMenuItems.map((item) => {
                        const IconComponent = item.Icon
                        const isActive = activeTab === item.id
                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              setActiveTab(item.id)
                              setMobileMoreOpen(false)
                            }}
                            className={`w-full px-4 py-3 flex items-center gap-3 transition-all ${
                              isActive 
                                ? 'bg-purple-600/20 text-white' 
                                : 'text-gray-400 hover:bg-white/5 hover:text-white'
                            }`}
                          >
                            <IconComponent className={`w-4 h-4 ${isActive ? 'text-purple-500' : ''}`} />
                            <span className="text-sm font-medium">{item.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </nav>

            {/* Desktop Footer */}
            <footer className="hidden lg:block border-t border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl">
              <div className="max-w-7xl mx-auto px-6 py-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-6">
                    <span className="text-gray-500 text-sm">© 2026 Mexa DEX</span>
                    <button
                      onClick={() => setCurrentPage('terms')}
                      className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                      Terms of Service
                    </button>
                    <button
                      onClick={() => setCurrentPage('privacy')}
                      className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition-colors"
                    >
                      <Shield className="w-4 h-4" />
                      Privacy Policy
                    </button>
                  </div>
                  <div className="flex items-center gap-4">
                    <a href="https://x.com/mexaswap" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    </a>
                    {/* <a href="https://discord.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
                    </a> */}
                    <a href="https://t.me/mexaswap" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                    </a>
                  </div>
                </div>
              </div>
            </footer>
          </div>
        )
}

// Main App Component
function App() {
  const [showLanding, setShowLandingState] = useState(() => !getStoredAppState())
  const [currentPage, setCurrentPage] = useState<PageView>('app')

  const setShowLanding = (show: boolean) => {
    setShowLandingState(show)
    setStoredAppState(!show)
  }

  const handleEnterApp = () => {
    setShowLanding(false)
    setCurrentPage('app')
  }

  const handleBackFromLegal = () => {
    setCurrentPage(showLanding ? 'landing' : 'app')
  }

  // Show legal pages
  if (currentPage === 'terms') {
    return <TermsOfService onBack={handleBackFromLegal} />
  }
  if (currentPage === 'privacy') {
    return <PrivacyPolicy onBack={handleBackFromLegal} />
  }

  if (showLanding) {
    return <LandingPage onEnterApp={handleEnterApp} onShowTerms={() => setCurrentPage('terms')} onShowPrivacy={() => setCurrentPage('privacy')} />
  }

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          modalSize="compact"
          appInfo={{
            appName: appMetadata.appName,
            learnMoreUrl: 'https://docs.monad.xyz',
          }}
        >
          <AppContent 
            showLanding={showLanding}
            setShowLanding={setShowLanding}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
          />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default App
