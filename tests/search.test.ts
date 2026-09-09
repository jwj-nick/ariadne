/**
 * 검색 판정 테스트.
 *
 * 검색은 틀려도 조용히 틀린다. 결과가 0건이면 사용자는 그런 카드가 없다고 여기지,
 * 검색이 못 찾았다고 생각하지 않는다. 그래서 실제로 칠 법한 말을 본보기로 붙들어 둔다.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

const { score, chosung, tokenize, bodyIndex } = await import('../app/lib/search.ts');

const nike = {
  id: 'trace:nike',
  ko: '나이키',
  en: 'nike',
  terms: ['나이키', 'nike', 'sportswear', 'swoosh'],
  blurb: '승리의 여신 니케의 이름을 붙인 것이며, 로고는 그 날개를 형상화한 것이다.',
};
const pandorasBox = {
  id: 'trace:pandoras-box',
  ko: '판도라의 상자',
  en: "pandora's box",
  terms: ['판도라의 상자', "pandora's box", 'hope', 'evil'],
  blurb: '열지 말라던 항아리를 열어 온갖 나쁜 것이 쏟아져 나왔다는 이야기에서 왔다.',
};
const bacchus = {
  id: 'trace:bacchus',
  ko: '박카스',
  en: 'bacchus',
  terms: ['박카스', 'bacchus', 'drink', 'pharmacy'],
  blurb: '포도주와 도취의 신 바쿠스의 이름을 그대로 가져다 붙였다.',
};

test('이름으로 찾는다', () => {
  assert.ok(score(nike, '나이키') > 0);
  assert.ok(score(nike, 'nike') > 0);
  assert.ok(score(nike, 'NIKE') > 0, '대문자로 쳐도 찾아야 한다');
});

test('별칭과 힌트로도 찾는다', () => {
  assert.ok(score(nike, 'swoosh') > 0);
});

test('한 줄 설명으로도 찾는다', () => {
  assert.ok(score(nike, '니케') > 0);
});

test('맞지 않으면 0 이다', () => {
  assert.equal(score(nike, '아디다스'), 0);
});

test('띄어쓰기가 달라도 찾는다', () => {
  // "판도라의 상자" 를 "판도라 상자" 로 치는 사람이 많다.
  assert.ok(score(pandorasBox, '판도라 상자') > 0);
  assert.ok(score(pandorasBox, '상자 판도라') > 0, '차례가 바뀌어도 찾아야 한다');
});

test('낱말이 전부 이름에 든 카드가 앞에 온다', () => {
  // "판도라" 는 이름이 통째로 맞아 점수가 높지만, "판도라 상자" 로 친 사람이 찾는 것은 상자 쪽이다.
  const pandora = {
    id: 'source:pandora',
    ko: '판도라',
    en: 'pandora',
    terms: ['판도라', 'pandora'],
    blurb: '열지 말라던 상자를 연 첫 여인이다.',
  };
  assert.ok(score(pandorasBox, '판도라 상자') > score(pandora, '판도라 상자'));
  // 낱말 하나만 쳤을 때는 여전히 이름이 통째로 맞는 쪽이 앞이다.
  assert.ok(score(pandora, '판도라') > score(pandorasBox, '판도라'));
});

test('낱말이 하나라도 없으면 맞지 않는다', () => {
  // AND 로 묶어야 검색어를 더할수록 결과가 좁아진다.
  assert.equal(score(pandorasBox, '판도라 자동차'), 0);
});

test('본문까지 넘겨주면 본문으로도 찾는다', () => {
  const body = bodyIndex('니체가 비극의 탄생에서 아폴론적인 것과 디오니소스적인 것을 나눈 뒤로');
  assert.equal(score(bacchus, '니체'), 0, '본문 없이는 못 찾는 것이 맞다');
  assert.ok(score(bacchus, '니체', body) > 0);
});

test('어디서 걸렸느냐로 순서가 갈린다', () => {
  const body = bodyIndex('나이키 운동화를 신고 달렸다');
  const byName = score(nike, '나이키');
  const byBody = score(bacchus, '운동화', body);
  assert.ok(byName > byBody, '이름이 걸린 것이 본문이 걸린 것보다 앞에 와야 한다');
});

test('이름이 그대로 맞으면 가장 앞에 온다', () => {
  const other = { ...bacchus, blurb: '나이키와는 아무 상관이 없다' };
  assert.ok(score(nike, '나이키') > score(other, '나이키'));
});

test('초성만 쳐도 이름을 찾는다', () => {
  assert.ok(score(nike, 'ㄴㅇㅋ') > 0);
  assert.ok(score(bacchus, 'ㅂㅋㅅ') > 0);
  assert.equal(score(nike, 'ㅂㅋㅅ'), 0);
});

test('초성 변환', () => {
  assert.equal(chosung('나이키'), 'ㄴㅇㅋ');
  assert.equal(chosung('판도라의 상자'), 'ㅍㄷㄹㅇ ㅅㅈ');
  assert.equal(chosung('nike'), 'nike', '한글이 아닌 글자는 그대로 둔다');
});

test('낱말 쪼개기', () => {
  assert.deepEqual(tokenize('  판도라   상자 '), ['판도라', '상자']);
  assert.deepEqual(tokenize(''), []);
});

test('본문 색인은 겹치는 낱말을 지우고 한 글자를 버린다', () => {
  const out = bodyIndex('니체가 니체를 니체와. 아 그 것');
  assert.equal(out.split(' ').filter((w) => w.startsWith('니체')).length, 3, '조사가 붙은 형태는 따로 남는다');
  assert.ok(!out.split(' ').includes('아'), '한 글자는 버린다');
});

test('빈 검색어는 아무 것도 맞히지 않는다', () => {
  assert.equal(score(nike, ''), 0);
  assert.equal(score(nike, '   '), 0);
});
