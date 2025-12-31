import { defineChain } from 'viem'

// Monad logo URL
export const MONAD_LOGO = 'https://imagedelivery.net/cBNDGgkrsEA-b_ixIp9SkQ/MON.png/public'

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
