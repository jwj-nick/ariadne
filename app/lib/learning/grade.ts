/**
 * 푼 결과를 SM-2 의 품질 점수(0~5)로 옮긴다.
 *
 * 이 파일도 과목에 독립적이다. 힌트를 몇 번 봤는지와 스스로 어떻게 평가했는지만 안다.
 *
 * 힌트를 볼수록 점수를 깎는 이유는 생성 효과 때문이다.
 * 스스로 떠올려서 맞힌 것과 거의 답을 보고 맞힌 것을 같게 치면, 다음 복습이 너무 멀어진다.
 */
import type { Quality } from './sm2';

/** 답을 보고 스스로 매기는 평가. */
export type SelfRating = 'none' | 'close' | 'exact';

export const SELF_RATING_LABEL: Record<SelfRating, string> = {
  none: '전혀 떠오르지 않았다',
  close: '비슷하게 떠올렸다',
  exact: '정확히 알고 있었다',
};

const penalty = (hintsUsed: number): number => Math.min(Math.max(hintsUsed, 0), 2);

/** 자동 채점(입력 대조, 객관식). */
export function qualityFromAuto(correct: boolean, hintsUsed: number): Quality {
  if (!correct) return 1;
  return (5 - penalty(hintsUsed)) as Quality;
}

/** 자기평가. 답을 본 뒤 사용자가 고른다. */
export function qualityFromSelf(rating: SelfRating, hintsUsed: number): Quality {
  if (rating === 'none') return 1;
  if (rating === 'close') return 3;
  return (5 - penalty(hintsUsed)) as Quality;
}
