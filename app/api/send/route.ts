// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
export async function POST(req) {
  try {
    const { to, amount, token } = await req.json();
    if (!to || !amount) {
      return NextResponse.json({ error: 'Missing to or amount' }, { status: 400 });
    }
    const privateKey = process.env.PRIVATE_KEY;
    const kitKey = process.env.KIT_KEY;
    if (!privateKey || !kitKey) {
      return NextResponse.json({ error: 'Missing env vars' }, { status: 500 });
    }
    const { createWalletClient, createPublicClient, http } = await import('viem');
    const { privateKeyToAccount } = await import('viem/accounts');
    const { defineChain } = await import('viem');
    const arcTestnet = defineChain({
      id: 2911,
      name: 'Arc Testnet',
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      rpcUrls: { default: { http: ['https://testnet.arc.network'] } },
    });
    const account = privateKeyToAccount(privateKey);
    const walletClient = createWalletClient({ account, chain: arcTestnet, transport: http() });
    const publicClient = createPublicClient({ chain: arcTestnet, transport: http() });
    const AppKit = await import('@circle-fin/app-kit');
    const adapterMod = await import('@circle-fin/adapter-viem-v2');
    const adapter = new adapterMod.ViemAdapter(
      {
        getWalletClient: () => walletClient,
        getPublicClient: () => publicClient,
        addressContext: 'user-controlled',
        supportedChains: [{ chainId: 2911 }],
      },
      {}
    );
    const kit = new AppKit.AppKit({ apiKey: kitKey, adapter });
    const result = await kit.send({
      to,
      amount: (parseFloat(amount) * 1e6).toString(),
      token: token || 'USDC',
      chain: 'ARC_TESTNET',
    });
    return NextResponse.json({ txHash: result.txHash, status: 'success' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
