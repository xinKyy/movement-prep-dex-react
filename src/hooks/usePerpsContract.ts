import { useState, useCallback } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { apiService } from '../services/api';

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

      console.log('Order data from backend:', orderData);

      // 2. 使用后端返回的 txPayload 签名并提交交易
      const { txPayload } = orderData;
      
      const response = await signAndSubmitTransaction({
        data: {
          function: txPayload.function as `${string}::${string}::${string}`,
          typeArguments: [],
          functionArguments: txPayload.functionArguments,
        },
      });

      console.log('Transaction submitted:', response);
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
      // 1. 从后端获取交易 payload
      const orderData = await apiService.createCloseOrder({
        positionId,
        userAddr: account.address,
      });

      console.log('Close order data from backend:', orderData);

      // 2. 使用后端返回的 txPayload 签名并提交交易
      const { txPayload } = orderData;

      const response = await signAndSubmitTransaction({
        data: {
          function: txPayload.function as `${string}::${string}::${string}`,
          typeArguments: [],
          functionArguments: txPayload.functionArguments,
        },
      });

      console.log('Transaction submitted:', response);
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : '平仓失败';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [account, signAndSubmitTransaction]);

  // 带滑点保护的平仓（直接调用合约）
  const closePositionWithSlippage = useCallback(async (
    positionId: string,
    minExitPrice?: number
  ) => {
    if (!account?.address) {
      throw new Error('请先连接钱包');
    }

    setLoading(true);
    setError(null);

    try {
      // 从后端获取交易 payload（带滑点保护价格）
      const orderData = await apiService.createCloseOrder({
        positionId,
        userAddr: account.address,
        minExitPrice,
      });

      console.log('Close order data from backend:', orderData);

      const { txPayload } = orderData;

      const response = await signAndSubmitTransaction({
        data: {
          function: txPayload.function as `${string}::${string}::${string}`,
          typeArguments: [],
          functionArguments: txPayload.functionArguments,
        },
      });

      console.log('Transaction submitted:', response);
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
