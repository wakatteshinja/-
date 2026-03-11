import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Digital Scorer Pro',
  description: 'デジタル採点・管理システム'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
