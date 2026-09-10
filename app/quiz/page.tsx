import type { Metadata } from 'next';
import QuizRunner, { type NodeMeta } from '../components/QuizRunner';
import { emblemFor } from '../components/Emblem';
import { getGraph } from '../lib/graph';
import { getQuiz } from '../lib/quiz-data';

export const metadata: Metadata = {
  title: '퀴즈',
  description: '먼저 추측하고, 힌트를 받고, 답을 확인한 다음 카드로 넘어갑니다.',
};

export default function QuizPage() {
  const graph = getGraph();
  const quiz = getQuiz();

  const traces: Record<string, NodeMeta> = {};
  for (const t of graph.traces) traces[t.id] = { name_ko: t.name_ko, slug: t.slug, why: t.why };
  const sources: Record<string, NodeMeta> = {};
  for (const s of graph.sources) sources[s.id] = { name_ko: s.name_ko, slug: s.slug, emblem: emblemFor(s.emblem, s.domain) };

  if (quiz.items.length === 0) {
    return (
      <div className="py-16 text-center" style={{ color: 'var(--muted)' }}>
        <p className="text-[15px]">퀴즈가 아직 빌드되지 않았습니다.</p>
        <p className="mt-2 text-[13px]">
          터미널에서 <code>npm run build:content</code> 를 실행한 뒤 새로 고치십시오.
        </p>
      </div>
    );
  }

  return (
    <QuizRunner items={quiz.items} traces={traces} sources={sources} totalTraces={graph.traces.length} />
  );
}
