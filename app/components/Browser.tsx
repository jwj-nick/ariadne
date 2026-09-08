'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import Emblem from './Emblem';

export interface BrowseItem {
  id: string;
  type: 'trace' | 'source';
  href: string;
  name_ko: string;
  name_en: string;
  /** 흔적이면 카테고리 이름, 원천이면 도메인 이름 */
  kicker: string;
  kickerKey: string;
  /** 흔적이면 why, 원천이면 level_adult */
  blurb: string;
  frequency: number;
  terms: string[];
  /** 원천 항목에만 있다. 목록에서도 문양이 먼저 눈에 들어오게 한다. */
  emblem?: string;
}

function FrequencyDots({ n }: { n: number }) {
  return (
    <span className="inline-flex items-center gap-[3px]" title={`마주칠 확률 ${n} / 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className="block h-[5px] w-[5px] rounded-full"
          style={{ background: i <= n ? 'var(--thread)' : 'var(--line)' }}
        />
      ))}
    </span>
  );
}

export default function Browser({ traces, sources }: { traces: BrowseItem[]; sources: BrowseItem[] }) {
  const [tab, setTab] = useState<'trace' | 'source'>('trace');
  const [q, setQ] = useState('');
  const [group, setGroup] = useState<string | null>(null);

  const pool = tab === 'trace' ? traces : sources;

  const groups = useMemo(() => {
    const m = new Map<string, { key: string; label: string; n: number }>();
    for (const it of pool) {
      const cur = m.get(it.kickerKey);
      if (cur) cur.n += 1;
      else m.set(it.kickerKey, { key: it.kickerKey, label: it.kicker, n: 1 });
    }
    return [...m.values()].sort((a, b) => b.n - a.n || a.label.localeCompare(b.label));
  }, [pool]);

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return pool
      .filter((it) => (group ? it.kickerKey === group : true))
      .filter((it) => {
        if (!needle) return true;
        if (it.name_ko.toLowerCase().includes(needle)) return true;
        if (it.name_en.toLowerCase().includes(needle)) return true;
        if (it.terms.some((t) => t.includes(needle))) return true;
        return it.blurb.toLowerCase().includes(needle);
      })
      .sort((a, b) => b.frequency - a.frequency || a.name_ko.localeCompare(b.name_ko, 'ko'));
  }, [pool, q, group]);

  const switchTab = (next: 'trace' | 'source') => {
    setTab(next);
    setGroup(null);
  };

  return (
    <div>
      {/* 흔적 / 원천 */}
      <div className="mb-4 flex gap-1.5">
        {(
          [
            ['trace', '흔적', traces.length],
            ['source', '원천', sources.length],
          ] as const
        ).map(([key, label, n]) => (
          <button
            key={key}
            type="button"
            onClick={() => switchTab(key)}
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
      </div>

      {/* 검색 */}
      <label className="block">
        <span className="sr-only">검색</span>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={tab === 'trace' ? '나이키, Nike, 관용구…' : '니케, Zeus, 신약…'}
          className="w-full rounded-lg px-3.5 py-2.5 text-[15px] outline-none"
          style={{
            background: 'var(--surface)',
            color: 'var(--ink)',
            boxShadow: 'inset 0 0 0 1px var(--line)',
          }}
        />
      </label>

      {/* 갈래 */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setGroup(null)}
          className="rounded-full px-2.5 py-1 text-[12px]"
          style={
            group === null
              ? { background: 'var(--thread-soft)', color: 'var(--thread)' }
              : { color: 'var(--muted)' }
          }
        >
          전체
        </button>
        {groups.map((g) => (
          <button
            key={g.key}
            type="button"
            onClick={() => setGroup(group === g.key ? null : g.key)}
            className="rounded-full px-2.5 py-1 text-[12px]"
            style={
              group === g.key
                ? { background: 'var(--thread-soft)', color: 'var(--thread)' }
                : { color: 'var(--muted)' }
            }
          >
            {g.label} <span className="tabular-nums opacity-60">{g.n}</span>
          </button>
        ))}
      </div>

      {/* 결과 */}
      <p className="mt-5 mb-2 text-[12px]" style={{ color: 'var(--muted)' }}>
        {results.length}개
      </p>

      <ul className="flex flex-col gap-2">
        {results.map((it) => (
          <li key={it.id}>
            <Link
              href={it.href}
              className="block rounded-lg p-3.5 transition-colors"
              style={{ background: 'var(--surface)', boxShadow: 'inset 0 0 0 1px var(--line)' }}
            >
              <div className="flex items-start gap-3">
                {it.emblem && (
                  <div className="mt-0.5 shrink-0" style={{ color: 'var(--thread)' }}>
                    <Emblem name={it.emblem} size={34} strokeWidth={6} />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <div className="flex items-baseline gap-2">
                      <span className="text-[16px] font-semibold">{it.name_ko}</span>
                      <span className="wordmark text-[13px]" style={{ color: 'var(--muted)' }}>
                        {it.name_en}
                      </span>
                    </div>
                    {it.type === 'trace' && <FrequencyDots n={it.frequency} />}
                  </div>
                  <div className="mt-0.5 text-[12px]" style={{ color: 'var(--muted)' }}>
                    {it.kicker}
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-[13.5px]" style={{ color: 'var(--muted)' }}>
                    {it.blurb}
                  </p>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {results.length === 0 && (
        <p className="py-10 text-center text-[14px]" style={{ color: 'var(--muted)' }}>
          찾는 것이 아직 없습니다. 다른 말로 검색해 보십시오.
        </p>
      )}
    </div>
  );
}
