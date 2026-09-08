import type { Metadata } from 'next';
import CaptureRunner from '../components/CaptureRunner';
import type { MatchTarget } from '../lib/capture/match';
import { getGraph } from '../lib/graph';

export const metadata: Metadata = {
  title: '조우 캡처',
  description: '마주친 것을 던져 넣으면 아는 흔적을 알아보고 오늘 복습에 넣습니다.',
};

export default function CapturePage() {
  const g = getGraph();
  const targets: MatchTarget[] = [
    ...g.traces.map((t) => ({
      id: t.id,
      type: 'trace' as const,
      name_ko: t.name_ko,
      name_en: t.name_en,
      terms: [t.name_ko, t.name_en, ...t.domain_hint].map((s) => s.toLowerCase()),
    })),
    ...g.sources.map((s) => ({
      id: s.id,
      type: 'source' as const,
      name_ko: s.name_ko,
      name_en: s.name_en,
      terms: [s.name_ko, s.name_en, ...s.aliases].map((x) => x.toLowerCase()),
    })),
  ];

  return (
    <div>
      <h1 className="mb-4 text-[22px] font-semibold">조우 캡처</h1>
      <CaptureRunner targets={targets} />
    </div>
  );
}
