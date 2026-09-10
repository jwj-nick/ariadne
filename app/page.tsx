import Link from 'next/link';
import DailyCard, { type DailyItem } from './components/DailyCard';
import { emblemFor } from './components/Emblem';
import TodayStrip from './components/TodayStrip';
import { CATEGORY_LABEL, getGraph } from './lib/graph';

/**
 * 홈 (D34).
 *
 * 예전에는 첫 화면이 곧 482개짜리 목록이었다. 그래서 앱을 켠 사람이
 * "이걸로 무엇을 하는가" 를 묻는 자리에서 "여기 482개가 있다" 는 답을 받았다.
 * 이제 홈은 세 가지만 한다.
 *   1. 무엇을 하는 앱인지 한 문장으로 말한다.
 *   2. 오늘 할 일을 보여 준다.
 *   3. 실물 한 장을 그림째 보여 준다. 설명보다 이쪽이 빠르다.
 * 목록과 검색은 "찾기" 로 옮겼다.
 */
export default function Home() {
  const g = getGraph();
  const sourceById = new Map(g.sources.map((s) => [s.id, s]));

  if (g.traces.length === 0) {
    return (
      <div className="py-16 text-center" style={{ color: 'var(--muted)' }}>
        <p className="text-[15px]">콘텐츠가 아직 빌드되지 않았습니다.</p>
        <p className="mt-2 text-[13px]">
          터미널에서 <code>npm run build:content</code> 를 실행한 뒤 새로 고치십시오.
        </p>
      </div>
    );
  }

  // 오늘의 한 장 후보. 그림이 걸린 것 가운데 자주 마주치는 순으로 추린다.
  const daily: DailyItem[] = g.traces
    .map((t) => {
      const s = sourceById.get(t.sources[0] ?? '');
      return {
        slug: t.slug,
        name_ko: t.name_ko,
        name_en: t.name_en,
        why: t.why,
        emblem: s ? emblemFor(s.emblem, s.domain) : 'thread',
        file: t.image?.file ?? s?.image?.file,
        frequency: t.frequency,
      };
    })
    .filter((d) => Boolean(d.file))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 90)
    .map(({ frequency: _f, ...rest }) => rest);

  // 분야 미리보기. 카드가 많은 순으로 여섯 개만 이름을 보인다.
  const topCategories = Object.entries(
    g.traces.reduce<Record<string, number>>((acc, t) => {
      acc[t.category] = (acc[t.category] ?? 0) + 1;
      return acc;
    }, {}),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  return (
    <div>
      <section className="mb-6">
        <h1 className="text-[24px] leading-snug font-semibold">이 이름, 어디서 왔을까</h1>
        <p className="mt-2 text-[14px] leading-relaxed" style={{ color: 'var(--muted)' }}>
          나이키는 승리의 여신, 목성은 신들의 왕, 판도라의 상자는 삼천 년 된 이야기입니다.
          브랜드와 별과 관용구와 영화 제목까지, 매일 쓰는 이름이 어디서 왔는지 찾아봅니다.
        </p>
      </section>

      <TodayStrip traceIds={g.traces.map((t) => t.id)} />

      {/* 검색 상자 모양이지만 실제로는 찾기 화면으로 가는 문이다.
          홈에서 바로 치게 만들면 홈이 다시 목록 화면이 된다. */}
      <Link
        href="/find"
        className="flex items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-[14px]"
        style={{ background: 'var(--surface)', boxShadow: 'inset 0 0 0 1px var(--line)', color: 'var(--muted)' }}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <circle cx="11" cy="11" r="6.2" />
          <path d="m15.6 15.6 4 4" strokeLinecap="round" />
        </svg>
        나이키, 아킬레스건, ㅍㄷㄹ…
      </Link>

      <Link
        href="/browse"
        className="mt-2 flex items-center gap-2.5 rounded-lg px-3.5 py-3"
        style={{ background: 'var(--surface)', boxShadow: 'inset 0 0 0 1px var(--line)' }}
      >
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-medium">분야별로 훑어보기</span>
          <span className="mt-0.5 block truncate text-[11.5px]" style={{ color: 'var(--muted)' }}>
            {topCategories.map(([key]) => CATEGORY_LABEL[key] ?? key).join(' · ')} …
          </span>
        </span>
        <span className="shrink-0 text-[15px]" style={{ color: 'var(--muted)' }}>
          →
        </span>
      </Link>

      <DailyCard items={daily} />

      <p className="mt-7 text-center text-[12px]" style={{ color: 'var(--muted)' }}>
        이름 {g.meta.counts.traces}개 · 이야기 {g.meta.counts.sources}개 · 연결{' '}
        {g.meta.counts.edges}개
      </p>
    </div>
  );
}
