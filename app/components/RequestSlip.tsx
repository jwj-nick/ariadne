'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { buildSlip, slipFileName } from '../lib/request/slip';
import type { MatchTarget } from '../lib/capture/match';
import { progress } from '../lib/learning/sm2';
import { store, type Wish } from '../lib/store';

/**
 * 카드 요청서 화면 (D28).
 *
 * 담아 둔 것을 한 장의 글로 뽑아 준다. 그 글은 사람이 읽기 위한 것이 아니라
 * 개발 도구에 그대로 붙여 넣기 위한 것이므로, 무엇을 원하는지뿐 아니라
 * 어디에 어떤 형식으로 쓰고 무엇으로 검사하는지까지 담는다.
 *
 * 앱이 정적이라 서버로 보낼 곳이 없다 (D25). 그래서 나가는 길을 세 갈래로 열어 둔다.
 * 클립보드로 복사하기, 파일로 내려받기, 그리고 화면에서 직접 골라 복사하기다.
 */
export default function RequestSlip({
  targets,
  totalTraces,
  categories,
  domains,
}: {
  targets: MatchTarget[];
  totalTraces: number;
  categories: string[];
  domains: string[];
}) {
  const [ready, setReady] = useState(false);
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [draft, setDraft] = useState('');
  const [message, setMessage] = useState('');
  const [stats, setStats] = useState({ seen: 0, due: 0, settled: 0, total: 0 });
  const [weak, setWeak] = useState<string[]>([]);
  const areaRef = useRef<HTMLTextAreaElement>(null);

  const refresh = () => {
    setWishes([...store.allWishes()].reverse());
    setStats(progress(store.allReviews(), totalTraces));

    // 최근에 자주 틀린 흔적을 뽑아 요청서에 실어 보낸다. 설명이 부족한 카드를 찾는 단서가 된다.
    const missCount = new Map<string, number>();
    for (const log of store.recentLogs(200)) {
      if (log.correct) continue;
      missCount.set(log.trace_id, (missCount.get(log.trace_id) ?? 0) + 1);
    }
    const byId = new Map(targets.map((t) => [t.id, t.name_ko]));
    setWeak(
      [...missCount.entries()]
        .filter(([, n]) => n >= 2)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([id]) => byId.get(id) ?? id),
    );
  };

  useEffect(() => {
    refresh();
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addFree = () => {
    const text = draft.trim();
    if (!text) return;
    store.addWish({
      id: `wish-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      text,
      origin: { kind: 'free' },
      note: '',
      at: new Date().toISOString(),
    });
    setDraft('');
    refresh();
    setMessage('담았습니다.');
  };

  const date = new Date().toISOString().slice(0, 10);
  const slip = useMemo(
    () =>
      buildSlip({
        // 담은 차례대로 읽히도록 화면과 반대로 뒤집는다.
        wishes: [...wishes].reverse(),
        targets,
        progress: {
          seen: stats.seen,
          settled: stats.settled,
          total: totalTraces,
        },
        weak,
        categories,
        domains,
        date,
      }),
    [wishes, targets, stats.seen, stats.settled, totalTraces, weak, categories, domains, date],
  );

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(slip);
      setMessage('복사했습니다. 개발 도구에 그대로 붙여 넣으십시오.');
    } catch {
      // 권한이 막혔거나 오래된 브라우저다. 글을 통째로 골라 두면 손으로 복사할 수 있다.
      areaRef.current?.focus();
      areaRef.current?.select();
      setMessage('자동 복사가 막혀 있습니다. 아래 글이 선택되었으니 직접 복사하십시오.');
    }
  };

  const download = () => {
    const blob = new Blob([slip], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = slipFileName(date);
    a.click();
    URL.revokeObjectURL(url);
    setMessage('신청서를 파일로 내려받았습니다.');
  };

  const box = {
    background: 'var(--surface)',
    boxShadow: 'inset 0 0 0 1px var(--line)',
  } as const;

  const ORIGIN_LABEL: Record<Wish['origin']['kind'], string> = {
    trace: '이름',
    source: '이야기',
    capture: '캡처',
    free: '직접',
  };

  return (
    <div className="flex flex-col gap-7">
      <section>
        <p className="text-[14px]" style={{ color: 'var(--muted)' }}>
          더 알고 싶은 것을 담아 두면, 카드를 새로 만들어 달라고 부탁하는 글 한 장으로 뽑아 줍니다. 그 글을
          복사해서 개발 도구에 붙여 넣거나, 파일로 받아 두었다가 나중에 쓰시면 됩니다.
        </p>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={2}
          placeholder="예: 성경에서 온 법률 용어를 더 보고 싶습니다"
          className="mt-3 w-full rounded-lg p-3.5 text-[15px] outline-none"
          style={{ ...box, color: 'var(--ink)' }}
        />
        <button
          type="button"
          disabled={!draft.trim()}
          onClick={addFree}
          className="mt-2 w-full rounded-lg py-2.5 text-[15px] disabled:opacity-40"
          style={{ background: 'var(--thread)', color: '#fff' }}
        >
          담기
        </button>
      </section>

      <section>
        <h2 className="mb-2 text-[12px]" style={{ color: 'var(--muted)' }}>
          담아 둔 것 {wishes.length}개
        </h2>
        {ready && wishes.length === 0 && (
          <p className="rounded-lg py-6 text-center text-[14px]" style={{ ...box, color: 'var(--muted)' }}>
            아직 없습니다. 위에 적어 담거나, 카드 화면 아래의{' '}
            <span style={{ color: 'var(--thread)' }}>이것에 대해 더 알고 싶습니다</span> 를 누르십시오.
          </p>
        )}
        <ul className="flex flex-col gap-2">
          {wishes.map((w) => (
            <li key={w.id} className="rounded-lg p-3.5" style={box}>
              <p className="text-[12px]" style={{ color: 'var(--muted)' }}>
                {w.at.slice(0, 10)} · {ORIGIN_LABEL[w.origin.kind] ?? '어딘가'}
              </p>
              <p className="mt-1 text-[15px] font-semibold">
                {w.origin.id && (w.origin.kind === 'trace' || w.origin.kind === 'source') ? (
                  <Link href={`/${w.origin.kind}/${w.origin.id.split(':')[1]}`} className="thread-link">
                    {w.text}
                  </Link>
                ) : (
                  w.text
                )}
              </p>
              {w.note && <p className="mt-1 text-[13.5px]">{w.note}</p>}
              <button
                type="button"
                onClick={() => {
                  store.removeWish(w.id);
                  refresh();
                  setMessage('뺐습니다.');
                }}
                className="mt-2 text-[12.5px]"
                style={{ color: 'var(--muted)' }}
              >
                빼기
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* 담은 것이 없으면 요청서 구역을 통째로 접는다. 빈 글을 보여 줄 이유가 없다. */}
      {wishes.length > 0 && (
        <section>
          <h2 className="mb-2 text-[12px]" style={{ color: 'var(--muted)' }}>
            신청서
          </h2>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void copy()}
              className="rounded-lg px-4 py-2.5 text-[14px]"
              style={{ background: 'var(--thread)', color: '#fff' }}
            >
              복사하기
            </button>
            <button
              type="button"
              onClick={download}
              className="rounded-lg px-4 py-2.5 text-[14px]"
              style={box}
            >
              파일로 저장
            </button>
            <button
              type="button"
              onClick={() => {
                store.clearWishes();
                refresh();
                setMessage('담아 둔 것을 모두 비웠습니다.');
              }}
              className="rounded-lg px-4 py-2.5 text-[14px]"
              style={{ color: 'var(--muted)' }}
            >
              모두 비우기
            </button>
          </div>
          {message && (
            <p className="mt-3 text-[13.5px]" style={{ color: 'var(--thread)' }}>
              {message}
            </p>
          )}

          <p className="mt-4 mb-2 text-[12.5px]" style={{ color: 'var(--muted)' }}>
            아래가 뽑힌 글입니다. 길게 눌러 직접 골라 복사하셔도 됩니다.
          </p>
          <textarea
            ref={areaRef}
            readOnly
            value={slip}
            rows={14}
            spellCheck={false}
            className="w-full rounded-lg p-3.5 font-mono text-[12.5px] leading-relaxed outline-none"
            style={{ ...box, color: 'var(--ink)' }}
          />
        </section>
      )}

      <section>
        <p className="text-[12.5px]" style={{ color: 'var(--muted)' }}>
          담아 둔 것은 이 기기 안에만 쌓입니다.{' '}
          <Link href="/settings" className="thread-link">
            진도와 백업
          </Link>{' '}
          에서 내려받는 백업 파일에도 함께 들어가므로, 폰을 바꾸기 전에 한 번 받아 두시는 편이 좋습니다.
        </p>
      </section>
    </div>
  );
}
