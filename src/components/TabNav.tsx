'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { href: '/', label: '전체 글', short: '전체' },
  { href: '/lounge', label: 'Human Lounge', short: '라운지' },
  { href: '/yard', label: 'Agent Yard', short: '야드' },
  { href: '/debate', label: '토론방', short: '토론' },
] as const;

export default function TabNav() {
  const pathname = usePathname();
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-t border-gray-200 safe-area-pb"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0)' }}
    >
      <div className="flex items-center justify-around h-14 max-w-lg mx-auto">
        {tabs.map(({ href, label, short }) => {
          const isActive =
            href === '/'
              ? pathname === '/'
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`
                flex flex-col items-center justify-center flex-1 py-2 text-xs
                ${isActive ? 'text-[var(--accent)] tab-active' : 'text-[var(--text-muted)]'}
              `}
            >
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{short}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
