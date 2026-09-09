/**
 * scripts/lib/checks.ts 회귀 테스트.
 *
 *   npm test
 *
 * 각 검사 코드마다 "걸려야 하는 입력"과 "걸리면 안 되는 입력"을 짝으로 둔다.
 * 검사기를 고칠 때 이 파일이 통과하는지 반드시 확인한다.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runChecks } from '../scripts/lib/checks.ts';
import type { Card } from '../scripts/lib/content.ts';

type Partial2 = Record<string, unknown>;

/** 위반이 없는 최소 trace 카드 */
function trace(overrides: Partial2 = {}, body?: string): Card {
  const data = {
    id: 'trace:nike',
    type: 'trace',
    category: 'brand',
    group: 'tech',
    name_ko: '나이키',
    name_en: 'Nike',
    sources: ['source:nike-goddess'],
    why: '승리의 여신에서 이름을 땄다.',
    frequency: 5,
    status: 'reviewed',
    ...overrides,
  };
  const text = body ?? '## 한 줄\n정의\n\n## 어디서 만나나\n접점\n\n## 왜 이 이름인가\n이유\n';
  return {
    path: `content/traces/${String(data.category)}/${String(data.id).split(':')[1]}.md`,
    slug: String(data.id).split(':').slice(1).join(':'),
    bucket: 'traces',
    folder: String(data.category),
    data: data as Card['data'],
    body: text,
    headings: headingsOf(text),
    raw: text,
  };
}

/** 위반이 없는 최소 source 카드 */
function source(overrides: Partial2 = {}, body?: string): Card {
  const data = {
    id: 'source:nike-goddess',
    type: 'source',
    domain: 'greco-roman-myth',
    group: 'olympian',
    name_ko: '니케',
    name_en: 'Nike',
    level_kid: '승리의 여신.',
    level_adult: '그리스 신화의 승리의 여신.',
    status: 'reviewed',
    ...overrides,
  };
  const text = body ?? '## 한 줄 정의\n정의\n\n## 3문장 스토리\n이야기\n\n## 왜 알아야 하나\n접점\n\n## 연결\n관계\n';
  return {
    path: `content/sources/${String(data.domain)}/${String(data.id).split(':')[1]}.md`,
    slug: String(data.id).split(':').slice(1).join(':'),
    bucket: 'sources',
    folder: String(data.domain),
    data: data as Card['data'],
    body: text,
    headings: headingsOf(text),
    raw: text,
  };
}

