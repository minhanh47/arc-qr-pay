'use client';

import { useState, useRef, useEffect } from 'react';
import { useAccount } from 'wagmi';
import styles from './page.module.css';

export default function Home() {
  const { address, isConnected } = useAccount();
  const [scanning, setScanning] = useState(false);
  const [parsed, setParsed] = useState<{ address: string; amount: string; token: string } | null>(null);
  const [status, setStatus] = useState<string>('');
  const [txHash, setTxHash] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setScanning(true);
    } catch {
      setStatus('Cannot access camera');
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    setScanning(false);
  };

  const parseQR = (data: string) => {
    const ethMatch = data.match(/ethereum:(0x[a-fA-F0-9]{40})/);
    const amountMatch = data.match(/[?&]amount=([0-9.]+)/);
    const tokenMatch = data.match(/[?&]token=([A-Z]+)/);
    if (ethMatch) {
      setParsed({ address: ethMatch[1], amount: amountMatch ? amountMatch[1] : '1', token: tokenMatch ? tokenMatch[1] : 'USDC' });
    } else {
      setParsed({ address: data, amount: '1', token: 'USDC' });
    }
    stopCamera();
  };

  const sendPayment = async () => {
    if (!parsed) return;
    setStatus('Sending...');
    try {
      const res = await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: parsed.address, amount: parsed.amount, token: parsed.token }),
      });
      const data = await res.json();
      if (data.txHash) {
        setTxHash(data.txHash);
        setStatus('Payment sent!');
      } else {
        setStatus('Error: ' + (data.error || 'Unknown'));
      }
    } catch {
      setStatus('Network error');
    }
  };

  useEffect(() => () => { streamRef.current?.getTracks().forEach(t => t.stop()); }, []);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.logo}>Arc QR Pay</div>
        <p className={styles.sub}>AI-powered QR Payment on Arc Network</p>
        <div className={styles.walletRow}>
          <w3m-button></w3m-button>
        </div>
        {isConnected && <p className={styles.address}>Connected: {address?.slice(0,6)}...{address?.slice(-4)}</p>}
      </header>

      <main className={styles.main}>
        {!isConnected ? (
          <div className={styles.card}>
            <p style={{ textAlign: 'center', color: '#888' }}>Please connect your wallet to continue</p>
          </div>
        ) : (
          <div>
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Scan QR Code</h2>
              {!scanning ? (
                <button className={styles.btn} onClick={startCamera}>Open Camera</button>
              ) : (
                <button className={styles.btnStop} onClick={stopCamera}>Stop Camera</button>
              )}
              <video ref={videoRef} className={styles.video} style={{ display: scanning ? 'block' : 'none' }} />
              <div className={styles.divider}>or enter address manually</div>
              <input className={styles.input} placeholder="0x..." onChange={e => parseQR(e.target.value)} />
            </div>

            {parsed && (
              <div className={styles.card}>
                <h2 className={styles.cardTitle}>Payment Details</h2>
                <div className={styles.row}><span>To</span><span>{parsed.address.slice(0,10)}...{parsed.address.slice(-6)}</span></div>
                <div className={styles.row}><span>Amount</span><input className={styles.amountInput} value={parsed.amount} onChange={e => setParsed({ ...parsed, amount: e.target.value })} /></div>
                <div className={styles.row}><span>Token</span><span>{parsed.token}</span></div>
                <div className={styles.row}><span>Network</span><span>Arc Testnet</span></div>
                <button className={styles.btn} onClick={sendPayment}>Send {parsed.amount} {parsed.token}</button>
                {status && <p className={styles.status}>{status}</p>}
                {txHash && <a className={styles.explorer} href={'https://testnet.arcscan.app/tx/' + txHash} target="_blank" rel="noreferrer">View on Explorer</a>}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
