/**
 * scripts/build.ts — content/*.md 를 app/data/graph.json 하나로 빌드한다.
 *
 *   npm run build:content
 *
 * 앱은 이 파일만 읽는다 (docs/02-SCHEMA.md "빌드 산출물").
 * 감사(scripts/lib/checks.ts)에 error 가 하나라도 있으면 빌드는 실패한다.
 * source 의 역링크(traces)는 여기서 채운다. 원본 마크다운에 손으로 쓰면 E05 로 걸린다.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadCards, isTrace, isSource, REPO_ROOT, type Card } from './lib/content.ts';
import { runChecks, codeTitle } from './lib/checks.ts';
import { VISIBLE_STATUSES, type Status } from './lib/schema.ts';

interface GraphTrace {
  id: string;
  slug: string;
  category: string;
  name_ko: string;
  name_en: string;
  sources: string[];
  why: string;
  frequency: number;
  domain_hint: string[];
  status: Status;
  body: string;
  sections: Record<string, string>;
}

interface GraphSource {
  id: string;
  slug: string;
  domain: string;
  name_ko: string;
  name_en: string;
  aliases: string[];
  relations: Array<{ rel: string; target: string }>;
  level_kid: string;
  level_adult: string;
  korea_parallel: string;
  /** 빌드가 채우는 역링크 */
  traces: string[];
  status: Status;
  body: string;
  sections: Record<string, string>;
}

interface GraphEdge {
  from: string;
  to: string;
  /** trace → source 는 'traces_to', source ↔ source 는 relations 의 rel 값 */
  kind: string;
}

