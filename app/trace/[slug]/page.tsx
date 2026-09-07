import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Section from '../../components/Section';
import { CATEGORY_LABEL, DOMAIN_LABEL, getGraph, getTrace, siblingTraces } from '../../lib/graph';

export function generateStaticParams() {
  return getGraph().traces.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const t = getTrace(slug);
  if (!t) return { title: '없는 흔적' };
  return { title: `${t.name_ko} (${t.name_en})`, description: t.why };
}

export default async function TracePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const trace = getTrace(slug);
  if (!trace) notFound();

  const g = getGraph();
  const sources = trace.sources
    .map((id) => g.sources.find((s) => s.id === id))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));
  const siblings = siblingTraces(trace);

  return (
    <article>
      <Link href="/" className="text-[12px]" style={{ color: 'var(--muted)' }}>
        ← 목록
      </Link>

      <header className="mt-3 mb-6">
        <p className="text-[12px]" style={{ color: 'var(--thread)' }}>
          흔적 · {CATEGORY_LABEL[trace.category] ?? trace.category}
        </p>
        <h1 className="mt-1 text-[26px] leading-tight font-semibold">{trace.name_ko}</h1>
        <p className="wordmark mt-0.5 text-[15px]" style={{ color: 'var(--muted)' }}>
          {trace.name_en}
        </p>
      </header>

      {/* 원천으로 가는 실 */}
      <div
        className="mb-7 rounded-lg p-4"
        style={{ background: 'var(--surface)', boxShadow: 'inset 0 0 0 1px var(--line)' }}
      >
        <p className="text-[12px]" style={{ color: 'var(--muted)' }}>
          이 이름은 어디서 왔나
        </p>
        <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-1">
          {sources.map((s) => (
            <Link key={s.id} href={`/source/${s.slug}`} className="thread-link text-[17px] font-semibold">
              {s.name_ko}
            </Link>
          ))}
          {sources[0] && (
            <span className="text-[12px]" style={{ color: 'var(--muted)' }}>
              {DOMAIN_LABEL[sources[0].domain] ?? sources[0].domain}
            </span>
          )}
        </div>
        <p className="mt-2 text-[14px]">{trace.why}</p>
      </div>

      <Section title="한 줄" text={trace.sections['한 줄']} />
      <Section title="어디서 만나나" text={trace.sections['어디서 만나나']} />
      <Section title="왜 이 이름인가" text={trace.sections['왜 이 이름인가']} />

      {siblings.length > 0 && (
        <section className="relative thread-rail mb-7">
          <h2 className="mb-2 text-[12px] tracking-wide" style={{ color: 'var(--muted)' }}>
            같은 원천의 다른 흔적
          </h2>
          <ul className="flex flex-wrap gap-1.5">
            {siblings.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/trace/${s.slug}`}
                  className="inline-block rounded-full px-3 py-1 text-[13px]"
                  style={{ background: 'var(--thread-soft)', color: 'var(--thread)' }}
                >
                  {s.name_ko}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-[11.5px]" style={{ color: 'var(--muted)' }}>
        마주칠 확률 {trace.frequency} / 5 · 상태 {trace.status}
      </p>
    </article>
  );
}
