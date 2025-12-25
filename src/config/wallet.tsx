import { PropsWithChildren } from 'react';
import { AptosWalletAdapterProvider } from '@aptos-labs/wallet-adapter-react';

export function WalletProvider({ children }: PropsWithChildren) {
  return (
    <AptosWalletAdapterProvider
      autoConnect={true}
      optInWallets={['Petra', 'Pontem Wallet', 'Martian', 'Nightly', 'Rise Wallet']}
      onError={(error) => {
        console.error('Wallet error:', error);
      }}
    >
      {children}
    </AptosWalletAdapterProvider>
  );
}
