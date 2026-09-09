/**
 * 검색 판정.
 *
 * 처음에는 이름과 한 줄 설명만 뒤졌는데, 삼백 장이 되고 나서 재어 보니
 * 사람이 실제로 칠 법한 말의 절반 가까이가 결과 0건이었다.
 * "자동차"로 스물다섯 장이 나올 수 있는데 한 장도 못 찾는 식이다.
 *
 * 그래서 네 가지를 고쳤다.
 *  1. 본문까지 뒤진다. 다만 본문 색인은 무거우므로 검색을 시작할 때 따로 받아 온다.
 *  2. 검색어를 낱말로 쪼개 모두 들어 있는 것을 찾는다. "판도라 상자" 가 "판도라의 상자" 에 걸린다.
 *  3. 어디서 걸렸는지에 따라 점수를 매겨 정렬한다. 이름이 걸린 것이 본문이 걸린 것보다 앞에 온다.
 *  4. 한글 초성만 친 경우에는 초성으로 맞춰 본다. 폰에서 길게 치지 않아도 되게 하려는 것이다.
 *
 * 여기에 없는 것: 오타 교정. 편집 거리 계산은 삼백 장 × 낱말마다 돌리기에 무거워,
 * 실제로 필요해지는 시점까지 미룬다.
 */

export interface SearchDoc {
  id: string;
  /** 소문자로 내려온 한국어 이름. */
  ko: string;
  /** 소문자로 내려온 영어 이름. */
  en: string;
  /** 별칭과 힌트. 이미 소문자다. */
  terms: string[];
  /** 한 줄 설명. 흔적이면 why, 원천이면 어른 눈높이 요약이다. */
  blurb: string;
}

/** 어디서 걸렸는가. 숫자가 클수록 앞에 온다. */
const WEIGHT = {
  exact: 1000,
  prefix: 400,
  name: 200,
  term: 120,
  blurb: 50,
  /** 본문 앞쪽. 한 줄 정의와 어디서 만나나까지다. */
  bodyHead: 35,
  body: 20,
} as const;

const HANGUL_START = 0xac00;
const CHO = [
  'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ',
  'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ',
] as const;

/** 한글 음절에서 첫소리만 뽑는다. 한글이 아닌 글자는 그대로 둔다. */
export function chosung(s: string): string {
  let out = '';
  for (const ch of s) {
    const code = ch.charCodeAt(0) - HANGUL_START;
    if (code >= 0 && code < 11172) out += CHO[Math.floor(code / 588)]!;
    else out += ch;
  }
  return out;
}

/** 초성만으로 이루어진 검색어인가. 그럴 때만 초성으로 맞춰 본다. */
const isChosungQuery = (q: string): boolean => /^[ㄱ-ㅎ]{2,}$/.test(q.replace(/\s+/g, ''));

/** 검색어를 낱말로 쪼갠다. 빈 낱말은 버린다. */
export const tokenize = (q: string): string[] =>
  q.trim().toLowerCase().split(/\s+/).filter(Boolean);

/**
 * 문서 하나가 검색어에 얼마나 맞는지 잰다. 0 이면 맞지 않는다.
 *
 * `body` 는 본문 색인이 도착한 뒤에만 넘어온다. 없으면 없는 대로 판정한다.
 */
export function score(doc: SearchDoc, query: string, body?: string): number {
  const q = query.trim().toLowerCase();
  if (!q) return 0;

  // 초성만 친 경우. 이름에만 맞춰 본다. 본문까지 초성으로 뒤지면 아무 것이나 걸린다.
  if (isChosungQuery(q)) {
    const needle = q.replace(/\s+/g, '');
    const hay = chosung(doc.ko).replace(/\s+/g, '');
    if (hay.startsWith(needle)) return WEIGHT.prefix;
    return hay.includes(needle) ? WEIGHT.name : 0;
  }

  const words = tokenize(q);

  // 낱말이 전부 어딘가에 들어 있어야 한다. 하나라도 없으면 맞지 않는 것으로 본다.
  let total = 0;
  let allInName = true;
  for (const w of words) {
    let best = 0;
    if (doc.ko === w || doc.en === w) best = WEIGHT.exact;
    else if (doc.ko.startsWith(w) || doc.en.startsWith(w)) best = WEIGHT.prefix;
    else if (doc.ko.includes(w) || doc.en.includes(w)) best = WEIGHT.name;
    else if (doc.terms.some((t) => t.includes(w))) best = WEIGHT.term;
    else if (doc.blurb.includes(w)) best = WEIGHT.blurb;
    else if (body) {
      // 색인은 앞쪽과 나머지를 탭으로 갈라 두었다.
      // "자동차" 가 볼보의 "어디서 만나나" 에 있는 것과, 다른 카드의 본문 깊은 곳에 있는 것은
      // 관련의 무게가 다르므로 앞쪽에서 걸린 것을 위로 올린다.
      const cut = body.indexOf('\t');
      const head = cut < 0 ? body : body.slice(0, cut);
      const rest = cut < 0 ? '' : body.slice(cut + 1);
      if (head.includes(w)) best = WEIGHT.bodyHead;
      else if (rest.includes(w)) best = WEIGHT.body;
    }
    if (best === 0) return 0;
    if (best < WEIGHT.name) allInName = false;
    total += best;
  }

  /**
   * 친 낱말이 전부 이름 안에서 걸렸다면 크게 올린다.
   *
   * "판도라 상자" 를 치면 "판도라" 도 맞고 "판도라의 상자" 도 맞는데,
   * 앞엣것은 이름이 통째로 일치해 점수가 높다. 그러나 사람이 찾는 것은 뒤엣것이다.
   * 낱말을 더 쳤다는 것은 그만큼 좁히려 했다는 뜻이므로, 다 이름에 든 쪽을 앞에 놓는다.
   */
  if (words.length > 1 && allInName) total += WEIGHT.exact * words.length;

  return total;
}

/**
 * 본문에서 검색용 낱말만 남긴다.
 *
 * 문장 그대로 두면 색인이 육십육만 자에 이르고, 어차피 부분 문자열로만 찾으므로
 * 겹치는 낱말을 지우면 눈에 띄게 줄어든다. 빌드와 앱이 같은 규칙을 써야 하므로 여기 둔다.
 */
export function bodyIndex(body: string): string {
  const words = (text: string) => {
    const ws = String(text)
      .toLowerCase()
      .replace(/[^가-힣a-z0-9]+/g, ' ')
      .split(' ')
      .filter((w) => w.length > 1);
    return [...new Set(ws)];
  };

  /**
   * 본문 앞쪽과 나머지를 탭으로 갈라 둔다.
   *
   * 앞쪽은 한 줄 정의와 "어디서 만나나" 이며, 그 카드가 무엇에 관한 것인지가 거기 있다.
   * 뒤쪽은 배경 설명이라 같은 낱말이 나와도 관련이 옅다.
   * "자동차" 로 검색했을 때 볼보가 사모트라케의 니케보다 앞에 와야 하는 이유가 이것이다.
   */
  const text = String(body);
  const marks = ['## 왜 이 이름인가', '## 3문장 스토리'];
  let cut = -1;
  for (const m of marks) {
    const i = text.indexOf(m);
    if (i >= 0 && (cut < 0 || i < cut)) cut = i;
  }
  const head = cut < 0 ? text : text.slice(0, cut);
  const rest = cut < 0 ? '' : text.slice(cut);

  const headWords = words(head);
  const seen = new Set(headWords);
  const restWords = words(rest).filter((w) => !seen.has(w));
  return headWords.join(' ') + '\t' + restWords.join(' ');
}
