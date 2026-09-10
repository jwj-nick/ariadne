'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { SELF_RATING_LABEL, qualityFromAuto, qualityFromSelf, type SelfRating } from '../lib/learning/grade';
import {
  NEW_PER_DAY,
  REVIEW_PER_DAY,
  dailyPlan,
  initialState,
  progress,
  review,
  today,
  type ReviewState,
} from '../lib/learning/sm2';
import { store, type Level } from '../lib/store';
import LearnCard from './LearnCard';
import { thumbUrl } from '../lib/image';
import ThreadReveal from './ThreadReveal';

export interface QuizItemView {
  id: string;
  trace_id: string;
  source_id: string;
  type: 'trace_to_source' | 'idiom_origin' | 'explain_why' | 'source_group';
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
  name_en?: string;
  slug: string;
  /** 흔적에만 있다. 답을 공개할 때 "왜 이 이름인가" 를 함께 보여 주기 위한 것이다. */
  why?: string;
  /** 원천에만 있다. 실이 도착하는 자리에 그릴 문양이다. */
  emblem?: string;
  /** 갈래 이름. 처음 만나는 자리에 함께 보인다 (D36). */
  kicker?: string;
  /** 마주칠 확률. 새로 배울 것을 고르는 순서가 된다 (D36). */
  frequency?: number;
  /** 위키미디어 파일 이름. 처음 만나는 자리와 힌트에 쓴다 (D37). */
  file?: string;
}

/** 답을 공개할 때 거는 그림 (D37). 못 불러오면 통째로 감춘다. */
function QuizArt({ file }: { file: string }) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  if (failed) return null;
  return (
    <div
      className="mt-3 overflow-hidden rounded-lg"
      style={{ aspectRatio: '16 / 10', background: 'var(--thread-soft)' }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={thumbUrl(file, 760)}
        alt=""
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className="h-full w-full object-cover"
        style={{ opacity: loaded ? 1 : 0, transition: 'opacity 250ms ease' }}
      />
    </div>
  );
}

const TYPE_LABEL: Record<QuizItemView['type'], string> = {
  trace_to_source: '어디서 왔나',
  source_group: '공통점 찾기',
  idiom_origin: '표현의 뿌리',
  explain_why: '이유 말하기',
};

