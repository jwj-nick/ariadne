/**
 * docs/02-SCHEMA.md 의 규칙을 코드로 옮긴 것.
 * 스키마 문서를 고치면 이 파일도 함께 고쳐야 한다. 반대 방향도 마찬가지다.
 */

/** trace 카테고리 (docs/02-SCHEMA.md trace.category) */
export const TRACE_CATEGORIES = [
  'brand',
  'science-astro',
  'psych-med',
  'art',
  'lit-film',
  'politics-law',
  'idiom',
  'codename',
  'place',
  'other',
] as const;
export type TraceCategory = (typeof TRACE_CATEGORIES)[number];

/**
 * source 도메인. D12에 따라 초기 4종만 허용한다.
 * 새 도메인은 해당 도메인의 첫 카드가 실제로 생길 때 이 배열과 docs/02-SCHEMA.md 에 함께 추가한다.
 */
export const SOURCE_DOMAINS = [
  'greco-roman-myth',
  'bible-ot',
  'bible-nt',
  'history',
  // 2026-09-08 추가. 단테·밀턴·셰익스피어처럼 그 자체가 원천이 된 작품들.
  // D12 에 따라 첫 카드가 생기는 시점에 열었다. 셰익스피어를 따로 두지 않고 여기에 합친다.
  'literature',
] as const;
export type SourceDomain = (typeof SOURCE_DOMAINS)[number];

/** source ↔ source 관계 어휘 (docs/02-SCHEMA.md 링크 규칙) */
export const RELATION_VOCAB = [
  'child_of',
  'parent_of',
  'sibling_of',
  'spouse_of',
  'lover_of',
  'enemy_of',
  'companion_of',
  'kills',
  'killed_by',
  'transforms_into',
  'appears_in',
  'precedes',
  'follows',
  'parallel_of',
] as const;
export type RelationRel = (typeof RELATION_VOCAB)[number];

/**
 * 원천 문양 이름 (D27).
 *
 * 그림은 `app/components/Emblem.tsx` 에 있다. 두 목록이 어긋나지 않도록
 * `tests/emblem.test.ts` 가 서로 같은지 확인한다.
 */
export const EMBLEM_NAMES = [
  'wing', 'bolt', 'jar', 'thread', 'rock', 'bow', 'lyre', 'laurel', 'helmet', 'horse',
  'ship', 'tower', 'goat', 'flame', 'scale', 'apple', 'crown', 'mask', 'column', 'wave',
  'moon', 'shoulders', 'sling', 'coin', 'hand', 'mirror', 'maze', 'star', 'bull', 'staff',
  'void', 'river', 'seed', 'lion', 'sword', 'shell', 'owl', 'dice', 'door', 'mountain',
  'serpent', 'grape', 'shield', 'scroll', 'ring', 'eye', 'tree', 'fish', 'cup', 'key',
  'anchor', 'arrow', 'feather', 'hourglass', 'torch', 'wheel', 'wolf', 'eagle', 'dove', 'bread',
  'chain', 'trident', 'harp', 'scythe', 'sun', 'spider',
] as const;
export type EmblemName = (typeof EMBLEM_NAMES)[number];

/** status 생애주기 (D15) */
export const STATUSES = ['candidate', 'reviewed', 'published', 'retired'] as const;
export type Status = (typeof STATUSES)[number];

/**
 * 앱에 노출되는 status.
 * D15: M3에서 웹 승인 UI가 완성되면 이 배열에서 'reviewed' 를 빼고 'published' 만 남긴다.
 */
export const VISIBLE_STATUSES: readonly Status[] = ['reviewed', 'published'];

/**
 * 본문 섹션 제목 (W02 검사 기준).
 * 마크다운 `## ` 수준의 제목이 이 순서대로 나와야 한다.
 * optional 로 표시된 섹션은 없어도 되지만, 있다면 순서를 지켜야 한다.
 */
export const TRACE_SECTIONS: ReadonlyArray<{ title: string; optional: boolean }> = [
  { title: '한 줄', optional: false },
  { title: '어디서 만나나', optional: false },
  { title: '왜 이 이름인가', optional: false },
  // 빌드가 채우는 섹션이라 카드 작성 시점에는 비어 있어도 된다.
  { title: '같은 원천의 다른 흔적', optional: true },
];

export const SOURCE_SECTIONS: ReadonlyArray<{ title: string; optional: boolean }> = [
  { title: '한 줄 정의', optional: false },
  { title: '3문장 스토리', optional: false },
  { title: '왜 알아야 하나', optional: false },
  { title: '연결', optional: false },
  { title: '한국 대응물', optional: true },
];

export interface TraceFrontmatter {
  id: string;
  type: 'trace';
  category: TraceCategory;
  /** 갈래 아래의 하위 묶음 (D31). 목록은 scripts/lib/groups.ts 에 있다. */
  group?: string;
  name_ko: string;
  name_en: string;
  sources: string[];
  why: string;
  frequency: number;
  domain_hint?: string[];
  status: Status;
  captured_by?: string;
  created?: string;
  confidence?: 'low' | 'medium' | 'high';
}

export interface SourceRelation {
  rel: string;
  target: string;
}

export interface SourceFrontmatter {
  id: string;
  type: 'source';
  domain: SourceDomain;
  /** 도메인 아래의 하위 묶음 (D31). 목록은 scripts/lib/groups.ts 에 있다. */
  group?: string;
  name_ko: string;
  name_en: string;
  aliases?: string[];
  relations?: SourceRelation[];
  level_kid: string;
  level_adult: string;
  korea_parallel?: string;
  /** 이 원천을 나타내는 선 그림. 없으면 도메인 기본 문양을 쓴다. */
  emblem?: EmblemName;
  /** 빌드가 채운다. 손으로 쓰면 E05. */
  traces?: string[];
  status: Status;
  created?: string;
}

export type AnyFrontmatter = TraceFrontmatter | SourceFrontmatter;
