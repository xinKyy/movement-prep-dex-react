import { useState } from 'react'
import { useAccount, useDisconnect } from 'wagmi'
import WalletModal from './WalletModal'

export default function Header() {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const [showWalletModal, setShowWalletModal] = useState(false)

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  return (
    <header className="flex items-center justify-between h-14 px-4 bg-dex-bg border-b border-dex-border">
      {/* Logo */}
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-2">
          <img src="/images/logo.jpg" alt="MetaSpot" className="h-8 w-auto" />
          <span className="font-bold text-lg text-dex-text">MetaSpot</span>
        </div>

        {/* 导航链接 */}
        <nav className="flex items-center gap-6">
          <a href="#" className="text-sm text-dex-cyan font-medium">
            交易
          </a>
          <a href="#" className="text-sm text-dex-text-secondary hover:text-dex-text transition-colors">
            投资组合
          </a>
          <a href="#" className="text-sm text-dex-text-secondary hover:text-dex-text transition-colors">
            金库
          </a>
          <a href="#" className="text-sm text-dex-text-secondary hover:text-dex-text transition-colors">
            质押
          </a>
          <a href="#" className="text-sm text-dex-text-secondary hover:text-dex-text transition-colors">
            推荐
          </a>
          <a href="#" className="text-sm text-dex-text-secondary hover:text-dex-text transition-colors">
            排行榜
          </a>
        </nav>
      </div>

      {/* 右侧操作区 */}
      <div className="flex items-center gap-4">
        {/* 公告 */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-dex-card rounded text-sm">
          <span className="text-dex-yellow">Welcome to MetaSpot!</span>
          <span className="text-dex-text-secondary">Where real-time markets meet innovation.</span>
        </div>

        {/* 功能按钮 */}
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-dex-card rounded transition-colors">
            <svg className="w-5 h-5 text-dex-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
          </button>
          <button className="p-2 hover:bg-dex-card rounded transition-colors">
            <svg className="w-5 h-5 text-dex-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>

        {/* 钱包连接 */}
        {isConnected ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => disconnect()}
              className="flex items-center gap-2 px-4 py-2 bg-dex-card border border-dex-border rounded-lg hover:border-dex-cyan transition-colors"
            >
              <div className="w-2 h-2 rounded-full bg-dex-green animate-pulse" />
              <span className="text-sm font-mono text-dex-text">
                {formatAddress(address!)}
              </span>
              <svg className="w-4 h-4 text-dex-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowWalletModal(true)}
            className="px-4 py-2 bg-dex-cyan text-black font-medium rounded-lg hover:bg-dex-cyan/90 transition-colors"
          >
            连接钱包
          </button>
        )}
      </div>

      {/* 钱包选择弹窗 */}
      <WalletModal 
        isOpen={showWalletModal} 
        onClose={() => setShowWalletModal(false)} 
      />
    </header>
  )
}