/** 정답 비교. scripts/lib/quiz.ts 의 normalize 와 같은 규칙이어야 한다. */
const normalize = (s: string): string => s.toLowerCase().replace(/[\s·.,'"()[\]<>“”‘’]/g, '');

/** 하루 한 판의 크기. 새로 배울 몫과 다시 볼 몫을 합한 것이다. */
export const SESSION_CAP = NEW_PER_DAY + REVIEW_PER_DAY;

/** 큐 한 자리. fresh 면 오늘 처음 만나는 것이라 카드를 먼저 보여 준다 (D36). */
interface Slot {
  traceId: string;
  fresh: boolean;
}

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
  const [queue, setQueue] = useState<Slot[]>([]);
  const [cursor, setCursor] = useState(0);
  const [phase, setPhase] = useState<'learn' | 'ask' | 'reveal'>('ask');
  /** 하루 몫을 넘겨 더 배우겠다고 한 상태 */
  const [extra, setExtra] = useState(false);
  const [remaining, setRemaining] = useState(0);
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

  const buildQueue = useCallback(
    (more = false) => {
      const saved = store.allReviews();
      const byId = new Map(saved.map((r) => [r.itemId, r]));
      // 새로 배울 것은 마주칠 확률이 높은 것부터 고른다 (미션의 "넓게, 그러나 빈도순").
      const ordered = [...itemsByTrace.keys()].sort(
        (a, b) => (traces[b]?.frequency ?? 0) - (traces[a]?.frequency ?? 0) || a.localeCompare(b),
      );
      const states: ReviewState[] = ordered.map((traceId) => byId.get(traceId) ?? initialState(traceId, day));
      setStats(progress(states, totalTraces, day));

      // "더 배우기" 를 누르면 하루 몫을 한 판 더 준다.
      const plan = dailyPlan(states, day, more ? NEW_PER_DAY : NEW_PER_DAY, REVIEW_PER_DAY);
      const slots: Slot[] = [
        ...plan.learn.map((s) => ({ traceId: s.itemId, fresh: true })),
        ...plan.review.map((s) => ({ traceId: s.itemId, fresh: false })),
      ];
      // 하루 몫을 다 했는데도 더 하겠다면, 아직 안 만난 것을 이어서 준다.
      if (more && slots.length === 0) {
        const fresh = states.filter((s) => s.firstAt === '').slice(0, NEW_PER_DAY);
        slots.push(...fresh.map((s) => ({ traceId: s.itemId, fresh: true })));
      }
      setRemaining(plan.remaining);
      setQueue(slots);
      setCursor(0);
      setPhase(slots[0]?.fresh ? 'learn' : 'ask');
      setGuess('');
      setHintsShown(0);
      setCorrect(null);
      setDone(0);
      setExtra(more);
    },
    [itemsByTrace, traces, day, totalTraces],
  );

  useEffect(() => {
    setLevel(store.getProfile().level);
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) buildQueue(false);
  }, [ready, buildQueue]);

  // 머리말의 눈높이 전환과 같은 상태를 본다.
  useEffect(() => {
    const onLevel = (e: Event) => setLevel((e as CustomEvent<Level>).detail);
    window.addEventListener('ariadne:level', onLevel);
    return () => window.removeEventListener('ariadne:level', onLevel);
  }, []);

  const slot = queue[cursor];
  const traceId = slot?.traceId;
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
    const nextSlot = queue[cursor + 1];
    setPhase(nextSlot?.fresh ? 'learn' : 'ask');
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
        {remaining > 0 && (
          <p className="mt-1 text-[12.5px]" style={{ color: 'var(--muted)' }}>
            아직 만나지 않은 이름 {remaining}개
          </p>
        )}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {remaining > 0 && (
            <button
              type="button"
              onClick={() => buildQueue(true)}
              className="rounded-full px-4 py-2 text-[14px]"
              style={{ background: 'var(--thread)', color: '#fff' }}
            >
              {NEW_PER_DAY}장 더 배우기
            </button>
          )}
          <Link
            href="/find"
            className="rounded-full px-4 py-2 text-[14px]"
            style={
              remaining > 0
                ? { color: 'var(--muted)', boxShadow: 'inset 0 0 0 1px var(--line)' }
                : { background: 'var(--thread)', color: '#fff' }
            }
          >
            다른 이름 찾아보기
          </Link>
          <button
            type="button"
            onClick={() => buildQueue(false)}
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
  const learnCount = queue.filter((q) => q.fresh).length;
  const fresh = slot?.fresh ?? false;
  // 두 몫을 따로 센다. "새로 배우기 2 / 5" 와 "복습 3 / 15" 는 마음가짐이 다른 일이다.
  const stage = fresh
    ? { label: '새로 배우기', at: cursor + 1, of: learnCount }
    : { label: '복습', at: cursor - learnCount + 1, of: total - learnCount };

  return (
    <div>
      {/* 진행 표시 */}
      <div className="mb-5">
        <div className="flex items-baseline justify-between text-[12px]" style={{ color: 'var(--muted)' }}>
          <span>
            <span style={{ color: 'var(--thread)' }}>{stage.label}</span> {stage.at} / {stage.of}
          </span>
          <span>{phase === 'learn' ? '먼저 읽어 두십시오' : TYPE_LABEL[item.type]}</span>
        </div>
        <div className="mt-2 h-[3px] w-full rounded-full" style={{ background: 'var(--line)' }}>
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${(cursor / total) * 100}%`, background: 'var(--thread)' }}
          />
        </div>
      </div>

      {/* 오늘 처음 만나는 이름이면 먼저 보여 주고 되묻는다 (D36). */}
      {phase === 'learn' && trace && (
        <LearnCard
          key={traceId}
          nameKo={trace.name_ko}
          nameEn={trace.name_en ?? ''}
          kicker={trace.kicker}
          why={trace.why}
          sourceName={source?.name_ko}
          sourceKicker={source?.kicker}
          emblem={source?.emblem}
          file={trace.file}
          slug={trace.slug}
          onReady={() => setPhase('ask')}
        />
      )}

      {/* 문제 */}
      {phase !== 'learn' && (
        <h1 className="text-[20px] leading-snug font-semibold">{item.prompt}</h1>
      )}

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
            {/* 힌트를 다 열면 그림까지 내준다. 마지막 힌트는 본래 "거의 답" 자리다 (D37). */}
            {hintsShown >= item.hints.length && (source?.file ?? trace?.file) && (
              <QuizArt file={(source?.file ?? trace?.file)!} key={item.id + ':hint'} />
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
                이 이름은 {source.name_ko}에서 왔습니다.
              </p>
            )}
          </div>

          {/* 답과 함께 그림을 건다 (D37). 글로 읽은 답보다 그림이 오래 남고,
              다음에 이 그림을 어디서 다시 보면 그때 이름이 따라 올라온다. */}
          {(trace?.file ?? source?.file) && (
            <QuizArt file={(trace?.file ?? source?.file)!} key={item.id} />
          )}

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
