import type { Metadata } from 'next';
import Link from 'next/link';
import Settings from '../components/Settings';
import { getGraph } from '../lib/graph';

export const metadata: Metadata = {
  title: '내 기록',
  description: '진도를 확인하고, 눈높이를 고르고, 학습 기록을 백업합니다.',
};

/** 길잡이 다섯 자리에 들어가지 못한 화면들. 자주 쓰지는 않지만 없으면 안 되는 것들이다 (D35). */
const MORE = [
  { href: '/capture', title: '본 것 담기', desc: '밖에서 마주친 이름을 넣어 두면 오늘 퀴즈로 이어집니다' },
  { href: '/request', title: '새 항목 신청', desc: '여기에 없는 이름을 만들어 달라고 신청합니다' },
  { href: '/graph', title: '관계도', desc: '이름과 이야기가 어떻게 얽혀 있는지 한 장으로 봅니다' },
  { href: '/timeline', title: '연표', desc: '신화는 언제 글이 되었고 로마와 셰익스피어는 어느 순서인가' },
];

export default function SettingsPage() {
  return (
    <div>
      <h1 className="mb-6 text-[22px] font-semibold">내 기록</h1>
      <Settings traceIds={getGraph().traces.map((t) => t.id)} />

      <section className="mt-9">
        <h2 className="mb-2 text-[13px] font-semibold" style={{ color: 'var(--muted)' }}>
          그 밖의 화면
        </h2>
        <ul className="flex flex-col gap-2">
          {MORE.map((m) => (
            <li key={m.href}>
              <Link
                href={m.href}
                className="flex items-center gap-2.5 rounded-lg px-3.5 py-3"
                style={{ background: 'var(--surface)', boxShadow: 'inset 0 0 0 1px var(--line)' }}
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-medium">{m.title}</span>
                  <span className="mt-0.5 block text-[11.5px]" style={{ color: 'var(--muted)' }}>
                    {m.desc}
                  </span>
                </span>
                <span className="shrink-0 text-[15px]" style={{ color: 'var(--muted)' }}>
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* 안드로이드 껍데기 (D44). 아이폰에는 이런 길이 없어서 함께 밝혀 둔다. */}
      <section className="mt-8">
        <h2 className="mb-2 text-[13px] font-semibold" style={{ color: 'var(--muted)' }}>
          앱으로 설치하기
        </h2>
        <div
          className="rounded-lg px-4 py-3.5"
          style={{ background: 'var(--surface)', boxShadow: 'inset 0 0 0 1px var(--line)' }}
        >
          <p className="text-[13px] leading-relaxed" style={{ color: 'var(--muted)' }}>
            <strong style={{ color: 'var(--ink)' }}>안드로이드</strong>는 아래 파일을 받아 설치하면
            주소창 없이 열립니다. 기록은 지금 쓰던 것을 그대로 이어 씁니다.
            받을 때 "출처를 알 수 없는 앱" 을 한 번 허용해야 합니다.
          </p>
          <a
            href={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/ariadne.apk`}
            className="mt-2.5 inline-block rounded-lg px-4 py-2 text-[14px]"
            style={{ background: 'var(--thread)', color: '#fff' }}
          >
            ariadne.apk 내려받기
          </a>
          <p className="mt-3 text-[12.5px] leading-relaxed" style={{ color: 'var(--muted)' }}>
            <strong style={{ color: 'var(--ink)' }}>아이폰</strong>은 사파리에서 공유 단추를 누르고
            <strong style={{ color: 'var(--ink)' }}> 홈 화면에 추가</strong>를 고르십시오. 같은 모습으로 열립니다.
          </p>
        </div>
      </section>
    </div>
  );
}
