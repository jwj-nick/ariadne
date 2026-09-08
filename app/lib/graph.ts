/**
 * app/data/graph.json 을 읽어 앱에 넘겨주는 계층.
 *
 * 이 파일은 빌드 산출물이라 git 에 없다. `npm run build:content` 가 먼저 돌아야 한다.
 * package.json 의 dev 와 build 스크립트가 그 순서를 강제한다.
 *
 * import 대신 파일을 직접 읽는 이유는, 리포를 새로 받아 온 직후처럼
 * graph.json 이 아직 없는 상태에서도 `npm run typecheck` 가 통과하게 하기 위해서다.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export type Status = 'candidate' | 'reviewed' | 'published' | 'retired';

export interface Trace {
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

export interface Source {
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
  emblem: string;
  traces: string[];
  status: Status;
  body: string;
  sections: Record<string, string>;
}

export interface Edge {
  from: string;
  to: string;
  kind: string;
}

export interface IndexEntry {
  id: string;
  type: 'trace' | 'source';
  name_ko: string;
  name_en: string;
  terms: string[];
}

export interface LayoutNode {
  id: string;
  type: 'trace' | 'source';
  x: number;
  y: number;
  degree: number;
}

export interface Layout {
  nodes: LayoutNode[];
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
}

export interface Graph {
  meta: {
    generated_at: string;
    counts: { traces: number; sources: number; edges: number; orphan_sources: number };
    visible_statuses: Status[];
  };
  traces: Trace[];
  sources: Source[];
  edges: Edge[];
  index: IndexEntry[];
  layout: Layout;
}

const EMPTY: Graph = {
  meta: {
    generated_at: '',
    counts: { traces: 0, sources: 0, edges: 0, orphan_sources: 0 },
    visible_statuses: [],
  },
  traces: [],
  sources: [],
  edges: [],
  index: [],
  layout: { nodes: [], bounds: { minX: 0, minY: 0, maxX: 0, maxY: 0 } },
};

let cached: Graph | null = null;

export function getGraph(): Graph {
  if (cached) return cached;
  const path = join(process.cwd(), 'app', 'data', 'graph.json');
  if (!existsSync(path)) {
    // 빌드 순서가 잘못된 경우다. 빈 그래프를 돌려주고 화면에서 안내한다.
    console.warn('[ariadne] app/data/graph.json 이 없습니다. npm run build:content 를 먼저 실행하십시오.');
    cached = EMPTY;
    return cached;
  }
  cached = JSON.parse(readFileSync(path, 'utf8')) as Graph;
  return cached;
}

/** 흔적 카테고리의 한국어 이름. docs/02-SCHEMA.md 의 category 어휘와 짝을 이룬다. */
export const CATEGORY_LABEL: Record<string, string> = {
  brand: '브랜드',
  'science-astro': '과학·천문',
  'psych-med': '심리·의학',
  art: '회화·조각',
  'lit-film': '문학·영화',
  'politics-law': '정치·법',
  idiom: '일상 관용구',
  codename: '프로젝트 코드명',
  place: '지명',
  other: '그 밖',
};

/** 원천 도메인의 한국어 이름. */
export const DOMAIN_LABEL: Record<string, string> = {
  'greco-roman-myth': '그리스·로마 신화',
  'bible-ot': '구약',
  'bible-nt': '신약',
  history: '역사',
};

/** relations 어휘의 한국어 서술. */
export const REL_LABEL: Record<string, string> = {
  child_of: '~의 자식',
  parent_of: '~의 부모',
  sibling_of: '~의 형제자매',
  spouse_of: '~의 배우자',
  lover_of: '~의 연인',
  enemy_of: '~와 적대',
  companion_of: '~와 동행',
  kills: '~를 죽임',
  killed_by: '~에게 죽음',
  transforms_into: '~로 변함',
  appears_in: '~에 등장',
  precedes: '~보다 앞섬',
  follows: '~의 뒤를 이음',
  parallel_of: '~와 대응',
};

export const getTrace = (slug: string): Trace | undefined =>
  getGraph().traces.find((t) => t.slug === slug);

export const getSource = (slug: string): Source | undefined =>
  getGraph().sources.find((s) => s.slug === slug);

export const byId = (): Map<string, Trace | Source> => {
  const m = new Map<string, Trace | Source>();
  const g = getGraph();
  for (const t of g.traces) m.set(t.id, t);
  for (const s of g.sources) m.set(s.id, s);
  return m;
};

/** id 로 표시 이름과 링크 주소를 얻는다. 카드가 없으면 undefined. */
export function resolve(id: string): { name: string; href: string; type: 'trace' | 'source' } | undefined {
  const node = byId().get(id);
  if (!node) return undefined;
  const type = id.startsWith('trace:') ? 'trace' : 'source';
  return { name: node.name_ko, href: `/${type}/${node.slug}`, type };
}

/** 어떤 원천을 가리키는 흔적들. 빈도가 높은 것부터. */
export function tracesOf(sourceId: string): Trace[] {
  return getGraph()
    .traces.filter((t) => t.sources.includes(sourceId))
    .sort((a, b) => b.frequency - a.frequency || a.name_ko.localeCompare(b.name_ko));
}

/** 같은 원천을 공유하는 다른 흔적들. trace 카드의 마지막 섹션을 이것으로 채운다. */
export function siblingTraces(trace: Trace): Trace[] {
  const seen = new Set<string>();
  const out: Trace[] = [];
  for (const sid of trace.sources) {
    for (const t of tracesOf(sid)) {
      if (t.id === trace.id || seen.has(t.id)) continue;
      seen.add(t.id);
      out.push(t);
    }
  }
  return out;
}
