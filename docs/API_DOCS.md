# Movement Perps API 文档

## Base URL

```
生产环境: https://movement-preps-production.up.railway.app
本地开发: https://movement-preps-production.up.railway.app
```

## 响应格式

所有接口返回统一格式：

```json
{
  "data": { ... },  // 成功时返回数据
  "error": null     // 失败时返回错误信息
}
```

## 精度说明

所有金额、价格、比率使用**固定点数**表示（精度 1e8）：

| 实际值 | API 返回值 |
|--------|------------|
| 100.5 | "10050000000" |
| 0.1 (10%) | "10000000" |

**前端转换公式：**
```typescript
const PRECISION = 100_000_000;

// API 返回值 → 实际数值
const realValue = Number(apiValue) / PRECISION;

// 实际数值 → API 参数
const apiValue = Math.floor(realValue * PRECISION);
```

---

## 接口列表

### 1. 健康检查

#### GET /health

检查服务状态。

**响应:**
```json
{
  "data": {
    "status": "ok",
    "timestamp": "2025-12-23T12:00:00.000Z",
    "services": {
      "api": "ok",
      "database": "ok"
    }
  }
}
```

---

### 2. 市场

#### GET /markets

获取所有市场列表。

**响应:**
```json
{
  "data": [
    {
      "id": 0,
      "symbol": "BTC/USDT",
      "baseAsset": "BTC",
      "quoteAsset": "USDT",
      "maxLeverage": "10000000000",    // 100x
      "initMr": "10000000",            // 10%
      "maintMr": "6250000",            // 6.25%
      "feeRate": "100000",             // 0.1%
      "liqRewardRate": "5000000",      // 5%
      "settlementTokenId": 0,
      "isActive": true,
      "createdAt": "2025-12-23T12:00:00.000Z",
      "updatedAt": "2025-12-23T12:00:00.000Z"
    }
  ]
}
```

#### GET /markets/:id

获取市场详情（含最新价格）。

**响应:**
```json
{
  "data": {
    "id": 0,
    "symbol": "BTC/USDT",
    "baseAsset": "BTC",
    "quoteAsset": "USDT",
    "maxLeverage": "10000000000",
    "initMr": "10000000",
    "maintMr": "6250000",
    "feeRate": "100000",
    "liqRewardRate": "5000000",
    "settlementTokenId": 0,
    "isActive": true,
    "openPositions": 15,
    "latestPrice": {
      "price": "10000000000000",       // $100,000
      "timestamp": "2025-12-23T12:00:00.000Z",
      "source": "binance"
    },
    "createdAt": "2025-12-23T12:00:00.000Z",
    "updatedAt": "2025-12-23T12:00:00.000Z"
  }
}
```

---

### 3. 价格

#### GET /prices

获取最近价格记录。

**Query 参数:**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| marketId | number | 否 | 市场 ID |
| limit | number | 否 | 返回数量 (默认 10) |

**响应:**
```json
{
  "data": [
    {
      "id": "xxx",
      "marketId": 0,
      "symbol": "BTC/USDT",
      "price": "10000000000000",
      "source": "binance",
      "timestamp": "2025-12-23T12:00:00.000Z"
    }
  ]
}
```

---

### 4. 开仓

#### POST /orders

创建开仓订单，返回交易 payload 供前端签名。

**请求体:**
```json
{
  "userAddr": "0x1234...",        // 用户钱包地址
  "marketId": 0,                   // 市场 ID
  "side": "LONG",                  // "LONG" 或 "SHORT"
  "margin": 100,                   // 保证金 (实际值，如 100 USDT)
  "leverage": 10,                  // 杠杆倍数 (如 10x)
  "acceptablePrice": 100500        // 可选，滑点保护价格
}
```

**响应:**
```json
{
  "data": {
    "message": "Transaction payload generated. Please sign and submit to chain.",
    "txPayload": {
      "function": "0x...::perps::open_position_entry",
      "functionArguments": [
        0,                          // marketId
        true,                       // isLong
        "10000000000",              // margin (固定点数)
        "1000000000",               // leverage (固定点数)
        "0xadmin..."                // adminAddr
      ]
    },
    "params": {
      "userAddr": "0x1234...",
      "marketId": 0,
      "side": "LONG",
      "margin": "10000000000",
      "leverage": "1000000000",
      "currentPrice": "10000000000000",
      "acceptablePrice": null
    }
  }
}
```

---

### 5. 平仓

#### POST /orders/close

用户平仓，返回交易 payload 供前端签名。

**请求体:**
```json
{
  "positionId": "xxx",             // 持仓 ID
  "userAddr": "0x1234...",         // 用户钱包地址
  "minExitPrice": 99000            // 可选，滑点保护价格
}
```

