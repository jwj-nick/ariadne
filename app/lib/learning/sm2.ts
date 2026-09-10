/**
 * SM-2 간격 반복 스케줄러.
 *
 * **과목에 독립적이다.** 이 파일에는 신화도 흔적도 등장하지 않는다.
 * 나중에 별도 리포로 떼어 낼 수 있도록 이 경계를 지킨다 (docs/03-SKILLS-TOOLS.md G절).
 * 항목 식별자는 문자열이면 무엇이든 된다. Ariadne 은 trace id 를 넣는다 (D7 — trace 단위 스케줄).
 *
 * 원 알고리즘은 SuperMemo 2 다.
 *   q >= 3 이면 통과. 반복 횟수에 따라 1일 → 6일 → 이전 간격 x 난이도계수.
 *   q < 3 이면 실패. 반복 횟수를 0 으로 되돌리고 다음 날 다시 본다.
 *   난이도계수(ease)는 매번 q 에 따라 오르내리며 1.3 아래로는 내려가지 않는다.
 */

export type Quality = 0 | 1 | 2 | 3 | 4 | 5;

export interface ReviewState {
  itemId: string;
  /** 난이도계수. 클수록 쉬운 항목이라 간격이 빨리 벌어진다. 처음은 2.5. */
  ease: number;
  /** 다음까지의 간격(일). */
  interval: number;
  /** 연속으로 통과한 횟수. 실패하면 0 으로 돌아간다. */
  reps: number;
  /** 통과했다가 실패한 횟수. 줄어들지 않는다. */
  lapses: number;
  /** 다음에 볼 날. YYYY-MM-DD. */
  due: string;
  /** 마지막으로 본 날. YYYY-MM-DD. */
  lastAt: string;
  /**
   * 처음 만난 날. YYYY-MM-DD. 아직 만나지 않았으면 빈 문자열이다.
   *
   * lastAt 과 따로 두는 이유가 있다. 하루에 새로 배울 몫을 정해 두려면
   * "오늘 처음 만난 것이 몇 개인가" 를 알아야 하는데, lastAt 은 복습해도 바뀌므로
   * 그 수를 셀 수 없다 (D36).
   */
  firstAt: string;
}

export const EASE_START = 2.5;
export const EASE_MIN = 1.3;

/**
 * 하루 몫 (D36).
 *
 * 새로 배우는 것과 다시 보는 것을 가르지 않으면, 첫날에 항목 전부가 밀려 나온다.
 * 간격 반복은 본래 **이미 배운 것을 다시 보는** 방법이라 첫 만남이 따로 있어야 한다.
 * 하루 5장이면 삼백 장을 두 달에 한 바퀴 돈다.
 */
export const NEW_PER_DAY = 5;
export const REVIEW_PER_DAY = 15;

/** 오늘 날짜를 YYYY-MM-DD 로. 인자를 주면 그 시각 기준이다. */
export function today(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** YYYY-MM-DD 에 며칠을 더한다. 서머타임의 영향을 받지 않도록 UTC 로 계산한다. */
export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  const t = Date.UTC(y, m - 1, d) + days * 86400000;
  return new Date(t).toISOString().slice(0, 10);
}

