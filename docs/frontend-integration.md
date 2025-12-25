# Perps Contract Frontend Integration Guide

## Network Configuration

```typescript
const NETWORK_CONFIG = {
  nodeUrl: "https://testnet.movementnetwork.xyz/v1",
  chainId: "movement-testnet",
  explorerUrl: "https://explorer.movementnetwork.xyz"
};

const CONTRACT_ADDRESS = "0xaecb1ba8583822e09f3ec40eecf28bcea3bbcf4b7b77728efd997108c87637aa";
```

## Precision Constants

All amounts use fixed-point arithmetic with 8 decimal places:

```typescript
const PRECISION = 100_000_000; // 1e8

// Helper functions
const toFixed = (value: number): bigint => BigInt(Math.floor(value * PRECISION));
const fromFixed = (value: bigint): number => Number(value) / PRECISION;

// Examples:
// 100 USD -> toFixed(100) = 10000000000n
// 50000 USD price -> toFixed(50000) = 5000000000000n
// 10x leverage -> toFixed(10) = 1000000000n
```

## Market IDs

```typescript
const MARKETS = {
  BTC_USD: 0,
  ETH_USD: 1,
};
```

---

## Entry Functions

### 1. Initialize System (Admin Only)

```typescript
// Function: perps::initialize_entry
// Only called once by admin to set up the system

const initializeSystem = async (client: AptosClient, admin: AptosAccount) => {
  const payload = {
    function: `${CONTRACT_ADDRESS}::perps::initialize_entry`,
    type_arguments: [],
    arguments: [],
  };
  return await client.generateSignSubmitTransaction(admin, payload);
};
```

### 2. Register Market (Admin Only)

```typescript
// Function: perps::register_market_entry

interface MarketConfig {
  name: string;           // e.g., "BTC/USD"
  baseAsset: string;      // e.g., "BTC"
  quoteAsset: string;     // e.g., "USD"
  maxLeverage: number;    // e.g., 100 (100x)
  initMr: number;         // Initial margin ratio, e.g., 0.01 (1%)
  maintMr: number;        // Maintenance margin ratio, e.g., 0.005 (0.5%)
  feeRate: number;        // e.g., 0.001 (0.1%)
  liqRewardRate: number;  // e.g., 0.005 (0.5%)
  initialPrice: number;   // e.g., 50000
  settlementTokenId: number; // Usually 0 for FUSD
}

const registerMarket = async (
  client: AptosClient,
  admin: AptosAccount,
  config: MarketConfig
) => {
  const payload = {
    function: `${CONTRACT_ADDRESS}::perps::register_market_entry`,
    type_arguments: [],
    arguments: [
      Buffer.from(config.name).toString("hex"),
      Buffer.from(config.baseAsset).toString("hex"),
      Buffer.from(config.quoteAsset).toString("hex"),
      toFixed(config.maxLeverage).toString(),
      toFixed(config.initMr).toString(),
      toFixed(config.maintMr).toString(),
      toFixed(config.feeRate).toString(),
      toFixed(config.liqRewardRate).toString(),
      toFixed(config.initialPrice).toString(),
      config.settlementTokenId.toString(),
    ],
  };
  return await client.generateSignSubmitTransaction(admin, payload);
};
```

### 3. Update Price (Oracle)

```typescript
// Function: perps::update_price_entry

const updatePrice = async (
  client: AptosClient,
  updater: AptosAccount,
  oracleAddr: string,
  marketId: number,
  price: number  // e.g., 50000 for $50,000
) => {
  const payload = {
    function: `${CONTRACT_ADDRESS}::perps::update_price_entry`,
    type_arguments: [],
    arguments: [
      oracleAddr,
      marketId.toString(),
      toFixed(price).toString(),
    ],
  };
  return await client.generateSignSubmitTransaction(updater, payload);
};
```

### 4. Mint Mock FUSD (Testing)

```typescript
// Function: mock_fusd::mint

const mintFUSD = async (
  client: AptosClient,
  admin: AptosAccount,
  toAddress: string,
  amount: number  // e.g., 10000 for 10,000 FUSD
) => {
  const payload = {
    function: `${CONTRACT_ADDRESS}::mock_fusd::mint`,
    type_arguments: [],
    arguments: [
      toAddress,
      toFixed(amount).toString(),
    ],
  };
  return await client.generateSignSubmitTransaction(admin, payload);
};
```

### 5. LP Deposit

```typescript
// Function: perps::deposit_entry

const lpDeposit = async (
  client: AptosClient,
  user: AptosAccount,
  marketId: number,
  amount: number  // e.g., 1000 for 1,000 FUSD
) => {
  const payload = {
    function: `${CONTRACT_ADDRESS}::perps::deposit_entry`,
    type_arguments: [],
    arguments: [
      marketId.toString(),
      toFixed(amount).toString(),
    ],
  };
  return await client.generateSignSubmitTransaction(user, payload);
};
```

### 6. LP Withdraw

