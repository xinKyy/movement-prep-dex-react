import { useState, useCallback } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Aptos, AptosConfig, Network, InputEntryFunctionData, AccountAddress, createObjectAddress } from '@aptos-labs/ts-sdk';
import { apiService } from '../services/api';
import { NETWORK_CONFIG, CONTRACT_CONFIG, PRECISION, MOCK_USDT_SEED } from '../config/constants';

// 创建 Aptos 客户端（Movement Testnet）
const aptosConfig = new AptosConfig({
  network: Network.CUSTOM,
  fullnode: NETWORK_CONFIG.nodeUrl,
});
const aptos = new Aptos(aptosConfig);

// 合约地址
const MODULE_ADDRESS = CONTRACT_CONFIG.moduleAddress;

export function usePerpsContract() {
  const { signAndSubmitTransaction, account, connected } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);

  // 获取地址字符串
  const getAddressString = () => {
    if (!account?.address) return null;
    return typeof account.address === 'string'
      ? account.address
      : account.address.toString();
  };

  // 获取用户 USDT 余额 - 使用链上原生 RPC 方法
  const getUserBalance = useCallback(async () => {
    const userAddr = getAddressString();
    if (!userAddr) return null;

    try {
      // 计算 Mock USDT metadata 的 object address
      // metadata address = sha3_256(creator_address || seed || 0xFE)
      const creatorAddress = AccountAddress.from(MODULE_ADDRESS);
      // 使用 TextEncoder 将 seed 转为 Uint8Array，避免浏览器环境中 Buffer 不可用的问题
      const seedBytes = new TextEncoder().encode(MOCK_USDT_SEED);
      const metadataAddress = createObjectAddress(creatorAddress, seedBytes);

      // 使用原生 RPC 方法 0x1::primary_fungible_store::balance 查询余额
      const result = await aptos.view({
        payload: {
          function: "0x1::primary_fungible_store::balance",
          typeArguments: ["0x1::fungible_asset::Metadata"],
          functionArguments: [userAddr, metadataAddress.toString()],
        },
      });

      if (result && result.length > 0) {
        // Mock USDT 使用 6 位小数 (与合约中定义一致)
        const balanceValue = Number(result[0]) / 1_000_000;
        setBalance(balanceValue);
        return balanceValue;
      }
      return 0;
    } catch (err) {
      console.error('Failed to get balance:', err);
      return null;
    }
  }, [account]);

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

  // 存入流动性到 Vault (LP 功能)
  // deposit_fa(account, admin_addr, market_id_val, token_id, amount)
  const depositToVault = useCallback(async (
    marketId: number,
    tokenId: number,
    amount: number, // 实际金额，会自动转换为 1e8 精度
  ) => {
    const userAddr = getAddressString();
    if (!userAddr) {
      throw new Error('请先连接钱包');
    }

    setLoading(true);
    setError(null);

    try {
      // 转换为固定精度 (1e8)
      const amountFixed = Math.floor(amount * PRECISION).toString();

      const txPayload = {
        function: `${MODULE_ADDRESS}::perps::deposit_fa`,
        functionArguments: [
          MODULE_ADDRESS,        // admin_addr: address
          marketId.toString(),   // market_id_val: u64
          tokenId.toString(),    // token_id: u64
          amountFixed,           // amount: u64
        ],
      };

      console.log('💰 存入流动性:', {
        admin_addr: MODULE_ADDRESS,
        market_id: marketId,
        token_id: tokenId,
        amount: amount,
        amount_fixed: amountFixed,
      });

      // 先模拟交易
      const simResult = await simulateTransaction(userAddr, txPayload);
      console.log('✅ 模拟存入成功，预计 Gas:', simResult.gasUsed);

      // 模拟成功后，拉起钱包签名
      console.log('🔐 拉起钱包签名...');

      const response = await signAndSubmitTransaction({
        data: {
          function: txPayload.function as `${string}::${string}::${string}`,
          typeArguments: [],
          functionArguments: txPayload.functionArguments,
        },
      });

      console.log('✅ 存入成功:', response);
      return response;
    } catch (err) {
      console.error('Deposit error:', err);
      const message = err instanceof Error ? err.message : '存入失败';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [account, signAndSubmitTransaction]);

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

  // 检查并刷新价格（如果过期）
  const ensureFreshPrice = useCallback(async (marketId: number): Promise<boolean> => {
    try {
      console.log('🔍 检查价格是否过期...');
      const staleness = await apiService.checkPriceStaleness(marketId);

      console.log('📊 价格状态:', staleness);

      if (!staleness.isStale) {
        console.log('✅ 价格有效，可以交易');
        return true;
      }

      // 检查数据库价格是否足够新鲜（5分钟内）
      if (staleness.dbPrice && staleness.dbPrice.ageSeconds < 300) {
        console.log('✅ 数据库价格有效，可以交易');
        return true;
      }

      console.log('⚠️ 价格已过期，尝试刷新...');
      const refreshResult = await apiService.refreshPrice(marketId);

      console.log('📊 刷新结果:', refreshResult);

      // 刷新成功的条件：success 为 true
      if (refreshResult.success) {
        console.log('✅ 价格刷新成功');
        return true;
      } else {
        console.error('❌ 价格刷新失败');
        return false;
      }
    } catch (err) {
      console.error('价格检查/刷新失败:', err);
      // 如果是网络错误等，允许继续（让链上交易决定）
      console.log('⚠️ 价格检查失败，尝试继续交易...');
      return true;
    }
  }, []);

  // 开仓 - 合约参数格式
  // 参数说明:
  // - market_id: u64 (0=BTC, 1=ETH, 2=MOVE, 3=SOL, 4=ARB)
  // - is_long: bool (true=做多, false=做空)
  // - margin: u64 (金额 * 1e8, 如 10 USDT = 1000000000)
  // - leverage: u64 (杠杆倍数 * 1e8, 如 10x = 1000000000)
  // - admin_addr: address (合约管理地址)
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
      // 1. 首先确保价格是最新的
      const priceIsFresh = await ensureFreshPrice(marketId);
      if (!priceIsFresh) {
        throw new Error('价格已过期且无法刷新，请稍后重试');
      }

      // 直接构建交易参数
      // margin 需要转换为 1e8 精度
      const marginFixed = Math.floor(margin * PRECISION).toString();
      // leverage 也需要转换为 1e8 精度！合约中使用 mul_fixed 计算 notional
      const leverageFixed = Math.floor(leverage * PRECISION).toString();

      const txPayload = {
        function: `${MODULE_ADDRESS}::perps::open_position_entry`,
        functionArguments: [
          marketId.toString(),     // market_id: u64
          isLong,                   // is_long: bool
          marginFixed,              // margin: u64 (1e8 精度)
          leverageFixed,            // leverage: u64 (1e8 精度)
          MODULE_ADDRESS,           // admin_addr: address
        ],
      };

      // 打印合约调用信息
      console.log('📋 合约调用:', {
        function: txPayload.function,
        args: {
          market_id: marketId,
          is_long: isLong,
          margin: `${margin} USDT -> ${marginFixed}`,
          leverage: `${leverage}x -> ${leverageFixed}`,
          admin_addr: MODULE_ADDRESS,
        },
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

      // 同步仓位到后端数据库
      // 注意：事件同步器会自动同步仓位，这里的手动同步是为了快速反馈
      // 如果手动同步失败，事件同步器会在几秒内自动同步
      try {
        // 等待交易确认（可选，但建议等待以确保事件已发出）
        await new Promise(resolve => setTimeout(resolve, 2000));

        // 获取当前价格作为开仓价
        const prices = await apiService.getPrices(marketId, 1);
        const entryPrice = prices.length > 0 ? parseFloat(prices[0].price) : 0;

        if (entryPrice > 0) {
          try {
            const syncResult = await apiService.syncPosition({
              txHash: response.hash,
              userAddr: userAddr,
              marketId,
              isLong,
              margin,
              leverage,
              entryPrice,
            });
            
            if (syncResult.isNew) {
              console.log('✅ 仓位已同步到数据库:', syncResult);
            } else {
              console.log('ℹ️ 仓位已存在（可能由事件同步器创建）:', syncResult);
            }
          } catch (syncErr) {
            // 同步失败不影响交易，事件同步器会自动处理
            console.warn('⚠️ 手动同步失败，事件同步器将在几秒内自动同步:', syncErr);
          }
        } else {
          console.warn('⚠️ 无法获取价格，跳过手动同步。事件同步器将自动同步仓位。');
        }
      } catch (syncErr) {
        // 同步失败不影响交易，事件同步器会自动处理
        console.warn('⚠️ 仓位同步失败（不影响交易，事件同步器会自动同步）:', syncErr);
      }

      return response;
    } catch (err) {
      console.error('Open position error:', err);
      const message = err instanceof Error ? err.message : '开仓失败';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [account, signAndSubmitTransaction, ensureFreshPrice]);

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

      // 确保价格是最新的
      const priceIsFresh = await ensureFreshPrice(orderData.params.marketId);
      if (!priceIsFresh) {
        throw new Error('价格已过期且无法刷新，请稍后重试');
      }

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
  }, [account, signAndSubmitTransaction, ensureFreshPrice]);

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

      // 确保价格是最新的
      const priceIsFresh = await ensureFreshPrice(orderData.params.marketId);
      if (!priceIsFresh) {
        throw new Error('价格已过期且无法刷新，请稍后重试');
      }

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
  }, [account, signAndSubmitTransaction, ensureFreshPrice]);

  return {
    depositToVault,
    openPosition,
    closePosition,
    closePositionWithSlippage,
    ensureFreshPrice,
    getUserBalance,
    balance,
    loading,
    simulating,
    error,
    connected,
    address: getAddressString(),
  };
}
