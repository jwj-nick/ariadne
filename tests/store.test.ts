/**
 * 저장 계층 테스트.
 *
 * 브라우저가 없는 곳에서 돌리므로 localStorage 를 흉내 낸다.
 * 백업 되돌리기는 사용자가 고른 파일을 그대로 받아들이는 자리라, 형식 검사가 특히 중요하다.
 */
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

class MemoryStorage {
  private map = new Map<string, string>();
  getItem(k: string) {
    return this.map.has(k) ? this.map.get(k)! : null;
  }
  setItem(k: string, v: string) {
    this.map.set(k, String(v));
  }
  removeItem(k: string) {
    this.map.delete(k);
  }
  clear() {
    this.map.clear();
  }
}

// import 보다 먼저 심어 두어야 모듈 안의 typeof window 검사를 통과한다.
(globalThis as unknown as { window: unknown }).window = { localStorage: new MemoryStorage() };

const { store } = await import('../app/lib/store/index.ts');
const { initialState, review } = await import('../app/lib/learning/sm2.ts');

beforeEach(() => store.reset());

test('처음에는 어른 눈높이이고 기록이 비어 있다', () => {
  assert.deepEqual(store.getProfile(), { level: 'adult', name: '' });
  assert.deepEqual(store.allReviews(), []);
  assert.deepEqual(store.recentLogs(), []);
});

test('프로필을 부분만 고칠 수 있다', () => {
  store.setProfile({ level: 'kid' });
  assert.equal(store.getProfile().level, 'kid');
  assert.equal(store.getProfile().name, '');
  store.setProfile({ name: '세은' });
  assert.deepEqual(store.getProfile(), { level: 'kid', name: '세은' });
});

test('망가진 프로필 값은 기본값으로 되돌린다', () => {
  (globalThis as unknown as { window: { localStorage: MemoryStorage } }).window.localStorage.setItem(
    'ariadne.v1.profile',
    JSON.stringify({ level: 'grown-up', name: 42 }),
  );
  assert.deepEqual(store.getProfile(), { level: 'adult', name: '' });
});

test('복습 상태는 항목마다 하나만 남는다', () => {
  const first = review(initialState('trace:nike', '2026-09-08'), 5, '2026-09-08');
  store.saveReview(first);
  assert.equal(store.allReviews().length, 1);

  const second = review(first, 5, '2026-09-09');
  store.saveReview(second);
  assert.equal(store.allReviews().length, 1, '같은 항목을 두 번 저장하면 덮어써야 한다');
  assert.equal(store.getReview('trace:nike')?.reps, 2);
});

test('로그는 최근 것부터 돌려준다', () => {
  for (const id of ['a', 'b', 'c']) {
    store.appendLog({
      trace_id: id,
      quiz_type: 'explain_why',
      level: 'adult',
      guess: '',
      correct: true,
      hint_count: 0,
      at: new Date().toISOString(),
    });
  }
  assert.deepEqual(store.recentLogs(2).map((l) => l.trace_id), ['c', 'b']);
});

test('내보낸 백업을 그대로 되돌릴 수 있다', () => {
  store.setProfile({ level: 'kid', name: '세은' });
  store.saveReview(review(initialState('trace:nike', '2026-09-08'), 5, '2026-09-08'));
  const snap = store.exportSnapshot();

  store.reset();
  assert.deepEqual(store.allReviews(), []);

  const result = store.importSnapshot(snap);
  assert.deepEqual(result, { ok: true });
  assert.equal(store.getProfile().name, '세은');
  assert.equal(store.allReviews().length, 1);
  assert.equal(store.getReview('trace:nike')?.due, '2026-09-09');
});

test('모르는 형식이나 망가진 파일은 되돌리지 않는다', () => {
  store.saveReview(initialState('trace:nike', '2026-09-08'));

  for (const bad of [
    null,
    'not an object',
    { version: 2, reviews: [] },
    { version: 1 },
    { version: 1, reviews: [{ itemId: 'x' }] },
  ]) {
    const r = store.importSnapshot(bad);
    assert.equal(r.ok, false, `${JSON.stringify(bad)} 를 받아들이면 안 됩니다`);
  }
  // 실패했어도 원래 기록이 지워지지 않아야 한다.
  assert.equal(store.allReviews().length, 1);
});

test('reset 은 프로필과 기록을 모두 지운다', () => {
  store.setProfile({ level: 'kid', name: '아들' });
  store.saveReview(initialState('trace:nike', '2026-09-08'));
  store.appendLog({
    trace_id: 'trace:nike',
    quiz_type: 'explain_why',
    level: 'kid',
    guess: '',
    correct: false,
    hint_count: 3,
    at: new Date().toISOString(),
  });

  store.reset();
  assert.deepEqual(store.getProfile(), { level: 'adult', name: '' });
  assert.deepEqual(store.allReviews(), []);
  assert.deepEqual(store.recentLogs(), []);
});

test('요청 쪽지를 담고 빼고 비운다', () => {
  store.addWish({
    id: 'w1',
    text: '판도라의 상자',
    origin: { kind: 'trace', id: 'trace:pandora-box', label: '판도라의 상자' },
    note: '항아리 이야기',
    at: '2026-09-09T00:00:00.000Z',
  });
  assert.equal(store.allWishes().length, 1);

  // 같은 카드에서 다시 담으면 앞엣것을 덮는다. 목록이 같은 이름으로 늘어나면 안 된다.
  store.addWish({
    id: 'w2',
    text: '판도라의 상자',
    origin: { kind: 'trace', id: 'trace:pandora-box', label: '판도라의 상자' },
    note: '고쳐 적은 메모',
    at: '2026-09-09T01:00:00.000Z',
  });
  assert.equal(store.allWishes().length, 1);
  assert.equal(store.allWishes()[0]!.note, '고쳐 적은 메모');

  // 자유 입력은 카드 id 가 없으므로 덮지 않고 쌓인다.
  store.addWish({ id: 'w3', text: '자유', origin: { kind: 'free' }, note: '', at: '2026-09-09T02:00:00.000Z' });
  store.addWish({ id: 'w4', text: '자유 둘', origin: { kind: 'free' }, note: '', at: '2026-09-09T03:00:00.000Z' });
  assert.equal(store.allWishes().length, 3);

  store.removeWish('w3');
  assert.equal(store.allWishes().length, 2);
  store.clearWishes();
  assert.equal(store.allWishes().length, 0);
});

test('요청 쪽지도 백업에 함께 실린다', () => {
  store.clearWishes();
  store.addWish({ id: 'w9', text: '오디세이', origin: { kind: 'free' }, note: '', at: '2026-09-09T00:00:00.000Z' });
  const snap = store.exportSnapshot();
  assert.equal(snap.wishes?.length, 1);

  store.clearWishes();
  assert.equal(store.allWishes().length, 0);
  assert.deepEqual(store.importSnapshot(snap), { ok: true });
  assert.equal(store.allWishes().length, 1);
});

test('요청 쪽지가 없던 옛 백업도 되돌릴 수 있다', () => {
  store.addWish({ id: 'w10', text: '남아 있으면 안 된다', origin: { kind: 'free' }, note: '', at: '2026-09-09T00:00:00.000Z' });
  const old = { version: 1, exported_at: '2026-09-01T00:00:00.000Z', profile: { level: 'adult', name: '' }, reviews: [], logs: [] };
  assert.deepEqual(store.importSnapshot(old), { ok: true });
  assert.equal(store.allWishes().length, 0);
});
