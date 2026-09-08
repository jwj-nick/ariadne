/**
 * 캡처한 글에서 이미 아는 흔적을 찾아낸다.
 *
 * **AI 를 부르지 않는다.** 공유된 글에 "나이키" 나 "판도라의 상자" 가 들어 있으면
 * 글자만 맞춰 봐도 알아볼 수 있다. 실제 조우의 상당수가 이 경우다.
 * AI 매칭(M2-3)은 여기서 못 알아본 것만 맡으면 되고, 그때까지는 오너가 후보로 남긴다.
 *
 * 오탐을 막는 규칙이 두 가지 있다.
 *  - 라틴 문자 낱말은 앞뒤가 글자가 아닌 자리에서만 인정한다. art 가 party 에 걸리면 안 된다.
 *  - 너무 짧은 표기는 아예 보지 않는다.
 */

export interface MatchTarget {
  id: string;
  type: 'trace' | 'source';
  name_ko: string;
  name_en: string;
  /** 이름과 별칭 등, 찾아볼 표기들. 이미 소문자로 내려온다. */
  terms: string[];
}

export interface Match {
  id: string;
  type: 'trace' | 'source';
  name_ko: string;
  /** 실제로 걸린 표기. 왜 걸렸는지 사용자에게 보여 주기 위한 것이다. */
  hit: string;
  score: number;
}

const MIN_KO = 2;
const MIN_LATIN = 3;

const isLatin = (s: string): boolean => /^[a-z0-9 .'-]+$/i.test(s);

const escapeRe = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** 라틴 낱말은 글자 경계에서만, 한글은 그대로 찾는다. */
function occurs(haystack: string, term: string): boolean {
  if (isLatin(term)) {
    return new RegExp(`(^|[^a-z0-9])${escapeRe(term)}([^a-z0-9]|$)`, 'i').test(haystack);
  }
  return haystack.includes(term);
}

/**
 * 캡처한 글에서 알아본 것들을 점수 높은 순으로 돌려준다.
 *
 * 점수는 걸린 표기가 길수록, 그리고 원천보다 흔적일수록 높다.
 * 이 앱은 흔적이 1차 키이므로(D2), 같은 글에서 둘 다 걸리면 흔적을 앞에 둔다.
 */
export function matchCapture(text: string, targets: MatchTarget[], limit = 8): Match[] {
  const hay = text.toLowerCase();
  if (hay.trim().length === 0) return [];

  const out: Match[] = [];
  for (const t of targets) {
    let best: { term: string; len: number } | null = null;
    for (const raw of t.terms) {
      const term = raw.trim().toLowerCase();
      if (!term) continue;
      const min = isLatin(term) ? MIN_LATIN : MIN_KO;
      if (term.length < min) continue;
      if (!occurs(hay, term)) continue;
      if (!best || term.length > best.len) best = { term, len: term.length };
    }
    if (best) {
      out.push({
        id: t.id,
        type: t.type,
        name_ko: t.name_ko,
        hit: best.term,
        score: best.len + (t.type === 'trace' ? 10 : 0),
      });
    }
  }

  return out.sort((a, b) => b.score - a.score || a.name_ko.localeCompare(b.name_ko, 'ko')).slice(0, limit);
}
