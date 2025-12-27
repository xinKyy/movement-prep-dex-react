import { useState, useCallback } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Aptos, AptosConfig, Network, InputEntryFunctionData } from '@aptos-labs/ts-sdk';
import { apiService } from '../services/api';
import { NETWORK_CONFIG } from '../config/constants';

// 创建 Aptos 客户端（Movement Testnet）
const aptosConfig = new AptosConfig({
  network: Network.CUSTOM,
  fullnode: NETWORK_CONFIG.nodeUrl,
});
const aptos = new Aptos(aptosConfig);

export function usePerpsContract() {
  const { signAndSubmitTransaction, account, connected } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [simulating, setSimulating] = useState(false);

  // 获取地址字符串
  const getAddressString = () => {
    if (!account?.address) return null;
    return typeof account.address === 'string' 
      ? account.address 
      : account.address.toString();
  };

  /**
   * 格式化合约调用参数
   * 
   * open_position_entry 参数格式:
   * - market_id: u64    -> 数字转字符串
   * - is_long: bool     -> 布尔值保持不变  
   * - margin: u64       -> 已是字符串 (fixed point 1e8)
   * - leverage: u64     -> 已是字符串 (fixed point 1e8)
   * - admin_addr: address -> 已是字符串
   * 
   * 命令行格式参考:
   * --args 'u64:0' 'bool:true' 'u64:margin' 'u64:leverage' 'address:admin'
   */
  const formatFunctionArguments = (args: (string | number | boolean)[]) => {
    console.log('📝 原始参数:', args);
    
    const formatted = args.map((arg, index) => {
      // 布尔值保持不变 (is_long)
      if (typeof arg === 'boolean') {
        console.log(`   [${index}] bool: ${arg}`);
        return arg;
      }
      // 数字转字符串 (market_id 等 u64 类型)
      if (typeof arg === 'number') {
        const str = arg.toString();
        console.log(`   [${index}] u64 (number->string): ${arg} -> "${str}"`);
        return str;
      }
      // 字符串保持不变 (margin, leverage, address)
      console.log(`   [${index}] string: "${arg}"`);
      return arg;
    });
    
    console.log('📝 格式化后参数:', formatted);
    return formatted;
  };

  // 模拟交易
  const simulateTransaction = async (
    senderAddress: string,
    payload: {
      function: string;
      functionArguments: (string | number | boolean)[];
    }
  ) => {
    console.log('🔄 开始模拟交易...');
    setSimulating(true);

    try {
      const formattedArgs = formatFunctionArguments(payload.functionArguments);
      
      // 构建交易数据
      const transaction = await aptos.transaction.build.simple({
        sender: senderAddress,
        data: {
          function: payload.function as `${string}::${string}::${string}`,
          typeArguments: [],
          functionArguments: formattedArgs,
        } as InputEntryFunctionData,
      });

      // 模拟交易 (使用 any 处理版本不兼容问题)
      const simulationResult = await aptos.transaction.simulate.simple({
        signerPublicKey: account!.publicKey as any,
        transaction,
      });

      console.log('📋 模拟结果:', simulationResult);

      // 检查模拟结果
      if (simulationResult && simulationResult.length > 0) {
        const result = simulationResult[0];
        
        if (result.success) {
          console.log('✅ 模拟交易成功!');
          console.log('   - Gas 使用:', result.gas_used);
          console.log('   - VM 状态:', result.vm_status);
          return {
            success: true,
            gasUsed: result.gas_used,
            vmStatus: result.vm_status,
          };
        } else {
          console.error('❌ 模拟交易失败:', result.vm_status);
          throw new Error(`模拟失败: ${result.vm_status}`);
        }
      }

      throw new Error('模拟返回空结果');
    } catch (err) {
      console.error('❌ 模拟交易出错:', err);
      throw err;
    } finally {
      setSimulating(false);
    }
  };

  // 开仓
  const openPosition = useCallback(async (
    marketId: number,
    isLong: boolean,
    margin: number,
    leverage: number
  ) => {
    const userAddr = getAddressString();
    if (!userAddr) {
      throw new Error('请先连接钱包');
    }

    setLoading(true);
    setError(null);

    try {
      // 1. 从后端获取交易 payload
      const orderData = await apiService.createOpenOrder({
        userAddr,
        marketId,
        side: isLong ? 'LONG' : 'SHORT',
        margin,
        leverage,
      });

      console.log('📦 后端返回数据:', orderData);

      const { txPayload } = orderData;
      
      // 打印合约调用信息
      console.log('📋 合约调用:', {
        function: txPayload.function,
        // 参数说明: open_position_entry(market_id: u64, is_long: bool, margin: u64, leverage: u64, admin_addr: address)
        rawArgs: {
          market_id: txPayload.functionArguments[0],   // u64
          is_long: txPayload.functionArguments[1],     // bool
          margin: txPayload.functionArguments[2],      // u64 (1e8 精度)
          leverage: txPayload.functionArguments[3],    // u64 (1e8 精度)
          admin_addr: txPayload.functionArguments[4],  // address
        }
      });

      // 2. 先模拟交易，确保能成功
      const simResult = await simulateTransaction(userAddr, txPayload);
      console.log('✅ 模拟交易成功，预计 Gas:', simResult.gasUsed);

      // 3. 模拟成功后，拉起钱包签名
      const formattedArgs = formatFunctionArguments(txPayload.functionArguments);
      
      console.log('🔐 拉起钱包签名...');

      const response = await signAndSubmitTransaction({
        data: {
          function: txPayload.function as `${string}::${string}::${string}`,
          typeArguments: [],
          functionArguments: formattedArgs,
        },
      });

      console.log('✅ 交易已提交:', response);
      return response;
    } catch (err) {
      console.error('Open position error:', err);
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
    _marketId?: number,
    _chainPositionId?: string
  ) => {
    const userAddr = getAddressString();
    if (!userAddr) {
      throw new Error('请先连接钱包');
    }

    setLoading(true);
    setError(null);

    try {
      // 1. 从后端获取交易 payload
      const orderData = await apiService.createCloseOrder({
        positionId,
        userAddr,
      });

      console.log('Close order data from backend:', orderData);

      const { txPayload } = orderData;

      // 2. 先模拟交易，确保能成功
      const simResult = await simulateTransaction(userAddr, txPayload);
      console.log('✅ 模拟交易成功，预计 Gas:', simResult.gasUsed);

      // 3. 模拟成功后，拉起钱包签名
      const formattedArgs = formatFunctionArguments(txPayload.functionArguments);

      console.log('🔐 拉起钱包签名...');

      const response = await signAndSubmitTransaction({
        data: {
          function: txPayload.function as `${string}::${string}::${string}`,
          typeArguments: [],
          functionArguments: formattedArgs,
        },
      });

      console.log('✅ 交易已提交:', response);
      return response;
    } catch (err) {
      console.error('Close position error:', err);
      const message = err instanceof Error ? err.message : '平仓失败';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [account, signAndSubmitTransaction]);

  // 带滑点保护的平仓
  const closePositionWithSlippage = useCallback(async (
    positionId: string,
    minExitPrice?: number
  ) => {
    const userAddr = getAddressString();
    if (!userAddr) {
      throw new Error('请先连接钱包');
    }

    setLoading(true);
    setError(null);

    try {
      const orderData = await apiService.createCloseOrder({
        positionId,
        userAddr,
        minExitPrice,
      });

      console.log('Close order data from backend:', orderData);

      const { txPayload } = orderData;

      // 2. 先模拟交易，确保能成功
      const simResult = await simulateTransaction(userAddr, txPayload);
      console.log('✅ 模拟交易成功，预计 Gas:', simResult.gasUsed);

      // 3. 模拟成功后，拉起钱包签名
      const formattedArgs = formatFunctionArguments(txPayload.functionArguments);

      console.log('🔐 拉起钱包签名...');

      const response = await signAndSubmitTransaction({
        data: {
          function: txPayload.function as `${string}::${string}::${string}`,
          typeArguments: [],
          functionArguments: formattedArgs,
        },
      });

      console.log('✅ 交易已提交:', response);
      return response;
    } catch (err) {
      console.error('Close position with slippage error:', err);
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
    simulating,
    error,
    connected,
    address: getAddressString(),
  };
}
