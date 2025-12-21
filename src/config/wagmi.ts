import { http, createConfig } from 'wagmi'
import { mainnet, sepolia } from 'wagmi/chains'

// Movement 网络配置
const movementMainnet = {
  id: 30732,
  name: 'Movement',
  nativeCurrency: {
    decimals: 18,
    name: 'MOVE',
    symbol: 'MOVE',
  },
  rpcUrls: {
    default: {
      http: ['https://mainnet.movementnetwork.xyz/v1'],
    },
  },
  blockExplorers: {
    default: { name: 'Movement Explorer', url: 'https://explorer.movementnetwork.xyz' },
  },
} as const

const movementTestnet = {
  id: 30733,
  name: 'Movement Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'MOVE',
    symbol: 'MOVE',
  },
  rpcUrls: {
    default: {
      http: ['https://testnet.movementnetwork.xyz/v1'],
    },
  },
  blockExplorers: {
    default: { name: 'Movement Explorer', url: 'https://explorer.testnet.movementnetwork.xyz' },
  },
  testnet: true,
} as const

export const config = createConfig({
  chains: [movementMainnet, movementTestnet, mainnet, sepolia],
  transports: {
    [movementMainnet.id]: http(),
    [movementTestnet.id]: http(),
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}

