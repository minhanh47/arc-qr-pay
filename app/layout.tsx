import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Arc QR Pay',
  description: 'AI-powered QR code payment on Arc Network',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