**响应:**
```json
{
  "data": {
    "message": "Transaction payload generated. Please sign and submit to chain.",
    "txPayload": {
      "function": "0x...::perps::close_position_by_trader_entry",
      "functionArguments": [
        0,                          // marketId
        "123",                      // positionId (链上)
        "0xadmin..."                // adminAddr
      ]
    },
    "params": {
      "positionId": "xxx",
      "chainId": "12345",
      "chainPositionId": "123",
      "marketId": 0,
      "currentPrice": "10000000000000",
      "estimatedPnl": "500000000",
      "estimatedPayout": "10500000000"
    }
  }
}
```

---

### 6. 持仓

#### GET /positions

获取持仓列表。

**Query 参数:**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| user | string | 否 | 用户地址 |
| marketId | number | 否 | 市场 ID |
| status | string | 否 | "OPEN" / "CLOSED" / "LIQUIDATED" |
| limit | number | 否 | 返回数量 (默认 20) |
| offset | number | 否 | 偏移量 (默认 0) |

**响应:**
```json
{
  "data": {
    "positions": [
      {
        "id": "xxx",
        "chainId": "12345",
        "userAddr": "0x1234...",
        "marketId": 0,
        "symbol": "BTC/USDT",
        "isLong": true,
        "margin": "10000000000",
        "leverage": "1000000000",
        "notional": "100000000000",
        "entryPrice": "10000000000000",
        "feesPaid": "10000000",
        "fundingPaid": "0",
        "status": "OPEN",
        "healthFactor": "1.5000",
        "openedAt": "2025-12-23T12:00:00.000Z",
        "closedAt": null
      }
    ],
    "pagination": {
      "total": 100,
      "limit": 20,
      "offset": 0
    }
  }
}
```

#### GET /positions/:id

获取持仓详情（含实时 PnL 和健康度）。

**响应:**
```json
{
  "data": {
    "id": "xxx",
    "chainId": "12345",
    "userAddr": "0x1234...",
    "marketId": 0,
    "symbol": "BTC/USDT",
    "isLong": true,
    "margin": "10000000000",
    "leverage": "1000000000",
    "notional": "100000000000",
    "entryPrice": "10000000000000",
    "feesPaid": "10000000",
    "fundingPaid": "0",
    "status": "OPEN",
    "currentPrice": "10100000000000",
    "pnl": "100000000",
    "marginRatio": "0.101000",
    "healthFactor": "1.6160",
    "isLiquidatable": false,
    "openedAt": "2025-12-23T12:00:00.000Z",
    "closedAt": null,
    "liquidation": null
  }
}
```

---

### 7. 清算记录

#### GET /liquidations

获取清算历史。

**Query 参数:**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| trader | string | 否 | 被清算用户地址 |
| liquidator | string | 否 | 清算者地址 |
| limit | number | 否 | 返回数量 |
| offset | number | 否 | 偏移量 |

**响应:**
```json
{
  "data": {
    "liquidations": [
      {
        "id": "xxx",
        "positionId": "xxx",
        "marketId": 0,
        "symbol": "BTC/USDT",
        "traderAddr": "0x1234...",
        "liquidatorAddr": "0x5678...",
        "isLong": true,
        "margin": "10000000000",
        "leverage": "1000000000",
        "liquidationPrice": "9500000000000",
        "rewardToLiquidator": "50000000",
        "valueToVault": "950000000",
        "txHash": "0x...",
        "createdAt": "2025-12-23T12:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 10,
      "limit": 20,
      "offset": 0
    }
  }
}
```

---

## 前端使用流程

### 交易流程图

```
┌─────────────────────────────────────────────────────────────────┐
│                         开仓流程                                 │
├─────────────────────────────────────────────────────────────────┤
│  1. 用户输入参数                                                 │
│     ↓                                                           │
│  2. POST /orders → 获取 txPayload                               │
│     ↓                                                           │
│  3. 前端调用钱包签名 txPayload                                   │
│     ↓                                                           │
│  4. 提交交易到链上                                               │
│     ↓                                                           │
│  5. 后端 Event Listener 自动同步持仓                             │
│     ↓                                                           │
│  6. GET /positions?user=xxx 查看持仓                            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                         平仓流程                                 │
├─────────────────────────────────────────────────────────────────┤
│  1. GET /positions/:id 获取持仓详情和预估 PnL                    │
│     ↓                                                           │
│  2. POST /orders/close → 获取 txPayload                         │
│     ↓                                                           │
│  3. 前端调用钱包签名 txPayload                                   │
│     ↓                                                           │
│  4. 提交交易到链上                                               │
│     ↓                                                           │
│  5. 后端 Event Listener 自动更新持仓状态                         │
└─────────────────────────────────────────────────────────────────┘
```

