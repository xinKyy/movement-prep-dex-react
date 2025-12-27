import { PropsWithChildren } from 'react';
import { AptosWalletAdapterProvider } from '@aptos-labs/wallet-adapter-react';
import { NETWORK_CONFIG } from './constants';

/**
 * Movement 网络钱包配置
 *
 * 推荐钱包（根据 Movement 官方文档）：
 * - OKX Wallet: https://www.okx.com/web3
 * - Razor: https://razorwallet.xyz/
 * - Nightly: https://nightly.app/
 *
 * 文档: https://docs.movementnetwork.xyz/general/usingmovement/connect_to_movement
 */
export function WalletProvider({ children }: PropsWithChildren) {
  return (
    <AptosWalletAdapterProvider
      autoConnect={true}
      optInWallets={[
        'Nightly',           // Movement 推荐
        'OKX Wallet',        // Movement 推荐
        'Petra',             // Aptos 官方
        'Pontem Wallet',
        "Razor Wallet" as any
      ]}
      onError={(error) => {
        console.error('Wallet error:', error);
      }}
    >
      {children}
    </AptosWalletAdapterProvider>
  );
}

/**
 * Movement 测试网配置信息
 *
 * 在钱包中添加自定义网络时使用：
 * - Chain ID: 250
 * - RPC URL: https://testnet.movementnetwork.xyz/v1
 * - Faucet: https://faucet.testnet.movementnetwork.xyz
 */
export const MOVEMENT_TESTNET_CONFIG = {
  name: NETWORK_CONFIG.chainName,
  chainId: NETWORK_CONFIG.chainId,
  url: NETWORK_CONFIG.nodeUrl,
  indexerUrl: NETWORK_CONFIG.indexerUrl,
  faucetUrl: NETWORK_CONFIG.faucetUrl,
};
