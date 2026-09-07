import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import LevelSwitch from './components/LevelSwitch';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Ariadne — 흔적에서 원천까지',
    template: '%s · Ariadne',
  },
  description:
    '오늘 본 로고, 용어, 행성, 그림, 영화 뒤에 무엇이 있는지 실을 이어 주는 서양 교양 학습 앱.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

/**
 * 눈높이를 그리기 전에 심는다. 이것이 없으면 어른 화면이 잠깐 보였다가 아이 화면으로 바뀐다.
 * 저장 공간이 막힌 브라우저에서도 화면이 멈추지 않도록 통째로 감쌌다.
 */
const LEVEL_BOOTSTRAP = `try{var l=JSON.parse(localStorage.getItem('ariadne.v1.profile')||'{}').level;document.documentElement.dataset.level=(l==='kid'||l==='adult')?l:'adult';}catch(e){document.documentElement.dataset.level='adult';}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" data-level="adult">
      <head>
        <script dangerouslySetInnerHTML={{ __html: LEVEL_BOOTSTRAP }} />
      </head>
      <body>
        <div className="mx-auto flex min-h-dvh max-w-3xl flex-col px-5">
          <header className="py-6">
            <div className="flex items-baseline justify-between gap-3">
              <Link href="/" className="flex items-baseline gap-2.5">
                <span className="wordmark text-xl" style={{ color: 'var(--thread)' }}>
                  Ariadne
                </span>
                <span className="text-[13px]" style={{ color: 'var(--muted)' }}>
                  아리아드네
                </span>
              </Link>
              <LevelSwitch />
            </div>
            <nav className="mt-3 flex gap-4 text-[13px]">
              <Link href="/" style={{ color: 'var(--muted)' }}>
                흔적 둘러보기
              </Link>
              <Link href="/quiz" style={{ color: 'var(--thread)' }}>
                오늘의 복습
              </Link>
              <Link href="/settings" style={{ color: 'var(--muted)' }}>
                진도와 백업
              </Link>
            </nav>
          </header>

          <main className="flex-1 pb-16">{children}</main>

          <footer
            className="border-t py-6 text-[12px]"
            style={{ borderColor: 'var(--line)', color: 'var(--muted)' }}
          >
            미궁 속 테세우스에게 실타래를 건넨 아리아드네처럼, 흔적에서 원천까지 실을 잇는다.
          </footer>
        </div>
      </body>
    </html>
  );
}