function headingsOf(body: string): string[] {
  return body
    .split(/\r?\n/)
    .filter((l) => /^##\s+/.test(l) && !l.startsWith('###'))
    .map((l) => l.replace(/^##\s+/, '').replace(/^\d+\.\s*/, '').trim());
}

const codes = (cards: Card[]) => runChecks(cards).map((f) => f.code);

test('위반이 없는 카드 쌍은 아무 것도 걸리지 않는다', () => {
  assert.deepEqual(codes([trace(), source()]), []);
});

test('E01 — 필수 필드 누락', () => {
  assert.ok(codes([trace({ name_ko: '' }), source()]).includes('E01'));
  assert.ok(codes([trace(), source({ status: undefined })]).includes('E01'));
});

test('E02 — sources 가 비었거나 없는 id 를 가리킴', () => {
  assert.ok(codes([trace({ sources: [] }), source()]).includes('E02'));
  assert.ok(codes([trace({ sources: ['source:없는것'] }), source()]).includes('E02'));
});

test('E03 — why 가 비었거나 TODO', () => {
  assert.ok(codes([trace({ why: '' }), source()]).includes('E03'));
  assert.ok(codes([trace({ why: 'TODO — 어원 근거 확인 필요' }), source()]).includes('E03'));
});

test('E04 — source 의 kid/adult 요약 누락', () => {
  assert.ok(codes([trace(), source({ level_kid: '' })]).includes('E04'));
  assert.ok(codes([trace(), source({ level_adult: undefined })]).includes('E04'));
});

test('E05 — 손으로 쓴 역링크', () => {
  assert.ok(codes([trace(), source({ traces: ['trace:nike'] })]).includes('E05'));
  assert.ok(!codes([trace(), source({ traces: [] })]).includes('E05'));
});

test('E06 — id 와 파일명 불일치', () => {
  const c = trace();
  c.slug = 'nike-shoes';
  assert.ok(codes([c, source()]).includes('E06'));
});

test('E07 — 중복 id', () => {
  const a = source();
  const b = source();
  b.path = 'content/sources/greco-roman-myth/nike-goddess-copy.md';
  assert.ok(codes([trace(), a, b]).includes('E07'));
});

test('E08 — 허용 목록 밖 category / domain, 그리고 폴더 불일치', () => {
  assert.ok(codes([trace({ category: 'food' }), source()]).includes('E08'));
  assert.ok(codes([trace(), source({ domain: 'roman-myth' })]).includes('E08'));
  const mismatched = trace();
  mismatched.folder = 'idiom'; // category 는 brand 인데 폴더가 다르다
  assert.ok(codes([mismatched, source()]).includes('E08'));
});

test('W10 — 하위 묶음', () => {
  // 묶음이 없으면 둘러보기 화면에서 사실상 찾을 수 없게 된다.
  assert.ok(codes([trace({ group: undefined }), source()]).includes('W10'));
  // 다른 갈래의 묶음 이름을 적은 경우다. brand 에 olympian 은 없다.
  assert.ok(codes([trace({ group: 'olympian' }), source()]).includes('W10'));
  // 같은 이름이라도 갈래가 맞으면 통과한다. life 는 brand 에도 science-astro 에도 있다.
  assert.ok(!codes([trace({ group: 'life' }), source()]).includes('W10'));
});

test('E09 — status 어휘 밖', () => {
  assert.ok(codes([trace({ status: 'draft' }), source()]).includes('E09'));
});

test('W01 — 고아 source', () => {
  // 들어오는 trace 가 없는 source 하나만 두면 경고가 나야 한다.
  assert.ok(codes([source()]).includes('W01'));
  // trace 가 붙으면 경고가 사라진다.
  assert.ok(!codes([trace(), source()]).includes('W01'));
});

test('W01 — relations 참조 3개 이상이면 허브로 인정한다', () => {
  const hub = source({ id: 'source:zeus', name_en: 'Zeus', name_ko: '제우스' });
  hub.slug = 'zeus';
  const refs = ['a', 'b', 'c'].map((n) => {
    const s = source({
      id: `source:${n}`,
      name_en: n,
      name_ko: n,
      relations: [{ rel: 'child_of', target: 'source:zeus' }],
    });
    s.slug = n;
    return s;
  });
  const found = runChecks([hub, ...refs]).filter((f) => f.code === 'W01').map((f) => f.path);
  assert.ok(!found.some((p) => p.includes('zeus')), '허브 source 는 고아로 잡히면 안 된다');
});

test('W02 — 섹션 순서 위반과 필수 섹션 누락', () => {
  const swapped = trace({}, '## 왜 이 이름인가\n이유\n\n## 한 줄\n정의\n\n## 어디서 만나나\n접점\n');
  assert.ok(codes([swapped, source()]).includes('W02'));
  const missing = trace({}, '## 한 줄\n정의\n\n## 어디서 만나나\n접점\n');
  assert.ok(codes([missing, source()]).includes('W02'));
  // 선택 섹션(한국 대응물)이 없어도 걸리면 안 된다.
  assert.ok(!codes([trace(), source()]).includes('W02'));
});

test('W03 — relations.rel 이 허용 어휘 밖', () => {
  assert.ok(codes([trace(), source({ relations: [{ rel: 'friend_of', target: 'source:athena' }] })]).includes('W03'));
  assert.ok(!codes([trace(), source({ relations: [{ rel: 'companion_of', target: 'source:athena' }] })]).includes('W03'));
});

test('W04 — 두 이름이 다 비슷할 때만 중복으로 의심한다', () => {
  const a = source();
  const b = source({ id: 'source:nike-goddes', name_en: 'Nike', name_ko: '니케' });
  b.slug = 'nike-goddes';
  b.path = 'content/sources/greco-roman-myth/nike-goddes.md';
  assert.ok(codes([trace(), a, b]).includes('W04'), '한국어와 영어가 다 같으면 걸려야 한다');

  // 영어 이름만 같은 경우는 걸리면 안 된다. 수성(Mercury)과 수은(Mercury)이 실제 사례다.
  const planet = trace({ id: 'trace:mercury-planet', name_ko: '수성', name_en: 'Mercury' });
  planet.slug = 'mercury-planet';
  const metal = trace({ id: 'trace:mercury-element', name_ko: '수은', name_en: 'Mercury' });
  metal.slug = 'mercury-element';
  metal.path = 'content/traces/brand/mercury-element.md';
  assert.ok(!codes([planet, metal, source()]).includes('W04'), '뜻이 다른데 영어 이름만 같은 경우');

  // trace 와 source 는 이름이 같아도 짝이므로 걸리면 안 된다.
  assert.ok(!codes([trace(), source()]).includes('W04'));
});

test('W05 — 장문 인용 의심, 그리고 짧은 인용은 통과', () => {
  const long = Array.from({ length: 20 }, (_, i) => `word${i}`).join(' ');
  const quoted = trace({}, `## 한 줄\n"${long}"\n\n## 어디서 만나나\n접점\n\n## 왜 이 이름인가\n이유\n`);
  assert.ok(codes([quoted, source()]).includes('W05'));
  // 서로 다른 인용구 두 개가 이어져 오탐이 나면 안 된다 (2026-09-07 실제 오탐 사례).
  const two = trace(
    {},
    '## 한 줄\n광고 문구 "Just Do It". 1988년에 나온 뒤 지금까지 쓰이고 있다.\n\n' +
      '## 어디서 만나나\n로고는 "여신의 날개"로 설명된다.\n\n## 왜 이 이름인가\n이유\n',
  );
  assert.ok(!codes([two, source()]).includes('W05'));
});

test('W08 - 본문의 깨진 위키 링크와 자기 자신 링크', () => {
  const body = (link: string) =>
    ['## 한 줄', link + ' 를 가리킨다', '', '## 어디서 만나나', '접점', '', '## 왜 이 이름인가', '이유', ''].join(
      String.fromCharCode(10),
    );

  assert.ok(codes([trace({}, body('[[source:no-such-card]]')), source()]).includes('W08'), '없는 카드를 가리키면 걸려야 한다');
  assert.ok(codes([trace({}, body('[[trace:nike]]')), source()]).includes('W08'), '자기 자신을 가리키면 걸려야 한다');
  assert.ok(!codes([trace({}, body('[[source:nike-goddess]]')), source()]).includes('W08'), '있는 카드를 가리키면 걸리면 안 된다');
});

test('W06 — frequency 가 1~5 정수가 아님', () => {
  assert.ok(codes([trace({ frequency: 0 }), source()]).includes('W06'));
  assert.ok(codes([trace({ frequency: 6 }), source()]).includes('W06'));
  assert.ok(codes([trace({ frequency: undefined }), source()]).includes('W06'));
  assert.ok(!codes([trace({ frequency: 3 }), source()]).includes('W06'));
});
