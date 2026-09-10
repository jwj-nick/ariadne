import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import LevelSwitch from './components/LevelSwitch';
import ServiceWorker from './components/ServiceWorker';
import TabBar from './components/TabBar';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Ariadne — 이름 뒤의 이야기',
    template: '%s · Ariadne',
  },
  description:
    '나이키는 승리의 여신, 목성은 신들의 왕. 매일 쓰는 이름이 어디서 왔는지 찾아보는 앱.',
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
        <div
          className="mx-auto flex min-h-dvh max-w-3xl flex-col px-5"
          style={{ paddingBottom: 'calc(74px + env(safe-area-inset-bottom))' }}
        >
          {/* 머리말은 이름과 부제만 남긴다.
              길잡이는 엄지가 닿는 화면 아래로 내려갔다 (D35). */}
          <header className="flex items-baseline justify-between gap-3 py-5">
            <Link href="/" className="flex items-baseline gap-2.5">
              <span className="wordmark text-xl" style={{ color: 'var(--thread)' }}>
                Ariadne
              </span>
              <span className="text-[12.5px]" style={{ color: 'var(--muted)' }}>
                이름 뒤의 이야기
              </span>
            </Link>
            <LevelSwitch />
          </header>

          <main className="flex-1">{children}</main>
          <ServiceWorker />

          <footer
            className="mt-10 border-t py-5 text-[12px]"
            style={{ borderColor: 'var(--line)', color: 'var(--muted)' }}
          >
            미궁 속 테세우스에게 실타래를 건넨 아리아드네처럼, 오늘 쓰는 이름에서 그 이야기까지
            실을 잇습니다.
          </footer>
        </div>
        <TabBar />
      </body>
    </html>
  );
}
