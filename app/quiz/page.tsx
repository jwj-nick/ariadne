import type { Metadata } from 'next';
import QuizRunner, { type NodeMeta } from '../components/QuizRunner';
import { emblemFor } from '../components/Emblem';
import { CATEGORY_LABEL, DOMAIN_LABEL, getGraph } from '../lib/graph';
import { getQuiz } from '../lib/quiz-data';

export const metadata: Metadata = {
  title: '퀴즈',
  description: '먼저 추측하고, 힌트를 받고, 답을 확인한 다음 카드로 넘어갑니다.',
};

export default function QuizPage() {
  const graph = getGraph();
  const quiz = getQuiz();

  const sourceById = new Map(graph.sources.map((s) => [s.id, s]));

  const traces: Record<string, NodeMeta> = {};
  for (const t of graph.traces) {
    // 처음 만나는 자리에 걸 그림. 자기 그림이 없으면 그 이야기의 것을 물려받는다 (D32).
    const s0 = sourceById.get(t.sources[0] ?? '');
    traces[t.id] = {
      name_ko: t.name_ko,
      name_en: t.name_en,
      slug: t.slug,
      why: t.why,
      kicker: CATEGORY_LABEL[t.category] ?? t.category,
      frequency: t.frequency,
      file: t.image?.file ?? s0?.image?.file,
    };
  }

  const sources: Record<string, NodeMeta> = {};
  for (const s of graph.sources) {
    sources[s.id] = {
      name_ko: s.name_ko,
      name_en: s.name_en,
      slug: s.slug,
      emblem: emblemFor(s.emblem, s.domain),
      kicker: DOMAIN_LABEL[s.domain] ?? s.domain,
      file: s.image?.file,
    };
  }

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
