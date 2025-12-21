import { useState } from 'react'
import { useAccount, useDisconnect } from 'wagmi'
import WalletModal from './WalletModal'

interface Props {
  symbol?: string
}

export default function TradePanel({ symbol = 'BTC' }: Props) {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()

  const [orderType, setOrderType] = useState<'market' | 'limit'>('market')
  const [side, setSide] = useState<'long' | 'short'>('long')
  const [leverage, setLeverage] = useState(20)
  const [amount, setAmount] = useState('')
  const [reduceOnly, setReduceOnly] = useState(false)
  const [tpsl, setTpsl] = useState(false)
  const [showWalletModal, setShowWalletModal] = useState(false)

  const sliderSteps = [0, 25, 50, 75, 100]

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  return (
    <div className="flex flex-col h-full bg-dex-bg">
      {/* 杠杆选择 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-dex-border">
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 bg-dex-card border border-dex-border rounded text-sm text-dex-text">
            全仓
          </button>
          <button className="relative group">
            <span className="px-3 py-1.5 bg-dex-card border border-dex-border rounded text-sm text-dex-text flex items-center gap-1">
              {leverage}x
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </span>
          </button>
        </div>
        <select className="px-3 py-1.5 bg-dex-card border border-dex-border rounded text-sm text-dex-text">
          <option>USDC</option>
          <option>USDT</option>
        </select>
      </div>

      {/* 订单类型选择 */}
      <div className="flex border-b border-dex-border">
        {['市价', '限价', '专业'].map((type, index) => (
          <button
            key={type}
            onClick={() => setOrderType(index === 0 ? 'market' : 'limit')}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              (index === 0 && orderType === 'market') || (index === 1 && orderType === 'limit')
                ? 'text-dex-text border-b-2 border-dex-cyan'
                : 'text-dex-text-secondary hover:text-dex-text'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* 买入/卖出切换 */}
      <div className="grid grid-cols-2 gap-2 p-4">
        <button
          onClick={() => setSide('long')}
          className={`py-2.5 rounded font-medium transition-all ${
            side === 'long'
              ? 'bg-dex-green text-white'
              : 'bg-dex-card text-dex-text-secondary hover:text-dex-text border border-dex-border'
          }`}
        >
          买入 / 做多
        </button>
        <button
          onClick={() => setSide('short')}
          className={`py-2.5 rounded font-medium transition-all ${
            side === 'short'
              ? 'bg-dex-red text-white'
              : 'bg-dex-card text-dex-text-secondary hover:text-dex-text border border-dex-border'
          }`}
        >
          卖出/做空
        </button>
      </div>

      {/* 账户信息 */}
      <div className="px-4 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-dex-text-secondary">可用</span>
          <span className="text-dex-text font-mono">0.00 USDC</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-dex-text-secondary">当前仓位</span>
          <span className="text-dex-text font-mono">0.00000 {symbol}</span>
        </div>
      </div>

      {/* 数量输入 */}
      <div className="p-4 space-y-4">
        <div className="space-y-2">
          <label className="text-sm text-dex-text-secondary">数量</label>
          <div className="flex items-center bg-dex-card border border-dex-border rounded overflow-hidden">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="flex-1 px-3 py-2.5 bg-transparent text-dex-text font-mono outline-none"
            />
            <select className="px-3 py-2.5 bg-transparent text-dex-text border-l border-dex-border outline-none">
              <option>USDC</option>
              <option>{symbol}</option>
            </select>
          </div>
        </div>

        {/* 滑块 */}
        <div className="space-y-2">
          <div className="relative h-1 bg-dex-border rounded-full">
            <div className="absolute left-0 top-0 h-full bg-dex-cyan rounded-full" style={{ width: '0%' }} />
            <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-dex-cyan rounded-full cursor-pointer" style={{ left: '0%' }} />
          </div>
          <div className="flex justify-between text-xs text-dex-text-secondary">
            {sliderSteps.map((step) => (
              <button
                key={step}
                className="w-6 h-6 rounded-full bg-dex-card hover:bg-dex-border transition-colors"
              >
                {step === 100 ? '' : ''}
              </button>
            ))}
          </div>
          <div className="flex justify-end">
            <span className="text-sm font-mono text-dex-text">0 %</span>
          </div>
        </div>

        {/* 选项 */}
        <div className="flex items-center gap-6 text-sm">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={reduceOnly}
              onChange={(e) => setReduceOnly(e.target.checked)}
              className="w-4 h-4 rounded border-dex-border bg-dex-card accent-dex-cyan"
            />
            <span className="text-dex-text-secondary">只减仓</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={tpsl}
              onChange={(e) => setTpsl(e.target.checked)}
              className="w-4 h-4 rounded border-dex-border bg-dex-card accent-dex-cyan"
            />
            <span className="text-dex-text-secondary">止盈/止损</span>
          </label>
        </div>
      </div>

      {/* 连接钱包 / 交易按钮 */}
      <div className="mt-auto p-4">
        {isConnected ? (
          <div className="space-y-3">
            <button
              className={`w-full py-3.5 rounded-lg font-bold text-white transition-all ${
                side === 'long'
                  ? 'bg-dex-green hover:bg-dex-green/90'
                  : 'bg-dex-red hover:bg-dex-red/90'
              }`}
            >
              {side === 'long' ? '买入/做多' : '卖出/做空'}
            </button>
            <div className="text-center">
              <span className="text-xs text-dex-text-secondary">
                已连接: {formatAddress(address!)}
              </span>
              <button
                onClick={() => disconnect()}
                className="ml-2 text-xs text-dex-cyan hover:underline"
              >
                断开
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowWalletModal(true)}
            className="w-full py-3.5 rounded-lg font-bold text-black bg-dex-cyan hover:bg-dex-cyan/90 transition-all"
          >
            启用交易
          </button>
        )}
      </div>

      {/* 钱包选择弹窗 */}
      <WalletModal 
        isOpen={showWalletModal} 
        onClose={() => setShowWalletModal(false)} 
      />

      {/* 底部信息 */}
      <div className="px-4 pb-4 space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-dex-text-secondary">强平价格</span>
          <span className="text-dex-text font-mono">N/A</span>
        </div>
        <div className="flex justify-between">
          <span className="text-dex-text-secondary">订单价值</span>
          <span className="text-dex-text font-mono">N/A</span>
        </div>
        <div className="flex justify-between">
          <span className="text-dex-text-secondary">所需保证金</span>
          <span className="text-dex-text font-mono">N/A</span>
        </div>
        <div className="flex justify-between">
          <span className="text-dex-text-secondary">滑点</span>
          <span className="text-dex-text font-mono">Est: 0% / Max: 8.00%</span>
        </div>
      </div>
    </div>
  )
}

