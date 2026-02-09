import { CHAIN_IDS, IS_MEGAETH_TESTNET } from './chains'

// ═══════════════════════════════════════════════════════════════
// MONAD MAINNET CONTRACTS
// ═══════════════════════════════════════════════════════════════
export const MONAD_CONTRACTS = {
  FACTORY: '0x5D36Bfea5074456d383e47F5b4df12186eD6e858' as `0x${string}`,
  ROUTER: '0xa45cc7A52C5179BD24076994Ef253Eb1FB1A9929' as `0x${string}`,
  WETH: '0x3bd359C1119dA7Da1D913D1C4D2B7c461115433A' as `0x${string}`, // WMON
  NATIVE_TOKEN: '0x6d42eFC8B2EC16cC61B47BfC2ABb38D570Faabb5' as `0x${string}`, // QUICK
  MASTERCHEF: '0x1CF67a6Ac3E049E78E6BC22642126C6AB8511d03' as `0x${string}`,
  WETH_TOKEN_PAIR: '0xcf4dc3db3223ee91ff52da4e110ba8abfb943843' as `0x${string}`,
  // Native Staking - Stake MON earn wMON
  NATIVE_STAKING: '0x5ef9Ab66E17b2faF115181375f0d36693d903b2C' as `0x${string}`,
  NATIVE_REWARD: '0x7A3aD02f5c56BAdFbaCd3774B64Ebe39781B0df9' as `0x${string}`,
  // Token Staking - Stake gMONIC earn gMONIC
  TOKEN_STAKING: '0xe7f84191172D345fE14D332effe1e52dc62F5991' as `0x${string}`,
  TOKEN_STAKE: '0xE60F34d23A15B3bB21a60Db26955002F18ef7777' as `0x${string}`,
  TOKEN_REWARD: '0x8002f04f9BDAE352eA3155B8Da985319c225dc75' as `0x${string}`,
  // IDO
  IDO_FACTORY: '0x08CE05Ea572d72c2E221DE63bD2f31b550E3Cd88' as `0x${string}`,
  TIER_STAKING: '0x0D2e15c7b637F59E8D01ED5Ae4DEf1390D45f644' as `0x${string}`,
  // Init code hash
  INIT_CODE_HASH: '0xc5046c562153e8288204e770fc7fec0968c4fb899ad6d483cec04005fa165600',
  // Subgraph
  SUBGRAPH_URL: 'https://api.goldsky.com/api/public/project_cmj7jnjbsro2301stdkaz9yfm/subgraphs/quickswap-monad/v3/gn',
} as const

// ═══════════════════════════════════════════════════════════════
// MEGAETH TESTNET CONTRACTS
// Redeployed: 2026-02-07 (Fixed WETH)
// Deployer: 0xcA6257398c58B6E75dBC0512939e1D758525F7FF
// ═══════════════════════════════════════════════════════════════
export const MEGAETH_TESTNET_CONTRACTS = {
  FACTORY: '0x34edf47275F73821E79e13139baAfC444099F70B' as `0x${string}`,
  ROUTER: '0x4C21DED578388304Dbd2BfCB9fe646e212b2FEF9' as `0x${string}`,
  WETH: '0x399ee46C96350f16D2A57978A7028737a90851EF' as `0x${string}`,
  NATIVE_TOKEN: '0x500b8321F754D282d122eE29F098bF779800CFe7' as `0x${string}`, // MEXA
  MASTERCHEF: '0x75EFAbb29D6b22e721970fA93cAd3c7c64802371' as `0x${string}`,
  WETH_TOKEN_PAIR: '0xd159c91F59A6e715ADBe71a8d46Ca1d46Ad0aEEB' as `0x${string}`,
  // Native Staking - Stake ETH earn rETH
  NATIVE_STAKING: '0xbD066DebC40390EBdC975A4757c3251b96F49495' as `0x${string}`,
  NATIVE_REWARD: '0xdD87AF546ac5a1Fe90586106A2C450931dAb9728' as `0x${string}`,
  // Token Staking - Stake gMEXA earn gMEXA-R
  TOKEN_STAKING: '0xa826f61aa209203303AC5A841F7A4e9c8589DD6A' as `0x${string}`,
  TOKEN_STAKE: '0x7330D58C4CB097fcB3eeAF4263760de8eF7D54f7' as `0x${string}`,
  TOKEN_REWARD: '0x0a6F01bDbAc1B10eb862d2171a74D01598e21613' as `0x${string}`,
  // IDO - IDOFactoryMegaETH with Admin Withdraw Feature
  IDO_FACTORY: '0xB1bfe7E994F8167c13407F54f44F65Cc415EAe2d' as `0x${string}`,
  TIER_STAKING: '0x034504693b048Ef170c155c3395F9e49a901C575' as `0x${string}`,
  // Init code hash
  INIT_CODE_HASH: '0xc5046c562153e8288204e770fc7fec0968c4fb899ad6d483cec04005fa165600',
  // Subgraph - Deployed on Goldsky (v4 - All addresses aligned with contracts.ts)
  SUBGRAPH_URL: 'https://api.goldsky.com/api/public/project_cmj7jnjbsro2301stdkaz9yfm/subgraphs/quickswap-megaeth/v4/gn',
} as const