### 前端代码示例

```typescript
import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';

const API_BASE = 'https://your-api.railway.app';
const PRECISION = 100_000_000;

// 1. 获取市场列表
async function getMarkets() {
  const res = await fetch(`${API_BASE}/markets`);
  const { data } = await res.json();
  return data.map(m => ({
    ...m,
    maxLeverage: Number(m.maxLeverage) / PRECISION,
    feeRate: Number(m.feeRate) / PRECISION,
  }));
}

// 2. 获取最新价格
async function getPrice(marketId: number) {
  const res = await fetch(`${API_BASE}/prices?marketId=${marketId}&limit=1`);
  const { data } = await res.json();
  return data[0] ? Number(data[0].price) / PRECISION : null;
}

// 3. 开仓
async function openPosition(
  wallet: any, // 钱包实例
  userAddr: string,
  marketId: number,
  side: 'LONG' | 'SHORT',
  margin: number,
  leverage: number
) {
  // 3.1 获取交易 payload
  const res = await fetch(`${API_BASE}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userAddr, marketId, side, margin, leverage }),
  });
  const { data } = await res.json();

  // 3.2 签名并提交交易
  const txPayload = data.txPayload;
  const tx = await wallet.signAndSubmitTransaction({
    data: {
      function: txPayload.function,
      functionArguments: txPayload.functionArguments,
    },
  });

  return tx;
}

// 4. 获取用户持仓
async function getUserPositions(userAddr: string) {
  const res = await fetch(`${API_BASE}/positions?user=${userAddr}&status=OPEN`);
  const { data } = await res.json();
  return data.positions.map(p => ({
    ...p,
    margin: Number(p.margin) / PRECISION,
    leverage: Number(p.leverage) / PRECISION,
    entryPrice: Number(p.entryPrice) / PRECISION,
    pnl: p.pnl ? Number(p.pnl) / PRECISION : null,
    healthFactor: p.healthFactor ? Number(p.healthFactor) : null,
  }));
}

// 5. 平仓
async function closePosition(
  wallet: any,
  positionId: string,
  userAddr: string
) {
  // 5.1 获取交易 payload
  const res = await fetch(`${API_BASE}/orders/close`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ positionId, userAddr }),
  });
  const { data } = await res.json();

  // 5.2 签名并提交交易
  const txPayload = data.txPayload;
  const tx = await wallet.signAndSubmitTransaction({
    data: {
      function: txPayload.function,
      functionArguments: txPayload.functionArguments,
    },
  });

  return tx;
}

// 6. 监控持仓健康度
async function checkPositionHealth(positionId: string) {
  const res = await fetch(`${API_BASE}/positions/${positionId}`);
  const { data } = await res.json();

  return {
    healthFactor: Number(data.healthFactor),
    isLiquidatable: data.isLiquidatable,
    pnl: Number(data.pnl) / PRECISION,
    marginRatio: Number(data.marginRatio),
  };
}
```

### React Hook 示例

```typescript
// useMarkets.ts
import { useQuery } from '@tanstack/react-query';

export function useMarkets() {
  return useQuery({
    queryKey: ['markets'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/markets`);
      const { data } = await res.json();
      return data;
    },
    refetchInterval: 30000, // 30秒刷新
  });
}

// usePositions.ts
export function usePositions(userAddr: string | undefined) {
  return useQuery({
    queryKey: ['positions', userAddr],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/positions?user=${userAddr}&status=OPEN`);
      const { data } = await res.json();
      return data.positions;
    },
    enabled: !!userAddr,
    refetchInterval: 5000, // 5秒刷新
  });
}

// usePrices.ts
export function usePrices() {
  return useQuery({
    queryKey: ['prices'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/prices?limit=10`);
      const { data } = await res.json();
      return data;
    },
    refetchInterval: 3000, // 3秒刷新
  });
}
```

---

## 错误码

| 错误码 | 说明 |
|--------|------|
| VALIDATION_ERROR | 参数验证失败 |
| NOT_FOUND | 资源不存在 |
| MARKET_NOT_FOUND | 市场不存在 |
| POSITION_NOT_FOUND | 持仓不存在 |
| STALE_PRICE | 价格过期 (>5分钟) |
| FORBIDDEN | 权限不足 |
| INTERNAL_ERROR | 服务器内部错误 |

---

## 市场列表

| ID | 交易对 | 最大杠杆 |
|----|--------|----------|
| 0 | BTC/USDT | 100x |
| 1 | ETH/USDT | 100x |
| 2 | SOL/USDT | 100x |
| 3 | MOVE/USDT | 100x |
| 4 | ARB/USDT | 100x |
