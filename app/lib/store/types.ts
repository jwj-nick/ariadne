/**
 * 사용자 상태 저장 계층의 경계.
 *
 * D14 — M0 와 M1 전반은 브라우저 `localStorage` 에 담고, 두 번째 기기가 붙거나
 * 승인 UI 가 필요해지는 M1 후반에 Supabase 구현을 하나 더 만들어 갈아 끼운다.
 * 그때 화면 코드를 고치지 않아도 되도록, 화면은 이 인터페이스만 알고 있어야 한다.
 *
 * 필드 이름은 docs/02-SCHEMA.md 의 Supabase 테이블 정의와 일부러 맞춰 두었다.
 */
import type { ReviewState } from '../learning/sm2';

export type Level = 'kid' | 'adult';

export interface Profile {
  /** 카드와 퀴즈를 어느 눈높이로 볼 것인가. */
  level: Level;
  /** 가족 계정이 생기기 전까지는 기기에만 남는 표시용 이름이다. */
  name: string;
}

export interface QuizLog {
  trace_id: string;
  quiz_type: string;
  level: Level;
  guess: string;
  correct: boolean;
  hint_count: number;
  at: string;
}

/**
 * 삶에서 마주친 것을 그대로 던져 넣은 기록 (D3).
 * 앉아서 공부한 것이 아니라 방송이나 책이나 거리에서 마주친 순간이 학습의 시작이다.
 */
export interface Capture {
  id: string;
  /** 공유되거나 붙여 넣은 글. */
  text: string;
  url: string;
  title: string;
  /** 이 캡처에서 알아본 흔적들. 비어 있으면 아직 못 알아본 것이다. */
  matched_trace_ids: string[];
  /** 어떻게 이어졌는지. 원천 이름을 통해 이어진 경우를 화면에 밝히기 위한 것이다. */
  hits?: Array<{ trace_id: string; via: 'trace' | 'source'; hit: string }>;
  /** open = 아직 처리 안 함, kept = 오늘 복습에 넣음, candidate = 새 흔적 후보로 남김, dismissed = 버림 */
  status: 'open' | 'kept' | 'candidate' | 'dismissed';
  at: string;
}

/**
 * 더 알고 싶은 것을 담아 두는 쪽지 (D28).
 *
 * 앱은 정적이라서 카드를 스스로 만들지 못한다. 그래서 사용자가 관심을 표시하면
 * 그것을 모아 두었다가, 개발 도구에 그대로 붙여 넣을 수 있는 요청서 한 장으로 뽑아 준다.
 * 캡처가 "이미 아는 것을 마주쳤다"는 기록이라면, 이쪽은 "아직 없는 것을 원한다"는 기록이다.
 */
export interface Wish {
  id: string;
  /** 무엇을 알고 싶은가. 사용자가 적었거나 캡처한 글에서 가져온 것이다. */
  text: string;
  /** 어디서 담았는지. 카드에서 담았으면 그 카드를 요청서에 함께 적어 준다. */
  origin: {
    kind: 'trace' | 'source' | 'capture' | 'free';
    /** `trace:nike` 처럼 카드 전체 id. 자유 입력이면 비어 있다. */
    id?: string;
    /** 화면에 보여 줄 이름. */
    label?: string;
  };
  /** 사용자가 덧붙인 말. 비어 있을 수 있다. */
  note: string;
  at: string;
}

export interface Snapshot {
  version: 1;
  exported_at: string;
  profile: Profile;
  reviews: ReviewState[];
  logs: QuizLog[];
  captures?: Capture[];
  wishes?: Wish[];
}

export interface Store {
  getProfile(): Profile;
  setProfile(patch: Partial<Profile>): Profile;

  /** trace id 로 찾는다. 없으면 undefined. */
  getReview(traceId: string): ReviewState | undefined;
  allReviews(): ReviewState[];
  saveReview(state: ReviewState): void;

  appendLog(log: QuizLog): void;
  /** 최근 것부터. */
  recentLogs(limit?: number): QuizLog[];

  addCapture(capture: Capture): void;
  allCaptures(): Capture[];
  updateCapture(id: string, patch: Partial<Capture>): void;

  /** 같은 카드에서 두 번 담으면 뒤엣것이 앞엣것을 덮는다. 목록이 같은 이름으로 늘어나지 않게 한다. */
  addWish(wish: Wish): void;
  allWishes(): Wish[];
  removeWish(id: string): void;
  clearWishes(): void;

  /** 백업 파일로 내보내고 되돌리기. 기기에만 남는 데이터라 사용자가 직접 챙길 수 있어야 한다. */
  exportSnapshot(): Snapshot;
  importSnapshot(raw: unknown): { ok: true } | { ok: false; reason: string };
  reset(): void;
}

export const DEFAULT_PROFILE: Profile = { level: 'adult', name: '' };
