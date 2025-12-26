import { useWallet } from '@aptos-labs/wallet-adapter-react';

interface Props {
  isOpen: boolean
  onClose: () => void
}

// 钱包描述
const walletDescriptions: Record<string, string> = {
  'Nightly': '⭐ Movement 官方推荐',
  'Razor Wallet': '⭐ Movement 官方推荐',
  'OKX Wallet': '⭐ Movement 官方推荐',
  Petra: 'Aptos 官方钱包',
  'Pontem Wallet': '支持多链的安全钱包',
  Martian: '功能丰富的 Move 钱包',
}

export default function WalletModal({ isOpen, onClose }: Props) {
  const { wallets, connect } = useWallet();

  if (!isOpen) return null

  const handleConnect = async (walletName: string) => {
    try {
      connect(walletName);
      onClose();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  }

  // 获取可用的钱包
  const availableWallets = wallets?.filter(wallet => wallet.readyState === 'Installed') || [];
  const otherWallets = wallets?.filter(wallet => wallet.readyState !== 'Installed') || [];

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
            <div>
              <h2 className="text-lg font-bold text-dex-text">连接钱包</h2>
              <p className="text-xs text-dex-text-secondary mt-1">Movement Testnet</p>
            </div>
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
          <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
            {/* 已安装的钱包 */}
            {availableWallets.length > 0 && (
              <>
                <p className="text-xs text-dex-text-secondary mb-2">已安装</p>
                {availableWallets.map((wallet) => (
                  <button
                    key={wallet.name}
                    onClick={() => handleConnect(wallet.name)}
                    className="w-full flex items-center gap-4 p-4 bg-dex-bg hover:bg-dex-border border border-dex-border hover:border-dex-cyan rounded-xl transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {/* 钱包图标 */}
                    <div className="w-12 h-12 rounded-xl bg-white p-2 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform overflow-hidden">
                      {wallet.icon ? (
                        <img
                          src={wallet.icon}
                          alt={wallet.name}
                          className="w-8 h-8 object-contain"
                        />
                      ) : (
                        <span className="text-2xl font-bold text-gray-600">
                          {wallet.name.charAt(0)}
                        </span>
                      )}
                    </div>

                    {/* 钱包信息 */}
                    <div className="flex-1 text-left">
                      <span className="text-dex-text font-medium block">
                        {wallet.name}
                      </span>
                      <span className="text-xs text-dex-text-secondary">
                        {walletDescriptions[wallet.name] || '点击连接'}
                      </span>
                    </div>

                    {/* 状态指示 */}
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-dex-green animate-pulse" />
                      <svg
                        className="w-5 h-5 text-dex-text-secondary group-hover:text-dex-cyan group-hover:translate-x-1 transition-all"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                ))}
              </>
            )}

            {/* 其他可用钱包 */}
            {otherWallets.length > 0 && (
              <>
                <p className="text-xs text-dex-text-secondary mb-2 mt-4">
                  {availableWallets.length > 0 ? '更多钱包' : '请安装以下钱包'}
                </p>
                {otherWallets.slice(0, 5).map((wallet) => (
                  <a
                    key={wallet.name}
                    href={wallet.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center gap-4 p-4 bg-dex-bg hover:bg-dex-border border border-dex-border rounded-xl transition-all group opacity-60 hover:opacity-100"
                  >
                    {/* 钱包图标 */}
                    <div className="w-12 h-12 rounded-xl bg-gray-700 p-2 flex items-center justify-center shadow-lg overflow-hidden">
                      {wallet.icon ? (
                        <img
                          src={wallet.icon}
                          alt={wallet.name}
                          className="w-8 h-8 object-contain"
                        />
                      ) : (
                        <span className="text-2xl font-bold text-gray-400">
                          {wallet.name.charAt(0)}
                        </span>
                      )}
                    </div>

                    {/* 钱包信息 */}
                    <div className="flex-1 text-left">
                      <span className="text-dex-text font-medium block">
                        {wallet.name}
                      </span>
                      <span className="text-xs text-dex-cyan">
                        点击安装 →
                      </span>
                    </div>
                  </a>
                ))}
              </>
            )}

            {/* 无钱包提示 */}
            {wallets?.length === 0 && (
              <div className="text-center py-8">
                <p className="text-dex-text-secondary">未检测到钱包</p>
                <p className="text-xs text-dex-text-secondary mt-2">
                  请安装 Petra、Pontem 或 Martian 钱包
                </p>
              </div>
            )}
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
