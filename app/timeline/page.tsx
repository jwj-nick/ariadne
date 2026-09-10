import type { Metadata } from 'next';
import Link from 'next/link';
import { emblemFor } from '../components/Emblem';
import Emblem from '../components/Emblem';
import { DOMAIN_LABEL, getGraph } from '../lib/graph';

export const metadata: Metadata = {
  title: '연표',
  description: '신화는 언제 글이 되었고, 성경과 로마와 셰익스피어는 어느 순서인가.',
};

/**
 * 연표 (D42).
 *
 * 카드를 아무리 많이 읽어도 "제우스와 셰익스피어 중 누가 먼저인가" 는 저절로 잡히지 않는다.
 * 서양 교양의 뼈대는 이름의 목록이 아니라 **순서**다.
 *
 * 신화와 성경에는 연대를 못 박지 않는다. 개별 신에게 연도를 매기는 것은 없는 사실을 만드는 일이고,
 * 성서의 연대는 학계에서도 갈린다. 대신 "언제 글이 되었나" 를 띠 하나로 놓았다.
 */

const ERAS = [
  { label: '고대 근동', from: -3000, to: -900, note: '문자와 법이 처음 돌에 새겨진 시대' },
  { label: '그리스가 글을 갖다', from: -900, to: -500, note: '알파벳과 올림픽과 도시 국가가 자리를 잡는다' },
  { label: '아테네의 시대', from: -500, to: -320, note: '민주정과 철학과 의학이 한 세대 안에 쏟아진다' },
  { label: '알렉산드로스 이후', from: -320, to: -150, note: '그리스 말과 학문이 동쪽까지 퍼진다' },
  { label: '로마가 커지다', from: -150, to: 1, note: '공화정이 끝나고 한 사람의 이름이 자리의 이름이 된다' },
  { label: '로마 제국', from: 1, to: 500, note: '라틴어가 유럽의 공용어가 되고 신약이 쓰인다' },
  { label: '중세', from: 500, to: 1400, note: '수도원이 고전을 베껴 남긴다' },
  { label: '르네상스', from: 1400, to: 1700, note: '고전이 다시 읽히고 셰익스피어가 쓴다' },
  { label: '근대 이후', from: 1700, to: 2100, note: '소설이 새 신화를 만든다' },
] as const;

/** 연대가 없는 도메인은 "언제 글이 되었나" 로 자리를 잡는다. */
const BANDS = [
  {
    domain: 'greco-roman-myth',
    at: -800,
    when: '기원전 8세기 무렵',
    text: '호메로스와 헤시오도스가 신들의 이야기를 글로 남긴다. 그 전까지는 입에서 입으로 전해졌다.',
  },
  {
    domain: 'bible-ot',
    at: -880,
    when: '기원전 10세기 ~ 기원전 2세기',
    text: '히브리 성서가 여러 세대에 걸쳐 쓰이고 모아진다.',
  },
  {
    domain: 'bible-nt',
    at: 60,
    when: '기원후 1세기 후반',
    text: '신약이 그리스어로 쓰인다. 이후 라틴어 번역을 거쳐 유럽 전체의 공통 텍스트가 된다.',
  },
] as const;

const yearLabel = (y: number): string => (y < 0 ? `기원전 ${-y}년` : `${y}년`);

export default function TimelinePage() {
  const g = getGraph();
  const dated = g.sources.filter((s) => typeof s.year === 'number').sort((a, b) => a.year! - b.year!);
  const bands = BANDS.map((b) => ({
    ...b,
    label: DOMAIN_LABEL[b.domain] ?? b.domain,
    count: g.sources.filter((s) => s.domain === b.domain).length,
  })).filter((b) => b.count > 0);

  return (
    <div>
      <h1 className="mb-1 text-[21px] font-semibold">연표</h1>
      <p className="mb-6 text-[13.5px] leading-relaxed" style={{ color: 'var(--muted)' }}>
        제우스와 셰익스피어 중 누가 먼저인지, 신약과 로마 공화정 중 무엇이 앞인지.
        <strong> 서양 교양의 뼈대는 이름의 목록이 아니라 순서입니다.</strong>
      </p>

      <ol className="relative flex flex-col gap-7">
        {ERAS.map((era) => {
          const items = dated.filter((s) => s.year! >= era.from && s.year! < era.to);
          const inBand = bands.filter((b) => b.at >= era.from && b.at < era.to);
          if (items.length === 0 && inBand.length === 0) return null;

          return (
            <li key={era.label}>
              <div className="mb-2.5">
                <h2 className="text-[15px] font-semibold" style={{ color: 'var(--thread)' }}>
                  {era.label}
                </h2>
                <p className="mt-0.5 text-[11.5px]" style={{ color: 'var(--muted)' }}>
                  {yearLabel(era.from)} ~ {yearLabel(era.to)} · {era.note}
                </p>
              </div>

              {/* 연대를 못 박지 않는 도메인은 띠로 놓는다. */}
              {inBand.map((b) => (
                <Link
                  key={b.domain}
                  href="/browse"
                  className="mb-2 block rounded-lg px-3.5 py-3"
                  style={{ background: 'var(--thread-soft)' }}
                >
                  <span className="flex items-baseline gap-2">
                    <span className="text-[14px] font-semibold" style={{ color: 'var(--thread)' }}>
                      {b.label}
                    </span>
                    <span className="tabular-nums text-[12px]" style={{ color: 'var(--muted)' }}>
                      {b.count}장
                    </span>
                    <span className="ml-auto text-[11.5px]" style={{ color: 'var(--muted)' }}>
                      {b.when}
                    </span>
                  </span>
                  <span className="mt-1 block text-[12.5px] leading-relaxed" style={{ color: 'var(--muted)' }}>
                    {b.text}
                  </span>
                </Link>
              ))}

              <ul className="flex flex-col gap-1.5">
                {items.map((s) => (
                  <li key={s.id}>
                    <Link
                      href={`/source/${s.slug}`}
                      className="flex items-center gap-3 rounded-lg px-3 py-2"
                      style={{ background: 'var(--surface)', boxShadow: 'inset 0 0 0 1px var(--line)' }}
                    >
                      <span
                        className="shrink-0 tabular-nums whitespace-nowrap text-[11px]"
                        style={{ color: 'var(--muted)', width: 74 }}
                      >
                        {yearLabel(s.year!)}
                      </span>
                      <span className="shrink-0" style={{ color: 'var(--thread)' }}>
                        <Emblem name={emblemFor(s.emblem, s.domain)} size={20} strokeWidth={7} />
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[14px]">{s.name_ko}</span>
                      <span className="shrink-0 text-[11px]" style={{ color: 'var(--muted)' }}>
                        {DOMAIN_LABEL[s.domain] ?? s.domain}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ol>

      <p className="mt-8 text-[12px] leading-relaxed" style={{ color: 'var(--muted)' }}>
        연대는 대표값입니다. 사람은 활동기, 작품은 나온 해, 제도는 세워진 해를 적었습니다.
        신화와 성경에는 연대를 매기지 않고 <strong>언제 글이 되었는지</strong>만 놓았습니다.
      </p>
    </div>
  );
}
