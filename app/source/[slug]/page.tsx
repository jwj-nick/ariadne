import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Emblem, { emblemFor } from '../../components/Emblem';
import Artwork from '../../components/Artwork';
import Section from '../../components/Section';
import WishButton from '../../components/WishButton';
import { DOMAIN_LABEL, REL_LABEL, getGraph, getSource, resolve, tracesOf } from '../../lib/graph';

/**
 * 모든 slug 가 빌드 시점에 확정되므로, 목록에 없는 주소는 요청 시 렌더링하지 않고 곧바로 404 로 보낸다.
 * 이렇게 하면 이 경로에 서버 함수가 아예 생기지 않아 배포 산출물이 순수 정적 파일이 된다.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return getGraph().sources.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const s = getSource(slug);
  if (!s) return { title: '없는 이야기' };
  return { title: `${s.name_ko} (${s.name_en})`, description: s.level_adult };
}

export default async function SourcePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const source = getSource(slug);
  if (!source) notFound();

  const traces = tracesOf(source.id);
  const relations = source.relations
    .map((r) => ({ rel: r.rel, target: resolve(r.target) }))
    .filter((r): r is { rel: string; target: NonNullable<ReturnType<typeof resolve>> } => Boolean(r.target));

  return (
    <article>
      <Link href="/find" className="text-[12px]" style={{ color: 'var(--muted)' }}>
        ← 찾아보기
      </Link>

      <header className="mt-3 mb-6 flex items-start gap-4">
        <div className="shrink-0" style={{ color: 'var(--thread)' }}>
          <Emblem name={emblemFor(source.emblem, source.domain)} size={74} strokeWidth={4.5} />
        </div>
        <div className="min-w-0 flex-1">
        <p className="text-[12px]" style={{ color: 'var(--thread)' }}>
          {DOMAIN_LABEL[source.domain] ?? source.domain}
        </p>
        <h1 className="mt-1 text-[26px] leading-tight font-semibold">{source.name_ko}</h1>
        <p className="wordmark mt-0.5 text-[15px]" style={{ color: 'var(--muted)' }}>
          {source.name_en}
        </p>
        {source.aliases.length > 0 && (
          <p className="mt-1 text-[12px]" style={{ color: 'var(--muted)' }}>
            다른 이름 {source.aliases.join(' · ')}
          </p>
        )}
        </div>
      </header>

      {/*
        두 눈높이 요약. 머리말의 전환에 따라 CSS 로 한쪽만 보인다.
        서버에서는 둘 다 그려 두므로 이 페이지는 서버 컴포넌트로 남는다.
      */}
      <div
        className="mb-7 rounded-lg p-4"
        style={{ background: 'var(--surface)', boxShadow: 'inset 0 0 0 1px var(--line)' }}
      >
        <div className="level-kid">
          <p className="text-[12px]" style={{ color: 'var(--muted)' }}>
            한 줄로
          </p>
          <p className="mt-1 text-[16px] leading-relaxed">{source.level_kid}</p>
        </div>
        <div className="level-adult">
          <p className="text-[12px]" style={{ color: 'var(--muted)' }}>
            한 줄로
          </p>
          <p className="mt-1 text-[15px] leading-relaxed">{source.level_adult}</p>
        </div>
      </div>

      {/* 이 원천에서 갈라져 나온 흔적들. 이 앱의 핵심 방향이다. */}
      {traces.length > 0 && (
        <section className="relative thread-rail mb-7">
          <h2 className="mb-2 text-[12px] tracking-wide" style={{ color: 'var(--muted)' }}>
            여기서 나온 이름
          </h2>
          <ul className="flex flex-col gap-1.5">
            {traces.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/trace/${t.slug}`}
                  className="block rounded-lg px-3 py-2"
                  style={{ background: 'var(--thread-soft)' }}
                >
                  <span className="text-[15px] font-semibold" style={{ color: 'var(--thread)' }}>
                    {t.name_ko}
                  </span>
                  <span className="wordmark ml-2 text-[12px]" style={{ color: 'var(--muted)' }}>
                    {t.name_en}
                  </span>
                  <span className="mt-0.5 block text-[13px]" style={{ color: 'var(--muted)' }}>
                    {t.why}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {source.image && (
        <Artwork file={source.image.file} caption={source.image.caption} license={source.image.license} />
      )}

      <Section title="한 줄 정의" text={source.sections['한 줄 정의']} />
      <Section title="3문장 스토리" text={source.sections['3문장 스토리']} />
      <Section title="왜 알아야 하나" text={source.sections['왜 알아야 하나']} />
      <Section title="연결" text={source.sections['연결']} />
      <Section title="한국 대응물" text={source.sections['한국 대응물']} />

      {relations.length > 0 && (
        <section className="relative thread-rail mb-7">
          <h2 className="mb-2 text-[12px] tracking-wide" style={{ color: 'var(--muted)' }}>
            관계
          </h2>
          <ul className="flex flex-col gap-1">
            {relations.map((r, i) => (
              <li key={i} className="text-[14px]">
                <Link href={r.target.href} className="thread-link">
                  {r.target.name}
                </Link>
                <span className="ml-2 text-[12.5px]" style={{ color: 'var(--muted)' }}>
                  {(REL_LABEL[r.rel] ?? r.rel).replace('~', '')}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <WishButton kind="source" id={source.id} label={source.name_ko} />

      <p className="text-[11.5px]" style={{ color: 'var(--muted)' }}>
        이 이야기에서 나온 이름 {traces.length}개
      </p>
    </article>
  );
}
