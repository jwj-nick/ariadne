/** 한국어 조사 선택기 테스트. 퀴즈 문제의 말이 어색해지는 것을 막는다. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hasBatchim, josa, withJosa } from '../app/lib/korean.ts';

test('한글 받침을 알아본다', () => {
  assert.equal(hasBatchim('아킬레스건'), true);
  assert.equal(hasBatchim('나이키'), false);
  assert.equal(hasBatchim('판도라'), false);
  assert.equal(hasBatchim('일곱 죄악'), true);
  assert.equal(hasBatchim('니케'), false);
  assert.equal(hasBatchim('세븐'), true);
});

test('따옴표와 괄호는 무시하고 알맹이를 본다', () => {
  assert.equal(hasBatchim('"아킬레스건"'), true);
  assert.equal(hasBatchim('(나이키)'), false);
});

test('숫자는 읽는 소리를 따른다', () => {
  assert.equal(hasBatchim('1'), true, '일');
  assert.equal(hasBatchim('2'), false, '이');
  assert.equal(hasBatchim('3'), true, '삼');
  assert.equal(hasBatchim('5'), false, '오');
  assert.equal(hasBatchim('7'), true, '칠');
  assert.equal(hasBatchim('9'), false, '구');
});

test('라틴 문자는 마지막 소리를 따른다', () => {
  assert.equal(hasBatchim('Nike'), false, '나이키');
  assert.equal(hasBatchim('Titan'), true, '타이탄');
  assert.equal(hasBatchim('Apollo'), false, '아폴로');
  assert.equal(hasBatchim('Amazon'), true, '아마존');
});

test('이/가, 은/는, 을/를', () => {
  assert.equal(withJosa('아킬레스건', '이/가'), '아킬레스건이');
  assert.equal(withJosa('나이키', '이/가'), '나이키가');
  assert.equal(withJosa('세븐', '은/는'), '세븐은');
  assert.equal(withJosa('판도라', '은/는'), '판도라는');
  assert.equal(withJosa('아마존', '을/를'), '아마존을');
  assert.equal(withJosa('니케', '을/를'), '니케를');
});

test('이라는/라는', () => {
  assert.equal(withJosa('아킬레스건', '이라는/라는'), '아킬레스건이라는');
  assert.equal(withJosa('나이키', '이라는/라는'), '나이키라는');
  assert.equal(withJosa('판도라의 상자', '이라는/라는'), '판도라의 상자라는');
});

test('으로/로 — ㄹ 받침 뒤에서는 "로" 를 쓴다', () => {
  assert.equal(josa('일', '으로/로'), '로', '일으로가 아니라 일로');
  assert.equal(josa('물', '으로/로'), '로');
  assert.equal(josa('삼', '으로/로'), '으로');
  assert.equal(josa('니', '으로/로'), '로');
  assert.equal(josa('판', '으로/로'), '으로');
});

test('빈 문자열에도 터지지 않는다', () => {
  assert.equal(hasBatchim(''), false);
  assert.equal(josa('', '이/가'), '가');
});
