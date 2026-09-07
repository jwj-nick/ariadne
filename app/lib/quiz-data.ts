/**
 * app/data/quiz.json 을 읽는다. graph.ts 와 같은 이유로 import 대신 파일을 직접 읽는다.
 * 이 파일은 빌드 산출물이라 git 에 없고, `npm run build:content` 가 만든다.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { QuizItemView } from '../components/QuizRunner';

export interface QuizData {
  meta: {
    generated_at: string;
    counts: { items: number; adult: number; kid: number; discarded: number };
  };
  items: QuizItemView[];
}

const EMPTY: QuizData = {
  meta: { generated_at: '', counts: { items: 0, adult: 0, kid: 0, discarded: 0 } },
  items: [],
};

let cached: QuizData | null = null;

export function getQuiz(): QuizData {
  if (cached) return cached;
  const path = join(process.cwd(), 'app', 'data', 'quiz.json');
  if (!existsSync(path)) {
    console.warn('[ariadne] app/data/quiz.json 이 없습니다. npm run build:content 를 먼저 실행하십시오.');
    cached = EMPTY;
    return cached;
  }
  cached = JSON.parse(readFileSync(path, 'utf8')) as QuizData;
  return cached;
}
