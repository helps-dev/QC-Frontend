import { getContracts, MONAD_CONTRACTS, MEGAETH_CONTRACTS } from './contracts'
import { CHAIN_IDS, MONAD_LOGO, ETH_LOGO, WETH_LOGO, MEXA_LOGO, GMEXA_LOGO } from './chains'

export interface Token {
  address: `0x${string}`
  symbol: string
  name: string
  decimals: number
  isNative?: boolean
  logoURI?: string
}

// Native token address (address 0x0 represents native)
export const NATIVE_ADDRESS = '0x0000000000000000000000000000000000000000' as `0x${string}`

// ═══════════════════════════════════════════════════════════════
// MONAD TOKENS
// ═══════════════════════════════════════════════════════════════

export const MON_TOKEN: Token = {
  address: NATIVE_ADDRESS,
  symbol: 'MON',
  name: 'Monad',
  decimals: 18,
  isNative: true,
  logoURI: MONAD_LOGO
}

export const WMON_TOKEN: Token = {
  address: MONAD_CONTRACTS.WETH,
  symbol: 'WMON',
  name: 'Wrapped MON',
  decimals: 18,
  isNative: false,
  logoURI: MONAD_LOGO
}

export const QUICK_TOKEN: Token = {
  address: MONAD_CONTRACTS.NATIVE_TOKEN,
  symbol: 'QUICK',
  name: 'QuickSwap Token',
  decimals: 18,
  isNative: false,
}

export const USDC_MONAD_TOKEN: Token = {
  address: '0x754704Bc059F8C67012fEd69BC8A327a5aafb603' as `0x${string}`,
  symbol: 'USDC',
  name: 'USD Coin',
  decimals: 6,
  isNative: false,
  logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png'
}

// ═══════════════════════════════════════════════════════════════
// MEGAETH TOKENS
// ═══════════════════════════════════════════════════════════════

export const ETH_TOKEN: Token = {
  address: NATIVE_ADDRESS,
  symbol: 'ETH',
  name: 'Ether',
  decimals: 18,
  isNative: true,
  logoURI: ETH_LOGO
}

export const WETH_TOKEN: Token = {
  address: MEGAETH_CONTRACTS.WETH,
  symbol: 'WETH',
  name: 'Wrapped ETH',
  decimals: 18,
  isNative: false,
  logoURI: WETH_LOGO
}

export const MEXA_TOKEN: Token = {
  address: MEGAETH_CONTRACTS.NATIVE_TOKEN,
  symbol: 'MXA',
  name: 'Mexa Token',
  decimals: 18,
  isNative: false,
  logoURI: MEXA_LOGO
}

export const GMEXA_TOKEN: Token = {
  address: MEGAETH_CONTRACTS.TOKEN_STAKE,
  symbol: 'gMEXA',
  name: 'gMEXA Stake',
  decimals: 18,
  isNative: false,
  logoURI: GMEXA_LOGO
}

// ═══════════════════════════════════════════════════════════════
// MULTI-CHAIN TOKEN HELPERS
// ═══════════════════════════════════════════════════════════════

export function getNativeToken(chainId: number): Token {
  switch (chainId) {
    case CHAIN_IDS.MEGAETH:
      return ETH_TOKEN
    case CHAIN_IDS.MONAD:
    default:
      return MON_TOKEN
  }
}

export function getWrappedToken(chainId: number): Token {
  switch (chainId) {
    case CHAIN_IDS.MEGAETH:
      return WETH_TOKEN
    case CHAIN_IDS.MONAD:
    default:
      return WMON_TOKEN
  }
}

export function getDefaultTokens(chainId: number): Token[] {
  switch (chainId) {
    case CHAIN_IDS.MEGAETH:
      return [ETH_TOKEN, WETH_TOKEN, MEXA_TOKEN, GMEXA_TOKEN]
    case CHAIN_IDS.MONAD:
    default:
      return [MON_TOKEN, WMON_TOKEN, USDC_MONAD_TOKEN]
  }
}

export function getGovernanceToken(chainId: number): Token {
  switch (chainId) {
    case CHAIN_IDS.MEGAETH:
      return MEXA_TOKEN
    case CHAIN_IDS.MONAD:
    default:
      return QUICK_TOKEN
  }
}

export function isNativeToken(token: Token): boolean {
  return token.address === NATIVE_ADDRESS || token.isNative === true
}

export function getRouteAddress(token: Token, chainId: number): `0x${string}` {
  if (isNativeToken(token)) {
    const contracts = getContracts(chainId)
    return contracts.WETH
  }
  return token.address
}

// ═══════════════════════════════════════════════════════════════
// LOCAL STORAGE FOR IMPORTED TOKENS
// ═══════════════════════════════════════════════════════════════

export const IMPORTED_TOKENS_KEY = 'mexa_imported_tokens'

export function getStoredTokens(chainId: number): Token[] {
  try {
    const key = `${IMPORTED_TOKENS_KEY}_${chainId}`
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

export function saveToken(token: Token, chainId: number): void {
  const tokens = getStoredTokens(chainId)
  if (!tokens.find(t => t.address.toLowerCase() === token.address.toLowerCase())) {
    tokens.push(token)
    const key = `${IMPORTED_TOKENS_KEY}_${chainId}`
    localStorage.setItem(key, JSON.stringify(tokens))
  }
}

export function removeToken(address: string, chainId: number): void {
  const key = `${IMPORTED_TOKENS_KEY}_${chainId}`
  const tokens = getStoredTokens(chainId).filter(t => t.address.toLowerCase() !== address.toLowerCase())
  localStorage.setItem(key, JSON.stringify(tokens))
}

// ═══════════════════════════════════════════════════════════════
// LEGACY EXPORTS (backward compatibility)
// ═══════════════════════════════════════════════════════════════

export const DEFAULT_TOKENS: Token[] = [MON_TOKEN, WMON_TOKEN, USDC_MONAD_TOKEN]
export const USDC_TOKEN = USDC_MONAD_TOKEN

import { CONTRACTS } from './contracts'
export { CONTRACTS }
