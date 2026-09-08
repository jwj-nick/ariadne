/**
 * 지금 쓰는 저장 구현을 고르는 자리.
 *
 * M1 후반에 Supabase 구현이 생기면 여기서만 갈아 끼운다 (D14).
 * 화면 코드는 `store` 와 `types.ts` 만 알고 있어야 한다.
 */
export { localStore as store } from './local';
export type { Capture, Level, Profile, QuizLog, Snapshot, Store, Wish } from './types';
export { DEFAULT_PROFILE } from './types';
