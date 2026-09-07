import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <div className="mx-auto flex min-h-dvh max-w-3xl flex-col px-5">
          <header className="flex items-baseline justify-between gap-3 py-6">
            <Link href="/" className="group flex items-baseline gap-2.5">
              <span className="wordmark text-xl" style={{ color: 'var(--thread)' }}>
                Ariadne
              </span>
              <span className="text-[13px]" style={{ color: 'var(--muted)' }}>
                아리아드네
              </span>
            </Link>
            <span className="text-[12px]" style={{ color: 'var(--muted)' }}>
              흔적 → 원천
            </span>
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
