/**
 * link-auditor 의 검사 항목을 코드로 옮긴 것.
 * docs/03-SKILLS-TOOLS.md 및 .claude/skills/link-auditor/SKILL.md 의 코드 표와 1:1 대응한다.
 * error 가 하나라도 있으면 scripts/build.ts 는 실패해야 한다.
 */
import {
  EMBLEM_NAMES,
  RELATION_VOCAB,
  SOURCE_DOMAINS,
  SOURCE_SECTIONS,
  STATUSES,
  TRACE_CATEGORIES,
  TRACE_SECTIONS,
} from './schema.ts';
import { isSource, isTrace, type Card } from './content.ts';

export type Severity = 'error' | 'warn';

export interface Finding {
  code: string;
  severity: Severity;
  path: string;
  message: string;
}

const CODE_TITLES: Record<string, string> = {
  E01: 'frontmatter 필수 필드 누락',
  E02: 'trace 의 sources 가 비었거나 존재하지 않는 id',
  E03: 'trace 의 why 가 비었거나 TODO',
  E04: 'source 의 level_kid 또는 level_adult 누락',
  E05: '손으로 쓴 traces 역링크',
  E06: 'id 와 파일 경로 불일치',
  E07: '중복 id',
  E08: 'category 또는 domain 이 허용 목록 밖',
  E09: 'status 값이 허용 목록 밖',
  W01: '고아 source (들어오는 trace 0개)',
  W02: '본문 섹션 순서 위반',
  W03: 'relations.rel 이 허용 어휘 밖',
  W04: '중복 의심 (name_en 유사도 높음)',
  W05: '저작권 의심 장문 인용',
  W06: 'frequency 누락 또는 범위 밖',
  W07: 'emblem 이 문양 목록 밖',
};

export const codeTitle = (code: string) => CODE_TITLES[code] ?? code;

/** 문자 바이그램 Dice 계수. 0~1. */
function dice(a: string, b: string): number {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9가-힣]/g, '');
  const x = norm(a);
  const y = norm(b);
  if (x.length < 2 || y.length < 2) return x === y ? 1 : 0;
  const grams = (s: string) => {
    const m = new Map<string, number>();
    for (let i = 0; i < s.length - 1; i++) {
      const g = s.slice(i, i + 2);
      m.set(g, (m.get(g) ?? 0) + 1);
    }
    return m;
  };
  const gx = grams(x);
  const gy = grams(y);
  let hit = 0;
  for (const [g, n] of gx) hit += Math.min(n, gy.get(g) ?? 0);
  return (2 * hit) / (x.length - 1 + y.length - 1);
}

/** 섹션 제목이 정해진 순서대로 나오는지 본다. optional 은 빠져도 되지만 순서는 지켜야 한다. */
function checkSectionOrder(
  headings: string[],
  spec: ReadonlyArray<{ title: string; optional: boolean }>,
): string | null {
  const expectedOrder = spec.map((s) => s.title);
  const known = headings.filter((h) => expectedOrder.includes(h));
  let cursor = -1;
  for (const h of known) {
    const idx = expectedOrder.indexOf(h);
    if (idx <= cursor) {
      return `섹션 "${h}" 의 위치가 정해진 순서와 어긋납니다. 기대 순서: ${expectedOrder.join(' → ')}`;
    }
    cursor = idx;
  }
  const missing = spec.filter((s) => !s.optional && !known.includes(s.title)).map((s) => s.title);
  if (missing.length > 0) {
    return `필수 섹션이 없습니다: ${missing.join(', ')} (기대 순서: ${expectedOrder.join(' → ')})`;
  }
  return null;
}

/**
 * 따옴표 안에 15단어 이상이 연속으로 들어 있으면 인용 의심으로 본다.
 * 여는 따옴표와 닫는 따옴표는 반드시 같은 쌍이어야 하고, 줄바꿈을 넘지 않아야 한다.
 * 이 조건이 없으면 서로 다른 인용구의 닫는 따옴표와 여는 따옴표가 이어져 오탐이 난다.
 */
const QUOTE_PAIRS: ReadonlyArray<readonly [string, string]> = [
  ['"', '"'],
  ['“', '”'], // “ ”
  ['‘', '’'], // ‘ ’
  ['«', '»'], // « »
];

