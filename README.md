# MetaSpot

**Where real-time markets meet innovation.**

基于 Movement 网络的永续合约交易所界面。

## 技术栈

- **React 18** + TypeScript + Vite
- **TailwindCSS** - 样式框架
- **Wagmi v2** - 以太坊钱包连接
- **Lightweight Charts** - TradingView 轻量级图表库
- **币安 API** - K线数据源

## 功能特性

- 📈 实时 K 线图（支持多时间周期）
- 📊 实时订单簿深度图
- 💱 市价/限价订单面板
- 🔗 MetaMask 钱包连接
- 🌐 支持 Movement 主网/测试网

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 项目结构

```
src/
├── components/
│   ├── Header.tsx          # 顶部导航栏
│   ├── TradingChart.tsx    # K线图表组件
│   ├── OrderBook.tsx       # 订单簿组件
│   ├── TradePanel.tsx      # 交易面板组件
│   ├── MarketSelector.tsx  # 市场选择器
│   └── PositionsPanel.tsx  # 持仓面板
├── config/
│   └── wagmi.ts            # Wagmi 配置
├── App.tsx                 # 主应用组件
├── main.tsx               # 入口文件
└── index.css              # 全局样式
```

## Movement 网络配置

- **主网 RPC**: https://mainnet.movementnetwork.xyz/v1
- **测试网 RPC**: https://testnet.movementnetwork.xyz/v1
- **代币符号**: MOVE

## 许可证

MIT

