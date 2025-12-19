import { CONTRACTS } from './contracts'

export interface Token {
  address: `0x${string}`
  symbol: string
  name: string
  decimals: number
  isNative?: boolean
}

// Native MON token (address 0x0 represents native)
export const NATIVE_ADDRESS = '0x0000000000000000000000000000000000000000' as `0x${string}`

export const MON_TOKEN: Token = {
  address: NATIVE_ADDRESS,
  symbol: 'MON',
  name: 'Monad',
  decimals: 18,
  isNative: true
}

export const WMON_TOKEN: Token = {
  address: CONTRACTS.WMON,
  symbol: 'WMON',
  name: 'Wrapped MON',
  decimals: 18,
  isNative: false
}

export const QUICK_TOKEN: Token = {
  address: CONTRACTS.QUICK,
  symbol: 'QUICK',
  name: 'QuickSwap Token',
  decimals: 18,
  isNative: false
}

export const DEFAULT_TOKENS: Token[] = [MON_TOKEN, WMON_TOKEN, QUICK_TOKEN]

// Local storage key for imported tokens
export const IMPORTED_TOKENS_KEY = 'quickswap_imported_tokens'

export function getStoredTokens(): Token[] {
  try {
    const stored = localStorage.getItem(IMPORTED_TOKENS_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

export function saveToken(token: Token): void {
  const tokens = getStoredTokens()
  if (!tokens.find(t => t.address.toLowerCase() === token.address.toLowerCase())) {
    tokens.push(token)
    localStorage.setItem(IMPORTED_TOKENS_KEY, JSON.stringify(tokens))
  }
}

export function removeToken(address: string): void {
  const tokens = getStoredTokens().filter(t => t.address.toLowerCase() !== address.toLowerCase())
  localStorage.setItem(IMPORTED_TOKENS_KEY, JSON.stringify(tokens))
}