// ═══════════════════════════════════════════════════════════════
// MEGAETH MAINNET CONTRACTS
// TODO: Replace placeholder addresses after mainnet deployment
// ═══════════════════════════════════════════════════════════════
export const MEGAETH_MAINNET_CONTRACTS = {
  FACTORY: '0x0000000000000000000000000000000000000000' as `0x${string}`,
  ROUTER: '0x0000000000000000000000000000000000000000' as `0x${string}`,
  WETH: '0x0000000000000000000000000000000000000000' as `0x${string}`,
  NATIVE_TOKEN: '0x0000000000000000000000000000000000000000' as `0x${string}`,
  MASTERCHEF: '0x0000000000000000000000000000000000000000' as `0x${string}`,
  WETH_TOKEN_PAIR: '0x0000000000000000000000000000000000000000' as `0x${string}`,
  NATIVE_STAKING: '0x0000000000000000000000000000000000000000' as `0x${string}`,
  NATIVE_REWARD: '0x0000000000000000000000000000000000000000' as `0x${string}`,
  TOKEN_STAKING: '0x0000000000000000000000000000000000000000' as `0x${string}`,
  TOKEN_STAKE: '0x0000000000000000000000000000000000000000' as `0x${string}`,
  TOKEN_REWARD: '0x0000000000000000000000000000000000000000' as `0x${string}`,
  IDO_FACTORY: '0x0000000000000000000000000000000000000000' as `0x${string}`,
  TIER_STAKING: '0x0000000000000000000000000000000000000000' as `0x${string}`,
  INIT_CODE_HASH: '0xc5046c562153e8288204e770fc7fec0968c4fb899ad6d483cec04005fa165600',
  SUBGRAPH_URL: 'https://api.goldsky.com/api/public/project_cmj7jnjbsro2301stdkaz9yfm/subgraphs/quickswap-megaeth-mainnet/v1/gn',
} as const

// Active MegaETH contracts based on network mode
export const MEGAETH_CONTRACTS = IS_MEGAETH_TESTNET ? MEGAETH_TESTNET_CONTRACTS : MEGAETH_MAINNET_CONTRACTS