/** `## 제목` 단위로 본문을 쪼갠다. 앱이 섹션별로 골라 렌더링할 수 있게 하기 위한 것이다. */
function splitSections(body: string): Record<string, string> {
  const out: Record<string, string> = {};
  let current = '';
  let buf: string[] = [];
  let inFence = false;
  const flush = () => {
    if (current !== '') out[current] = buf.join('\n').trim();
  };
  for (const line of body.split(/\r?\n/)) {
    if (/^\s*```/.test(line)) inFence = !inFence;
    const m = !inFence && !line.startsWith('###') ? /^##\s+(.+?)\s*$/.exec(line) : null;
    if (m) {
      flush();
      current = m[1]!.replace(/^\d+\.\s*/, '').trim();
      buf = [];
    } else {
      buf.push(line);
    }
  }
  flush();
  return out;
}

const str = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v : fallback);
const arr = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : []);

// ── 1. 로드 + 감사 게이트 ──────────────────────────────────────────────
const all = loadCards(['traces', 'sources']);
const findings = runChecks(all);
const errors = findings.filter((f) => f.severity === 'error');
const warns = findings.filter((f) => f.severity === 'warn');

if (errors.length > 0) {
  console.error('');
  console.error(`  빌드 중단: 감사에서 error ${errors.length}건이 나왔습니다.`);
  for (const f of errors) {
    console.error(`    ${f.code} ${codeTitle(f.code)} · ${f.path}`);
    console.error(`      ${f.message}`);
  }
  console.error('');
  console.error('  npm run audit 으로 전체 리포트를 확인하십시오.');
  console.error('');
  process.exit(1);
}

// ── 2. 노출 대상만 추린다 (D15) ────────────────────────────────────────
const visible = (c: Card) => VISIBLE_STATUSES.includes(c.data.status as Status);
const traceCards = all.filter(isTrace).filter(visible);
const sourceCards = all.filter(isSource).filter(visible);
const visibleSourceIds = new Set(sourceCards.map((c) => String(c.data.id)));

const traces: GraphTrace[] = traceCards.map((c) => ({
  id: String(c.data.id),
  slug: c.slug,
  category: str(c.data.category),
  name_ko: str(c.data.name_ko),
  name_en: str(c.data.name_en),
  // 노출되지 않는 source 를 가리키는 링크는 그래프에서 뺀다.
  sources: arr(c.data.sources).filter((id) => visibleSourceIds.has(id)),
  why: str((c.data as Record<string, unknown>).why),
  frequency: typeof c.data.frequency === 'number' ? c.data.frequency : 0,
  domain_hint: arr((c.data as Record<string, unknown>).domain_hint),
  status: c.data.status as Status,
  body: c.body.trim(),
  sections: splitSections(c.body),
}));

// ── 3. 역링크를 채운다 ────────────────────────────────────────────────
const backlinks = new Map<string, string[]>();
for (const t of traces) {
  for (const sid of t.sources) backlinks.set(sid, [...(backlinks.get(sid) ?? []), t.id]);
}

const sources: GraphSource[] = sourceCards.map((c) => {
  const id = String(c.data.id);
  const rawRel = Array.isArray((c.data as Record<string, unknown>).relations)
    ? ((c.data as Record<string, unknown>).relations as Array<{ rel?: string; target?: string }>)
    : [];
  return {
    id,
    slug: c.slug,
    domain: str(c.data.domain),
    name_ko: str(c.data.name_ko),
    name_en: str(c.data.name_en),
    aliases: arr((c.data as Record<string, unknown>).aliases),
    relations: rawRel
      .filter((r) => r?.rel && r?.target)
      .map((r) => ({ rel: String(r.rel), target: String(r.target) })),
    level_kid: str((c.data as Record<string, unknown>).level_kid),
    level_adult: str((c.data as Record<string, unknown>).level_adult),
    korea_parallel: str((c.data as Record<string, unknown>).korea_parallel),
    traces: (backlinks.get(id) ?? []).sort(),
    status: c.data.status as Status,
    body: c.body.trim(),
    sections: splitSections(c.body),
  };
});

// ── 4. 엣지 ───────────────────────────────────────────────────────────
const edges: GraphEdge[] = [];
for (const t of traces) {
  for (const sid of t.sources) edges.push({ from: t.id, to: sid, kind: 'traces_to' });
}
const sourceIds = new Set(sources.map((s) => s.id));
for (const s of sources) {
  for (const r of s.relations) {
    // 아직 카드가 없는 원천을 가리키는 관계는 그래프에 넣지 않는다 (감사에서는 통과시킨다).
    if (sourceIds.has(r.target)) edges.push({ from: s.id, to: r.target, kind: r.rel });
  }
}

// ── 5. 검색 인덱스 ────────────────────────────────────────────────────
const index = [
  ...traces.map((t) => ({
    id: t.id,
    type: 'trace' as const,
    name_ko: t.name_ko,
    name_en: t.name_en,
    terms: [t.name_ko, t.name_en, t.category, ...t.domain_hint].filter(Boolean).map((s) => s.toLowerCase()),
  })),
  ...sources.map((s) => ({
    id: s.id,
    type: 'source' as const,
    name_ko: s.name_ko,
    name_en: s.name_en,
    terms: [s.name_ko, s.name_en, s.domain, ...s.aliases].filter(Boolean).map((x) => x.toLowerCase()),
  })),
];

// ── 6. 출력 ───────────────────────────────────────────────────────────
const orphans = sources.filter((s) => s.traces.length === 0);
const graph = {
  meta: {
    generated_at: new Date().toISOString(),
    counts: {
      traces: traces.length,
      sources: sources.length,
      edges: edges.length,
      orphan_sources: orphans.length,
    },
    visible_statuses: VISIBLE_STATUSES,
  },
  traces,
  sources,
  edges,
  index,
};

const outDir = join(REPO_ROOT, 'app', 'data');
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'graph.json'), JSON.stringify(graph, null, 2) + '\n', 'utf8');

const byFreq = [...traces].sort((a, b) => b.frequency - a.frequency).slice(0, 5);

console.log('');
console.log('  Ariadne 콘텐츠 빌드');
console.log('  ─────────────────────────────────────────────');
console.log(`  trace          ${traces.length}장`);
console.log(`  source         ${sources.length}장`);
console.log(`  edge           ${edges.length}개`);
console.log(`  고아 source    ${orphans.length}개${orphans.length > 0 ? ' — ' + orphans.map((s) => s.id).join(', ') : ''}`);
console.log(`  경고           ${warns.length}건${warns.length > 0 ? ' (npm run audit 으로 확인)' : ''}`);
if (byFreq.length > 0) {
  console.log(`  frequency 상위 ${byFreq.map((t) => `${t.name_en}(${t.frequency})`).join(', ')}`);
}
console.log('');
console.log('  기록: app/data/graph.json');
console.log('');
