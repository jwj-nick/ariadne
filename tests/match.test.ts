/**
 * 캡처 매칭 테스트.
 *
 * 실제 content/ 로 만든 색인을 써서, 진짜 문장에서 흔적을 알아보는지 본다.
 * 오탐이 나면 사용자가 매번 지워야 하므로, 걸리면 안 되는 경우도 함께 확인한다.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { matchCapture, toTraceHits, type MatchTarget } from '../app/lib/capture/match.ts';
import { loadCards, isTrace, isSource } from '../scripts/lib/content.ts';
import { VISIBLE_STATUSES, type Status } from '../scripts/lib/schema.ts';

const cards = loadCards(['traces', 'sources']).filter((c) =>
  VISIBLE_STATUSES.includes(c.data.status as Status),
);

const targets: MatchTarget[] = [
  ...cards.filter(isTrace).map((c) => ({
    id: String(c.data.id),
    type: 'trace' as const,
    name_ko: String(c.data.name_ko),
    name_en: String(c.data.name_en),
    terms: [String(c.data.name_ko), String(c.data.name_en)].map((s) => s.toLowerCase()),
  })),
  ...cards.filter(isSource).map((c) => ({
    id: String(c.data.id),
    type: 'source' as const,
    name_ko: String(c.data.name_ko),
    name_en: String(c.data.name_en),
    terms: [
      String(c.data.name_ko),
      String(c.data.name_en),
      ...(Array.isArray(c.data.aliases) ? (c.data.aliases as string[]) : []),
    ].map((s) => s.toLowerCase()),
    // 빌드가 채우는 역링크를 여기서는 직접 계산한다.
    traceIds: cards
      .filter(isTrace)
      .filter((t) => (Array.isArray(t.data.sources) ? (t.data.sources as string[]) : []).includes(String(c.data.id)))
      .map((t) => String(t.data.id)),
  })),
];

const traceHits = (text: string) => toTraceHits(matchCapture(text, targets), targets);

const ids = (text: string) => matchCapture(text, targets).map((m) => m.id);

test('본문에 흔적 이름이 있으면 알아본다', () => {
  assert.ok(ids('오늘 나이키 운동화를 샀다').includes('trace:nike'));
  assert.ok(ids('그 결정은 판도라의 상자를 연 셈이다').includes('trace:pandoras-box'));
  assert.ok(ids('이 회사의 아킬레스건은 부채다').includes('trace:achilles-heel'));
});

test('영어로 적혀 있어도 알아본다', () => {
  assert.ok(ids('Nike reported record earnings').includes('trace:nike'));
  assert.ok(ids('a classic David and Goliath story').includes('trace:david-vs-goliath'));
});

test('원천 이름만 있어도 알아본다', () => {
  assert.ok(ids('루브르에서 니케 조각을 보았다').includes('source:nike-goddess'));
  assert.ok(ids('제우스와 헤라의 이야기').includes('source:zeus'));
});

test('같은 글에서 둘 다 걸리면 흔적을 앞에 둔다', () => {
  // 흔적이 1차 키다 (D2).
  const first = matchCapture('나이키 로고는 니케의 날개에서 왔다', targets)[0];
  assert.equal(first?.type, 'trace');
});

test('별칭으로도 알아본다', () => {
  assert.ok(ids('로마 신화의 유피테르').includes('source:zeus'));
  assert.ok(ids('빅토리아 여왕').includes('source:nike-goddess'));
});

test('라틴 낱말이 다른 낱말 속에 묻혀 있으면 걸리지 않는다', () => {
  const inner: MatchTarget[] = [
    { id: 'trace:art', type: 'trace', name_ko: '아트', name_en: 'art', terms: ['art', '아트'] },
  ];
  assert.deepEqual(matchCapture('we went to a party', inner), []);
  assert.deepEqual(matchCapture('smart people', inner), []);
  assert.equal(matchCapture('modern art is hard', inner).length, 1);
});

test('짧은 표기는 아예 보지 않는다', () => {
  const tiny: MatchTarget[] = [
    { id: 'trace:x', type: 'trace', name_ko: '이', name_en: 'io', terms: ['이', 'io'] },
  ];
  assert.deepEqual(matchCapture('이것은 io 입니다', tiny), []);
});

test('빈 글이나 아무 관계 없는 글에서는 아무 것도 나오지 않는다', () => {
  assert.deepEqual(ids(''), []);
  assert.deepEqual(ids('   '), []);
  assert.deepEqual(ids('오늘 점심은 김치찌개를 먹었다'), []);
});

test('결과는 개수 제한을 지킨다', () => {
  const many = '나이키 아마존 판도라 아폴로 아르테미스 타이탄 아틀라스 목성 에우로파 나르시시즘 멘토 네메시스';
  assert.ok(matchCapture(many, targets, 3).length <= 3);
});

test('원천 이름만 적어도 그 원천에서 나온 흔적으로 이어진다', () => {
  // 2026-09-08 실제로 보고된 문제다. "니케" 만 적으면 아는 흔적이 없다고 나왔다.
  // 카드가 늘어나면 같은 원천에 흔적이 여럿 붙으므로, 정확한 목록이 아니라 포함 여부를 본다.
  const hits = traceHits('니케');
  assert.ok(hits.length > 0, '원천만 걸렸을 때 흔적으로 이어지지 않습니다');
  assert.ok(hits.some((h) => h.trace_id === 'trace:nike'), '나이키로 이어지지 않습니다');
  assert.ok(hits.every((h) => h.via === 'source'), '모두 원천을 통해 이어져야 합니다');
  assert.ok(hits.every((h) => h.hit === '니케'));
});

test('원천 하나에 흔적이 여럿이면 모두 이어진다', () => {
  // 판도라에서 브랜드와 관용구 두 흔적이 나온다.
  const ids = traceHits('판도라').map((h) => h.trace_id);
  assert.ok(ids.includes('trace:pandora'));
  assert.ok(ids.includes('trace:pandoras-box'));
});

test('흔적이 직접 걸리면 원천을 통한 것보다 앞에 오고 중복되지 않는다', () => {
  const hits = traceHits('나이키 로고는 니케의 날개에서 왔다');
  assert.equal(hits[0]!.trace_id, 'trace:nike');
  assert.equal(hits[0]!.via, 'trace');
  assert.equal(new Set(hits.map((h) => h.trace_id)).size, hits.length, '같은 흔적이 두 번 들어갔습니다');
});

test('별칭으로 걸린 원천도 흔적으로 이어진다', () => {
  assert.ok(traceHits('로마 신화의 유피테르').some((h) => h.trace_id === 'trace:jupiter-planet'));
  assert.ok(traceHits('빅토리아 여왕').some((h) => h.trace_id === 'trace:nike'));
});

test('아무 것도 안 걸리면 빈 목록이다', () => {
  assert.deepEqual(traceHits('오늘 점심은 김치찌개'), []);
});