// ═══════════════════════════════════════════════════════════════
// LEGACY EXPORTS (for backward compatibility)
// ═══════════════════════════════════════════════════════════════
export const CONTRACTS = {
  FACTORY: MONAD_CONTRACTS.FACTORY,
  ROUTER: MONAD_CONTRACTS.ROUTER,
  WMON: MONAD_CONTRACTS.WETH,
  QUICK: MONAD_CONTRACTS.NATIVE_TOKEN,
  MASTERCHEF: MONAD_CONTRACTS.MASTERCHEF,
  WMON_QUICK_PAIR: MONAD_CONTRACTS.WETH_TOKEN_PAIR,
  MONAD_STAKING: MONAD_CONTRACTS.NATIVE_STAKING,
  WMON_REWARD: MONAD_CONTRACTS.NATIVE_REWARD,
  GMONIC_STAKING: MONAD_CONTRACTS.TOKEN_STAKING,
  GMONIC_STAKE: MONAD_CONTRACTS.TOKEN_STAKE,
  GMONIC_REWARD: MONAD_CONTRACTS.TOKEN_REWARD,
} as const

// ═══════════════════════════════════════════════════════════════
// MULTI-CHAIN HELPERS
// ═══════════════════════════════════════════════════════════════

export type ChainContracts = typeof MONAD_CONTRACTS | typeof MEGAETH_CONTRACTS

/**
 * Get contracts for a specific chain
 */
export function getContracts(chainId: number): ChainContracts {
  switch (chainId) {
    case CHAIN_IDS.MEGAETH:
      return MEGAETH_CONTRACTS
    case CHAIN_IDS.MONAD:
    default:
      return MONAD_CONTRACTS
  }
}

/**
 * Get subgraph URL for a specific chain
 */
export function getSubgraphUrl(chainId: number): string {
  const contracts = getContracts(chainId)
  return contracts.SUBGRAPH_URL
}

/**
 * Get native token name for chain
 */
export function getNativeTokenName(chainId: number): { name: string; symbol: string } {
  switch (chainId) {
    case CHAIN_IDS.MEGAETH:
      return { name: 'Mexa Token', symbol: 'MXA' }
    case CHAIN_IDS.MONAD:
    default:
      return { name: 'QuickSwap', symbol: 'QUICK' }
  }
}

/**
 * Get staking token name for chain
 */
export function getStakingTokenName(chainId: number): { name: string; symbol: string } {
  switch (chainId) {
    case CHAIN_IDS.MEGAETH:
      return { name: 'gMEXA', symbol: 'gMEXA' }
    case CHAIN_IDS.MONAD:
    default:
      return { name: 'gMONIC', symbol: 'gMONIC' }
  }
}

// Admin addresses (same across chains)
export const ADMIN_ADDRESSES = {
  MULTIPOOL_STAKING: '0xD0182EB7139dB53194A143a0D64F4B445bfd83bA' as `0x${string}`,
  FARM_PAGE: '0x862345b87b44E71910e1F48aA4BD58DB600e4BEd' as `0x${string}`,
  MEGAETH_DEPLOYER: '0xcA6257398c58B6E75dBC0512939e1D758525F7FF' as `0x${string}`,
} as const

export const FEE = {
  TOTAL_PERCENT: 0.5,
  LP_PERCENT: 0.4,
  PROTOCOL_PERCENT: 0.1,
} as const

// Default tokens per chain
export function getDefaultTokens(chainId: number) {
  const contracts = getContracts(chainId)
  const tokenInfo = getNativeTokenName(chainId)
  
  return [
    { 
      address: contracts.WETH, 
      symbol: chainId === CHAIN_IDS.MEGAETH ? 'WETH' : 'WMON', 
      name: chainId === CHAIN_IDS.MEGAETH ? 'Wrapped Ether' : 'Wrapped MON', 
      decimals: 18 
    },
    { 
      address: contracts.NATIVE_TOKEN, 
      symbol: tokenInfo.symbol, 
      name: tokenInfo.name, 
      decimals: 18 
    },
  ]
}

// Legacy export
export const INIT_CODE_HASH = MONAD_CONTRACTS.INIT_CODE_HASH
export const SUBGRAPH_URL = MONAD_CONTRACTS.SUBGRAPH_URL
export const TOKENS = getDefaultTokens(CHAIN_IDS.MONAD)
