import { useEffect, useRef, useState } from 'react'
import { createChart, IChartApi, ISeriesApi, CandlestickData, HistogramData, Time } from 'lightweight-charts'

interface KlineData {
  time: Time
  open: number
  high: number
  low: number
  close: number
  volume: number
}

interface Props {
  symbol?: string
  interval?: string
  marketId?: number
}

export default function TradingChart({ symbol = 'BTCUSDT', interval = '1h', marketId = 0 }: Props) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  
  const [priceInfo, setPriceInfo] = useState({
    open: 0,
    high: 0,
    low: 0,
    close: 0,
    change: 0,
    changePercent: 0,
  })

  // 获取历史K线数据
  const fetchKlineData = async (): Promise<KlineData[]> => {
    try {
      const response = await fetch(
        `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=500`
      )
      const data = await response.json()
      
      return data.map((item: (string | number)[]) => ({
        time: (Number(item[0]) / 1000) as Time,
        open: parseFloat(item[1] as string),
        high: parseFloat(item[2] as string),
        low: parseFloat(item[3] as string),
        close: parseFloat(item[4] as string),
        volume: parseFloat(item[5] as string),
      }))
    } catch (error) {
      console.error('Failed to fetch kline data:', error)
      return []
    }
  }

  useEffect(() => {
    if (!chartContainerRef.current) return

    // 创建图表
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: '#0d0d0d' },
        textColor: '#848e9c',
      },
      grid: {
        vertLines: { color: '#1f1f1f' },
        horzLines: { color: '#1f1f1f' },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: '#505050',
          labelBackgroundColor: '#1f1f1f',
        },
        horzLine: {
          color: '#505050',
          labelBackgroundColor: '#1f1f1f',
        },
      },
      rightPriceScale: {
        borderColor: '#1f1f1f',
        scaleMargins: {
          top: 0.1,
          bottom: 0.2,
        },
      },
      timeScale: {
        borderColor: '#1f1f1f',
        timeVisible: true,
        secondsVisible: false,
      },
    })

    // K线图系列
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#0ecb81',
      downColor: '#f6465d',
      borderDownColor: '#f6465d',
      borderUpColor: '#0ecb81',
      wickDownColor: '#f6465d',
      wickUpColor: '#0ecb81',
    })

    // 成交量系列
    const volumeSeries = chart.addHistogramSeries({
      color: '#26a69a',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '',
    })

    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    })

    chartRef.current = chart
    candlestickSeriesRef.current = candlestickSeries
    volumeSeriesRef.current = volumeSeries

    // 加载历史数据
    fetchKlineData().then((data) => {
      if (data.length > 0) {
        const candleData: CandlestickData[] = data.map((d) => ({
          time: d.time,
          open: d.open,
          high: d.high,
          low: d.low,
          close: d.close,
        }))

        const volumeData: HistogramData[] = data.map((d) => ({
          time: d.time,
          value: d.volume,
          color: d.close >= d.open ? 'rgba(14, 203, 129, 0.5)' : 'rgba(246, 70, 93, 0.5)',
        }))

        candlestickSeries.setData(candleData)
        volumeSeries.setData(volumeData)

        // 设置初始价格信息
        const lastCandle = data[data.length - 1]
        const firstCandle = data[0]
        const change = lastCandle.close - firstCandle.open
        const changePercent = (change / firstCandle.open) * 100

        setPriceInfo({
          open: lastCandle.open,
          high: lastCandle.high,
          low: lastCandle.low,
          close: lastCandle.close,
          change,
          changePercent,
        })
      }
    })

    // WebSocket 实时数据
    const wsUrl = `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@kline_${interval}`
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data)
      if (message.k) {
        const kline = message.k
        const candleData: CandlestickData = {
          time: (kline.t / 1000) as Time,
          open: parseFloat(kline.o),
          high: parseFloat(kline.h),
          low: parseFloat(kline.l),
          close: parseFloat(kline.c),
        }

        const volumeData: HistogramData = {
          time: (kline.t / 1000) as Time,
          value: parseFloat(kline.v),
          color: candleData.close >= candleData.open 
            ? 'rgba(14, 203, 129, 0.5)' 
            : 'rgba(246, 70, 93, 0.5)',
        }

        candlestickSeriesRef.current?.update(candleData)
        volumeSeriesRef.current?.update(volumeData)

        setPriceInfo((prev) => ({
          ...prev,
          open: candleData.open,
          high: candleData.high,
          low: candleData.low,
          close: candleData.close,
          change: candleData.close - candleData.open,
          changePercent: ((candleData.close - candleData.open) / candleData.open) * 100,
        }))
      }
    }

    // 响应式调整
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        })
      }
    }

    window.addEventListener('resize', handleResize)
    handleResize()

    return () => {
      window.removeEventListener('resize', handleResize)
      ws.close()
      chart.remove()
    }
  }, [symbol, interval])

  const formatPrice = (price: number) => {
    return price.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  // 获取显示用的symbol
  const displaySymbol = symbol.replace('USDT', '-USDC')
  
  // 获取基础代币用于显示图标
  const baseToken = symbol.replace('USDT', '')
  const tokenInfo: Record<string, { icon: string; color: string; leverage: number }> = {
    BTC: { icon: '₿', color: 'from-orange-400 to-orange-600', leverage: 40 },
    ETH: { icon: 'Ξ', color: 'from-blue-400 to-purple-500', leverage: 30 },
    SOL: { icon: '◎', color: 'from-purple-400 to-pink-500', leverage: 20 },
    MOVE: { icon: 'M', color: 'from-cyan-400 to-teal-500', leverage: 10 },
    ARB: { icon: 'A', color: 'from-blue-500 to-blue-700', leverage: 15 },
  }
  const currentToken = tokenInfo[baseToken] || { icon: baseToken.charAt(0), color: 'from-gray-400 to-gray-600', leverage: 20 }

  return (
    <div className="flex flex-col h-full bg-dex-bg">
      {/* 价格信息栏 */}
      <div className="flex items-center gap-6 px-4 py-2 border-b border-dex-border text-sm">
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${currentToken.color} flex items-center justify-center text-white font-bold text-xs`}>
            {currentToken.icon}
          </div>
          <span className="text-dex-yellow font-bold">{displaySymbol}</span>
          <span className="bg-dex-cyan/20 text-dex-cyan px-2 py-0.5 rounded text-xs font-medium">
            {currentToken.leverage}x
          </span>
        </div>
        
        <div className="flex items-center gap-4 font-mono">
          <div>
            <span className="text-dex-text-secondary text-xs">标记</span>
            <span className={`ml-2 ${priceInfo.change >= 0 ? 'text-dex-green' : 'text-dex-red'}`}>
              {formatPrice(priceInfo.close)}
            </span>
          </div>
          
          <div>
            <span className="text-dex-text-secondary text-xs">预言机</span>
            <span className="ml-2 text-dex-text">{formatPrice(priceInfo.close * 1.0005)}</span>
          </div>
          
          <div>
            <span className="text-dex-text-secondary text-xs">24h变化</span>
            <span className={`ml-2 ${priceInfo.changePercent >= 0 ? 'text-dex-green' : 'text-dex-red'}`}>
              {priceInfo.changePercent >= 0 ? '+' : ''}{formatPrice(priceInfo.change)} / {priceInfo.changePercent >= 0 ? '+' : ''}{priceInfo.changePercent.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      {/* 时间周期选择 */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-dex-border text-xs">
        {['5分', '1小时', '天'].map((t, i) => (
          <button
            key={t}
            className={`px-3 py-1 rounded transition-colors ${
              i === 1
                ? 'bg-dex-cyan/20 text-dex-cyan'
                : 'text-dex-text-secondary hover:text-dex-text hover:bg-dex-card'
            }`}
          >
            {t}
          </button>
        ))}
        <div className="w-px h-4 bg-dex-border mx-2" />
        <button className="px-3 py-1 text-dex-text-secondary hover:text-dex-text">
          🔧 指标
        </button>
      </div>

      {/* K线图容器 */}
      <div ref={chartContainerRef} className="flex-1 min-h-0" />
      
      {/* TradingView 标识 */}
      <div className="absolute bottom-4 left-4 flex items-center gap-2 text-xs text-dex-text-secondary">
        <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center font-bold text-white">
          TV
        </div>
      </div>
    </div>
  )
}