function longQuotes(body: string): string[] {
  const out: string[] = [];
  for (const [open, close] of QUOTE_PAIRS) {
    const esc = (ch: string) => ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`${esc(open)}([^${esc(close)}\\n]{20,}?)${esc(close)}`, 'g');
    let m: RegExpExecArray | null;
    while ((m = re.exec(body)) !== null) {
      const words = m[1]!.trim().split(/\s+/).filter(Boolean);
      if (words.length >= 15) out.push(words.slice(0, 8).join(' ') + ' …');
    }
  }
  return out;
}

export function runChecks(cards: Card[]): Finding[] {
  const findings: Finding[] = [];
  const add = (code: string, severity: Severity, path: string, message: string) => {
    findings.push({ code, severity, path, message });
  };

  const byId = new Map<string, Card[]>();
  for (const c of cards) {
    const id = typeof c.data.id === 'string' ? c.data.id : '';
    if (id) byId.set(id, [...(byId.get(id) ?? []), c]);
  }

  // E07 — 중복 id
  for (const [id, list] of byId) {
    if (list.length > 1) {
      for (const c of list) add('E07', 'error', c.path, `id "${id}" 가 ${list.length}개 파일에 중복됩니다.`);
    }
  }

  // trace → source 참조를 모아 두었다가 W01(고아 판정)에 쓴다.
  const inDegree = new Map<string, number>();
  const relDegree = new Map<string, number>();

  for (const c of cards) {
    const d = c.data;

    // E01 — 공통 필수 필드
    for (const field of ['id', 'type', 'name_ko', 'name_en', 'status'] as const) {
      const v = d[field];
      if (typeof v !== 'string' || v.trim() === '') {
        add('E01', 'error', c.path, `필수 필드 "${field}" 가 비어 있거나 없습니다.`);
      }
    }

    // E09 — status 어휘
    if (typeof d.status === 'string' && !STATUSES.includes(d.status as never)) {
      add('E09', 'error', c.path, `status "${d.status}" 는 허용 목록(${STATUSES.join(', ')}) 밖입니다.`);
    }

    // E06 — id 와 파일 경로가 일치하는지
    if (typeof d.id === 'string' && d.id.includes(':')) {
      const parts = d.id.split(':');
      const prefix = parts[0]!;
      const slug = parts.slice(1).join(':');
      const expectedPrefix = c.bucket === 'sources' ? 'source' : c.bucket === 'traces' ? 'trace' : prefix;
      if (prefix !== expectedPrefix) {
        add('E06', 'error', c.path, `id 접두사가 "${prefix}" 인데 ${c.bucket}/ 아래에 있습니다. "${expectedPrefix}:" 여야 합니다.`);
      }
      if (slug !== c.slug) {
        add('E06', 'error', c.path, `id 의 slug "${slug}" 가 파일명 "${c.slug}" 와 다릅니다.`);
      }
    }

    if (isTrace(c)) {
      const sources = Array.isArray(d.sources) ? (d.sources as string[]) : [];

      // E02
      if (sources.length === 0) {
        add('E02', 'error', c.path, 'sources 가 비어 있습니다. trace 는 원천을 최소 1개 가져야 합니다.');
      }
      for (const sid of sources) {
        if (!byId.has(sid)) {
          add('E02', 'error', c.path, `sources 의 "${sid}" 에 해당하는 source 파일이 없습니다.`);
        } else {
          inDegree.set(sid, (inDegree.get(sid) ?? 0) + 1);
        }
      }

      // E03
      const why = typeof d.why === 'string' ? d.why.trim() : '';
      if (why === '' || /^TODO/i.test(why)) {
        add('E03', 'error', c.path, 'why 가 비어 있거나 TODO 입니다. publish 를 차단합니다.');
      }

      // E08 — category
      if (!TRACE_CATEGORIES.includes(d.category as never)) {
        add('E08', 'error', c.path, `category "${String(d.category)}" 는 허용 목록 밖입니다. 허용: ${TRACE_CATEGORIES.join(', ')}`);
      } else if (c.folder !== '' && c.folder !== d.category) {
        add('E08', 'error', c.path, `폴더 "${c.folder}" 와 category "${String(d.category)}" 가 다릅니다.`);
      }

      // W06 — frequency
      const f = d.frequency;
      if (typeof f !== 'number' || !Number.isInteger(f) || f < 1 || f > 5) {
        add('W06', 'warn', c.path, `frequency 가 1~5 사이의 정수가 아닙니다: ${String(f)}`);
      }

      // W02
      const err = checkSectionOrder(c.headings, TRACE_SECTIONS);
      if (err) add('W02', 'warn', c.path, err);
    }

    if (isSource(c)) {
      // E04
      for (const field of ['level_kid', 'level_adult'] as const) {
        const v = (d as Record<string, unknown>)[field];
        if (typeof v !== 'string' || v.trim() === '') {
          add('E04', 'error', c.path, `${field} 가 비어 있습니다. source 는 kid/adult 두 요약을 모두 가져야 합니다.`);
        }
      }

      // E05 — 역링크는 빌드가 채운다
      const traces = (d as Record<string, unknown>).traces;
      if (Array.isArray(traces) && traces.length > 0) {
        add('E05', 'error', c.path, 'traces 역링크를 손으로 썼습니다. 이 필드는 빌드가 채웁니다. 빈 배열로 되돌리십시오.');
      }

      // E08 — domain
      if (!SOURCE_DOMAINS.includes(d.domain as never)) {
        add('E08', 'error', c.path, `domain "${String(d.domain)}" 는 허용 목록 밖입니다. 허용: ${SOURCE_DOMAINS.join(', ')}. 새 도메인은 docs/02-SCHEMA.md 와 scripts/lib/schema.ts 에 함께 추가해야 합니다.`);
      } else if (c.folder !== '' && c.folder !== d.domain) {
        add('E08', 'error', c.path, `폴더 "${c.folder}" 와 domain "${String(d.domain)}" 가 다릅니다.`);
      }

      // W03 — relations 어휘 검사와 참조 수 집계
      const relations = Array.isArray(d.relations) ? (d.relations as Array<{ rel?: string; target?: string }>) : [];
      for (const r of relations) {
        if (!r?.rel || !RELATION_VOCAB.includes(r.rel as never)) {
          add('W03', 'warn', c.path, `relations.rel "${String(r?.rel)}" 는 허용 어휘 밖입니다.`);
        }
        if (r?.target) relDegree.set(r.target, (relDegree.get(r.target) ?? 0) + 1);
      }

      // W07 — 문양
      const emblem = (d as Record<string, unknown>).emblem;
      if (emblem !== undefined && !EMBLEM_NAMES.includes(emblem as never)) {
        add('W07', 'warn', c.path, `emblem "${String(emblem)}" 는 문양 목록 밖입니다. app/components/Emblem.tsx 에 그림을 먼저 넣으십시오.`);
      }

      // W02
      const err = checkSectionOrder(c.headings, SOURCE_SECTIONS);
      if (err) add('W02', 'warn', c.path, err);
    }

    // W05 — 장문 인용 의심
    for (const q of longQuotes(c.body)) {
      add('W05', 'warn', c.path, `15단어 이상 따옴표 인용으로 보입니다: ${q} 요약이나 패러프레이즈로 바꾸십시오.`);
    }
  }

  // W01 — 고아 source. 들어오는 trace 가 0개이고 다른 source 의 relations 참조도 3개 미만이면 경고한다.
  for (const c of cards.filter(isSource)) {
    const id = String(c.data.id ?? '');
    const incoming = inDegree.get(id) ?? 0;
    const refs = relDegree.get(id) ?? 0;
    if (incoming === 0 && refs < 3) {
      add('W01', 'warn', c.path, `들어오는 trace 가 0개이고 relations 참조도 ${refs}개뿐입니다. 흔적을 연결하거나 참조 3개 이상의 허브로 키우십시오.`);
    }
  }

  // W04 — name_en 유사도로 중복을 의심한다.
  for (let i = 0; i < cards.length; i++) {
    for (let j = i + 1; j < cards.length; j++) {
      const a = cards[i]!;
      const b = cards[j]!;
      if (a.data.type !== b.data.type) continue;
      const na = String(a.data.name_en ?? '');
      const nb = String(b.data.name_en ?? '');
      if (na === '' || nb === '') continue;
      if (dice(na, nb) > 0.9) {
        add('W04', 'warn', a.path, `"${nb}" (${b.path}) 와 이름이 매우 비슷합니다. 같은 대상이면 하나로 합치고 다른 이름은 aliases 에 넣으십시오.`);
      }
    }
  }

  const rank: Record<string, number> = { error: 0, warn: 1 };
  return findings.sort(
    (x, y) =>
      rank[x.severity]! - rank[y.severity]! ||
      x.code.localeCompare(y.code) ||
      x.path.localeCompare(y.path),
  );
}
