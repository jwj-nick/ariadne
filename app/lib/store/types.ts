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

export interface Snapshot {
  version: 1;
  exported_at: string;
  profile: Profile;
  reviews: ReviewState[];
  logs: QuizLog[];
  captures?: Capture[];
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

  /** 백업 파일로 내보내고 되돌리기. 기기에만 남는 데이터라 사용자가 직접 챙길 수 있어야 한다. */
  exportSnapshot(): Snapshot;
  importSnapshot(raw: unknown): { ok: true } | { ok: false; reason: string };
  reset(): void;
}

export const DEFAULT_PROFILE: Profile = { level: 'adult', name: '' };
