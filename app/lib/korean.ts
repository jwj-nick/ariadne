/**
 * 한국어 조사 선택기.
 *
 * 퀴즈 문제와 힌트를 카드 이름으로 조립하다 보면 "아킬레스건 라는" 처럼 어색한 말이 나온다.
 * 앞 낱말에 받침이 있는지에 따라 조사를 골라 붙여야 한다.
 *
 * 낱말이 한글로 끝나면 받침을 직접 계산하고, 숫자나 라틴 문자로 끝나면 읽는 소리로 판단한다.
 * 예를 들어 Nike 는 [나이키]로 읽으므로 받침이 없고, Titan 은 [타이탄]이므로 받침이 있다.
 */

/** 낱말의 마지막 소리에 받침이 있는가. */
export function hasBatchim(word: string): boolean {
  const chars = [...word.trim().replace(/["'()[\]<>“”‘’]/g, '')];
  const last = chars[chars.length - 1];
  if (!last) return false;

  const code = last.charCodeAt(0);

  // 한글 음절
  if (code >= 0xac00 && code <= 0xd7a3) return (code - 0xac00) % 28 !== 0;

  // 숫자는 읽는 소리를 따른다. 0(영) 1(일) 3(삼) 6(육) 7(칠) 8(팔) 은 받침이 있다.
  if (last >= '0' && last <= '9') return '013678'.includes(last);

  // 라틴 문자는 마지막 글자의 소리를 따른다. l, m, n, ng 로 끝나면 받침이 있다.
  const lower = last.toLowerCase();
  if (lower >= 'a' && lower <= 'z') {
    const tail = word.trim().toLowerCase();
    if (tail.endsWith('ng')) return true;
    return 'lmn'.includes(lower);
  }

  return false;
}

/** 받침 유무에 따라 조사를 고른다. 짝은 "받침 있을 때/없을 때" 순서로 적는다. */
const PAIRS = {
  '이/가': ['이', '가'],
  '은/는': ['은', '는'],
  '을/를': ['을', '를'],
  '과/와': ['과', '와'],
  '이라는/라는': ['이라는', '라는'],
  '이란/란': ['이란', '란'],
  '으로/로': ['으로', '로'],
  '이다/다': ['이다', '다'],
  '입니다/입니다': ['입니다', '입니다'],
} as const;

export type JosaPair = keyof typeof PAIRS;

/** 받침이 ㄹ 인가. "으로/로" 는 이 경우에 받침이 없는 것처럼 쓴다. */
export function endsWithRieul(word: string): boolean {
  const chars = [...word.trim().replace(/["'()[\]<>“”‘’]/g, '')];
  const last = chars[chars.length - 1];
  if (!last) return false;
  const code = last.charCodeAt(0);
  if (code >= 0xac00 && code <= 0xd7a3) return (code - 0xac00) % 28 === 8;
  // 라틴 문자 l 로 끝나면 [ㄹ] 로 읽는다. 예를 들어 Titan 은 아니고 Excel 은 그렇다.
  return last.toLowerCase() === 'l';
}

/** 낱말 뒤에 붙일 조사만 돌려준다. */
export function josa(word: string, pair: JosaPair): string {
  const [withBatchim, without] = PAIRS[pair];
  // "일으로" 가 아니라 "일로" 다. ㄹ 받침 뒤에서는 "으로" 를 쓰지 않는다.
  if (pair === '으로/로' && endsWithRieul(word)) return without;
  return hasBatchim(word) ? withBatchim : without;
}

/** 낱말과 조사를 붙여서 돌려준다. */
export const withJosa = (word: string, pair: JosaPair): string => `${word}${josa(word, pair)}`;
