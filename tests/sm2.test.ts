/** SM-2 스케줄러 회귀 테스트. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  EASE_MIN,
  EASE_START,
  addDays,
  diffDays,
  dailyPlan,
  dueQueue,
  initialState,
  isNew,
  isDue,
  progress,
  review,
  today,
  type ReviewState,
} from '../app/lib/learning/sm2.ts';
import { qualityFromAuto, qualityFromSelf } from '../app/lib/learning/grade.ts';

const DAY = '2026-09-08';

test('날짜 계산 — 더하기, 빼기, 달과 해를 넘는 경우', () => {
  assert.equal(addDays('2026-09-08', 1), '2026-09-09');
  assert.equal(addDays('2026-09-30', 1), '2026-10-01');
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(addDays('2026-03-01', -1), '2026-02-28');
  assert.equal(addDays('2028-03-01', -1), '2028-02-29', '윤년');
  assert.equal(diffDays('2026-09-10', '2026-09-08'), 2);
  assert.equal(diffDays('2026-09-08', '2026-09-10'), -2);
  assert.equal(diffDays('2026-09-08', '2026-09-08'), 0);
});

test('today 는 YYYY-MM-DD 를 돌려준다', () => {
  assert.match(today(new Date(2026, 8, 8)), /^2026-09-08$/);
  assert.match(today(), /^\d{4}-\d{2}-\d{2}$/);
});

test('초기 상태는 오늘 바로 볼 수 있다', () => {
  const s = initialState('trace:nike', DAY);
  assert.equal(s.ease, EASE_START);
  assert.equal(s.interval, 0);
  assert.equal(s.reps, 0);
  assert.equal(s.due, DAY);
  assert.equal(s.lastAt, '');
  assert.equal(isDue(s, DAY), true);
});

test('통과하면 간격이 1일 → 6일 → 이전 간격 x 난이도계수 로 벌어진다', () => {
  let s = initialState('a', DAY);
  s = review(s, 5, DAY);
  assert.equal(s.interval, 1);
  assert.equal(s.reps, 1);
  assert.equal(s.due, '2026-09-09');

  s = review(s, 5, '2026-09-09');
  assert.equal(s.interval, 6);
  assert.equal(s.reps, 2);
  assert.equal(s.due, '2026-09-15');

  const before = s.interval;
  const ease = s.ease;
  s = review(s, 5, '2026-09-15');
  assert.equal(s.interval, Math.round(before * ease));
  assert.equal(s.reps, 3);
});

test('품질 5 는 난이도계수를 올리고 3 은 내린다', () => {
  const up = review(initialState('a', DAY), 5, DAY);
  assert.ok(up.ease > EASE_START, `5 를 받았는데 ease 가 ${up.ease} 입니다`);

  const down = review(initialState('b', DAY), 3, DAY);
  assert.ok(down.ease < EASE_START, `3 을 받았는데 ease 가 ${down.ease} 입니다`);
});

test('난이도계수는 1.3 아래로 내려가지 않는다', () => {
  let s = initialState('a', DAY);
  for (let i = 0; i < 20; i++) s = review(s, 3, DAY);
  assert.equal(s.ease, EASE_MIN);
});

test('실패하면 반복이 0 으로 돌아가고 다음 날 다시 본다', () => {
  let s = initialState('a', DAY);
  s = review(s, 5, DAY);
  s = review(s, 5, '2026-09-09');
  assert.equal(s.reps, 2);

  s = review(s, 1, '2026-09-15');
  assert.equal(s.reps, 0);
  assert.equal(s.interval, 1);
  assert.equal(s.lapses, 1, '통과했던 항목이 실패하면 lapses 가 오른다');
  assert.equal(s.due, '2026-09-16');
});

test('한 번도 통과한 적 없는 항목이 실패해도 lapses 는 오르지 않는다', () => {
  const s = review(initialState('a', DAY), 1, DAY);
  assert.equal(s.lapses, 0);
  assert.equal(s.reps, 0);
});

test('원래 상태를 바꾸지 않는다', () => {
  const s = initialState('a', DAY);
  const copy = { ...s };
  review(s, 5, DAY);
  assert.deepEqual(s, copy);
});

test('dueQueue 는 밀린 것부터, 같은 날짜면 어려운 것부터 준다', () => {
  const states: ReviewState[] = [
    { itemId: 'easy', ease: 2.8, interval: 3, reps: 2, lapses: 0, due: '2026-09-08', lastAt: '2026-09-05', firstAt: '2026-09-05' },
    { itemId: 'hard', ease: 1.4, interval: 3, reps: 2, lapses: 3, due: '2026-09-08', lastAt: '2026-09-05', firstAt: '2026-09-05' },
    { itemId: 'overdue', ease: 2.5, interval: 3, reps: 2, lapses: 0, due: '2026-09-01', lastAt: '2026-08-29', firstAt: '2026-08-29' },
    { itemId: 'later', ease: 2.5, interval: 3, reps: 2, lapses: 0, due: '2026-09-20', lastAt: '2026-09-17', firstAt: '2026-09-17' },
  ];
  assert.deepEqual(
    dueQueue(states, DAY).map((s) => s.itemId),
    ['overdue', 'hard', 'easy'],
  );
  assert.deepEqual(dueQueue(states, DAY, 2).map((s) => s.itemId), ['overdue', 'hard']);
});

test('progress 는 본 것, 오늘 볼 것, 자리 잡은 것을 센다', () => {
  const states: ReviewState[] = [
    { itemId: 'a', ease: 2.5, interval: 30, reps: 5, lapses: 0, due: '2026-10-01', lastAt: '2026-09-01', firstAt: '2026-09-01' },
    { itemId: 'b', ease: 2.5, interval: 6, reps: 2, lapses: 0, due: '2026-09-08', lastAt: '2026-09-02', firstAt: '2026-09-02' },
    { itemId: 'c', ease: 2.5, interval: 0, reps: 0, lapses: 0, due: '2026-09-08', lastAt: '', firstAt: '' },
  ];
  const p = progress(states, 23, DAY);
  assert.deepEqual(p, { seen: 2, due: 2, settled: 1, total: 23 });
});

test('자동 채점 품질 — 힌트를 볼수록 깎이고, 오답은 1', () => {
  assert.equal(qualityFromAuto(true, 0), 5);
  assert.equal(qualityFromAuto(true, 1), 4);
  assert.equal(qualityFromAuto(true, 2), 3);
  assert.equal(qualityFromAuto(true, 3), 3, '힌트를 셋 다 봐도 3 아래로는 안 내린다');
  assert.equal(qualityFromAuto(false, 0), 1);
  assert.equal(qualityFromAuto(false, 3), 1);
});

test('자기평가 품질', () => {
  assert.equal(qualityFromSelf('exact', 0), 5);
  assert.equal(qualityFromSelf('exact', 2), 3);
  assert.equal(qualityFromSelf('close', 0), 3);
  assert.equal(qualityFromSelf('none', 0), 1);
  assert.equal(qualityFromSelf('none', 3), 1, '몰랐으면 힌트 수와 무관하게 1');
});

test('힌트 없이 계속 맞히면 한 달 안에 복습 간격이 3주를 넘는다', () => {
  // 미션의 성공 조건(3개월 뒤 즉답)이 실제로 도달 가능한 일정인지 확인한다.
  // 재는 것은 마지막으로 문제를 푼 날이다. 그 뒤의 예정일이 아니다.
  let s = initialState('a', DAY);
  let day = DAY;
  let lastStudied = DAY;
  let rounds = 0;
  while (s.interval < 21 && rounds < 10) {
    lastStudied = day;
    s = review(s, 5, day);
    day = s.due;
    rounds += 1;
  }
  assert.ok(rounds <= 4, `장기 기억 구간까지 ${rounds}번 걸렸습니다`);
  assert.ok(
    diffDays(lastStudied, DAY) <= 30,
    `마지막 복습까지 ${diffDays(lastStudied, DAY)}일 걸렸습니다`,
  );
  // 3개월(약 90일) 안에 200장을 훑으려면 항목당 네 번이면 충분하다는 뜻이다.
  assert.ok(s.interval >= 21);
});

test('dailyPlan 은 새로 배울 것과 다시 볼 것을 가른다', () => {
  const states: ReviewState[] = [
    // 아직 만나지 않은 것 넷
    initialState('n1', DAY),
    initialState('n2', DAY),
    initialState('n3', DAY),
    initialState('n4', DAY),
    // 오늘 볼 차례인 것 둘
    { itemId: 'r1', ease: 2.5, interval: 3, reps: 2, lapses: 0, due: '2026-09-01', lastAt: '2026-08-29', firstAt: '2026-08-01' },
    { itemId: 'r2', ease: 1.4, interval: 3, reps: 2, lapses: 3, due: '2026-09-08', lastAt: '2026-09-05', firstAt: '2026-08-01' },
    // 아직 차례가 아닌 것
    { itemId: 'later', ease: 2.5, interval: 30, reps: 5, lapses: 0, due: '2026-10-01', lastAt: '2026-09-01', firstAt: '2026-08-01' },
  ];

  const plan = dailyPlan(states, DAY, 3, 10);
  assert.deepEqual(plan.learn.map((s) => s.itemId), ['n1', 'n2', 'n3']);
  // 밀린 것부터 준다.
  assert.deepEqual(plan.review.map((s) => s.itemId), ['r1', 'r2']);
  assert.equal(plan.remaining, 4);
  assert.equal(plan.learnedToday, 0);
});

test('오늘 이미 배운 만큼 새 몫에서 뺀다', () => {
  const states: ReviewState[] = [
    { itemId: 'done1', ease: 2.5, interval: 1, reps: 1, lapses: 0, due: '2026-09-09', lastAt: DAY, firstAt: DAY },
    { itemId: 'done2', ease: 2.5, interval: 1, reps: 1, lapses: 0, due: '2026-09-09', lastAt: DAY, firstAt: DAY },
    initialState('n1', DAY),
    initialState('n2', DAY),
    initialState('n3', DAY),
  ];
  // 하루 몫이 3인데 오늘 둘을 이미 만났으므로 하나만 더 준다.
  assert.deepEqual(dailyPlan(states, DAY, 3, 10).learn.map((s) => s.itemId), ['n1']);
  // 몫을 다 채웠으면 하나도 주지 않는다.
  assert.equal(dailyPlan(states, DAY, 2, 10).learn.length, 0);
});

test('처음 만난 날은 한 번 적히면 바뀌지 않는다', () => {
  const first = review(initialState('a', DAY), 5, DAY);
  assert.equal(first.firstAt, DAY);
  assert.equal(isNew(first), false);
  const second = review(first, 5, '2026-09-20');
  assert.equal(second.firstAt, DAY, '처음 만난 날은 그대로여야 한다');
  assert.equal(second.lastAt, '2026-09-20');
});

test('한 번도 만나지 않은 것만 새 것이다', () => {
  assert.equal(isNew(initialState('a', DAY)), true);
  assert.equal(isNew(review(initialState('a', DAY), 0, DAY)), false, '틀렸어도 만난 것은 만난 것이다');
});
