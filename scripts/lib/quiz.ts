/**
 * 카드에서 퀴즈 아이템을 만든다.
 *
 * D17 에 따라 **빌드 시점에 정적으로** 생성한다. 앱이 퀴즈를 풀 때 AI 를 부르지 않는다.
 * 그래서 비용이 사용량에 비례하지 않고, 정답 누출 검사를 배포 전에 자동으로 돌릴 수 있으며,
 * 정적 배포에서도 퀴즈가 그대로 돈다.
 *
 * 문제 갈래가 둘이다.
 *
 * 1) **원천 맞히기** (`trace_to_source`, `idiom_origin`)
 *    흔적을 보여주고 그 이름이 나온 원천을 맞힌다. 자동 채점이 된다.
 *    다만 흔적 이름이 원천 이름을 그대로 품은 경우(판도라의 상자 → 판도라, 아틀라스 → 아틀라스)에는
 *    문제가 곧 답이 되므로 만들지 않는다. 시드 23장 가운데 절반이 여기에 해당한다.
 *
 * 2) **묶음 맞히기** (`source_group`)
 *    한 원천에서 나온 흔적 셋을 나란히 놓고 공통의 뿌리를 묻는다.
 *    "수성 · 에르메스 · 변덕스러운" 이 한 곳에서 나왔다는 것을 보는 눈이,
 *    미션이 말하는 "서양 지식인 수준의 교양" 의 실체에 가장 가깝다 (D38).
 *    흔적 이름이 원천 이름을 품고 있으면 그 흔적은 목록에서 뺀다. 답이 드러나기 때문이다.
 *
 * 3) **이유 말하기** (`explain_why`)
 *    흔적을 보여주고 왜 그 이름이 붙었는지 말하게 한다. 모든 흔적에 만들 수 있고,
 *    미션이 말하는 성공 조건("보자마자 원천과 이유를 말할 수 있다")에 곧바로 대응한다.
 *    어른은 스스로 답한 뒤 자기평가하고, 아이는 세 개의 이유 가운데 고른다.
 *
 * 절대 규칙 (.claude/skills/quiz-generator/SKILL.md)
 *  - 힌트에도 문제에도 정답 문자열이 들어가면 안 된다. 위반한 아이템은 폐기한다.
 *  - 힌트 순서는 맥락 → 속성 → 거의 답이다.
 *  - 문제는 반드시 흔적에서 출발한다. 원천에서 원천으로 묻지 않는다.
 */
import type { Card } from './content.ts';
import { isSource, isTrace } from './content.ts';
import { josa } from '../../app/lib/korean.ts';

export type QuizType = 'trace_to_source' | 'idiom_origin' | 'explain_why' | 'source_group';
export type Level = 'kid' | 'adult';
/** auto = 입력이나 선택을 대조해 채점. self = 답을 보고 사용자가 스스로 평가. */
export type Grading = 'auto' | 'self';

export interface QuizItem {
  id: string;
  trace_id: string;
  source_id: string;
  type: QuizType;
  level: Level;
  grading: Grading;
  prompt: string;
  /** 맥락 → 속성 → 거의 답. 정확히 3개. */
  hints: string[];
  answer: string;
  /** grading 이 auto 일 때 정답으로 인정할 표기들. 비교 전에 normalize() 를 거친다. */
  accept: string[];
  /** 객관식 선택지. 정답이 반드시 하나 들어 있다. */
  choices?: string[];
}

export interface QuizBuildResult {
  items: QuizItem[];
  discarded: Array<{ trace_id: string; type: QuizType; reason: string }>;
}

const DOMAIN_CONTEXT: Record<string, string> = {
  'greco-roman-myth': '그리스·로마 신화에 나오는 인물이나 이야기에서 왔습니다.',
  'bible-ot': '성경 구약에 나오는 이야기에서 왔습니다.',
  'bible-nt': '성경 신약에 나오는 이야기에서 왔습니다.',
  history: '고대 그리스·로마사나 서양사에서 실제로 있었던 일이나 제도에서 왔습니다.',
  literature: '서양 문학의 이름난 작품에서 왔습니다.',
};

const CATEGORY_WORD: Record<string, string> = {
  brand: '브랜드',
  'science-astro': '과학·천문 용어',
  'psych-med': '심리·의학 용어',
  art: '작품',
  'lit-film': '작품',
  'politics-law': '정치·법 용어',
  idiom: '표현',
  codename: '프로젝트 이름',
  place: '지명',
  other: '이름',
};

