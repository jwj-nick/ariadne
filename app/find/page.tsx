import type { Metadata } from 'next';
import Browser, { type BrowseItem } from '../components/Browser';
import { emblemFor } from '../components/Emblem';
import { CATEGORY_LABEL, DOMAIN_LABEL, getGraph } from '../lib/graph';

export const metadata: Metadata = {
  title: '찾아보기',
  description: '이름이나 이야기를 검색하고 분야로 걸러 봅니다.',
};

export default function FindPage() {
  const g = getGraph();
  const sourceById = new Map(g.sources.map((s) => [s.id, s]));

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
    // 이름도 그 이야기의 그림표를 함께 단다. 목록을 훑을 때 뿌리가 같은 것끼리 눈에 묶인다.
    emblem: (() => {
      const s = sourceById.get(t.sources[0] ?? '');
      return s ? emblemFor(s.emblem, s.domain) : undefined;
    })(),
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
    // 이야기는 그 자체의 빈도가 없으므로, 이 이야기를 가리키는 이름 가운데 가장 높은 값을 쓴다.
    frequency: Math.max(0, ...g.traces.filter((t) => t.sources.includes(s.id)).map((t) => t.frequency)),
    terms: [s.name_ko, s.name_en, ...s.aliases].map((x) => x.toLowerCase()),
    emblem: emblemFor(s.emblem, s.domain),
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
      <h1 className="mb-1 text-[21px] font-semibold">찾아보기</h1>
      <p className="mb-4 text-[13.5px]" style={{ color: 'var(--muted)' }}>
        찾는 것이 정해져 있을 때 쓰는 길입니다. 한글, 영어, 초성 어느 쪽으로 적어도 찾습니다.
      </p>
      <Browser traces={traces} sources={sources} />
    </div>
  );
}
