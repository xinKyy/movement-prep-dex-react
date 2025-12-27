// Movement 测试网配置
export const NETWORK_CONFIG = {
  nodeUrl: "https://testnet.movementnetwork.xyz/v1",
  faucetUrl: "https://faucet.testnet.movementnetwork.xyz",
  indexerUrl: "https://indexer.testnet.movementnetwork.xyz/v1/graphql",
  explorerUrl: "https://explorer.movementnetwork.xyz",
  chainId: 250, // Movement Testnet Chain ID
  chainName: "Movement Testnet",
} as const;

// 合约配置
export const CONTRACT_CONFIG = {
  moduleAddress: "0x34fae14ec0eb42191abe3d2cd5cbb2418c4bf88bfcb6e55dbba6df22da64da28",
} as const;

// API 配置
export const API_CONFIG = {
  baseUrl: "https://movement-preps-production.up.railway.app",
} as const;

// 精度常量 (1e8)
export const PRECISION = 100_000_000;

// 精度转换函数
export const toFixed = (value: number): bigint => BigInt(Math.floor(value * PRECISION));
export const fromFixed = (value: string | bigint): number => Number(value) / PRECISION;

// 市场 ID 映射
export const MARKETS = {
  BTC_USDT: 0,
  ETH_USDT: 1,
  SOL_USDT: 2,
  MOVE_USDT: 3,
  ARB_USDT: 4,
} as const;

// 市场信息
export const MARKET_INFO: Record<number, { symbol: string; baseAsset: string; icon: string; color: string }> = {
  0: { symbol: 'BTC/USDT', baseAsset: 'BTC', icon: '₿', color: 'from-orange-400 to-orange-600' },
  1: { symbol: 'ETH/USDT', baseAsset: 'ETH', icon: 'Ξ', color: 'from-blue-400 to-purple-500' },
  2: { symbol: 'SOL/USDT', baseAsset: 'SOL', icon: '◎', color: 'from-purple-400 to-pink-500' },
  3: { symbol: 'MOVE/USDT', baseAsset: 'MOVE', icon: 'M', color: 'from-cyan-400 to-teal-500' },
  4: { symbol: 'ARB/USDT', baseAsset: 'ARB', icon: 'A', color: 'from-blue-500 to-blue-700' },
};
