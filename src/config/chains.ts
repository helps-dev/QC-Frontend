import { defineChain } from 'viem'

// ═══════════════════════════════════════════════════════════════
// NETWORK MODE FLAG
// Set to false when deploying to MegaETH Mainnet
// ═══════════════════════════════════════════════════════════════
export const IS_MEGAETH_TESTNET = true

// Network logos
export const MONAD_LOGO = 'https://imagedelivery.net/cBNDGgkrsEA-b_ixIp9SkQ/MON.png/public'
export const MEGAETH_LOGO = 'https://pbs.twimg.com/profile_images/1858182037498662912/IwLMKBYB_400x400.jpg'

// Token logos - hosted locally
export const ETH_LOGO = 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png'
export const WETH_LOGO = 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png'
export const MEXA_LOGO = '/mexa-logo.png'
export const GMEXA_LOGO = '/mexa-logo.png'

// Monad Mainnet
export const monadMainnet = defineChain({
  id: 143,
  name: 'Monad',
  nativeCurrency: {
    decimals: 18,
    name: 'MON',
    symbol: 'MON',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.monad.xyz'],
    },
  },
  blockExplorers: {
    default: { name: 'MonadScan', url: 'https://monadscan.com' },
  },
  iconUrl: MONAD_LOGO,
})

// MegaETH - Testnet or Mainnet based on flag
export const megaethChain = defineChain({
  id: IS_MEGAETH_TESTNET ? 6343 : 6342,
  name: IS_MEGAETH_TESTNET ? 'MegaETH Testnet' : 'MegaETH',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: [IS_MEGAETH_TESTNET ? 'https://carrot.megaeth.com/rpc' : 'https://rpc.megaeth.com'],
    },
  },
  blockExplorers: {
    default: {
      name: 'MegaETH Explorer',
      url: IS_MEGAETH_TESTNET ? 'https://megaeth.blockscout.com' : 'https://megaeth.blockscout.com',
    },
  },
  testnet: IS_MEGAETH_TESTNET,
  iconUrl: MEGAETH_LOGO,
})

// Backward compatibility alias
export const megaethTestnet = megaethChain

// Supported chains
export const SUPPORTED_CHAINS = [monadMainnet, megaethChain] as const

// Chain IDs
export const CHAIN_IDS = {
  MONAD: 143,
  MEGAETH: megaethChain.id,
} as const

// Network display name
export function getNetworkName(chainId: number): string {
  switch (chainId) {
    case CHAIN_IDS.MEGAETH:
      return IS_MEGAETH_TESTNET ? 'MegaETH Testnet' : 'MegaETH'
    case CHAIN_IDS.MONAD:
    default:
      return 'Monad'
  }
}

// Get chain logo by ID
export function getChainLogo(chainId: number): string {
  switch (chainId) {
    case CHAIN_IDS.MONAD:
      return MONAD_LOGO
    case CHAIN_IDS.MEGAETH:
      return MEGAETH_LOGO
    default:
      return MEGAETH_LOGO
  }
}

// Get native token symbol by chain ID
export function getNativeSymbol(chainId: number): string {
  switch (chainId) {
    case CHAIN_IDS.MONAD:
      return 'MON'
    case CHAIN_IDS.MEGAETH:
      return 'ETH'
    default:
      return 'ETH'
  }
}

// Get wrapped native token symbol by chain ID
export function getWrappedSymbol(chainId: number): string {
  switch (chainId) {
    case CHAIN_IDS.MONAD:
      return 'WMON'
    case CHAIN_IDS.MEGAETH:
      return 'WETH'
    default:
      return 'WETH'
  }
}

// Get explorer URL for address
export function getExplorerUrl(chainId: number, address: string): string {
  switch (chainId) {
    case CHAIN_IDS.MEGAETH:
      return `https://megaeth.blockscout.com/address/${address}`
    case CHAIN_IDS.MONAD:
    default:
      return `https://monadscan.com/address/${address}`
  }
}

// Get explorer URL for transaction
export function getTxExplorerUrl(chainId: number, txHash: string): string {
  switch (chainId) {
    case CHAIN_IDS.MEGAETH:
      return `https://megaeth.blockscout.com/tx/${txHash}`
    case CHAIN_IDS.MONAD:
    default:
      return `https://monadscan.com/tx/${txHash}`
  }
}
