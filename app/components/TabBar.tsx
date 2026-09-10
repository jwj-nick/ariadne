'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * 화면 맨 아래에 고정되는 길잡이 (D35).
 *
 * 이전에는 머리말 아래에 일곱 개를 한 줄로 늘어놓았는데, 폰 폭에서는 네 개까지만 보이고
 * 나머지는 옆으로 밀어야 나왔다. 밀어야 보이는 것은 사실상 없는 것과 같다.
 * 그래서 자주 쓰는 다섯 개만 남겨 엄지가 닿는 자리에 고정하고,
 * 나머지는 "내 기록" 안으로 들여보냈다.
 */

const ITEMS = [
  { href: '/', label: '홈', icon: 'home' },
  { href: '/find', label: '찾기', icon: 'search' },
  { href: '/browse', label: '분야', icon: 'grid' },
  { href: '/quiz', label: '퀴즈', icon: 'check' },
  { href: '/settings', label: '내 기록', icon: 'me' },
] as const;

function Icon({ name, active }: { name: string; active: boolean }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: active ? 2 : 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };
  switch (name) {
    case 'home':
      return (
        <svg {...common}>
          <path d="M4 10.5 12 4l8 6.5" />
          <path d="M6.5 9.5V20h11V9.5" />
        </svg>
      );
    case 'search':
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="6.2" />
          <path d="m15.6 15.6 4 4" />
        </svg>
      );
    case 'grid':
      return (
        <svg {...common}>
          <rect x="4" y="4" width="7" height="7" rx="1.4" />
          <rect x="13" y="4" width="7" height="7" rx="1.4" />
          <rect x="4" y="13" width="7" height="7" rx="1.4" />
          <rect x="13" y="13" width="7" height="7" rx="1.4" />
        </svg>
      );
    case 'check':
      return (
        <svg {...common}>
          <rect x="4" y="4" width="16" height="16" rx="3" />
          <path d="m8.2 12.2 2.6 2.6 5-5.4" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="8.6" r="3.6" />
          <path d="M5.5 19.5c1.1-3.2 3.6-4.8 6.5-4.8s5.4 1.6 6.5 4.8" />
        </svg>
      );
  }
}

export default function TabBar() {
  const pathname = usePathname() ?? '/';

  /** 카드 화면(/trace, /source)에서는 어느 탭도 켜지 않는다. 거기는 어디서든 올 수 있는 자리다. */
  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/');

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t"
      style={{
        borderColor: 'var(--line)',
        background: 'var(--bg)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
      aria-label="주요 화면"
    >
      <ul className="mx-auto flex max-w-3xl">
        {ITEMS.map((it) => {
          const active = isActive(it.href);
          return (
            <li key={it.href} className="flex-1">
              <Link
                href={it.href}
                className="flex flex-col items-center gap-0.5 py-2"
                style={{ color: active ? 'var(--thread)' : 'var(--muted)' }}
                aria-current={active ? 'page' : undefined}
              >
                <Icon name={it.icon} active={active} />
                <span className="text-[10.5px]" style={{ fontWeight: active ? 600 : 400 }}>
                  {it.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
