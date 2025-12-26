import { useState, useEffect } from 'react'
import { useMarkets, usePrices } from '../hooks/useApi'
import { fromFixed, MARKET_INFO } from '../config/constants'

interface Props {
  onSelect?: (binanceSymbol: string, displaySymbol: string, marketId: number) => void
}

export default function MarketSelector({ onSelect }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedMarketId, setSelectedMarketId] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')

  // 从后端获取市场数据
  const { data: markets, isLoading: marketsLoading } = useMarkets()
  const { data: prices } = usePrices(undefined, 20)

  // 获取当前选中的市场
  const selectedMarket = markets?.find(m => m.id === selectedMarketId)
  const selectedMarketInfo = MARKET_INFO[selectedMarketId]

  // 获取市场价格
  const getMarketPrice = (marketId: number) => {
    const priceData = prices?.find(p => p.marketId === marketId)
    return priceData ? fromFixed(priceData.price) : 0
  }

  // 初始选择
  useEffect(() => {
    if (markets && markets.length > 0 && !selectedMarket) {
      const firstMarket = markets[0]
      setSelectedMarketId(firstMarket.id)
      const binanceSymbol = `${firstMarket.baseAsset}USDT`
      onSelect?.(binanceSymbol, `${firstMarket.baseAsset}-USDC`, firstMarket.id)
    }
  }, [markets, selectedMarket, onSelect])

  const handleSelect = (market: any) => {
    setSelectedMarketId(market.id)
    setIsOpen(false)
    const binanceSymbol = `${market.baseAsset}USDT`
    const displaySymbol = `${market.baseAsset}-USDC`
    onSelect?.(binanceSymbol, displaySymbol, market.id)
  }

  const formatPrice = (price: number) => {
    if (price >= 1000) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    if (price >= 1) return price.toFixed(2)
    if (price >= 0.01) return price.toFixed(4)
    return price.toFixed(6)
  }


  const filteredMarkets = markets?.filter(market =>
    market.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    market.baseAsset.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  const currentPrice = getMarketPrice(selectedMarketId)
  const maxLeverage = selectedMarket ? fromFixed(selectedMarket.maxLeverage) : 100

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2 bg-dex-card hover:bg-dex-border rounded-lg transition-colors"
        disabled={marketsLoading}
      >
        <div className="flex items-center gap-2">
          {selectedMarketInfo && (
            <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${selectedMarketInfo.color} flex items-center justify-center text-white font-bold text-sm`}>
              {selectedMarketInfo.icon}
            </div>
          )}
          <span className="font-bold text-dex-text">
            {selectedMarket ? `${selectedMarket.baseAsset}-USDC` : 'BTC-USDC'}
          </span>
          <span className="px-2 py-0.5 bg-dex-cyan/20 text-dex-cyan text-xs font-medium rounded">
            {maxLeverage}x
          </span>
        </div>

        {/* 显示实时价格 */}
        {currentPrice > 0 && (
          <div className="flex items-center gap-3 ml-2">
            <span className="font-mono text-dex-text">${formatPrice(currentPrice)}</span>
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
              <span className="text-right">最大杠杆</span>
              <span className="text-right">手续费</span>
            </div>

            {/* 市场列表 */}
            <div className="max-h-80 overflow-y-auto">
              {marketsLoading ? (
                <div className="flex items-center justify-center py-8 text-dex-text-secondary">
                  加载中...
                </div>
              ) : filteredMarkets.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-dex-text-secondary">
                  暂无市场
                </div>
              ) : (
                filteredMarkets.map((market) => {
                  const marketInfo = MARKET_INFO[market.id]
                  const price = getMarketPrice(market.id)
                  const leverage = fromFixed(market.maxLeverage)
                  const feeRate = fromFixed(market.feeRate) * 100

                  return (
                    <button
                      key={market.id}
                      onClick={() => handleSelect(market)}
                      className={`w-full grid grid-cols-4 gap-2 px-4 py-3 hover:bg-dex-border transition-colors ${
                        selectedMarketId === market.id ? 'bg-dex-border' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {marketInfo && (
                          <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${marketInfo.color} flex items-center justify-center text-white font-bold text-xs`}>
                            {marketInfo.icon}
                          </div>
                        )}
                        <div className="text-left">
                          <span className="text-sm text-dex-text font-medium block">
                            {market.baseAsset}-USDC
                          </span>
                          <span className="text-xs text-dex-text-secondary">
                            {market.symbol}
                          </span>
                        </div>
                      </div>
                      <span className="text-right text-sm font-mono text-dex-text self-center">
                        ${formatPrice(price)}
                      </span>
                      <span className="text-right text-sm font-mono text-dex-cyan self-center">
                        {leverage}x
                      </span>
                      <span className="text-right text-sm font-mono text-dex-text-secondary self-center">
                        {feeRate.toFixed(2)}%
                      </span>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