```typescript
// Function: perps::withdraw_entry

const lpWithdraw = async (
  client: AptosClient,
  user: AptosAccount,
  marketId: number,
  shares: bigint  // LP shares to burn
) => {
  const payload = {
    function: `${CONTRACT_ADDRESS}::perps::withdraw_entry`,
    type_arguments: [],
    arguments: [
      marketId.toString(),
      shares.toString(),
    ],
  };
  return await client.generateSignSubmitTransaction(user, payload);
};
```

### 7. Open Position

```typescript
// Function: perps::open_position_entry

interface OpenPositionParams {
  marketId: number;
  isLong: boolean;
  margin: number;     // e.g., 100 for 100 FUSD
  leverage: number;   // e.g., 10 for 10x
  adminAddr: string;  // Contract admin address
}

const openPosition = async (
  client: AptosClient,
  trader: AptosAccount,
  params: OpenPositionParams
) => {
  const payload = {
    function: `${CONTRACT_ADDRESS}::perps::open_position_entry`,
    type_arguments: [],
    arguments: [
      params.marketId.toString(),
      params.isLong,
      toFixed(params.margin).toString(),
      toFixed(params.leverage).toString(),  // IMPORTANT: leverage in fixed point
      params.adminAddr,
    ],
  };
  return await client.generateSignSubmitTransaction(trader, payload);
};

// Example usage:
// await openPosition(client, trader, {
//   marketId: MARKETS.BTC_USD,
//   isLong: true,
//   margin: 100,      // 100 FUSD
//   leverage: 10,     // 10x leverage
//   adminAddr: CONTRACT_ADDRESS,
// });
```

### 8. Close Position (By Trader)

```typescript
// Function: perps::close_position_by_trader_entry

const closePosition = async (
  client: AptosClient,
  trader: AptosAccount,
  marketId: number,
  positionId: number,
  adminAddr: string
) => {
  const payload = {
    function: `${CONTRACT_ADDRESS}::perps::close_position_by_trader_entry`,
    type_arguments: [],
    arguments: [
      marketId.toString(),
      positionId.toString(),
      adminAddr,
    ],
  };
  return await client.generateSignSubmitTransaction(trader, payload);
};
```

### 9. Close Position with Slippage Protection

```typescript
// Function: perps::close_position_by_trader_with_slippage_entry

const closePositionWithSlippage = async (
  client: AptosClient,
  trader: AptosAccount,
  marketId: number,
  positionId: number,
  adminAddr: string,
  minExitPrice: number  // Minimum acceptable price for longs
) => {
  const payload = {
    function: `${CONTRACT_ADDRESS}::perps::close_position_by_trader_with_slippage_entry`,
    type_arguments: [],
    arguments: [
      marketId.toString(),
      positionId.toString(),
      adminAddr,
      toFixed(minExitPrice).toString(),
    ],
  };
  return await client.generateSignSubmitTransaction(trader, payload);
};
```

### 10. Liquidate Position

```typescript
// Function: perps::liquidate_entry
// Anyone can call this to liquidate underwater positions

const liquidatePosition = async (
  client: AptosClient,
  liquidator: AptosAccount,
  liquidatorAddr: string,
  traderAddr: string,
  marketId: number,
  positionId: number,
  adminAddr: string
) => {
  const payload = {
    function: `${CONTRACT_ADDRESS}::perps::liquidate_entry`,
    type_arguments: [],
    arguments: [
      liquidatorAddr,
      traderAddr,
      marketId.toString(),
      positionId.toString(),
      adminAddr,
    ],
  };
  return await client.generateSignSubmitTransaction(liquidator, payload);
};
```

---

## View Functions (Read-Only)

### Get Market Price

```typescript
// Function: oracle::get_price
// Returns: (price: u64, timestamp: u64)

const getMarketPrice = async (
  client: AptosClient,
  adminAddr: string,
  marketId: number
): Promise<{ price: number; timestamp: number }> => {
  const result = await client.view({
    function: `${CONTRACT_ADDRESS}::oracle::get_price`,
    type_arguments: [],
    arguments: [adminAddr, marketId.toString()],
  });
  return {
    price: fromFixed(BigInt(result[0] as string)),
    timestamp: Number(result[1]),
  };
};
```

### Get Vault Info

```typescript
const getVaultValue = async (
  client: AptosClient,
  adminAddr: string,
  marketId: number
): Promise<number> => {
  const result = await client.view({
    function: `${CONTRACT_ADDRESS}::perps::get_vault_value`,
    type_arguments: [],
    arguments: [adminAddr, marketId.toString()],
  });
  return fromFixed(BigInt(result[0] as string));
};
```

### Get User LP Shares

```typescript
const getUserShares = async (
  client: AptosClient,
  adminAddr: string,
  userAddr: string,
  marketId: number
): Promise<bigint> => {
  const result = await client.view({
    function: `${CONTRACT_ADDRESS}::perps::get_user_shares`,
    type_arguments: [],
    arguments: [adminAddr, userAddr, marketId.toString()],
  });
  return BigInt(result[0] as string);
};
```

---

## TypeScript Types

