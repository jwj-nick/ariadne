/**
 * 퀴즈 생성기 회귀 테스트.
 *
 * 실제 content/ 를 읽어서 검사한다. 생성 규칙만이 아니라 **지금 있는 카드로 만든 문제들이
 * 규칙을 지키는지**까지 보기 위해서다. 카드를 고치다가 힌트에 정답이 새어 들어가면 여기서 걸린다.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCards, isTrace } from '../scripts/lib/content.ts';
import { buildQuiz, normalize } from '../scripts/lib/quiz.ts';
import { VISIBLE_STATUSES, type Status } from '../scripts/lib/schema.ts';

const cards = loadCards(['traces', 'sources']).filter((c) => VISIBLE_STATUSES.includes(c.data.status as Status));
const { items, discarded } = buildQuiz(cards);
const traces = cards.filter(isTrace);

test('모든 흔적에 문제가 하나 이상 있다', () => {
  for (const t of traces) {
    const mine = items.filter((q) => q.trace_id === String(t.data.id));
    assert.ok(mine.length > 0, `${String(t.data.id)} 에 문제가 없습니다`);
  }
});

test('모든 흔적에 어른용과 아이용이 각각 있다', () => {
  for (const t of traces) {
    const mine = items.filter((q) => q.trace_id === String(t.data.id));
    assert.ok(mine.some((q) => q.level === 'adult'), `${String(t.data.id)} 어른용 없음`);
    assert.ok(mine.some((q) => q.level === 'kid'), `${String(t.data.id)} 아이용 없음`);
  }
});

test('자동 채점 문제는 문제와 힌트 어디에도 정답을 노출하지 않는다', () => {
  for (const q of items) {
    if (q.grading !== 'auto') continue;
    // 이유 말하기의 아이용은 정답이 문장 전체이고 선택지에서 고르는 방식이라 이 검사에서 뺀다.
    if (q.type === 'explain_why') continue;
    for (const text of [q.prompt, ...q.hints]) {
      for (const a of q.accept) {
        const n = normalize(a);
        if (n.length < 2) continue;
        assert.ok(
          !normalize(text).includes(n),
          `${q.id} 의 "${text}" 에 정답 "${a}" 가 들어 있습니다`,
        );
      }
    }
  }
});

test('힌트는 정확히 3개이고 빈 것이 없다', () => {
  for (const q of items) {
    assert.equal(q.hints.length, 3, `${q.id} 의 힌트가 3개가 아닙니다`);
    for (const h of q.hints) assert.ok(h.trim().length > 0, `${q.id} 에 빈 힌트가 있습니다`);
  }
});

test('선택지는 3개이고 정답을 정확히 하나 담고 있다', () => {
  for (const q of items) {
    if (!q.choices) continue;
    assert.equal(q.choices.length, 3, `${q.id} 의 선택지가 3개가 아닙니다`);
    assert.equal(new Set(q.choices.map(normalize)).size, 3, `${q.id} 의 선택지에 중복이 있습니다`);
    const hits = q.choices.filter((c) => normalize(c) === normalize(q.answer)).length;
    assert.equal(hits, 1, `${q.id} 의 선택지에 정답이 ${hits}개 들어 있습니다`);
  }
});

test('자동 채점 문제의 정답 표기는 서로 다르고 2개 이상이다', () => {
  for (const q of items) {
    if (q.grading !== 'auto' || q.choices) continue;
    assert.ok(q.accept.length >= 2, `${q.id} 의 accept 가 ${q.accept.length}개뿐입니다`);
    assert.equal(new Set(q.accept.map(normalize)).size, q.accept.length, `${q.id} 의 accept 에 중복이 있습니다`);
    assert.ok(
      q.accept.some((a) => normalize(a) === normalize(q.answer)),
      `${q.id} 의 accept 에 정답 자신이 없습니다`,
    );
  }
});

test('자기평가 문제는 어른용 이유 말하기뿐이다', () => {
  for (const q of items.filter((x) => x.grading === 'self')) {
    assert.equal(q.type, 'explain_why', `${q.id} 는 자기평가인데 이유 말하기가 아닙니다`);
    assert.equal(q.level, 'adult', `${q.id} 는 자기평가인데 어른용이 아닙니다`);
    assert.ok(q.answer.trim().length > 0, `${q.id} 의 답이 비어 있습니다`);
  }
});

test('id 가 서로 겹치지 않는다', () => {
  const ids = items.map((q) => q.id);
  assert.equal(new Set(ids).size, ids.length, 'id 가 중복됩니다');
});

test('문제를 만들지 못한 사유는 이름 겹침뿐이다', () => {
  // 이름 겹침(예: 판도라의 상자 -> 판도라)은 설계상 정상이다.
  // 그 밖의 사유가 나오면 카드 쪽에 손볼 것이 있다는 뜻이다.
  const unexpected = discarded.filter((d) => !d.reason.includes('그대로 들어 있습니다'));
  assert.deepEqual(unexpected, [], '예상 밖의 사유로 문제가 빠졌습니다');
});

test('빌드를 두 번 해도 같은 결과가 나온다', () => {
  const again = buildQuiz(cards);
  assert.deepEqual(again.items, items, '생성 결과가 빌드마다 달라집니다');
});

// ── 새 갈래 (D45) ────────────────────────────────────────────────────
test('거꾸로 묻기의 답은 언제나 흔적이다', () => {
  const names = new Set(traces.map((t) => normalize(String(t.data.name_ko))));
  const rev = items.filter((i) => i.type === 'source_to_trace');
  assert.ok(rev.length > 0, '거꾸로 묻기가 하나도 없습니다');
  for (const it of rev) {
    assert.ok(
      names.has(normalize(it.answer)),
      `${it.id} 의 답 "${it.answer}" 이 흔적 이름이 아닙니다. 원천에서 원천으로 물으면 안 됩니다.`,
    );
  }
});

test('거꾸로 묻기에는 그림이 걸린다', () => {
  const rev = items.filter((i) => i.type === 'source_to_trace');
  const withImage = rev.filter((i) => i.image_file);
  assert.ok(
    withImage.length / rev.length > 0.9,
    `그림이 걸린 것이 ${withImage.length}/${rev.length} 뿐입니다`,
  );
});

test('하나만 다른 것은 셋이 모두 같은 갈래다', () => {
  const categoryOf = new Map(
    traces.map((t) => [normalize(String(t.data.name_ko)), String(t.data.category)]),
  );
  const odd = items.filter((i) => i.type === 'odd_one_out');
  assert.ok(odd.length > 0, '하나만 다른 것이 하나도 없습니다');
  for (const it of odd) {
    const cats = new Set((it.choices ?? []).map((c) => categoryOf.get(normalize(c))));
    assert.equal(
      cats.size,
      1,
      `${it.id} 의 보기가 여러 갈래에 걸쳐 있습니다. 갈래가 다르면 답이 그냥 보입니다.`,
    );
  }
});

test('하나만 다른 것의 답은 나머지 둘과 뿌리가 다르다', () => {
  const sourcesOf = new Map(
    traces.map((t) => [
      normalize(String(t.data.name_ko)),
      new Set(Array.isArray(t.data.sources) ? (t.data.sources as string[]) : []),
    ]),
  );
  for (const it of items.filter((i) => i.type === 'odd_one_out')) {
    const answerSources = sourcesOf.get(normalize(it.answer)) ?? new Set();
    assert.ok(
      !answerSources.has(it.source_id),
      `${it.id} 의 답 "${it.answer}" 이 나머지 둘과 같은 뿌리입니다`,
    );
    for (const c of (it.choices ?? []).filter((x) => normalize(x) !== normalize(it.answer))) {
      assert.ok(
        (sourcesOf.get(normalize(c)) ?? new Set()).has(it.source_id),
        `${it.id} 의 보기 "${c}" 가 그 뿌리에서 나오지 않았습니다`,
      );
    }
  }
});
