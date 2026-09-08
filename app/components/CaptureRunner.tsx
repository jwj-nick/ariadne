'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { matchCapture, type Match, type MatchTarget } from '../lib/capture/match';
import { initialState, today } from '../lib/learning/sm2';
import { store, type Capture } from '../lib/store';

/**
 * 조우 캡처 (D3, M2).
 *
 * 폰의 공유 시트에서 던진 글이 쿼리로 들어오거나, 직접 붙여 넣는다.
 * 들어온 글에서 이미 아는 흔적을 글자만으로 알아보고(AI 를 부르지 않는다),
 * 알아본 것은 오늘 복습 대기열 앞으로 당긴다.
 */
export default function CaptureRunner({ targets }: { targets: MatchTarget[] }) {
  const params = useSearchParams();
  const [ready, setReady] = useState(false);
  const [draft, setDraft] = useState('');
  const [list, setList] = useState<Capture[]>([]);
  const [message, setMessage] = useState('');

  const refresh = () => setList([...store.allCaptures()].reverse());

  const save = useCallback(
    (text: string, url = '', title = '') => {
      const body = [title, text, url].filter(Boolean).join('\n').trim();
      if (!body) return;
      const matches = matchCapture(body, targets);
      const capture: Capture = {
        id: `cap-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        text: text.trim(),
        url: url.trim(),
        title: title.trim(),
        matched_trace_ids: matches.filter((m) => m.type === 'trace').map((m) => m.id),
        status: 'open',
        at: new Date().toISOString(),
      };
      store.addCapture(capture);
      refresh();
      setMessage(
        capture.matched_trace_ids.length > 0
          ? `${capture.matched_trace_ids.length}개를 알아봤습니다.`
          : '아는 흔적을 찾지 못했습니다. 새 흔적 후보로 남길 수 있습니다.',
      );
    },
    [targets],
  );

  // 공유로 열렸으면 그 내용을 바로 담는다. 같은 주소를 새로 고쳐도 두 번 담기지 않게 표시를 남긴다.
  useEffect(() => {
    setReady(true);
    refresh();
    const text = params.get('text') ?? '';
    const url = params.get('url') ?? '';
    const title = params.get('title') ?? '';
    if (!text && !url && !title) return;
    const key = `ariadne.v1.lastShare`;
    const stamp = `${title}|${text}|${url}`;
    try {
      if (window.sessionStorage.getItem(key) === stamp) return;
      window.sessionStorage.setItem(key, stamp);
    } catch {
      // 저장 공간이 막혔으면 그냥 담는다. 중복은 목록에서 지우면 된다.
    }
    save(text, url, title);
  }, [params, save]);

  /** 알아본 흔적을 오늘 복습 대기열로 당긴다 (M2-4). */
  const keep = (capture: Capture) => {
    const day = today();
    for (const traceId of capture.matched_trace_ids) {
      const state = store.getReview(traceId) ?? initialState(traceId, day);
      store.saveReview({ ...state, due: day });
    }
    store.updateCapture(capture.id, { status: 'kept' });
    refresh();
    setMessage('오늘 복습에 넣었습니다.');
  };

  const mark = (capture: Capture, status: Capture['status'], note: string) => {
    store.updateCapture(capture.id, { status });
    refresh();
    setMessage(note);
  };

  if (!ready) return null;

  const box = { background: 'var(--surface)', boxShadow: 'inset 0 0 0 1px var(--line)' } as const;
  const byId = new Map(targets.map((t) => [t.id, t]));

  const STATUS_LABEL: Record<Capture['status'], string> = {
    open: '아직 처리하지 않음',
    kept: '오늘 복습에 넣음',
    candidate: '새 흔적 후보',
    dismissed: '버림',
  };

  return (
    <div className="flex flex-col gap-7">
      <section>
        <p className="text-[14px]" style={{ color: 'var(--muted)' }}>
          방송이나 책이나 거리에서 마주친 것을 그대로 던져 넣으십시오. 아는 이름이 들어 있으면 알아봅니다.
          안드로이드에서는 공유 시트에 Ariadne 이 나타나고, 아이폰에서는 아래 칸에 붙여 넣으면 됩니다.
        </p>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
          placeholder="본 문장이나 주소를 붙여 넣으십시오"
          className="mt-3 w-full rounded-lg p-3.5 text-[15px] outline-none"
          style={{ ...box, color: 'var(--ink)' }}
        />
        <button
          type="button"
          disabled={!draft.trim()}
          onClick={() => {
            save(draft);
            setDraft('');
          }}
          className="mt-2 w-full rounded-lg py-2.5 text-[15px] disabled:opacity-40"
          style={{ background: 'var(--thread)', color: '#fff' }}
        >
          담기
        </button>
        {message && (
          <p className="mt-3 text-[13.5px]" style={{ color: 'var(--thread)' }}>
            {message}
          </p>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-[12px]" style={{ color: 'var(--muted)' }}>
          담아 둔 것 {list.length}개
        </h2>
        {list.length === 0 && (
          <p className="py-6 text-center text-[14px]" style={{ color: 'var(--muted)' }}>
            아직 없습니다. 오늘 마주친 것을 하나 던져 넣어 보십시오.
          </p>
        )}
        <ul className="flex flex-col gap-2">
          {list.map((c) => {
            const hits = c.matched_trace_ids.map((id) => byId.get(id)).filter(Boolean);
            return (
              <li key={c.id} className="rounded-lg p-3.5" style={box}>
                <p className="text-[12px]" style={{ color: 'var(--muted)' }}>
                  {c.at.slice(0, 16).replace('T', ' ')} · {STATUS_LABEL[c.status]}
                </p>
                <p className="mt-1 text-[14.5px] leading-relaxed">
                  {(c.title ? c.title + ' — ' : '') + c.text || c.url}
                </p>
                {c.url && (
                  <p className="mt-1 truncate text-[12px]" style={{ color: 'var(--muted)' }}>
                    {c.url}
                  </p>
                )}

                {hits.length > 0 ? (
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {hits.map((t) => (
                      <Link
                        key={t!.id}
                        href={`/trace/${t!.id.split(':')[1]}`}
                        className="rounded-full px-2.5 py-1 text-[12.5px]"
                        style={{ background: 'var(--thread-soft)', color: 'var(--thread)' }}
                      >
                        {t!.name_ko}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-[13px]" style={{ color: 'var(--muted)' }}>
                    아는 흔적이 없습니다.
                  </p>
                )}

                {c.status === 'open' && (
                  <div className="mt-3 flex flex-wrap gap-1.5 text-[12.5px]">
                    {hits.length > 0 && (
                      <button
                        type="button"
                        onClick={() => keep(c)}
                        className="rounded-full px-3 py-1.5"
                        style={{ background: 'var(--thread)', color: '#fff' }}
                      >
                        오늘 복습에 넣기
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => mark(c, 'candidate', '새 흔적 후보로 남겼습니다.')}
                      className="rounded-full px-3 py-1.5"
                      style={{ color: 'var(--muted)', boxShadow: 'inset 0 0 0 1px var(--line)' }}
                    >
                      새 흔적 후보로
                    </button>
                    <button
                      type="button"
                      onClick={() => mark(c, 'dismissed', '버렸습니다.')}
                      className="rounded-full px-3 py-1.5"
                      style={{ color: 'var(--muted)' }}
                    >
                      버리기
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <p className="text-[12.5px]" style={{ color: 'var(--muted)' }}>
          새 흔적 후보로 남긴 것은 나중에 오너가 카드로 만듭니다.
          지금은 이 기기 안에만 쌓이므로, 진도와 백업 화면에서 함께 내려받아 두십시오.
        </p>
      </section>
    </div>
  );
}
