import { useState } from 'react'

type Tab = 'positions' | 'orders' | 'history'

export default function PositionsPanel() {
  const [activeTab, setActiveTab] = useState<Tab>('positions')

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'positions', label: '持仓', count: 0 },
    { id: 'orders', label: '挂单', count: 0 },
    { id: 'history', label: '历史' },
  ]

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
                <span className="text-dex-text-secondary">({tab.count})</span>
              )}
            </span>
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-dex-cyan" />
            )}
          </button>
        ))}
      </div>

      {/* 内容区 */}
      <div className="h-32 flex items-center justify-center text-dex-text-secondary text-sm">
        {activeTab === 'positions' && '暂无持仓'}
        {activeTab === 'orders' && '暂无挂单'}
        {activeTab === 'history' && '暂无历史记录'}
      </div>
    </div>
  )
}