/** 두 날짜의 차이(일). a 가 b 보다 이르면 음수다. */
export function diffDays(a: string, b: string): number {
  const p = (s: string) => {
    const [y, m, d] = s.split('-').map(Number) as [number, number, number];
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((p(a) - p(b)) / 86400000);
}

/** 아직 한 번도 보지 않은 항목의 초기 상태. 오늘 바로 볼 수 있다. */
export function initialState(itemId: string, day: string = today()): ReviewState {
  return { itemId, ease: EASE_START, interval: 0, reps: 0, lapses: 0, due: day, lastAt: '', firstAt: '' };
}

/**
 * 한 번 풀고 난 뒤의 상태를 계산한다. 원래 상태를 바꾸지 않고 새 객체를 돌려준다.
 */
export function review(state: ReviewState, quality: Quality, day: string = today()): ReviewState {
  const passed = quality >= 3;

  let reps = state.reps;
  let lapses = state.lapses;
  let interval: number;

  if (passed) {
    if (reps === 0) interval = 1;
    else if (reps === 1) interval = 6;
    else interval = Math.round(state.interval * state.ease);
    reps += 1;
  } else {
    // 실패하면 처음으로 되돌린다. 다음 날 다시 본다.
    if (reps > 0) lapses += 1;
    reps = 0;
    interval = 1;
  }

  const delta = 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
  const ease = Math.max(EASE_MIN, Number((state.ease + delta).toFixed(4)));

  return {
    itemId: state.itemId,
    ease,
    interval,
    reps,
    lapses,
    due: addDays(day, interval),
    lastAt: day,
    // 처음 만난 날은 한 번 적히면 바뀌지 않는다.
    firstAt: state.firstAt || day,
  };
}

export const isDue = (state: ReviewState, day: string = today()): boolean => diffDays(state.due, day) <= 0;

/**
 * 오늘 볼 항목을 고른다.
 *
 * 순서는 두 단계다. 먼저 **밀린 것부터**(due 가 이른 순), 같은 날짜면 **어려운 것부터**(ease 낮은 순).
 * 한 번도 보지 않은 항목은 lastAt 이 비어 있고 due 가 오늘이므로 자연히 앞쪽에 온다.
 */
export function dueQueue(states: ReviewState[], day: string = today(), limit?: number): ReviewState[] {
  const q = states
    .filter((s) => isDue(s, day))
    .sort((a, b) => diffDays(a.due, b.due) || a.ease - b.ease || a.itemId.localeCompare(b.itemId));
  return limit === undefined ? q : q.slice(0, limit);
}

/** 아직 한 번도 만나지 않은 항목. */
export const isNew = (state: ReviewState): boolean => state.firstAt === '';

export interface DailyPlan {
  /** 오늘 처음 만날 것. 들어온 순서를 그대로 지킨다 — 부르는 쪽이 중요한 순으로 넣는다. */
  learn: ReviewState[];
  /** 오늘 다시 볼 것. 밀린 것부터, 같은 날짜면 어려운 것부터. */
  review: ReviewState[];
  /** 오늘 이미 처음 만난 수. 하루 몫에서 이만큼을 뺀다. */
  learnedToday: number;
  /** 아직 한 번도 만나지 않은 것 전체. 진도 표시에 쓴다. */
  remaining: number;
}

/**
 * 오늘 할 몫을 짠다 (D36).
 *
 * 새로 배울 것과 다시 볼 것을 갈라 준다. 새 것은 하루 몫에서 오늘 이미 배운 만큼을 뺀 수만큼만,
 * 다시 볼 것은 밀린 순서대로 준다. 같은 날 앱을 여러 번 열어도 새 것이 다시 쏟아지지 않는다.
 */
export function dailyPlan(
  states: ReviewState[],
  day: string = today(),
  newPerDay: number = NEW_PER_DAY,
  reviewPerDay: number = REVIEW_PER_DAY,
): DailyPlan {
  const learnedToday = states.filter((s) => s.firstAt === day).length;
  const fresh = states.filter(isNew);
  const learn = fresh.slice(0, Math.max(0, newPerDay - learnedToday));
  const review = states
    .filter((s) => !isNew(s) && isDue(s, day))
    .sort((a, b) => diffDays(a.due, b.due) || a.ease - b.ease || a.itemId.localeCompare(b.itemId))
    .slice(0, reviewPerDay);
  return { learn, review, learnedToday, remaining: fresh.length };
}

export interface Progress {
  /** 한 번이라도 본 항목 수 */
  seen: number;
  /** 오늘 볼 항목 수 */
  due: number;
  /** 간격이 21일 이상으로 벌어진 항목 수. 장기 기억에 자리 잡았다고 보는 기준이다. */
  settled: number;
  total: number;
}

export function progress(states: ReviewState[], total: number, day: string = today()): Progress {
  return {
    seen: states.filter((s) => s.lastAt !== '').length,
    due: states.filter((s) => isDue(s, day)).length,
    settled: states.filter((s) => s.interval >= 21).length,
    total,
  };
}
