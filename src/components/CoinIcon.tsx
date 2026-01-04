import { useState } from 'react'
import { getCoinImageUrl } from '../utils/coinUtils'

interface CoinIconProps {
  symbol: string
  size?: number
  className?: string
  fallbackColor?: string
}

/**
 * 币种图标组件
 * 使用 CoinMarketCap 的真实图片，加载失败时显示首字母
 */
export default function CoinIcon({ 
  symbol, 
  size = 32, 
  className = '',
  fallbackColor = 'from-gray-500 to-gray-700'
}: CoinIconProps) {
  const [imageError, setImageError] = useState(false)
  
  // 获取图片尺寸（CMC 支持 64, 128, 200）
  const imageSize = size <= 64 ? 64 : size <= 128 ? 128 : 200
  const imageUrl = getCoinImageUrl(symbol, imageSize)
  
  // 根据币种获取默认渐变色
  const getGradientColor = (sym: string): string => {
    const colors: Record<string, string> = {
      BTC: 'from-orange-400 to-orange-600',
      ETH: 'from-blue-400 to-purple-500',
      SOL: 'from-purple-400 to-pink-500',
      MOVE: 'from-cyan-400 to-teal-500',
      ARB: 'from-blue-500 to-blue-700',
      USDT: 'from-green-400 to-green-600',
      USDC: 'from-blue-400 to-blue-600',
    }
    return colors[sym.toUpperCase()] || fallbackColor
  }
  
  // 如果没有图片 URL 或加载失败，显示首字母
  if (!imageUrl || imageError) {
    return (
      <div 
        className={`rounded-full bg-gradient-to-br ${getGradientColor(symbol)} flex items-center justify-center text-white font-bold ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.4 }}
      >
        {symbol.charAt(0).toUpperCase()}
      </div>
    )
  }
  
  return (
    <img
      src={imageUrl}
      alt={symbol}
      className={`rounded-full ${className}`}
      style={{ width: size, height: size }}
      onError={() => setImageError(true)}
    />
  )
}

