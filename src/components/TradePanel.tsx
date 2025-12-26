import { useState } from 'react'
import { useWallet } from '@aptos-labs/wallet-adapter-react'
import { usePerpsContract } from '../hooks/usePerpsContract'
import { useMarket } from '../hooks/useApi'
import { fromFixed } from '../config/constants'
import WalletModal from './WalletModal'

interface Props {
  symbol?: string
  marketId?: number
}

export default function TradePanel({ symbol = 'BTC', marketId = 0 }: Props) {
  const { account, connected } = useWallet()
  const { openPosition, loading: txLoading, error: txError } = usePerpsContract()
  const { data: market } = useMarket(marketId)

  const [orderType, setOrderType] = useState<'market' | 'limit'>('market')
  const [side, setSide] = useState<'long' | 'short'>('long')
  const [leverage, setLeverage] = useState(10)
  const [amount, setAmount] = useState('')
  const [reduceOnly, setReduceOnly] = useState(false)
  const [tpsl, setTpsl] = useState(false)
  const [showWalletModal, setShowWalletModal] = useState(false)
  const [showLeverageMenu, setShowLeverageMenu] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const leverageOptions = [1, 2, 5, 10, 20, 50, 100]
  const sliderSteps = [0, 25, 50, 75, 100]

  const formatAddress = (addr: string | { toString: () => string }) => {
    const addrStr = typeof addr === 'string' ? addr : addr.toString()
    return `${addrStr.slice(0, 6)}...${addrStr.slice(-4)}`
  }

  // 计算预估值
  const margin = parseFloat(amount) || 0
  const notional = margin * leverage
  const feeRate = market ? fromFixed(market.feeRate) : 0.001
  const fee = notional * feeRate
  const maxLeverage = market ? fromFixed(market.maxLeverage) : 100

  // 处理开仓
  const handleOpenPosition = async () => {
    if (!connected || !account?.address || margin <= 0) return

    setIsSubmitting(true)
    try {
      const result = await openPosition(
        marketId,
        side === 'long',
        margin,
        leverage
      )
      console.log('Position opened:', result)
      setAmount('') // 清空输入
      alert('开仓成功！')
    } catch (error) {
      console.error('Failed to open position:', error)
      alert(`开仓失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-dex-bg">
      {/* 杠杆选择 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-dex-border">
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 bg-dex-card border border-dex-border rounded text-sm text-dex-text">
            全仓
          </button>
          <div className="relative">
            <button 
              onClick={() => setShowLeverageMenu(!showLeverageMenu)}
              className="px-3 py-1.5 bg-dex-card border border-dex-border rounded text-sm text-dex-text flex items-center gap-1"
            >
              {leverage}x
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showLeverageMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowLeverageMenu(false)} />
                <div className="absolute top-full left-0 mt-1 bg-dex-card border border-dex-border rounded-lg shadow-xl z-50 overflow-hidden">
                  {leverageOptions.filter(l => l <= maxLeverage).map((lev) => (
                    <button
                      key={lev}
                      onClick={() => {
                        setLeverage(lev)
                        setShowLeverageMenu(false)
                      }}
                      className={`w-full px-4 py-2 text-sm text-left hover:bg-dex-border transition-colors ${
                        leverage === lev ? 'text-dex-cyan bg-dex-border' : 'text-dex-text'
                      }`}
                    >
                      {lev}x
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
        <select className="px-3 py-1.5 bg-dex-card border border-dex-border rounded text-sm text-dex-text">
          <option>USDT</option>
          <option>FUSD</option>
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
          <span className="text-dex-text font-mono">
            {connected ? '1,000.00 FUSD' : '0.00 FUSD'}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-dex-text-secondary">当前仓位</span>
          <span className="text-dex-text font-mono">0.00000 {symbol}</span>
        </div>
      </div>

      {/* 数量输入 */}
      <div className="p-4 space-y-4">
        <div className="space-y-2">
          <label className="text-sm text-dex-text-secondary">保证金</label>
          <div className="flex items-center bg-dex-card border border-dex-border rounded overflow-hidden">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="flex-1 px-3 py-2.5 bg-transparent text-dex-text font-mono outline-none"
            />
            <span className="px-3 py-2.5 text-dex-text border-l border-dex-border">
              FUSD
            </span>
          </div>
        </div>

        {/* 快捷选择 */}
        <div className="flex gap-2">
          {sliderSteps.map((step) => (
            <button
              key={step}
              onClick={() => setAmount(((1000 * step) / 100).toString())}
              className="flex-1 py-1.5 text-xs bg-dex-card hover:bg-dex-border border border-dex-border rounded transition-colors text-dex-text-secondary"
            >
              {step}%
            </button>
          ))}
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
        {connected && account ? (
          <div className="space-y-3">
            <button
              onClick={handleOpenPosition}
              disabled={isSubmitting || txLoading || margin <= 0}
              className={`w-full py-3.5 rounded-lg font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                side === 'long'
                  ? 'bg-dex-green hover:bg-dex-green/90'
                  : 'bg-dex-red hover:bg-dex-red/90'
              }`}
            >
              {isSubmitting || txLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  处理中...
                </span>
              ) : (
                side === 'long' ? '买入/做多' : '卖出/做空'
              )}
            </button>
            <div className="text-center">
              <span className="text-xs text-dex-text-secondary">
                已连接: {formatAddress(account.address.toString())}
              </span>
            </div>
            {txError && (
              <p className="text-xs text-dex-red text-center">{txError}</p>
            )}
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
          <span className="text-dex-text-secondary">仓位价值</span>
          <span className="text-dex-text font-mono">
            {notional > 0 ? `$${notional.toLocaleString()}` : 'N/A'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-dex-text-secondary">预估手续费</span>
          <span className="text-dex-text font-mono">
            {fee > 0 ? `$${fee.toFixed(2)}` : 'N/A'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-dex-text-secondary">所需保证金</span>
          <span className="text-dex-text font-mono">
            {margin > 0 ? `$${margin.toFixed(2)}` : 'N/A'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-dex-text-secondary">杠杆</span>
          <span className="text-dex-text font-mono">{leverage}x</span>
        </div>
      </div>
    </div>
  )
}
