/**
 * 저장 계층의 localStorage 구현 (D14).
 *
 * 서버에서도 불릴 수 있으므로 `window` 가 없으면 아무 것도 하지 않고 기본값을 돌려준다.
 * 사생활 보호 모드나 저장 공간 차단 때문에 읽기와 쓰기가 예외를 던질 수 있어서 전부 감싸 두었다.
 */
import type { ReviewState } from '../learning/sm2';
import {
  DEFAULT_PROFILE,
  type Capture,
  type Profile,
  type QuizLog,
  type Snapshot,
  type Store,
  type Wish,
} from './types';

const NS = 'ariadne.v1';
const K = {
  profile: `${NS}.profile`,
  reviews: `${NS}.reviews`,
  logs: `${NS}.logs`,
  captures: `${NS}.captures`,
  wishes: `${NS}.wishes`,
} as const;

/** 로그는 무한정 쌓이지 않게 최근 것만 남긴다. */
const LOG_CAP = 2000;

const hasStorage = (): boolean => {
  try {
    return typeof window !== 'undefined' && !!window.localStorage;
  } catch {
    return false;
  }
};

function read<T>(key: string, fallback: T): T {
  if (!hasStorage()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  if (!hasStorage()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 저장 공간이 막혔거나 가득 찬 경우다. 화면은 계속 돌아가야 하므로 조용히 넘긴다.
  }
}

const isLevel = (v: unknown): v is Profile['level'] => v === 'kid' || v === 'adult';

function sanitizeProfile(v: unknown): Profile {
  const o = (v ?? {}) as Partial<Profile>;
  return {
    level: isLevel(o.level) ? o.level : DEFAULT_PROFILE.level,
    name: typeof o.name === 'string' ? o.name : DEFAULT_PROFILE.name,
  };
}

function isReviewState(v: unknown): v is ReviewState {
  const o = v as Partial<ReviewState> | null;
  return (
    !!o &&
    typeof o.itemId === 'string' &&
    typeof o.ease === 'number' &&
    typeof o.interval === 'number' &&
    typeof o.reps === 'number' &&
    typeof o.lapses === 'number' &&
    typeof o.due === 'string' &&
    typeof o.lastAt === 'string'
  );
}

export const localStore: Store = {
  getProfile() {
    return sanitizeProfile(read<unknown>(K.profile, DEFAULT_PROFILE));
  },

  setProfile(patch) {
    const next = sanitizeProfile({ ...this.getProfile(), ...patch });
    write(K.profile, next);
    return next;
  },

  getReview(traceId) {
    return this.allReviews().find((r) => r.itemId === traceId);
  },

  allReviews() {
    return (
      read<unknown[]>(K.reviews, [])
        .filter(isReviewState)
        // firstAt 은 D36 에서 생겼다. 그 전에 만든 기록은 마지막으로 본 날을 처음 만난 날로 삼는다.
        // 그래야 이미 배운 것이 "새로 배울 것" 으로 되돌아오지 않는다.
        .map((r) => (typeof r.firstAt === 'string' ? r : { ...r, firstAt: r.lastAt }))
    );
  },

  saveReview(state) {
    const all = this.allReviews().filter((r) => r.itemId !== state.itemId);
    all.push(state);
    write(K.reviews, all);
  },

  appendLog(log) {
    const logs = read<QuizLog[]>(K.logs, []);
    logs.push(log);
    write(K.logs, logs.slice(-LOG_CAP));
  },

  recentLogs(limit = 50) {
    return read<QuizLog[]>(K.logs, []).slice(-limit).reverse();
  },

  addCapture(capture) {
    write(K.captures, [...this.allCaptures(), capture].slice(-500));
  },

  allCaptures() {
    return read<Capture[]>(K.captures, []).filter(
      (c) => c && typeof c.id === 'string' && typeof c.text === 'string',
    );
  },

  updateCapture(id, patch) {
    write(
      K.captures,
      this.allCaptures().map((c) => (c.id === id ? { ...c, ...patch } : c)),
    );
  },

  addWish(wish) {
    // 같은 카드에서 다시 담으면 앞엣것을 지우고 새로 넣는다. 메모를 고쳐 담는 경우가 대부분이다.
    const kept = this.allWishes().filter(
      (w) => !(w.origin.id && wish.origin.id && w.origin.id === wish.origin.id),
    );
    write(K.wishes, [...kept, wish].slice(-200));
  },

  allWishes() {
    return read<Wish[]>(K.wishes, []).filter(
      (w) => w && typeof w.id === 'string' && typeof w.text === 'string' && !!w.origin,
    );
  },

  removeWish(id) {
    write(K.wishes, this.allWishes().filter((w) => w.id !== id));
  },

  clearWishes() {
    write(K.wishes, []);
  },

  exportSnapshot() {
    return {
      version: 1,
      exported_at: new Date().toISOString(),
      profile: this.getProfile(),
      reviews: this.allReviews(),
      logs: read<QuizLog[]>(K.logs, []),
      captures: this.allCaptures(),
      wishes: this.allWishes(),
    };
  },

  importSnapshot(raw) {
    const snap = raw as Partial<Snapshot> | null;
    if (!snap || typeof snap !== 'object') return { ok: false, reason: '파일을 읽을 수 없습니다.' };
    if (snap.version !== 1) return { ok: false, reason: `모르는 백업 형식입니다 (version ${String(snap.version)}).` };
    if (!Array.isArray(snap.reviews)) return { ok: false, reason: '복습 기록이 없습니다.' };

    const reviews = snap.reviews.filter(isReviewState);
    if (reviews.length !== snap.reviews.length) {
      return { ok: false, reason: '복습 기록 가운데 형식이 맞지 않는 것이 있습니다.' };
    }
    write(K.profile, sanitizeProfile(snap.profile));
    write(K.reviews, reviews);
    write(K.logs, Array.isArray(snap.logs) ? snap.logs.slice(-LOG_CAP) : []);
    // 캡처는 옛 백업에 없을 수 있으므로 없으면 비운다.
    write(K.captures, Array.isArray(snap.captures) ? snap.captures : []);
    // 요청 쪽지도 마찬가지다. D28 이전에 만든 백업에는 이 칸이 아예 없다.
    write(K.wishes, Array.isArray(snap.wishes) ? snap.wishes : []);
    return { ok: true };
  },

  reset() {
    if (!hasStorage()) return;
    try {
      for (const key of Object.values(K)) window.localStorage.removeItem(key);
    } catch {
      // 지우지 못해도 화면은 계속 돌아가야 한다.
    }
  },
};
