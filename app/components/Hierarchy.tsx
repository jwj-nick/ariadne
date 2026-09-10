'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import Emblem from './Emblem';
import { thumbUrl } from '../lib/image';

export interface TreeCard {
  id: string;
  slug: string;
  href: string;
  name_ko: string;
  name_en: string;
  group: string;
  frequency: number;
  /** 위키미디어 파일 이름. 없으면 문양만 보인다. */
  file?: string;
  emblem: string;
}

export interface TreeBucket {
  key: string;
  label: string;
  groups: Array<{ key: string; label: string; cards: TreeCard[] }>;
  total: number;
}

/** 격자 한 칸. 그림이 오면 그림이, 못 오면 문양이 남는다. */
function Cell({ card }: { card: TreeCard }) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const src = card.file ? thumbUrl(card.file, 200) : null;

  return (
    <Link
      href={card.href}
      className="group flex flex-col overflow-hidden rounded-lg transition-transform active:scale-[0.98]"
      style={{ background: 'var(--surface)', boxShadow: 'inset 0 0 0 1px var(--line)' }}
    >
      <div
        className="relative flex items-center justify-center overflow-hidden"
        style={{ aspectRatio: '1 / 1', background: 'var(--thread-soft)' }}
      >
        {src && !failed ? (
          <img
            src={src}
            alt=""
            loading="lazy"
            decoding="async"
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
            className="h-full w-full object-cover"
            style={{ opacity: loaded ? 1 : 0, transition: 'opacity 200ms ease' }}
          />
        ) : null}
        {/* 그림이 아직 없거나 못 왔을 때 자리를 지킨다. */}
        {(!src || failed || !loaded) && (
          <span className="absolute" style={{ color: 'var(--thread)', opacity: 0.55 }}>
            <Emblem name={card.emblem} size={30} strokeWidth={6} />
          </span>
        )}
      </div>
      <div className="px-2 py-1.5">
        <div className="truncate text-[12.5px] font-medium leading-tight">{card.name_ko}</div>
        <div className="wordmark truncate text-[10.5px] leading-tight" style={{ color: 'var(--muted)' }}>
          {card.name_en}
        </div>
      </div>
    </Link>
  );
}

/**
 * 갈래 → 묶음 → 카드로 접히는 계층.
 *
 * 삼백 장을 한 줄로 늘어놓으면 "여기에 무엇이 있나" 를 볼 수가 없다.
 * 그래서 갈래를 먼저 접어 두고, 펼치면 묶음이 나오고, 묶음을 펼치면 카드가 격자로 깔린다.
 * 격자에 그림을 함께 놓는 이유는, 이름 열 개를 읽는 것보다 그림 열 개를 보는 편이 빠르기 때문이다.
 */
export default function Hierarchy({
  traceBuckets,
  sourceBuckets,
}: {
  traceBuckets: TreeBucket[];
  sourceBuckets: TreeBucket[];
}) {
  const [tab, setTab] = useState<'trace' | 'source'>('trace');
  /** 펼쳐 둔 갈래와 묶음. "갈래키" 와 "갈래키/묶음키" 를 함께 담는다. */
  const [open, setOpen] = useState<Set<string>>(new Set());

  const buckets = tab === 'trace' ? traceBuckets : sourceBuckets;
  const totals = useMemo(
    () => ({
      trace: traceBuckets.reduce((n, b) => n + b.total, 0),
      source: sourceBuckets.reduce((n, b) => n + b.total, 0),
    }),
    [traceBuckets, sourceBuckets],
  );

  const toggle = (key: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  // 탭을 옮기면 펼친 것을 접는다. 다른 갈래의 흔적이 남아 있으면 어디를 보고 있는지 흐려진다.
  useEffect(() => setOpen(new Set()), [tab]);

  const allOpen = buckets.every((b) => open.has(b.key));

  return (
    <div>
      <div className="mb-4 flex items-center gap-1.5">
        {(
          [
            ['trace', '이름', totals.trace],
            ['source', '이야기', totals.source],
          ] as const
        ).map(([key, label, n]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className="rounded-full px-3.5 py-1.5 text-[13px] transition-colors"
            style={
              tab === key
                ? { background: 'var(--thread)', color: '#fff' }
                : { background: 'transparent', color: 'var(--muted)', boxShadow: 'inset 0 0 0 1px var(--line)' }
            }
          >
            {label} <span className="tabular-nums opacity-70">{n}</span>
          </button>
        ))}
        <button
          type="button"
          onClick={() =>
            setOpen(allOpen ? new Set() : new Set(buckets.map((b) => b.key)))
          }
          className="ml-auto text-[12.5px]"
          style={{ color: 'var(--muted)' }}
        >
          {allOpen ? '모두 접기' : '모두 펼치기'}
        </button>
      </div>

      <ul className="flex flex-col gap-2">
        {buckets.map((b) => {
          const bucketOpen = open.has(b.key);
          return (
            <li
              key={b.key}
              className="overflow-hidden rounded-lg"
              style={{ background: 'var(--surface)', boxShadow: 'inset 0 0 0 1px var(--line)' }}
            >
              {/* 폰 폭에서는 이름과 묶음 목록이 한 줄에 들어가지 않는다.
                  이름을 먼저 온전히 보이게 하고, 그 안에 무엇이 있는지는 아랫줄로 내린다. */}
              <button
                type="button"
                onClick={() => toggle(b.key)}
                className="block w-full px-3.5 py-3 text-left"
                aria-expanded={bucketOpen}
              >
                <span className="flex items-center gap-2.5">
                  <span
                    className="text-[11px] transition-transform"
                    style={{
                      color: 'var(--thread)',
                      transform: bucketOpen ? 'rotate(90deg)' : 'none',
                      display: 'inline-block',
                    }}
                  >
                    ▶
                  </span>
                  <span className="text-[15px] font-semibold whitespace-nowrap">{b.label}</span>
                  <span className="tabular-nums text-[12.5px]" style={{ color: 'var(--muted)' }}>
                    {b.total}
                  </span>
                </span>
                {!bucketOpen && (
                  <span
                    className="mt-1 block truncate pl-[22px] text-[11.5px]"
                    style={{ color: 'var(--muted)' }}
                  >
                    {b.groups.map((g) => g.label).join(' · ')}
                  </span>
                )}
              </button>

              {bucketOpen && (
                <div className="px-3 pb-3">
                  {b.groups.map((g) => {
                    const gk = `${b.key}/${g.key}`;
                    const groupOpen = open.has(gk);
                    return (
                      <div key={g.key} className="mt-1.5 first:mt-0">
                        <button
                          type="button"
                          onClick={() => toggle(gk)}
                          className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left"
                          style={{ background: groupOpen ? 'var(--thread-soft)' : 'transparent' }}
                          aria-expanded={groupOpen}
                        >
                          <span
                            className="text-[9px]"
                            style={{
                              color: 'var(--thread)',
                              transform: groupOpen ? 'rotate(90deg)' : 'none',
                              display: 'inline-block',
                            }}
                          >
                            ▶
                          </span>
                          <span className="text-[13.5px]" style={{ color: groupOpen ? 'var(--thread)' : 'var(--ink)' }}>
                            {g.label}
                          </span>
                          <span className="tabular-nums text-[12px]" style={{ color: 'var(--muted)' }}>
                            {g.cards.length}
                          </span>
                        </button>

                        {groupOpen && (
                          <div className="mt-1.5 grid grid-cols-3 gap-1.5 sm:grid-cols-4">
                            {g.cards.map((c) => (
                              <Cell key={c.id} card={c} />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
