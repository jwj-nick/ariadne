import type { Metadata } from 'next';
import { emblemFor } from '../components/Emblem';
import GraphView, { type GraphNode } from '../components/GraphView';
import { CATEGORY_LABEL, DOMAIN_LABEL, getGraph } from '../lib/graph';

export const metadata: Metadata = {
  title: '관계도',
  description: '이름과 이야기가 어떻게 이어져 있는지 한눈에 봅니다.',
};

export default function GraphPage() {
  const g = getGraph();
  const sourceById = new Map(g.sources.map((s) => [s.id, s]));
  const traceById = new Map(g.traces.map((t) => [t.id, t]));

  const nodes: GraphNode[] = g.layout.nodes
    .map((p): GraphNode | null => {
      if (p.type === 'source') {
        const s = sourceById.get(p.id);
        if (!s) return null;
        return {
          ...p,
          name_ko: s.name_ko,
          kicker: DOMAIN_LABEL[s.domain] ?? s.domain,
          href: `/source/${s.slug}`,
          emblem: emblemFor(s.emblem, s.domain),
          domain: s.domain,
        };
      }
      const t = traceById.get(p.id);
      if (!t) return null;
      // 흔적의 색은 그것이 가리키는 첫 원천의 도메인을 따른다. 같은 뿌리끼리 모여 보인다.
      const domain = sourceById.get(t.sources[0] ?? '')?.domain ?? 'history';
      return {
        ...p,
        name_ko: t.name_ko,
        kicker: CATEGORY_LABEL[t.category] ?? t.category,
        href: `/trace/${t.slug}`,
        domain,
      };
    })
    .filter((n): n is GraphNode => n !== null);

  if (nodes.length === 0) {
    return (
      <p className="py-16 text-center text-[14px]" style={{ color: 'var(--muted)' }}>
        아직 그릴 것이 없습니다. <code>npm run build:content</code> 를 먼저 실행하십시오.
      </p>
    );
  }

  return (
    <div>
      <h1 className="mb-1 text-[22px] font-semibold">관계도</h1>
      <p className="mb-4 text-[13.5px]" style={{ color: 'var(--muted)' }}>
        이름 {g.meta.counts.traces}개와 이야기 {g.meta.counts.sources}개가 {g.meta.counts.edges}개의 실로 이어져 있습니다.
      </p>
      <GraphView nodes={nodes} edges={g.edges} bounds={g.layout.bounds} />
    </div>
  );
}
