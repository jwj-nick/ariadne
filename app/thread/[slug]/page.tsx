import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import CardCell, { type CellCard } from '../../components/CardCell';
import { emblemFor } from '../../components/Emblem';
import Prose from '../../components/Prose';
import { getGraph } from '../../lib/graph';

/**
 * 실 한 편 (D39).
 *
 * 카드가 "이 이름이 어디서 왔나" 를 답한다면, 실은 "이 이름들이 왜 한 무리인가" 를 답한다.
 * 글을 먼저 읽히고 그 아래에 꿰인 카드를 격자로 깔아, 읽은 것과 볼 것이 한 화면에 있게 한다.
 */

export function generateStaticParams() {
  return getGraph().threads.map((t) => ({ slug: t.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const t = getGraph().threads.find((x) => x.slug === slug);
  if (!t) return { title: '없는 실' };
  return { title: t.title, description: t.lede };
}

export default async function ThreadPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const g = getGraph();
  const thread = g.threads.find((t) => t.slug === slug);
  if (!thread) notFound();

  const traceById = new Map(g.traces.map((t) => [t.id, t]));
  const sourceById = new Map(g.sources.map((s) => [s.id, s]));

  const cards: CellCard[] = thread.cards
    .map((id): CellCard | null => {
      const t = traceById.get(id);
      if (t) {
        const s0 = sourceById.get(t.sources[0] ?? '');
        return {
          id: t.id,
          href: `/trace/${t.slug}`,
          name_ko: t.name_ko,
          name_en: t.name_en,
          // 자기 그림이 없으면 그 이야기의 것을 물려받는다 (D32).
          file: t.image?.file ?? s0?.image?.file,
          emblem: s0 ? emblemFor(s0.emblem, s0.domain) : 'maze',
        };
      }
      const s = sourceById.get(id);
      if (!s) return null;
      return {
        id: s.id,
        href: `/source/${s.slug}`,
        name_ko: s.name_ko,
        name_en: s.name_en,
        file: s.image?.file,
        emblem: emblemFor(s.emblem, s.domain),
      };
    })
    .filter((c): c is CellCard => c !== null);

  return (
    <article>
      <Link href="/thread" className="text-[12px]" style={{ color: 'var(--muted)' }}>
        ← 이름의 무리
      </Link>

      <header className="mt-3 mb-5">
        <p className="text-[12px]" style={{ color: 'var(--thread)' }}>
          {thread.kicker}
        </p>
        <h1 className="mt-1 text-[24px] leading-snug font-semibold">{thread.title}</h1>
        <p className="mt-2 text-[14px] leading-relaxed" style={{ color: 'var(--muted)' }}>
          {thread.lede}
        </p>
      </header>

      <Prose text={thread.body} />

      {cards.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-2.5 text-[13px] font-semibold" style={{ color: 'var(--muted)' }}>
            이 실이 꿰는 카드 {cards.length}장
          </h2>
          <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
            {cards.map((c) => (
              <CardCell key={c.id} card={c} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
