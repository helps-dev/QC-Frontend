/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WALLETCONNECT_PROJECT_ID: string
  readonly VITE_CHAIN_ID: string
  readonly VITE_MONAD_RPC: string
  readonly VITE_FACTORY_ADDRESS: string
  readonly VITE_ROUTER_ADDRESS: string
  readonly VITE_WMON_ADDRESS: string
  readonly VITE_QUICK_ADDRESS: string
  readonly VITE_MASTERCHEF_ADDRESS: string
  readonly VITE_SUBGRAPH_URL: string
  readonly VITE_INIT_CODE_HASH: string
  readonly VITE_FEE_PERCENT: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
