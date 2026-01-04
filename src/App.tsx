import { useState } from 'react'
import Header from './components/Header'
import TradingChart from './components/TradingChart'
import OrderBook from './components/OrderBook'
import TradePanel from './components/TradePanel'
import MarketSelector from './components/MarketSelector'
import PositionsPanel from './components/PositionsPanel'

function App() {
  const [symbol, setSymbol] = useState('BTCUSDT')
  const [displaySymbol, setDisplaySymbol] = useState('BTC-USDC')
  const [marketId, setMarketId] = useState(0)
  const [interval] = useState('1h')

  const handleMarketChange = (binanceSymbol: string, display: string, id: number) => {
    setSymbol(binanceSymbol)
    setDisplaySymbol(display)
    setMarketId(id)
  }

  // 从 symbol 提取基础代币
  const baseToken = displaySymbol.split('-')[0]

  return (
    <div className="flex flex-col h-screen bg-dex-bg">
      {/* 顶部导航 */}
      <Header />

      {/* 主内容区 */}
      <div className="flex-1 flex overflow-hidden">

        {/* 中间图表区 */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* 市场选择器 */}
          <div className="px-4 py-2 border-b border-dex-border">
            <MarketSelector onSelect={handleMarketChange} />
          </div>

          {/* K线图 */}
          <div className="flex-1 relative min-h-0">
            <TradingChart symbol={symbol} interval={interval} marketId={marketId} />
          </div>

          {/* 持仓面板 */}
          <PositionsPanel />
        </div>

        {/* 右侧面板 */}
        <div className="w-[580px] flex border-l border-dex-border">
          {/* 订单簿 */}
          <div className="w-[280px] border-r border-dex-border">
            <OrderBook symbol={symbol} />
          </div>

          {/* 交易面板 */}
          <div className="flex-1">
            <TradePanel symbol={baseToken} marketId={marketId} />
          </div>
        </div>
      </div>

    </div>
  )
}

export default App