```typescript
interface Position {
  isLong: boolean;
  margin: bigint;
  leverage: bigint;
  notional: bigint;
  entryPrice: bigint;
  feesPaid: bigint;
  fundingPaid: bigint;
}

interface MarketConfig {
  maxLeverage: bigint;
  initMr: bigint;
  maintMr: bigint;
  feeRate: bigint;
  liqRewardRate: bigint;
  maxOpenInterest: bigint;
}

interface OpenInterestData {
  longOi: bigint;
  shortOi: bigint;
}
```

---

## Complete Trading Flow Example

```typescript
import { AptosClient, AptosAccount, HexString } from "aptos";

const PRECISION = 100_000_000n;
const toFixed = (v: number) => BigInt(Math.floor(v * Number(PRECISION)));

async function tradingExample() {
  const client = new AptosClient("https://testnet.movementnetwork.xyz/v1");
  const CONTRACT = "0xaecb1ba8583822e09f3ec40eecf28bcea3bbcf4b7b77728efd997108c87637aa";

  // Load your wallet
  const privateKey = new HexString("YOUR_PRIVATE_KEY");
  const trader = new AptosAccount(privateKey.toUint8Array());
  const traderAddr = trader.address().hex();

  // 1. Open a 10x long BTC position with 100 FUSD margin
  console.log("Opening position...");
  const openTx = await client.generateSignSubmitTransaction(trader, {
    function: `${CONTRACT}::perps::open_position_entry`,
    type_arguments: [],
    arguments: [
      "0",                          // market_id (BTC/USD)
      true,                         // is_long
      toFixed(100).toString(),      // margin: 100 FUSD
      toFixed(10).toString(),       // leverage: 10x (in fixed point!)
      CONTRACT,                     // admin_addr
    ],
  });
  await client.waitForTransaction(openTx);
  console.log("Position opened! TX:", openTx);

  // Position ID is typically 0 for first position, 1 for second, etc.
  // Track this from events or maintain state

  // 2. Close the position
  console.log("Closing position...");
  const closeTx = await client.generateSignSubmitTransaction(trader, {
    function: `${CONTRACT}::perps::close_position_by_trader_entry`,
    type_arguments: [],
    arguments: [
      "0",           // market_id
      "0",           // position_id (first position)
      CONTRACT,      // admin_addr
    ],
  });
  await client.waitForTransaction(closeTx);
  console.log("Position closed! TX:", closeTx);
}
```

---

## React Hook Example

```typescript
import { useState, useCallback } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { AptosClient } from 'aptos';

const PRECISION = 100_000_000;
const CONTRACT = "0xaecb1ba8583822e09f3ec40eecf28bcea3bbcf4b7b77728efd997108c87637aa";

export function usePerpsContract() {
  const { signAndSubmitTransaction } = useWallet();
  const [loading, setLoading] = useState(false);

  const openPosition = useCallback(async (
    marketId: number,
    isLong: boolean,
    margin: number,
    leverage: number
  ) => {
    setLoading(true);
    try {
      const response = await signAndSubmitTransaction({
        data: {
          function: `${CONTRACT}::perps::open_position_entry`,
          typeArguments: [],
          functionArguments: [
            marketId,
            isLong,
            Math.floor(margin * PRECISION),
            Math.floor(leverage * PRECISION),
            CONTRACT,
          ],
        },
      });
      return response;
    } finally {
      setLoading(false);
    }
  }, [signAndSubmitTransaction]);

  const closePosition = useCallback(async (
    marketId: number,
    positionId: number
  ) => {
    setLoading(true);
    try {
      const response = await signAndSubmitTransaction({
        data: {
          function: `${CONTRACT}::perps::close_position_by_trader_entry`,
          typeArguments: [],
          functionArguments: [
            marketId,
            positionId,
            CONTRACT,
          ],
        },
      });
      return response;
    } finally {
      setLoading(false);
    }
  }, [signAndSubmitTransaction]);

  return {
    openPosition,
    closePosition,
    loading,
  };
}
```

---

## Error Codes

| Code | Name | Description |
|------|------|-------------|
| 0x10001 | E_NOT_AUTHORIZED | Caller is not authorized |
| 0x30001 | E_VAULT_NOT_INITIALIZED | Position not found |
| 0x30004 | E_MARKET_NOT_FOUND | Market does not exist |
| 0x5000b | E_NOT_POSITION_OWNER | Caller doesn't own the position |
| 0x60001 | Position not liquidatable | Margin ratio above maintenance |
| 0x60007 | E_MARKET_INACTIVE | Market is paused |
| 0x60008 | E_EXCEEDS_OPEN_INTEREST | Position exceeds OI limit |

---

## Important Notes

1. **Leverage is in fixed point**: When passing leverage, multiply by PRECISION (1e8). 10x leverage = `10 * 100000000 = 1000000000`

2. **Position IDs are per-market**: Each market has its own position ID counter starting from 0

3. **Admin address**: Most functions require passing the contract's admin address for looking up global state

4. **Slippage protection**: Use `close_position_by_trader_with_slippage_entry` for production to protect against price manipulation

5. **Liquidation is permissionless**: Anyone can liquidate underwater positions and receive the reward
