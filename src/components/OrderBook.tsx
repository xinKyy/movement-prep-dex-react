import { useEffect, useState, useRef, useCallback } from 'react'

interface OrderLevel {
  price: number
  quantity: number
  total: number
}

interface Props {
  symbol?: string
}

// 固定显示的订单数量
const ORDER_ROWS = 12

export default function OrderBook({ symbol = 'BTCUSDT' }: Props) {
  const [bids, setBids] = useState<OrderLevel[]>([])
  const [asks, setAsks] = useState<OrderLevel[]>([])
  const [lastPrice, setLastPrice] = useState(0)
  const [priceDirection, setPriceDirection] = useState<'up' | 'down' | null>(null)
  const [spread, setSpread] = useState({ value: 0, percent: 0 })
  const wsRef = useRef<WebSocket | null>(null)
  
  // 缓冲区：累积数据直到填满
  const pendingBidsRef = useRef<OrderLevel[]>([])
  const pendingAsksRef = useRef<OrderLevel[]>([])
  const lastUpdateRef = useRef<number>(0)
  
  // 更新间隔（毫秒）- 控制刷新速度
  const UPDATE_INTERVAL = 1000 // 每秒更新一次

  // 处理订单簿数据
  const processOrderBook = useCallback((rawBids: string[][], rawAsks: string[][]) => {
    let bidTotal = 0
    const processedBids: OrderLevel[] = rawBids.slice(0, ORDER_ROWS).map((bid) => {
      const price = parseFloat(bid[0])
      const quantity = parseFloat(bid[1])
      bidTotal += quantity
      return { price, quantity, total: bidTotal }
    })

    let askTotal = 0
    const processedAsks: OrderLevel[] = rawAsks.slice(0, ORDER_ROWS).reverse().map((ask) => {
      const price = parseFloat(ask[0])
      const quantity = parseFloat(ask[1])
      askTotal += quantity
      return { price, quantity, total: askTotal }
    }).reverse()

    // 存入缓冲区
    pendingBidsRef.current = processedBids
    pendingAsksRef.current = processedAsks

    // 检查是否满足更新条件：数据填满且距离上次更新超过间隔
    const now = Date.now()
    const shouldUpdate = 
      processedBids.length >= ORDER_ROWS && 
      processedAsks.length >= ORDER_ROWS &&
      (now - lastUpdateRef.current) >= UPDATE_INTERVAL

    if (shouldUpdate) {
      lastUpdateRef.current = now
      setBids(processedBids)
      setAsks(processedAsks)

      // 计算价差
      if (processedBids.length > 0 && processedAsks.length > 0) {
        const bestBid = processedBids[0].price
        const bestAsk = processedAsks[processedAsks.length - 1].price
        const spreadValue = bestAsk - bestBid
        const spreadPercent = (spreadValue / bestAsk) * 100
        setSpread({ value: spreadValue, percent: spreadPercent })
      }
    }
  }, [])

  useEffect(() => {
    // 获取初始订单簿数据
    const fetchOrderBook = async () => {
      try {
        const response = await fetch(
          `https://api.binance.com/api/v3/depth?symbol=${symbol}&limit=20`
        )
        const data = await response.json()
        // 初始数据直接显示
        lastUpdateRef.current = 0
        processOrderBook(data.bids, data.asks)
      } catch (error) {
        console.error('Failed to fetch order book:', error)
      }
    }

    fetchOrderBook()

    // WebSocket 实时更新 - 使用较慢的更新频率
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@depth@1000ms`)
    wsRef.current = ws

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.b && data.a) {
        processOrderBook(data.b, data.a)
      }
    }

    // 定时器：确保即使 WebSocket 数据不足也能定期更新
    const intervalId = setInterval(() => {
      const now = Date.now()
      if (
        pendingBidsRef.current.length > 0 && 
        pendingAsksRef.current.length > 0 &&
        (now - lastUpdateRef.current) >= UPDATE_INTERVAL
      ) {
        lastUpdateRef.current = now
        setBids(pendingBidsRef.current)
        setAsks(pendingAsksRef.current)
      }
    }, UPDATE_INTERVAL)

    // 获取实时价格 - 节流处理
    const priceWs = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@trade`)
    let lastPriceUpdate = 0
    const PRICE_UPDATE_INTERVAL = 500 // 价格每500ms更新一次
    
    priceWs.onmessage = (event) => {
      const now = Date.now()
      if (now - lastPriceUpdate < PRICE_UPDATE_INTERVAL) return
      lastPriceUpdate = now

      const data = JSON.parse(event.data)
      const newPrice = parseFloat(data.p)
      setLastPrice((prev) => {
        if (newPrice > prev) setPriceDirection('up')
        else if (newPrice < prev) setPriceDirection('down')
        return newPrice
      })
    }

    return () => {
      ws.close()
      priceWs.close()
      clearInterval(intervalId)
    }
  }, [symbol, processOrderBook])

  const formatPrice = (price: number) => {
    return price.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
  }

  const formatQuantity = (qty: number) => {
    if (qty >= 1000) {
      return (qty / 1000).toFixed(1) + 'K'
    }
    return qty.toLocaleString('en-US', {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    })
  }

  const formatTotal = (total: number) => {
    return total.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
  }

  const maxTotal = Math.max(
    ...bids.map((b) => b.total),
    ...asks.map((a) => a.total)
  )

  return (
    <div className="flex flex-col h-full bg-dex-bg">
      {/* 标题栏 */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-dex-border">
        <div className="flex items-center gap-4">
          <button className="text-sm text-dex-text font-medium">订单簿</button>
          <button className="text-sm text-dex-text-secondary hover:text-dex-text">最新成交</button>
        </div>
        <button className="text-dex-text-secondary hover:text-dex-text">⋮</button>
      </div>

      {/* 表头 */}
      <div className="grid grid-cols-3 gap-2 px-3 py-1.5 text-xs text-dex-text-secondary border-b border-dex-border">
        <span>价格</span>
        <span className="text-right">数量 (USDC)</span>
        <span className="text-right">合计 (USDC)</span>
      </div>

      {/* 卖单 (asks) */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex flex-col">
          {/* 卖单列表 */}
          <div className="flex-1 overflow-y-auto">
            {asks.map((ask, index) => (
              <div
                key={`ask-${index}`}
                className="relative grid grid-cols-3 gap-2 px-3 py-0.5 text-xs font-mono hover:bg-dex-card cursor-pointer"
              >
                {/* 深度背景 */}
                <div
                  className="absolute right-0 top-0 bottom-0 bg-dex-red/10"
                  style={{ width: `${(ask.total / maxTotal) * 100}%` }}
                />
                <span className="relative text-dex-red">{formatPrice(ask.price)}</span>
                <span className="relative text-right text-dex-text">
                  {formatQuantity(ask.quantity)}
                </span>
                <span className="relative text-right text-dex-text-secondary">
                  {formatTotal(ask.total)}
                </span>
              </div>
            ))}
          </div>

          {/* 当前价格 */}
          <div className="flex items-center justify-between px-3 py-2 bg-dex-card border-y border-dex-border">
            <div className="flex items-center gap-2">
              <span
                className={`text-lg font-bold font-mono ${
                  priceDirection === 'up' ? 'text-dex-green' : 'text-dex-red'
                }`}
              >
                {formatPrice(lastPrice)}
              </span>
              <span className={priceDirection === 'up' ? 'text-dex-green' : 'text-dex-red'}>
                {priceDirection === 'up' ? '↑' : '↓'}
              </span>
            </div>
          </div>

          {/* 买单列表 */}
          <div className="flex-1 overflow-y-auto">
            {bids.map((bid, index) => (
              <div
                key={`bid-${index}`}
                className="relative grid grid-cols-3 gap-2 px-3 py-0.5 text-xs font-mono hover:bg-dex-card cursor-pointer"
              >
                {/* 深度背景 */}
                <div
                  className="absolute right-0 top-0 bottom-0 bg-dex-green/10"
                  style={{ width: `${(bid.total / maxTotal) * 100}%` }}
                />
                <span className="relative text-dex-green">{formatPrice(bid.price)}</span>
                <span className="relative text-right text-dex-text">
                  {formatQuantity(bid.quantity)}
                </span>
                <span className="relative text-right text-dex-text-secondary">
                  {formatTotal(bid.total)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 价差信息 */}
      <div className="flex items-center justify-center gap-4 px-3 py-2 border-t border-dex-border text-xs">
        <span className="text-dex-text-secondary">价差</span>
        <span className="font-mono text-dex-text">{spread.value.toFixed(0)}</span>
        <span className="font-mono text-dex-text-secondary">{spread.percent.toFixed(3)}%</span>
      </div>
    </div>
  )
}

