/**
 * 요청서 만들기 (D28).
 *
 * 이 앱은 정적이라 카드를 스스로 만들지 못한다. 사용자가 더 알고 싶은 것을 담아 두면,
 * 그것을 개발 도구에 그대로 붙여 넣을 수 있는 글 한 장으로 뽑아 주는 것이 여기의 일이다.
 *
 * 화면 코드가 아니라 여기에 두는 이유는 두 가지다.
 * 하나는 글의 짜임을 테스트로 붙들어 두기 위해서이고,
 * 다른 하나는 나중에 승인 UI 가 생기면 같은 글을 다른 화면에서도 쓰기 위해서다.
 */
import { matchCapture, type MatchTarget } from '../capture/match';
import type { Wish } from '../store';

export interface SlipProgress {
  seen: number;
  settled: number;
  total: number;
}

export interface SlipInput {
  wishes: Wish[];
  /** 이미 있는 카드와 겹치는지 알려 주기 위한 목록. 비어 있어도 된다. */
  targets: MatchTarget[];
  progress?: SlipProgress;
  /** 최근에 자주 틀린 흔적 이름들. 카드를 보강할 곳을 알려 준다. */
  weak?: string[];
  /** 흔적 카테고리 어휘. 요청서에 그대로 실어 보낸다. */
  categories: string[];
  /** 원천 도메인 어휘. */
  domains: string[];
  /** 내보낸 날짜. `2026-09-09` 형식이다. */
  date: string;
  /** 리포가 놓인 자리. 화면에서 고칠 수 있게 밖에서 받는다. */
  repoPath?: string;
}

const ORIGIN_LABEL: Record<Wish['origin']['kind'], string> = {
  trace: '흔적 카드',
  source: '원천 카드',
  capture: '조우 캡처',
  free: '직접 적음',
};

/** 요청 하나에 관련되어 보이는 기존 카드를 찾는다. 같은 것을 두 번 만들지 않기 위한 것이다. */
function relatedIds(wish: Wish, targets: MatchTarget[]): string[] {
  const text = `${wish.text} ${wish.note}`.trim();
  const found = matchCapture(text, targets, 5).map((m) => m.id);
  // 카드에서 담은 것이면 그 카드 자신은 빼고 보여 준다. 이미 알고 있는 사실이다.
  return found.filter((id) => id !== wish.origin.id);
}

/**
 * 요청서 한 장을 만든다.
 *
 * 받는 쪽이 사람이 아니라 개발 도구라는 점을 전제로 썼다.
 * 무엇을 원하는지뿐 아니라 어디에 어떤 형식으로 쓰고 무엇으로 검사하는지까지 적어 준다.
 */
export function buildSlip(input: SlipInput): string {
  const { wishes, targets, progress, weak, categories, domains, date } = input;
  const repo = input.repoPath?.trim() || 'ariadne-app';
  const lines: string[] = [];

  lines.push('# Ariadne 카드 요청서');
  lines.push('');
  lines.push(
    `Ariadne 앱에서 ${date} 에 내보낸 것입니다. 아래 요청을 \`${repo}\` 리포에서 처리해 주십시오.`,
  );
  lines.push('');

  if (wishes.length === 0) {
    lines.push('## 요청');
    lines.push('');
    lines.push('담아 둔 것이 없습니다. 앱에서 더 알고 싶은 것을 먼저 담으십시오.');
    return lines.join('\n');
  }

  lines.push(`## 요청 ${wishes.length}건`);
  lines.push('');

  wishes.forEach((wish, i) => {
    lines.push(`### ${i + 1}. ${wish.text}`);
    lines.push('');
    const where = ORIGIN_LABEL[wish.origin.kind] ?? '어딘가';
    lines.push(
      wish.origin.id
        ? `- 담은 곳: ${where} \`${wish.origin.id}\`${wish.origin.label ? ` (${wish.origin.label})` : ''}`
        : `- 담은 곳: ${where}`,
    );
    if (wish.note.trim()) lines.push(`- 하고 싶은 말: ${wish.note.trim()}`);
    const related = relatedIds(wish, targets);
    if (related.length > 0) {
      lines.push(`- 이미 있는 카드 가운데 관련되어 보이는 것: ${related.map((r) => `\`${r}\``).join(', ')}`);
    }
    lines.push('');
  });

  lines.push('## 처리 방법');
  lines.push('');
  lines.push('1. 요청마다 흔적 카드를 `content/traces/<카테고리>/<slug>.md` 에 쓴다.');
  lines.push('   가리킬 원천이 아직 없으면 `content/sources/<도메인>/<slug>.md` 도 함께 쓴다.');
  lines.push('2. 카드 규격은 `docs/02-SCHEMA.md` 를 따른다.');
  lines.push('   흔적이 1차 키라는 원칙(`CLAUDE.md` 2절)을 지켜, 원천만 있는 카드를 만들지 않는다.');
  lines.push('3. 같은 것이 이미 있는지 `content/` 를 먼저 확인한다.');
  lines.push('4. `npm run check` 가 error 0 이어야 한다. 그 다음 `npm run verify` 를 돌린다.');
  lines.push('');
  lines.push(`흔적 카테고리 어휘: ${categories.map((c) => `\`${c}\``).join(', ')}`);
  lines.push('');
  lines.push(`원천 도메인 어휘: ${domains.map((d) => `\`${d}\``).join(', ')}`);
  lines.push('');

  if (progress || (weak && weak.length > 0)) {
    lines.push('## 참고');
    lines.push('');
    if (progress) {
      lines.push(
        `흔적 ${progress.total}개 가운데 ${progress.seen}개를 한 번 이상 보았고, ${progress.settled}개가 자리 잡았습니다.`,
      );
    }
    if (weak && weak.length > 0) {
      lines.push(`최근에 자주 틀린 것: ${weak.join(', ')}`);
      lines.push('이 카드들은 설명이 부족하거나 헷갈릴 수 있으니, 함께 손봐 주면 좋겠습니다.');
    }
    lines.push('');
  }

  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
}

/** 파일로 저장할 때 쓸 이름. */
export const slipFileName = (date: string): string => `ariadne-요청서-${date}.md`;
