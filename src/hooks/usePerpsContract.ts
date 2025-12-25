import { useState, useCallback } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { CONTRACT_CONFIG, PRECISION } from '../config/constants';
import { apiService } from '../services/api';

const { moduleAddress } = CONTRACT_CONFIG;

export function usePerpsContract() {
  const { signAndSubmitTransaction, account, connected } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 开仓
  const openPosition = useCallback(async (
    marketId: number,
    isLong: boolean,
    margin: number,
    leverage: number
  ) => {
    if (!account?.address) {
      throw new Error('请先连接钱包');
    }

    setLoading(true);
    setError(null);

    try {
      // 1. 从后端获取交易 payload
      const orderData = await apiService.createOpenOrder({
        userAddr: account.address,
        marketId,
        side: isLong ? 'LONG' : 'SHORT',
        margin,
        leverage,
      });

      // 2. 签名并提交交易
      const response = await signAndSubmitTransaction({
        data: {
          function: `${moduleAddress}::perps::open_position_entry` as `${string}::${string}::${string}`,
          typeArguments: [],
          functionArguments: [
            marketId,
            isLong,
            Math.floor(margin * PRECISION),
            Math.floor(leverage * PRECISION),
            moduleAddress,
          ],
        },
      });

      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : '开仓失败';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [account, signAndSubmitTransaction]);

  // 平仓
  const closePosition = useCallback(async (
    positionId: string,
    marketId: number,
    chainPositionId: string
  ) => {
    if (!account?.address) {
      throw new Error('请先连接钱包');
    }

    setLoading(true);
    setError(null);

    try {
      // 1. 从后端获取交易 payload（可选，用于获取预估 PnL）
      const orderData = await apiService.createCloseOrder({
        positionId,
        userAddr: account.address,
      });

      // 2. 签名并提交交易
      const response = await signAndSubmitTransaction({
        data: {
          function: `${moduleAddress}::perps::close_position_by_trader_entry` as `${string}::${string}::${string}`,
          typeArguments: [],
          functionArguments: [
            marketId,
            parseInt(chainPositionId),
            moduleAddress,
          ],
        },
      });

      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : '平仓失败';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [account, signAndSubmitTransaction]);

  // 带滑点保护的平仓
  const closePositionWithSlippage = useCallback(async (
    marketId: number,
    chainPositionId: string,
    minExitPrice: number
  ) => {
    if (!account?.address) {
      throw new Error('请先连接钱包');
    }

    setLoading(true);
    setError(null);

    try {
      const response = await signAndSubmitTransaction({
        data: {
          function: `${moduleAddress}::perps::close_position_by_trader_with_slippage_entry` as `${string}::${string}::${string}`,
          typeArguments: [],
          functionArguments: [
            marketId,
            parseInt(chainPositionId),
            moduleAddress,
            Math.floor(minExitPrice * PRECISION),
          ],
        },
      });

      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : '平仓失败';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [account, signAndSubmitTransaction]);

  return {
    openPosition,
    closePosition,
    closePositionWithSlippage,
    loading,
    error,
    connected,
    address: account?.address,
  };
}

