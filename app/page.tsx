import Browser, { type BrowseItem } from './components/Browser';
import { CATEGORY_LABEL, DOMAIN_LABEL, getGraph } from './lib/graph';

export default function Home() {
  const g = getGraph();

  const traces: BrowseItem[] = g.traces.map((t) => ({
    id: t.id,
    type: 'trace',
    href: `/trace/${t.slug}`,
    name_ko: t.name_ko,
    name_en: t.name_en,
    kicker: CATEGORY_LABEL[t.category] ?? t.category,
    kickerKey: t.category,
    blurb: t.why,
    frequency: t.frequency,
    terms: [t.name_ko, t.name_en, ...t.domain_hint].map((s) => s.toLowerCase()),
  }));

  const sources: BrowseItem[] = g.sources.map((s) => ({
    id: s.id,
    type: 'source',
    href: `/source/${s.slug}`,
    name_ko: s.name_ko,
    name_en: s.name_en,
    kicker: DOMAIN_LABEL[s.domain] ?? s.domain,
    kickerKey: s.domain,
    blurb: s.level_adult,
    // 원천은 그 자체의 빈도가 없으므로, 이 원천을 가리키는 흔적 가운데 가장 높은 값을 쓴다.
    frequency: Math.max(0, ...g.traces.filter((t) => t.sources.includes(s.id)).map((t) => t.frequency)),
    terms: [s.name_ko, s.name_en, ...s.aliases].map((x) => x.toLowerCase()),
  }));

  if (traces.length === 0) {
    return (
      <div className="py-16 text-center" style={{ color: 'var(--muted)' }}>
        <p className="text-[15px]">콘텐츠가 아직 빌드되지 않았습니다.</p>
        <p className="mt-2 text-[13px]">
          터미널에서 <code>npm run build:content</code> 를 실행한 뒤 새로 고치십시오.
        </p>
      </div>
    );
  }

  return (
    <div>
      <section className="mb-7">
        <h1 className="text-[22px] leading-snug font-semibold">
          오늘 본 이름 뒤에 무엇이 있는가
        </h1>
        <p className="mt-2 text-[14px]" style={{ color: 'var(--muted)' }}>
          브랜드, 행성, 용어, 관용구, 영화 제목처럼 우리가 매일 마주치는 <strong>흔적</strong>에서
          그 이름이 나온 신화와 성경과 역사, 곧 <strong>원천</strong>까지 실을 잇습니다.
        </p>
        <p className="mt-1.5 text-[12.5px]" style={{ color: 'var(--muted)' }}>
          흔적 {g.meta.counts.traces}개 · 원천 {g.meta.counts.sources}개 · 연결 {g.meta.counts.edges}개
        </p>
      </section>

      <Browser traces={traces} sources={sources} />
    </div>
  );
}
