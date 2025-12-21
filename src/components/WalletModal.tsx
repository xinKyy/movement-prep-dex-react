import { useConnect } from 'wagmi'

interface Props {
  isOpen: boolean
  onClose: () => void
}

// 钱包描述
const walletDescriptions: Record<string, string> = {
  MetaMask: '流行的浏览器扩展钱包',
  'Coinbase Wallet': 'Coinbase 官方钱包',
  WalletConnect: '连接多种移动端钱包',
  Injected: '使用浏览器注入的钱包',
}

// 备用图标颜色（当没有icon时使用）
const walletColors: Record<string, string> = {
  MetaMask: 'from-orange-500 to-orange-600',
  'Coinbase Wallet': 'from-blue-500 to-blue-600',
  WalletConnect: 'from-blue-400 to-purple-500',
  Injected: 'from-gray-500 to-gray-600',
}

export default function WalletModal({ isOpen, onClose }: Props) {
  const { connectors, connect, isPending } = useConnect()

  if (!isOpen) return null

  const handleConnect = (connector: typeof connectors[number]) => {
    connect({ connector })
    onClose()
  }

  // 获取钱包图标
  const getWalletIcon = (connector: typeof connectors[number]) => {
    // connector.icon 是钱包提供的图标 URL
    if (connector.icon) {
      return (
        <img 
          src={connector.icon} 
          alt={connector.name}
          className="w-8 h-8 object-contain"
        />
      )
    }
    
    // 备用：显示首字母
    return (
      <span className="text-white font-bold text-lg">
        {connector.name.charAt(0)}
      </span>
    )
  }

  return (
    <>
      {/* 背景遮罩 */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fade-in"
        onClick={onClose}
      />
      
      {/* 弹窗内容 */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md animate-scale-in">
        <div className="bg-dex-card border border-dex-border rounded-2xl shadow-2xl overflow-hidden">
          {/* 头部 */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-dex-border">
            <h2 className="text-lg font-bold text-dex-text">连接钱包</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-dex-border rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-dex-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 钱包列表 */}
          <div className="p-4 space-y-3">
            <p className="text-sm text-dex-text-secondary mb-4">
              选择你想要连接的钱包。如果你还没有钱包，可以选择一个提供商来创建。
            </p>
            
            {connectors.map((connector) => {
              const colorClass = walletColors[connector.name] || 'from-gray-600 to-gray-700'
              const description = walletDescriptions[connector.name] || '点击连接'
              const hasIcon = !!connector.icon
              
              return (
                <button
                  key={connector.uid}
                  onClick={() => handleConnect(connector)}
                  disabled={isPending}
                  className="w-full flex items-center gap-4 p-4 bg-dex-bg hover:bg-dex-border border border-dex-border hover:border-dex-cyan rounded-xl transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {/* 钱包图标 */}
                  <div 
                    className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform overflow-hidden ${
                      hasIcon ? 'bg-white p-2' : `bg-gradient-to-br ${colorClass}`
                    }`}
                  >
                    {getWalletIcon(connector)}
                  </div>
                  
                  {/* 钱包信息 */}
                  <div className="flex-1 text-left">
                    <span className="text-dex-text font-medium block">
                      {connector.name}
                    </span>
                    <span className="text-xs text-dex-text-secondary">
                      {description}
                    </span>
                  </div>
                  
                  {/* 箭头 */}
                  <svg 
                    className="w-5 h-5 text-dex-text-secondary group-hover:text-dex-cyan group-hover:translate-x-1 transition-all" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )
            })}
          </div>

          {/* 底部提示 */}
          <div className="px-6 py-4 bg-dex-bg border-t border-dex-border">
            <p className="text-xs text-dex-text-secondary text-center">
              连接钱包即表示你同意我们的{' '}
              <a href="#" className="text-dex-cyan hover:underline">服务条款</a>
              {' '}和{' '}
              <a href="#" className="text-dex-cyan hover:underline">隐私政策</a>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
