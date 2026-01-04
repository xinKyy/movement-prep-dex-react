import { useState } from 'react'
import { useWallet } from '@aptos-labs/wallet-adapter-react'
import WalletModal from './WalletModal'
import { usePerpsContract } from '../hooks/usePerpsContract'
import { useToast } from './Toast'

export default function Header() {
  const { account, connected, disconnect } = useWallet()
  const { mintMockUSDT, loading: txLoading } = usePerpsContract()
  const { showToast } = useToast()
  const [showWalletModal, setShowWalletModal] = useState(false)
  const [isMinting, setIsMinting] = useState(false)

  const formatAddress = (addr: string | { toString: () => string }) => {
    const addrStr = typeof addr === 'string' ? addr : addr.toString()
    return `${addrStr.slice(0, 6)}...${addrStr.slice(-4)}`
  }

  // 处理 Mint Mock USDT - 固定 mint 10000 USDT (6位小数)
  const handleMintMockUSDT = async () => {
    if (!connected || !account?.address) return

    setIsMinting(true)
    try {
      const result = await mintMockUSDT(10000) // 固定 mint 10000 USDT
      console.log('Mint success:', result)
      showToast(`成功 Mint 10000 Mock USDT！`, 'success')
    } catch (error) {
      console.error('Failed to mint:', error)
      showToast(`Mint 失败: ${error instanceof Error ? error.message : '未知错误'}`, 'error')
    } finally {
      setIsMinting(false)
    }
  }

  return (
    <header className="flex items-center justify-between h-14 px-4 bg-dex-bg border-b border-dex-border">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <img src="/images/logo.jpg" alt="MetaSpot" className="h-8 w-auto" />
        <span className="font-bold text-lg text-dex-text">MetaSpot</span>
      </div>

      {/* 右侧操作区 */}
      <div className="flex items-center gap-3">
        {/* 网络标识 */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-dex-card border border-dex-border rounded text-xs">
          <span className="w-2 h-2 rounded-full bg-dex-cyan animate-pulse" />
          <span className="text-dex-text-secondary">Movement Testnet</span>
        </div>

        {/* Mint 按钮和钱包连接 */}
        {connected && account ? (
          <div className="flex items-center gap-2">
            <button
              onClick={handleMintMockUSDT}
              disabled={isMinting || txLoading}
              className="px-4 py-2 bg-dex-green/20 text-dex-green border border-dex-green/40 rounded-lg hover:bg-dex-green/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              {isMinting ? 'Minting...' : 'Mint USDT'}
            </button>
            <button
              onClick={() => disconnect()}
              className="flex items-center gap-2 px-4 py-2 bg-dex-card border border-dex-border rounded-lg hover:border-dex-cyan transition-colors"
            >
              <div className="w-2 h-2 rounded-full bg-dex-green animate-pulse" />
              <span className="text-sm font-mono text-dex-text">
                {formatAddress(account.address.toString())}
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
