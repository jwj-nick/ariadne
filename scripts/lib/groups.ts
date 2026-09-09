/**
 * 갈래 아래의 하위 묶음 (D31).
 *
 * 흔적 303장과 원천 179장을 갈래 하나에 몰아 놓으면 목록이 육십 장씩 이어져서
 * "여기에 무엇이 있나" 를 한눈에 볼 수가 없다. 그래서 갈래마다 네다섯 개의 묶음을 두고
 * 둘러보기 화면이 접었다 펼 수 있게 한다.
 *
 * 묶음의 기준은 학문적 분류가 아니라 **찾는 사람의 머릿속** 이다.
 * 브랜드를 산업 코드로 나누지 않고 "타는 것 · 쓰는 것 · 입는 것" 으로 나누는 이유가 그것이다.
 *
 * 카드는 frontmatter 의 `group` 으로 자기가 속한 묶음을 밝힌다.
 * 여기 없는 이름을 적으면 검사 W10 이 잡는다.
 */

export interface GroupDef {
  key: string;
  label: string;
}

/** 흔적 갈래별 묶음. 배열의 순서가 화면에 나오는 순서다. */
export const TRACE_GROUPS: Record<string, readonly GroupDef[]> = {
  brand: [
    { key: 'car', label: '타는 것' },
    { key: 'tech', label: '기술·전자' },
    { key: 'fashion', label: '입는 것·꾸미는 것' },
    { key: 'beauty', label: '화장품' },
    { key: 'food', label: '먹고 마시는 것' },
    { key: 'life', label: '살림과 쉼터' },
  ],
  'science-astro': [
    { key: 'planet', label: '행성과 위성' },
    { key: 'star', label: '별과 하늘' },
    { key: 'element', label: '원소와 입자' },
    { key: 'life', label: '생물과 몸' },
    { key: 'earth', label: '땅과 이론' },
  ],
  'psych-med': [
    { key: 'mind', label: '마음의 이름' },
    { key: 'body', label: '몸의 이름' },
    { key: 'drug', label: '약과 물질' },
    { key: 'doctor', label: '의료의 규범' },
  ],
  idiom: [
    { key: 'person', label: '사람됨을 말할 때' },
    { key: 'fate', label: '운명과 시련' },
    { key: 'contest', label: '다툼과 승부' },
    { key: 'desire', label: '욕심과 유혹' },
    { key: 'wisdom', label: '지혜와 풀이' },
  ],
  art: [
    { key: 'sculpture', label: '조각과 기념물' },
    { key: 'renaissance', label: '르네상스 회화' },
    { key: 'modern', label: '바로크 이후' },
  ],
  'lit-film': [
    { key: 'classic', label: '고전 문학' },
    { key: 'film', label: '영화' },
    { key: 'popular', label: '요즘 이야기' },
  ],
  'politics-law': [
    { key: 'power', label: '다스림' },
    { key: 'law', label: '법과 벌' },
    { key: 'people', label: '사람을 부르는 말' },
  ],
  codename: [
    { key: 'space', label: '우주 계획' },
    { key: 'rocket', label: '로켓' },
    { key: 'soft', label: '소프트웨어' },
  ],
  place: [
    { key: 'sea', label: '바다와 물길' },
    { key: 'land', label: '땅과 도시' },
  ],
  other: [{ key: 'misc', label: '그 밖' }],
};

/** 원천 도메인별 묶음. */
export const SOURCE_GROUPS: Record<string, readonly GroupDef[]> = {
  'greco-roman-myth': [
    { key: 'olympian', label: '올림포스의 신' },
    { key: 'primordial', label: '태초와 티탄' },
    { key: 'hero', label: '영웅과 사람' },
    { key: 'monster', label: '괴물과 짐승' },
    { key: 'nymph', label: '님프와 변신' },
    { key: 'realm', label: '신들의 자리와 물건' },
  ],
  history: [
    { key: 'greece', label: '그리스' },
    { key: 'rome', label: '로마' },
    { key: 'thinker', label: '생각한 사람' },
    { key: 'beyond', label: '그 밖의 자취' },
  ],
  'bible-ot': [
    { key: 'origin', label: '태초' },
    { key: 'exodus', label: '이집트와 율법' },
    { key: 'king', label: '왕과 영웅' },
    { key: 'wisdom', label: '지혜와 시' },
  ],
  'bible-nt': [
    { key: 'jesus', label: '예수의 자리' },
    { key: 'parable', label: '비유' },
    { key: 'end', label: '마지막 날' },
  ],
  literature: [
    { key: 'epic', label: '서사시' },
    { key: 'shakespeare', label: '셰익스피어' },
    { key: 'fable', label: '이야기와 풍자' },
  ],
};

/** 그 갈래(또는 도메인)에서 허용되는 묶음 열쇠인가. */
export function isValidGroup(kind: 'trace' | 'source', bucket: string, group: string): boolean {
  const table = kind === 'trace' ? TRACE_GROUPS : SOURCE_GROUPS;
  return (table[bucket] ?? []).some((g) => g.key === group);
}

/** 묶음의 사람이 읽는 이름. 없으면 열쇠를 그대로 돌려준다. */
export function groupLabel(kind: 'trace' | 'source', bucket: string, group: string): string {
  const table = kind === 'trace' ? TRACE_GROUPS : SOURCE_GROUPS;
  return (table[bucket] ?? []).find((g) => g.key === group)?.label ?? group;
}
