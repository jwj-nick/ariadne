import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Artwork from '../../components/Artwork';
import Constellation from '../../components/Constellation';
import MapFigure from '../../components/MapFigure';
import SourceThumb from '../../components/SourceThumb';
import Emblem, { emblemFor } from '../../components/Emblem';
import Section from '../../components/Section';
import WishButton from '../../components/WishButton';
import { CATEGORY_LABEL, DOMAIN_LABEL, getGraph, getTrace, siblingTraces } from '../../lib/graph';

/**
 * 모든 slug 가 빌드 시점에 확정되므로, 목록에 없는 주소는 요청 시 렌더링하지 않고 곧바로 404 로 보낸다.
 * 이렇게 하면 이 경로에 서버 함수가 아예 생기지 않아 배포 산출물이 순수 정적 파일이 된다.
 */
export const dynamicParams = false;

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
  if (!t) return { title: '없는 이름' };
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
      <Link href="/find" className="text-[12px]" style={{ color: 'var(--muted)' }}>
        ← 찾아보기
      </Link>

      <header className="mt-3 mb-6">
        <p className="text-[12px]" style={{ color: 'var(--thread)' }}>
          {CATEGORY_LABEL[trace.category] ?? trace.category}
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
        <div className="flex items-start gap-3.5">
          {sources[0] && (
            <div className="shrink-0" style={{ color: 'var(--thread)' }}>
              <Emblem name={emblemFor(sources[0].emblem, sources[0].domain)} size={52} strokeWidth={5} />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[12px]" style={{ color: 'var(--muted)' }}>
              이 이름은 어디서 왔나
            </p>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
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
          </div>
        </div>
        <p className="mt-2.5 text-[14px]">{trace.why}</p>
        {/* 흔적 자체의 그림이 이미 크게 걸리는 카드에서는, 원천이 어떤 모습으로
            전해져 왔는지를 여기에 작게 곁들인다. 그림을 빌려 온 카드에서는
            아래에 같은 그림이 크게 나오므로 두지 않는다. */}
        {trace.image &&
          (() => {
            const s0 = sources.find((s) => s.image);
            return s0?.image ? (
              <SourceThumb file={s0.image.file} href={`/source/${s0.slug}`} name={s0.name_ko} />
            ) : null;
          })()}
      </div>

      {/* 흔적 자체의 그림이 없으면 그 원천의 그림을 빌려 온다.
          로고는 상표권 때문에 걸 수 없지만, 그 이름이 나온 자리의 그림은 걸 수 있다. */}
      {(() => {
        const own = trace.image;
        const lent = own ? null : sources.find((s) => s.image)?.image;
        const lender = own ? null : sources.find((s) => s.image);
        if (own) return <Artwork file={own.file} caption={own.caption} license={own.license} />;
        if (lent && lender) {
          return (
            <Artwork
              file={lent.file}
              caption={lent.caption}
              license={lent.license}
              borrowedFrom={lender.name_ko}
            />
          );
        }
        return null;
      })()}

      {/* 사진은 망원경이 본 것이고, 맨눈으로 보이는 것은 점 몇 개다 (D46).
          지명은 사진보다 "어디쯤인가" 가 먼저다 (D47). */}
      {trace.constellation && <Constellation name={trace.constellation} />}
      {trace.map_spot && <MapFigure spot={trace.map_spot} />}

      <Section title="한 줄" text={trace.sections['한 줄']} />
      <Section title="어디서 만나나" text={trace.sections['어디서 만나나']} />
      <Section title="왜 이 이름인가" text={trace.sections['왜 이 이름인가']} />

      {siblings.length > 0 && (
        <section className="relative thread-rail mb-7">
          <h2 className="mb-2 text-[12px] tracking-wide" style={{ color: 'var(--muted)' }}>
            같은 이야기에서 온 다른 이름
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

      <WishButton kind="trace" id={trace.id} label={trace.name_ko} />

      <p className="text-[11.5px]" style={{ color: 'var(--muted)' }}>
        마주칠 확률 {trace.frequency} / 5
      </p>
    </article>
  );
}
