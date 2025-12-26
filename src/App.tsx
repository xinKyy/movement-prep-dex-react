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
        {/* 左侧工具栏 */}
        <div className="w-12 border-r border-dex-border flex flex-col items-center py-4 gap-4">
          <button className="p-2 text-dex-yellow hover:bg-dex-card rounded transition-colors">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </button>
          <div className="w-6 h-px bg-dex-border" />
          <button className="p-2 text-dex-text-secondary hover:text-dex-text hover:bg-dex-card rounded transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <button className="p-2 text-dex-text-secondary hover:text-dex-text hover:bg-dex-card rounded transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </button>
          <button className="p-2 text-dex-text-secondary hover:text-dex-text hover:bg-dex-card rounded transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </button>
          <div className="w-6 h-px bg-dex-border" />
          <button className="p-2 text-dex-text-secondary hover:text-dex-text hover:bg-dex-card rounded transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          <button className="p-2 text-dex-text-secondary hover:text-dex-text hover:bg-dex-card rounded transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
          <button className="p-2 text-dex-text-secondary hover:text-dex-text hover:bg-dex-card rounded transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
          <button className="p-2 text-dex-text-secondary hover:text-dex-text hover:bg-dex-card rounded transition-colors">
            T
          </button>
          <button className="p-2 text-dex-text-secondary hover:text-dex-text hover:bg-dex-card rounded transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>

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

      {/* 底部状态栏 */}
      <footer className="h-8 px-4 flex items-center justify-between border-t border-dex-border text-xs text-dex-text-secondary">
        <div className="flex items-center gap-4">
          <span className="text-dex-green flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-dex-green animate-pulse" />
            在线
          </span>
          <span>延迟: 42ms</span>
        </div>
        <div className="flex items-center gap-4">
          <a href="#" className="hover:text-dex-text">文档</a>
          <a href="#" className="hover:text-dex-text">支持</a>
          <a href="#" className="hover:text-dex-text">条款</a>
          <a href="#" className="hover:text-dex-text">隐私政策</a>
        </div>
      </footer>
    </div>
  )
}

export default App

