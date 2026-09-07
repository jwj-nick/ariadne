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

export interface Snapshot {
  version: 1;
  exported_at: string;
  profile: Profile;
  reviews: ReviewState[];
  logs: QuizLog[];
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

  /** 백업 파일로 내보내고 되돌리기. 기기에만 남는 데이터라 사용자가 직접 챙길 수 있어야 한다. */
  exportSnapshot(): Snapshot;
  importSnapshot(raw: unknown): { ok: true } | { ok: false; reason: string };
  reset(): void;
}

export const DEFAULT_PROFILE: Profile = { level: 'adult', name: '' };
