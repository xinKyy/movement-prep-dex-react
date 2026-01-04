import coinData from '../config/coin'

// CoinMarketCap 图片 URL 基础路径
const CMC_IMAGE_BASE = 'https://s2.coinmarketcap.com/static/img/coins'

// 币种数据类型
interface CoinInfo {
  id: number
  name: string
  symbol: string
  slug: string
}

// 预定义的常用币种 ID 映射（加速查找）
const KNOWN_COIN_IDS: Record<string, number> = {
  BTC: 1,
  ETH: 1027,
  SOL: 5426,
  ARB: 11841,
  USDT: 825,
  USDC: 3408,
  MOVE: 32452, // Movement Network
}

// 缓存已查找的币种
const coinCache = new Map<string, CoinInfo | null>()

/**
 * 通过 symbol 查找币种信息
 */
export function getCoinBySymbol(symbol: string): CoinInfo | null {
  const upperSymbol = symbol.toUpperCase()
  
  // 检查缓存
  if (coinCache.has(upperSymbol)) {
    return coinCache.get(upperSymbol) || null
  }
  
  // 先检查预定义 ID
  if (KNOWN_COIN_IDS[upperSymbol]) {
    const coin = coinData.find((c: CoinInfo) => c.id === KNOWN_COIN_IDS[upperSymbol])
    if (coin) {
      coinCache.set(upperSymbol, coin)
      return coin
    }
  }
  
  // 从完整数据中查找
  const coin = coinData.find((c: CoinInfo) => c.symbol === upperSymbol)
  coinCache.set(upperSymbol, coin || null)
  return coin || null
}

/**
 * 获取币种图片 URL
 * @param symbol 币种符号，如 'BTC', 'ETH'
 * @param size 图片尺寸，可选 64, 128, 200
 */
export function getCoinImageUrl(symbol: string, size: 64 | 128 | 200 = 64): string | null {
  const upperSymbol = symbol.toUpperCase()
  
  // 先检查预定义 ID（更快）
  const knownId = KNOWN_COIN_IDS[upperSymbol]
  if (knownId) {
    return `${CMC_IMAGE_BASE}/${size}x${size}/${knownId}.png`
  }
  
  // 从数据中查找
  const coin = getCoinBySymbol(upperSymbol)
  if (coin) {
    return `${CMC_IMAGE_BASE}/${size}x${size}/${coin.id}.png`
  }
  
  return null
}

/**
 * 获取币种 ID
 */
export function getCoinId(symbol: string): number | null {
  const upperSymbol = symbol.toUpperCase()
  
  // 先检查预定义 ID
  if (KNOWN_COIN_IDS[upperSymbol]) {
    return KNOWN_COIN_IDS[upperSymbol]
  }
  
  const coin = getCoinBySymbol(upperSymbol)
  return coin?.id || null
}

// 导出预定义 ID 供外部使用
export { KNOWN_COIN_IDS }

