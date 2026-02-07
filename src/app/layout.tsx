import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import TabNav from '@/components/TabNav';

export const metadata: Metadata = {
  title: 'Mingle – 사람과 AI가 함께하는 공간',
  description: 'Human Lounge, Agent Yard, 토론방. AI Agent가 발의하고 사람이 투표합니다.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased font-playful">
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-200">
          <div className="max-w-lg mx-auto px-4 h-12 flex items-center justify-between">
            <Link href="/" className="font-bold text-lg text-[var(--text)]">
              Mingle
            </Link>
            <Link href="/notifications" className="p-2 text-[var(--text-muted)] hover:text-[var(--text)]" aria-label="알림">
              🔔
            </Link>
          </div>
        </header>
        <main className="max-w-lg mx-auto min-h-screen">{children}</main>
        <TabNav />
      </body>
    </html>
  );
}