/** 정답 비교용 정규화. 공백과 문장부호를 지우고 소문자로 만든다. */
export const normalize = (s: string): string =>
  s.toLowerCase().replace(/[\s·.,'"()[\]<>“”‘’]/g, '');

/** 문자열을 숫자로 접는다. 선택지를 무작위처럼 보이되 빌드마다 같게 만들기 위한 것이다. */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/** 원천 이름에서 정답으로 인정할 표기들을 뽑는다. */
function acceptForms(name_ko: string, name_en: string, aliases: string[]): string[] {
  const base = [name_ko, name_en, ...aliases].filter(Boolean);
  const extra: string[] = [];
  for (const n of base) {
    // "탕자의 비유", "아마존족" 처럼 갈래를 뜻하는 꼬리는 떼고도 인정한다.
    const trimmed = n.replace(/(의 비유|의 이야기|이야기|족)$/u, '').trim();
    if (trimmed && trimmed !== n) extra.push(trimmed);
    if (n.includes(' ')) extra.push(n.replace(/\s+/g, ''));
  }
  const seen = new Set<string>();
  const out: string[] = [];
  for (const n of [...base, ...extra]) {
    const key = normalize(n);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(n);
  }
  return out;
}

/** 주어진 글들 가운데 정답 표기를 그대로 품은 것이 있으면 그 사유를 돌려준다. */
function leaks(texts: string[], accept: string[]): string | null {
  for (const text of texts) {
    const t = normalize(text);
    for (const a of accept) {
      const n = normalize(a);
      // 한 글자짜리 표기는 우연히 겹치므로 검사에서 뺀다.
      if (n.length >= 2 && t.includes(n)) return `"${a}" 가 문제나 힌트에 그대로 들어 있습니다.`;
    }
  }
  return null;
}

/** 오답 두 개를 고른다. 가까운 후보를 먼저 쓰고 모자라면 먼 후보로 채운다. 빌드마다 같은 결과가 나온다. */
function pickDecoys(seed: string, near: string[], far: string[]): string[] {
  const decoys: string[] = [];
  for (const pool of [near, far]) {
    if (pool.length === 0) continue;
    const start = hash(seed) % pool.length;
    for (let i = 0; decoys.length < 2 && i < pool.length; i++) {
      const cand = pool[(start + i) % pool.length]!;
      if (!decoys.includes(cand)) decoys.push(cand);
    }
    if (decoys.length >= 2) break;
  }
  return decoys;
}

const shuffle = (seed: string, list: string[]): string[] =>
  [...list].sort((a, b) => (hash(seed + a) % 10007) - (hash(seed + b) % 10007));

export function buildQuiz(cards: Card[]): QuizBuildResult {
  const traces = cards.filter(isTrace);
  const sources = cards.filter(isSource);
  const sourceById = new Map(sources.map((s) => [String(s.data.id), s]));

  const items: QuizItem[] = [];
  const discarded: QuizBuildResult['discarded'] = [];

  for (const t of traces) {
    const traceId = String(t.data.id);
    const sids = Array.isArray(t.data.sources) ? (t.data.sources as string[]) : [];
    const source = sids.map((id) => sourceById.get(id)).find(Boolean);
    if (!source) {
      discarded.push({ trace_id: traceId, type: 'trace_to_source', reason: '연결된 원천 카드가 없습니다.' });
      continue;
    }

    const sourceId = String(source.data.id);
    const domain = String(source.data.domain);
    const nameKo = String(source.data.name_ko);
    const nameEn = String(source.data.name_en);
    const aliases = Array.isArray(source.data.aliases) ? (source.data.aliases as string[]) : [];
    const levelKid = String((source.data as Record<string, unknown>).level_kid ?? '');
    const traceKo = String(t.data.name_ko);
    const traceEn = String(t.data.name_en);
    const category = String(t.data.category);
    const why = String((t.data as Record<string, unknown>).why ?? '');

    const accept = acceptForms(nameKo, nameEn, aliases);
    const context = DOMAIN_CONTEXT[domain] ?? '서양 문화의 오래된 이야기에서 왔습니다.';
    const word = CATEGORY_WORD[category] ?? '이름';
    const originType: QuizType = category === 'idiom' ? 'idiom_origin' : 'trace_to_source';

    // ── 1) 원천 맞히기 ────────────────────────────────────────────────
    const firstChar = [...nameKo][0] ?? '';
    let lastHint = `이름은 "${firstChar}"${josa(firstChar, '으로/로')} 시작하고 ${[...nameKo].length}글자입니다.`;
    const sibling = traces.find(
      (o) =>
        String(o.data.id) !== traceId &&
        (Array.isArray(o.data.sources) ? (o.data.sources as string[]) : []).includes(sourceId),
    );
    if (sibling) {
      const siblingName = String(sibling.data.name_ko);
      const siblingLeaks = accept.some(
        (a) => normalize(a).length >= 2 && normalize(siblingName).includes(normalize(a)),
      );
      if (!siblingLeaks) lastHint += ` 같은 곳에서 나온 다른 이름으로 "${siblingName}"${josa(siblingName, '이/가')} 있습니다.`;
    }
    const originHints = [context, levelKid || '오래전부터 전해 오는 이야기 속 존재입니다.', lastHint];
    const originPromptAdult =
      originType === 'idiom_origin'
        ? `"${traceKo}"${josa(traceKo, '이라는/라는')} 표현은 어디서 왔을까?`
        : `${word} "${traceKo}"(${traceEn})의 이름은 어디서 왔을까?`;
    const originPromptKid = `"${traceKo}"${josa(traceKo, '이라는/라는')} 이름은 어떤 이야기에서 나왔을까?`;

    const originLeak =
      accept.length < 2
        ? '정답으로 인정할 표기가 2개도 되지 않습니다.'
        : leaks([originPromptAdult, originPromptKid, ...originHints], accept);

    if (originLeak) {
      // 흔적 이름이 원천 이름을 그대로 품은 경우가 대부분이다. 아래의 이유 말하기 문제는 그대로 만든다.
      discarded.push({ trace_id: traceId, type: originType, reason: originLeak });
    } else {
      items.push({
        id: `${traceId}#${originType}#adult`,
        trace_id: traceId,
        source_id: sourceId,
        type: originType,
        level: 'adult',
        grading: 'auto',
        prompt: originPromptAdult,
        hints: originHints,
        answer: nameKo,
        accept,
      });

      const near = sources
        .filter((s) => String(s.data.id) !== sourceId && String(s.data.domain) === domain)
        .map((s) => String(s.data.name_ko));
      const far = sources
        .filter((s) => String(s.data.id) !== sourceId && String(s.data.domain) !== domain)
        .map((s) => String(s.data.name_ko));
      const decoys = pickDecoys(traceId, near.sort(), far.sort()).filter(
        (d) => normalize(d) !== normalize(nameKo),
      );
      if (decoys.length === 2) {
        items.push({
          id: `${traceId}#${originType}#kid`,
          trace_id: traceId,
          source_id: sourceId,
          type: originType,
          level: 'kid',
          grading: 'auto',
          prompt: originPromptKid,
          hints: originHints,
          answer: nameKo,
          accept,
          choices: shuffle(traceId, [nameKo, ...decoys]),
        });
      }
    }

    // ── 2) 이유 말하기 ────────────────────────────────────────────────
    // 미션의 성공 조건에 곧바로 대응하는 문제다. 모든 흔적에 만든다.
    if (!why) {
      discarded.push({ trace_id: traceId, type: 'explain_why', reason: 'why 가 비어 있습니다.' });
      continue;
    }

    items.push({
      id: `${traceId}#explain_why#adult`,
      trace_id: traceId,
      source_id: sourceId,
      type: 'explain_why',
      level: 'adult',
      grading: 'self',
      prompt: `"${traceKo}"${josa(traceKo, '이라는/라는')} 이름이 왜 붙었는지 설명해 보십시오.`,
      hints: [
        context,
        levelKid || '오래전부터 전해 오는 이야기 속 존재입니다.',
        `원천은 "${nameKo}"입니다. 이 이름과 "${traceKo}"${josa(traceKo, '이/가')} 어떻게 이어지는지 떠올려 보십시오.`,
      ],
      answer: why,
      accept: [],
    });

    const whyNear = traces
      .filter((o) => String(o.data.id) !== traceId && String(o.data.category) === category)
      .map((o) => String((o.data as Record<string, unknown>).why ?? ''))
      .filter(Boolean);
    const whyFar = traces
      .filter((o) => String(o.data.id) !== traceId && String(o.data.category) !== category)
      .map((o) => String((o.data as Record<string, unknown>).why ?? ''))
      .filter(Boolean);
    const whyDecoys = pickDecoys(traceId + 'why', whyNear.sort(), whyFar.sort());
    if (whyDecoys.length === 2) {
      items.push({
        id: `${traceId}#explain_why#kid`,
        trace_id: traceId,
        source_id: sourceId,
        type: 'explain_why',
        level: 'kid',
        grading: 'auto',
        prompt: `"${traceKo}"${josa(traceKo, '이라는/라는')} 이름이 붙은 까닭은 무엇일까?`,
        hints: [
          context,
          levelKid || '오래전부터 전해 오는 이야기 속 존재입니다.',
          `이 이름은 "${nameKo}"에서 왔습니다.`,
        ],
        answer: why,
        accept: [why],
        choices: shuffle(traceId + 'why', [why, ...whyDecoys]),
      });
    }
  }

  // ── 3) 묶음 맞히기 ────────────────────────────────────────────────
  // 흔적 셋을 나란히 놓고 공통의 뿌리를 묻는다 (D38).
  for (const source of sources) {
    const sourceId = String(source.data.id);
    const nameKo = String(source.data.name_ko);
    const nameEn = String(source.data.name_en);
    const domain = String(source.data.domain);
    const aliases = Array.isArray(source.data.aliases) ? (source.data.aliases as string[]) : [];
    const levelKid = String((source.data as Record<string, unknown>).level_kid ?? '');
    const accept = acceptForms(nameKo, nameEn, aliases);

    const mine = traces
      .filter((t) => (Array.isArray(t.data.sources) ? (t.data.sources as string[]) : []).includes(sourceId))
      // 이름 안에 답이 들어 있는 흔적은 뺀다. "사모트라케의 니케" 를 보여 주면 니케가 답이라고 말한 셈이다.
      .filter((t) => !leaks([String(t.data.name_ko)], accept))
      .sort(
        (a, b) =>
          Number(b.data.frequency ?? 0) - Number(a.data.frequency ?? 0) ||
          String(a.data.id).localeCompare(String(b.data.id)),
      );

    // 흔적이 셋도 안 되는 원천이 대부분이다. 이것은 확인할 일이 아니라 아직 없는 것이므로
    // 폐기 목록에 올리지 않는다. 올리면 빌드 로그가 그 얘기로만 가득 찬다.
    if (mine.length < 3) continue;

    const trio = mine.slice(0, 3).map((t) => String(t.data.name_ko));
    const traceId = String(mine[0]!.data.id);
    const context = DOMAIN_CONTEXT[domain] ?? '서양 문화의 오래된 이야기에서 왔습니다.';
    const firstChar = [...nameKo][0] ?? '';
    const promptAdult = `${trio.join(' · ')} — 이 셋은 모두 어디서 온 이름일까?`;
    const promptKid = `${trio.join(', ')} 는 모두 같은 이야기에서 나왔어요. 어떤 이야기일까?`;
    const hints = [
      context,
      levelKid || '오래전부터 전해 오는 이야기 속 존재입니다.',
      `이름은 "${firstChar}"${josa(firstChar, '으로/로')} 시작하고 ${[...nameKo].length}글자입니다.`,
    ];

    const leak = accept.length < 2 ? '정답으로 인정할 표기가 2개도 되지 않습니다.' : leaks([promptAdult, promptKid, ...hints], accept);
    if (leak) {
      discarded.push({ trace_id: traceId, type: 'source_group', reason: leak });
      continue;
    }

    items.push({
      id: `${sourceId}#source_group#adult`,
      trace_id: traceId,
      source_id: sourceId,
      type: 'source_group',
      level: 'adult',
      grading: 'auto',
      prompt: promptAdult,
      hints,
      answer: nameKo,
      accept,
    });

    const near = sources
      .filter((o) => String(o.data.id) !== sourceId && String(o.data.domain) === domain)
      .map((o) => String(o.data.name_ko));
    const far = sources
      .filter((o) => String(o.data.id) !== sourceId && String(o.data.domain) !== domain)
      .map((o) => String(o.data.name_ko));
    const decoys = pickDecoys(sourceId + 'group', near.sort(), far.sort()).filter(
      (d) => normalize(d) !== normalize(nameKo),
    );
    if (decoys.length === 2) {
      items.push({
        id: `${sourceId}#source_group#kid`,
        trace_id: traceId,
        source_id: sourceId,
        type: 'source_group',
        level: 'kid',
        grading: 'auto',
        prompt: promptKid,
        hints,
        answer: nameKo,
        accept,
        choices: shuffle(sourceId + 'group', [nameKo, ...decoys]),
      });
    }
  }

  return { items, discarded };
}
