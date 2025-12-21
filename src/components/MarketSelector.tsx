import { useState } from 'react'

interface Market {
  symbol: string
  name: string
  price: number
  change24h: number
  volume24h: number
  leverage: number
}

const markets: Market[] = [
  { symbol: 'BTC-USDC', name: 'Bitcoin', price: 88594, change24h: 0.39, volume24h: 684762536.40, leverage: 40 },
  { symbol: 'ETH-USDC', name: 'Ethereum', price: 3245.67, change24h: -1.23, volume24h: 245678901.23, leverage: 30 },
  { symbol: 'SOL-USDC', name: 'Solana', price: 178.45, change24h: 2.15, volume24h: 123456789.01, leverage: 20 },
  { symbol: 'ARB-USDC', name: 'Arbitrum', price: 1.234, change24h: -0.56, volume24h: 45678901.23, leverage: 15 },
  { symbol: 'MOVE-USDC', name: 'Movement', price: 0.8765, change24h: 5.67, volume24h: 12345678.90, leverage: 10 },
]

interface Props {
  onSelect?: (symbol: string) => void
}

export default function MarketSelector({ onSelect }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedMarket, setSelectedMarket] = useState(markets[0])

  const handleSelect = (market: Market) => {
    setSelectedMarket(market)
    setIsOpen(false)
    onSelect?.(market.symbol.replace('-', ''))
  }

  const formatNumber = (num: number) => {
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`
    return `$${num.toLocaleString()}`
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2 bg-dex-card hover:bg-dex-border rounded-lg transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-xs">
            ₿
          </div>
          <span className="font-bold text-dex-text">{selectedMarket.symbol}</span>
          <span className="px-2 py-0.5 bg-dex-cyan/20 text-dex-cyan text-xs font-medium rounded">
            {selectedMarket.leverage}x
          </span>
        </div>
        <svg
          className={`w-4 h-4 text-dex-text-secondary transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-2 w-96 bg-dex-card border border-dex-border rounded-lg shadow-xl z-50 overflow-hidden">
            {/* 搜索框 */}
            <div className="p-3 border-b border-dex-border">
              <div className="flex items-center gap-2 px-3 py-2 bg-dex-bg rounded-lg">
                <svg className="w-4 h-4 text-dex-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="搜索市场..."
                  className="flex-1 bg-transparent text-sm text-dex-text placeholder-dex-text-secondary outline-none"
                />
              </div>
            </div>

            {/* 表头 */}
            <div className="grid grid-cols-4 gap-2 px-4 py-2 text-xs text-dex-text-secondary border-b border-dex-border">
              <span>市场</span>
              <span className="text-right">价格</span>
              <span className="text-right">24h变化</span>
              <span className="text-right">24h成交量</span>
            </div>

            {/* 市场列表 */}
            <div className="max-h-80 overflow-y-auto">
              {markets.map((market) => (
                <button
                  key={market.symbol}
                  onClick={() => handleSelect(market)}
                  className={`w-full grid grid-cols-4 gap-2 px-4 py-3 hover:bg-dex-border transition-colors ${
                    selectedMarket.symbol === market.symbol ? 'bg-dex-border' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-[10px]">
                      {market.symbol.charAt(0)}
                    </div>
                    <span className="text-sm text-dex-text font-medium">{market.symbol}</span>
                  </div>
                  <span className="text-right text-sm font-mono text-dex-text">
                    ${market.price.toLocaleString()}
                  </span>
                  <span className={`text-right text-sm font-mono ${market.change24h >= 0 ? 'text-dex-green' : 'text-dex-red'}`}>
                    {market.change24h >= 0 ? '+' : ''}{market.change24h.toFixed(2)}%
                  </span>
                  <span className="text-right text-sm font-mono text-dex-text-secondary">
                    {formatNumber(market.volume24h)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

