import { useState } from 'react'
import { useWallet } from '@aptos-labs/wallet-adapter-react'
import { usePositions } from '../hooks/useApi'
import { usePerpsContract } from '../hooks/usePerpsContract'
import { MARKET_INFO } from '../config/constants'
import { useToast } from './Toast'

type Tab = 'positions' | 'orders' | 'history'

export default function PositionsPanel() {
  const { account, connected } = useWallet()
  const { data: positionsData, isLoading, refetch } = usePositions(account?.address.toStringLong(), 'OPEN')
  // 历史记录包含 CLOSED 和 LIQUIDATED 两种状态
  const { data: historyData, isLoading: historyLoading, refetch: refetchHistory } = usePositions(account?.address.toStringLong(), undefined, ['CLOSED', 'LIQUIDATED'])
  const { closePosition, loading: closingPosition } = usePerpsContract()
  const { showToast } = useToast()
  const [activeTab, setActiveTab] = useState<Tab>('positions')
  const [closingId, setClosingId] = useState<string | null>(null)

  const positions = positionsData?.positions || []
  const historyPositions = historyData?.positions || []

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'positions', label: '持仓', count: positions.length },
    { id: 'orders', label: '挂单', count: 0 },
    { id: 'history', label: '历史', count: historyPositions.length > 0 ? historyPositions.length : undefined },
  ]

  // 格式化数字 - 后端已经返回转换后的数值字符串，直接解析即可
  const formatNumber = (value: string | number, decimals = 2) => {
    const num = typeof value === 'string' ? parseFloat(value) : value
    return num.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  }

  // 格式化 PnL
  const formatPnL = (pnl: string | undefined) => {
    if (!pnl) return { value: '0.00', isPositive: true }
    const num = parseFloat(pnl)
    return {
      value: (num >= 0 ? '+' : '') + formatNumber(num),
      isPositive: num >= 0,
    }
  }

  // 处理平仓
  const handleClosePosition = async (position: typeof positions[0]) => {
    setClosingId(position.id)
    try {
      // 只需要传递 positionId，后端会处理 chainId 解码
      await closePosition(position.id)
      showToast('平仓成功！', 'success')
      refetch()
      refetchHistory() // 同时刷新历史记录
    } catch (error) {
      console.error('Failed to close position:', error)
      showToast(`平仓失败: ${error instanceof Error ? error.message : '未知错误'}`, 'error')
    } finally {
      setClosingId(null)
    }
  }

  return (
    <div className="bg-dex-bg border-t border-dex-border">
      {/* 标签页 */}
      <div className="flex items-center gap-6 px-4 border-b border-dex-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative py-3 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-dex-text'
                : 'text-dex-text-secondary hover:text-dex-text'
            }`}
          >
            <span className="flex items-center gap-1">
              {tab.label}
              {tab.count !== undefined && (
                <span className={`px-1.5 py-0.5 rounded text-xs ${
                  tab.count > 0 ? 'bg-dex-cyan/20 text-dex-cyan' : 'text-dex-text-secondary'
                }`}>
                  {tab.count}
                </span>
              )}
            </span>
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-dex-cyan" />
            )}
          </button>
        ))}

        {/* 刷新按钮 */}
        <button
          onClick={() => {
            if (activeTab === 'positions') refetch()
            else if (activeTab === 'history') refetchHistory()
          }}
          className="ml-auto p-2 text-dex-text-secondary hover:text-dex-text transition-colors"
          title="刷新"
        >
          <svg className={`w-4 h-4 ${(activeTab === 'positions' && isLoading) || (activeTab === 'history' && historyLoading) ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* 内容区 */}
      <div className="min-h-[120px]">
        {activeTab === 'positions' && (
          <>
            {!connected ? (
              <div className="h-32 flex items-center justify-center text-dex-text-secondary text-sm">
                请先连接钱包查看持仓
              </div>
            ) : isLoading ? (
              <div className="h-32 flex items-center justify-center text-dex-text-secondary text-sm">
                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                加载中...
              </div>
            ) : positions.length === 0 ? (
              <div className="h-32 flex items-center justify-center text-dex-text-secondary text-sm">
                暂无持仓
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-dex-text-secondary text-xs border-b border-dex-border">
                      <th className="px-4 py-2 text-left font-medium">市场</th>
                      <th className="px-4 py-2 text-left font-medium">方向</th>
                      <th className="px-4 py-2 text-right font-medium">仓位价值</th>
                      <th className="px-4 py-2 text-right font-medium">保证金</th>
                      <th className="px-4 py-2 text-right font-medium">杠杆</th>
                      <th className="px-4 py-2 text-right font-medium">开仓价</th>
                      <th className="px-4 py-2 text-right font-medium">现价</th>
                      <th className="px-4 py-2 text-right font-medium">盈亏</th>
                      <th className="px-4 py-2 text-right font-medium">健康度</th>
                      <th className="px-4 py-2 text-center font-medium">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {positions.map((position) => {
                      const marketInfo = MARKET_INFO[position.marketId]
                      const pnl = formatPnL(position.pnl)
                      const healthFactor = position.healthFactor ? Number(position.healthFactor) : null

                      return (
                        <tr key={position.id} className="border-b border-dex-border hover:bg-dex-card">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {marketInfo && (
                                <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${marketInfo.color} flex items-center justify-center text-white text-xs font-bold`}>
                                  {marketInfo.icon}
                                </div>
                              )}
                              <span className="text-dex-text font-medium">{position.symbol}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              position.isLong 
                                ? 'bg-dex-green/20 text-dex-green' 
                                : 'bg-dex-red/20 text-dex-red'
                            }`}>
                              {position.isLong ? '做多' : '做空'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-dex-text">
                            ${formatNumber(position.notional)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-dex-text">
                            ${formatNumber(position.margin)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-dex-text">
                            {formatNumber(position.leverage, 0)}x
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-dex-text">
                            ${formatNumber(position.entryPrice)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-dex-text">
                            {position.currentPrice ? `$${formatNumber(position.currentPrice)}` : '-'}
                          </td>
                          <td className={`px-4 py-3 text-right font-mono ${pnl.isPositive ? 'text-dex-green' : 'text-dex-red'}`}>
                            ${pnl.value}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {healthFactor !== null && (
                              <span className={`font-mono ${
                                healthFactor >= 1.5 ? 'text-dex-green' :
                                healthFactor >= 1.1 ? 'text-dex-yellow' :
                                'text-dex-red'
                              }`}>
                                {healthFactor.toFixed(2)}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => handleClosePosition(position)}
                              disabled={closingPosition || closingId === position.id}
                              className="px-3 py-1 bg-dex-red/20 text-dex-red text-xs font-medium rounded hover:bg-dex-red/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {closingId === position.id ? '平仓中...' : '平仓'}
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {activeTab === 'orders' && (
          <div className="h-32 flex items-center justify-center text-dex-text-secondary text-sm">
            暂无挂单
          </div>
        )}

        {activeTab === 'history' && (
          <>
            {!connected ? (
              <div className="h-32 flex items-center justify-center text-dex-text-secondary text-sm">
                请先连接钱包查看历史记录
              </div>
            ) : historyLoading ? (
              <div className="h-32 flex items-center justify-center text-dex-text-secondary text-sm">
                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                加载中...
              </div>
            ) : historyPositions.length === 0 ? (
              <div className="h-32 flex items-center justify-center text-dex-text-secondary text-sm">
                暂无历史记录
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-dex-text-secondary text-xs border-b border-dex-border">
                      <th className="px-4 py-2 text-left font-medium">市场</th>
                      <th className="px-4 py-2 text-left font-medium">方向</th>
                      <th className="px-4 py-2 text-right font-medium">仓位价值</th>
                      <th className="px-4 py-2 text-right font-medium">保证金</th>
                      <th className="px-4 py-2 text-right font-medium">杠杆</th>
                      <th className="px-4 py-2 text-right font-medium">开仓价</th>
                      <th className="px-4 py-2 text-right font-medium">状态</th>
                      <th className="px-4 py-2 text-right font-medium">平仓时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyPositions.map((position) => {
                      const marketInfo = MARKET_INFO[position.marketId]

                      return (
                        <tr key={position.id} className="border-b border-dex-border hover:bg-dex-card">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {marketInfo && (
                                <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${marketInfo.color} flex items-center justify-center text-white text-xs font-bold`}>
                                  {marketInfo.icon}
                                </div>
                              )}
                              <span className="text-dex-text font-medium">{position.symbol}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              position.isLong
                                ? 'bg-dex-green/20 text-dex-green'
                                : 'bg-dex-red/20 text-dex-red'
                            }`}>
                              {position.isLong ? '做多' : '做空'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-dex-text">
                            ${formatNumber(position.notional)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-dex-text">
                            ${formatNumber(position.margin)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-dex-text">
                            {formatNumber(position.leverage, 0)}x
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-dex-text">
                            ${formatNumber(position.entryPrice)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              position.status === 'LIQUIDATED'
                                ? 'bg-dex-red/20 text-dex-red'
                                : 'bg-dex-text-secondary/20 text-dex-text-secondary'
                            }`}>
                              {position.status === 'LIQUIDATED' ? '已清算' : '已平仓'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-dex-text-secondary text-xs">
                            {position.closedAt ? new Date(position.closedAt).toLocaleString('zh-CN') : '-'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
