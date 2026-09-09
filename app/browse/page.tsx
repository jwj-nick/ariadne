import Hierarchy, { type TreeBucket, type TreeCard } from '../components/Hierarchy';
import { emblemFor } from '../components/Emblem';
import { CATEGORY_LABEL, DOMAIN_LABEL, getGraph } from '../lib/graph';

export const metadata = {
  title: '갈래별 둘러보기 · Ariadne',
  description: '흔적과 원천을 갈래와 묶음으로 나누어 한눈에 봅니다.',
};

/**
 * 갈래 → 묶음 → 카드로 접히는 화면 (D31).
 *
 * 홈의 검색은 "무엇을 찾는지 이미 알 때" 쓰는 길이다.
 * 이 화면은 그 반대로, 무엇이 있는지 모를 때 훑어보라고 있다.
 */
export default function BrowsePage() {
  const g = getGraph();
  const sourceById = new Map(g.sources.map((s) => [s.id, s]));

  /** 갈래 목록을 카드 수가 많은 순으로 세우고, 그 안을 정의된 묶음 순서로 채운다. */
  function build(
    kind: 'trace' | 'source',
    cards: TreeCard[],
    bucketOf: (c: TreeCard) => string,
    labels: Record<string, string>,
  ): TreeBucket[] {
    const defs = g.meta.groups[kind] ?? {};
    const byBucket = new Map<string, TreeCard[]>();
    for (const c of cards) {
      const b = bucketOf(c);
      const list = byBucket.get(b);
      if (list) list.push(c);
      else byBucket.set(b, [c]);
    }
    return [...byBucket.entries()]
      .map(([key, list]) => {
        const order = defs[key] ?? [];
        const groups = order
          .map((d) => ({
            key: d.key,
            label: d.label,
            // 격자에서는 마주칠 확률이 높은 것이 먼저 눈에 들어와야 한다.
            cards: list
              .filter((c) => c.group === d.key)
              .sort((a, b) => b.frequency - a.frequency || a.name_ko.localeCompare(b.name_ko, 'ko')),
          }))
          .filter((gr) => gr.cards.length > 0);
        return { key, label: labels[key] ?? key, groups, total: list.length };
      })
      .sort((a, b) => b.total - a.total || a.label.localeCompare(b.label, 'ko'));
  }

  const traceCards: TreeCard[] = g.traces.map((t) => {
    const s = sourceById.get(t.sources[0] ?? '');
    return {
      id: t.id,
      slug: t.slug,
      href: `/trace/${t.slug}`,
      name_ko: t.name_ko,
      name_en: t.name_en,
      group: t.group,
      frequency: t.frequency,
      // 흔적 자체의 그림이 있으면 그것을, 없으면 그 원천의 그림을 물려받는다.
      // 브랜드 로고처럼 걸 수 없는 그림이 있어도 칸이 비지 않는다.
      file: t.image?.file ?? s?.image?.file,
      emblem: s ? emblemFor(s.emblem, s.domain) : 'thread',
    };
  });

  const sourceCards: TreeCard[] = g.sources.map((s) => ({
    id: s.id,
    slug: s.slug,
    href: `/source/${s.slug}`,
    name_ko: s.name_ko,
    name_en: s.name_en,
    group: s.group,
    frequency: Math.max(0, ...g.traces.filter((t) => t.sources.includes(s.id)).map((t) => t.frequency)),
    file: s.image?.file,
    emblem: emblemFor(s.emblem, s.domain),
  }));

  const traceBuckets = build(
    'trace',
    traceCards,
    (c) => g.traces.find((t) => t.id === c.id)!.category,
    CATEGORY_LABEL,
  );
  const sourceBuckets = build(
    'source',
    sourceCards,
    (c) => g.sources.find((s) => s.id === c.id)!.domain,
    DOMAIN_LABEL,
  );

  const withImage = [...traceCards, ...sourceCards].filter((c) => c.file).length;

  return (
    <div>
      <section className="mb-6">
        <h1 className="text-[21px] leading-snug font-semibold">갈래별로 둘러보기</h1>
        <p className="mt-2 text-[14px]" style={{ color: 'var(--muted)' }}>
          무엇을 찾을지 정하지 않았을 때 쓰는 길입니다. 갈래를 펼치면 묶음이 나오고,
          묶음을 펼치면 그 안의 카드가 전부 그림과 함께 깔립니다.
        </p>
        <p className="mt-1.5 text-[12.5px]" style={{ color: 'var(--muted)' }}>
          카드 {traceCards.length + sourceCards.length}장 · 그림 {withImage}장
        </p>
      </section>

      <Hierarchy traceBuckets={traceBuckets} sourceBuckets={sourceBuckets} />
    </div>
  );
}
