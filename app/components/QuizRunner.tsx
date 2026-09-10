'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { SELF_RATING_LABEL, qualityFromAuto, qualityFromSelf, type SelfRating } from '../lib/learning/grade';
import { dueQueue, initialState, progress, review, today, type ReviewState } from '../lib/learning/sm2';
import { store, type Level } from '../lib/store';
import ThreadReveal from './ThreadReveal';

export interface QuizItemView {
  id: string;
  trace_id: string;
  source_id: string;
  type: 'trace_to_source' | 'idiom_origin' | 'explain_why';
  level: Level;
  grading: 'auto' | 'self';
  prompt: string;
  hints: string[];
  answer: string;
  accept: string[];
  choices?: string[];
}

export interface NodeMeta {
  name_ko: string;
  slug: string;
  /** 흔적에만 있다. 답을 공개할 때 "왜 이 이름인가" 를 함께 보여 주기 위한 것이다. */
  why?: string;
  /** 원천에만 있다. 실이 도착하는 자리에 그릴 문양이다. */
  emblem?: string;
}

const TYPE_LABEL: Record<QuizItemView['type'], string> = {
  trace_to_source: '어디서 왔나',
  idiom_origin: '표현의 뿌리',
  explain_why: '이유 말하기',
};

/** 정답 비교. scripts/lib/quiz.ts 의 normalize 와 같은 규칙이어야 한다. */
const normalize = (s: string): string => s.toLowerCase().replace(/[\s·.,'"()[\]<>“”‘’]/g, '');

export const SESSION_CAP = 20;

export default function QuizRunner({
  items,
  traces,
  sources,
  totalTraces,
}: {
  items: QuizItemView[];
  traces: Record<string, NodeMeta>;
  sources: Record<string, NodeMeta>;
  totalTraces: number;
}) {
  const [ready, setReady] = useState(false);
  const [level, setLevel] = useState<Level>('adult');
  const [queue, setQueue] = useState<string[]>([]);
  const [cursor, setCursor] = useState(0);
  const [phase, setPhase] = useState<'ask' | 'reveal'>('ask');
  const [guess, setGuess] = useState('');
  const [hintsShown, setHintsShown] = useState(0);
  const [correct, setCorrect] = useState<boolean | null>(null);
  const [stats, setStats] = useState({ seen: 0, due: 0, settled: 0, total: 0 });
  const [done, setDone] = useState(0);

  const day = today();

  /** 흔적별로 이 레벨에서 쓸 수 있는 문제들. */
  const itemsByTrace = useMemo(() => {
    const m = new Map<string, QuizItemView[]>();
    for (const it of items) {
      if (it.level !== level) continue;
      m.set(it.trace_id, [...(m.get(it.trace_id) ?? []), it]);
    }
    return m;
  }, [items, level]);

  const buildQueue = useCallback(() => {
    const saved = store.allReviews();
    const byId = new Map(saved.map((r) => [r.itemId, r]));
    const states: ReviewState[] = [...itemsByTrace.keys()].map(
      (traceId) => byId.get(traceId) ?? initialState(traceId, day),
    );
    setStats(progress(states, totalTraces, day));
    setQueue(dueQueue(states, day, SESSION_CAP).map((s) => s.itemId));
    setCursor(0);
    setPhase('ask');
    setGuess('');
    setHintsShown(0);
    setCorrect(null);
    setDone(0);
  }, [itemsByTrace, day, totalTraces]);

  useEffect(() => {
    setLevel(store.getProfile().level);
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) buildQueue();
  }, [ready, buildQueue]);

  // 머리말의 눈높이 전환과 같은 상태를 본다.
  useEffect(() => {
    const onLevel = (e: Event) => setLevel((e as CustomEvent<Level>).detail);
    window.addEventListener('ariadne:level', onLevel);
    return () => window.removeEventListener('ariadne:level', onLevel);
  }, []);

  const traceId = queue[cursor];
  const saved = traceId ? store.getReview(traceId) : undefined;
  const pool = traceId ? (itemsByTrace.get(traceId) ?? []) : [];
  // 같은 흔적을 다시 만날 때마다 다른 갈래의 문제가 나오도록 반복 횟수로 돌려 가며 고른다.
  const item = pool.length > 0 ? pool[(saved?.reps ?? 0) % pool.length]! : undefined;

  const finish = (quality: 0 | 1 | 2 | 3 | 4 | 5, guessText: string, wasCorrect: boolean) => {
    if (!traceId || !item) return;
    const base = store.getReview(traceId) ?? initialState(traceId, day);
    store.saveReview(review(base, quality, day));
    store.appendLog({
      trace_id: traceId,
      quiz_type: item.type,
      level: item.level,
      guess: guessText,
      correct: wasCorrect,
      hint_count: hintsShown,
      at: new Date().toISOString(),
    });
    setDone((n) => n + 1);
  };

  const submitAuto = (value: string) => {
    if (!item) return;
    const hit = item.accept.some((a) => normalize(a) === normalize(value)) || normalize(item.answer) === normalize(value);
    setGuess(value);
    setCorrect(hit);
    setPhase('reveal');
    finish(qualityFromAuto(hit, hintsShown), value, hit);
  };

  const submitSelf = (rating: SelfRating) => {
    if (!item) return;
    finish(qualityFromSelf(rating, hintsShown), guess, rating !== 'none');
    next();
  };

  const next = () => {
    setPhase('ask');
    setGuess('');
    setHintsShown(0);
    setCorrect(null);
    setCursor((c) => c + 1);
  };

  if (!ready) {
    return <p className="py-16 text-center text-[14px]" style={{ color: 'var(--muted)' }}>불러오는 중입니다…</p>;
  }

  // 오늘 볼 것을 다 봤을 때
  if (!traceId || !item) {
    return (
      <div className="py-10 text-center">
        <p className="text-[18px] font-semibold">
          {done > 0 ? `오늘 몫을 마쳤습니다. ${done}개 풀었습니다.` : '오늘 볼 것이 없습니다.'}
        </p>
        <p className="mt-2 text-[13.5px]" style={{ color: 'var(--muted)' }}>
          본 이름 {stats.seen} / {stats.total} · 장기 기억으로 넘어간 것 {stats.settled}개
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link
            href="/find"
            className="rounded-full px-4 py-2 text-[14px]"
            style={{ background: 'var(--thread)', color: '#fff' }}
          >
            다른 이름 찾아보기
          </Link>
          <button
            type="button"
            onClick={buildQueue}
            className="rounded-full px-4 py-2 text-[14px]"
            style={{ color: 'var(--muted)', boxShadow: 'inset 0 0 0 1px var(--line)' }}
          >
            다시 확인
          </button>
        </div>
      </div>
    );
  }

  const trace = traces[traceId];
  const source = sources[item.source_id];
  const total = queue.length;

  return (
    <div>
      {/* 진행 표시 */}
      <div className="mb-5">
        <div className="flex items-baseline justify-between text-[12px]" style={{ color: 'var(--muted)' }}>
          <span>
            {cursor + 1} / {total} · {TYPE_LABEL[item.type]}
          </span>
          <span>오늘 볼 것 {stats.due}개</span>
        </div>
        <div className="mt-2 h-[3px] w-full rounded-full" style={{ background: 'var(--line)' }}>
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${(cursor / total) * 100}%`, background: 'var(--thread)' }}
          />
        </div>
      </div>

      {/* 문제 */}
      <h1 className="text-[20px] leading-snug font-semibold">{item.prompt}</h1>

      {/* 추측 → 힌트 → 답 → 카드. 이 순서를 깨지 않는다 (D6). */}
      {phase === 'ask' && (
        <div className="mt-5">
          {item.choices ? (
            <ul className="flex flex-col gap-2">
              {item.choices.map((c) => (
                <li key={c}>
                  <button
                    type="button"
                    onClick={() => submitAuto(c)}
                    className="w-full rounded-lg p-3.5 text-left text-[15px] leading-relaxed"
                    style={{ background: 'var(--surface)', boxShadow: 'inset 0 0 0 1px var(--line)' }}
                  >
                    {c}
                  </button>
                </li>
              ))}
            </ul>
          ) : item.grading === 'self' ? (
            <>
              <textarea
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                rows={3}
                placeholder="떠오르는 대로 적어 보십시오. 적고 나서 답을 열면 훨씬 잘 남습니다."
                className="w-full rounded-lg p-3.5 text-[15px] outline-none"
                style={{ background: 'var(--surface)', color: 'var(--ink)', boxShadow: 'inset 0 0 0 1px var(--line)' }}
              />
              <button
                type="button"
                onClick={() => setPhase('reveal')}
                className="mt-2 w-full rounded-lg py-2.5 text-[15px]"
                style={{ background: 'var(--thread)', color: '#fff' }}
              >
                답 보기
              </button>
            </>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (guess.trim()) submitAuto(guess.trim());
              }}
            >
              <input
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                placeholder="어느 이야기에서 왔을까요"
                autoComplete="off"
                className="w-full rounded-lg px-3.5 py-2.5 text-[15px] outline-none"
                style={{ background: 'var(--surface)', color: 'var(--ink)', boxShadow: 'inset 0 0 0 1px var(--line)' }}
              />
              <button
                type="submit"
                disabled={!guess.trim()}
                className="mt-2 w-full rounded-lg py-2.5 text-[15px] disabled:opacity-40"
                style={{ background: 'var(--thread)', color: '#fff' }}
              >
                확인
              </button>
            </form>
          )}

          {/* 힌트 */}
          <div className="mt-5">
            {item.hints.slice(0, hintsShown).map((h, i) => (
              <p key={i} className="mb-1.5 text-[14px]" style={{ color: 'var(--muted)' }}>
                <span style={{ color: 'var(--thread)' }}>힌트 {i + 1}.</span> {h}
              </p>
            ))}
            {hintsShown < item.hints.length && (
              <button
                type="button"
                onClick={() => setHintsShown((n) => n + 1)}
                className="text-[13px] underline underline-offset-4"
                style={{ color: 'var(--muted)' }}
              >
                힌트 보기 ({hintsShown} / {item.hints.length})
              </button>
            )}
          </div>
        </div>
      )}

      {/* 답 */}
      {phase === 'reveal' && (
        <div className="mt-5">
          {/* 흔적에서 원천으로 실이 이어지는 장면. 이 앱의 은유를 그대로 보여 준다. */}
          {trace && source && (
            <ThreadReveal
              key={item.id}
              traceName={trace.name_ko}
              sourceName={source.name_ko}
              emblem={source.emblem ?? 'maze'}
            />
          )}

          {correct !== null && (
            <p className="mb-3 text-[15px] font-semibold" style={{ color: correct ? 'var(--thread)' : 'var(--muted)' }}>
              {correct ? '맞혔습니다.' : `아쉽습니다. 적으신 답은 "${guess}"`}
            </p>
          )}

          <div
            className="rounded-lg p-4"
            style={{ background: 'var(--surface)', boxShadow: 'inset 0 0 0 1px var(--line)' }}
          >
            <p className="text-[12px]" style={{ color: 'var(--muted)' }}>
              {item.type === 'explain_why' ? '이 이름이 붙은 까닭' : '답'}
            </p>
            <p className="mt-1.5 text-[16px] leading-relaxed">{item.answer}</p>
            {item.type !== 'explain_why' && trace?.why && (
              <p className="mt-2.5 text-[14px] leading-relaxed" style={{ color: 'var(--muted)' }}>
                {trace.why}
              </p>
            )}
            {item.type === 'explain_why' && source && (
              <p className="mt-2 text-[13px]" style={{ color: 'var(--muted)' }}>
                이 이름은 {source.name_ko} 에서 왔습니다.
              </p>
            )}
          </div>

          {item.grading === 'self' ? (
            <div className="mt-5">
              <p className="mb-2 text-[13px]" style={{ color: 'var(--muted)' }}>
                스스로 어땠는지 골라 주십시오. 다음에 언제 다시 볼지가 여기서 정해집니다.
              </p>
              <div className="flex flex-col gap-2">
                {(['exact', 'close', 'none'] as SelfRating[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => submitSelf(r)}
                    className="rounded-lg py-2.5 text-[15px]"
                    style={{ background: 'var(--surface)', boxShadow: 'inset 0 0 0 1px var(--line)' }}
                  >
                    {SELF_RATING_LABEL[r]}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={next}
              className="mt-5 w-full rounded-lg py-2.5 text-[15px]"
              style={{ background: 'var(--thread)', color: '#fff' }}
            >
              다음
            </button>
          )}

          {trace && (
            <p className="mt-4 text-center text-[13px]">
              <Link href={`/trace/${trace.slug}`} className="thread-link">
                {trace.name_ko} 카드 열어 보기
              </Link>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
