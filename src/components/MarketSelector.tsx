import { useState, useEffect } from 'react'

interface Market {
  symbol: string        // 显示用的符号 如 BTC-USDC
  binanceSymbol: string // 币安API用的符号 如 BTCUSDT
  name: string
  price: number
  change24h: number
  volume24h: number
  leverage: number
  icon: string          // 代币图标
  color: string         // 图标背景色
}

const defaultMarkets: Market[] = [
  { 
    symbol: 'BTC-USDC', 
    binanceSymbol: 'BTCUSDT',
    name: 'Bitcoin', 
    price: 0, 
    change24h: 0, 
    volume24h: 0, 
    leverage: 40,
    icon: '₿',
    color: 'from-orange-400 to-orange-600'
  },
  { 
    symbol: 'ETH-USDC', 
    binanceSymbol: 'ETHUSDT',
    name: 'Ethereum', 
    price: 0, 
    change24h: 0, 
    volume24h: 0, 
    leverage: 30,
    icon: 'Ξ',
    color: 'from-blue-400 to-purple-500'
  },
  { 
    symbol: 'SOL-USDC', 
    binanceSymbol: 'SOLUSDT',
    name: 'Solana', 
    price: 0, 
    change24h: 0, 
    volume24h: 0, 
    leverage: 20,
    icon: '◎',
    color: 'from-purple-400 to-pink-500'
  },
  { 
    symbol: 'MOVE-USDC', 
    binanceSymbol: 'MOVEUSDT', // 币安有MOVE交易对
    name: 'Movement', 
    price: 0, 
    change24h: 0, 
    volume24h: 0, 
    leverage: 10,
    icon: 'M',
    color: 'from-cyan-400 to-teal-500'
  },
  { 
    symbol: 'ARB-USDC', 
    binanceSymbol: 'ARBUSDT',
    name: 'Arbitrum', 
    price: 0, 
    change24h: 0, 
    volume24h: 0, 
    leverage: 15,
    icon: 'A',
    color: 'from-blue-500 to-blue-700'
  },
]

interface Props {
  onSelect?: (binanceSymbol: string, displaySymbol: string) => void
}

export default function MarketSelector({ onSelect }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [markets, setMarkets] = useState<Market[]>(defaultMarkets)
  const [selectedMarket, setSelectedMarket] = useState(defaultMarkets[0])
  const [searchTerm, setSearchTerm] = useState('')

  // 获取所有市场的实时价格
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const symbols = defaultMarkets.map(m => m.binanceSymbol)
        const response = await fetch(
          `https://api.binance.com/api/v3/ticker/24hr?symbols=${JSON.stringify(symbols)}`
        )
        const data = await response.json()
        
        const updatedMarkets = defaultMarkets.map(market => {
          const ticker = data.find((t: { symbol: string }) => t.symbol === market.binanceSymbol)
          if (ticker) {
            return {
              ...market,
              price: parseFloat(ticker.lastPrice),
              change24h: parseFloat(ticker.priceChangePercent),
              volume24h: parseFloat(ticker.quoteVolume),
            }
          }
          return market
        })
        
        setMarkets(updatedMarkets)
        
        // 更新选中市场的数据
        const updatedSelected = updatedMarkets.find(m => m.symbol === selectedMarket.symbol)
        if (updatedSelected) {
          setSelectedMarket(updatedSelected)
        }
      } catch (error) {
        console.error('Failed to fetch prices:', error)
      }
    }

    fetchPrices()
    const interval = setInterval(fetchPrices, 5000) // 每5秒更新一次
    
    return () => clearInterval(interval)
  }, [selectedMarket.symbol])

  const handleSelect = (market: Market) => {
    setSelectedMarket(market)
    setIsOpen(false)
    onSelect?.(market.binanceSymbol, market.symbol)
  }

  const formatNumber = (num: number) => {
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`
    return `$${num.toLocaleString()}`
  }

  const formatPrice = (price: number) => {
    if (price >= 1000) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    if (price >= 1) return price.toFixed(2)
    return price.toFixed(4)
  }

  const filteredMarkets = markets.filter(market => 
    market.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    market.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2 bg-dex-card hover:bg-dex-border rounded-lg transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${selectedMarket.color} flex items-center justify-center text-white font-bold text-sm`}>
            {selectedMarket.icon}
          </div>
          <span className="font-bold text-dex-text">{selectedMarket.symbol}</span>
          <span className="px-2 py-0.5 bg-dex-cyan/20 text-dex-cyan text-xs font-medium rounded">
            {selectedMarket.leverage}x
          </span>
        </div>
        
        {/* 显示实时价格和涨跌幅 */}
        {selectedMarket.price > 0 && (
          <div className="flex items-center gap-3 ml-2">
            <span className="font-mono text-dex-text">${formatPrice(selectedMarket.price)}</span>
            <span className={`font-mono text-sm ${selectedMarket.change24h >= 0 ? 'text-dex-green' : 'text-dex-red'}`}>
              {selectedMarket.change24h >= 0 ? '+' : ''}{selectedMarket.change24h.toFixed(2)}%
            </span>
          </div>
        )}
        
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
          <div className="absolute top-full left-0 mt-2 w-[480px] bg-dex-card border border-dex-border rounded-lg shadow-xl z-50 overflow-hidden">
            {/* 搜索框 */}
            <div className="p-3 border-b border-dex-border">
              <div className="flex items-center gap-2 px-3 py-2 bg-dex-bg rounded-lg">
                <svg className="w-4 h-4 text-dex-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="搜索市场..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
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
              {filteredMarkets.map((market) => (
                <button
                  key={market.symbol}
                  onClick={() => handleSelect(market)}
                  className={`w-full grid grid-cols-4 gap-2 px-4 py-3 hover:bg-dex-border transition-colors ${
                    selectedMarket.symbol === market.symbol ? 'bg-dex-border' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${market.color} flex items-center justify-center text-white font-bold text-xs`}>
                      {market.icon}
                    </div>
                    <div className="text-left">
                      <span className="text-sm text-dex-text font-medium block">{market.symbol}</span>
                      <span className="text-xs text-dex-text-secondary">{market.name}</span>
                    </div>
                  </div>
                  <span className="text-right text-sm font-mono text-dex-text self-center">
                    ${formatPrice(market.price)}
                  </span>
                  <span className={`text-right text-sm font-mono self-center ${market.change24h >= 0 ? 'text-dex-green' : 'text-dex-red'}`}>
                    {market.change24h >= 0 ? '+' : ''}{market.change24h.toFixed(2)}%
                  </span>
                  <span className="text-right text-sm font-mono text-dex-text-secondary self-center">
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
