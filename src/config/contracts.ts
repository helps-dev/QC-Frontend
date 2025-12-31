// QuickSwap Monad Mainnet Contract Addresses
export const CONTRACTS = {
  FACTORY: '0x5D36Bfea5074456d383e47F5b4df12186eD6e858' as `0x${string}`,
  ROUTER: '0xa45cc7A52C5179BD24076994Ef253Eb1FB1A9929' as `0x${string}`,
  WMON: '0x3bd359C1119dA7Da1D913D1C4D2B7c461115433A' as `0x${string}`,
  QUICK: '0x6d42eFC8B2EC16cC61B47BfC2ABb38D570Faabb5' as `0x${string}`,
  MASTERCHEF: '0x1CF67a6Ac3E049E78E6BC22642126C6AB8511d03' as `0x${string}`,
  WMON_QUICK_PAIR: '0xcf4dc3db3223ee91ff52da4e110ba8abfb943843' as `0x${string}`,
  // MonadStaking - Stake MON/MONIC earn wMON
  MONAD_STAKING: '0x5ef9Ab66E17b2faF115181375f0d36693d903b2C' as `0x${string}`,
  WMON_REWARD: '0x7A3aD02f5c56BAdFbaCd3774B64Ebe39781B0df9' as `0x${string}`,
  // GmonicStaking - Stake gMONIC earn gMONIC (V4 - deployer as owner)
  GMONIC_STAKING: '0xe7f84191172D345fE14D332effe1e52dc62F5991' as `0x${string}`,
  GMONIC_STAKE: '0xE60F34d23A15B3bB21a60Db26955002F18ef7777' as `0x${string}`,
  GMONIC_REWARD: '0x8002f04f9BDAE352eA3155B8Da985319c225dc75' as `0x${string}`,
} as const

// Admin addresses
export const ADMIN_ADDRESSES = {
  MULTIPOOL_STAKING: '0xD0182EB7139dB53194A143a0D64F4B445bfd83bA' as `0x${string}`,
  FARM_PAGE: '0x862345b87b44E71910e1F48aA4BD58DB600e4BEd' as `0x${string}`,
} as const

export const INIT_CODE_HASH = '0xc5046c562153e8288204e770fc7fec0968c4fb899ad6d483cec04005fa165600'

export const FEE = {
  TOTAL_PERCENT: 0.5,
  LP_PERCENT: 0.4,
  PROTOCOL_PERCENT: 0.1,
} as const

export const SUBGRAPH_URL = 'https://api.goldsky.com/api/public/project_cmj7jnjbsro2301stdkaz9yfm/subgraphs/quickswap-monad/v3/gn'

export const TOKENS = [
  { address: CONTRACTS.WMON, symbol: 'WMON', name: 'Wrapped MON', decimals: 18 },
  { address: CONTRACTS.QUICK, symbol: 'QUICK', name: 'QuickSwap', decimals: 18 },
]
