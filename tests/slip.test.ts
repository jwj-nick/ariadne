/**
 * 카드 요청서 테스트 (D28).
 *
 * 이 글은 사람이 아니라 개발 도구가 받는다. 그래서 확인할 것이 두 가지다.
 * 하나는 요청한 내용이 빠짐없이 실렸는가이고,
 * 다른 하나는 받는 쪽이 어디에 무엇을 써야 하는지 알 수 있는가이다.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

const { buildSlip, slipFileName } = await import('../app/lib/request/slip.ts');

const TARGETS = [
  {
    id: 'trace:nike',
    type: 'trace' as const,
    name_ko: '나이키',
    name_en: 'Nike',
    terms: ['나이키', 'nike'],
  },
  {
    id: 'source:nike-goddess',
    type: 'source' as const,
    name_ko: '니케',
    name_en: 'Nike',
    terms: ['니케', 'nike', '빅토리아'],
    traceIds: ['trace:nike'],
  },
];

const BASE = {
  targets: TARGETS,
  categories: ['brand', 'idiom'],
  domains: ['greco-roman-myth', 'history'],
  date: '2026-09-09',
};

const wish = (over: Record<string, unknown> = {}) => ({
  id: 'wish-1',
  text: '판도라의 상자',
  origin: { kind: 'trace' as const, id: 'trace:pandora-box', label: '판도라의 상자' },
  note: '',
  at: '2026-09-09T00:00:00.000Z',
  ...over,
});

test('담은 것이 없으면 그렇게 밝힌다', () => {
  const slip = buildSlip({ ...BASE, wishes: [] });
  assert.match(slip, /담아 둔 것이 없습니다/);
});

test('요청한 것과 메모가 모두 실린다', () => {
  const slip = buildSlip({
    ...BASE,
    wishes: [wish({ note: '상자가 아니라 항아리였다는 이야기' })],
  });
  assert.match(slip, /판도라의 상자/);
  assert.match(slip, /상자가 아니라 항아리였다는 이야기/);
  assert.match(slip, /trace:pandora-box/);
  assert.match(slip, /요청 1건/);
});

test('받는 쪽이 어디에 무엇을 쓰는지 알 수 있다', () => {
  const slip = buildSlip({ ...BASE, wishes: [wish()] });
  assert.match(slip, /content\/traces/);
  assert.match(slip, /docs\/02-SCHEMA\.md/);
  assert.match(slip, /npm run check/);
  // 어휘를 실어 보내지 않으면 없는 카테고리를 지어낸다.
  assert.match(slip, /`brand`/);
  assert.match(slip, /`greco-roman-myth`/);
});

test('이미 있는 카드와 겹치면 알려 준다', () => {
  const slip = buildSlip({
    ...BASE,
    wishes: [wish({ text: '나이키 로고의 유래', origin: { kind: 'free' as const } })],
  });
  assert.match(slip, /관련되어 보이는 것/);
  assert.match(slip, /trace:nike/);
});

test('담은 카드 자신은 관련 카드로 보여 주지 않는다', () => {
  const slip = buildSlip({
    ...BASE,
    wishes: [
      wish({
        text: '나이키',
        note: '니케와 어떻게 이어지는지',
        origin: { kind: 'trace' as const, id: 'trace:nike', label: '나이키' },
      }),
    ],
  });
  // 원천은 이어 주되, 자기 자신을 "관련 카드"라고 되풀이하지는 않는다.
  const related = slip.split('\n').find((l) => l.includes('관련되어 보이는 것')) ?? '';
  assert.ok(!related.includes('`trace:nike`'), related);
  assert.match(related, /source:nike-goddess/);
});

test('진도와 자주 틀린 것을 참고로 붙인다', () => {
  const slip = buildSlip({
    ...BASE,
    wishes: [wish()],
    progress: { seen: 12, settled: 3, total: 300 },
    weak: ['판도라의 상자', '오디세이'],
  });
  assert.match(slip, /300개 가운데 12개/);
  assert.match(slip, /자주 틀린 것: 판도라의 상자, 오디세이/);
});

test('빈 줄이 세 줄 넘게 이어지지 않는다', () => {
  const slip = buildSlip({ ...BASE, wishes: [wish(), wish({ id: 'wish-2', text: '두 번째' })] });
  assert.ok(!slip.includes('\n\n\n'), '빈 줄이 겹쳤습니다.');
  assert.ok(slip.endsWith('\n'));
});

test('파일 이름에 날짜가 들어간다', () => {
  assert.equal(slipFileName('2026-09-09'), 'ariadne-요청서-2026-09-09.md');
});
