'use client';

import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi/react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { defineChain } from 'viem';
import { useState, useEffect } from 'react';

const arcTestnet = defineChain({
  id: 2911,
  name: 'Arc Testnet',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://testnet.arc.network'] },
  },
});

const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID!;

const metadata = {
  name: 'Arc QR Pay',
  description: 'AI-powered QR Payment on Arc Network',
  url: 'https://arc-qr-pay.vercel.app',
  icons: ['https://arc-qr-pay.vercel.app/favicon.ico'],
};

const config = defaultWagmiConfig({
  chains: [arcTestnet],
  projectId,
  metadata,
});

createWeb3Modal({ wagmiConfig: config, projectId });

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {mounted ? children : null}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
